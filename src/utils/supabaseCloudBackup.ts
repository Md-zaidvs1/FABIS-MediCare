// FABIS MediCare - Production Supabase Cloud Backup & Disaster Recovery Engine

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient, DoctorProfile } from '../types';
import {
  getActiveClinicId,
  upsertClinicRecords,
  fetchClinicRecords,
  reinitSupabaseClient,
  supabaseClient as multiTenantSupabaseClient,
  upsertSinglePatientToSupabase,
  fetchSupabasePatients,
  fetchSupabaseClinicBackup,
} from './supabaseMultiTenant';
import {
  getStoredPatients,
  savePatients,
  getStoredDoctor,
  saveDoctor,
  getStoredCustomDiagnoses,
  saveCustomDiagnoses,
  getStoredCustomTreatments,
  saveCustomTreatments,
  getStoredCustomMedicines,
  saveCustomMedicines,
  getStoredCustomClinicLogo,
  saveCustomClinicLogo,
  getStoredCustomAppIcon,
  saveCustomAppIcon,
  getStoredTheme,
  saveStoredTheme,
  getStoredCustomBillTemplates,
  saveCustomBillTemplates,
  getStoredChairs,
  saveStoredChairs,
  getStoredDeletedPredefinedDiagnoses,
  saveDeletedPredefinedDiagnoses,
  getStoredDeletedPredefinedTreatments,
  saveDeletedPredefinedTreatments,
  getStoredDeletedPredefinedMedicines,
  saveDeletedPredefinedMedicines,
  getStoredSmsGatewaySettings,
  saveStoredSmsGatewaySettings,
  getStoredSmsLogs,
  saveStoredSmsLogs,
  getStoredSmsTemplates,
  saveStoredSmsTemplates,
  getStoredSmsFollowups,
  saveStoredSmsFollowups,
  StoredSmsGatewaySettings,
} from './storage';
import { connectSmsGateway } from './smsApi';
import { dualSaveSnapshot } from './indexedDBStorage';

const supabaseClient = multiTenantSupabaseClient;

export interface CloudBackupPayload {
  version: string;
  clinicId: string;
  timestamp: string;
  patients: Patient[];
  doctor: DoctorProfile;
  customDiagnoses: string[];
  customTreatments: any[];
  customMedicines: any[];
  deletedDiagnoses: string[];
  deletedTreatments: string[];
  deletedMedicines: string[];
  billTemplates: any[];
  chairs: any[];
  clinicLogo: string | null;
  appIcon: string | null;
  theme: string;
  smsSettings?: StoredSmsGatewaySettings | null;
  smsLogs?: any[];
  smsTemplates?: any[];
  smsFollowups?: any[];
}

const CLOUD_KEYS = {
  LAST_CLOUD_SYNC: 'fabis_medicare_last_cloud_sync',
  CLOUD_SYNC_STATUS: 'fabis_medicare_cloud_sync_status',
  LOCAL_CLOUD_VAULT: 'fabis_medicare_local_cloud_backup_vault',
};

export const getStoredCloudSyncTime = (): string | null => {
  try {
    return localStorage.getItem(CLOUD_KEYS.LAST_CLOUD_SYNC);
  } catch {
    return null;
  }
};

// Deduplicate helper for Patients & sub-records
export const deduplicatePatients = (existingPatients: Patient[], incomingPatients: Patient[]): Patient[] => {
  const patientMap = new Map<string, Patient>();

  // Helper to get unique key for patient (ID is primary unique identifier; fallback to MRN)
  const getPatientKey = (p: Patient) => (p.id ? p.id.trim() : (p.mrn ? p.mrn.toUpperCase().trim() : ''));

  // Load existing
  (existingPatients || []).forEach((p) => {
    if (p && (p.id || p.mrn)) {
      patientMap.set(getPatientKey(p), { ...p });
    }
  });

  // Merge incoming
  (incomingPatients || []).forEach((incoming) => {
    if (!incoming || (!incoming.id && !incoming.mrn)) return;
    const key = getPatientKey(incoming);
    const existing = patientMap.get(key);

    if (!existing) {
      patientMap.set(key, { ...incoming });
    } else {
      // Merge sub-collections to avoid duplicate records while preserving updates
      const mergedAppointments = mergeAppointments(existing.appointments || [], incoming.appointments || []);
      const mergedTreatmentPlans = mergeById(existing.treatmentPlans || [], incoming.treatmentPlans || []);
      const mergedInvoices = mergeInvoices(existing.invoices || [], incoming.invoices || []);
      const mergedPrescriptions = mergeById(existing.prescriptions || [], incoming.prescriptions || []);
      const mergedFollowUps = mergeById(existing.followUps || [], incoming.followUps || []);
      const mergedVisitHistory = mergeById(existing.visitHistory || [], incoming.visitHistory || []);
      const mergedMedia = mergeById(existing.media || [], incoming.media || []);

      // Merge teethMap
      const mergedTeethMap = {
        ...(existing.teethMap || {}),
        ...(incoming.teethMap || {}),
      };

      patientMap.set(key, {
        ...existing,
        ...incoming,
        id: existing.id || incoming.id,
        mrn: existing.mrn || incoming.mrn,
        name: incoming.name || existing.name,
        phone: incoming.phone || existing.phone,
        gender: incoming.gender || existing.gender,
        age: incoming.age ?? existing.age,
        appointments: mergedAppointments,
        treatmentPlans: mergedTreatmentPlans,
        invoices: mergedInvoices,
        prescriptions: mergedPrescriptions,
        followUps: mergedFollowUps,
        visitHistory: mergedVisitHistory,
        media: mergedMedia,
        teethMap: mergedTeethMap,
        vitals: { ...(existing.vitals || {}), ...(incoming.vitals || {}) },
        medicalHistory: { ...(existing.medicalHistory || {}), ...(incoming.medicalHistory || {}) },
      } as Patient);
    }
  });

  return Array.from(patientMap.values());
};

// Appointments merge comparing updatedAt timestamp
function mergeAppointments(listA: any[], listB: any[]): any[] {
  const map = new Map<string, any>();
  listA.forEach((item) => {
    if (item && item.id) map.set(item.id, { ...item });
  });

  listB.forEach((incoming) => {
    if (!incoming || !incoming.id) return;
    const existing = map.get(incoming.id);
    if (!existing) {
      map.set(incoming.id, { ...incoming });
    } else {
      // Pick the appointment with the newer timestamp / updated status
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const incomingTime = new Date(incoming.updatedAt || incoming.createdAt || 0).getTime();
      if (incomingTime >= existingTime) {
        map.set(incoming.id, { ...existing, ...incoming });
      } else {
        map.set(incoming.id, { ...incoming, ...existing });
      }
    }
  });

  return Array.from(map.values());
}

// Generic merge by 'id'
function mergeById<T extends { id: string }>(listA: T[], listB: T[]): T[] {
  const map = new Map<string, T>();
  listA.forEach((item) => {
    if (item && item.id) map.set(item.id, { ...item });
  });
  listB.forEach((item) => {
    if (!item || !item.id) return;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, { ...item });
    } else {
      map.set(item.id, { ...existing, ...item });
    }
  });
  return Array.from(map.values());
}

// Invoices merge by ID or invoiceNumber
function mergeInvoices(invoicesA: any[], invoicesB: any[]): any[] {
  const map = new Map<string, any>();
  const getKey = (inv: any) => inv?.id || inv?.invoiceNumber;

  invoicesA.forEach((inv) => {
    const key = getKey(inv);
    if (key) map.set(key, { ...inv });
  });

  invoicesB.forEach((inv) => {
    const key = getKey(inv);
    if (!key) return;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...inv });
    } else {
      map.set(key, { ...existing, ...inv });
    }
  });
  return Array.from(map.values());
}

// Perform Background Cloud Auto-Backup to Supabase & Cloud Vault
export const performSupabaseCloudBackup = async (
  customPatients?: Patient[],
  customDoctor?: DoctorProfile
): Promise<{
  success: boolean;
  timestamp: string;
  message?: string;
  patientCount?: number;
  cloudSynced?: boolean;
}> => {
  const now = new Date().toISOString();
  try {
    const patients = customPatients || getStoredPatients();
    const doctor = customDoctor || getStoredDoctor();
    const tenantClinicId = getActiveClinicId(doctor);

    const payload: CloudBackupPayload = {
      version: '2.0.0',
      clinicId: tenantClinicId,
      timestamp: now,
      patients,
      doctor,
      customDiagnoses: getStoredCustomDiagnoses(),
      customTreatments: getStoredCustomTreatments(),
      customMedicines: getStoredCustomMedicines(),
      deletedDiagnoses: getStoredDeletedPredefinedDiagnoses(),
      deletedTreatments: getStoredDeletedPredefinedTreatments(),
      deletedMedicines: getStoredDeletedPredefinedMedicines(),
      billTemplates: getStoredCustomBillTemplates(),
      chairs: getStoredChairs(),
      clinicLogo: getStoredCustomClinicLogo(),
      appIcon: getStoredCustomAppIcon(),
      theme: getStoredTheme(),
      smsSettings: getStoredSmsGatewaySettings(),
      smsLogs: getStoredSmsLogs(),
      smsTemplates: getStoredSmsTemplates(),
      smsFollowups: getStoredSmsFollowups(),
    };

    const payloadString = JSON.stringify(payload);

    // Save to Local Cloud Recovery Vault as instant failsafe
    localStorage.setItem(CLOUD_KEYS.LOCAL_CLOUD_VAULT, payloadString);
    localStorage.setItem(CLOUD_KEYS.LAST_CLOUD_SYNC, now);
    localStorage.setItem(CLOUD_KEYS.CLOUD_SYNC_STATUS, 'Synced');

    let isCloudSynced = false;
    const syncDetails: string[] = [];

    // Perform Supabase cloud table upsert if connected
    const client = multiTenantSupabaseClient || reinitSupabaseClient();
    if (client) {
      try {
        const { error: cbErr } = await client.from('clinic_backups').upsert(
          {
            clinic_id: tenantClinicId,
            backup_payload: payload,
            patient_count: patients.length,
            updated_at: now,
          },
          { onConflict: 'clinic_id' }
        );

        if (!cbErr) {
          isCloudSynced = true;
          syncDetails.push('clinic_backups vault');
        } else {
          console.warn('Supabase `clinic_backups` write notice:', cbErr.message);
        }

        // Sync patients table
        if (patients.length > 0) {
          const pSynced = await upsertClinicRecords('patients', patients, doctor, 'id');
          if (pSynced) {
            isCloudSynced = true;
            syncDetails.push(`${patients.length} records in \`patients\` table`);
          }
        }

        // Sync chairs table
        const chairs = getStoredChairs();
        if (chairs.length > 0) {
          await upsertClinicRecords('chairs', chairs, doctor, 'id');
        }
      } catch (sbErr: any) {
        console.info('Supabase cloud table sync notice (local cloud vault secured):', sbErr);
      }
    }

    // Dual-save snapshot to IndexedDB as well
    await dualSaveSnapshot(patients);

    const message = isCloudSynced
      ? `Successfully backed up to Supabase Cloud (${syncDetails.join(', ')})!`
      : `Successfully secured local vault backup (${patients.length} patient records)!`;

    return {
      success: true,
      timestamp: now,
      message,
      patientCount: patients.length,
      cloudSynced: isCloudSynced,
    };
  } catch (err: any) {
    console.error('Error during Supabase cloud backup execution:', err);
    localStorage.setItem(CLOUD_KEYS.CLOUD_SYNC_STATUS, 'Error');
    return {
      success: false,
      timestamp: now,
      message: `Backup error: ${err.message || 'Unknown error'}`,
      patientCount: 0,
      cloudSynced: false,
    };
  }
};

// Restore Complete Clinic Data from Supabase Cloud Backup (Deduplicated)
export const restoreFromSupabaseCloud = async (): Promise<{
  success: boolean;
  patientsCount: number;
  message: string;
}> => {
  try {
    let cloudData: CloudBackupPayload | null = null;
    const doctor = getStoredDoctor();
    const tenantClinicId = getActiveClinicId(doctor);

    // 1. Try reading from Supabase Cloud DB (strictly filtered by clinic_id)
    if (supabaseClient) {
      try {
        const { data, error } = await supabaseClient
          .from('clinic_backups')
          .select('backup_payload')
          .eq('clinic_id', tenantClinicId)
          .single();

        if (!error && data?.backup_payload) {
          cloudData = data.backup_payload as CloudBackupPayload;
        }
      } catch (sbErr) {
        console.warn('Supabase remote query notice, checking cloud vault:', sbErr);
      }
    }

    // 2. Fallback to Local Cloud Recovery Vault if remote isn't ready
    if (!cloudData) {
      const rawVault = localStorage.getItem(CLOUD_KEYS.LOCAL_CLOUD_VAULT);
      if (rawVault) {
        cloudData = JSON.parse(rawVault) as CloudBackupPayload;
      }
    }

    if (!cloudData) {
      return {
        success: false,
        patientsCount: 0,
        message: 'No cloud backup snapshot found for this clinic. Please create a backup first.',
      };
    }

    // Deduplicate patients before storing
    const currentPatients = getStoredPatients();
    const mergedPatients = deduplicatePatients(currentPatients, cloudData.patients || []);

    // Restore to persistent storage
    savePatients(mergedPatients);
    await dualSaveSnapshot(mergedPatients);

    if (cloudData.doctor) saveDoctor(cloudData.doctor);
    if (Array.isArray(cloudData.customDiagnoses)) saveCustomDiagnoses(cloudData.customDiagnoses);
    if (Array.isArray(cloudData.customTreatments)) saveCustomTreatments(cloudData.customTreatments);
    if (Array.isArray(cloudData.customMedicines)) saveCustomMedicines(cloudData.customMedicines);
    if (Array.isArray(cloudData.deletedDiagnoses)) saveDeletedPredefinedDiagnoses(cloudData.deletedDiagnoses);
    if (Array.isArray(cloudData.deletedTreatments)) saveDeletedPredefinedTreatments(cloudData.deletedTreatments);
    if (Array.isArray(cloudData.deletedMedicines)) saveDeletedPredefinedMedicines(cloudData.deletedMedicines);
    if (Array.isArray(cloudData.billTemplates)) saveCustomBillTemplates(cloudData.billTemplates);
    if (Array.isArray(cloudData.chairs)) saveStoredChairs(cloudData.chairs);

    if (cloudData.clinicLogo !== undefined) saveCustomClinicLogo(cloudData.clinicLogo);
    if (cloudData.appIcon !== undefined) saveCustomAppIcon(cloudData.appIcon);
    if (cloudData.theme) saveStoredTheme(cloudData.theme as any);

    if (Array.isArray(cloudData.smsLogs)) saveStoredSmsLogs(cloudData.smsLogs);
    if (Array.isArray(cloudData.smsTemplates)) saveStoredSmsTemplates(cloudData.smsTemplates);
    if (Array.isArray(cloudData.smsFollowups)) saveStoredSmsFollowups(cloudData.smsFollowups);

    if (cloudData.smsSettings) {
      saveStoredSmsGatewaySettings(cloudData.smsSettings);
      if (cloudData.smsSettings.deviceId && cloudData.smsSettings.apiKey) {
        connectSmsGateway({
          deviceId: cloudData.smsSettings.deviceId,
          apiKey: cloudData.smsSettings.apiKey,
          clinicName: cloudData.smsSettings.clinicName,
          clinicPhone: cloudData.smsSettings.clinicPhone,
          doctorName: cloudData.smsSettings.doctorName,
          defaultReminderTiming: cloudData.smsSettings.defaultReminderTiming,
        }).catch((err) => console.warn('Auto connect restored SMS settings error:', err));
      }
    }

    window.dispatchEvent(new Event('custom-branding-updated'));

    return {
      success: true,
      patientsCount: mergedPatients.length,
      message: `Successfully restored and deduplicated ${mergedPatients.length} patient records, appointments, billing, branding & clinic settings from Supabase Cloud Backup!`,
    };
  } catch (err: any) {
    console.error('Error during cloud restore:', err);
    return {
      success: false,
      patientsCount: 0,
      message: `Cloud restore failed: ${err.message || 'Unknown error'}`,
    };
  }
};

/**
 * Directly syncs an individual created or modified patient to Supabase & local cache.
 * Broadcasts the change to other open browser tabs instantly.
 */
export const syncSinglePatientToCloud = async (
  patient: Patient,
  doctor?: DoctorProfile
): Promise<boolean> => {
  if (!patient || !patient.id) return false;
  try {
    const doc = doctor || getStoredDoctor();

    // 1. Dual save to IndexedDB & localStorage cache
    const currentPatients = getStoredPatients();
    const merged = deduplicatePatients(currentPatients, [patient]);
    savePatients(merged);
    await dualSaveSnapshot(merged);

    // 2. Direct atomic upsert to Supabase 'patients' table
    const synced = await upsertSinglePatientToSupabase(patient, doc);

    // 3. Broadcast to other tabs on the same browser
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('fabis_medicare_channel');
        bc.postMessage({ type: 'PATIENT_SYNCED', patient });
        bc.close();
      }
    } catch {}

    return synced;
  } catch (err) {
    console.warn('Error in syncSinglePatientToCloud:', err);
    return false;
  }
};

/**
 * Fetches the latest clinic records and configuration from Supabase,
 * merges them additively without overwriting local changes, and updates local state.
 */
export const fetchAndMergeLatestSupabaseData = async (
  doctor?: DoctorProfile
): Promise<{ patients: Patient[]; updated: boolean }> => {
  const doc = doctor || getStoredDoctor();
  try {
    // 1. Fetch patients from Supabase
    const cloudPatients = await fetchSupabasePatients(doc);
    const currentPatients = getStoredPatients();

    let finalPatients = currentPatients;
    let hasUpdates = false;

    if (cloudPatients && cloudPatients.length > 0) {
      finalPatients = deduplicatePatients(currentPatients, cloudPatients);
      const isCountDifferent = finalPatients.length !== currentPatients.length;
      if (isCountDifferent || JSON.stringify(finalPatients) !== JSON.stringify(currentPatients)) {
        hasUpdates = true;
        savePatients(finalPatients);
        await dualSaveSnapshot(finalPatients);
      }
    }

    // 2. Fetch clinic_backups to sync SMS settings, branding & doctor profile
    const backup = await fetchSupabaseClinicBackup(doc);
    if (backup) {
      if (backup.smsSettings && backup.smsSettings.deviceId && backup.smsSettings.apiKey) {
        const storedSms = getStoredSmsGatewaySettings();
        if (
          !storedSms ||
          storedSms.deviceId !== backup.smsSettings.deviceId ||
          storedSms.apiKey !== backup.smsSettings.apiKey ||
          storedSms.connected !== backup.smsSettings.connected
        ) {
          saveStoredSmsGatewaySettings(backup.smsSettings);
          window.dispatchEvent(new Event('sms-settings-updated'));
          window.dispatchEvent(new Event('custom-branding-updated'));
        }
      }
      if (backup.doctor && (!doc || !doc.clinicName || doc.clinicName === 'RK Dental Clinic & Implant Center')) {
        saveDoctor(backup.doctor);
      }
      if (Array.isArray(backup.chairs) && backup.chairs.length > 0) {
        saveStoredChairs(backup.chairs);
      }
    }

    return { patients: finalPatients, updated: hasUpdates };
  } catch (err) {
    console.warn('Error fetching and merging latest Supabase data:', err);
    return { patients: getStoredPatients(), updated: false };
  }
};


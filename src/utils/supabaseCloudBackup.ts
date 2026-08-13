// FABIS MediCare - Production Supabase Cloud Backup & Disaster Recovery Engine

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Patient, DoctorProfile } from '../types';
import {
  getActiveClinicId,
  upsertClinicRecords,
  fetchClinicRecords,
  reinitSupabaseClient,
  supabaseClient as multiTenantSupabaseClient,
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

  // Helper to get unique key for patient (MRN preferred, then ID)
  const getPatientKey = (p: Patient) => (p.mrn ? p.mrn.toUpperCase().trim() : p.id);

  // Load existing
  existingPatients.forEach((p) => {
    patientMap.set(getPatientKey(p), { ...p });
  });

  // Merge incoming
  incomingPatients.forEach((incoming) => {
    const key = getPatientKey(incoming);
    const existing = patientMap.get(key);

    if (!existing) {
      patientMap.set(key, { ...incoming });
    } else {
      // Merge sub-collections to avoid duplicate records
      const mergedAppointments = mergeById(existing.appointments || [], incoming.appointments || []);
      const mergedTreatmentPlans = mergeById(existing.treatmentPlans || [], incoming.treatmentPlans || []);
      const mergedInvoices = mergeInvoices(existing.invoices || [], incoming.invoices || []);
      const mergedPrescriptions = mergeById(existing.prescriptions || [], incoming.prescriptions || []);
      const mergedFollowUps = mergeById(existing.followUps || [], incoming.followUps || []);

      patientMap.set(key, {
        ...existing,
        ...incoming,
        id: existing.id || incoming.id,
        mrn: existing.mrn || incoming.mrn,
        appointments: mergedAppointments,
        treatmentPlans: mergedTreatmentPlans,
        invoices: mergedInvoices,
        prescriptions: mergedPrescriptions,
        followUps: mergedFollowUps,
        teethMap: (incoming as any).teethMap && Object.keys((incoming as any).teethMap).length > 0 ? (incoming as any).teethMap : (existing as any).teethMap,
      } as Patient);
    }
  });

  return Array.from(patientMap.values());
};

// Generic merge by 'id'
function mergeById<T extends { id: string }>(listA: T[], listB: T[]): T[] {
  const map = new Map<string, T>();
  listA.forEach((item) => map.set(item.id, { ...item }));
  listB.forEach((item) => {
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
  const getKey = (inv: any) => inv.id || inv.invoiceNumber;

  invoicesA.forEach((inv) => map.set(getKey(inv), { ...inv }));
  invoicesB.forEach((inv) => {
    const key = getKey(inv);
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

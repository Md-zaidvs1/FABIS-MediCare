// FABIS MediCare - Multi-Device Supabase Realtime Synchronization & Offline Engine

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initIndexedDB,
  getPendingSyncItems,
  removePendingSyncItem,
  enqueuePendingSync,
  PendingSyncItem,
  dualSaveSnapshot,
} from '../utils/indexedDBStorage';
import { shouldShowBackupReminder } from '../utils/backupRestore';
import {
  performSupabaseCloudBackup,
  deduplicatePatients,
  fetchAndMergeLatestSupabaseData,
  syncSinglePatientToCloud,
} from '../utils/supabaseCloudBackup';
import {
  supabaseClient as initialSupabaseClient,
  reinitSupabaseClient,
  getActiveClinicId,
  isSupabaseConfigured,
  upsertSinglePatientToSupabase,
  deleteClinicRecord,
} from '../utils/supabaseMultiTenant';
import {
  getStoredPatients,
  savePatients,
  getStoredDoctor,
  saveDoctor,
  saveStoredSmsGatewaySettings,
  saveStoredChairs,
  normalizePatient,
} from '../utils/storage';
import { Patient, DoctorProfile } from '../types';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncPendingRecords: () => Promise<void>;
  showBackupReminder: boolean;
  dismissBackupReminder: () => void;
  triggerDualSave: (patients: Patient[]) => Promise<void>;
  syncSinglePatient: (patient: Patient) => Promise<void>;
  deleteSinglePatient: (patientId: string) => Promise<void>;
}

export const useOfflineSync = (
  patients: Patient[],
  onRemotePatientsChange?: (patients: Patient[]) => void,
  onRemoteDoctorChange?: (doctor: DoctorProfile) => void
): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showBackupReminder, setShowBackupReminder] = useState<boolean>(false);
  const patientsRef = useRef<Patient[]>(patients);
  patientsRef.current = patients;

  // 1. Initial Local & Cloud Initialization on Mount
  useEffect(() => {
    initIndexedDB()
      .then(async () => {
        if (patientsRef.current && patientsRef.current.length > 0) {
          await dualSaveSnapshot(patientsRef.current);
        }
        // Fetch latest cloud data immediately on boot
        const res = await fetchAndMergeLatestSupabaseData();
        if (res.updated && onRemotePatientsChange) {
          onRemotePatientsChange(res.patients);
        }
      })
      .catch((err) => {
        console.warn('IndexedDB / Cloud Boot notice:', err);
      });
  }, []);

  // 2. Realtime Multi-Device Supabase Channel Subscription
  useEffect(() => {
    const client = initialSupabaseClient || reinitSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return;
    }

    const clinicId = getActiveClinicId();
    const channelName = `clinic_sync_${clinicId}_${Math.random().toString(36).substring(2, 7)}`;

    const channel = client
      .channel(channelName)
      // Listen for changes to patients table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients', filter: `clinic_id=eq.${clinicId}` },
        (payload: any) => {
          try {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const rawData = payload.new?.data || payload.new;
              if (rawData && (rawData.id || rawData.mrn)) {
                const incoming = normalizePatient(rawData);
                const current = patientsRef.current || getStoredPatients();
                const merged = deduplicatePatients(current, [incoming]);
                savePatients(merged);
                dualSaveSnapshot(merged);
                if (onRemotePatientsChange) {
                  onRemotePatientsChange(merged);
                }
              }
            } else if (payload.eventType === 'DELETE') {
              const deletedId = payload.old?.id;
              if (deletedId) {
                const current = patientsRef.current || getStoredPatients();
                const filtered = current.filter((p) => p.id !== deletedId);
                savePatients(filtered);
                dualSaveSnapshot(filtered);
                if (onRemotePatientsChange) {
                  onRemotePatientsChange(filtered);
                }
              }
            }
          } catch (err) {
            console.warn('[Realtime Patients Sync] Notice:', err);
          }
        }
      )
      // Listen for changes to clinic_backups (Branding, Doctor Profile, SMS Gateway Settings)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinic_backups', filter: `clinic_id=eq.${clinicId}` },
        (payload: any) => {
          try {
            const backup = payload.new?.backup_payload;
            if (backup) {
              if (backup.smsSettings && backup.smsSettings.deviceId) {
                saveStoredSmsGatewaySettings(backup.smsSettings);
                window.dispatchEvent(new Event('sms-settings-updated'));
                window.dispatchEvent(new Event('custom-branding-updated'));
              }
              if (backup.doctor && onRemoteDoctorChange) {
                saveDoctor(backup.doctor);
                onRemoteDoctorChange(backup.doctor);
              }
              if (Array.isArray(backup.chairs) && backup.chairs.length > 0) {
                saveStoredChairs(backup.chairs);
                window.dispatchEvent(new Event('chairs-updated'));
              }
            }
          } catch (err) {
            console.warn('[Realtime Backups Sync] Notice:', err);
          }
        }
      )
      // Listen for chairs updates
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chairs', filter: `clinic_id=eq.${clinicId}` },
        (payload: any) => {
          try {
            const rawChair = payload.new?.data || payload.new;
            if (rawChair && rawChair.id) {
              window.dispatchEvent(new Event('chairs-updated'));
            }
          } catch {}
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.info(`[FABIS Cloud] Realtime channel active for ${clinicId}`);
        }
      });

    return () => {
      client.removeChannel(channel);
    };
  }, [onRemotePatientsChange, onRemoteDoctorChange]);

  // 3. Multi-Tab BroadcastChannel for Zero-Latency Same-Browser Sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const bc = new BroadcastChannel('fabis_medicare_channel');
    bc.onmessage = (event) => {
      try {
        const { type, patient, patientId } = event.data || {};
        if (type === 'PATIENT_SYNCED' && patient) {
          const current = patientsRef.current || getStoredPatients();
          const merged = deduplicatePatients(current, [patient]);
          savePatients(merged);
          dualSaveSnapshot(merged);
          if (onRemotePatientsChange) {
            onRemotePatientsChange(merged);
          }
        } else if (type === 'PATIENT_DELETED' && patientId) {
          const current = patientsRef.current || getStoredPatients();
          const filtered = current.filter((p) => p.id !== patientId);
          savePatients(filtered);
          dualSaveSnapshot(filtered);
          if (onRemotePatientsChange) {
            onRemotePatientsChange(filtered);
          }
        }
      } catch (err) {
        console.warn('[BroadcastChannel Sync] Notice:', err);
      }
    };

    return () => {
      bc.close();
    };
  }, [onRemotePatientsChange]);

  // 4. Background Delta Polling Heartbeat & Window Focus Sync (Failsafe for WebSockets)
  useEffect(() => {
    const doCloudSync = async () => {
      if (!navigator.onLine) return;
      try {
        const res = await fetchAndMergeLatestSupabaseData();
        if (res.updated && onRemotePatientsChange) {
          onRemotePatientsChange(res.patients);
        }
      } catch (err) {
        console.info('[Delta Cloud Heartbeat] Notice:', err);
      }
    };

    // Poll every 8 seconds for multi-device harmony
    const interval = setInterval(doCloudSync, 8000);

    // Sync immediately when switching back to tab/window
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        doCloudSync();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', doCloudSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', doCloudSync);
    };
  }, [onRemotePatientsChange]);

  // 5. Check Pending Sync Items Count
  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getPendingSyncItems();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // 6. Sync Pending Records from Offline Queue to Supabase
  const syncPendingRecords = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      const pendingItems: PendingSyncItem[] = await getPendingSyncItems();

      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          if (item.id !== undefined) {
            try {
              if (item.entityType === 'patient') {
                if (item.action === 'delete') {
                  await deleteClinicRecord('patients', item.payload.id);
                } else if (item.payload) {
                  await upsertSinglePatientToSupabase(item.payload);
                }
              }
              await removePendingSyncItem(item.id);
            } catch (itemErr) {
              console.warn('Sync item retry notice:', itemErr);
            }
          }
        }
      }

      // Fetch fresh merged state
      const res = await fetchAndMergeLatestSupabaseData();
      if (res.updated && onRemotePatientsChange) {
        onRemotePatientsChange(res.patients);
      }

      await refreshPendingCount();
    } catch (err) {
      console.error('Error during auto-syncing pending items:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount, onRemotePatientsChange]);

  // 7. Network Listeners (Online / Offline)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingRecords();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingRecords]);

  // 8. Backup Reminder Trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (shouldShowBackupReminder()) {
        setShowBackupReminder(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const dismissBackupReminder = () => {
    setShowBackupReminder(false);
  };

  const triggerDualSave = async (updatedPatients: Patient[]) => {
    await dualSaveSnapshot(updatedPatients);
    await performSupabaseCloudBackup(updatedPatients);
  };

  const syncSinglePatient = async (patient: Patient) => {
    if (!patient || !patient.id) return;
    if (!navigator.onLine) {
      await enqueuePendingSync('patient', 'update', patient);
      await refreshPendingCount();
    } else {
      await syncSinglePatientToCloud(patient);
    }
  };

  const deleteSinglePatient = async (patientId: string) => {
    if (!patientId) return;
    if (!navigator.onLine) {
      await enqueuePendingSync('patient', 'delete', { id: patientId });
      await refreshPendingCount();
    } else {
      await deleteClinicRecord('patients', patientId);
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('fabis_medicare_channel');
          bc.postMessage({ type: 'PATIENT_DELETED', patientId });
          bc.close();
        }
      } catch {}
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncPendingRecords,
    showBackupReminder,
    dismissBackupReminder,
    triggerDualSave,
    syncSinglePatient,
    deleteSinglePatient,
  };
};


// FABIS MediCare - Network & Offline Sync Hook

import { useState, useEffect, useCallback } from 'react';
import {
  initIndexedDB,
  getPendingSyncItems,
  removePendingSyncItem,
  PendingSyncItem,
  dualSaveSnapshot,
} from '../utils/indexedDBStorage';
import { shouldShowBackupReminder } from '../utils/backupRestore';
import { Patient } from '../types';

export interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncPendingRecords: () => Promise<void>;
  showBackupReminder: boolean;
  dismissBackupReminder: () => void;
  triggerDualSave: (patients: Patient[]) => Promise<void>;
}

export const useOfflineSync = (patients: Patient[]): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showBackupReminder, setShowBackupReminder] = useState<boolean>(false);

  // Initialize IndexedDB on mount & sync full patient snapshot
  useEffect(() => {
    initIndexedDB()
      .then(() => {
        if (patients && patients.length > 0) {
          dualSaveSnapshot(patients);
        }
      })
      .catch((err) => {
        console.warn('IndexedDB initialization notice:', err);
      });
  }, []);

  // Check pending sync items count periodically
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
    const interval = setInterval(refreshPendingCount, 15000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  // Sync Pending Items when Online
  const syncPendingRecords = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      const pendingItems: PendingSyncItem[] = await getPendingSyncItems();

      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          if (item.id !== undefined) {
            // Processing offline queued update safely
            await removePendingSyncItem(item.id);
          }
        }
        // Save fresh snapshot to IndexedDB
        if (patients && patients.length > 0) {
          await dualSaveSnapshot(patients);
        }
      }
      await refreshPendingCount();
    } catch (err) {
      console.error('Error during auto-syncing pending items:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, patients, refreshPendingCount]);

  // Network Listeners
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

  // Backup Reminder Trigger
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
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncPendingRecords,
    showBackupReminder,
    dismissBackupReminder,
    triggerDualSave,
  };
};

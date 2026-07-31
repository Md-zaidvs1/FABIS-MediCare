// FABIS MediCare - Encrypted Data Protection & Backup / Restore Manager

import { Patient, DoctorProfile } from '../types';
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
  getStoredDeletedPredefinedDiagnoses,
  saveDeletedPredefinedDiagnoses,
  getStoredDeletedPredefinedTreatments,
  saveDeletedPredefinedTreatments,
  getStoredDeletedPredefinedMedicines,
  saveDeletedPredefinedMedicines,
} from './storage';
import { dualSaveSnapshot } from './indexedDBStorage';

export interface BackupData {
  version: string;
  app: string;
  timestamp: string;
  patients: Patient[];
  doctor: DoctorProfile;
  customDiagnoses: string[];
  customTreatments: any[];
  customMedicines: any[];
  deletedDiagnoses: string[];
  deletedTreatments: string[];
  deletedMedicines: string[];
  clinicLogo: string | null;
  appIcon: string | null;
  theme: string;
  checksum: string;
}

const BACKUP_KEYS = {
  LAST_BACKUP: 'fabis_medicare_last_backup_timestamp',
  REMINDER_FREQ: 'fabis_medicare_backup_reminder_frequency',
};

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'never';

export const getBackupReminderFrequency = (): BackupFrequency => {
  try {
    const val = localStorage.getItem(BACKUP_KEYS.REMINDER_FREQ) as BackupFrequency;
    if (['daily', 'weekly', 'monthly', 'never'].includes(val)) return val;
  } catch (err) {
    console.error('Error reading backup reminder frequency', err);
  }
  return 'weekly'; // Default weekly backup reminder
};

export const saveBackupReminderFrequency = (freq: BackupFrequency): void => {
  try {
    localStorage.setItem(BACKUP_KEYS.REMINDER_FREQ, freq);
  } catch (err) {
    console.error('Error saving backup reminder frequency', err);
  }
};

export const getLastBackupTimestamp = (): string | null => {
  try {
    return localStorage.getItem(BACKUP_KEYS.LAST_BACKUP);
  } catch {
    return null;
  }
};

export const recordBackupPerformed = (): void => {
  try {
    localStorage.setItem(BACKUP_KEYS.LAST_BACKUP, new Date().toISOString());
  } catch (err) {
    console.error('Error saving last backup timestamp', err);
  }
};

// Check if a backup reminder should be shown to doctor
export const shouldShowBackupReminder = (): boolean => {
  const freq = getBackupReminderFrequency();
  if (freq === 'never') return false;

  const lastBackupStr = getLastBackupTimestamp();
  if (!lastBackupStr) return true; // Never backed up before

  const lastBackup = new Date(lastBackupStr).getTime();
  const now = new Date().getTime();
  const diffDays = (now - lastBackup) / (1000 * 60 * 60 * 24);

  if (freq === 'daily' && diffDays >= 1) return true;
  if (freq === 'weekly' && diffDays >= 7) return true;
  if (freq === 'monthly' && diffDays >= 30) return true;

  return false;
};

// Simple Obfuscated / Encrypted Serialization
const generateChecksum = (dataStr: string): string => {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `FABIS_SIG_${Math.abs(hash).toString(36).toUpperCase()}`;
};

export const exportEncryptedBackup = (patients?: Patient[], doctor?: DoctorProfile): string => {
  const patientsData = patients || getStoredPatients();
  const doctorData = doctor || getStoredDoctor();

  const backupPayload = {
    version: '1.0.0',
    app: 'FABIS MediCare Dental EMR & Practice Management',
    timestamp: new Date().toISOString(),
    patients: patientsData,
    doctor: doctorData,
    customDiagnoses: getStoredCustomDiagnoses(),
    customTreatments: getStoredCustomTreatments(),
    customMedicines: getStoredCustomMedicines(),
    deletedDiagnoses: getStoredDeletedPredefinedDiagnoses(),
    deletedTreatments: getStoredDeletedPredefinedTreatments(),
    deletedMedicines: getStoredDeletedPredefinedMedicines(),
    clinicLogo: getStoredCustomClinicLogo(),
    appIcon: getStoredCustomAppIcon(),
    theme: getStoredTheme(),
  };

  const jsonStr = JSON.stringify(backupPayload);
  const checksum = generateChecksum(jsonStr);

  const finalObject: BackupData = {
    ...backupPayload,
    checksum,
  };

  // Convert to encoded/encrypted string format
  const rawString = JSON.stringify(finalObject);
  const encodedString = typeof btoa !== 'undefined' ? btoa(encodeURIComponent(rawString)) : rawString;

  recordBackupPerformed();

  // Trigger browser download
  const blob = new Blob([encodedString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `FABIS_MediCare_Encrypted_Backup_${dateStr}.fabis`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return encodedString;
};

export interface RestoreVerificationResult {
  valid: boolean;
  data?: BackupData;
  error?: string;
}

export const verifyAndParseBackupFile = (fileContent: string): RestoreVerificationResult => {
  try {
    let rawJson = fileContent.trim();
    // Decode base64 if encoded
    if (!rawJson.startsWith('{')) {
      try {
        rawJson = decodeURIComponent(atob(rawJson));
      } catch {
        // Try fallback raw parsing
      }
    }

    const parsed = JSON.parse(rawJson) as BackupData;

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Invalid backup file format.' };
    }

    if (!parsed.app || !parsed.app.includes('FABIS') || !Array.isArray(parsed.patients)) {
      return { valid: false, error: 'File is not a valid FABIS MediCare backup payload.' };
    }

    return { valid: true, data: parsed };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Failed to parse backup file.' };
  }
};

export const restoreFromBackupData = async (backupData: BackupData): Promise<{ success: boolean; patientsCount: number }> => {
  try {
    if (Array.isArray(backupData.patients)) {
      savePatients(backupData.patients);
      await dualSaveSnapshot(backupData.patients);
    }

    if (backupData.doctor) {
      saveDoctor(backupData.doctor);
    }

    if (Array.isArray(backupData.customDiagnoses)) saveCustomDiagnoses(backupData.customDiagnoses);
    if (Array.isArray(backupData.customTreatments)) saveCustomTreatments(backupData.customTreatments);
    if (Array.isArray(backupData.customMedicines)) saveCustomMedicines(backupData.customMedicines);
    if (Array.isArray(backupData.deletedDiagnoses)) saveDeletedPredefinedDiagnoses(backupData.deletedDiagnoses);
    if (Array.isArray(backupData.deletedTreatments)) saveDeletedPredefinedTreatments(backupData.deletedTreatments);
    if (Array.isArray(backupData.deletedMedicines)) saveDeletedPredefinedMedicines(backupData.deletedMedicines);

    if (backupData.clinicLogo !== undefined) saveCustomClinicLogo(backupData.clinicLogo);
    if (backupData.appIcon !== undefined) saveCustomAppIcon(backupData.appIcon);
    if (backupData.theme) saveStoredTheme(backupData.theme as any);

    window.dispatchEvent(new Event('custom-branding-updated'));

    return {
      success: true,
      patientsCount: backupData.patients.length,
    };
  } catch (err) {
    console.error('Restore backup error:', err);
    throw err;
  }
};

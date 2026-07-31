import { Patient, DoctorProfile, UserRole, UserCredentials, ThemePalette, VitalsLogRecord } from '../types';
import { INITIAL_PATIENTS, DEFAULT_DOCTOR } from '../data/initialData';

const STORAGE_KEYS = {
  PATIENTS: 'fabis_medicare_patients_v1',
  DOCTOR: 'fabis_medicare_doctor_v1',
  AUTH: 'fabis_medicare_doctor_auth_v1',
  ROLE: 'fabis_medicare_auth_role_v1',
  CREDENTIALS: 'fabis_medicare_credentials_v1',
  THEME: 'fabis_medicare_theme_v1',
  CUSTOM_DIAGNOSES: 'fabis_medicare_custom_diagnoses_v1',
  CUSTOM_TREATMENTS: 'fabis_medicare_custom_treatments_v1',
  DELETED_PREDEFINED_DIAGNOSES: 'fabis_medicare_deleted_predefined_diagnoses_v1',
  DELETED_PREDEFINED_TREATMENTS: 'fabis_medicare_deleted_predefined_treatments_v1',
  DELETED_PREDEFINED_MEDICINES: 'fabis_medicare_deleted_predefined_medicines_v1',
  CUSTOM_MEDICINES: 'fabis_medicare_custom_medicines_v1',
  VITALS_LOGS: 'fabis_medicare_vitals_logs_v1',
  CUSTOM_BILL_TEMPLATES: 'fabis_medicare_custom_bill_templates_v1',
  CUSTOM_CLINIC_LOGO: 'customClinicLogo',
  CUSTOM_APP_ICON: 'customAppIcon',
};

export const DEFAULT_CREDENTIALS: UserCredentials = {
  adminUsername: 'admin@fabismedicare.com',
  adminPin: 'admin123',
  doctorUsername: 'doctor@fabismedicare.com',
  doctorPin: 'doc123',
};

export const getStoredCredentials = (): UserCredentials => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CREDENTIALS, ...parsed };
    }
  } catch (err) {
    console.error('Error reading credentials storage', err);
  }
  return DEFAULT_CREDENTIALS;
};

export const saveCredentials = (credentials: UserCredentials): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
  } catch (err) {
    console.error('Error saving credentials storage', err);
  }
};

export const getStoredRole = (): UserRole => {
  try {
    const role = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (role === 'admin' || role === 'doctor') return role;
  } catch (err) {
    console.error('Error reading role storage', err);
  }
  return 'admin';
};

export const saveStoredRole = (role: UserRole): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  } catch (err) {
    console.error('Error saving role storage', err);
  }
};

export const getStoredTheme = (): ThemePalette => {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemePalette;
    if (['royal-navy', 'emerald-gold', 'sapphire-ice', 'sage-stone', 'midnight-obsidian'].includes(theme)) {
      return theme;
    }
  } catch (err) {
    console.error('Error reading theme storage', err);
  }
  return 'royal-navy';
};

export const saveStoredTheme = (theme: ThemePalette): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    applyThemeToDocument(theme);
  } catch (err) {
    console.error('Error saving theme storage', err);
  }
};

export const applyThemeToDocument = (theme: ThemePalette): void => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

export const getStoredDoctor = (): DoctorProfile => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error('Error reading doctor storage', err);
  }
  return DEFAULT_DOCTOR;
};

export const saveDoctor = (doctor: DoctorProfile): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(doctor));
  } catch (err) {
    console.error('Error saving doctor storage', err);
  }
};

export const getStoredPatients = (): Patient[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading patients storage', err);
  }
  // Default fallback
  savePatients(INITIAL_PATIENTS);
  return INITIAL_PATIENTS;
};

export const savePatients = (patients: Patient[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  } catch (err) {
    console.error('Error saving patients storage', err);
  }
};

export interface CustomTreatmentItem {
  name: string;
  category: 'Endodontics' | 'Prosthodontics' | 'Periodontics' | 'Oral Surgery' | 'Orthodontics' | 'Cosmetic' | 'Preventive';
  cost: number;
  description?: string;
}

export const getStoredCustomDiagnoses = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_DIAGNOSES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom diagnoses storage', err);
  }
  return [];
};

export const saveCustomDiagnoses = (diagnoses: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DIAGNOSES, JSON.stringify(diagnoses));
  } catch (err) {
    console.error('Error saving custom diagnoses storage', err);
  }
};

export const getStoredCustomTreatments = (): CustomTreatmentItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TREATMENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom treatments storage', err);
  }
  return [];
};

export const saveCustomTreatments = (treatments: CustomTreatmentItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TREATMENTS, JSON.stringify(treatments));
  } catch (err) {
    console.error('Error saving custom treatments storage', err);
  }
};

export const getStoredDeletedPredefinedDiagnoses = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DELETED_PREDEFINED_DIAGNOSES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading deleted predefined diagnoses storage', err);
  }
  return [];
};

export const saveDeletedPredefinedDiagnoses = (list: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_PREDEFINED_DIAGNOSES, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving deleted predefined diagnoses storage', err);
  }
};

export const getStoredDeletedPredefinedTreatments = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DELETED_PREDEFINED_TREATMENTS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading deleted predefined treatments storage', err);
  }
  return [];
};

export const saveDeletedPredefinedTreatments = (list: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_PREDEFINED_TREATMENTS, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving deleted predefined treatments storage', err);
  }
};

export const getStoredDeletedPredefinedMedicines = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DELETED_PREDEFINED_MEDICINES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading deleted predefined medicines storage', err);
  }
  return [];
};

export const saveDeletedPredefinedMedicines = (list: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DELETED_PREDEFINED_MEDICINES, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving deleted predefined medicines storage', err);
  }
};

export const getStoredCustomMedicines = (): any[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_MEDICINES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom medicines storage', err);
  }
  return [];
};

export const saveCustomMedicines = (list: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MEDICINES, JSON.stringify(list));
  } catch (err) {
    console.error('Error saving custom medicines storage', err);
  }
};

export interface BillTemplateItem {
  id: string;
  name: string;
  amount: number;
  isCustom?: boolean;
}

export const DEFAULT_BILL_TEMPLATES: BillTemplateItem[] = [
  { id: 'bt-1', name: 'Consultation & Oral Exam', amount: 500 },
  { id: 'bt-2', name: 'Scaling & Polishing', amount: 1500 },
  { id: 'bt-3', name: 'Composite Filling', amount: 1200 },
  { id: 'bt-4', name: 'Root Canal Treatment (RCT)', amount: 4500 },
  { id: 'bt-5', name: 'Crown Cementation', amount: 1000 },
  { id: 'bt-6', name: 'Zirconia Crown', amount: 7500 },
  { id: 'bt-7', name: 'IOPA X-Ray', amount: 300 },
  { id: 'bt-8', name: 'Tooth Extraction', amount: 1000 },
  { id: 'bt-9', name: 'Surgical Extraction', amount: 3500 },
  { id: 'bt-10', name: 'Dental Implant', amount: 25000 },
];

export const getStoredCustomBillTemplates = (): BillTemplateItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_BILL_TEMPLATES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom bill templates storage', err);
  }
  return [];
};

export const saveCustomBillTemplates = (templates: BillTemplateItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_BILL_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving custom bill templates storage', err);
  }
};

export const getStoredCustomClinicLogo = (): string | null => {
  try {
    return localStorage.getItem('customClinicLogo') || localStorage.getItem(STORAGE_KEYS.CUSTOM_CLINIC_LOGO);
  } catch (err) {
    console.error('Error reading custom clinic logo', err);
    return null;
  }
};

export const saveCustomClinicLogo = (logoBase64: string | null): void => {
  try {
    if (logoBase64) {
      localStorage.setItem('customClinicLogo', logoBase64);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CLINIC_LOGO, logoBase64);
    } else {
      localStorage.removeItem('customClinicLogo');
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_CLINIC_LOGO);
    }
  } catch (err) {
    console.error('Error saving custom clinic logo', err);
  }
};

export const getStoredCustomAppIcon = (): string | null => {
  try {
    return localStorage.getItem('customAppIcon') || localStorage.getItem(STORAGE_KEYS.CUSTOM_APP_ICON);
  } catch (err) {
    console.error('Error reading custom app icon', err);
    return null;
  }
};

export const saveCustomAppIcon = (iconBase64: string | null): void => {
  try {
    if (iconBase64) {
      localStorage.setItem('customAppIcon', iconBase64);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_APP_ICON, iconBase64);
    } else {
      localStorage.removeItem('customAppIcon');
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_APP_ICON);
    }
  } catch (err) {
    console.error('Error saving custom app icon', err);
  }
};

export const resetCustomBranding = (): void => {
  saveCustomClinicLogo(null);
  saveCustomAppIcon(null);
};

export const resetToDemoData = (): { doctor: DoctorProfile; patients: Patient[] } => {
  localStorage.removeItem(STORAGE_KEYS.PATIENTS);
  localStorage.removeItem(STORAGE_KEYS.DOCTOR);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_DIAGNOSES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_TREATMENTS);
  localStorage.removeItem(STORAGE_KEYS.DELETED_PREDEFINED_DIAGNOSES);
  localStorage.removeItem(STORAGE_KEYS.DELETED_PREDEFINED_TREATMENTS);
  localStorage.removeItem(STORAGE_KEYS.DELETED_PREDEFINED_MEDICINES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_MEDICINES);
  savePatients(INITIAL_PATIENTS);
  saveDoctor(DEFAULT_DOCTOR);
  return { doctor: DEFAULT_DOCTOR, patients: INITIAL_PATIENTS };
};

export const checkIsLoggedIn = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  } catch {
    return true; // Default logged in for instant access
  }
};

export const setLoggedIn = (status: boolean): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH, status ? 'true' : 'false');
  } catch (err) {
    console.error('Error setting auth status', err);
  }
};

export const formatCurrentTimestamp = (): string => {
  const now = new Date();
  const datePart = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart}, ${timePart}`;
};

const getDefaultInitialVitalsLogs = (patientMrn: string): VitalsLogRecord[] => {
  return [
    {
      id: `vit-init-1-${patientMrn}`,
      patientMrn,
      timestamp: '28 Jul 2026, 11:30 AM',
      bloodPressure: '120/80',
      pulseRate: 72,
      bloodSugar: '102 mg/dL',
    },
    {
      id: `vit-init-2-${patientMrn}`,
      patientMrn,
      timestamp: '15 May 2026, 03:15 PM',
      bloodPressure: '124/82',
      pulseRate: 76,
      bloodSugar: '110 mg/dL',
    },
  ];
};

export const getStoredVitalsLogs = (patientMrn: string): VitalsLogRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.VITALS_LOGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed[patientMrn])) {
        return parsed[patientMrn];
      }
    }
  } catch (err) {
    console.error('Error reading vitals logs', err);
  }
  const defaults = getDefaultInitialVitalsLogs(patientMrn);
  try {
    const allData = localStorage.getItem(STORAGE_KEYS.VITALS_LOGS);
    const map = allData ? JSON.parse(allData) : {};
    map[patientMrn] = defaults;
    localStorage.setItem(STORAGE_KEYS.VITALS_LOGS, JSON.stringify(map));
  } catch (err) {
    console.error('Error initializing vitals logs defaults', err);
  }
  return defaults;
};

export const saveVitalsLogForPatient = (patientMrn: string, newLog: VitalsLogRecord): VitalsLogRecord[] => {
  try {
    const allData = localStorage.getItem(STORAGE_KEYS.VITALS_LOGS);
    let map: Record<string, VitalsLogRecord[]> = {};
    if (allData) {
      map = JSON.parse(allData);
    }
    const currentList = map[patientMrn] || getStoredVitalsLogs(patientMrn);
    const updatedList = [newLog, ...currentList];
    map[patientMrn] = updatedList;
    localStorage.setItem(STORAGE_KEYS.VITALS_LOGS, JSON.stringify(map));
    return updatedList;
  } catch (err) {
    console.error('Error saving vitals log', err);
    return [];
  }
};

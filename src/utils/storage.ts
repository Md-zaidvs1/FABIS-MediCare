import { Patient, DoctorProfile, UserRole, UserCredentials, ThemePalette, VitalsLogRecord, ChairStatus, DashboardPersonalizationSettings } from '../types';
import { INITIAL_PATIENTS, DEFAULT_DOCTOR, INITIAL_CHAIR_STATUSES } from '../data/initialData';
import { formatTodayISO, normalizeTimeSlot } from './formatters';

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
  CUSTOM_DOCTOR_SIGNATURE: 'customDoctorSignature',
  CUSTOM_CLINIC_STAMP: 'customClinicStamp',
  CHAIRS: 'fabis_medicare_chairs_v1',
  DASHBOARD_SETTINGS: 'fabis_medicare_dashboard_settings_v1',
  SMS_SETTINGS: 'fabis_medicare_sms_gateway_v1',
  SMS_LOGS: 'fabis_medicare_sms_logs_v1',
  SMS_TEMPLATES: 'fabis_medicare_sms_templates_v1',
  SMS_FOLLOWUPS: 'fabis_medicare_sms_followups_v1',
  CUSTOM_MEDICAL_CONDITIONS: 'fabis_medicare_custom_medical_conditions_v1',
  CUSTOM_EXAM_FINDINGS: 'fabis_medicare_custom_exam_findings_v1',
  CUSTOM_RECESSION_TAGS: 'fabis_medicare_custom_recession_tags_v1',
  CUSTOM_PERIODONTAL_FINDINGS: 'fabis_medicare_custom_periodontal_findings_v1',
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardPersonalizationSettings = {
  welcomeTitle: 'Welcome back',
  welcomeMessage: 'Here is your clinical overview for today. Monitor active operatories, patient queues, and daily targets.',
  motivationalQuote: 'Every smile you restore brings confidence, healing, and wellness to your community.',
  clinicNameOverride: '',
  showActiveChairs: true,
  showTodayAppointments: true,
  showWaitingPatients: true,
  showTodayRevenue: true,
  backgroundType: 'gradient',
  backgroundColor: '#0f172a',
  backgroundGradient: 'from-slate-900 via-indigo-950 to-slate-900',
  backgroundImageUrl: '',
  cardIcon: 'Sparkles',
};

export const getStoredDashboardSettings = (): DashboardPersonalizationSettings => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DASHBOARD_SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_DASHBOARD_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Error reading dashboard settings storage', err);
  }
  return DEFAULT_DASHBOARD_SETTINGS;
};

export const saveStoredDashboardSettings = (settings: DashboardPersonalizationSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new Event('dashboard-settings-updated'));
  } catch (err) {
    console.error('Error saving dashboard settings storage', err);
  }
};

export const resetDashboardSettings = (): DashboardPersonalizationSettings => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DASHBOARD_SETTINGS);
    window.dispatchEvent(new Event('dashboard-settings-updated'));
  } catch (err) {
    console.error('Error resetting dashboard settings storage', err);
  }
  return DEFAULT_DASHBOARD_SETTINGS;
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
    if ([
      'lavender-dream',
      'sage-harmony',
      'ocean-breeze',
      'sunset-glow',
      'blush-elegance',
      'teal-serenity',
      'amber-luxe',
      'indigo-night',
      'coral-crush',
      'mocha-minimal',
      'emerald-green',
      'ocean-blue',
      'royal-purple',
      'deep-wine',
      'slate-dark',
      'rose-gold',
      'midnight-blue',
      'sunset-orange',
      'royal-navy',
      'emerald-gold',
      'sapphire-ice',
      'sage-stone',
      'midnight-obsidian'
    ].includes(theme)) {
      return theme;
    }
  } catch (err) {
    console.error('Error reading theme storage', err);
  }
  return 'lavender-dream';
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
    const customLogo = getStoredCustomClinicLogo();
    const customSignature = getStoredCustomDoctorSignature();
    const customStamp = getStoredCustomClinicStamp();
    if (data) {
      const parsed = JSON.parse(data);
      if (customLogo) parsed.logoUrl = customLogo;
      if (customSignature) parsed.signatureUrl = customSignature;
      if (customStamp) parsed.stampUrl = customStamp;
      return parsed;
    }
  } catch (err) {
    console.error('Error reading doctor storage', err);
  }
  const customLogo = getStoredCustomClinicLogo();
  const customSignature = getStoredCustomDoctorSignature();
  const customStamp = getStoredCustomClinicStamp();
  return {
    ...DEFAULT_DOCTOR,
    logoUrl: customLogo || undefined,
    signatureUrl: customSignature || undefined,
    stampUrl: customStamp || undefined,
  };
};

export const saveDoctor = (doctor: DoctorProfile): void => {
  try {
    const customLogo = doctor.logoUrl || getStoredCustomClinicLogo();
    const customSignature = doctor.signatureUrl || getStoredCustomDoctorSignature();
    const customStamp = doctor.stampUrl || getStoredCustomClinicStamp();
    const updatedDoctor = {
      ...doctor,
      logoUrl: customLogo || undefined,
      signatureUrl: customSignature || undefined,
      stampUrl: customStamp || undefined,
    };
    localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(updatedDoctor));
    if (doctor.logoUrl) {
      saveCustomClinicLogo(doctor.logoUrl);
    }
    if (doctor.signatureUrl) {
      saveCustomDoctorSignature(doctor.signatureUrl);
    }
    if (doctor.stampUrl) {
      saveCustomClinicStamp(doctor.stampUrl);
    }
    window.dispatchEvent(new Event('doctor-profile-updated'));
  } catch (err) {
    console.error('Error saving doctor storage', err);
  }
};

export const normalizePatient = (p: any): Patient => {
  if (!p || typeof p !== 'object') return p;
  const raw = p.data && typeof p.data === 'object' ? { ...p.data, ...p } : p;
  const rawAppointments = Array.isArray(raw.appointments)
    ? raw.appointments
    : Array.isArray(p.data?.appointments)
    ? p.data.appointments
    : [];

  const normalizedAppointments = rawAppointments.map((apt: any) => {
    if (!apt || typeof apt !== 'object') return apt;
    return {
      ...apt,
      timeSlot: normalizeTimeSlot(apt.timeSlot),
    };
  });

  return {
    ...raw,
    name: raw.name || '',
    phone: raw.phone || '',
    mrn: raw.mrn || raw.id || '',
    appointments: normalizedAppointments,
    prescriptions: Array.isArray(raw.prescriptions) ? raw.prescriptions : (Array.isArray(p.data?.prescriptions) ? p.data.prescriptions : []),
    invoices: Array.isArray(raw.invoices) ? raw.invoices : (Array.isArray(p.data?.invoices) ? p.data.invoices : []),
    treatmentPlans: Array.isArray(raw.treatmentPlans) ? raw.treatmentPlans : (Array.isArray(p.data?.treatmentPlans) ? p.data.treatmentPlans : []),
    followUps: Array.isArray(raw.followUps) ? raw.followUps : (Array.isArray(p.data?.followUps) ? p.data.followUps : []),
    visitHistory: Array.isArray(raw.visitHistory) ? raw.visitHistory : (Array.isArray(p.data?.visitHistory) ? p.data.visitHistory : []),
    media: Array.isArray(raw.media) ? raw.media : (Array.isArray(p.data?.media) ? p.data.media : []),
    teethMap: raw.teethMap && typeof raw.teethMap === 'object' ? raw.teethMap : (p.data?.teethMap && typeof p.data?.teethMap === 'object' ? p.data.teethMap : {}),
  };
};

export const getStoredPatients = (): Patient[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizePatient);
      }
    }
  } catch (err) {
    console.error('Error reading patients storage', err);
  }
  return [];
};

export const savePatients = (patients: Patient[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    window.dispatchEvent(new Event('patients-updated'));
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

export const DEFAULT_MEDICAL_CONDITIONS = ['Diabetes', 'Blood Pressure / Hypertension'];

export const getStoredCustomMedicalConditions = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_MEDICAL_CONDITIONS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom medical conditions storage', err);
  }
  return DEFAULT_MEDICAL_CONDITIONS;
};

export const saveCustomMedicalConditions = (conditions: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MEDICAL_CONDITIONS, JSON.stringify(conditions));
  } catch (err) {
    console.error('Error saving custom medical conditions storage', err);
  }
};

export const DEFAULT_CLINICAL_EXAM_FINDINGS = ['Decay', 'Filling', 'Missing'];

export const getStoredCustomExamFindings = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAM_FINDINGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom exam findings storage', err);
  }
  return DEFAULT_CLINICAL_EXAM_FINDINGS;
};

export const saveCustomExamFindings = (findings: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_EXAM_FINDINGS, JSON.stringify(findings));
  } catch (err) {
    console.error('Error saving custom exam findings storage', err);
  }
};

export const DEFAULT_RECESSION_TAGS = [
  'Miller Class I',
  'Generalized',
  'Mandibular Anterior',
  'Buccal Aspect',
];

export const getStoredCustomRecessionTags = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_RECESSION_TAGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom recession tags storage', err);
  }
  return DEFAULT_RECESSION_TAGS;
};

export const saveCustomRecessionTags = (tags: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_RECESSION_TAGS, JSON.stringify(tags));
  } catch (err) {
    console.error('Error saving custom recession tags storage', err);
  }
};

export const DEFAULT_PERIODONTAL_FINDINGS: string[] = [];

export const getStoredCustomPeriodontalFindings = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_PERIODONTAL_FINDINGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading custom periodontal findings storage', err);
  }
  return DEFAULT_PERIODONTAL_FINDINGS;
};

export const saveCustomPeriodontalFindings = (findings: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PERIODONTAL_FINDINGS, JSON.stringify(findings));
  } catch (err) {
    console.error('Error saving custom periodontal findings storage', err);
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
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.logoUrl = logoBase64;
        localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(parsed));
      }
    } else {
      localStorage.removeItem('customClinicLogo');
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_CLINIC_LOGO);
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      if (data) {
        const parsed = JSON.parse(data);
        delete parsed.logoUrl;
        localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(parsed));
      }
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

export const getStoredCustomDoctorSignature = (): string | null => {
  try {
    return localStorage.getItem('customDoctorSignature') || localStorage.getItem(STORAGE_KEYS.CUSTOM_DOCTOR_SIGNATURE);
  } catch (err) {
    console.error('Error reading custom doctor signature', err);
    return null;
  }
};

export const saveCustomDoctorSignature = (sigBase64: string | null): void => {
  try {
    if (sigBase64) {
      localStorage.setItem('customDoctorSignature', sigBase64);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_DOCTOR_SIGNATURE, sigBase64);
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.signatureUrl = sigBase64;
        localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(parsed));
      }
    } else {
      localStorage.removeItem('customDoctorSignature');
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_DOCTOR_SIGNATURE);
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      if (data) {
        const parsed = JSON.parse(data);
        delete parsed.signatureUrl;
        localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(parsed));
      }
    }
    window.dispatchEvent(new Event('custom-branding-updated'));
  } catch (err) {
    console.error('Error saving custom doctor signature', err);
  }
};

export const getStoredCustomClinicStamp = (): string | null => {
  try {
    return localStorage.getItem('customClinicStamp') || localStorage.getItem(STORAGE_KEYS.CUSTOM_CLINIC_STAMP);
  } catch (err) {
    console.error('Error reading custom clinic stamp', err);
    return null;
  }
};

export const saveCustomClinicStamp = (stampBase64: string | null): void => {
  try {
    if (stampBase64) {
      localStorage.setItem('customClinicStamp', stampBase64);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CLINIC_STAMP, stampBase64);
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      if (data) {
        const parsed = JSON.parse(data);
        parsed.stampUrl = stampBase64;
        localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(parsed));
      }
    } else {
      localStorage.removeItem('customClinicStamp');
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_CLINIC_STAMP);
      const data = localStorage.getItem(STORAGE_KEYS.DOCTOR);
      if (data) {
        const parsed = JSON.parse(data);
        delete parsed.stampUrl;
        localStorage.setItem(STORAGE_KEYS.DOCTOR, JSON.stringify(parsed));
      }
    }
    window.dispatchEvent(new Event('custom-branding-updated'));
  } catch (err) {
    console.error('Error saving custom clinic stamp', err);
  }
};

export const deletePatientPermanently = async (patientId: string): Promise<boolean> => {
  try {
    const currentPatients = getStoredPatients();
    const target = currentPatients.find(p => p.id === patientId || p.mrn === patientId);
    if (!target) return false;

    const remaining = currentPatients.filter(p => p.id !== target.id && p.mrn !== target.mrn);
    savePatients(remaining);

    // Delete from Supabase multi-tenant database table
    try {
      const { deleteClinicRecord } = await import('./supabaseMultiTenant');
      await deleteClinicRecord('patients', target.id);
    } catch (sbErr) {
      console.warn('Supabase deleteClinicRecord note:', sbErr);
    }

    // Sync cloud backup snapshot
    try {
      const { performSupabaseCloudBackup } = await import('./supabaseCloudBackup');
      await performSupabaseCloudBackup();
    } catch (cbErr) {
      console.warn('Cloud backup sync note after deletion:', cbErr);
    }

    // Dual save in IndexedDB
    try {
      const { dualSaveSnapshot } = await import('./indexedDBStorage');
      await dualSaveSnapshot(remaining);
    } catch (idbErr) {
      console.warn('IndexedDB snapshot update note:', idbErr);
    }

    window.dispatchEvent(new Event('patients-updated'));
    return true;
  } catch (err) {
    console.error('Error deleting patient permanently:', err);
    return false;
  }
};

export const resetCustomBranding = (): void => {
  saveCustomClinicLogo(null);
  saveCustomAppIcon(null);
  saveCustomDoctorSignature(null);
  saveCustomClinicStamp(null);
};

export const resetToDemoData = (): { doctor: DoctorProfile; patients: Patient[] } => {
  const preservedLogo = getStoredCustomClinicLogo();
  const preservedIcon = getStoredCustomAppIcon();

  // 1. Create emergency pre-reset snapshot for data protection safety
  try {
    const currentPatients = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (currentPatients) {
      localStorage.setItem('fabis_emergency_pre_reset_backup', currentPatients);
    }
  } catch {}

  localStorage.removeItem(STORAGE_KEYS.PATIENTS);
  localStorage.removeItem(STORAGE_KEYS.DOCTOR);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_DIAGNOSES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_TREATMENTS);
  localStorage.removeItem(STORAGE_KEYS.DELETED_PREDEFINED_DIAGNOSES);
  localStorage.removeItem(STORAGE_KEYS.DELETED_PREDEFINED_TREATMENTS);
  localStorage.removeItem(STORAGE_KEYS.DELETED_PREDEFINED_MEDICINES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_MEDICINES);
  localStorage.removeItem(STORAGE_KEYS.CHAIRS);
  localStorage.removeItem(STORAGE_KEYS.VITALS_LOGS);
  try {
    localStorage.setItem('fabis_last_rk_sequence', '890');
  } catch {}

  savePatients(INITIAL_PATIENTS);

  if (preservedLogo) saveCustomClinicLogo(preservedLogo);
  if (preservedIcon) saveCustomAppIcon(preservedIcon);

  const resetDoctor = {
    ...DEFAULT_DOCTOR,
    logoUrl: preservedLogo || undefined,
  };
  saveDoctor(resetDoctor);

  return { doctor: resetDoctor, patients: INITIAL_PATIENTS };
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
  return [];
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

export const getStoredChairs = (): ChairStatus[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHAIRS);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading chairs storage', err);
  }
  // Database has no chair records (or first installation): create and persist default chairs
  saveStoredChairs(INITIAL_CHAIR_STATUSES);
  return INITIAL_CHAIR_STATUSES;
};

export const saveStoredChairs = (chairs: ChairStatus[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAIRS, JSON.stringify(chairs));
    window.dispatchEvent(new Event('fabis_chairs_updated'));
  } catch (err) {
    console.error('Error saving chairs storage', err);
  }
};

export interface StoredSmsGatewaySettings {
  deviceId: string;
  apiKey: string;
  clinicName?: string;
  clinicPhone?: string;
  doctorName?: string;
  defaultReminderTiming?: '1 day before' | '2 days before' | 'Same day' | 'Custom';
  connected?: boolean;
  updatedAt?: string;
}

export const getStoredSmsGatewaySettings = (): StoredSmsGatewaySettings | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_SETTINGS);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading SMS gateway settings from storage', err);
  }
  return null;
};

export const saveStoredSmsGatewaySettings = (settings: StoredSmsGatewaySettings | null): void => {
  try {
    if (settings) {
      localStorage.setItem(
        STORAGE_KEYS.SMS_SETTINGS,
        JSON.stringify({ ...settings, updatedAt: new Date().toISOString() })
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.SMS_SETTINGS);
    }
    window.dispatchEvent(new Event('fabis_sms_settings_updated'));
  } catch (err) {
    console.error('Error saving SMS gateway settings to storage', err);
  }
};

export const getStoredSmsLogs = (): any[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_LOGS);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error('Error reading SMS logs from storage', err);
  }
  return [];
};

export const saveStoredSmsLogs = (logs: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SMS_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving SMS logs to storage', err);
  }
};

export const getStoredSmsTemplates = (): any[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_TEMPLATES);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error('Error reading SMS templates from storage', err);
  }
  return [];
};

export const saveStoredSmsTemplates = (templates: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SMS_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving SMS templates to storage', err);
  }
};

export const getStoredSmsFollowups = (): any[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SMS_FOLLOWUPS);
    if (data) return JSON.parse(data);
  } catch (err) {
    console.error('Error reading SMS followups from storage', err);
  }
  return [];
};

export const saveStoredSmsFollowups = (followups: any[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SMS_FOLLOWUPS, JSON.stringify(followups));
  } catch (err) {
    console.error('Error saving SMS followups to storage', err);
  }
};


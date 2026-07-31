// FABIS MediCare - Print Designer Template Storage & Persistence Engine

export type TemplateType = 'invoice_a4' | 'receipt_80mm' | 'prescription_a4';

export interface PrintTemplateConfig {
  id: string;
  name: string;
  type: TemplateType;
  isDefault: boolean;

  // Header / Branding
  showLogo: boolean;
  logoUrl?: string;
  showClinicName: boolean;
  clinicNameOverride?: string;
  showClinicAddress: boolean;
  clinicAddressOverride?: string;
  showClinicPhone: boolean;
  clinicPhoneOverride?: string;
  showClinicEmail: boolean;
  clinicEmailOverride?: string;

  // Doctor Info
  showDoctorName: boolean;
  doctorNameOverride?: string;
  showQualification: boolean;
  qualificationOverride?: string;
  showRegNumber: boolean;
  regNumberOverride?: string;

  // Layout & Styling
  primaryColor: string; // Hex color (e.g. #0F172A, #3BA7F5, #581C87)
  accentColor: string;  // Hex color
  textColor: string;    // Hex color
  fontSize: 'small' | 'medium' | 'large';
  fontWeight: 'normal' | 'medium' | 'bold';
  marginMm: number;
  headerHeightMm: number;
  footerHeightMm: number;

  // Footer & Content
  showTerms: boolean;
  termsText: string;
  showThankYou: boolean;
  thankYouMessage: string;
  showFooter: boolean;
  footerText: string;

  // Signature & QR Code
  showSignature: boolean;
  signatureText?: string;
  signatureImageUrl?: string;
  showQrCode: boolean;
  qrCodeText?: string;
  qrCodeLabel?: string;

  // Additional Toggles
  showPatientAgeGender?: boolean;
  showPatientPhone?: boolean;
  showPaymentBreakdown?: boolean;
  showDueBalanceBanner?: boolean;

  updatedAt?: string;
}

export const DEFAULT_A4_INVOICE_TEMPLATE: PrintTemplateConfig = {
  id: 'invoice_a4_default',
  name: 'Professional A4 Tax Invoice',
  type: 'invoice_a4',
  isDefault: true,

  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,

  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,

  primaryColor: '#581C87', // Deep Royal Purple
  accentColor: '#3BA7F5',
  textColor: '#0F172A',
  fontSize: 'medium',
  fontWeight: 'normal',
  marginMm: 14,
  headerHeightMm: 25,
  footerHeightMm: 20,

  showTerms: true,
  termsText: '1. Payment is due upon completion of treatment.\n2. All sales and dental procedure charges are final.\n3. Please retain this tax invoice for warranty claims.',
  showThankYou: true,
  thankYouMessage: 'Thank you for choosing FABIS MediCare! Keep smiling.',
  showFooter: true,
  footerText: 'Computer Generated Tax Invoice — FABIS MediCare EMR Platform',

  showSignature: true,
  signatureText: 'Authorized Signatory / Treating Dentist',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi&pn=FABIS%20MediCare',
  qrCodeLabel: 'Scan to Pay via UPI',

  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_THERMAL_RECEIPT_TEMPLATE: PrintTemplateConfig = {
  id: 'receipt_80mm_default',
  name: 'Professional 80mm Thermal Receipt',
  type: 'receipt_80mm',
  isDefault: true,

  showLogo: false,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: false,

  showDoctorName: true,
  showQualification: false,
  showRegNumber: true,

  primaryColor: '#000000',
  accentColor: '#000000',
  textColor: '#000000',
  fontSize: 'medium',
  fontWeight: 'bold',
  marginMm: 5,
  headerHeightMm: 15,
  footerHeightMm: 15,

  showTerms: false,
  termsText: '',
  showThankYou: true,
  thankYouMessage: 'THANK YOU FOR YOUR VISIT!',
  showFooter: true,
  footerText: 'Keep smiling. Valid Cash Receipt.',

  showSignature: false,
  signatureText: '',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi&pn=FABIS%20MediCare',
  qrCodeLabel: 'Scan UPI',

  showPatientAgeGender: false,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_A4_PRESCRIPTION_TEMPLATE: PrintTemplateConfig = {
  id: 'prescription_a4_default',
  name: 'Professional A4 Rx Prescription',
  type: 'prescription_a4',
  isDefault: true,

  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,

  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,

  primaryColor: '#0EA5E9', // Sky Blue Accent
  accentColor: '#0284C7',
  textColor: '#0F172A',
  fontSize: 'medium',
  fontWeight: 'normal',
  marginMm: 15,
  headerHeightMm: 25,
  footerHeightMm: 20,

  showTerms: true,
  termsText: '1. Take medicines strictly according to dosage and schedule.\n2. In case of unexpected side effects, discontinue and contact clinic immediately.\n3. Keep out of reach of children.',
  showThankYou: true,
  thankYouMessage: 'Wishing you a speedy recovery & healthier smile!',
  showFooter: true,
  footerText: 'Valid Medical & Dental Prescription — FABIS MediCare',

  showSignature: true,
  signatureText: 'Dr. Signature & Stamp',
  showQrCode: false,
  qrCodeText: '',

  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: false,
  showDueBalanceBanner: false,
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY = 'fabis_medicare_print_designer_templates_v1';
const ACTIVE_TEMPLATE_KEY_PREFIX = 'fabis_medicare_active_template_';

export const getStoredTemplates = (): PrintTemplateConfig[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading print templates:', err);
  }
  return [
    DEFAULT_A4_INVOICE_TEMPLATE,
    DEFAULT_THERMAL_RECEIPT_TEMPLATE,
    DEFAULT_A4_PRESCRIPTION_TEMPLATE,
  ];
};

export const saveStoredTemplates = (templates: PrintTemplateConfig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Error saving print templates:', err);
  }
};

export const getActiveTemplate = (type: TemplateType): PrintTemplateConfig => {
  try {
    const activeId = localStorage.getItem(`${ACTIVE_TEMPLATE_KEY_PREFIX}${type}`);
    const templates = getStoredTemplates();
    if (activeId) {
      const match = templates.find((t) => t.id === activeId && t.type === type);
      if (match) return match;
    }
    const typeMatch = templates.find((t) => t.type === type && t.isDefault);
    if (typeMatch) return typeMatch;
  } catch (err) {
    console.error(`Error getting active template for ${type}:`, err);
  }

  if (type === 'invoice_a4') return DEFAULT_A4_INVOICE_TEMPLATE;
  if (type === 'receipt_80mm') return DEFAULT_THERMAL_RECEIPT_TEMPLATE;
  return DEFAULT_A4_PRESCRIPTION_TEMPLATE;
};

export const setActiveTemplate = (templateId: string, type: TemplateType): void => {
  try {
    localStorage.setItem(`${ACTIVE_TEMPLATE_KEY_PREFIX}${type}`, templateId);
  } catch (err) {
    console.error('Error setting active template:', err);
  }
};

export const restoreDefaultTemplate = (type: TemplateType): PrintTemplateConfig => {
  let defaultTpl = DEFAULT_A4_INVOICE_TEMPLATE;
  if (type === 'receipt_80mm') defaultTpl = DEFAULT_THERMAL_RECEIPT_TEMPLATE;
  if (type === 'prescription_a4') defaultTpl = DEFAULT_A4_PRESCRIPTION_TEMPLATE;

  const templates = getStoredTemplates();
  const updated = templates.filter((t) => !(t.type === type && t.isDefault));
  const restored = { ...defaultTpl, updatedAt: new Date().toISOString() };
  updated.push(restored);
  saveStoredTemplates(updated);
  setActiveTemplate(restored.id, type);
  return restored;
};

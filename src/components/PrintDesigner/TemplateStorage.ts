// FABIS MediCare - Print Designer 2.0 Template Storage & Persistence Engine

export type TemplateType = 'invoice_a4' | 'receipt_80mm' | 'prescription_a4';

export type ElementType =
  | 'text'
  | 'dynamic_field'
  | 'image'
  | 'shape'
  | 'table'
  | 'icon'
  | 'qr_code'
  | 'barcode';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number; // Percentage (0-100) or mm relative to canvas
  y: number; // Percentage (0-100) or mm relative to canvas
  width: number;
  height: number;
  rotation?: number; // 0 - 360 deg
  zIndex?: number;
  isLocked?: boolean;
  hidden?: boolean;

  // Text & Dynamic Field Props
  content?: string;
  fieldKey?: string; // e.g. 'patient_name', 'grand_total', etc.
  labelOverride?: string;
  fontFamily?: string; // 'Inter' | 'Roboto' | 'Playfair Display' | 'Courier Prime' | 'Montserrat' | 'Open Sans' | 'Cinzel' | 'Lato'
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  opacity?: number;

  // Image Props
  imageType?: 'logo' | 'watermark' | 'background' | 'signature' | 'stamp' | 'custom';
  src?: string;

  // Shape Props
  shapeType?: 'line' | 'box' | 'circle' | 'divider';
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  borderRadius?: number;

  // Design Props
  iconName?: string;
  qrText?: string;
  label?: string;
  barcodeType?: 'code128' | 'qr';
}

export interface PrintTemplateConfig {
  id: string;
  name: string;
  type: TemplateType;
  presetCategory?: 'classic_medical' | 'premium_dental' | 'modern_minimal' | 'professional_emr' | 'luxury_clinic' | 'classic_receipt' | 'gst_receipt' | 'compact_receipt' | 'premium_receipt' | 'qr_payment_receipt';
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
  primaryColor: string; // Hex color
  accentColor: string;  // Hex color
  textColor: string;    // Hex color
  fontFamily?: string;
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
  watermarkImageUrl?: string;
  backgroundImageUrl?: string;
  stampImageUrl?: string;
  showQrCode: boolean;
  qrCodeText?: string;
  qrCodeLabel?: string;

  // Additional Toggles
  showPatientAgeGender?: boolean;
  showPatientPhone?: boolean;
  showPaymentBreakdown?: boolean;
  showDueBalanceBanner?: boolean;

  // New Thermal & Customization Toggles
  showClinicWebsite?: boolean;
  clinicWebsiteOverride?: string;
  showBarcode?: boolean;
  barcodeText?: string;
  dividerStyle?: 'dotted' | 'solid' | 'dashed' | 'double';
  showPaymentMode?: boolean;
  paymentModeOverride?: string;

  // Thermal Granular Spacing & Font Settings
  fontSizeScale?: 'compact' | 'standard' | 'large' | 'xlarge';
  lineSpacing?: 'tight' | 'normal' | 'relaxed' | 'spacious';
  paperSaverMode?: boolean;
  paperWidthMm?: 80 | 58;

  // Canva Drag & Drop Elements
  elements?: CanvasElement[];

  updatedAt?: string;
}

// ==========================================
// 26 DYNAMIC FIELDS DICTIONARY
// ==========================================
export const DYNAMIC_FIELDS_LIST = [
  { key: 'patient_name', label: 'Patient Name', category: 'Patient', defaultVal: 'Ananya Sharma' },
  { key: 'mrn', label: 'MRN', category: 'Patient', defaultVal: 'P-1008' },
  { key: 'age', label: 'Age', category: 'Patient', defaultVal: '32 Yrs' },
  { key: 'gender', label: 'Gender', category: 'Patient', defaultVal: 'Female' },
  { key: 'mobile', label: 'Mobile', category: 'Patient', defaultVal: '+91 98765 43210' },
  { key: 'address', label: 'Address', category: 'Patient', defaultVal: 'Anna Nagar, Chennai' },
  { key: 'appointment_date', label: 'Appointment Date', category: 'Appointment', defaultVal: '02 Aug 2026' },
  { key: 'invoice_number', label: 'Invoice Number', category: 'Invoice', defaultVal: 'INV-2026-089' },
  { key: 'prescription', label: 'Prescription Details', category: 'Clinical', defaultVal: 'Augmentin 625mg 1-0-1' },
  { key: 'diagnosis', label: 'Diagnosis', category: 'Clinical', defaultVal: 'Deep Caries #16 Molar' },
  { key: 'treatment', label: 'Treatment Name', category: 'Clinical', defaultVal: 'Root Canal Treatment (RCT)' },
  { key: 'treatment_cost', label: 'Treatment Cost', category: 'Invoice', defaultVal: '₹4,500.00' },
  { key: 'discount', label: 'Discount', category: 'Invoice', defaultVal: '₹500.00' },
  { key: 'tax', label: 'Tax / GST', category: 'Invoice', defaultVal: '₹0.00' },
  { key: 'grand_total', label: 'Grand Total', category: 'Invoice', defaultVal: '₹5,500.00' },
  { key: 'payment_method', label: 'Payment Method', category: 'Invoice', defaultVal: 'UPI / Cash' },
  { key: 'doctor_name', label: 'Doctor Name', category: 'Doctor', defaultVal: 'Dr. Sarah Mitchell' },
  { key: 'doctor_reg_no', label: 'Doctor Reg No', category: 'Doctor', defaultVal: 'DENT-12345' },
  { key: 'clinic_name', label: 'Clinic Name', category: 'Clinic', defaultVal: 'FABIS DENTAL CARE' },
  { key: 'clinic_address', label: 'Clinic Address', category: 'Clinic', defaultVal: '123 Health Ave, Medical Zone' },
  { key: 'clinic_phone', label: 'Clinic Phone', category: 'Clinic', defaultVal: '+91 98765 43210' },
  { key: 'clinic_email', label: 'Clinic Email', category: 'Clinic', defaultVal: 'contact@fabismedicare.com' },
  { key: 'website', label: 'Website', category: 'Clinic', defaultVal: 'www.fabismedicare.com' },
  { key: 'qr_payment', label: 'QR Payment', category: 'Payment', defaultVal: 'Scan UPI to Pay' },
  { key: 'thank_you_message', label: 'Thank You Message', category: 'Footer', defaultVal: 'Thank you for choosing FABIS MediCare!' },
  { key: 'custom_notes', label: 'Custom Notes', category: 'Footer', defaultVal: 'Please keep invoice for warranty claims.' },
];

// ==========================================
// 5 A4 PRESET TEMPLATES
// ==========================================

// 1. Classic Medical
export const PRESET_A4_CLASSIC_MEDICAL: PrintTemplateConfig = {
  id: 'a4_classic_medical',
  name: '1. Classic Medical (A4)',
  type: 'invoice_a4',
  presetCategory: 'classic_medical',
  isDefault: true,
  fontFamily: 'Cinzel',
  primaryColor: '#581C87', // Royal Purple
  accentColor: '#3BA7F5',
  textColor: '#0F172A',
  fontSize: 'medium',
  fontWeight: 'normal',
  marginMm: 14,
  headerHeightMm: 25,
  footerHeightMm: 20,
  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: '1. Payment is due upon treatment completion.\n2. Dental restoration warranty valid for 6 months with invoice.',
  showThankYou: true,
  thankYouMessage: 'Thank you for trusting FABIS MediCare!',
  showFooter: true,
  footerText: 'Official Computer Generated Medical Record — FABIS MediCare',
  showSignature: true,
  signatureText: 'Treating Doctor Signature',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi',
  qrCodeLabel: 'Scan to Pay via UPI',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// 2. Premium Dental
export const PRESET_A4_PREMIUM_DENTAL: PrintTemplateConfig = {
  id: 'a4_premium_dental',
  name: '2. Premium Dental (A4)',
  type: 'invoice_a4',
  presetCategory: 'premium_dental',
  isDefault: false,
  fontFamily: 'Inter',
  primaryColor: '#0D9488', // Teal Medical
  accentColor: '#06B6D4',
  textColor: '#0F172A',
  fontSize: 'medium',
  fontWeight: 'medium',
  marginMm: 12,
  headerHeightMm: 28,
  footerHeightMm: 20,
  showLogo: true,
  showClinicName: true,
  clinicNameOverride: 'FABIS PREMIUM DENTAL CLINIC',
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: '1. Complete root canal post-treatment care instructions as advised.\n2. Emergency contact line available 24/7.',
  showThankYou: true,
  thankYouMessage: 'Keep smiling bright! Your dental health is our priority.',
  showFooter: true,
  footerText: 'Premium Dental Care & Aesthetic Dentistry Center',
  showSignature: true,
  signatureText: 'Dr. Signature & Dental Seal',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabisdental@upi',
  qrCodeLabel: 'Instant UPI Payment',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// 3. Modern Minimal
export const PRESET_A4_MODERN_MINIMAL: PrintTemplateConfig = {
  id: 'a4_modern_minimal',
  name: '3. Modern Minimal (A4)',
  type: 'invoice_a4',
  presetCategory: 'modern_minimal',
  isDefault: false,
  fontFamily: 'Roboto',
  primaryColor: '#0F172A', // Slate Dark
  accentColor: '#64748B',
  textColor: '#1E293B',
  fontSize: 'small',
  fontWeight: 'normal',
  marginMm: 16,
  headerHeightMm: 22,
  footerHeightMm: 18,
  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: false,
  showDoctorName: true,
  showQualification: false,
  showRegNumber: true,
  showTerms: false,
  termsText: '',
  showThankYou: true,
  thankYouMessage: 'Thank you.',
  showFooter: true,
  footerText: 'FABIS MediCare EMR Invoice',
  showSignature: true,
  signatureText: 'Authorized Signatory',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi',
  qrCodeLabel: 'Scan QR',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: false,
  updatedAt: new Date().toISOString(),
};

// 4. Professional EMR
export const PRESET_A4_PROFESSIONAL_EMR: PrintTemplateConfig = {
  id: 'a4_professional_emr',
  name: '4. Professional EMR (A4)',
  type: 'invoice_a4',
  presetCategory: 'professional_emr',
  isDefault: false,
  fontFamily: 'Montserrat',
  primaryColor: '#1E3A8A', // Deep Navy Blue
  accentColor: '#2563EB',
  textColor: '#0F172A',
  fontSize: 'medium',
  fontWeight: 'medium',
  marginMm: 10,
  headerHeightMm: 30,
  footerHeightMm: 22,
  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: '1. Computer generated billing document according to EMR standard.\n2. All diagnostic reports are attached to patient digital chart.',
  showThankYou: true,
  thankYouMessage: 'Wishing you robust health and fast recovery!',
  showFooter: true,
  footerText: 'FABIS MediCare Multi-Specialty EMR System',
  showSignature: true,
  signatureText: 'Verified Medical Practitioner',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi',
  qrCodeLabel: 'UPI Digital Receipt',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// 5. Luxury Clinic
export const PRESET_A4_LUXURY_CLINIC: PrintTemplateConfig = {
  id: 'a4_luxury_clinic',
  name: '5. Luxury Clinic (A4)',
  type: 'invoice_a4',
  presetCategory: 'luxury_clinic',
  isDefault: false,
  fontFamily: 'Playfair Display',
  primaryColor: '#4338CA', // Indigo Luxury
  accentColor: '#D97706', // Gold Accent
  textColor: '#1E1B4B',
  fontSize: 'large',
  fontWeight: 'bold',
  marginMm: 15,
  headerHeightMm: 32,
  footerHeightMm: 25,
  showLogo: true,
  showClinicName: true,
  clinicNameOverride: 'FABIS LUXURY DENTAL & AESTHETICS',
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: '1. Exclusive aesthetic procedure warranty terms apply.\n2. Complimentary follow-up review within 14 days.',
  showThankYou: true,
  thankYouMessage: 'It was our pleasure serving you today.',
  showFooter: true,
  footerText: 'FABIS Luxury Medical & Aesthetic Wellness Clinic',
  showSignature: true,
  signatureText: 'Medical Director Signature',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabis luxury@upi',
  qrCodeLabel: 'VIP Concierge Payment',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// ==========================================
// 5 80MM THERMAL PRESET TEMPLATES
// ==========================================

// 1. Classic Receipt (80mm) - Exact match to Attached Thermal Receipt PDF
export const PRESET_THERMAL_CLASSIC: PrintTemplateConfig = {
  id: 'receipt_80mm_classic',
  name: '1. Classic Receipt (80mm)',
  type: 'receipt_80mm',
  presetCategory: 'classic_receipt',
  isDefault: true,
  fontFamily: 'Helvetica',
  primaryColor: '#000000',
  accentColor: '#000000',
  textColor: '#000000',
  fontSize: 'medium',
  fontWeight: 'bold',
  marginMm: 4,
  headerHeightMm: 15,
  footerHeightMm: 15,
  showLogo: false,
  showClinicName: true,
  clinicNameOverride: 'RK DENTAL CLINIC',
  showClinicAddress: true,
  clinicAddressOverride: 'No.10/1 School street, near police station, Kalavai 632506',
  showClinicPhone: true,
  clinicPhoneOverride: '+91 8883261285',
  showClinicEmail: false,
  showClinicWebsite: false,
  showDoctorName: false,
  showQualification: false,
  showRegNumber: false,
  showTerms: false,
  termsText: '',
  showThankYou: true,
  thankYouMessage: 'THANK YOU FOR YOUR VISIT!',
  showFooter: true,
  footerText: 'Keep smiling.',
  showSignature: false,
  signatureText: '',
  showQrCode: false,
  showBarcode: false,
  barcodeText: 'RK-20260717-0001',
  showPatientAgeGender: false,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: false,
  showPaymentMode: true,
  paymentModeOverride: 'CARD',
  dividerStyle: 'dotted',
  elements: [
    { id: 'el_clinic_name', type: 'dynamic_field', fieldKey: 'clinic_name', content: 'RK DENTAL CLINIC', x: 5, y: 2, width: 90, height: 6, bold: true, fontSize: 16, textAlign: 'center' },
    { id: 'el_clinic_address', type: 'dynamic_field', fieldKey: 'clinic_address', content: 'No.10/1 School street, near police station, Kalavai 632506', x: 5, y: 8, width: 90, height: 6, fontSize: 10, textAlign: 'center' },
    { id: 'el_clinic_phone', type: 'dynamic_field', fieldKey: 'clinic_phone', content: 'Ph: +91 8883261285', x: 5, y: 14, width: 90, height: 4, fontSize: 10, textAlign: 'center' },
    { id: 'el_div_1', type: 'shape', shapeType: 'divider', x: 5, y: 19, width: 90, height: 1, strokeColor: '#000000', strokeWidth: 1 },
    { id: 'el_meta_date', type: 'dynamic_field', fieldKey: 'appointment_date', labelOverride: 'Date', x: 5, y: 21, width: 50, height: 4, fontSize: 10, textAlign: 'left' },
    { id: 'el_meta_inv', type: 'dynamic_field', fieldKey: 'invoice_number', x: 55, y: 21, width: 40, height: 4, bold: true, fontSize: 10, textAlign: 'right' },
    { id: 'el_meta_patient', type: 'dynamic_field', fieldKey: 'patient_name', labelOverride: 'Patient', x: 5, y: 26, width: 50, height: 4, fontSize: 10, textAlign: 'left' },
    { id: 'el_meta_phone', type: 'dynamic_field', fieldKey: 'mobile', labelOverride: 'Ph', x: 55, y: 26, width: 40, height: 4, fontSize: 10, textAlign: 'right' },
    { id: 'el_div_2', type: 'shape', shapeType: 'divider', x: 5, y: 31, width: 90, height: 1, strokeColor: '#000000', strokeWidth: 1 },
    { id: 'el_table', type: 'table', fieldKey: 'treatment', x: 5, y: 33, width: 90, height: 24, fontSize: 10 },
    { id: 'el_div_3', type: 'shape', shapeType: 'divider', x: 5, y: 58, width: 90, height: 1, strokeColor: '#000000', strokeWidth: 1 },
    { id: 'el_grand_total', type: 'dynamic_field', fieldKey: 'grand_total', labelOverride: 'GRAND TOTAL', x: 5, y: 60, width: 90, height: 5, bold: true, fontSize: 13, textAlign: 'right' },
    { id: 'el_div_4', type: 'shape', shapeType: 'divider', x: 5, y: 66, width: 90, height: 1, strokeColor: '#000000', strokeWidth: 1 },
    { id: 'el_pay_mode', type: 'dynamic_field', fieldKey: 'payment_method', labelOverride: 'Payment Mode', x: 5, y: 68, width: 90, height: 5, fontSize: 10 },
    { id: 'el_div_5', type: 'shape', shapeType: 'divider', x: 5, y: 74, width: 90, height: 1, strokeColor: '#000000', strokeWidth: 1 },
    { id: 'el_thank_you', type: 'dynamic_field', fieldKey: 'thank_you_message', content: 'THANK YOU FOR YOUR VISIT!', x: 5, y: 76, width: 90, height: 4, bold: true, fontSize: 11, textAlign: 'center' },
    { id: 'el_footer_note', type: 'text', content: 'Keep smiling.', x: 5, y: 81, width: 90, height: 3, fontSize: 10, textAlign: 'center' },
  ],
  updatedAt: new Date().toISOString(),
};

// 2. GST Receipt
export const PRESET_THERMAL_GST: PrintTemplateConfig = {
  id: 'receipt_80mm_gst',
  name: '2. GST Receipt (80mm)',
  type: 'receipt_80mm',
  presetCategory: 'gst_receipt',
  isDefault: false,
  fontFamily: 'Roboto',
  primaryColor: '#000000',
  accentColor: '#000000',
  textColor: '#000000',
  fontSize: 'medium',
  fontWeight: 'bold',
  marginMm: 4,
  headerHeightMm: 18,
  footerHeightMm: 15,
  showLogo: false,
  showClinicName: true,
  clinicNameOverride: 'FABIS TAX INVOICE (GST)',
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: 'GSTIN: 33AAAAA0000A1Z5\nCGST: 9% | SGST: 9%',
  showThankYou: true,
  thankYouMessage: 'TAX INVOICE - PAID IN FULL',
  showFooter: true,
  footerText: 'GST Compliant Medical POS Receipt',
  showSignature: false,
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi',
  qrCodeLabel: 'Scan & Pay GST',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// 3. Compact Receipt
export const PRESET_THERMAL_COMPACT: PrintTemplateConfig = {
  id: 'receipt_80mm_compact',
  name: '3. Compact Receipt (80mm)',
  type: 'receipt_80mm',
  presetCategory: 'compact_receipt',
  isDefault: false,
  fontFamily: 'Courier Prime',
  primaryColor: '#000000',
  accentColor: '#000000',
  textColor: '#000000',
  fontSize: 'small',
  fontWeight: 'normal',
  marginMm: 2,
  headerHeightMm: 10,
  footerHeightMm: 10,
  showLogo: false,
  showClinicName: true,
  showClinicAddress: false,
  showClinicPhone: true,
  showClinicEmail: false,
  showDoctorName: true,
  showQualification: false,
  showRegNumber: false,
  showTerms: false,
  termsText: '',
  showThankYou: true,
  thankYouMessage: 'THANKS!',
  showFooter: false,
  footerText: '',
  showSignature: false,
  showQrCode: false,
  showPatientAgeGender: false,
  showPatientPhone: false,
  showPaymentBreakdown: true,
  showDueBalanceBanner: false,
  updatedAt: new Date().toISOString(),
};

// 4. Premium Receipt
export const PRESET_THERMAL_PREMIUM: PrintTemplateConfig = {
  id: 'receipt_80mm_premium',
  name: '4. Premium Receipt (80mm)',
  type: 'receipt_80mm',
  presetCategory: 'premium_receipt',
  isDefault: false,
  fontFamily: 'Inter',
  primaryColor: '#000000',
  accentColor: '#000000',
  textColor: '#000000',
  fontSize: 'medium',
  fontWeight: 'bold',
  marginMm: 6,
  headerHeightMm: 20,
  footerHeightMm: 18,
  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: 'Please retain receipt for insurance claim.',
  showThankYou: true,
  thankYouMessage: 'WISHING YOU A SPEEDY RECOVERY!',
  showFooter: true,
  footerText: 'FABIS MediCare Premium POS Thermal',
  showSignature: true,
  signatureText: 'Dr. Sign',
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi',
  qrCodeLabel: 'UPI Pay Code',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// 5. QR Payment Receipt
export const PRESET_THERMAL_QR_PAYMENT: PrintTemplateConfig = {
  id: 'receipt_80mm_qr_payment',
  name: '5. QR Payment Receipt (80mm)',
  type: 'receipt_80mm',
  presetCategory: 'qr_payment_receipt',
  isDefault: false,
  fontFamily: 'Montserrat',
  primaryColor: '#000000',
  accentColor: '#000000',
  textColor: '#000000',
  fontSize: 'medium',
  fontWeight: 'bold',
  marginMm: 5,
  headerHeightMm: 22,
  footerHeightMm: 16,
  showLogo: false,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: false,
  showDoctorName: true,
  showQualification: false,
  showRegNumber: true,
  showTerms: false,
  termsText: '',
  showThankYou: true,
  thankYouMessage: 'INSTANT UPI QR RECEIPT',
  showFooter: true,
  footerText: 'Scan QR with GooglePay / PhonePe / Paytm',
  showSignature: false,
  showQrCode: true,
  qrCodeText: 'upi://pay?pa=fabismedicare@upi',
  qrCodeLabel: 'SCAN TO PAY IMMEDIATELY',
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: true,
  showDueBalanceBanner: true,
  updatedAt: new Date().toISOString(),
};

// Prescriptions Default A4
export const PRESET_A4_PRESCRIPTION_DEFAULT: PrintTemplateConfig = {
  id: 'prescription_a4_default',
  name: 'Standard A4 Rx Prescription',
  type: 'prescription_a4',
  isDefault: true,
  fontFamily: 'Inter',
  primaryColor: '#0EA5E9',
  accentColor: '#0284C7',
  textColor: '#0F172A',
  fontSize: 'medium',
  fontWeight: 'normal',
  marginMm: 15,
  headerHeightMm: 25,
  footerHeightMm: 20,
  showLogo: true,
  showClinicName: true,
  showClinicAddress: true,
  showClinicPhone: true,
  showClinicEmail: true,
  showDoctorName: true,
  showQualification: true,
  showRegNumber: true,
  showTerms: true,
  termsText: '1. Take medicines strictly according to dosage and schedule.\n2. Keep out of reach of children.',
  showThankYou: true,
  thankYouMessage: 'Wishing you a speedy recovery & healthier smile!',
  showFooter: true,
  footerText: 'Valid Medical & Dental Prescription — FABIS MediCare',
  showSignature: true,
  signatureText: 'Dr. Signature & Stamp',
  showQrCode: false,
  showPatientAgeGender: true,
  showPatientPhone: true,
  showPaymentBreakdown: false,
  showDueBalanceBanner: false,
  updatedAt: new Date().toISOString(),
};

// STORAGE KEYS
const STORAGE_KEY = 'fabis_medicare_print_designer_templates_v2';
const ACTIVE_TEMPLATE_KEY_PREFIX = 'fabis_medicare_active_template_';
const DEFAULT_WHATSAPP_FORMAT_KEY = 'fabis_medicare_default_whatsapp_format';

export const ALL_PRESET_TEMPLATES: PrintTemplateConfig[] = [
  PRESET_A4_CLASSIC_MEDICAL,
  PRESET_A4_PREMIUM_DENTAL,
  PRESET_A4_MODERN_MINIMAL,
  PRESET_A4_PROFESSIONAL_EMR,
  PRESET_A4_LUXURY_CLINIC,
  PRESET_THERMAL_CLASSIC,
  PRESET_THERMAL_GST,
  PRESET_THERMAL_COMPACT,
  PRESET_THERMAL_PREMIUM,
  PRESET_THERMAL_QR_PAYMENT,
  PRESET_A4_PRESCRIPTION_DEFAULT,
];

export const getDefaultOverlayElements = (type: TemplateType): CanvasElement[] => {
  if (type === 'receipt_80mm') {
    return [
      { id: 'el_clinic_name', type: 'dynamic_field', fieldKey: 'clinic_name', content: 'RK DENTAL CLINIC', x: 5, y: 3, width: 90, height: 6, bold: true, fontSize: 15, fontFamily: 'Courier Prime', textAlign: 'center' },
      { id: 'el_clinic_address', type: 'dynamic_field', fieldKey: 'clinic_address', content: 'No.10/1 School street, near police station, Kalavai 632506', x: 5, y: 9, width: 90, height: 6, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'center' },
      { id: 'el_clinic_phone', type: 'dynamic_field', fieldKey: 'clinic_phone', content: 'Ph: +91 8883261285', x: 5, y: 15, width: 90, height: 4, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'center' },
      { id: 'el_date', type: 'dynamic_field', fieldKey: 'appointment_date', labelOverride: 'Date', x: 5, y: 21, width: 48, height: 4, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'left' },
      { id: 'el_inv_num', type: 'dynamic_field', fieldKey: 'invoice_number', x: 55, y: 21, width: 40, height: 4, bold: true, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'right' },
      { id: 'el_patient_name', type: 'dynamic_field', fieldKey: 'patient_name', labelOverride: 'Patient', x: 5, y: 26, width: 48, height: 4, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'left' },
      { id: 'el_mobile', type: 'dynamic_field', fieldKey: 'mobile', labelOverride: 'Ph', x: 55, y: 26, width: 40, height: 4, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'right' },
      { id: 'el_table', type: 'table', fieldKey: 'treatment', x: 5, y: 33, width: 90, height: 24, fontSize: 10, fontFamily: 'Courier Prime' },
      { id: 'el_grand_total', type: 'dynamic_field', fieldKey: 'grand_total', labelOverride: 'GRAND TOTAL', x: 5, y: 60, width: 90, height: 5, bold: true, fontSize: 13, fontFamily: 'Courier Prime', textAlign: 'right' },
      { id: 'el_pay_mode', type: 'dynamic_field', fieldKey: 'payment_method', labelOverride: 'Payment Mode', x: 5, y: 67, width: 90, height: 5, fontSize: 10, fontFamily: 'Courier Prime' },
      { id: 'el_thank_you', type: 'dynamic_field', fieldKey: 'thank_you_message', content: 'THANK YOU FOR YOUR VISIT!', x: 5, y: 75, width: 90, height: 4, bold: true, fontSize: 11, fontFamily: 'Courier Prime', textAlign: 'center' },
      { id: 'el_footer_note', type: 'text', content: 'Keep smiling.', x: 5, y: 80, width: 90, height: 3, fontSize: 10, fontFamily: 'Courier Prime', textAlign: 'center' },
    ];
  }

  // A4 (invoice_a4 or prescription_a4)
  return [
    { id: 'el_clinic_name', type: 'dynamic_field', fieldKey: 'clinic_name', content: 'RK DENTAL CLINIC', x: 6, y: 4, width: 48, height: 6, bold: true, fontSize: 18, color: '#581C87', textAlign: 'left' },
    { id: 'el_clinic_address', type: 'dynamic_field', fieldKey: 'clinic_address', content: 'Kalavai 632506', x: 6, y: 11, width: 48, height: 6, fontSize: 10, color: '#475569', textAlign: 'left' },
    { id: 'el_clinic_phone', type: 'dynamic_field', fieldKey: 'clinic_phone', content: 'Ph: +91 8883261285', x: 6, y: 18, width: 40, height: 4, fontSize: 10, color: '#475569', textAlign: 'left' },
    { id: 'el_clinic_email', type: 'dynamic_field', fieldKey: 'clinic_email', content: 'Email: rkdental@example.com', x: 6, y: 22, width: 40, height: 4, fontSize: 10, color: '#475569', textAlign: 'left' },
    { id: 'el_website', type: 'dynamic_field', fieldKey: 'website', content: 'www.rkdentalclinic.com', x: 6, y: 26, width: 40, height: 4, fontSize: 10, color: '#475569', textAlign: 'left' },
    { id: 'el_inv_title', type: 'text', content: 'TAX INVOICE', x: 58, y: 4, width: 36, height: 8, bold: true, fontSize: 22, color: '#581C87', textAlign: 'right' },
    { id: 'el_inv_num', type: 'dynamic_field', fieldKey: 'invoice_number', labelOverride: 'Invoice No.', x: 58, y: 14, width: 36, height: 4, bold: true, fontSize: 10, textAlign: 'right' },
    { id: 'el_date', type: 'dynamic_field', fieldKey: 'appointment_date', labelOverride: 'Date', x: 58, y: 19, width: 36, height: 4, fontSize: 10, textAlign: 'right' },
    { id: 'el_doc_name', type: 'dynamic_field', fieldKey: 'doctor_name', labelOverride: 'Doctor', x: 58, y: 24, width: 36, height: 4, fontSize: 10, textAlign: 'right' },
    { id: 'el_doc_reg', type: 'dynamic_field', fieldKey: 'doctor_reg_no', labelOverride: 'Reg No.', x: 58, y: 28, width: 36, height: 4, fontSize: 10, textAlign: 'right' },
    { id: 'el_patient_name', type: 'dynamic_field', fieldKey: 'patient_name', labelOverride: 'Patient Name', x: 6, y: 34, width: 44, height: 5, bold: true, fontSize: 12 },
    { id: 'el_mrn', type: 'dynamic_field', fieldKey: 'mrn', labelOverride: 'MRN', x: 52, y: 34, width: 22, height: 5, fontSize: 11 },
    { id: 'el_mobile', type: 'dynamic_field', fieldKey: 'mobile', labelOverride: 'Phone', x: 76, y: 34, width: 18, height: 5, fontSize: 11, textAlign: 'right' },
    { id: 'el_table', type: 'table', fieldKey: 'treatment', x: 6, y: 42, width: 88, height: 32, fontSize: 11 },
    { id: 'el_grand_total', type: 'dynamic_field', fieldKey: 'grand_total', labelOverride: 'GRAND TOTAL', x: 52, y: 78, width: 42, height: 6, bold: true, fontSize: 16, color: '#581C87', textAlign: 'right' },
    { id: 'el_pay_mode', type: 'dynamic_field', fieldKey: 'payment_method', labelOverride: 'Payment Mode', x: 6, y: 78, width: 40, height: 5, fontSize: 11 },
    { id: 'el_thank_you', type: 'dynamic_field', fieldKey: 'thank_you_message', content: 'THANK YOU FOR YOUR VISIT!', x: 6, y: 88, width: 88, height: 4, bold: true, fontSize: 12, textAlign: 'center' },
  ];
};

export const getStoredTemplates = (): PrintTemplateConfig[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Error loading print templates:', err);
  }
  return ALL_PRESET_TEMPLATES;
};

export const saveStoredTemplates = (templates: PrintTemplateConfig[]): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }
  } catch (err) {
    console.error('Error saving print templates:', err);
  }
};

export const getActiveTemplate = (type: TemplateType): PrintTemplateConfig => {
  try {
    if (typeof localStorage !== 'undefined') {
      const activeId = localStorage.getItem(`${ACTIVE_TEMPLATE_KEY_PREFIX}${type}`);
      const templates = getStoredTemplates();
      if (activeId) {
        const match = templates.find((t) => t.id === activeId && t.type === type);
        if (match) return match;
      }
      const typeMatch = templates.find((t) => t.type === type && t.isDefault);
      if (typeMatch) return typeMatch;
    }
  } catch (err) {
    console.error(`Error getting active template for ${type}:`, err);
  }

  if (type === 'invoice_a4') return PRESET_A4_CLASSIC_MEDICAL;
  if (type === 'receipt_80mm') return PRESET_THERMAL_CLASSIC;
  return PRESET_A4_PRESCRIPTION_DEFAULT;
};

export const setActiveTemplate = (templateId: string, type: TemplateType): void => {
  try {
    localStorage.setItem(`${ACTIVE_TEMPLATE_KEY_PREFIX}${type}`, templateId);
  } catch (err) {
    console.error('Error setting active template:', err);
  }
};

export const getDefaultWhatsappFormat = (): 'a4' | 'thermal' => {
  try {
    const stored = localStorage.getItem(DEFAULT_WHATSAPP_FORMAT_KEY);
    if (stored === 'thermal' || stored === 'a4') return stored;
  } catch (err) {
    console.error('Error getting default whatsapp format:', err);
  }
  return 'a4';
};

export const setDefaultWhatsappFormat = (format: 'a4' | 'thermal'): void => {
  try {
    localStorage.setItem(DEFAULT_WHATSAPP_FORMAT_KEY, format);
  } catch (err) {
    console.error('Error setting default whatsapp format:', err);
  }
};

export const restoreDefaultTemplate = (type: TemplateType): PrintTemplateConfig => {
  let defaultTpl = PRESET_A4_CLASSIC_MEDICAL;
  if (type === 'receipt_80mm') defaultTpl = PRESET_THERMAL_CLASSIC;
  if (type === 'prescription_a4') defaultTpl = PRESET_A4_PRESCRIPTION_DEFAULT;

  const templates = getStoredTemplates();
  const updated = templates.filter((t) => !(t.type === type && t.isDefault));
  const restored = { ...defaultTpl, updatedAt: new Date().toISOString() };
  updated.push(restored);
  saveStoredTemplates(updated);
  setActiveTemplate(restored.id, type);
  return restored;
};

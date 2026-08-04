export type Gender = 'Male' | 'Female' | 'Other';

export type ToothCondition = 
  | 'Healthy' 
  | 'Caries' 
  | 'RCT_Needed' 
  | 'RCT_Done' 
  | 'Crown' 
  | 'Missing' 
  | 'Implant' 
  | 'Extraction_Needed' 
  | 'Sensitivity' 
  | 'Scaling_Needed';

export type ToothSurface = 'M' | 'O' | 'D' | 'F' | 'L' | 'B' | 'P' | 'I';

export interface ToothRecord {
  toothNumber: number; // 1-32 (Universal) or FDI notation (11-48)
  fdiNumber: number; // 11-18, 21-28, 31-38, 41-48
  name: string; // e.g. "Upper Right First Molar"
  condition: ToothCondition;
  surfaces?: ToothSurface[]; // Active surfaces affected (Mesial, Occlusal, Distal, Facial, Lingual)
  notes?: string;
  diagnoses?: string[]; // Selected Clinical Problems / Diagnoses for this tooth
  updatedAt?: string;
}

export interface ToothPerioRecord {
  toothNumber: number;
  probingDepths: [number, number, number, number, number, number]; // 6-point depths: MB, B, DB, ML, L, DL in mm
  recession?: [number, number, number, number, number, number]; // Gingival recession in mm
  bop?: [boolean, boolean, boolean, boolean, boolean, boolean]; // Bleeding on Probing per site
  mobility?: 0 | 1 | 2 | 3; // Grade 0 to Grade 3 mobility
  furcation?: 0 | 1 | 2 | 3; // Grade 0 to Grade 3 furcation involvement
  notes?: string;
}

export interface SOAPNoteTemplate {
  id: string;
  title: string;
  category: 'Root Canal Treatment' | 'Scaling & Polishing' | 'Extractions' | 'Crown Prep & Bridge' | 'Restoration / Filling';
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface MedicalHistory {
  allergies?: string[];
  systemicConditions: string[]; // e.g. Hypertension, Diabetes, Pregnancy
  currentMedications: string[];
  bleedingDisorder: boolean;
  notes?: string;
}

export interface Vitals {
  bloodPressure?: string;
  pulseRate?: number;
  bloodSugar?: string;
  spO2?: number;
  weightKg?: number;
  updatedAt?: string;
}

export interface VitalsLogRecord {
  id: string;
  patientMrn: string;
  timestamp: string;
  bloodPressure?: string;
  pulseRate?: number;
  bloodSugar?: string;
}

export interface TreatmentPlanItem {
  id: string;
  patientId: string;
  toothNumber?: number;
  procedureName: string; // e.g. "Root Canal Treatment", "Zirconia Crown", "Scaling & Polishing"
  category: 'Endodontics' | 'Prosthodontics' | 'Periodontics' | 'Oral Surgery' | 'Orthodontics' | 'Cosmetic' | 'Preventive';
  phase?: 'Phase 1: Urgent / Pain Relief' | 'Phase 2: Restorative & Endo' | 'Phase 3: Cosmetic & Maintenance';
  estimatedCost: number;
  status: 'Planned' | 'In-Progress' | 'Completed' | 'Cancelled';
  isAccepted?: boolean;
  acceptedDate?: string;
  patientSignature?: string;
  startDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface MedicineItem {
  id: string;
  name: string; // e.g. "Amoxicillin 500mg", "Ketorolac 10mg"
  dosage: string; // e.g. "1 Tablet"
  frequency: string; // e.g. "1-0-1"
  duration: string; // e.g. "5 Days"
  timing?: string; // e.g. "After Food", "Before Food"
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName?: string;
  doctorName: string;
  date: string;
  chiefComplaint: string;
  diagnosis: string;
  medicines: MedicineItem[];
  specialInstructions?: string;
  nextVisitDate?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  toothNumber?: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PaymentMethod = 'UPI' | 'Cash' | 'Card' | 'Net Banking' | 'Insurance';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  referenceNo?: string;
  notes?: string;
}

export interface Invoice {
  id: string; // e.g. "INV-2026-001"
  patientId: string;
  patientName: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  netTotal: number;
  paidAmount: number;
  balanceDue: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  paymentMethod?: PaymentMethod;
  paymentHistory: PaymentRecord[];
  notes?: string;
}

export interface ChairStatus {
  id: string;
  name: string;
  status: 'Available' | 'Occupied' | 'Sanitizing' | 'Reserved';
  currentPatientId?: string;
  currentPatientName?: string;
  currentProcedure?: string;
  doctorName?: string;
  startTime?: string;
  expectedMinutes?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM"
  durationMinutes: number;
  procedure: string;
  chair: string;
  status: 'Scheduled' | 'Arrived' | 'In Consultation' | 'In-Chair' | 'Completed' | 'Cancelled' | 'No-Show' | 'Waiting-List';
  createdAt?: string; // ISO string creation timestamp
  checkInTime?: string; // ISO or time string when patient checked in
  treatmentStartTime?: string; // ISO or time string when treatment was started
  treatmentEndTime?: string; // ISO or time string when treatment finished
  completedTime?: string; // ISO string when appointment completed
  updatedAt?: string; // ISO string last updated timestamp
  notes?: string;
  isFollowUp?: boolean;
  recallDueDate?: string;
  recallType?: '6-Month Routine Checkup' | 'Post-Op Follow-Up' | 'Scaling Recall' | 'Orthodontic Adjustment';
  recallStatus?: 'Pending' | 'Reminded' | 'Confirmed' | 'Completed';
}

export interface FollowUpTask {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  dueDate: string; // YYYY-MM-DD
  reason: string; // e.g. "Post-RCT Crown Impression Check", "Suture Removal"
  status: 'Pending' | 'Call Placed' | 'Confirmed' | 'Completed';
  notes?: string;
}

export interface ClinicalMedia {
  id: string;
  patientId: string;
  title: string;
  category: 'OPG' | 'IOPA X-Ray' | 'Intraoral Photo' | 'CT Scan' | 'Lab Report';
  date: string;
  url: string; // placeholder image or base64 or cloud storage URL
  filePath?: string; // Supabase multi-tenant storage path
  tags: string[];
  notes?: string;
}

export interface TreatmentTemplate {
  id: string;
  name: string;
  description?: string;
  items: {
    procedureName: string;
    category: TreatmentPlanItem['category'];
    estimatedCost: number;
    toothRequired?: boolean;
  }[];
}

export interface VisitRecord {
  id: string;
  date: string;
  chiefComplaint?: string;
  diagnosis?: string;
  procedures: string[];
  toothNumbers?: number[];
  prescriptionId?: string;
  invoiceId?: string;
  totalCost: number;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  notes?: string;
}

export interface Patient {
  id: string; // e.g. "PAT-101"
  mrn: string; // e.g. "FM-2026-101"
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  streetAddress?: string;
  cityArea?: string;
  pincode?: string;
  address?: string;
  bloodGroup?: string;
  createdAt: string;
  status: 'Active' | 'Treatment Ongoing' | 'Completed' | 'Follow-up Due';
  medicalHistory: MedicalHistory;
  vitals?: Vitals;
  teethMap: Record<number, ToothRecord>; // keyed by tooth number 1..32
  perioMap?: Record<number, ToothPerioRecord>; // Periodontal charting keyed by tooth number 1..32
  treatmentPlans: TreatmentPlanItem[];
  prescriptions: Prescription[];
  invoices: Invoice[];
  appointments: Appointment[];
  followUps: FollowUpTask[];
  media: ClinicalMedia[];
  visitHistory?: VisitRecord[];
  notes?: string;
}

export type UserRole = 'admin' | 'doctor';

export interface UserCredentials {
  adminUsername: string;
  adminPin: string;
  doctorUsername: string;
  doctorPin: string;
}

export type ThemePalette = 
  | 'royal-navy' 
  | 'emerald-gold' 
  | 'sapphire-ice' 
  | 'sage-stone' 
  | 'midnight-obsidian';

export interface DoctorProfile {
  id: string;
  clinicId?: string; // Tenant ID for multi-tenant isolation
  name: string;
  qualifications: string;
  title: string;
  regNumber: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicEmail: string;
  website?: string;
  gstin?: string;
  currencySymbol: string;
  logoUrl?: string;
}

export type WelcomeCardIconType = 
  | 'Sparkles' 
  | 'Stethoscope' 
  | 'Sun' 
  | 'Shield' 
  | 'Heart' 
  | 'Crown' 
  | 'Award' 
  | 'Activity' 
  | 'Smile';

export interface DashboardPersonalizationSettings {
  welcomeTitle: string;
  welcomeMessage: string;
  motivationalQuote: string;
  clinicNameOverride?: string;
  showActiveChairs: boolean;
  showTodayAppointments: boolean;
  showWaitingPatients: boolean;
  showTodayRevenue: boolean;
  backgroundType: 'gradient' | 'solid' | 'image';
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImageUrl?: string;
  cardIcon: WelcomeCardIconType;
}

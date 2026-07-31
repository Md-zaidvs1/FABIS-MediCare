import { Patient, DoctorProfile, Appointment, FollowUpTask, ToothRecord, ToothCondition, TreatmentTemplate, VisitRecord, SOAPNoteTemplate, ChairStatus } from '../types';
import { formatTodayISO, getToothName, universalToFDI } from '../utils/formatters';

export const DEFAULT_SOAP_TEMPLATES: SOAPNoteTemplate[] = [
  {
    id: 'soap-rct',
    title: 'Root Canal Therapy (SOAP)',
    category: 'Root Canal Treatment',
    subjective: 'Patient reports sharp spontaneous pain in affected tooth, aggravated by thermal stimuli and chewing.',
    objective: 'Tenderness to percussion (+ve). Cold test yields lingering severe pain. Radiograph shows periapical radiolucency.',
    assessment: 'Symptomatic Irreversible Pulpitis with Periapical Periodontitis.',
    plan: 'Local anesthesia administered (2% Lignocaine with 1:80k Adrenaline). Rubber dam isolation. Access cavity prepared. Canal orifices located. Biomechanical preparation completed up to F2 using rotary NiTi files. NaOCl 3% & EDTA irrigation. Working length recorded via apex locator. Calcium hydroxide intracanal medicament placed. Temporary Cavit seal placed. Post-op analgesics prescribed.'
  },
  {
    id: 'soap-scaling',
    title: 'Ultrasonic Scaling & Polishing',
    category: 'Scaling & Polishing',
    subjective: 'Patient complains of bleeding gums while brushing and generalized halitosis.',
    objective: 'Generalized Grade II supragingival and subgingival calculus with marginal gingival erythema and BOP (+ve). Probing depth 2-3mm.',
    assessment: 'Generalized Chronic Marginal Gingivitis.',
    plan: 'Full mouth ultrasonic scaling performed using piezoelectric scalar. Subgingival debridement. Interdental flossing and polishing with prophy paste. Chlorhexidine 0.2% mouthwash prescribed. Bass brushing technique demonstrated.'
  },
  {
    id: 'soap-extraction',
    title: 'Surgical / Atraumatic Extraction',
    category: 'Extractions',
    subjective: 'Patient desires removal of severely broken non-restorable tooth.',
    objective: 'Non-restorable crown structure with deep subgingival decay. Grade II mobility. Radiograph confirms adequate root bone support.',
    assessment: 'Non-restorable Dental Caries with Chronic Periapical Lesion.',
    plan: 'Local anesthesia (2% Lignocaine) administered via nerve block / infiltration. Syndesmotomy performed. Tooth luxated with straight elevator and extracted atraumatically with forceps. Socket curetted, irrigated with sterile saline, and compressed. Gelatamp collagen sponge placed. Gauze pressure pack applied. Post-extraction instructions delivered (no spitting, warm saline rinses after 24 hours, cold compress).'
  },
  {
    id: 'soap-crown',
    title: 'Crown Preparation & Impression',
    category: 'Crown Prep & Bridge',
    subjective: 'Patient presenting for crown placement following completed root canal treatment.',
    objective: 'Asymptomatic endodontically treated tooth with adequate composite core buildup.',
    assessment: 'Post-RCT Tooth requiring Full Coverage Prosthetic Protection.',
    plan: 'Tooth preparation for Monolithic Zirconia crown with 1.0mm chamfer margin design. Gingival retraction cord (#00) placed for 5 minutes. Dual-phase elastomeric impression (Putty & Light Body) taken. Bite registration recorded. Shade selection (A2 VITA scale). Temporary acrylic crown fabricated and cemented with Temp-Bond. Impression dispatched to dental laboratory.'
  }
];

export const INITIAL_CHAIR_STATUSES: ChairStatus[] = [
  {
    id: 'Chair 1 (Main Operatory)',
    name: 'Chair 1 - Main Operatory',
    status: 'Occupied',
    currentPatientId: 'PAT-101',
    currentPatientName: 'Rohan Sharma',
    currentProcedure: 'Molar Root Canal (RCT)',
    doctorName: 'Dr. Alex Mercer',
    startTime: '10:15 AM',
    expectedMinutes: 45
  },
  {
    id: 'Chair 2 (Minor Procedures)',
    name: 'Chair 2 - Minor Hygiene & Scaling',
    status: 'Available',
    doctorName: 'Dr. Alex Mercer'
  },
  {
    id: 'Chair 3 (Surgical Suite)',
    name: 'Chair 3 - Surgical & Implant Suite',
    status: 'Sanitizing',
    doctorName: 'Dr. Alex Mercer'
  }
];

export const QUICK_DIAGNOSES = [
  'Tooth Pain / Odontalgia',
  'Dental Caries / Cavity',
  'Irreversible Pulpitis',
  'Gingivitis & Calculus',
  'Facial / Periapical Swelling',
  'Dentin Hypersensitivity',
  'Broken / Fractured Tooth',
  'Routine Oral Check-up',
  'Impacted Third Molar',
  'Missing Tooth / Edentulous',
];

export const QUICK_TREATMENTS = [
  { name: 'Consultation & Oral Exam', category: 'Preventive' as const, cost: 500 },
  { name: 'Scaling & Polishing (Full Mouth)', category: 'Periodontics' as const, cost: 1500 },
  { name: 'Composite Dental Filling', category: 'Preventive' as const, cost: 1200 },
  { name: 'Root Canal Treatment (RCT)', category: 'Endodontics' as const, cost: 4500 },
  { name: 'Simple Tooth Extraction', category: 'Oral Surgery' as const, cost: 1000 },
  { name: 'Surgical Extraction / Impaction', category: 'Oral Surgery' as const, cost: 3500 },
  { name: 'Zirconia / Ceramic Crown', category: 'Prosthodontics' as const, cost: 7500 },
  { name: 'Intraoral X-Ray (IOPA)', category: 'Preventive' as const, cost: 300 },
  { name: 'Dental Implant Placement', category: 'Oral Surgery' as const, cost: 25000 },
];

export const DEFAULT_TREATMENT_TEMPLATES: TreatmentTemplate[] = [
  {
    id: 'tmpl-rct',
    name: 'Root Canal Therapy Package',
    description: 'Complete endodontic care including X-Ray, RCT procedure, and Zirconia Crown',
    items: [
      { procedureName: 'Consultation & Exam', category: 'Preventive', estimatedCost: 500 },
      { procedureName: 'Intraoral X-Ray (IOPA)', category: 'Preventive', estimatedCost: 300 },
      { procedureName: 'Root Canal Treatment (Molar)', category: 'Endodontics', estimatedCost: 5500, toothRequired: true },
      { procedureName: 'High-Translucency Zirconia Crown', category: 'Prosthodontics', estimatedCost: 7500, toothRequired: true },
    ],
  },
  {
    id: 'tmpl-scaling',
    name: 'Oral Hygiene & Scaling Care',
    description: 'Full mouth ultrasonic scaling, polishing, and desensitizing application',
    items: [
      { procedureName: 'Consultation & Exam', category: 'Preventive', estimatedCost: 500 },
      { procedureName: 'Ultrasonic Scaling & Air Polishing', category: 'Periodontics', estimatedCost: 2000 },
      { procedureName: 'Desensitizing Gel Application', category: 'Preventive', estimatedCost: 500 },
    ],
  },
  {
    id: 'tmpl-implant',
    name: 'Dental Implant Surgical Package',
    description: 'Stage 1 implant placement fixture, CBCT scan, and bone grafting',
    items: [
      { procedureName: '3D CBCT Implant Assessment Scan', category: 'Preventive', estimatedCost: 2500 },
      { procedureName: 'Titanium Dental Implant Fixture', category: 'Oral Surgery', estimatedCost: 32000, toothRequired: true },
      { procedureName: 'Bone Graft & Membrane Material', category: 'Oral Surgery', estimatedCost: 8000 },
    ],
  },
];

export const DEFAULT_DOCTOR: DoctorProfile = {
  id: 'DOC-01',
  name: 'Dr. Alex Mercer',
  qualifications: 'B.D.S., M.D.S. (Endodontics & Conservative Dentistry)',
  title: 'Consultant Dental Surgeon & Specialist Endodontist',
  regNumber: 'DENT-REG-84920-IN',
  clinicName: 'FABIS MEDICARE Dental EMR Clinic',
  clinicAddress: 'Suite 402, Medicare Health Tower, Tech Park Road',
  clinicPhone: '+91 98765 43210 / 040-23456789',
  clinicEmail: 'contact@fabismedicare.com',
  currencySymbol: '₹',
};

const createBlankTeethMap = (): Record<number, ToothRecord> => {
  const map: Record<number, ToothRecord> = {};
  for (let i = 1; i <= 32; i++) {
    map[i] = {
      toothNumber: i,
      fdiNumber: universalToFDI(i),
      name: getToothName(i),
      condition: 'Healthy',
    };
  }
  return map;
};

const todayStr = formatTodayISO();

// Calculate date offset strings
const getOffsetDate = (daysOffset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Create teeth map for Ramesh Kumar
const rameshTeethMap = createBlankTeethMap();
rameshTeethMap[30] = { ...rameshTeethMap[30], condition: 'RCT_Needed', notes: 'Severe caries into pulp, periapical tenderness' };
rameshTeethMap[31] = { ...rameshTeethMap[31], condition: 'Caries', notes: 'Occlusal pit caries' };
rameshTeethMap[19] = { ...rameshTeethMap[19], condition: 'Crown', notes: 'PFM Crown placed 2 years ago' };

// Create teeth map for Aisha Khan
const aishaTeethMap = createBlankTeethMap();
aishaTeethMap[23] = { ...aishaTeethMap[23], condition: 'Scaling_Needed', notes: 'Lower anterior supragingival calculus' };
aishaTeethMap[24] = { ...aishaTeethMap[24], condition: 'Scaling_Needed' };
aishaTeethMap[25] = { ...aishaTeethMap[25], condition: 'Scaling_Needed' };
aishaTeethMap[26] = { ...aishaTeethMap[26], condition: 'Scaling_Needed' };

// Create teeth map for Dr. Rahul Verma
const rahulTeethMap = createBlankTeethMap();
rahulTeethMap[14] = { ...rahulTeethMap[14], condition: 'Missing', notes: 'Extracted 6 months ago due to vertical root fracture' };
rahulTeethMap[15] = { ...rahulTeethMap[15], condition: 'Crown', notes: 'Zirconia Crown in excellent condition' };
rahulTeethMap[3] = { ...rahulTeethMap[3], condition: 'Caries', notes: 'Incipient enamel caries' };

// Inline SVG Data URLs for OPG and Intraoral Photos
const opgImageData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" style="background:%230f172a; font-family:sans-serif;"><rect width="600" height="350" fill="%23090d16"/><path d="M50,180 Q300,320 550,180" stroke="%2338bdf8" stroke-width="8" fill="none" opacity="0.6"/><path d="M80,140 Q300,50 520,140" stroke="%2338bdf8" stroke-width="8" fill="none" opacity="0.6"/><g fill="%23e2e8f0" opacity="0.85"><rect x="120" y="110" width="18" height="35" rx="4"/><rect x="142" y="105" width="20" height="40" rx="4"/><rect x="166" y="100" width="22" height="42" rx="4"/><rect x="192" y="98" width="24" height="45" rx="4"/><rect x="220" y="95" width="26" height="48" rx="4"/><rect x="250" y="93" width="22" height="50" rx="4"/><rect x="276" y="92" width="22" height="50" rx="4"/><rect x="302" y="92" width="22" height="50" rx="4"/><rect x="328" y="93" width="22" height="50" rx="4"/><rect x="354" y="95" width="26" height="48" rx="4"/><rect x="384" y="98" width="24" height="45" rx="4"/><rect x="412" y="100" width="22" height="42" rx="4"/><rect x="438" y="105" width="20" height="40" rx="4"/><rect x="462" y="110" width="18" height="35" rx="4"/></g><g fill="%23e2e8f0" opacity="0.85"><rect x="120" y="200" width="18" height="35" rx="4"/><rect x="142" y="198" width="20" height="40" rx="4"/><rect x="166" y="195" width="22" height="42" rx="4"/><rect x="192" y="192" width="24" height="45" rx="4"/><rect x="220" y="190" width="26" height="48" rx="4"/><rect x="250" y="188" width="22" height="50" rx="4"/><rect x="276" y="187" width="22" height="50" rx="4"/><rect x="302" y="187" width="22" height="50" rx="4"/><rect x="328" y="188" width="22" height="50" rx="4"/><rect x="354" y="190" width="26" height="48" rx="4"/><rect x="384" y="192" width="24" height="45" rx="4"/><rect x="412" y="195" width="22" height="42" rx="4"/><rect x="438" y="198" width="20" height="40" rx="4"/><rect x="462" y="200" width="18" height="35" rx="4"/></g><circle cx="384" cy="214" r="14" fill="%23f43f5e" opacity="0.7"/><text x="384" y="260" fill="%23f43f5e" font-size="12" text-anchor="middle" font-weight="bold">Tooth %2330 / FDI 46 - Lesion</text><text x="300" y="30" fill="%2394a3b8" font-size="16" text-anchor="middle" font-weight="bold">PANORAMIC DIGITAL DENTAL OPG X-RAY</text><text x="300" y="330" fill="%2364748b" font-size="11" text-anchor="middle">FABIS MEDICARE CLINICAL IMAGING SYSTEM</text></svg>`;

const intraoralImageData = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350" style="background:%2318181b; font-family:sans-serif;"><rect width="600" height="350" fill="%2318181b"/><path d="M100,220 C200,100 400,100 500,220 C400,310 200,310 100,220 Z" fill="%23f43f5e" opacity="0.3"/><g fill="%23fef08a" opacity="0.9"><rect x="200" y="150" width="35" height="55" rx="8"/><rect x="240" y="145" width="38" height="62" rx="8"/><rect x="282" y="142" width="38" height="62" rx="8"/><rect x="324" y="145" width="38" height="62" rx="8"/><rect x="366" y="150" width="35" height="55" rx="8"/></g><path d="M190,205 Q300,220 410,205" stroke="%23fbbf24" stroke-width="12" stroke-linecap="round" fill="none" opacity="0.85"/><text x="300" y="250" fill="%23fef08a" font-size="13" text-anchor="middle" font-weight="bold">Lower Anterior Supragingival Calculus</text><text x="300" y="40" fill="%23f43f5e" font-size="16" text-anchor="middle" font-weight="bold">HD INTRAORAL CAMERA EXAMINATION</text></svg>`;

// Teeth Maps for 10 Seeded Patients
const rohanTeethMap = createBlankTeethMap();
rohanTeethMap[30] = { ...rohanTeethMap[30], condition: 'RCT_Needed', notes: 'Irreversible Pulpitis #46 / Tooth #30' };

const priyaTeethMap = createBlankTeethMap();
priyaTeethMap[23] = { ...priyaTeethMap[23], condition: 'Scaling_Needed', notes: 'Gingivitis & calculus accumulation' };
priyaTeethMap[24] = { ...priyaTeethMap[24], condition: 'Scaling_Needed' };

const anandTeethMap = createBlankTeethMap();
anandTeethMap[7] = { ...anandTeethMap[7], condition: 'Extraction_Needed', notes: 'Grade III Mobility loose tooth #12 / Tooth #7' };

const kavitaTeethMap = createBlankTeethMap();

const vikramTeethMap = createBlankTeethMap();
vikramTeethMap[14] = { ...vikramTeethMap[14], condition: 'Caries', notes: 'Deep occlusal caries #26 / Tooth #14' };

const fatimaTeethMap = createBlankTeethMap();
fatimaTeethMap[17] = { ...fatimaTeethMap[17], condition: 'RCT_Done', notes: 'Post-op surgical review for #38 / Tooth #17' };

const sureshTeethMap = createBlankTeethMap();
sureshTeethMap[8] = { ...sureshTeethMap[8], condition: 'Missing', notes: 'Edentulous space for #11 / Tooth #8 - Implant planned' };

const ananyaTeethMap = createBlankTeethMap();
ananyaTeethMap[17] = { ...ananyaTeethMap[17], condition: 'Extraction_Needed', notes: 'Impacted Third Molar #38 / Tooth #17' };

const rajeshTeethMap = createBlankTeethMap();
rajeshTeethMap[8] = { ...rajeshTeethMap[8], condition: 'Crown', notes: 'Fractured Tooth #11 / Tooth #8 - Zirconia crown prep' };

const meeraTeethMap = createBlankTeethMap();

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT-101',
    mrn: 'FM-2026-101',
    name: 'Rohan Sharma',
    age: 34,
    gender: 'Male',
    phone: '+91 98450 11223',
    streetAddress: '12th Main Road, Indiranagar',
    cityArea: 'Bangalore',
    pincode: '560038',
    address: '12th Main Road, Indiranagar, Bangalore - 560038',
    bloodGroup: 'O+',
    createdAt: getOffsetDate(-10),
    status: 'Treatment Ongoing',
    medicalHistory: {
      allergies: [],
      systemicConditions: ['Mild Hypertension'],
      currentMedications: ['Amlodipine 5mg'],
      bleedingDisorder: false,
      notes: 'Reports sharp pain in lower right back tooth (#46 / Tooth #30) aggravated by cold & hot food.',
    },
    vitals: {
      bloodPressure: '130/85',
      pulseRate: 76,
      bloodSugar: '104 mg/dL',
      spO2: 99,
      weightKg: 72,
      updatedAt: todayStr,
    },
    teethMap: rohanTeethMap,
    treatmentPlans: [
      {
        id: 'TP-101-1',
        patientId: 'PAT-101',
        toothNumber: 30,
        procedureName: 'Root Canal Treatment (Molar - 3 Canals)',
        category: 'Endodontics',
        estimatedCost: 4500,
        status: 'In-Progress',
        startDate: getOffsetDate(-2),
        notes: 'Access cavity prepared & canals cleaned under local anesthesia.',
      },
    ],
    prescriptions: [
      {
        id: 'RX-101-1',
        patientId: 'PAT-101',
        doctorName: 'Dr. Alex Mercer',
        date: getOffsetDate(-2),
        chiefComplaint: 'Severe throbbing pain in lower right tooth (#46 / #30)',
        diagnosis: 'Irreversible Pulpitis #46',
        medicines: [
          {
            id: 'M101-1',
            name: 'Clindamycin 300mg',
            dosage: '1 Capsule',
            frequency: '1-0-1 (After Food)',
            duration: '5 Days',
            instructions: 'Take with plenty of water.',
          },
          {
            id: 'M101-2',
            name: 'Zerodol-SP',
            dosage: '1 Tablet',
            frequency: '1-0-1 (After Food)',
            duration: '3 Days',
            instructions: 'Pain relief & anti-inflammatory.',
          },
        ],
        specialInstructions: 'Avoid hard food on right side. Warm saline rinses 3x daily.',
        nextVisitDate: getOffsetDate(3),
      },
    ],
    invoices: [
      {
        id: 'INV-2026-101',
        patientId: 'PAT-101',
        patientName: 'Rohan Sharma',
        date: getOffsetDate(-2),
        dueDate: todayStr,
        items: [
          { id: 'I101-1', description: 'Root Canal Treatment (Molar)', toothNumber: 30, quantity: 1, unitPrice: 4500, totalPrice: 4500 },
        ],
        subtotal: 4500,
        discountAmount: 500,
        taxAmount: 0,
        netTotal: 4000,
        paidAmount: 4000,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'UPI',
        paymentHistory: [
          { id: 'P101-1', date: getOffsetDate(-2), amount: 4000, method: 'UPI', referenceNo: 'UPI/849201', notes: 'Full payment with ₹500 discount' },
        ],
        notes: 'Full payment received.',
      },
    ],
    appointments: [
      {
        id: 'APT-101',
        patientId: 'PAT-101',
        patientName: 'Rohan Sharma',
        patientPhone: '+91 98450 11223',
        date: todayStr,
        timeSlot: '10:00 AM',
        durationMinutes: 45,
        procedure: 'RCT Obturation Sitting 2',
        chair: 'Chair 1 (Main Operatory)',
        status: 'Scheduled',
        notes: 'Check post-op pain before obturation.',
        isFollowUp: false,
      },
    ],
    followUps: [
      {
        id: 'FLW-101',
        patientId: 'PAT-101',
        patientName: 'Rohan Sharma',
        patientPhone: '+91 98450 11223',
        dueDate: getOffsetDate(3),
        reason: 'In 3 Days - Check post-op pain',
        status: 'Pending',
        notes: 'Confirm RCT healing & swelling subsidence.',
      },
    ],
    media: [
      {
        id: 'MED-101',
        patientId: 'PAT-101',
        title: 'Pre-Op Digital IOPA X-Ray #46',
        category: 'IOPA X-Ray',
        date: getOffsetDate(-10),
        url: opgImageData,
        tags: ['Pulpitis', '#46', 'IOPA'],
      },
    ],
  },
  {
    id: 'PAT-102',
    mrn: 'FM-2026-102',
    name: 'Priya Patel',
    age: 28,
    gender: 'Female',
    phone: '+91 99012 34567',
    streetAddress: '100 Feet Road, Indiranagar',
    cityArea: 'Bangalore',
    pincode: '560038',
    address: '100 Feet Road, Indiranagar, Bangalore - 560038',
    bloodGroup: 'B+',
    createdAt: getOffsetDate(-5),
    status: 'Active',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Bleeding gums on brushing.',
    },
    vitals: {
      bloodPressure: '118/75',
      pulseRate: 72,
      bloodSugar: '92 mg/dL',
      spO2: 99,
      weightKg: 58,
      updatedAt: todayStr,
    },
    teethMap: priyaTeethMap,
    treatmentPlans: [
      {
        id: 'TP-102-1',
        patientId: 'PAT-102',
        procedureName: 'Ultrasonic Scaling & Polishing',
        category: 'Periodontics',
        estimatedCost: 1500,
        status: 'Completed',
        startDate: todayStr,
        completedDate: todayStr,
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-102',
        patientId: 'PAT-102',
        patientName: 'Priya Patel',
        date: todayStr,
        dueDate: todayStr,
        items: [
          { id: 'I102-1', description: 'Ultrasonic Scaling & Polishing', quantity: 1, unitPrice: 1500, totalPrice: 1500 },
        ],
        subtotal: 1500,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 1500,
        paidAmount: 1500,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'Cash',
        paymentHistory: [
          { id: 'P102-1', date: todayStr, amount: 1500, method: 'Cash', referenceNo: 'CASH-102', notes: 'Paid in Cash' },
        ],
        notes: 'Full payment received in cash.',
      },
    ],
    appointments: [
      {
        id: 'APT-102',
        patientId: 'PAT-102',
        patientName: 'Priya Patel',
        patientPhone: '+91 99012 34567',
        date: todayStr,
        timeSlot: '11:15 AM',
        durationMinutes: 30,
        procedure: 'Scaling & Polishing',
        chair: 'Chair 2 (Minor Procedures)',
        status: 'Completed',
        notes: 'Full mouth scaling completed.',
        isFollowUp: false,
      },
    ],
    followUps: [],
    media: [],
  },
  {
    id: 'PAT-103',
    mrn: 'FM-2026-103',
    name: 'Anand Verma',
    age: 52,
    gender: 'Male',
    phone: '+91 98860 98765',
    streetAddress: '5th Block, Koramangala',
    cityArea: 'Bangalore',
    pincode: '560095',
    address: '5th Block, Koramangala, Bangalore - 560095',
    bloodGroup: 'A+',
    createdAt: getOffsetDate(-3),
    status: 'Treatment Ongoing',
    medicalHistory: {
      allergies: [],
      systemicConditions: ['Controlled Diabetes'],
      currentMedications: ['Metformin 500mg'],
      bleedingDisorder: false,
      notes: 'Loose upper front tooth (#12 / #7).',
    },
    vitals: {
      bloodPressure: '132/84',
      pulseRate: 78,
      bloodSugar: '110 mg/dL',
      spO2: 98,
      weightKg: 80,
      updatedAt: todayStr,
    },
    teethMap: anandTeethMap,
    treatmentPlans: [
      {
        id: 'TP-103-1',
        patientId: 'PAT-103',
        toothNumber: 7,
        procedureName: 'Simple Tooth Extraction (#12 / #7)',
        category: 'Oral Surgery',
        estimatedCost: 1000,
        status: 'Completed',
        startDate: todayStr,
        completedDate: todayStr,
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-103',
        patientId: 'PAT-103',
        patientName: 'Anand Verma',
        date: todayStr,
        dueDate: todayStr,
        items: [
          { id: 'I103-1', description: 'Simple Tooth Extraction', toothNumber: 7, quantity: 1, unitPrice: 1000, totalPrice: 1000 },
        ],
        subtotal: 1000,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 1000,
        paidAmount: 1000,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'UPI',
        paymentHistory: [
          { id: 'P103-1', date: todayStr, amount: 1000, method: 'UPI', referenceNo: 'UPI/30921', notes: 'Paid via UPI' },
        ],
        notes: 'Settled in full.',
      },
    ],
    appointments: [
      {
        id: 'APT-103',
        patientId: 'PAT-103',
        patientName: 'Anand Verma',
        patientPhone: '+91 98860 98765',
        date: todayStr,
        timeSlot: '12:00 PM',
        durationMinutes: 30,
        procedure: 'Atraumatic Extraction #12',
        chair: 'Chair 1 (Main Operatory)',
        status: 'Completed',
        notes: 'Extraction completed atraumatically.',
        isFollowUp: false,
      },
    ],
    followUps: [
      {
        id: 'FLW-103',
        patientId: 'PAT-103',
        patientName: 'Anand Verma',
        patientPhone: '+91 98860 98765',
        dueDate: getOffsetDate(7),
        reason: 'In 7 Days - Suture removal check',
        status: 'Pending',
        notes: 'Check healing socket and suture removal.',
      },
    ],
    media: [],
  },
  {
    id: 'PAT-104',
    mrn: 'FM-2026-104',
    name: 'Kavita Reddy',
    age: 41,
    gender: 'Female',
    phone: '+91 97400 55443',
    streetAddress: '4th Block, Jayanagar',
    cityArea: 'Bangalore',
    pincode: '560041',
    address: '4th Block, Jayanagar, Bangalore - 560041',
    bloodGroup: 'O+',
    createdAt: todayStr,
    status: 'Active',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Routine dental check-up.',
    },
    vitals: {
      bloodPressure: '120/80',
      pulseRate: 74,
      bloodSugar: '95 mg/dL',
      spO2: 99,
      weightKg: 62,
      updatedAt: todayStr,
    },
    teethMap: kavitaTeethMap,
    treatmentPlans: [
      {
        id: 'TP-104-1',
        patientId: 'PAT-104',
        procedureName: 'Consultation & Oral Exam',
        category: 'Preventive',
        estimatedCost: 500,
        status: 'Completed',
        startDate: todayStr,
        completedDate: todayStr,
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-104',
        patientId: 'PAT-104',
        patientName: 'Kavita Reddy',
        date: todayStr,
        dueDate: todayStr,
        items: [
          { id: 'I104-1', description: 'Consultation & Comprehensive Oral Exam', quantity: 1, unitPrice: 500, totalPrice: 500 },
        ],
        subtotal: 500,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 500,
        paidAmount: 500,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'Cash',
        paymentHistory: [
          { id: 'P104-1', date: todayStr, amount: 500, method: 'Cash', referenceNo: 'CASH-104', notes: 'Paid in Cash' },
        ],
        notes: 'Paid in full.',
      },
    ],
    appointments: [
      {
        id: 'APT-104',
        patientId: 'PAT-104',
        patientName: 'Kavita Reddy',
        patientPhone: '+91 97400 55443',
        date: todayStr,
        timeSlot: '02:00 PM',
        durationMinutes: 20,
        procedure: 'Consultation & Exam',
        chair: 'Chair 2 (Minor Procedures)',
        status: 'In-Chair',
        notes: 'Oral examination in progress.',
        isFollowUp: false,
      },
    ],
    followUps: [],
    media: [],
  },
  {
    id: 'PAT-105',
    mrn: 'FM-2026-105',
    name: 'Vikram Singh',
    age: 45,
    gender: 'Male',
    phone: '+91 96111 22334',
    streetAddress: 'ITPL Main Road, Whitefield',
    cityArea: 'Bangalore',
    pincode: '560066',
    address: 'ITPL Main Road, Whitefield, Bangalore - 560066',
    bloodGroup: 'B+',
    createdAt: getOffsetDate(-4),
    status: 'Active',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Sensitivity on upper left molar (#26 / #14).',
    },
    vitals: {
      bloodPressure: '124/82',
      pulseRate: 75,
      bloodSugar: '100 mg/dL',
      spO2: 99,
      weightKg: 78,
      updatedAt: todayStr,
    },
    teethMap: vikramTeethMap,
    treatmentPlans: [
      {
        id: 'TP-105-1',
        patientId: 'PAT-105',
        toothNumber: 14,
        procedureName: 'Composite Dental Filling (#26 / #14)',
        category: 'Preventive',
        estimatedCost: 1200,
        status: 'Completed',
        startDate: todayStr,
        completedDate: todayStr,
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-105',
        patientId: 'PAT-105',
        patientName: 'Vikram Singh',
        date: todayStr,
        dueDate: todayStr,
        items: [
          { id: 'I105-1', description: 'Light-Cure Composite Restoration', toothNumber: 14, quantity: 1, unitPrice: 1200, totalPrice: 1200 },
        ],
        subtotal: 1200,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 1200,
        paidAmount: 1200,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'Card',
        paymentHistory: [
          { id: 'P105-1', date: todayStr, amount: 1200, method: 'Card', referenceNo: 'POS/98214', notes: 'Paid via Card' },
        ],
        notes: 'Paid via credit card.',
      },
    ],
    appointments: [
      {
        id: 'APT-105',
        patientId: 'PAT-105',
        patientName: 'Vikram Singh',
        patientPhone: '+91 96111 22334',
        date: todayStr,
        timeSlot: '03:00 PM',
        durationMinutes: 30,
        procedure: 'Composite Restoration #26',
        chair: 'Chair 1 (Main Operatory)',
        status: 'Scheduled',
        notes: 'Class I occlusal filling.',
        isFollowUp: false,
      },
    ],
    followUps: [],
    media: [],
  },
  {
    id: 'PAT-106',
    mrn: 'FM-2026-106',
    name: 'Fatima Khan',
    age: 31,
    gender: 'Female',
    phone: '+91 98440 66778',
    streetAddress: 'Sector 1, HSR Layout',
    cityArea: 'Bangalore',
    pincode: '560102',
    address: 'Sector 1, HSR Layout, Bangalore - 560102',
    bloodGroup: 'AB+',
    createdAt: getOffsetDate(-7),
    status: 'Treatment Ongoing',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Surgical extraction of wisdom tooth #38 completed 7 days ago.',
    },
    vitals: {
      bloodPressure: '116/76',
      pulseRate: 72,
      bloodSugar: '90 mg/dL',
      spO2: 99,
      weightKg: 56,
      updatedAt: todayStr,
    },
    teethMap: fatimaTeethMap,
    treatmentPlans: [
      {
        id: 'TP-106-1',
        patientId: 'PAT-106',
        toothNumber: 17,
        procedureName: 'Surgical Extraction / Impaction #38',
        category: 'Oral Surgery',
        estimatedCost: 3500,
        status: 'Completed',
        startDate: getOffsetDate(-7),
        completedDate: getOffsetDate(-7),
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-106',
        patientId: 'PAT-106',
        patientName: 'Fatima Khan',
        date: getOffsetDate(-7),
        dueDate: getOffsetDate(-7),
        items: [
          { id: 'I106-1', description: 'Surgical Extraction #38', toothNumber: 17, quantity: 1, unitPrice: 3500, totalPrice: 3500 },
        ],
        subtotal: 3500,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 3500,
        paidAmount: 3500,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'UPI',
        paymentHistory: [
          { id: 'P106-1', date: getOffsetDate(-7), amount: 3500, method: 'UPI', referenceNo: 'UPI/109281', notes: 'Paid in full' },
        ],
        notes: 'Fully settled.',
      },
    ],
    appointments: [
      {
        id: 'APT-106',
        patientId: 'PAT-106',
        patientName: 'Fatima Khan',
        patientPhone: '+91 98440 66778',
        date: todayStr,
        timeSlot: '04:00 PM',
        durationMinutes: 20,
        procedure: 'Post-Op Review & Suture Removal',
        chair: 'Chair 2 (Minor Procedures)',
        status: 'Scheduled',
        notes: 'Check post-op healing socket.',
        isFollowUp: true,
      },
    ],
    followUps: [
      {
        id: 'FLW-106',
        patientId: 'PAT-106',
        patientName: 'Fatima Khan',
        patientPhone: '+91 98440 66778',
        dueDate: todayStr,
        reason: 'Suture removal',
        status: 'Pending',
        notes: 'Check post-op healing socket & remove sutures.',
      },
    ],
    media: [],
  },
  {
    id: 'PAT-107',
    mrn: 'FM-2026-107',
    name: 'Suresh Kumar',
    age: 60,
    gender: 'Male',
    phone: '+91 99800 11223',
    streetAddress: 'MG Road, Central Business District',
    cityArea: 'Bangalore',
    pincode: '560001',
    address: 'MG Road, Central Business District, Bangalore - 560001',
    bloodGroup: 'O+',
    createdAt: getOffsetDate(-2),
    status: 'Treatment Ongoing',
    medicalHistory: {
      allergies: [],
      systemicConditions: ['Controlled Type 2 Diabetes'],
      currentMedications: ['Metformin 500mg'],
      bleedingDisorder: false,
      notes: 'Missing upper central incisor #11 (#8). Desires implant fixed restoration.',
    },
    vitals: {
      bloodPressure: '135/86',
      pulseRate: 78,
      bloodSugar: '112 mg/dL',
      spO2: 98,
      weightKg: 82,
      updatedAt: todayStr,
    },
    teethMap: sureshTeethMap,
    treatmentPlans: [
      {
        id: 'TP-107-1',
        patientId: 'PAT-107',
        toothNumber: 8,
        procedureName: 'Dental Implant Placement (#11 / #8)',
        category: 'Oral Surgery',
        estimatedCost: 25000,
        status: 'Planned',
        startDate: getOffsetDate(5),
        notes: 'Stage 1 implant surgery planned after CBCT scan review.',
      },
    ],
    prescriptions: [],
    invoices: [],
    appointments: [],
    followUps: [
      {
        id: 'FLW-107',
        patientId: 'PAT-107',
        patientName: 'Suresh Kumar',
        patientPhone: '+91 99800 11223',
        dueDate: getOffsetDate(5),
        reason: 'Pre-Op Implant Surgery Consultation & Consent',
        status: 'Pending',
      },
    ],
    media: [],
  },
  {
    id: 'PAT-108',
    mrn: 'FM-2026-108',
    name: 'Ananya Roy',
    age: 24,
    gender: 'Female',
    phone: '+91 97310 88990',
    streetAddress: 'Phase 1, Electronic City',
    cityArea: 'Bangalore',
    pincode: '560100',
    address: 'Phase 1, Electronic City, Bangalore - 560100',
    bloodGroup: 'A+',
    createdAt: getOffsetDate(-1),
    status: 'Active',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Pain & cheek swelling in lower left wisdom tooth #38.',
    },
    vitals: {
      bloodPressure: '118/74',
      pulseRate: 70,
      bloodSugar: '92 mg/dL',
      spO2: 99,
      weightKg: 52,
      updatedAt: todayStr,
    },
    teethMap: ananyaTeethMap,
    treatmentPlans: [
      {
        id: 'TP-108-1',
        patientId: 'PAT-108',
        toothNumber: 17,
        procedureName: 'Surgical Extraction / Impaction (#38 / #17)',
        category: 'Oral Surgery',
        estimatedCost: 3500,
        status: 'In-Progress',
        startDate: todayStr,
      },
    ],
    prescriptions: [
      {
        id: 'RX-108-1',
        patientId: 'PAT-108',
        doctorName: 'Dr. Alex Mercer',
        date: todayStr,
        chiefComplaint: 'Impacted wisdom tooth pain & pericoronitis #38',
        diagnosis: 'Impacted Third Molar #38',
        medicines: [
          { id: 'M108-1', name: 'Amoxicillin 500mg', dosage: '1 Capsule', frequency: '1-1-1 (After Food)', duration: '5 Days', instructions: 'Take strictly on time.' },
          { id: 'M108-2', name: 'Zerodol-SP', dosage: '1 Tablet', frequency: '1-0-1', duration: '3 Days', instructions: 'For pain & inflammation.' },
        ],
        specialInstructions: 'Cold pack application on cheek for 24 hours. No warm gargles today.',
        nextVisitDate: getOffsetDate(3),
      },
    ],
    invoices: [
      {
        id: 'INV-2026-108',
        patientId: 'PAT-108',
        patientName: 'Ananya Roy',
        date: todayStr,
        dueDate: todayStr,
        items: [
          { id: 'I108-1', description: 'Surgical Extraction #38', toothNumber: 17, quantity: 1, unitPrice: 3500, totalPrice: 3500 },
        ],
        subtotal: 3500,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 3500,
        paidAmount: 3500,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'UPI',
        paymentHistory: [
          { id: 'P108-1', date: todayStr, amount: 3500, method: 'UPI', referenceNo: 'UPI/99812', notes: 'Paid in full' },
        ],
        notes: 'Payment settled via UPI.',
      },
    ],
    appointments: [
      {
        id: 'APT-108',
        patientId: 'PAT-108',
        patientName: 'Ananya Roy',
        patientPhone: '+91 97310 88990',
        date: todayStr,
        timeSlot: '04:45 PM',
        durationMinutes: 45,
        procedure: 'Surgical Extraction #38',
        chair: 'Chair 3 (Surgical Suite)',
        status: 'Scheduled',
        notes: 'Surgical extraction under local anesthesia.',
        isFollowUp: false,
      },
    ],
    followUps: [
      {
        id: 'FLW-108',
        patientId: 'PAT-108',
        patientName: 'Ananya Roy',
        patientPhone: '+91 97310 88990',
        dueDate: getOffsetDate(3),
        reason: 'In 3 Days - Check swelling',
        status: 'Pending',
        notes: 'Check post-op swelling and cheek trismus.',
      },
    ],
    media: [],
  },
  {
    id: 'PAT-109',
    mrn: 'FM-2026-109',
    name: 'Rajesh Gupta',
    age: 39,
    gender: 'Male',
    phone: '+91 99450 44556',
    streetAddress: 'ORR Junction, Marathahalli',
    cityArea: 'Bangalore',
    pincode: '560037',
    address: 'ORR Junction, Marathahalli, Bangalore - 560037',
    bloodGroup: 'B+',
    createdAt: getOffsetDate(-6),
    status: 'Treatment Ongoing',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Chipped front tooth (#11 / #8) due to accidental trauma.',
    },
    vitals: {
      bloodPressure: '126/80',
      pulseRate: 74,
      bloodSugar: '98 mg/dL',
      spO2: 99,
      weightKg: 76,
      updatedAt: todayStr,
    },
    teethMap: rajeshTeethMap,
    treatmentPlans: [
      {
        id: 'TP-109-1',
        patientId: 'PAT-109',
        toothNumber: 8,
        procedureName: 'Monolithic Zirconia Crown (#11 / #8)',
        category: 'Prosthodontics',
        estimatedCost: 7500,
        status: 'In-Progress',
        startDate: getOffsetDate(-3),
        notes: 'Crown prep done & impression sent to lab.',
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-109',
        patientId: 'PAT-109',
        patientName: 'Rajesh Gupta',
        date: getOffsetDate(-3),
        dueDate: todayStr,
        items: [
          { id: 'I109-1', description: 'Monolithic Zirconia Crown', toothNumber: 8, quantity: 1, unitPrice: 7500, totalPrice: 7500 },
        ],
        subtotal: 7500,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 7500,
        paidAmount: 5000,
        balanceDue: 2500,
        status: 'Partial',
        paymentMethod: 'UPI',
        paymentHistory: [
          { id: 'P109-1', date: getOffsetDate(-3), amount: 5000, method: 'UPI', referenceNo: 'UPI/77210', notes: 'Advance payment for Zirconia crown' },
        ],
        notes: 'Net due ₹2,500 pending upon crown cementation.',
      },
    ],
    appointments: [
      {
        id: 'APT-109',
        patientId: 'PAT-109',
        patientName: 'Rajesh Gupta',
        patientPhone: '+91 99450 44556',
        date: getOffsetDate(2),
        timeSlot: '11:00 AM',
        durationMinutes: 30,
        procedure: 'Zirconia Crown Cementation #11',
        chair: 'Chair 1 (Main Operatory)',
        status: 'Scheduled',
        notes: 'Trial fit & permanent cementation.',
        isFollowUp: false,
      },
    ],
    followUps: [],
    media: [],
  },
  {
    id: 'PAT-110',
    mrn: 'FM-2026-110',
    name: 'Meera Nair',
    age: 29,
    gender: 'Female',
    phone: '+91 98800 77665',
    streetAddress: 'Sarjapur Main Road',
    cityArea: 'Bangalore',
    pincode: '560035',
    address: 'Sarjapur Main Road, Bangalore - 560035',
    bloodGroup: 'O+',
    createdAt: todayStr,
    status: 'Active',
    medicalHistory: {
      allergies: [],
      systemicConditions: [],
      currentMedications: [],
      bleedingDisorder: false,
      notes: 'Routine check-up & X-ray scan.',
    },
    vitals: {
      bloodPressure: '114/72',
      pulseRate: 70,
      bloodSugar: '88 mg/dL',
      spO2: 99,
      weightKg: 54,
      updatedAt: todayStr,
    },
    teethMap: meeraTeethMap,
    treatmentPlans: [
      {
        id: 'TP-110-1',
        patientId: 'PAT-110',
        procedureName: 'Consultation & Oral Exam',
        category: 'Preventive',
        estimatedCost: 500,
        status: 'Completed',
        startDate: todayStr,
        completedDate: todayStr,
      },
      {
        id: 'TP-110-2',
        patientId: 'PAT-110',
        procedureName: 'Intraoral X-Ray (IOPA)',
        category: 'Preventive',
        estimatedCost: 300,
        status: 'Completed',
        startDate: todayStr,
        completedDate: todayStr,
      },
    ],
    prescriptions: [],
    invoices: [
      {
        id: 'INV-2026-110',
        patientId: 'PAT-110',
        patientName: 'Meera Nair',
        date: todayStr,
        dueDate: todayStr,
        items: [
          { id: 'I110-1', description: 'Consultation & Comprehensive Exam', quantity: 1, unitPrice: 500, totalPrice: 500 },
          { id: 'I110-2', description: 'Digital Intraoral X-Ray (IOPA)', quantity: 1, unitPrice: 300, totalPrice: 300 },
        ],
        subtotal: 800,
        discountAmount: 0,
        taxAmount: 0,
        netTotal: 800,
        paidAmount: 800,
        balanceDue: 0,
        status: 'Paid',
        paymentMethod: 'UPI',
        paymentHistory: [
          { id: 'P110-1', date: todayStr, amount: 800, method: 'UPI', referenceNo: 'UPI/55410', notes: 'Paid in full' },
        ],
        notes: 'Paid in full.',
      },
    ],
    appointments: [],
    followUps: [],
    media: [],
  },
];


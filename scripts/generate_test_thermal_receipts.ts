import fs from 'fs';
import path from 'path';
import { generateInvoiceThermalJsPdf } from '../src/utils/jsPdfInvoiceGenerator';
import { DoctorProfile, Patient, Invoice } from '../src/types';

const doctor: DoctorProfile = {
  id: 'doc-1',
  name: 'FABIS MEDICARE',
  title: 'Dr.',
  clinicName: 'FABIS MEDICARE DENTAL CARE & RESEARCH CENTER',
  clinicAddress: 'Plot 42, Tech Park Road, Kalavai 632506',
  clinicPhone: '+91 98765 43210 / 040-23456789',
  clinicEmail: 'contact@fabismedicare.com',
  website: 'www.fabismedicare.com',
  qualifications: 'BDS, MDS (Orthodontics)',
  regNumber: 'DENT-88492-IN',
  gstin: '36AAAAA0000A1Z5',
  currencySymbol: 'Rs.',
};

const patient: Patient = {
  id: 'pat-1',
  name: 'Ananya Sharma',
  age: 28,
  gender: 'Female',
  phone: '9876543210',
  address: 'Kalavai',
  mrn: 'MRN-2026-101',
  createdAt: '2026-08-01',
  status: 'Active',
  medicalHistory: {
    systemicConditions: [],
    currentMedications: [],
    bleedingDisorder: false,
  },
  teethMap: {},
  treatmentPlans: [],
  prescriptions: [],
  appointments: [],
  invoices: [],
  followUps: [],
  media: [],
};

// Test Invoice 1: Single line item
const invoiceSingle: Invoice = {
  id: 'INV-2026-001',
  patientId: 'pat-1',
  patientName: 'Ananya Sharma',
  date: '2026-08-03',
  items: [
    {
      id: 'item-1',
      description: 'Dental Consultation & Oral Examination',
      quantity: 1,
      unitPrice: 500,
      totalPrice: 500,
    },
  ],
  subtotal: 500,
  discountAmount: 0,
  taxAmount: 0,
  netTotal: 500,
  paidAmount: 500,
  balanceDue: 0,
  status: 'Paid',
  paymentMethod: 'UPI',
  paymentHistory: [],
};

// Test Invoice 2: 5 line items
const invoiceMulti: Invoice = {
  id: 'INV-2026-002',
  patientId: 'pat-1',
  patientName: 'Ananya Sharma',
  date: '2026-08-03',
  items: [
    { id: 'item-1', description: 'Dental Consultation & Diagnosis', quantity: 1, unitPrice: 500, totalPrice: 500 },
    { id: 'item-2', description: 'Root Canal Treatment (RCT Molar)', quantity: 1, unitPrice: 4500, totalPrice: 4500, toothNumber: 16 },
    { id: 'item-3', description: 'Zirconia Crown Placement', quantity: 1, unitPrice: 8000, totalPrice: 8000, toothNumber: 16 },
    { id: 'item-4', description: 'Composite Resin Filling', quantity: 2, unitPrice: 1200, totalPrice: 2400, toothNumber: 24 },
    { id: 'item-5', description: 'Ultrasonic Scaling & Polishing', quantity: 1, unitPrice: 1500, totalPrice: 1500 },
  ],
  subtotal: 16900,
  discountAmount: 900,
  taxAmount: 0,
  netTotal: 16000,
  paidAmount: 16000,
  balanceDue: 0,
  status: 'Paid',
  paymentMethod: 'Card',
  paymentHistory: [],
};

async function run() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate Single Item Receipt
  const blobSingle = generateInvoiceThermalJsPdf(invoiceSingle, doctor, patient);
  const bufferSingle = Buffer.from(await blobSingle.arrayBuffer());
  const pathSingle = path.join(publicDir, 'receipt_single_item.pdf');
  fs.writeFileSync(pathSingle, bufferSingle);

  // Generate Multi Item Receipt (5 items)
  const blobMulti = generateInvoiceThermalJsPdf(invoiceMulti, doctor, patient);
  const bufferMulti = Buffer.from(await blobMulti.arrayBuffer());
  const pathMulti = path.join(publicDir, 'receipt_multi_items.pdf');
  fs.writeFileSync(pathMulti, bufferMulti);

  console.log(`Saved Single Item Receipt PDF to: ${pathSingle} (${bufferSingle.length} bytes)`);
  console.log(`Saved Multi Item Receipt PDF to: ${pathMulti} (${bufferMulti.length} bytes)`);
}

run().catch(console.error);

import fs from 'fs';
import path from 'path';
import { generateInvoiceThermalJsPdf } from '../src/utils/jsPdfInvoiceGenerator';
import { Invoice, DoctorProfile, Patient } from '../src/types';

const testDoctor: DoctorProfile = {
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

const testPatient: Patient = {
  id: 'P-101',
  name: 'Rohan Sharma',
  age: 32,
  gender: 'Male',
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

const testInvoice: Invoice = {
  id: 'INV-2026-101',
  patientId: 'P-101',
  patientName: 'Rohan Sharma',
  date: '2026-08-03',
  items: [
    {
      id: 'item-1',
      description: 'Root Canal Treatment (Molar)',
      quantity: 1,
      unitPrice: 4500,
      totalPrice: 4500,
    },
  ],
  subtotal: 4500,
  discountAmount: 0,
  taxAmount: 0,
  netTotal: 4500,
  paidAmount: 4500,
  balanceDue: 0,
  status: 'Paid',
  paymentMethod: 'UPI',
  paymentHistory: [],
};

async function main() {
  const pdfBlob = generateInvoiceThermalJsPdf(testInvoice, testDoctor, testPatient);
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outFile = path.join(outDir, 'sample_receipt_thermal.pdf');
  fs.writeFileSync(outFile, buffer);
  console.log(`Saved sample thermal receipt to ${outFile}`);
}

main().catch(console.error);

import { sharePdfDocument, generatePdfBlobFromElement } from './pdfShareEngine';
import { generateInvoiceJsPdf, generateInvoiceThermalJsPdf } from './jsPdfInvoiceGenerator';
import { generatePrescriptionJsPdf } from './jsPdfPrescriptionGenerator';
import { Invoice, Prescription, DoctorProfile, Patient } from '../types';

export { generatePdfBlobFromElement, sharePdfDocument, generateInvoiceJsPdf, generateInvoiceThermalJsPdf, generatePrescriptionJsPdf };

/**
 * Standardized Invoice PDF Generator & Native Share Engine Caller
 */
export async function shareInvoicePdf({
  invoice,
  doctor,
  patient,
  customLogo,
  format = 'a4',
}: {
  invoice: Invoice;
  doctor: DoctorProfile;
  patient?: Patient | null;
  customLogo?: string | null;
  format?: 'a4' | 'thermal';
}): Promise<void> {
  const safePatientName = (invoice.patientName || patient?.name || 'Patient').replace(/\s+/g, '_');
  const fileName = format === 'thermal'
    ? `Invoice_Receipt_${invoice.id}_${safePatientName}.pdf`
    : `Invoice_${invoice.id}_${safePatientName}.pdf`;
  const text = `Hello ${invoice.patientName || patient?.name || 'Patient'}, here is your tax invoice #${invoice.id} from ${doctor.clinicName}.`;
  
  const pdfBlob = format === 'thermal'
    ? generateInvoiceThermalJsPdf(invoice, doctor, patient, customLogo)
    : generateInvoiceJsPdf(invoice, doctor, patient, customLogo);

  await sharePdfDocument({
    pdfBlob,
    fileName,
    title: `Tax Invoice #${invoice.id} - ${doctor.clinicName}`,
    text,
    patientMobile: patient?.phone || '',
  });
}

/**
 * Standardized Prescription PDF Generator & Native Share Engine Caller
 */
export async function sharePrescriptionPdf({
  rx,
  doctor,
  patient,
  customLogo,
}: {
  rx: Prescription;
  doctor: DoctorProfile;
  patient?: Patient | null;
  customLogo?: string | null;
}): Promise<void> {
  const safePatientName = (rx.patientName || patient?.name || 'Patient').replace(/\s+/g, '_');
  const fileName = `Prescription_${rx.id}_${safePatientName}.pdf`;
  const text = `Hello ${rx.patientName || patient?.name || 'Patient'}, here is your prescription #${rx.id} from ${doctor.clinicName}.`;

  const pdfBlob = generatePrescriptionJsPdf(rx, doctor, patient, customLogo);

  await sharePdfDocument({
    pdfBlob,
    fileName,
    title: `Prescription #${rx.id} - ${doctor.clinicName}`,
    text,
    patientMobile: patient?.phone || '',
  });
}

/**
 * Legacy element wrapper for thermal printing / modal fallback
 */
export async function handleSharePdfOrWhatsApp({
  element,
  fileName,
  title,
  text,
  patientPhone,
  format = 'a4',
}: {
  element: HTMLElement;
  fileName: string;
  title: string;
  text: string;
  patientPhone: string;
  format: 'a4' | 'thermal';
}) {
  let pdfBlob: Blob | null = null;
  try {
    pdfBlob = await generatePdfBlobFromElement(element, format);
  } catch (err) {
    console.error('Error generating PDF blob:', err);
  }

  if (pdfBlob) {
    await sharePdfDocument({
      pdfBlob,
      fileName,
      title,
      text,
      patientMobile: patientPhone,
    });
  }
}

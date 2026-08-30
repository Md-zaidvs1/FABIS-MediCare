import { sharePdfDocument, shareTextMessage, generatePdfBlobFromElement } from './pdfShareEngine';
import { generateInvoiceJsPdf, generateInvoiceThermalJsPdf } from './jsPdfInvoiceGenerator';
import { generatePrescriptionJsPdf, generatePrescriptionThermalJsPdf } from './jsPdfPrescriptionGenerator';
import { generateClinicalHistoryJsPdf } from './jsPdfClinicalHistoryGenerator';
import { Invoice, Prescription, DoctorProfile, Patient } from '../types';
import { formatPatientId, formatDate } from './formatters';

export { 
  generatePdfBlobFromElement, 
  sharePdfDocument, 
  shareTextMessage,
  generateInvoiceJsPdf, 
  generateInvoiceThermalJsPdf, 
  generatePrescriptionJsPdf,
  generatePrescriptionThermalJsPdf,
  generateClinicalHistoryJsPdf 
};

/**
 * Universal Direct Print Trigger using PDF Blob iframe
 */
export function printPdfBlob(blob: Blob): void {
  const blobUrl = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Direct iframe print blocked, opening in new window:', e);
        const printWin = window.open(blobUrl, '_blank');
        if (printWin) {
          printWin.focus();
          printWin.print();
        }
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 100);
  };
}

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
}) {
  const patientName = patient?.name || invoice.patientName || 'Patient';
  const safePatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  const patientId = formatPatientId(patient || invoice.patientId || '');
  const patientPhone = patient?.phone || (patient as any)?.mobile || (invoice as any).patientPhone || (invoice as any).patientMobile || '';

  const fileName = format === 'thermal'
    ? `Invoice_Thermal_${invoice.id}_${safePatientName}.pdf`
    : `Invoice_${invoice.id}_${safePatientName}.pdf`;

  const docTypeName = format === 'thermal' ? '80mm Thermal Receipt' : 'A4 Tax Invoice';
  const text = `Hello ${patientName},\n\nPlease find attached your ${docTypeName} (${invoice.id}) from ${doctor.clinicName}.\n\nPatient ID: ${patientId}\nNet Total: ₹${invoice.netTotal.toLocaleString('en-IN')}\nStatus: ${invoice.status}\nDate: ${formatDate(invoice.date)}\nClinic: ${doctor.clinicName}\nContact: ${doctor.clinicPhone}`;
  
  const pdfBlob = format === 'thermal'
    ? generateInvoiceThermalJsPdf(invoice, doctor, patient, customLogo)
    : generateInvoiceJsPdf(invoice, doctor, patient, customLogo);

  return sharePdfDocument({
    pdfBlob,
    fileName,
    title: `${docTypeName} #${invoice.id} - ${patientName}`,
    text,
    patientMobile: patientPhone,
    patientName,
    patientId,
    documentType: docTypeName,
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
  format = 'a4',
}: {
  rx: Prescription;
  doctor: DoctorProfile;
  patient?: Patient | null;
  customLogo?: string | null;
  format?: 'a4' | 'thermal';
}) {
  const patientName = patient?.name || rx.patientName || 'Patient';
  const safePatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
  const patientId = formatPatientId(patient || rx.patientId || '');
  const patientPhone = patient?.phone || (patient as any)?.mobile || (rx as any).patientPhone || (rx as any).patientMobile || '';

  const fileName = format === 'thermal'
    ? `Prescription_Thermal_${rx.id}_${safePatientName}.pdf`
    : `Prescription_${rx.id}_${safePatientName}.pdf`;

  const docTypeName = format === 'thermal' ? '80mm Thermal Prescription' : 'A4 Prescription';
  const text = `Hello ${patientName},\n\nPlease find attached your ${docTypeName} (${rx.id}) from ${doctor.clinicName}.\n\nPatient ID: ${patientId}\nDate: ${formatDate(rx.date)}\nClinic: ${doctor.clinicName}\nContact: ${doctor.clinicPhone}`;

  const pdfBlob = format === 'thermal'
    ? generatePrescriptionThermalJsPdf(rx, doctor, patient, customLogo)
    : generatePrescriptionJsPdf(rx, doctor, patient, customLogo);

  return sharePdfDocument({
    pdfBlob,
    fileName,
    title: `${docTypeName} #${rx.id} - ${patientName}`,
    text,
    patientMobile: patientPhone,
    patientName,
    patientId,
    documentType: docTypeName,
  });
}

/**
 * Standardized Patient Clinical History PDF Generator & Native Share Engine Caller
 */
export async function shareClinicalHistoryPdf({
  patient,
  doctor,
  customLogo,
}: {
  patient: Patient;
  doctor: DoctorProfile;
  customLogo?: string | null;
}) {
  const safePatientName = (patient.name || 'Patient').replace(/\s+/g, '_');
  const fileName = `Clinical_History_${patient.mrn}_${safePatientName}.pdf`;
  const text = `Hello ${patient.name}, here is your comprehensive dental clinical history and examination record from ${doctor.clinicName}.`;

  const pdfBlob = generateClinicalHistoryJsPdf(patient, doctor, customLogo);

  return sharePdfDocument({
    pdfBlob,
    fileName,
    title: `Clinical History - ${patient.name} (${patient.mrn})`,
    text,
    patientMobile: patient.phone || (patient as any)?.mobile || '',
    patientName: patient.name,
    patientId: patient.mrn,
    documentType: 'Clinical History',
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

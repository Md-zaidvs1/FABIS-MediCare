import { jsPDF } from 'jspdf';
import { Prescription, DoctorProfile, Patient } from '../types';
import { formatDate } from './formatters';
import { PrintTemplateConfig, getActiveTemplate } from '../components/PrintDesigner/TemplateStorage';

function hexToRgb(hex: string): [number, number, number] {
  let clean = (hex || '#0EA5E9').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [14, 165, 233];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function generatePrescriptionJsPdf(
  rx: Prescription,
  doctor: DoctorProfile,
  patient?: Patient | null,
  customLogoUrl?: string | null,
  templateConfig?: PrintTemplateConfig
): Blob {
  const tpl = templateConfig || getActiveTemplate('prescription_a4');
  const primaryRgb = hexToRgb(tpl.primaryColor);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = tpl.marginMm || 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  let currentY = margin;

  // 1. Header Section
  if (tpl.showLogo && customLogoUrl) {
    try {
      doc.addImage(customLogoUrl, 'PNG', margin, currentY, 40, 15);
      currentY += 18;
    } catch (e) {
      console.warn('Could not render logo in jsPDF:', e);
    }
  }

  // Clinic Details (Left)
  if (tpl.showClinicName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text((tpl.clinicNameOverride || doctor.clinicName || 'DENTAL CLINIC').toUpperCase(), margin, currentY);
    currentY += 6;
  }

  if (tpl.showClinicAddress) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(tpl.clinicAddressOverride || doctor.clinicAddress || 'Clinic Address', margin, currentY);
    currentY += 5;
  }

  const phoneStr = tpl.showClinicPhone ? (tpl.clinicPhoneOverride || doctor.clinicPhone || '') : '';
  const emailStr = tpl.showClinicEmail ? (tpl.clinicEmailOverride || doctor.clinicEmail || '') : '';
  if (phoneStr || emailStr) {
    const contactText = `Ph: ${phoneStr}${emailStr ? ' | ' + emailStr : ''}`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(contactText, margin, currentY);
    currentY += 5;
  }

  // Doctor Details (Right)
  let headerRightY = margin;
  if (tpl.showDoctorName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(`Dr. ${tpl.doctorNameOverride || doctor.name}`, pageWidth - margin, headerRightY, { align: 'right' });
    headerRightY += 5;
  }

  if (tpl.showQualification) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(tpl.qualificationOverride || doctor.qualifications || 'BDS, MDS', pageWidth - margin, headerRightY, { align: 'right' });
    headerRightY += 5;
  }

  if (tpl.showRegNumber) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    doc.text(`Reg #: ${tpl.regNumberOverride || doctor.regNumber || 'DENT-12345'}`, pageWidth - margin, headerRightY, { align: 'right' });
  }

  currentY = Math.max(currentY + 4, headerRightY + 8);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // 2. Patient & Rx Info Card
  const cardStartY = currentY;
  const cardPadding = 4;

  doc.setFillColor(248, 250, 252); // slate-50
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('PATIENT & CLINICAL DETAILS', margin + cardPadding, currentY + 5);

  currentY += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + cardPadding, currentY, pageWidth - margin - cardPadding, currentY);
  currentY += 5;

  doc.setFontSize(10);

  // Row 1: Patient Name & MRN & Date
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Patient Name: ', margin + cardPadding, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const ptName = rx.patientName || patient?.name || 'Patient';
  doc.text(ptName, margin + cardPadding + 26, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('MRN: ', margin + 95, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(patient?.mrn || 'N/A', margin + 107, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Rx Date: ', margin + 145, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatDate(rx.date), margin + 162, currentY);

  currentY += 6;

  // Row 2: Age/Gender & Mobile & Next Visit
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Age / Gender: ', margin + cardPadding, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(patient ? `${patient.age} Yrs / ${patient.gender}` : 'N/A', margin + cardPadding + 26, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Mobile: ', margin + 95, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(patient?.phone || 'N/A', margin + 110, currentY);

  if (rx.nextVisitDate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Follow-up: ', margin + 145, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 167, 245);
    doc.text(formatDate(rx.nextVisitDate), margin + 165, currentY);
  }

  currentY += 6;

  // Row 3: Chief Complaint & Diagnosis
  if (rx.chiefComplaint) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Chief Complaint: ', margin + cardPadding, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(rx.chiefComplaint, margin + cardPadding + 30, currentY);
    currentY += 6;
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Diagnosis: ', margin + cardPadding, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(rx.diagnosis || 'Dental Condition', margin + cardPadding + 20, currentY);

  currentY += 6;

  const cardHeight = currentY - cardStartY + 2;
  doc.rect(margin, cardStartY, contentWidth, cardHeight, 'S');

  currentY += 8;

  // 3. Rx Symbol & Medications Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('Rx', margin, currentY);
  currentY += 4;

  const tableStartY = currentY;
  const colX = {
    num: margin + 3,
    name: margin + 12,
    dosage: margin + 80,
    freq: margin + 120,
    duration: pageWidth - margin - 3,
  };

  // Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, tableStartY, contentWidth, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, tableStartY, contentWidth, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);

  doc.text('#', colX.num, tableStartY + 5.5);
  doc.text('Medication & Generic Name', colX.name, tableStartY + 5.5);
  doc.text('Dosage', colX.dosage, tableStartY + 5.5);
  doc.text('Frequency / Timing', colX.freq, tableStartY + 5.5);
  doc.text('Duration', colX.duration, tableStartY + 5.5, { align: 'right' });

  currentY += 8;

  // Table Rows
  rx.medicines.forEach((med, idx) => {
    const rowY = currentY + 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), colX.num, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(med.name, colX.name, rowY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(med.dosage || '1 Tablet', colX.dosage, rowY);

    const timingStr = med.timing ? `${med.frequency} (${med.timing})` : med.frequency;
    doc.text(timingStr, colX.freq, rowY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(med.duration || '5 Days', colX.duration, rowY, { align: 'right' });

    currentY += 8;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY, pageWidth - margin, currentY);
  });

  currentY += 6;

  // 4. Special Instructions & Advice Box
  if (rx.specialInstructions) {
    const advStartY = currentY;
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(252, 211, 77); // amber-300

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('SPECIAL INSTRUCTIONS / ADVICE:', margin + 4, currentY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);
    doc.text(rx.specialInstructions, margin + 4, currentY + 11);

    const advHeight = 16;
    doc.roundedRect(margin, advStartY, contentWidth, advHeight, 2, 2, 'FD');

    currentY += advHeight + 6;
  }

  // 5. Doctor Signature Line & Footer
  const footerY = pageHeight - 25;

  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 50, footerY, pageWidth - margin, footerY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Dr. ${doctor.name}`, pageWidth - margin - 25, footerY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Medical Practitioner', pageWidth - margin - 25, footerY + 8, { align: 'center' });

  // Page Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY + 12, pageWidth - margin, footerY + 12);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `This is a digitally generated prescription issued by ${doctor.clinicName}. Valid without physical signature.`,
    pageWidth / 2,
    footerY + 16,
    { align: 'center' }
  );

  return doc.output('blob');
}

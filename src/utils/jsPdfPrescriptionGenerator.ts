import { jsPDF } from 'jspdf';
import { Prescription, DoctorProfile, Patient } from '../types';
import { formatDate } from './formatters';

/**
 * Generates an ultra-lightweight (under 15 KB), 100% vector, print-ready Dental Prescription PDF without logos.
 */
export function generatePrescriptionJsPdf(
  rx: Prescription,
  doctor: DoctorProfile,
  patient?: Patient | null,
  _customLogoUrl?: string | null
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 186 mm

  // Color Palette Definitions (RGB)
  const PRIMARY = { r: 2, g: 132, b: 199 };     // #0284C7 Dental Cyan
  const DARK_NAVY = { r: 15, g: 23, b: 42 };    // #0F172A Body Text
  const SLATE = { r: 71, g: 85, b: 105 };       // #475569 Muted Labels
  const LIGHT_BG = { r: 248, g: 250, b: 252 };  // #F8FAFC Patient Bar
  const BORDER_CLR = { r: 226, g: 232, b: 240 };// #E2E8F0 Soft Dividers
  const TEAL_HDR = { r: 14, g: 116, b: 144 };   // #0E7490 Table Header
  const AMBER_BG = { r: 255, g: 251, b: 235 };  // #FFFBEB Advice Box
  const AMBER_BRD = { r: 252, g: 211, b: 77 };  // #FCD34D Advice Border

  // 1. Top Decorative Brand Bar
  doc.setFillColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.rect(0, 0, pageWidth, 4, 'F');
  doc.setFillColor(251, 191, 36); // Gold Accent
  doc.rect(0, 4, pageWidth, 0.8, 'F');

  // 2. Header Section (Clean text layout starting directly from left margin)
  const clinicName = doctor.clinicName || 'RK DENTAL CLINIC';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text(clinicName.toUpperCase(), margin, 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text('MULTISPECIALTY DENTAL CARE & ORAL SURGERY', margin, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const clinicAddr = doctor.clinicAddress || 'No. 626, Melin Road, Veyyakkam - 604410';
  doc.text(clinicAddr, margin, 24.5, { maxWidth: 110 });

  const phoneStr = doctor.clinicPhone ? `Ph: ${doctor.clinicPhone}` : 'Ph: 8883261285 / 04182-247369';
  const emailStr = doctor.clinicEmail ? ` | Email: ${doctor.clinicEmail}` : '';
  doc.setFontSize(7.5);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text(`${phoneStr}${emailStr}`, margin, 29);

  // Right Side - Doctor Info
  const docRightX = pageWidth - margin;
  const docName = doctor.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Dr. V. Radhakrishnan';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.text(docName, docRightX, 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text(doctor.qualifications || 'B.D.S. - Dental Surgeon', docRightX, 20.5, { align: 'right' });

  const regNum = doctor.regNumber || '25927';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text(`Reg No: ${regNum}`, docRightX, 25, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Dental EMR Verified', docRightX, 29, { align: 'right' });

  // Divider Rule under Header
  doc.setDrawColor(BORDER_CLR.r, BORDER_CLR.g, BORDER_CLR.b);
  doc.setLineWidth(0.5);
  doc.line(margin, 34, pageWidth - margin, 34);

  // 3. Patient Information Card (y: 38mm to 56mm)
  const ptBoxY = 37;
  const ptBoxH = 18;
  doc.setFillColor(LIGHT_BG.r, LIGHT_BG.g, LIGHT_BG.b);
  doc.setDrawColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, ptBoxY, contentWidth, ptBoxH, 2, 2, 'FD');

  const ptName = patient?.name || rx.patientName || 'ZAID KHAN';
  const ptAge = patient?.age ? `${patient.age} Yrs` : '28 Yrs';
  const ptGender = patient?.gender || 'Male';
  const ptMrn = patient?.mrn || patient?.id || rx.id || 'RX-1001';
  const rxDateStr = rx.date ? formatDate(rx.date) : formatDate(new Date().toISOString());

  // Row 1 of Patient Card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text('Patient Name:', margin + 4, ptBoxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.text(ptName, margin + 26, ptBoxY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text('Age / Gender:', margin + 85, ptBoxY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.text(`${ptAge} / ${ptGender}`, margin + 107, ptBoxY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text('Date:', margin + 145, ptBoxY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.text(rxDateStr, margin + 155, ptBoxY + 6);

  // Row 2 of Patient Card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text('MRN / Rx No:', margin + 4, ptBoxY + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.text(ptMrn, margin + 26, ptBoxY + 13);

  const phoneVal = patient?.phone || doctor.clinicPhone || '';
  if (phoneVal) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
    doc.text('Contact:', margin + 85, ptBoxY + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
    doc.text(phoneVal, margin + 107, ptBoxY + 13);
  }

  let currentY = 60;

  // 4. Clinical Details (Chief Complaint & Diagnosis)
  if (rx.chiefComplaint || rx.diagnosis) {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    const notesH = (rx.chiefComplaint && rx.diagnosis) ? 14 : 9;
    doc.roundedRect(margin, currentY, contentWidth, notesH, 1.5, 1.5, 'FD');

    let noteY = currentY + 5;
    if (rx.chiefComplaint) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
      doc.text('Chief Complaint:', margin + 4, noteY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
      doc.text(rx.chiefComplaint, margin + 30, noteY);
      noteY += 5;
    }
    if (rx.diagnosis) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
      doc.text('Diagnosis:', margin + 4, noteY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
      doc.text(rx.diagnosis, margin + 30, noteY);
    }
    currentY += notesH + 5;
  }

  // 5. Rx Symbol
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text('Rx', margin, currentY + 2);

  currentY += 7;

  // 6. Medicines Table Header
  const tableY = currentY;
  const colX = {
    num: margin + 3,
    name: margin + 12,
    dosage: margin + 85,
    freq: margin + 120,
    duration: margin + 160,
  };

  doc.setFillColor(TEAL_HDR.r, TEAL_HDR.g, TEAL_HDR.b);
  doc.roundedRect(margin, tableY, contentWidth, 7, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', colX.num, tableY + 4.8);
  doc.text('MEDICINE NAME & DOSAGE', colX.name, tableY + 4.8);
  doc.text('DOSAGE', colX.dosage, tableY + 4.8);
  doc.text('FREQUENCY / TIMING', colX.freq, tableY + 4.8);
  doc.text('DURATION', colX.duration, tableY + 4.8);

  currentY = tableY + 7;

  // 7. Medicines Rows
  rx.medicines.forEach((med, idx) => {
    const isEven = idx % 2 === 0;
    const rowH = med.dosage ? 11 : 8.5;

    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, currentY, contentWidth, rowH, 'F');

    // Bottom border for row
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY + rowH, margin + contentWidth, currentY + rowH);

    // Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
    doc.text(`${idx + 1}.`, colX.num, currentY + 5.2);

    // Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
    doc.text(med.name, colX.name, currentY + 5.2, { maxWidth: 70 });

    if (med.dosage) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
      doc.text(`Dose: ${med.dosage}`, colX.name, currentY + 9.2);
    }

    // Dosage Column
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
    doc.text(med.dosage || '1 Tab', colX.dosage, currentY + 5.2);

    // Frequency
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
    const freqTiming = med.timing ? `${med.frequency} (${med.timing})` : med.frequency;
    doc.text(freqTiming, colX.freq, currentY + 5.2, { maxWidth: 38 });

    // Duration
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
    doc.text(med.duration || '5 Days', colX.duration, currentY + 5.2);

    currentY += rowH;
  });

  currentY += 4;

  // 8. Special Instructions / Doctor Advice Callout Box
  if (rx.specialInstructions) {
    doc.setFillColor(AMBER_BG.r, AMBER_BG.g, AMBER_BG.b);
    doc.setDrawColor(AMBER_BRD.r, AMBER_BRD.g, AMBER_BRD.b);
    doc.setLineWidth(0.4);

    const adviceText = rx.specialInstructions;
    const splitAdvice = doc.splitTextToSize(adviceText, contentWidth - 10);
    const boxH = Math.max(16, 10 + splitAdvice.length * 4);

    doc.roundedRect(margin, currentY, contentWidth, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('DOCTOR ADVICE / SPECIAL INSTRUCTIONS:', margin + 4, currentY + 5.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 53, 15); // Amber-900
    doc.text(splitAdvice, margin + 4, currentY + 10.5);

    currentY += boxH + 4;
  }

  // 9. Follow-Up Date (if specified)
  if (rx.nextVisitDate) {
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, 80, 7, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
    doc.text(`Next Visit / Follow-up: ${formatDate(rx.nextVisitDate)}`, margin + 4, currentY + 4.8);

    currentY += 10;
  }

  // 10. Footer Section (Fixed Position near bottom of A4)
  const footerY = 252;

  // Divider line
  doc.setDrawColor(BORDER_CLR.r, BORDER_CLR.g, BORDER_CLR.b);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Left Footer - EMR Badge & Hygiene Notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.text('Digital EMR Certified Prescription', margin, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text('* Please complete the full course of antibiotics as prescribed.', margin, footerY + 10);
  doc.text('* In case of allergy or adverse reaction, contact clinic immediately.', margin, footerY + 14);

  // Right Footer - Signature Block
  const sigX = pageWidth - margin - 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.text(docName, sigX + 25, footerY + 16, { align: 'center' });

  doc.setDrawColor(DARK_NAVY.r, DARK_NAVY.g, DARK_NAVY.b);
  doc.setLineWidth(0.4);
  doc.line(sigX, footerY + 18, sigX + 50, footerY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(SLATE.r, SLATE.g, SLATE.b);
  doc.text('Doctor Signature & Stamp', sigX + 25, footerY + 22, { align: 'center' });

  // 11. Bottom Decorative Solid Footer Bar
  const bottomBarY = 288;
  doc.setFillColor(PRIMARY.r, PRIMARY.g, PRIMARY.b);
  doc.rect(0, bottomBarY, pageWidth, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const footerContact = `www.rkdentalclinic.com  |  Emergency Hotline: ${doctor.clinicPhone || '8883261285'}`;
  doc.text(footerContact, pageWidth / 2, bottomBarY + 5.5, { align: 'center' });

  return doc.output('blob');
}

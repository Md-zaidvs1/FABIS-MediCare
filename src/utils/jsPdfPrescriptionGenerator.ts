import { jsPDF } from 'jspdf';
import { Prescription, DoctorProfile, Patient } from '../types';
import { formatDate, formatPatientId } from './formatters';

/**
 * Generates a clean, professional, print-ready Dental Prescription A4 PDF.
 * Matches the exact structural design, grid alignment, container padding, and typography hierarchy of the Bill A4 PDF.
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
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  // Brand colors matching Bill A4 design
  const PRIMARY: [number, number, number] = [2, 132, 199];         // #0284C7 Dental Cyan / Sky
  const LIGHT_HEADER: [number, number, number] = [224, 242, 254];  // #E0F2FE Soft Sky Header
  const CARD_BG: [number, number, number] = [252, 252, 253];       // #FCFCFD Card Background
  const BORDER_COLOR: [number, number, number] = [226, 232, 240];  // #E2E8F0 Borders
  const TEXT_DARK: [number, number, number] = [15, 23, 42];        // #0F172A Body & Headings
  const TEXT_MUTED: [number, number, number] = [100, 116, 139];    // #64748B Labels
  const ZEBRA_BG: [number, number, number] = [248, 250, 252];      // #F8FAFC Table Rows
  const AMBER_BG: [number, number, number] = [255, 251, 235];      // #FFFBEB Advice Box
  const AMBER_BRD: [number, number, number] = [252, 211, 77];      // #FCD34D Advice Border

  let currentY = 14;

  // ----------------------------------------------------
  // 1. HEADER SECTION (Left: Clinic Identity | Right: Document Title & Meta)
  // ----------------------------------------------------
  let headerLeftY = currentY;
  const effectiveLogo = _customLogoUrl || doctor.logoUrl;
  let headerInfoX = margin;

  // Add Clinic Logo if provided
  if (effectiveLogo) {
    try {
      doc.addImage(effectiveLogo, 'PNG', margin, headerLeftY, 24, 24, undefined, 'FAST');
      headerInfoX = margin + 28;
    } catch {
      try {
        doc.addImage(effectiveLogo, 'JPEG', margin, headerLeftY, 24, 24, undefined, 'FAST');
        headerInfoX = margin + 28;
      } catch {
        // Continue with text if image format fails
        headerInfoX = margin;
      }
    }
  }

  // Clinic Name (18pt Bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.text((doctor.clinicName || 'RK DENTAL CLINIC').toUpperCase(), headerInfoX, headerLeftY + 5);

  headerLeftY += 9;

  // Sub-tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Multispecialty Dental Care & Oral Surgery', headerInfoX, headerLeftY);
  headerLeftY += 4.5;

  // Contact details list
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const clinicAddr = doctor.clinicAddress || 'No. 626, Melin Road, Veyyakkam - 604410';
  doc.text(`Address: ${clinicAddr}`, headerInfoX, headerLeftY, { maxWidth: effectiveLogo ? 75 : 95 });
  headerLeftY += 4.2;

  const phoneVal = doctor.clinicPhone || '+91 88832 61285 / 04182-247369';
  doc.text(`Phone: ${phoneVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.0;

  const emailVal = doctor.clinicEmail || 'contact@rkdentalclinic.com';
  doc.text(`Email: ${emailVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.0;

  if (doctor.website) {
    doc.text(`Website: ${doctor.website}`, headerInfoX, headerLeftY);
    headerLeftY += 4.2;
  }

  // Right Side Header (PRESCRIPTION Badge Title & Metadata)
  let headerRightY = currentY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text('PRESCRIPTION', pageWidth - margin, headerRightY + 6, { align: 'right' });

  headerRightY += 12;

  // Doctor & Rx Meta List
  doc.setFontSize(8.5);

  const docNameFormatted = doctor.name
    ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`)
    : 'Dr. V. Radhakrishnan';

  const metaItems = [
    { label: 'Rx No.', value: rx.id || 'RX-1001' },
    { label: 'Date', value: formatDate(rx.date) || formatDate(new Date().toISOString()) },
    { label: 'Doctor', value: docNameFormatted },
    { label: 'Reg No.', value: doctor.regNumber || '25927' },
  ];

  metaItems.forEach((m) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(m.label, pageWidth - margin - 56, headerRightY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(m.value, pageWidth - margin, headerRightY, { align: 'right' });

    headerRightY += 4.8;
  });

  currentY = Math.max(headerLeftY, headerRightY) + 3;

  // Solid Horizontal Accent Line
  doc.setFillColor(...PRIMARY);
  doc.rect(margin, currentY, contentWidth, 1.4, 'F');

  currentY += 7;

  // ----------------------------------------------------
  // 2. PATIENT INFO & PRESCRIPTION DETAILS CARDS (Equal Height Twin Cards)
  // ----------------------------------------------------
  const cardWidth = (contentWidth - 10) / 2; // 86 mm
  const cardHeight = 44;

  // LEFT CARD: PATIENT DETAILS
  const leftCardX = margin;
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftCardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  // Header Banner
  doc.setFillColor(...LIGHT_HEADER);
  doc.roundedRect(leftCardX, currentY, cardWidth, 8, 2, 2, 'F');
  doc.rect(leftCardX, currentY + 4, cardWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text('PATIENT DETAILS', leftCardX + 5, currentY + 5.5);

  let pY = currentY + 13;
  doc.setFontSize(8);

  const ptName = (patient?.name || rx.patientName || 'ZAID KHAN').toUpperCase();
  const ptId = formatPatientId(patient || rx.patientId) || 'RK881';
  const ptAgeGender = [
    patient?.age ? `${patient.age} Yrs` : '28 Yrs',
    patient?.gender || 'Male',
  ].filter(Boolean).join(' / ');
  const ptPhone = patient?.phone || '+91 98765 43210';
  const ptAddress = patient?.address || 'Kalavai, Tamil Nadu';

  const patientDetails = [
    { label: 'Patient Name', value: ptName, bold: true },
    { label: 'Patient ID', value: ptId, bold: true },
    { label: 'Age / Gender', value: ptAgeGender, bold: false },
    { label: 'Contact No', value: ptPhone, bold: false },
    { label: 'Address', value: ptAddress, bold: false },
  ];

  patientDetails.forEach((pd) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(pd.label, leftCardX + 5, pY);
    doc.text(':', leftCardX + 27, pY);

    doc.setFont('helvetica', pd.bold ? 'bold' : 'normal');
    doc.setTextColor(...TEXT_DARK);

    const valWidth = cardWidth - 32;
    const splitVal = doc.splitTextToSize(pd.value, valWidth);
    doc.text(splitVal, leftCardX + 29, pY);

    pY += splitVal.length > 1 ? splitVal.length * 3.8 : 5.0;
  });

  // RIGHT CARD: PRESCRIPTION DETAILS / CLINICAL SUMMARY
  const rightCardX = margin + cardWidth + 10;
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightCardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  // Header Banner
  doc.setFillColor(...LIGHT_HEADER);
  doc.roundedRect(rightCardX, currentY, cardWidth, 8, 2, 2, 'F');
  doc.rect(rightCardX, currentY + 4, cardWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PRIMARY);
  doc.text('PRESCRIPTION DETAILS', rightCardX + 5, currentY + 5.5);

  let rY = currentY + 13;
  doc.setFontSize(8);

  const complaintVal = rx.chiefComplaint || 'Pain & Sensitivity';
  const diagVal = rx.diagnosis || 'Acute Irreversible Pulpitis';
  const qualVal = doctor.qualifications || 'B.D.S. - Dental Surgeon';

  const rxDetails = [
    { label: 'Doctor Name', value: docNameFormatted, bold: true },
    { label: 'Qualifications', value: qualVal, bold: false },
    { label: 'Chief Complaint', value: complaintVal, bold: false },
    { label: 'Diagnosis', value: diagVal, bold: true },
  ];

  rxDetails.forEach((rd) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(rd.label, rightCardX + 5, rY);
    doc.text(':', rightCardX + 29, rY);

    doc.setFont('helvetica', rd.bold ? 'bold' : 'normal');
    doc.setTextColor(...TEXT_DARK);

    const valWidth = cardWidth - 34;
    const splitVal = doc.splitTextToSize(rd.value, valWidth);
    doc.text(splitVal, rightCardX + 32, rY);

    rY += splitVal.length > 1 ? splitVal.length * 3.8 : 5.0;
  });

  currentY += cardHeight + 8;

  // ----------------------------------------------------
  // 3. MEDICINES TABLE
  // ----------------------------------------------------
  const tableY = currentY;
  const colX = {
    num: margin + 3,
    name: margin + 12,
    dosage: margin + 85,
    freq: margin + 118,
    duration: margin + 158,
  };

  // Table Header Bar matching Bill layout
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(margin, tableY, contentWidth, 7.5, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('#', colX.num, tableY + 5.0);
  doc.text('MEDICINE NAME & FORMULATION', colX.name, tableY + 5.0);
  doc.text('DOSAGE', colX.dosage, tableY + 5.0);
  doc.text('FREQUENCY / TIMING', colX.freq, tableY + 5.0);
  doc.text('DURATION', colX.duration, tableY + 5.0);

  currentY = tableY + 7.5;

  // Table Rows
  if (rx.medicines && rx.medicines.length > 0) {
    rx.medicines.forEach((med, idx) => {
      const isEven = idx % 2 === 0;
      const rowH = med.dosage ? 10.5 : 8.5;

      if (isEven) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(...ZEBRA_BG);
      }
      doc.rect(margin, currentY, contentWidth, rowH, 'F');

      // Bottom row divider
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY + rowH, margin + contentWidth, currentY + rowH);

      // Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(`${idx + 1}`, colX.num, currentY + 5.0);

      // Medicine Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_DARK);
      doc.text(med.name, colX.name, currentY + 5.0, { maxWidth: 68 });

      if (med.dosage) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...TEXT_MUTED);
        doc.text(`Form: ${med.dosage}`, colX.name, currentY + 8.8);
      }

      // Dosage
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...TEXT_DARK);
      doc.text(med.dosage || '1 Tab', colX.dosage, currentY + 5.0);

      // Frequency & Timing
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...PRIMARY);
      const freqTiming = med.timing ? `${med.frequency} (${med.timing})` : med.frequency;
      doc.text(freqTiming, colX.freq, currentY + 5.0, { maxWidth: 36 });

      // Duration
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_DARK);
      doc.text(med.duration || '5 Days', colX.duration, currentY + 5.0);

      currentY += rowH;
    });
  } else {
    // Empty row placeholder
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('No prescribed medicines recorded', margin + contentWidth / 2, currentY + 6, { align: 'center' });
    currentY += 10;
  }

  currentY += 5;

  // ----------------------------------------------------
  // 4. DOCTOR ADVICE / SPECIAL INSTRUCTIONS BOX
  // ----------------------------------------------------
  if (rx.specialInstructions) {
    doc.setFillColor(...AMBER_BG);
    doc.setDrawColor(...AMBER_BRD);
    doc.setLineWidth(0.4);

    const adviceText = rx.specialInstructions;
    const splitAdvice = doc.splitTextToSize(adviceText, contentWidth - 12);
    const boxH = Math.max(16, 10 + splitAdvice.length * 4.2);

    doc.roundedRect(margin, currentY, contentWidth, boxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.text('DOCTOR ADVICE / SPECIAL INSTRUCTIONS:', margin + 5, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 53, 15); // Amber-900
    doc.text(splitAdvice, margin + 5, currentY + 10.5);

    currentY += boxH + 5;
  }

  // ----------------------------------------------------
  // 5. NEXT VISIT / FOLLOW-UP BADGE
  // ----------------------------------------------------
  if (rx.nextVisitDate) {
    doc.setFillColor(...LIGHT_HEADER);
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, 90, 7.5, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);
    doc.text(`Next Visit / Follow-up: ${formatDate(rx.nextVisitDate)}`, margin + 5, currentY + 5.0);

    currentY += 11;
  }

  // ----------------------------------------------------
  // 6. FOOTER SECTION (Clean Fixed Position near bottom)
  // ----------------------------------------------------
  const footerY = 250;

  // Divider line
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Left Footer - EMR Certificate & Patient Compliance Notice
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY);
  doc.text('Digital EMR Certified Prescription', margin, footerY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('* Please complete the full course of medicines as prescribed.', margin, footerY + 10.5);
  doc.text('* In case of unexpected allergy or discomfort, contact clinic immediately.', margin, footerY + 14.5);
  doc.text('* This prescription is digitally authorized under Medical Council guidelines.', margin, footerY + 18.5);

  // Right Footer - Signature & Stamp Block
  const sigX = pageWidth - margin - 60;
  const sigW = 60;

  // Stamp if present
  if (doctor.stampUrl) {
    try {
      doc.addImage(doctor.stampUrl, 'PNG', sigX - 22, footerY + 2, 20, 20, undefined, 'FAST');
    } catch {
      try {
        doc.addImage(doctor.stampUrl, 'JPEG', sigX - 22, footerY + 2, 20, 20, undefined, 'FAST');
      } catch {}
    }
  }

  // Doctor Signature if present
  if (doctor.signatureUrl) {
    try {
      doc.addImage(doctor.signatureUrl, 'PNG', sigX + 10, footerY + 2, 40, 12, undefined, 'FAST');
    } catch {
      try {
        doc.addImage(doctor.signatureUrl, 'JPEG', sigX + 10, footerY + 2, 40, 12, undefined, 'FAST');
      } catch {}
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(docNameFormatted, sigX + sigW / 2, footerY + 16, { align: 'center' });

  if (doctor.qualifications) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(doctor.qualifications, sigX + sigW / 2, footerY + 19.5, { align: 'center', maxWidth: sigW });
  }

  doc.setDrawColor(...TEXT_DARK);
  doc.setLineWidth(0.4);
  doc.line(sigX, footerY + 21, sigX + sigW, footerY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Doctor Signature & Stamp', sigX + sigW / 2, footerY + 25, { align: 'center' });

  // Bottom Solid Decorative Banner
  const bottomBarY = 287;
  doc.setFillColor(...PRIMARY);
  doc.rect(0, bottomBarY, pageWidth, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  const footerContact = `Thank you for choosing ${doctor.clinicName || 'RK Dental Clinic'}  •  Hotline: ${doctor.clinicPhone || '8883261285'}`;
  doc.text(footerContact, pageWidth / 2, bottomBarY + 6.0, { align: 'center' });

  return doc.output('blob');
}

/**
 * Generates an 80mm POS Thermal Receipt for Dental Prescriptions
 */
export function generatePrescriptionThermalJsPdf(
  rx: Prescription,
  doctor: DoctorProfile,
  patient?: Patient | null,
  _customLogoUrl?: string | null
): Blob {
  const paperWidth = 80;
  const margin = 3.5;
  const contentWidth = paperWidth - margin * 2;
  const centerX = paperWidth / 2;

  // Approximate height
  const baseHeight = 180 + (rx.medicines?.length || 0) * 12;
  const doc = new jsPDF({
    unit: 'mm',
    format: [paperWidth, baseHeight],
  });

  let curY = 5;

  // Clinic Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text((doctor.clinicName || 'RK DENTAL CLINIC').toUpperCase(), centerX, curY, { align: 'center' });
  curY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(doctor.clinicAddress || 'Kalavai, Tamil Nadu', centerX, curY, { align: 'center' });
  curY += 4;
  doc.text(`Ph: ${doctor.clinicPhone || '+91 8883261285'}`, centerX, curY, { align: 'center' });
  curY += 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('*** PRESCRIPTION RECEIPT ***', centerX, curY, { align: 'center' });
  curY += 4.5;

  // Dashed divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, curY, paperWidth - margin, curY);
  doc.setLineDashPattern([], 0);
  curY += 4;

  // Meta rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const ptName = patient?.name || rx.patientName || 'ZAID KHAN';
  const ptId = formatPatientId(patient || rx.patientId) || 'RK881';

  doc.text(`Rx No: ${rx.id || 'RX-1001'}`, margin, curY);
  curY += 3.8;
  doc.text(`Date: ${formatDate(rx.date)}`, margin, curY);
  curY += 3.8;
  doc.text(`Patient: ${ptName} (${ptId})`, margin, curY);
  curY += 3.8;
  doc.text(`Doctor: Dr. ${doctor.name}`, margin, curY);
  curY += 3.8;

  if (rx.diagnosis) {
    doc.text(`Diagnosis: ${rx.diagnosis}`, margin, curY, { maxWidth: contentWidth });
    curY += 4.5;
  }

  // Dashed divider
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, curY, paperWidth - margin, curY);
  doc.setLineDashPattern([], 0);
  curY += 4;

  // Medicines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRESCRIBED MEDICINES:', margin, curY);
  curY += 4.5;

  if (rx.medicines && rx.medicines.length > 0) {
    rx.medicines.forEach((m, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${idx + 1}. ${m.name}`, margin, curY);
      curY += 3.8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      const doseLine = `Dose: ${m.dosage || '1 Tab'} | ${m.frequency}${m.timing ? ` (${m.timing})` : ''} | ${m.duration || '5 Days'}`;
      doc.text(doseLine, margin + 3, curY, { maxWidth: contentWidth - 3 });
      curY += 4.5;
      doc.setTextColor(0, 0, 0);
    });
  }

  // Advice
  if (rx.specialInstructions) {
    curY += 1;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin, curY, paperWidth - margin, curY);
    doc.setLineDashPattern([], 0);
    curY += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Doctor Advice:', margin, curY);
    curY += 3.8;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(rx.specialInstructions, margin, curY, { maxWidth: contentWidth });
    curY += 6;
    doc.setTextColor(0, 0, 0);
  }

  // Follow-up
  if (rx.nextVisitDate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`Next Visit: ${formatDate(rx.nextVisitDate)}`, margin, curY);
    curY += 4.5;
  }

  // Footer
  doc.setLineDashPattern([1, 1], 0);
  doc.line(margin, curY, paperWidth - margin, curY);
  doc.setLineDashPattern([], 0);
  curY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('*** THANK YOU FOR YOUR VISIT! ***', centerX, curY, { align: 'center' });
  curY += 3.5;
  doc.text('Digital EMR Certified Prescription', centerX, curY, { align: 'center' });

  return doc.output('blob');
}

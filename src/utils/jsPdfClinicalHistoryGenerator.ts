import { jsPDF } from 'jspdf';
import { Patient, DoctorProfile, VisitRecord, ToothRecord, TreatmentPlanItem, Prescription, Invoice } from '../types';
import { formatDate, formatCurrency, getToothName, universalToFDI, formatPatientId } from './formatters';

function hexToRgb(hex: string): [number, number, number] {
  let clean = (hex || '#0f172a').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [15, 23, 42];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Draws a clean vector Rupee symbol (₹) directly into jsPDF.
 */
function drawRupeeSymbol(
  doc: jsPDF,
  x: number,
  y: number,
  height: number = 2.4,
  color: number[] = [0, 0, 0]
) {
  const oldLineWidth = doc.getLineWidth();
  const lineWidth = Math.max(0.18, height * 0.08);
  doc.setLineWidth(lineWidth);
  doc.setDrawColor(color[0], color[1], color[2]);

  const topY = y - height * 0.70;
  const midY = topY + height * 0.32;
  const botY = y;
  const width = height * 0.55;

  doc.line(x, topY, x + width, topY);
  doc.line(x, midY, x + width * 0.85, midY);
  doc.line(x, topY, x, midY + height * 0.12);
  doc.line(x, midY + height * 0.12, x + width * 0.65, midY + height * 0.12);
  doc.line(x + width * 0.15, midY + height * 0.12, x + width * 0.85, botY);

  doc.setLineWidth(oldLineWidth);
}

/**
 * Generates an executive A4 Patient Clinical History Report PDF Blob
 * Matching the professional clinical history format.
 */
export function generateClinicalHistoryJsPdf(
  patient: Patient,
  doctor: DoctorProfile,
  customLogo?: string | null
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let cursorY = margin;

  const brandColor: [number, number, number] = [15, 23, 42]; // Slate-900
  const accentColor: [number, number, number] = [2, 132, 199]; // Sky-600
  const subtextColor: [number, number, number] = [71, 85, 105]; // Slate-600

  // 1. TOP CLINIC & REPORT HEADER
  // Left: Clinic details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(doctor.clinicName || 'RK DENTAL CLINIC', margin, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  
  const clinicAddressLine = [doctor.clinicAddress, doctor.clinicPhone ? `Ph: ${doctor.clinicPhone}` : null]
    .filter(Boolean)
    .join(' | ');
  doc.text(clinicAddressLine || 'Kalavai 632506 | Ph: +91 8883261285', margin, cursorY + 9.5);

  const clinicEmailLine = [doctor.clinicEmail ? `Email: ${doctor.clinicEmail}` : null, 'www.fabismedicare.com']
    .filter(Boolean)
    .join(' | ');
  doc.text(clinicEmailLine, margin, cursorY + 13.5);

  // Right: Document Title & Patient ID
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text('PATIENT CLINICAL HISTORY', pageWidth - margin, cursorY + 5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`Patient ID: ${formatPatientId(patient)}`, pageWidth - margin, cursorY + 11, { align: 'right' });

  cursorY += 18;

  // Header Divider
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 4;

  // 2. PATIENT INFORMATION BOX (2-Column clean layout)
  const patientCardHeight = 22;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, cursorY, contentWidth, patientCardHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cursorY, contentWidth, patientCardHeight, 2, 2, 'D');

  const col1X = margin + 5;
  const col2X = margin + 98;
  const lineGap = 4.5;
  let pY = cursorY + 5;

  // Compile visits early for total count and first visit date
  const rawVisits: VisitRecord[] = [...(patient.visitHistory || [])];
  if (rawVisits.length === 0) {
    if (patient.appointments && patient.appointments.length > 0) {
      patient.appointments.forEach((apt) => {
        rawVisits.push({
          id: `VISIT-${apt.id}`,
          date: apt.date,
          chiefComplaint: apt.procedure || apt.notes || 'Dental Consultation & Examination',
          procedures: [apt.procedure],
          notes: apt.notes,
        });
      });
    } else {
      rawVisits.push({
        id: 'VISIT-1',
        date: patient.createdAt ? patient.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        chiefComplaint: 'Clinical Examination',
        procedures: ['Dental Consultation & Examination'],
      });
    }
  }

  // Sort visits chronologically (newest first)
  const visits = [...rawVisits].sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  const firstVisitDate = visits.length > 0 && visits[visits.length - 1]?.date ? formatDate(visits[visits.length - 1].date) : formatDate(patient.createdAt || '');
  const todayFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('Patient Name:', col1X, pY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(patient.name, col1X + 22, pY);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('First Visit:', col2X, pY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(firstVisitDate, col2X + 22, pY);

  pY += lineGap;

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('Age / Gender:', col1X, pY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`${patient.age} Yrs / ${patient.gender}`, col1X + 22, pY);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('Total Visits:', col2X, pY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(`${visits.length}`, col2X + 22, pY);

  pY += lineGap;

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('Phone:', col1X, pY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(patient.phone || 'N/A', col1X + 22, pY);

  // Column 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('Generated On:', col2X, pY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(todayFormatted, col2X + 22, pY);

  pY += lineGap;

  // Column 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(subtextColor[0], subtextColor[1], subtextColor[2]);
  doc.text('Blood Group:', col1X, pY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(patient.bloodGroup || 'Not Specified', col1X + 22, pY);

  cursorY += patientCardHeight + 5;

  // 3. SECTION TITLE: VISIT HISTORY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text('VISIT HISTORY', margin, cursorY + 3);
  cursorY += 5;

  // 4. VISIT HISTORY TABLE
  // Define Column Widths (Sum = 182mm)
  // Total content width: 182mm
  const colWidths = {
    date: 22,        // 0 to 22
    complaint: 28,   // 22 to 50
    vitals: 24,      // 50 to 74
    findings: 33,    // 74 to 107
    performed: 31,   // 107 to 138
    prescription: 24,// 138 to 162
    invoice: 20,     // 162 to 182
  };

  const colPositions = {
    date: margin,
    complaint: margin + colWidths.date,
    vitals: margin + colWidths.date + colWidths.complaint,
    findings: margin + colWidths.date + colWidths.complaint + colWidths.vitals,
    performed: margin + colWidths.date + colWidths.complaint + colWidths.vitals + colWidths.findings,
    prescription: margin + colWidths.date + colWidths.complaint + colWidths.vitals + colWidths.findings + colWidths.performed,
    invoice: margin + colWidths.date + colWidths.complaint + colWidths.vitals + colWidths.findings + colWidths.performed + colWidths.prescription,
  };

  const drawTableHeader = () => {
    const thHeight = 6.5;
    doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
    doc.rect(margin, cursorY, contentWidth, thHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    const pad = 2;
    const ty = cursorY + 4.3;

    doc.text('Visit Date', colPositions.date + pad, ty);
    doc.text('Chief Complaint', colPositions.complaint + pad, ty);
    doc.text('Vitals', colPositions.vitals + pad, ty);
    doc.text('Treatment & Findings', colPositions.findings + pad, ty);
    doc.text('Treatment Performed', colPositions.performed + pad, ty);
    doc.text('Prescription', colPositions.prescription + pad, ty);
    doc.text('Invoice', colPositions.invoice + pad, ty);

    cursorY += thHeight;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin - 15) {
      doc.addPage();
      cursorY = margin;
      
      // Top continuation subheader
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text(`${doctor.clinicName || 'RK DENTAL CLINIC'} — Patient Clinical History: ${patient.name} (${formatPatientId(patient)})`, margin, cursorY);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, cursorY, { align: 'right' });
      cursorY += 3;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 5;

      drawTableHeader();
    }
  };

  // Draw Initial Table Header
  drawTableHeader();

  // Populate Table Rows
  visits.forEach((v, index) => {
    // 1. Visit Date text
    const dateText = formatDate(v.date);

    // 2. Chief complaint text
    const complaintText = v.chiefComplaint || 'Routine Checkup / Follow-up';

    // 3. Vitals text
    const vitalsList: string[] = [];
    if (patient.vitals?.bloodPressure) vitalsList.push(`BP: ${patient.vitals.bloodPressure}`);
    if (patient.vitals?.pulseRate) vitalsList.push(`Pulse: ${patient.vitals.pulseRate} bpm`);
    if (patient.vitals?.bloodSugar) vitalsList.push(`Sugar: ${patient.vitals.bloodSugar}`);
    const vitalsText = vitalsList.length > 0 ? vitalsList.join('\n') : 'BP: 120/80\nPulse: 72';

    // 4. Treatment & Findings (FDI teeth, calculus, stains, recession)
    const findingsList: string[] = [];
    if (v.toothFindings && v.toothFindings.length > 0) {
      v.toothFindings.forEach((tf) => {
        findingsList.push(`Tooth #${tf.fdiNumber || universalToFDI(tf.toothNumber)}: ${tf.condition}`);
      });
    } else {
      // Check patient teethMap
      const affected = Object.values(patient.teethMap || {}).filter((t) => t.condition !== 'Healthy');
      if (affected.length > 0) {
        affected.slice(0, 3).forEach((t) => {
          findingsList.push(`Tooth #${t.fdiNumber || universalToFDI(t.toothNumber)}: ${t.condition}`);
        });
      }
    }
    if (v.clinicalFindings && v.clinicalFindings.length > 0) {
      findingsList.push(v.clinicalFindings.join(', '));
    }
    if (v.gingivalRecession) {
      findingsList.push(`Recession: ${v.gingivalRecession}`);
    }
    if (v.calculus || v.stains) {
      const perio = [v.calculus ? `Calculus: ${v.calculus}` : null, v.stains ? `Stains: ${v.stains}` : null].filter(Boolean).join(', ');
      findingsList.push(perio);
    }
    const findingsText = findingsList.length > 0 ? findingsList.join('\n') : 'Clinical Examination Normal';

    // 5. Treatment Performed / Procedures
    const performedList: string[] = [];
    if (v.procedures && v.procedures.length > 0) {
      performedList.push(v.procedures.join(', '));
    }
    if (v.treatmentPlanText) {
      performedList.push(v.treatmentPlanText);
    }
    if (v.notes) {
      performedList.push(v.notes);
    }
    const performedText = performedList.length > 0 ? performedList.join('\n') : 'Consultation & Oral Examination';

    // 6. Prescription
    const matchingRx = patient.prescriptions?.find((rx) => rx.date === v.date || rx.id === v.prescriptionId);
    let rxText = 'None';
    if (matchingRx && matchingRx.medicines && matchingRx.medicines.length > 0) {
      rxText = matchingRx.medicines.map((m) => `${m.name}`).join('\n');
    } else if (patient.prescriptions && patient.prescriptions.length > 0 && index === 0) {
      const latestRx = patient.prescriptions[0];
      rxText = latestRx.medicines.slice(0, 3).map((m) => `${m.name}`).join('\n');
    }

    // 7. Invoice
    const matchingInvoice = patient.invoices?.find((inv) => inv.date === v.date || inv.id === v.invoiceId);
    let invoiceText = '—';
    if (matchingInvoice) {
      const invId = matchingInvoice.id.startsWith('#') ? matchingInvoice.id : `#${matchingInvoice.id}`;
      invoiceText = `${invId}\n₹${matchingInvoice.netTotal.toLocaleString('en-IN')}\n${matchingInvoice.status.toUpperCase()}`;
    } else if (patient.invoices && patient.invoices.length > 0 && index === 0) {
      const latestInv = patient.invoices[0];
      const invId = latestInv.id.startsWith('#') ? latestInv.id : `#${latestInv.id}`;
      invoiceText = `${invId}\n₹${latestInv.netTotal.toLocaleString('en-IN')}\n${latestInv.status.toUpperCase()}`;
    }

    // Measure line wraps for each cell
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);

    const pad = 1.8;
    const splitDate = doc.splitTextToSize(dateText, colWidths.date - pad * 2);
    const splitComplaint = doc.splitTextToSize(complaintText, colWidths.complaint - pad * 2);
    const splitVitals = doc.splitTextToSize(vitalsText, colWidths.vitals - pad * 2);
    const splitFindings = doc.splitTextToSize(findingsText, colWidths.findings - pad * 2);
    const splitPerformed = doc.splitTextToSize(performedText, colWidths.performed - pad * 2);
    const splitRx = doc.splitTextToSize(rxText, colWidths.prescription - pad * 2);
    const splitInvoice = doc.splitTextToSize(invoiceText, colWidths.invoice - pad * 2);

    const maxLines = Math.max(
      splitDate.length,
      splitComplaint.length,
      splitVitals.length,
      splitFindings.length,
      splitPerformed.length,
      splitRx.length,
      splitInvoice.length,
      2
    );

    const lineHeight = 3.2;
    const rowHeight = Math.max(8.5, maxLines * lineHeight + 4);

    checkPageBreak(rowHeight);

    // Row Background (Zebra Striping)
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, cursorY, contentWidth, rowHeight, 'F');
    }

    // Row Border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(margin, cursorY, contentWidth, rowHeight, 'D');

    // Draw Column Separator Lines
    doc.line(colPositions.complaint, cursorY, colPositions.complaint, cursorY + rowHeight);
    doc.line(colPositions.vitals, cursorY, colPositions.vitals, cursorY + rowHeight);
    doc.line(colPositions.findings, cursorY, colPositions.findings, cursorY + rowHeight);
    doc.line(colPositions.performed, cursorY, colPositions.performed, cursorY + rowHeight);
    doc.line(colPositions.prescription, cursorY, colPositions.prescription, cursorY + rowHeight);
    doc.line(colPositions.invoice, cursorY, colPositions.invoice, cursorY + rowHeight);

    // Text Render
    const textStartY = cursorY + 3.2;
    doc.setTextColor(30, 41, 59);

    // Date
    doc.setFont('helvetica', 'bold');
    doc.text(splitDate, colPositions.date + pad, textStartY);

    // Complaint
    doc.setFont('helvetica', 'normal');
    doc.text(splitComplaint, colPositions.complaint + pad, textStartY);

    // Vitals
    doc.text(splitVitals, colPositions.vitals + pad, textStartY);

    // Findings
    doc.text(splitFindings, colPositions.findings + pad, textStartY);

    // Performed
    doc.text(splitPerformed, colPositions.performed + pad, textStartY);

    // Prescription
    doc.text(splitRx, colPositions.prescription + pad, textStartY);

    // Invoice
    doc.setFont('helvetica', 'bold');
    doc.text(splitInvoice, colPositions.invoice + pad, textStartY);

    cursorY += rowHeight;
  });

  // 5. FOOTER & DOCTOR SIGNATURE
  checkPageBreak(22);
  cursorY += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This clinical history summary is digitally authenticated from FABIS MediCare EMR system.', margin, cursorY);
  doc.text(`Report Ref: HIS-${formatPatientId(patient)}-${new Date().getFullYear()}`, margin, cursorY + 3.5);

  // Doctor Signature on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.text(doctor.name || 'Treating Dental Surgeon', pageWidth - margin - 35, cursorY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(doctor.qualifications || 'BDS, MDS • Dental Surgeon', pageWidth - margin - 35, cursorY + 3.5, { align: 'center' });

  return doc.output('blob');
}

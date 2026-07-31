import { jsPDF } from 'jspdf';
import { Invoice, DoctorProfile, Patient } from '../types';
import { formatDate } from './formatters';
import { PrintTemplateConfig, getActiveTemplate } from '../components/PrintDesigner/TemplateStorage';

function hexToRgb(hex: string): [number, number, number] {
  let clean = (hex || '#581C87').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [88, 28, 135];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function formatAmountWithDecimals(num: number): string {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Draws a clean vector Rupee symbol (₹) directly into jsPDF.
 * Guarantees zero broken characters across all devices and PDF viewers.
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

  // Top Horizontal Bar
  doc.line(x, topY, x + width, topY);
  // Middle Horizontal Bar
  doc.line(x, midY, x + width * 0.85, midY);
  // Vertical stem connecting top & middle
  doc.line(x, topY, x, midY + height * 0.12);
  // Curve / loop extension
  doc.line(x, midY + height * 0.12, x + width * 0.65, midY + height * 0.12);
  // Diagonal leg
  doc.line(x + width * 0.15, midY + height * 0.12, x + width * 0.85, botY);

  doc.setLineWidth(oldLineWidth);
}

/**
 * Draws right-aligned currency amount with vector Rupee symbol (₹ [amount]).
 */
function drawRupeeAmountRight(
  doc: jsPDF,
  amountVal: number | string,
  rightX: number,
  y: number,
  fontSize: number = 8.5,
  isBold: boolean = false,
  color: number[] = [0, 0, 0]
) {
  const formattedNum = typeof amountVal === 'number' ? formatAmountWithDecimals(amountVal) : amountVal;

  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

  const numWidth = doc.getTextWidth(formattedNum);
  doc.text(formattedNum, rightX, y, { align: 'right' });

  const symbolHeight = fontSize * 0.28;
  const symbolWidth = symbolHeight * 0.55;
  const gap = 1.0;
  const symbolX = rightX - numWidth - symbolWidth - gap;

  drawRupeeSymbol(doc, symbolX, y, symbolHeight, color);
}

/**
 * Draws table header label like "RATE (₹)" or "AMOUNT (₹)" with vector Rupee symbol
 */
function drawHeaderWithRupeeRight(
  doc: jsPDF,
  baseLabel: string,
  rightX: number,
  y: number,
  fontSize: number = 8.5,
  color: number[] = [255, 255, 255]
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

  const closingParen = ')';
  const closingWidth = doc.getTextWidth(closingParen);

  const symbolHeight = fontSize * 0.28;
  const symbolWidth = symbolHeight * 0.55;
  const openParen = ' (';
  const openWidth = doc.getTextWidth(openParen);
  const baseWidth = doc.getTextWidth(baseLabel);

  const totalWidth = baseWidth + openWidth + symbolWidth + closingWidth;
  const startX = rightX - totalWidth;

  // Draw base text + "("
  doc.text(baseLabel + openParen, startX, y);

  // Draw vector Rupee symbol
  const symbolX = startX + baseWidth + openWidth;
  drawRupeeSymbol(doc, symbolX, y, symbolHeight, color);

  // Draw ")"
  doc.text(closingParen, symbolX + symbolWidth + 0.4, y);
}

function drawToothIcon(
  doc: jsPDF,
  centerX: number,
  centerY: number,
  size: number = 5,
  color: [number, number, number] = [88, 28, 135]
) {
  doc.setFillColor(...color);
  doc.setDrawColor(...color);
  const r = size / 2;
  doc.circle(centerX - r / 2, centerY - r / 3, r / 1.8, 'F');
  doc.circle(centerX + r / 2, centerY - r / 3, r / 1.8, 'F');
  doc.rect(centerX - r / 1.2, centerY - r / 3, r * 1.6, r, 'F');
  doc.triangle(
    centerX - r / 1.2, centerY + r / 3,
    centerX - r / 2.2, centerY + r * 1.1,
    centerX - r / 6, centerY + r / 3,
    'F'
  );
  doc.triangle(
    centerX + r / 6, centerY + r / 3,
    centerX + r / 2.2, centerY + r * 1.1,
    centerX + r / 1.2, centerY + r / 3,
    'F'
  );
}

/**
 * Generates A4 TAX INVOICE using jsPDF matching exact reference design
 */
export function generateInvoiceJsPdf(
  invoice: Invoice,
  doctor: DoctorProfile,
  patient?: Patient | null,
  _customLogoUrl?: string | null
): Blob {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Brand colors matching reference image exactly
  const PURPLE: [number, number, number] = [88, 28, 135]; // #581C87 Deep Rich Purple
  const LIGHT_PURPLE_HEADER: [number, number, number] = [243, 232, 255]; // #F3E8FF
  const CARD_BG: [number, number, number] = [252, 252, 253]; // #FCFCFD
  const BORDER_COLOR: [number, number, number] = [226, 232, 240]; // #E2E8F0
  const TEXT_DARK: [number, number, number] = [15, 23, 42]; // #0F172A
  const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // #64748B
  const ZEBRA_BG: [number, number, number] = [248, 250, 252]; // #F8FAFC

  let currentY = 14;

  // ----------------------------------------------------
  // 1. HEADER SECTION (No FABIS Logo, Left aligned Clinic Info)
  // ----------------------------------------------------
  let headerLeftY = currentY;
  const headerInfoX = margin;

  // Clinic Name (22px / 18pt Bold Purple)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PURPLE);
  doc.text((doctor.clinicName || 'RK DENTAL CLINIC').toUpperCase(), headerInfoX, headerLeftY + 5);

  headerLeftY += 9;

  // Sub-tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('General and Cosmetic Dentistry', headerInfoX, headerLeftY);
  headerLeftY += 5;

  // Contact info list with icons
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const clinicAddr = doctor.clinicAddress || 'Kalavai';
  doc.text(`📍  ${clinicAddr}`, headerInfoX, headerLeftY);
  headerLeftY += 4.2;

  const phoneVal = doctor.clinicPhone || '+91 98765 43210 / 040-23456789';
  doc.text(`📞  ${phoneVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.2;

  const emailVal = doctor.clinicEmail || 'contact@fabismedicare.com';
  doc.text(`✉  ${emailVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.2;

  const websiteVal = doctor.website || 'www.rkdentalclinic.com';
  doc.text(`🌐  ${websiteVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.5;

  // Right Side Header (TAX INVOICE Title & Details List)
  let headerRightY = currentY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PURPLE);
  doc.text('TAX INVOICE', pageWidth - margin, headerRightY + 6, { align: 'right' });

  headerRightY += 12;

  // Meta List
  doc.setFontSize(8.5);

  const metaItems = [
    { label: 'Invoice No.', value: invoice.id || 'INV-2026-101' },
    { label: 'Invoice Date', value: formatDate(invoice.date) || '31 Jul 2026' },
    { label: 'Due Date', value: `${formatDate(invoice.date)} 19:25` },
    { label: 'GSTIN', value: doctor.gstin || '33RKKDENT7890D1Z' },
  ];

  metaItems.forEach((m) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${m.label}`, pageWidth - margin - 52, headerRightY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    doc.text(m.value, pageWidth - margin, headerRightY, { align: 'right' });

    headerRightY += 4.8;
  });

  currentY = Math.max(headerLeftY, headerRightY) + 3;

  // Thick Horizontal Purple Accent Line
  doc.setFillColor(...PURPLE);
  doc.rect(margin, currentY, contentWidth, 1.4, 'F');

  currentY += 7;

  // ----------------------------------------------------
  // 2. PATIENT INFO & INVOICE DETAILS CARDS (Equal Height)
  // ----------------------------------------------------
  const cardWidth = (contentWidth - 10) / 2;
  const cardHeight = 44;

  // LEFT CARD: BILL TO
  const leftCardX = margin;
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(leftCardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  // Header Banner
  doc.setFillColor(...LIGHT_PURPLE_HEADER);
  doc.roundedRect(leftCardX, currentY, cardWidth, 8, 2, 2, 'F');
  doc.rect(leftCardX, currentY + 4, cardWidth, 4, 'F'); // flatten bottom rounded corners

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PURPLE);
  doc.text('👤   BILL TO', leftCardX + 5, currentY + 5.5);

  let pY = currentY + 13;
  doc.setFontSize(8);

  const pDetails = [
    { label: 'Patient Name', value: (invoice.patientName || patient?.name || 'ZAID').toUpperCase(), bold: true },
    { label: 'Patient ID', value: patient?.id || 'PAT-112', bold: false },
    { label: 'Age / Gender', value: [patient?.age ? `${patient.age} Yrs` : '30 Yrs', patient?.gender || 'Male'].filter(Boolean).join(' / '), bold: false },
    { label: 'Mobile Number', value: patient?.phone || '+917418773765', bold: false },
    { label: 'Address', value: patient?.address || '#28 Hakeem abdullah sb street kivisharam, Melvisharam', bold: false },
  ];

  pDetails.forEach((pd) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(pd.label, leftCardX + 5, pY);
    doc.text(':', leftCardX + 28, pY);

    doc.setFont('helvetica', pd.bold ? 'bold' : 'normal');
    doc.setTextColor(...TEXT_DARK);
    
    // Wrap address cleanly if long
    const valWidth = cardWidth - 34;
    const splitVal = doc.splitTextToSize(pd.value, valWidth);
    doc.text(splitVal, leftCardX + 31, pY);

    pY += splitVal.length > 1 ? splitVal.length * 4 : 5.2;
  });

  // RIGHT CARD: INVOICE DETAILS
  const rightCardX = margin + cardWidth + 10;
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(rightCardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  // Header Banner
  doc.setFillColor(...LIGHT_PURPLE_HEADER);
  doc.roundedRect(rightCardX, currentY, cardWidth, 8, 2, 2, 'F');
  doc.rect(rightCardX, currentY + 4, cardWidth, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PURPLE);
  doc.text('📋   INVOICE DETAILS', rightCardX + 5, currentY + 5.5);

  let iY = currentY + 13;
  doc.setFontSize(8);

  // Doctor Name
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Doctor Name', rightCardX + 5, iY);
  doc.text(':', rightCardX + 30, iY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text(doctor.name ? `Dr. ${doctor.name}` : 'Dr. Dr. Alex Mercer', rightCardX + 33, iY);

  iY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  const docQual = doctor.qualifications || 'B.D.S., M.D.S. (Endodontics & Conservative Dentistry)';
  const splitQual = doc.splitTextToSize(docQual, cardWidth - 36);
  doc.text(splitQual, rightCardX + 33, iY);

  iY += splitQual.length * 3.8 + 2.5;

  // Payment Method
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Payment Method', rightCardX + 5, iY);
  doc.text(':', rightCardX + 30, iY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT_DARK);
  doc.text((invoice.paymentMethod || 'UPI').toUpperCase(), rightCardX + 33, iY);

  iY += 6;

  // Payment Status
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Payment Status', rightCardX + 5, iY);
  doc.text(':', rightCardX + 30, iY);

  const statusText = (invoice.status || 'PAID').toUpperCase();
  const badgeWidth = 20;
  const badgeHeight = 5.2;
  doc.setFillColor(...PURPLE);
  doc.roundedRect(rightCardX + 33, iY - 3.8, badgeWidth, badgeHeight, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, rightCardX + 33 + badgeWidth / 2, iY - 0.2, { align: 'center' });

  currentY += cardHeight + 8;

  // ----------------------------------------------------
  // 3. TREATMENTS TABLE
  // ----------------------------------------------------
  const colX = {
    num: margin + 4,
    desc: margin + 18,
    qty: margin + 118,
    rate: margin + 148,
    amount: pageWidth - margin - 4,
  };

  // Table Header Banner
  const tableHeaderHeight = 9.5;
  doc.setFillColor(...PURPLE);
  doc.roundedRect(margin, currentY, contentWidth, tableHeaderHeight, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', colX.num, currentY + 6.2);
  doc.text('TREATMENT / PROCEDURE', colX.desc, currentY + 6.2);
  doc.text('QTY', colX.qty, currentY + 6.2, { align: 'center' });
  drawHeaderWithRupeeRight(doc, 'RATE', colX.rate, currentY + 6.2, 8.5, [255, 255, 255]);
  drawHeaderWithRupeeRight(doc, 'AMOUNT', colX.amount, currentY + 6.2, 8.5, [255, 255, 255]);

  currentY += tableHeaderHeight;
  const tableStartY = currentY;

  // Rows
  const rowHeight = 9.5;
  invoice.items.forEach((item, idx) => {
    const rowY = currentY;

    // Zebra Background
    if (idx % 2 === 1) {
      doc.setFillColor(...ZEBRA_BG);
      doc.rect(margin, rowY, contentWidth, rowHeight, 'F');
    }

    // Row Bottom Border
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight);

    // Text Values
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), colX.num, rowY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_DARK);
    const itemTitle = item.toothNumber ? `${item.description} (Tooth #${item.toothNumber})` : item.description;
    doc.text(itemTitle, colX.desc, rowY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(String(item.quantity || 1), colX.qty, rowY + 6, { align: 'center' });

    const unitPrice = item.unitPrice || (item.totalPrice / (item.quantity || 1));
    drawRupeeAmountRight(doc, unitPrice, colX.rate, rowY + 6, 8.5, false, [71, 85, 105]);
    drawRupeeAmountRight(doc, item.totalPrice, colX.amount, rowY + 6, 8.5, true, TEXT_DARK);

    currentY += rowHeight;
  });

  // Table Outer Box Border
  doc.setDrawColor(...BORDER_COLOR);
  doc.rect(margin, tableStartY, contentWidth, currentY - tableStartY, 'S');

  currentY += 8;

  // ----------------------------------------------------
  // 4. TOTALS CARD (Right Aligned Bordered Box)
  // ----------------------------------------------------
  const totalsWidth = 82;
  const totalsLeftX = pageWidth - margin - totalsWidth;
  const totalsStartY = currentY;

  // Calculations
  const subtotal = invoice.subtotal || invoice.items.reduce((acc, i) => acc + i.totalPrice, 0);
  const discount = invoice.discountAmount || 0;
  const tax = invoice.taxAmount || 0;
  const paid = invoice.paidAmount || 0;
  const balance = invoice.balanceDue || 0;
  const grandTotal = invoice.netTotal || subtotal - discount + tax;

  let totY = totalsStartY + 6;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Subtotal', totalsLeftX + 5, totY);
  drawRupeeAmountRight(doc, subtotal, pageWidth - margin - 5, totY, 8.5, true, TEXT_DARK);
  totY += 5.5;

  // Discount
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Discount', totalsLeftX + 5, totY);
  drawRupeeAmountRight(doc, discount, pageWidth - margin - 5, totY, 8.5, true, TEXT_DARK);
  totY += 5.5;

  // Tax / GST
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Tax / GST (Exempted)', totalsLeftX + 5, totY);
  drawRupeeAmountRight(doc, tax, pageWidth - margin - 5, totY, 8.5, true, TEXT_DARK);
  totY += 6;

  // Divider Line inside Totals
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(totalsLeftX + 4, totY - 1, pageWidth - margin - 4, totY - 1);
  totY += 2;

  // Paid Amount
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Paid Amount', totalsLeftX + 5, totY);
  drawRupeeAmountRight(doc, paid, pageWidth - margin - 5, totY, 8.5, true, TEXT_DARK);
  totY += 5.5;

  // Balance Amount
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Balance Amount', totalsLeftX + 5, totY);
  drawRupeeAmountRight(doc, balance, pageWidth - margin - 5, totY, 8.5, true, balance > 0 ? [220, 38, 38] : TEXT_DARK);
  totY += 6.5;

  // GRAND TOTAL Banner (Solid Purple)
  doc.setFillColor(...PURPLE);
  doc.roundedRect(totalsLeftX, totY, totalsWidth, 10, 0, 0, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL', totalsLeftX + 5, totY + 6.5);
  drawRupeeAmountRight(doc, grandTotal, pageWidth - margin - 5, totY + 6.5, 10, true, [255, 255, 255]);

  totY += 10;

  // Draw Totals Box Outline
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(totalsLeftX, totalsStartY, totalsWidth, totY - totalsStartY, 2, 2, 'S');

  // ----------------------------------------------------
  // 5. FOOTER SECTION
  // ----------------------------------------------------
  const footerY = pageHeight - 28;

  // Thin Divider
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Small Tooth Icon in Center
  drawToothIcon(doc, pageWidth / 2, footerY, 3, PURPLE);

  let footTextY = footerY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PURPLE);
  doc.text('Thank you for choosing RK Dental Clinic.', pageWidth / 2, footTextY, { align: 'center' });

  footTextY += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_MUTED);
  doc.text('This is a computer-generated invoice and does not require a physical signature.', pageWidth / 2, footTextY, { align: 'center' });

  footTextY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PURPLE);
  doc.text('Thank you!', pageWidth / 2, footTextY, { align: 'center' });

  return doc.output('blob');
}

/**
 * Generates 80MM POS THERMAL RECEIPT using jsPDF matching exact reference design
 */
export function generateInvoiceThermalJsPdf(
  invoice: Invoice,
  doctor: DoctorProfile,
  patient?: Patient | null,
  _customLogoUrl?: string | null
): Blob {
  const margin = 4;
  const contentWidth = 72; // 80 - 4*2
  const centerX = 40;
  const rightX = 76;
  const maxDescWidth = 46; // max width for procedure name so amount doesn't overlap

  // 1. Prepare strings
  const clinicName = (doctor.clinicName || 'RK DENTAL CLINIC').toUpperCase();
  const address = doctor.clinicAddress || 'No.10/1 School street, near police station, Kalavai 632506';
  const phoneStr = `Ph: +91 ${doctor.clinicPhone || '8883261285'}`;
  const invTimeStr = '13:55';
  const dateStr = `Date: ${formatDate(invoice.date)} ${invTimeStr}`;
  const invIdStr = invoice.id;
  const patientNameStr = `Patient: ${invoice.patientName || patient?.name || 'ZAID'}`;
  const patientPhoneStr = `Ph: ${patient?.phone || '7418773765'}`;

  // 2. Measure wrapped text lines with a dummy doc to determine exact compact height
  const measureDoc = new jsPDF({ unit: 'mm', format: [80, 500] });
  measureDoc.setFont('helvetica', 'normal');
  measureDoc.setFontSize(7.5);
  const wrappedAddr = measureDoc.splitTextToSize(address, contentWidth);

  let calcY = 5; // top margin

  calcY += 4.5; // Clinic Name
  calcY += wrappedAddr.length * 3.2 + 0.5; // Address
  calcY += 3.2; // Phone
  calcY += 3.0; // Divider 1

  calcY += 3.5; // Date & Inv ID
  calcY += 3.2; // Patient & Phone
  calcY += 3.0; // Divider 2

  calcY += 3.5; // PROCEDURE & AMOUNT header
  calcY += 3.0; // Divider 3

  // Measure items
  measureDoc.setFontSize(8.5);
  invoice.items.forEach((item) => {
    const itemDesc = item.toothNumber ? `${item.description} (#${item.toothNumber})` : item.description;
    const descLines = measureDoc.splitTextToSize(itemDesc, maxDescWidth);
    calcY += Math.max(1, descLines.length) * 3.8 + 0.8;
  });
  calcY += 3.0; // Divider 4

  calcY += 4.2; // GRAND TOTAL
  calcY += 3.0; // Divider 5

  calcY += 5.2; // Payment Mode
  calcY += 3.5; // Divider 6

  calcY += 3.8; // THANK YOU FOR YOUR VISIT!
  calcY += 3.2; // Keep smiling.
  calcY += 4.0; // Bottom margin

  const receiptHeight = Math.ceil(calcY);

  // 3. Create actual jsPDF with EXACT dynamic height (No wasted blank paper)
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, receiptHeight],
  });

  const drawDottedLine = (y: number) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(margin, y, rightX, y);
    doc.setLineDashPattern([], 0);
  };

  let currentY = 5;

  // Header - Clinic Name (Centered, Bold)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(clinicName, centerX, currentY, { align: 'center' });
  currentY += 4.5;

  // Address (Centered)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(wrappedAddr, centerX, currentY, { align: 'center' });
  currentY += wrappedAddr.length * 3.2 + 0.5;

  // Phone (Centered)
  doc.text(phoneStr, centerX, currentY, { align: 'center' });
  currentY += 3.2;

  // Divider 1
  drawDottedLine(currentY);
  currentY += 3.0;

  // Invoice Info (2 columns)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(invIdStr, rightX, currentY, { align: 'right' });
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.text(patientNameStr, margin, currentY);
  doc.text(patientPhoneStr, rightX, currentY, { align: 'right' });
  currentY += 3.2;

  // Divider 2
  drawDottedLine(currentY);
  currentY += 3.0;

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PROCEDURE', margin, currentY);
  doc.text('AMOUNT', rightX, currentY, { align: 'right' });
  currentY += 3.5;

  // Divider 3
  drawDottedLine(currentY);
  currentY += 3.0;

  // Procedure Items
  invoice.items.forEach((item) => {
    const itemDesc = item.toothNumber ? `${item.description} (#${item.toothNumber})` : item.description;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const descLines = doc.splitTextToSize(itemDesc, maxDescWidth);

    // Draw item description (wrapped cleanly)
    doc.text(descLines, margin, currentY);

    // Draw right-aligned amount without Rupee symbol (matches reference image)
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmountWithDecimals(item.totalPrice), rightX, currentY, { align: 'right' });

    currentY += Math.max(1, descLines.length) * 3.8 + 0.8;
  });

  // Divider 4
  drawDottedLine(currentY);
  currentY += 3.0;

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('GRAND TOTAL', margin, currentY);

  drawRupeeAmountRight(doc, invoice.netTotal, rightX, currentY, 10, true);
  currentY += 4.2;

  // Divider 5
  drawDottedLine(currentY);
  currentY += 3.0;

  // Payment Mode Box
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Payment Mode', margin, currentY + 1.2);

  const payMode = (invoice.paymentMethod || 'CASH').toUpperCase();
  const boxWidth = 24;
  const boxHeight = 5.2;
  const boxX = rightX - boxWidth;
  const boxY = currentY - 2.2;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(boxX, boxY, boxWidth, boxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(payMode, boxX + boxWidth / 2, boxY + 3.6, { align: 'center' });
  currentY += 5.2;

  // Divider 6
  drawDottedLine(currentY);
  currentY += 3.8;

  // Footer Message (Centered)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('THANK YOU FOR YOUR VISIT!', centerX, currentY, { align: 'center' });
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Keep smiling.', centerX, currentY, { align: 'center' });

  return doc.output('blob');
}

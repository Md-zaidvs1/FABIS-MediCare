import { jsPDF } from 'jspdf';
import { Invoice, InvoiceItem, DoctorProfile, Patient } from '../types';
import { formatDate, formatPatientId } from './formatters';
import { PrintTemplateConfig, getActiveTemplate, CanvasElement } from '../components/PrintDesigner/TemplateStorage';

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
 * Renders mapped dynamic canvas elements onto jsPDF when a PNG template background is present.
 * Skips any element marked `hidden: true` so pre-printed artwork (headers, logos) is preserved without duplicate text.
 */
function renderCustomMappedElementsInPdf(
  doc: jsPDF,
  elements: CanvasElement[],
  invoice: Invoice,
  doctor: DoctorProfile,
  patient?: Patient | null,
  pageWidth: number = 210,
  pageHeight: number = 297,
  templateConfig?: PrintTemplateConfig
): boolean {
  if (!elements || elements.length === 0) return false;

  let count = 0;
  elements.forEach((el) => {
    if (el.hidden) return; // Omit hidden fields to avoid duplicate artwork

    count++;
    const x_mm = (el.x / 100) * pageWidth;
    const y_mm = (el.y / 100) * pageHeight;
    const width_mm = (el.width / 100) * pageWidth;

    doc.setFont('helvetica', el.bold ? 'bold' : 'normal');
    doc.setFontSize(el.fontSize || 10);
    const rgb = hexToRgb(el.color || '#000000');
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    if (el.type === 'barcode' || el.fieldKey === 'barcode' || el.id === 'el_barcode') {
      // Barcode removed completely for thermal receipts as per user request
      if (pageWidth <= 100) return;

      const invIdStr = invoice.id || 'INV-0001';
      const barcodeWidth = Math.min(24, width_mm || 20);
      const barcodeX = (el.textAlign === 'center') ? x_mm + (width_mm - barcodeWidth) / 2 : x_mm;
      const barcodeHeight = 6;
      const pattern = [2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 1, 2, 3, 2, 1, 4, 1, 2];
      let curX = barcodeX;
      doc.setFillColor(0, 0, 0);
      pattern.forEach((w) => {
        const lineW = w * 0.35;
        doc.rect(curX, y_mm, lineW, barcodeHeight, 'F');
        curX += lineW + 0.5;
      });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(7, (el.fontSize || 8)));
      doc.text(invIdStr, barcodeX + barcodeWidth / 2, y_mm + barcodeHeight + 2.5, { align: 'center' });
      return;
    }

    if (el.type === 'shape' || el.shapeType === 'divider') {
      doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([0.8, 0.8], 0);
      doc.line(x_mm, y_mm, x_mm + width_mm, y_mm);
      doc.setLineDashPattern([], 0);
      return;
    }

    if (el.type === 'table' || el.fieldKey === 'treatment') {
      const items = invoice.items || [];
      let curY = y_mm;
      const isThermal = pageWidth <= 100;

      if (isThermal) {
        // 80mm POS Thermal Receipt Table Format
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.max(7.5, (el.fontSize || 8)));
        doc.text('PROCEDURE', x_mm, curY);
        doc.text('AMOUNT', x_mm + width_mm, curY, { align: 'right' });
        curY += 3.5;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([0.8, 0.8], 0);
        doc.line(x_mm, curY, x_mm + width_mm, curY);
        doc.setLineDashPattern([], 0);
        curY += 3.0;

        const rows = items.length > 0 ? items : [{ id: '1', description: 'Dental Consultation', quantity: 1, unitPrice: 200, totalPrice: 200 }];
        rows.forEach((item) => {
          const itemDesc = (item as any).toothNumber ? `${item.description} (#${(item as any).toothNumber})` : item.description;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(Math.max(7.5, (el.fontSize || 8)));
          const maxDescW = width_mm - 22;
          const descLines = doc.splitTextToSize(itemDesc, maxDescW);

          doc.text(descLines, x_mm, curY);
          doc.setFont('helvetica', 'bold');
          doc.text(`Rs. ${formatAmountWithDecimals(item.totalPrice || 0)}`, x_mm + width_mm, curY, { align: 'right' });

          curY += Math.max(1, descLines.length) * 3.5 + 1.0;
        });
      } else {
        // A4 Paper Table Format
        const rowHeight = 7;
        doc.setFillColor(88, 28, 135);
        doc.roundedRect(x_mm, curY, width_mm, rowHeight, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(Math.max(7, (el.fontSize || 10) - 1));
        doc.setTextColor(255, 255, 255);

        doc.text('#', x_mm + 2, curY + 4.8);
        doc.text('PROCEDURE / TREATMENT', x_mm + 12, curY + 4.8);
        doc.text('QTY', x_mm + width_mm - 40, curY + 4.8, { align: 'center' });
        doc.text('AMOUNT', x_mm + width_mm - 2, curY + 4.8, { align: 'right' });

        curY += rowHeight + 1;

        const rows = items.length > 0 ? items : [{ id: '1', description: 'Dental Consultation', quantity: 1, unitPrice: 200, totalPrice: 200 }];
        rows.forEach((item, idx) => {
          if (idx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(x_mm, curY, width_mm, rowHeight, 'F');
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(Math.max(7, (el.fontSize || 10) - 2));
          doc.setTextColor(15, 23, 42);

          doc.text((idx + 1).toString(), x_mm + 2, curY + 4.8);
          doc.text(item.description || 'Treatment', x_mm + 12, curY + 4.8);
          doc.text((item.quantity || 1).toString(), x_mm + width_mm - 40, curY + 4.8, { align: 'center' });
          doc.text(`Rs. ${formatAmountWithDecimals(item.totalPrice || 0)}`, x_mm + width_mm - 2, curY + 4.8, { align: 'right' });

          curY += rowHeight;
        });
      }
      return;
    }

    let textStr = el.content || '';
    if (el.fieldKey === 'patient_name') {
      const val = invoice.patientName || patient?.name || '';
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'mrn') {
      const val = patient?.mrn || patient?.id || invoice.patientId || '';
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'appointment_date') {
      const val = formatDate(invoice.date) || '';
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'invoice_number') {
      const val = invoice.id || '';
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'grand_total') {
      const val = `Rs. ${formatAmountWithDecimals(invoice.netTotal || 0)}`;
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'payment_method') {
      const val = (templateConfig?.paymentModeOverride || invoice.paymentMethod || 'CARD').toUpperCase();
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'clinic_name') {
      textStr = templateConfig?.clinicNameOverride || doctor.clinicName || 'RK DENTAL CLINIC';
    } else if (el.fieldKey === 'clinic_address') {
      textStr = templateConfig?.clinicAddressOverride || doctor.clinicAddress || 'Kalavai 632506';
    } else if (el.fieldKey === 'clinic_phone') {
      const p = templateConfig?.clinicPhoneOverride || doctor.clinicPhone || '+91 8883261285';
      textStr = p.startsWith('Ph:') ? p : `Ph: ${p}`;
    } else if (el.fieldKey === 'clinic_email') {
      textStr = doctor.clinicEmail || 'contact@fabismedicare.com';
    } else if (el.fieldKey === 'website') {
      textStr = doctor.website || 'www.rkdentalclinic.com';
    } else if (el.fieldKey === 'doctor_name') {
      textStr = doctor.name ? `Dr. ${doctor.name}` : '';
    } else if (el.fieldKey === 'doctor_reg_no') {
      textStr = doctor.regNumber ? `Reg: ${doctor.regNumber}` : '';
    } else if (el.fieldKey === 'mobile') {
      const val = patient?.phone || '';
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'paid_amount') {
      const val = `Rs. ${formatAmountWithDecimals(invoice.paidAmount || 0)}`;
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'balance_due') {
      const val = `Rs. ${formatAmountWithDecimals(invoice.balanceDue || (invoice as any).balance || 0)}`;
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'subtotal') {
      const val = `Rs. ${formatAmountWithDecimals(invoice.subtotal || 0)}`;
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'discount_amount' || el.fieldKey === 'discount') {
      const val = `Rs. ${formatAmountWithDecimals(invoice.discountAmount || (invoice as any).discount || 0)}`;
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'tax_amount' || el.fieldKey === 'tax') {
      const val = `Rs. ${formatAmountWithDecimals(invoice.taxAmount || (invoice as any).tax || 0)}`;
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'patient_age_gender') {
      const val = patient ? `${patient.age || ''} Yrs / ${patient.gender || ''}` : '';
      textStr = el.labelOverride ? `${el.labelOverride}: ${val}` : val;
    } else if (el.fieldKey === 'doctor_qualifications') {
      textStr = doctor.qualifications || '';
    } else if (el.fieldKey === 'clinic_gst') {
      textStr = doctor.gstin ? `GST: ${doctor.gstin}` : doctor.regNumber ? `Reg: ${doctor.regNumber}` : 'GST #: 36ABCDE1234F1Z5';
    } else if (el.fieldKey === 'thank_you_message') {
      textStr = templateConfig?.thankYouMessage || el.content || 'THANK YOU FOR YOUR VISIT!';
    } else if (el.fieldKey === 'custom_notes') {
      textStr = templateConfig?.footerText || el.content || 'Keep smiling.';
    }

    if (!textStr) return;

    const alignOpt = (el.textAlign as 'left' | 'center' | 'right') || 'left';
    let drawX = x_mm;
    if (alignOpt === 'center') drawX = x_mm + width_mm / 2;
    else if (alignOpt === 'right') drawX = x_mm + width_mm;

    doc.text(textStr, drawX, y_mm, { align: alignOpt });
  });

  return count > 0;
}

/**
 * Generates A4 TAX INVOICE using jsPDF matching exact reference design
 */
export function generateInvoiceJsPdf(
  invoice: Invoice,
  doctor: DoctorProfile,
  patient?: Patient | null,
  _customLogoUrl?: string | null,
  templateConfig?: PrintTemplateConfig
): Blob {
  const activeA4Config = templateConfig || getActiveTemplate('invoice_a4');
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Check if saved active template has a background PNG image uploaded
  const hasCustomPngTemplate = Boolean(
    activeA4Config &&
    activeA4Config.backgroundImageUrl &&
    activeA4Config.backgroundImageUrl.trim().length > 0
  );

  if (hasCustomPngTemplate && activeA4Config) {
    try {
      doc.addImage(activeA4Config.backgroundImageUrl!, 'PNG', 0, 0, pageWidth, pageHeight);
    } catch (err) {
      console.error('Error rendering background PNG image in A4 PDF:', err);
    }

    if (activeA4Config.elements && activeA4Config.elements.length > 0) {
      const rendered = renderCustomMappedElementsInPdf(
        doc,
        activeA4Config.elements,
        invoice,
        doctor,
        patient,
        pageWidth,
        pageHeight
      );
      if (rendered) {
        return doc.output('blob');
      }
    }
  }

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
  doc.text(`Address: ${clinicAddr}`, headerInfoX, headerLeftY);
  headerLeftY += 4.2;

  const phoneVal = doctor.clinicPhone || '+91 98765 43210 / 040-23456789';
  doc.text(`Phone: ${phoneVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.2;

  const emailVal = doctor.clinicEmail || 'contact@fabismedicare.com';
  doc.text(`Email: ${emailVal}`, headerInfoX, headerLeftY);
  headerLeftY += 4.2;

  const websiteVal = doctor.website || 'www.rkdentalclinic.com';
  doc.text(`Website: ${websiteVal}`, headerInfoX, headerLeftY);
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
  doc.text('BILL TO', leftCardX + 5, currentY + 5.5);

  let pY = currentY + 13;
  doc.setFontSize(8);

  const pDetails = [
    { label: 'Patient Name', value: (invoice.patientName || patient?.name || 'ZAID').toUpperCase(), bold: true },
    { label: 'Patient ID', value: formatPatientId(patient || invoice.patientId) || 'RK881', bold: false },
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
  doc.text('INVOICE DETAILS', rightCardX + 5, currentY + 5.5);

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
  _customLogoUrl?: string | null,
  templateConfig?: PrintTemplateConfig
): Blob {
  const activeThermalConfig = templateConfig || getActiveTemplate('receipt_80mm');

  // 1. Roll Width, Paper Saver & Margin Configuration
  const paperWidth = activeThermalConfig?.paperWidthMm || 80;
  const isPaperSaver = activeThermalConfig?.paperSaverMode === true;

  // Tight, paper-conserving top & bottom margins (2.5mm) to minimize roll paper waste
  const topMargin = 2.5;
  const bottomMargin = 2.5;
  const margin = activeThermalConfig?.marginMm ?? (isPaperSaver ? 2.5 : 3.5);
  const contentWidth = paperWidth - margin * 2;
  const centerX = paperWidth / 2;
  const rightX = paperWidth - margin;
  const maxDescWidth = contentWidth - (paperWidth === 58 ? 16 : 24);

  // 2. Font Text Size Scaling & Proportional Line Height (line-height)
  const fontScaleSetting = activeThermalConfig?.fontSizeScale || 'standard';
  let fontMultiplier = 1.0;
  if (fontScaleSetting === 'compact') fontMultiplier = 0.88;
  if (fontScaleSetting === 'large') fontMultiplier = 1.12;
  if (fontScaleSetting === 'xlarge') fontMultiplier = 1.25;

  const headerFontSize = Math.round(11 * fontMultiplier * 10) / 10;
  const bodyFontSize = Math.round(8.5 * fontMultiplier * 10) / 10;
  const tableHeaderFontSize = Math.round(8.5 * fontMultiplier * 10) / 10;
  const grandTotalFontSize = Math.round(10 * fontMultiplier * 10) / 10;

  // 3. Line Spacing & Line-Height Helper
  const spacingSetting = activeThermalConfig?.lineSpacing || 'normal';
  let gapMultiplier = 1.0;
  if (spacingSetting === 'tight') gapMultiplier = 0.85;
  if (spacingSetting === 'relaxed') gapMultiplier = 1.2;
  if (spacingSetting === 'spacious') gapMultiplier = 1.35;

  if (isPaperSaver) {
    gapMultiplier *= 0.88;
  }

  // Proper Line Height (mm) calculated directly from font size (pt) to prevent overlapping & provide clean vertical breathing room
  const getLineHeight = (fontSizePt: number) => {
    // 1 pt = 0.352778 mm. Line height factor = 1.35 * gapMultiplier
    const baseMm = fontSizePt * 0.352778 * 1.35 * gapMultiplier;
    return Math.max(2.6, Math.round(baseMm * 100) / 100);
  };

  const dividerTopPad = Math.max(1.8, Math.round(2.2 * gapMultiplier * 10) / 10);
  const dividerBottomPad = Math.max(3.2, Math.round(3.8 * gapMultiplier * 10) / 10);
  const totalDividerStep = dividerTopPad + dividerBottomPad;

  // 4. Prepare strings with template overrides
  const rawClinicName = (
    activeThermalConfig?.clinicNameOverride || doctor.clinicName || 'RK DENTAL CLINIC'
  ).toUpperCase();
  const address =
    activeThermalConfig?.clinicAddressOverride ||
    doctor.clinicAddress ||
    'No.10/1 School street, near police station, Kalavai 632506';
  const phoneStr = `Ph: ${activeThermalConfig?.clinicPhoneOverride || doctor.clinicPhone || '+91 8883261285'}`;
  const invIdStr = activeThermalConfig?.barcodeText || invoice.id || 'RK-20260717-0001';
  const dateStr = `Date: ${formatDate(invoice.date)}`;
  const patientNameStr = `${invoice.patientName || patient?.name || 'ZAID'}`;
  const patientPhoneStr = `${patient?.phone || (invoice as any).patientPhone || '7418773765'}`;

  const itemsToRender: InvoiceItem[] = invoice.items && invoice.items.length > 0 ? invoice.items : [
    { id: '1', description: 'Dental Consultation', totalPrice: 200, quantity: 1, unitPrice: 200 },
    { id: '2', description: 'Surgical / Impacted Extraction', totalPrice: 2500, quantity: 1, unitPrice: 2500 },
    { id: '3', description: 'Single Tooth Extraction', totalPrice: 500, quantity: 1, unitPrice: 500 },
  ];

  const subtotal = invoice.subtotal || itemsToRender.reduce((s: number, i: InvoiceItem) => s + (i.totalPrice || 0), 0);
  const discount = (invoice as any).discount || invoice.discountAmount || 0;
  const tax = (invoice as any).tax || invoice.taxAmount || 0;
  const grandTotalVal = invoice.netTotal || (subtotal - discount + tax);
  const paidVal = invoice.paidAmount || grandTotalVal;
  const balanceVal = (invoice as any).balance || invoice.balanceDue || Math.max(0, grandTotalVal - paidVal);

  // 5. Measure wrapped text lines for exact minimum paper length height calculation
  const measureDoc = new jsPDF({ unit: 'mm', format: [paperWidth, 800] });

  measureDoc.setFont('helvetica', 'bold');
  measureDoc.setFontSize(headerFontSize);
  const clinicNameLines: string[] = measureDoc.splitTextToSize(rawClinicName, contentWidth);

  measureDoc.setFont('helvetica', 'normal');
  measureDoc.setFontSize(bodyFontSize);
  const wrappedAddr: string[] = measureDoc.splitTextToSize(address, contentWidth);
  const wrappedPhone: string[] = measureDoc.splitTextToSize(phoneStr, contentWidth);

  let calcY = topMargin;

  // Header Section - Center-aligned
  if (activeThermalConfig?.showClinicName !== false) {
    calcY += clinicNameLines.length * getLineHeight(headerFontSize);
  }
  if (activeThermalConfig?.showClinicAddress !== false) {
    calcY += wrappedAddr.length * getLineHeight(bodyFontSize);
  }
  if (activeThermalConfig?.showClinicPhone !== false) {
    calcY += wrappedPhone.length * getLineHeight(bodyFontSize);
  }
  calcY += totalDividerStep; // Divider 1

  // Meta Info
  calcY += getLineHeight(bodyFontSize); // Date & Invoice ID
  calcY += getLineHeight(bodyFontSize); // Patient Name & Phone
  calcY += totalDividerStep; // Divider 2

  // Table Header
  calcY += getLineHeight(tableHeaderFontSize); // PROCEDURE & AMOUNT
  calcY += totalDividerStep; // Divider 3

  // Items
  measureDoc.setFont('helvetica', 'normal');
  measureDoc.setFontSize(bodyFontSize);
  itemsToRender.forEach((item) => {
    const itemDesc = (item as any).toothNumber ? `${item.description} (#${(item as any).toothNumber})` : item.description;
    const descLines = measureDoc.splitTextToSize(itemDesc, maxDescWidth);
    calcY += Math.max(1, descLines.length) * getLineHeight(bodyFontSize) + (isPaperSaver ? 0.6 : 1.0);
  });
  calcY += totalDividerStep; // Divider 4

  // Totals breakdown (Subtotal, Discount, Tax)
  if (discount > 0 || tax > 0) {
    calcY += getLineHeight(bodyFontSize); // Subtotal
    if (discount > 0) calcY += getLineHeight(bodyFontSize);
    if (tax > 0) calcY += getLineHeight(bodyFontSize);
  }

  // Extra vertical spacing above Grand Total
  calcY += (isPaperSaver ? 1.5 : 2.2);

  // Grand Total
  calcY += getLineHeight(grandTotalFontSize);

  // 1. Paid Amount row deleted completely! Only show Balance Due if balance > 0
  if (balanceVal > 0) {
    calcY += getLineHeight(bodyFontSize);
  }

  calcY += totalDividerStep; // Divider 5

  // Payment Mode Box
  if (activeThermalConfig?.showPaymentMode !== false) {
    calcY += isPaperSaver ? 4.8 : 5.5; // Payment Mode box height
    calcY += totalDividerStep; // Divider 6
  }

  // Footer Message - Center-aligned
  if (activeThermalConfig?.showThankYou !== false) {
    calcY += getLineHeight(headerFontSize - 1);
  }

  if (activeThermalConfig?.showFooter !== false) {
    calcY += getLineHeight(bodyFontSize);
  }

  // 3. Barcode and barcode number below it removed completely!

  // 4. Small bottom margin to avoid paper waste
  calcY += bottomMargin;

  // 5. Ensure minimum paper length without cutting content
  const receiptHeight = Math.ceil((calcY + 0.5) * 10) / 10;

  // 6. Create jsPDF document with exact minimal height
  const doc = new jsPDF({
    unit: 'mm',
    format: [paperWidth, receiptHeight],
  });

  if (activeThermalConfig) {
    if (activeThermalConfig.backgroundImageUrl && activeThermalConfig.backgroundImageUrl.trim().length > 0) {
      try {
        doc.addImage(activeThermalConfig.backgroundImageUrl, 'PNG', 0, 0, paperWidth, receiptHeight);
      } catch (err) {
        console.error('Error rendering background PNG image in Thermal PDF:', err);
      }
    }

    if (activeThermalConfig.elements && activeThermalConfig.elements.length > 0 && activeThermalConfig.backgroundImageUrl && activeThermalConfig.backgroundImageUrl.trim().length > 0) {
      const rendered = renderCustomMappedElementsInPdf(
        doc,
        activeThermalConfig.elements,
        invoice,
        doctor,
        patient,
        paperWidth,
        receiptHeight,
        activeThermalConfig
      );
      if (rendered) {
        return doc.output('blob');
      }
    }
  }

  const drawDottedLine = (y: number) => {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    if (activeThermalConfig?.dividerStyle === 'solid') {
      doc.line(margin, y, rightX, y);
    } else if (activeThermalConfig?.dividerStyle === 'dashed') {
      doc.setLineDashPattern([2, 1], 0);
      doc.line(margin, y, rightX, y);
      doc.setLineDashPattern([], 0);
    } else if (activeThermalConfig?.dividerStyle === 'double') {
      doc.line(margin, y, rightX, y);
      doc.line(margin, y + 0.6, rightX, y + 0.6);
    } else {
      doc.setLineDashPattern([0.7, 0.7], 0);
      doc.line(margin, y, rightX, y);
      doc.setLineDashPattern([], 0);
    }
  };

  let currentY = topMargin + getLineHeight(headerFontSize) * 0.75;

  const renderDivider = () => {
    currentY += dividerTopPad;
    drawDottedLine(currentY);
    currentY += dividerBottomPad;
  };

  // Header - Center-aligned Clinic Name with proper line spacing
  if (activeThermalConfig?.showClinicName !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(headerFontSize);
    doc.setTextColor(0, 0, 0);
    clinicNameLines.forEach((line) => {
      doc.text(line, centerX, currentY, { align: 'center' });
      currentY += getLineHeight(headerFontSize);
    });
  }

  // Header - Center-aligned Address with proper line spacing
  if (activeThermalConfig?.showClinicAddress !== false) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    wrappedAddr.forEach((line) => {
      doc.text(line, centerX, currentY, { align: 'center' });
      currentY += getLineHeight(bodyFontSize);
    });
  }

  // Header - Center-aligned Phone with proper line spacing
  if (activeThermalConfig?.showClinicPhone !== false) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    wrappedPhone.forEach((line) => {
      doc.text(line, centerX, currentY, { align: 'center' });
      currentY += getLineHeight(bodyFontSize);
    });
  }

  // Divider 1
  renderDivider();

  // Invoice & Patient Details
  doc.setFontSize(bodyFontSize);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(invIdStr, rightX, currentY, { align: 'right' });
  currentY += getLineHeight(bodyFontSize);

  doc.setFont('helvetica', 'normal');
  doc.text(`Patient: ${patientNameStr}`, margin, currentY);
  if (patientPhoneStr) {
    doc.text(`Ph: ${patientPhoneStr}`, rightX, currentY, { align: 'right' });
  }
  currentY += getLineHeight(bodyFontSize);

  // Divider 2
  renderDivider();

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tableHeaderFontSize);
  doc.text('PROCEDURE', margin, currentY);
  doc.text('AMOUNT', rightX, currentY, { align: 'right' });
  currentY += getLineHeight(tableHeaderFontSize);

  // Divider 3
  renderDivider();

  // Procedure Items
  itemsToRender.forEach((item) => {
    const itemDesc = (item as any).toothNumber ? `${item.description} (#${(item as any).toothNumber})` : item.description;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    const descLines = doc.splitTextToSize(itemDesc, maxDescWidth);

    doc.text(descLines, margin, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text(formatAmountWithDecimals(item.totalPrice), rightX, currentY, { align: 'right' });

    currentY += Math.max(1, descLines.length) * getLineHeight(bodyFontSize) + (isPaperSaver ? 0.6 : 1.0);
  });

  // Divider 4
  renderDivider();

  // Subtotal & Adjustments if present
  if (discount > 0 || tax > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    doc.text('Subtotal', margin, currentY);
    doc.text(formatAmountWithDecimals(subtotal), rightX, currentY, { align: 'right' });
    currentY += getLineHeight(bodyFontSize);

    if (discount > 0) {
      doc.text('Discount', margin, currentY);
      doc.text(`-${formatAmountWithDecimals(discount)}`, rightX, currentY, { align: 'right' });
      currentY += getLineHeight(bodyFontSize);
    }

    if (tax > 0) {
      doc.text('Tax / GST', margin, currentY);
      doc.text(formatAmountWithDecimals(tax), rightX, currentY, { align: 'right' });
      currentY += getLineHeight(bodyFontSize);
    }
  }

  // Extra vertical spacing above Grand Total
  currentY += (isPaperSaver ? 1.5 : 2.2);

  // Grand Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(grandTotalFontSize);
  doc.text('GRAND TOTAL', margin, currentY);
  drawRupeeAmountRight(doc, grandTotalVal, rightX, currentY, grandTotalFontSize, true, [0, 0, 0]);
  currentY += getLineHeight(grandTotalFontSize);

  // 1. Paid Amount row deleted completely! Only render Balance Due if balance > 0
  if (balanceVal > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(bodyFontSize);
    doc.text('Balance Due', margin, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(formatAmountWithDecimals(balanceVal), rightX, currentY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    currentY += getLineHeight(bodyFontSize);
  }

  // Divider 5
  renderDivider();

  // Payment Mode Box
  if (activeThermalConfig?.showPaymentMode !== false) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    doc.text('Payment Mode', margin, currentY + 1.2);

    const payMode = (activeThermalConfig?.paymentModeOverride || invoice.paymentMethod || 'CARD').toUpperCase();
    const boxWidth = paperWidth === 58 ? 18 : 22;
    const boxHeight = isPaperSaver ? 4.5 : 5.2;
    const boxX = rightX - boxWidth;
    const boxY = currentY - (isPaperSaver ? 1.8 : 2.2);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(boxX, boxY, boxWidth, boxHeight);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(bodyFontSize);
    doc.text(payMode, boxX + boxWidth / 2, boxY + (isPaperSaver ? 3.1 : 3.6), { align: 'center' });
    currentY += isPaperSaver ? 4.5 : 5.5;

    // Divider 6
    renderDivider();
  }

  // Footer Message - Center-aligned
  if (activeThermalConfig?.showThankYou !== false) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.round((headerFontSize - 2) * 10) / 10);
    doc.text(activeThermalConfig?.thankYouMessage || 'THANK YOU FOR YOUR VISIT!', centerX, currentY, { align: 'center' });
    currentY += getLineHeight(headerFontSize - 1);
  }

  if (activeThermalConfig?.showFooter !== false) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(bodyFontSize);
    doc.text(activeThermalConfig?.footerText || 'Keep smiling.', centerX, currentY, { align: 'center' });
    currentY += getLineHeight(bodyFontSize);
  }

  // 3. Barcode & Barcode number below it removed completely as requested.

  return doc.output('blob');
}

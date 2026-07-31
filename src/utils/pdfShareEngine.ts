import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface SharePdfOptions {
  pdfBlob: Blob;
  fileName: string;
  title: string;
  text: string;
  patientMobile: string;
}

/**
 * Native PDF Sharing Engine:
 * 1. Converts PDF Blob to File Object.
 * 2. If navigator.canShare({ files: [file] }) is supported (iOS / Android / iPadOS), opens native Share sheet.
 * 3. Fallback (Desktop/Laptop):
 *    - Auto-downloads the PDF locally.
 *    - Copies formatted text message to clipboard.
 *    - Opens WhatsApp Web/Desktop with the clean message pre-filled.
 */
export async function sharePdfDocument({
  pdfBlob,
  fileName,
  title,
  text,
  patientMobile,
}: SharePdfOptions): Promise<void> {
  const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

  let cleanPhone = (patientMobile || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  // 1. Detect platform
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  let platform = 'Desktop (Windows/macOS/Linux)';
  if (/Android/i.test(userAgent)) platform = 'Android Mobile/Tablet';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'iOS Device (iPhone/iPad)';
  else if (/Windows/i.test(userAgent)) platform = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) platform = 'macOS';
  else if (/Linux/i.test(userAgent)) platform = 'Linux';

  // 2. Add detailed diagnostic logs
  console.log('=== PDF SHARING DIAGNOSTICS ===');
  console.log('Platform Detected:', platform);
  console.log('navigator.share available:', !!navigator.share);
  console.log('navigator.canShare available:', !!navigator.canShare);
  console.log('File Created:', {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  });

  let canShareFiles = false;
  if (navigator.canShare) {
    try {
      canShareFiles = navigator.canShare({ files: [file] });
      console.log('navigator.canShare({ files: [file] }):', canShareFiles);
    } catch (err) {
      console.warn('Error checking navigator.canShare:', err);
    }
  }

  // 3. If native file sharing is supported on this platform/browser
  if (navigator.share && canShareFiles) {
    console.log(`[PDF Share Engine] Using native Web Share API on ${platform}...`);
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      console.log('[PDF Share Engine] Native share completed successfully.');
      return;
    } catch (shareErr) {
      console.warn('[PDF Share Engine] Native share dismissed or error:', shareErr);
      return;
    }
  }

  // 4. Detailed explanation when direct file sharing is unsupported
  const reason = !navigator.share
    ? 'Web Share API (navigator.share) is not supported by this browser environment.'
    : 'navigator.canShare({ files }) returned false for application/pdf on this browser/OS.';

  console.warn(
    `[PDF Share Engine] Native PDF attachment sharing unavailable on ${platform}.\n` +
    `Reason: ${reason}\n` +
    `Note: Desktop browsers (e.g. Windows/macOS Chrome or WhatsApp Web) cannot directly pre-attach local PDF files via URL protocol schemes or Web Share API.\n` +
    `Executing correct fallback workflow: Auto-download PDF + Copy message to clipboard + Open WhatsApp Web.`
  );

  // 5. Correct Fallback Workflow:
  // Step A: Download PDF
  try {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (dlErr) {
    console.error('[PDF Share Engine] Download fallback error:', dlErr);
  }

  // Step B: Copy message to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      console.log('[PDF Share Engine] Message copied to clipboard.');
    }
  } catch (clipErr) {
    console.warn('[PDF Share Engine] Clipboard copy error:', clipErr);
  }

  // Step C: Open WhatsApp Web / App
  const encodedText = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
}

/**
 * Helper to convert oklch colors in CSS string to rgb via browser computed style
 */
function convertOklchInString(str: string): string {
  if (!str || !str.includes('oklch')) return str;
  return str.replace(/oklch\([^)]+\)/gi, (match) => {
    try {
      const dummy = document.createElement('div');
      dummy.style.color = match;
      document.body.appendChild(dummy);
      const computed = getComputedStyle(dummy).color;
      document.body.removeChild(dummy);
      if (computed && !computed.includes('oklch')) {
        return computed;
      }
    } catch {
      // ignore
    }
    return '#64748b';
  });
}

/**
 * Helper to generate jsPDF Blob from a React DOM Element using html2canvas
 */
export async function generatePdfBlobFromElement(
  element: HTMLElement,
  format: 'a4' | 'thermal' = 'a4'
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      const styleElements = clonedDoc.querySelectorAll('style');
      styleElements.forEach((style) => {
        if (style.textContent && style.textContent.includes('oklch')) {
          style.textContent = convertOklchInString(style.textContent);
        }
      });
      const inlineStyleEls = clonedDoc.querySelectorAll('[style*="oklch"]');
      inlineStyleEls.forEach((el) => {
        const styleAttr = el.getAttribute('style');
        if (styleAttr) {
          el.setAttribute('style', convertOklchInString(styleAttr));
        }
      });
    },
  });
  const imgData = canvas.toDataURL('image/png');

  if (format === 'thermal') {
    // 80mm POS thermal receipt paper size
    const imgWidth = 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, Math.max(100, imgHeight + 8)],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    return pdf.output('blob');
  } else {
    // Standard A4 page
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, pdfHeight - 20));
    return pdf.output('blob');
  }
}

/**
 * Convenient wrapper function to capture an element and trigger sharePdfDocument
 */
export async function captureAndSharePdf({
  element,
  fileName,
  title,
  text,
  patientMobile,
  format = 'a4',
}: {
  element: HTMLElement;
  fileName: string;
  title: string;
  text: string;
  patientMobile: string;
  format?: 'a4' | 'thermal';
}) {
  const pdfBlob = await generatePdfBlobFromElement(element, format);
  await sharePdfDocument({
    pdfBlob,
    fileName,
    title,
    text,
    patientMobile,
  });
}

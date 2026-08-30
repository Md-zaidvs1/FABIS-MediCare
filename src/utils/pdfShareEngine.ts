import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface SharePdfOptions {
  pdfBlob: Blob;
  fileName: string;
  title: string;
  text: string;
  patientMobile: string;
  patientName?: string;
  patientId?: string;
  documentType?: string;
}

export interface ShareDiagnosticInfo {
  isSecureContext: boolean;
  isIframe: boolean;
  hasNavigatorShare: boolean;
  hasCanShare: boolean;
  canShareFiles: boolean;
  canShareWithText: boolean;
  canShareWithTitle: boolean;
  userAgent: string;
  isIPadOrIOS: boolean;
  errorMessage?: string;
}

/**
 * Normalizes phone numbers with country code (defaults to 91 for India 10-digit numbers)
 */
export function normalizePhoneForSharing(phone: string): {
  raw: string;
  clean: string;
  display: string;
  isValid: boolean;
} {
  const raw = phone || '';
  let digits = raw.replace(/\D/g, '');

  if (!digits || digits.length < 7) {
    return { raw, clean: '', display: raw, isValid: false };
  }

  let clean = digits;
  if (clean.length === 10) {
    clean = `91${clean}`;
  } else if (clean.length === 11 && clean.startsWith('0')) {
    clean = `91${clean.slice(1)}`;
  }

  const display = clean.startsWith('91') && clean.length === 12
    ? `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`
    : `+${clean}`;

  return { raw, clean, display, isValid: true };
}

/**
 * Comprehensive diagnostic check for Web Share API file capability
 */
export function diagnoseShareCapability(file?: File): ShareDiagnosticInfo {
  const isSecureContext = typeof window !== 'undefined' && Boolean(window.isSecureContext);
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIPadOrIOS = /iPad|iPhone|iPod/.test(userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const hasNavigatorShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const hasCanShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  let canShareFiles = false;
  let canShareWithText = false;
  let canShareWithTitle = false;

  if (file && hasNavigatorShare && hasCanShare) {
    try {
      canShareFiles = navigator.canShare({ files: [file] });
    } catch {
      canShareFiles = false;
    }

    try {
      canShareWithTitle = navigator.canShare({ files: [file], title: 'Document' });
    } catch {
      canShareWithTitle = false;
    }

    try {
      canShareWithText = navigator.canShare({ files: [file], title: 'Document', text: 'Summary' });
    } catch {
      canShareWithText = false;
    }
  }

  return {
    isSecureContext,
    isIframe,
    hasNavigatorShare,
    hasCanShare,
    canShareFiles,
    canShareWithText,
    canShareWithTitle,
    userAgent,
    isIPadOrIOS,
  };
}

/**
 * Checks if the browser & device support native file sharing with Web Share API
 */
export function canShareFileNatively(file: File): boolean {
  const diag = diagnoseShareCapability(file);
  return diag.canShareFiles || (diag.hasNavigatorShare && !diag.hasCanShare);
}

/**
 * Renders the Share Limitation Diagnostic Modal when native file attachment cannot be invoked directly in the current browser/container context.
 */
function showShareLimitationModal({
  pdfBlob,
  fileName,
  title,
  text,
  patientMobile,
  patientName = 'Patient',
  patientId = '',
  documentType = 'Document',
}: SharePdfOptions, cleanPhone: string, displayPhone: string, diag: ShareDiagnosticInfo): void {
  const existingModal = document.getElementById('fabis-share-guidance-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modalContainer = document.createElement('div');
  modalContainer.id = 'fabis-share-guidance-modal';
  modalContainer.className = 'fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200';

  // Determine specific context diagnosis
  let contextTitle = 'Browser Sharing Limitation';
  let contextDescription = 'The current browser environment does not support passing PDF files directly to the native share sheet.';
  let showOpenNewTab = false;

  if (diag.isIframe) {
    contextTitle = 'Embedded Iframe Limitation';
    contextDescription = 'Running inside an embedded iframe preview where Safari / WebKit blocks Web Share API permissions. Open FABIS MediCare in a standalone tab or Safari to share directly with 1-click.';
    showOpenNewTab = true;
  } else if (!diag.isSecureContext) {
    contextTitle = 'HTTPS Required';
    contextDescription = 'Web Share API requires a secure HTTPS connection.';
  } else if (!diag.isIPadOrIOS) {
    contextTitle = 'Desktop Browser Context';
    contextDescription = 'Direct 1-click WhatsApp PDF attachment is engineered for iPad, iPhone, and mobile devices with native share sheets. Desktop browsers do not expose a native document share sheet.';
  } else if (diag.errorMessage) {
    contextTitle = 'Share Sheet Notice';
    contextDescription = diag.errorMessage;
  }

  modalContainer.innerHTML = `
    <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-800 animate-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </span>
            <h3 class="text-base font-extrabold text-slate-900 tracking-tight">${contextTitle}</h3>
          </div>
          <p class="text-xs text-slate-500 font-medium leading-relaxed">
            ${contextDescription}
          </p>
        </div>
        <button id="fabis-share-close-btn" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer text-sm font-bold">✕</button>
      </div>

      <!-- Document Ready Card -->
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Generated PDF Document</span>
          <span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">${documentType}</span>
        </div>
        <div class="font-mono text-xs font-bold text-slate-800 break-all bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
          <span class="text-sky-500">📄</span>
          <span>${fileName}</span>
        </div>
        <div class="text-xs text-slate-600 font-medium flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-200/60">
          <span>Patient: <strong class="text-slate-900 font-bold">${patientName}</strong> ${patientId ? `(${patientId})` : ''}</span>
          <span class="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">${displayPhone}</span>
        </div>
      </div>

      <!-- Technical Diagnosis Summary -->
      <div class="p-3 bg-slate-100/70 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
        <div class="flex justify-between"><span>Secure HTTPS:</span><span class="font-bold ${diag.isSecureContext ? 'text-emerald-600' : 'text-rose-600'}">${diag.isSecureContext ? 'Yes' : 'No'}</span></div>
        <div class="flex justify-between"><span>Top-level Window:</span><span class="font-bold ${!diag.isIframe ? 'text-emerald-600' : 'text-amber-600'}">${!diag.isIframe ? 'Yes (Top-level)' : 'No (Iframe)'}</span></div>
        <div class="flex justify-between"><span>navigator.share:</span><span class="font-bold ${diag.hasNavigatorShare ? 'text-emerald-600' : 'text-slate-400'}">${diag.hasNavigatorShare ? 'Available' : 'Unavailable'}</span></div>
        <div class="flex justify-between"><span>canShare({files}):</span><span class="font-bold ${diag.canShareFiles ? 'text-emerald-600' : 'text-slate-400'}">${diag.canShareFiles ? 'Supported' : 'False / Blocked'}</span></div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-2 pt-1">
        ${showOpenNewTab ? `
          <button id="fabis-open-standalone-btn" class="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            <span>Open in Standalone Safari / Tab</span>
          </button>
        ` : ''}

        <button id="fabis-download-pdf-btn" class="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
          <svg class="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download Generated PDF (${fileName})</span>
        </button>

        <button id="fabis-done-btn" class="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer text-center">
          Dismiss
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modalContainer);

  const closeModal = () => {
    if (document.body.contains(modalContainer)) {
      modalContainer.remove();
    }
  };

  // Wire up action handlers
  document.getElementById('fabis-share-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('fabis-done-btn')?.addEventListener('click', closeModal);

  if (showOpenNewTab) {
    document.getElementById('fabis-open-standalone-btn')?.addEventListener('click', () => {
      window.open(window.location.href, '_blank');
      closeModal();
    });
  }

  // Download PDF
  document.getElementById('fabis-download-pdf-btn')?.addEventListener('click', () => {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      closeModal();
    } catch (e) {
      console.error('[PDF Share Engine] Download error:', e);
    }
  });
}

/**
 * Universal Native PDF Sharing Engine:
 * 1. Validates and normalizes patient mobile number if provided.
 * 2. Instantiates a real File object: new File([pdfBlob], filename, { type: "application/pdf" }).
 * 3. Directly invokes navigator.share({ files: [file] }) in the user gesture context.
 * 4. Opens the iPad / iPhone / Android native Global Share Sheet with the PDF already attached.
 * 5. Doctor simply taps WhatsApp (or any app) from the Global Share Sheet and hits Send.
 * 6. If blocked in an embedded iframe preview, offers 1-tap "Open in Standalone Safari / Tab".
 */
export async function sharePdfDocument({
  pdfBlob,
  fileName,
  title,
  text,
  patientMobile,
  patientName = 'Patient',
  patientId = '',
  documentType = 'Document',
}: SharePdfOptions): Promise<{ success: boolean; method: 'native' | 'limitation' | 'cancelled'; error?: string }> {
  // 1. Phone number validation (graceful if present)
  const { clean: cleanPhone, display: displayPhone, isValid } = normalizePhoneForSharing(patientMobile);

  // 2. Ensure fileName is safe and strictly has .pdf extension
  const safeFileName = (fileName || 'document.pdf')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
  const finalFileName = safeFileName.toLowerCase().endsWith('.pdf') ? safeFileName : `${safeFileName}.pdf`;

  // 3. Ensure standardized Blob with application/pdf MIME
  let normalizedBlob: Blob;
  if (pdfBlob instanceof Blob && pdfBlob.type === 'application/pdf') {
    normalizedBlob = pdfBlob;
  } else {
    normalizedBlob = new Blob([pdfBlob], { type: 'application/pdf' });
  }

  // 4. Create standard real File object
  const file = new File([normalizedBlob], finalFileName, {
    type: 'application/pdf',
    lastModified: Date.now(),
  });

  // 5. Check capabilities
  const diag = diagnoseShareCapability(file);
  console.log('[PDF Share Engine] Invoking Native Global Share Sheet:', {
    fileName: finalFileName,
    fileSize: file.size,
    fileType: file.type,
    isIframe: diag.isIframe,
    canShareFiles: diag.canShareFiles,
  });

  // 6. Direct Native Web Share Execution
  if (diag.canShareFiles || (diag.hasNavigatorShare && !diag.hasCanShare)) {
    try {
      // Prioritize pure file share for maximal iPad / iOS compatibility across WhatsApp & apps
      await navigator.share({
        files: [file],
        title: title || `${documentType} - ${patientName}`,
      });

      console.log('[PDF Share Engine] Native Global Share Sheet completed successfully.');
      return { success: true, method: 'native' };
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') {
        console.log('[PDF Share Engine] Doctor dismissed / closed native share sheet.');
        return { success: false, method: 'cancelled' };
      }

      console.warn('[PDF Share Engine] navigator.share() error:', shareErr);
      diag.errorMessage = `Share sheet notice: ${shareErr?.message || shareErr?.name || 'Share dismissed'}`;
    }
  }

  // 7. Context Limitation Handling
  console.log(`[PDF Share Engine] Native share sheet not accessible in current context. Showing options...`);
  showShareLimitationModal(
    {
      pdfBlob: normalizedBlob,
      fileName: finalFileName,
      title,
      text,
      patientMobile,
      patientName,
      patientId,
      documentType,
    },
    cleanPhone,
    displayPhone,
    diag
  );

  return { success: false, method: 'limitation', error: diag.errorMessage };
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
 * Unified text message sharing function for Notifications, Recalls, and Follow-ups
 * Uses Web Share API on iPad / Mobile if available, or direct WhatsApp chat URL
 */
export async function shareTextMessage({
  title = 'FABIS MediCare Reminder',
  text,
  patientMobile,
  patientName = 'Patient',
}: {
  title?: string;
  text: string;
  patientMobile: string;
  patientName?: string;
}): Promise<{ success: boolean; method: 'native' | 'wa' | 'cancelled'; error?: string }> {
  const { clean: cleanPhone, isValid } = normalizePhoneForSharing(patientMobile);
  if (!isValid) {
    alert(`Patient mobile number is not available or invalid ("${patientMobile || ''}"). Please update the patient's phone number.`);
    return { success: false, method: 'cancelled', error: 'Invalid phone number' };
  }

  const encodedText = encodeURIComponent(text);
  const waDirectUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  // Check if native text sharing is supported
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      if (typeof navigator.canShare === 'function' && !navigator.canShare({ text })) {
        // Fallback to wa.me
      } else {
        await navigator.share({
          title,
          text,
        });
        return { success: true, method: 'native' };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
      console.warn('[Share Engine] Native text share failed, falling back to direct WhatsApp link:', err);
    }
  }

  // Open direct WhatsApp chat
  try {
    const win = window.open(waDirectUrl, '_blank');
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = waDirectUrl;
    }
    return { success: true, method: 'wa' };
  } catch (e) {
    window.location.href = waDirectUrl;
    return { success: true, method: 'wa' };
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
  return sharePdfDocument({
    pdfBlob,
    fileName,
    title,
    text,
    patientMobile,
  });
}

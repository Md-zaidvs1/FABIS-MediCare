import { ToothCondition, Patient } from '../types';

export const formatCurrency = (amount: number, symbol: string = '₹'): string => {
  return `${symbol} ${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTodayISO = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Consistently format any patient's identifier to the clean "RKxxx" standard
 * (e.g., Rohan Sharma -> RK881, next patient -> RK882, etc.)
 * Safely preserves existing database records while unifying UI presentation.
 */
export const formatPatientId = (patientOrId?: Patient | string | null): string => {
  if (!patientOrId) return '';
  const rawId = typeof patientOrId === 'string' ? patientOrId : (patientOrId.id || patientOrId.mrn || '');
  if (!rawId) return '';
  
  // If already in RK format, return normalized uppercase
  if (/^RK\d+$/i.test(rawId)) {
    return rawId.toUpperCase();
  }

  // Handle older PAT-101 format mapping cleanly (PAT-101 -> RK881, PAT-102 -> RK882)
  const patMatch = rawId.match(/PAT[-_]?(\d+)/i);
  if (patMatch) {
    const num = parseInt(patMatch[1], 10);
    if (num >= 101 && num <= 200) {
      return `RK${881 + (num - 101)}`;
    }
    return `RK${num}`;
  }

  // Handle older FM-2026-101 format
  const fmMatch = rawId.match(/FM-\d+-(\d+)/i);
  if (fmMatch) {
    const num = parseInt(fmMatch[1], 10);
    if (num >= 101 && num <= 200) {
      return `RK${881 + (num - 101)}`;
    }
    return `RK${num}`;
  }

  return rawId;
};

export const getNextPatientRK = (patients: Patient[]): { id: string; mrn: string } => {
  let highestNum = 880;

  for (const p of patients) {
    const formatted = formatPatientId(p);
    const match = formatted.match(/RK(\d+)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > highestNum) highestNum = val;
    }
  }

  // Check persistent sequence tracker
  try {
    const storedSeq = localStorage.getItem('fabis_last_rk_sequence');
    if (storedSeq) {
      const parsedSeq = parseInt(storedSeq, 10);
      if (!isNaN(parsedSeq) && parsedSeq > highestNum) {
        highestNum = parsedSeq;
      }
    }
  } catch {}

  const nextSeq = highestNum + 1;
  try {
    localStorage.setItem('fabis_last_rk_sequence', nextSeq.toString());
  } catch {}

  const nextId = `RK${nextSeq}`;
  return {
    id: nextId,
    mrn: nextId,
  };
};


export function getLastVisitAndTreatment(patient: Patient) {
  // 1. Find last completed visit/appointment/invoice
  const appointments = patient.appointments || [];
  const invoices = patient.invoices || [];
  const treatmentPlans = patient.treatmentPlans || [];

  const completedApts = appointments.filter(
    (a) => a && (a.status === 'Completed' || a.status === 'In-Chair')
  );
  let lastVisitDate = 'No visits yet';

  if (completedApts.length > 0 && completedApts[0]?.date) {
    lastVisitDate = formatDate(completedApts[0].date);
  } else if (patient.visitHistory && patient.visitHistory.length > 0 && patient.visitHistory[0]?.date) {
    lastVisitDate = formatDate(patient.visitHistory[0].date);
  } else if (invoices.length > 0 && invoices[0]?.date) {
    lastVisitDate = formatDate(invoices[0].date);
  }

  // 2. Find last COMPLETED treatment
  const completedTreatments = treatmentPlans.filter((tp) => tp.status === 'Completed');
  let lastTxName = '';

  if (completedTreatments.length > 0) {
    lastTxName = completedTreatments[0].procedureName;
  } else if (patient.visitHistory && patient.visitHistory.length > 0 && patient.visitHistory[0].procedures.length > 0) {
    lastTxName = patient.visitHistory[0].procedures[0];
  }

  if (lastTxName && lastTxName.includes('-') && !lastTxName.includes(' ')) {
    lastTxName = lastTxName
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return { lastVisitDate, lastTxName };
}

// Converts Universal Tooth Number (1-32) to FDI Notation (11-48), or returns FDI notation as-is
export const universalToFDI = (universalNum: number): number => {
  if (universalNum >= 1 && universalNum <= 8) return 19 - universalNum; // 1 -> 18, 8 -> 11
  if (universalNum >= 9 && universalNum <= 16) return 12 + universalNum; // 9 -> 21, 16 -> 28
  if (universalNum >= 17 && universalNum <= 24) return 55 - universalNum; // 17 -> 38, 24 -> 31
  if (universalNum >= 25 && universalNum <= 32) return 16 + universalNum; // 25 -> 41, 32 -> 48
  return universalNum; // Already FDI (11-48) or Primary FDI (51-85)
};

// Converts FDI Notation (11-48) to Universal Tooth Number (1-32)
export const fdiToUniversal = (fdiNum: number): number => {
  if (fdiNum >= 11 && fdiNum <= 18) return 19 - fdiNum; // 18 -> 1, 11 -> 8
  if (fdiNum >= 21 && fdiNum <= 28) return fdiNum - 12; // 21 -> 9, 28 -> 16
  if (fdiNum >= 31 && fdiNum <= 38) return 55 - fdiNum; // 38 -> 17, 31 -> 24
  if (fdiNum >= 41 && fdiNum <= 48) return fdiNum - 16; // 41 -> 25, 48 -> 32
  return fdiNum; // Fallback
};

export const getFDIForTooth = (toothNum: number): number => {
  return universalToFDI(toothNum);
};

export const isPrimaryTooth = (toothNum: number): boolean => {
  const fdi = universalToFDI(toothNum);
  const quad = Math.floor(fdi / 10);
  return quad >= 5 && quad <= 8;
};

// Gets descriptive name for tooth (1..32 Universal or 11..85 FDI)
export const getToothName = (toothNum: number): string => {
  const fdi = universalToFDI(toothNum);
  const quad = Math.floor(fdi / 10);
  const pos = fdi % 10;

  if (quad >= 5 && quad <= 8) {
    const primaryQuadMap: Record<number, string> = {
      5: 'Upper Right Primary',
      6: 'Upper Left Primary',
      7: 'Lower Left Primary',
      8: 'Lower Right Primary',
    };
    const primaryTypeMap: Record<number, string> = {
      1: 'Central Incisor',
      2: 'Lateral Incisor',
      3: 'Canine',
      4: 'First Molar',
      5: 'Second Molar',
    };

    const quadName = primaryQuadMap[quad] || 'Primary';
    const toothName = primaryTypeMap[pos] || `Tooth FDI ${fdi}`;

    return `${quadName} ${toothName} (FDI ${fdi})`;
  }

  const quadrantMap: Record<number, string> = {
    1: 'Upper Right',
    2: 'Upper Left',
    3: 'Lower Left',
    4: 'Lower Right',
  };
  const toothTypeMap: Record<number, string> = {
    1: 'Central Incisor',
    2: 'Lateral Incisor',
    3: 'Canine',
    4: 'First Premolar',
    5: 'Second Premolar',
    6: 'First Molar',
    7: 'Second Molar',
    8: 'Third Molar (Wisdom)',
  };

  const quadName = quadrantMap[quad] || '';
  const toothName = toothTypeMap[pos] || `Tooth FDI ${fdi}`;

  return `${quadName} ${toothName} (FDI ${fdi})`;
};

// Condition Colors and Display Names
export const CONDITION_CONFIG: Record<ToothCondition, { label: string; colorClass: string; bgClass: string; borderClass: string; iconSymbol: string }> = {
  Healthy: { label: 'Healthy', colorClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40', borderClass: 'border-emerald-300 dark:border-emerald-700', iconSymbol: '✓' },
  Caries: { label: 'Caries / Cavity', colorClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/40', borderClass: 'border-amber-300 dark:border-amber-700', iconSymbol: '●' },
  Filling: { label: 'Filling / Restoration', colorClass: 'text-sky-700 dark:text-sky-400', bgClass: 'bg-sky-50 dark:bg-sky-950/40', borderClass: 'border-sky-300 dark:border-sky-700', iconSymbol: '◼' },
  RCT_Needed: { label: 'RCT Needed', colorClass: 'text-rose-700 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/40', borderClass: 'border-rose-300 dark:border-rose-700', iconSymbol: '⚡' },
  RCT_Done: { label: 'RCT Completed', colorClass: 'text-purple-700 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-950/40', borderClass: 'border-purple-300 dark:border-purple-700', iconSymbol: '★' },
  Crown: { label: 'Crown / Cap', colorClass: 'text-yellow-700 dark:text-yellow-400', bgClass: 'bg-yellow-50 dark:bg-yellow-950/40', borderClass: 'border-yellow-300 dark:border-yellow-700', iconSymbol: '👑' },
  Missing: { label: 'Missing', colorClass: 'text-zinc-500 dark:text-zinc-400', bgClass: 'bg-zinc-100 dark:bg-zinc-800', borderClass: 'border-zinc-300 dark:border-zinc-600', iconSymbol: '✕' },
  Implant: { label: 'Dental Implant', colorClass: 'text-indigo-700 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-950/40', borderClass: 'border-indigo-300 dark:border-indigo-700', iconSymbol: '⚓' },
  Extraction_Needed: { label: 'Extraction Needed', colorClass: 'text-red-700 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-950/40', borderClass: 'border-red-300 dark:border-red-700', iconSymbol: '⚠' },
  Sensitivity: { label: 'Sensitivity', colorClass: 'text-cyan-700 dark:text-cyan-400', bgClass: 'bg-cyan-50 dark:bg-cyan-950/40', borderClass: 'border-cyan-300 dark:border-cyan-700', iconSymbol: '≈' },
  Scaling_Needed: { label: 'Tartar / Scaling Needed', colorClass: 'text-teal-700 dark:text-teal-400', bgClass: 'bg-teal-50 dark:bg-teal-950/40', borderClass: 'border-teal-300 dark:border-teal-700', iconSymbol: '▒' },
};

/**
 * Robustly parses any time format (12-hour "6:15 PM", "06:15 PM", "6:15 pm", 24-hour "18:15", "18:15:00",
 * or ISO timestamp strings) into total minutes from midnight (0..1439).
 * E.g. "6:15 PM" -> 1095, "6:15 AM" -> 375, "18:15" -> 1095, "12:00 PM" -> 720, "12:00 AM" -> 0.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return 540; // Default to 9:00 AM
  const clean = String(timeStr).trim();
  if (!clean || /immediate|walk-in/i.test(clean)) return 540;

  // Handle ISO timestamp string (e.g., "2026-08-30T18:15:00")
  if (clean.includes('T')) {
    const timePart = clean.split('T')[1];
    if (timePart) {
      const parts = timePart.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return (h % 24) * 60 + (m % 60);
      }
    }
  }

  const isPM = /pm/i.test(clean);
  const isAM = /am/i.test(clean);
  const numericOnly = clean.replace(/[^\d:]/g, '');
  const parts = numericOnly.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10) || 0;

  if (isNaN(hours)) return 540;

  if (isPM) {
    if (hours < 12) hours += 12;
  } else if (isAM) {
    if (hours === 12) hours = 0;
  } else {
    // 24-hour format without AM/PM (e.g. "18:15" or "06:15")
    if (hours >= 24) hours = hours % 24;
  }

  return (hours * 60) + (minutes % 60);
}

/**
 * Formats minutes from midnight into 12-hour AM/PM string.
 * E.g. 1095 -> "6:15 PM" (or "6:15 pm" if uppercase=false).
 */
export function formatMinutesToTime(totalMinutes: number, uppercase: boolean = true): string {
  if (isNaN(totalMinutes)) return uppercase ? '9:00 AM' : '9:00 am';
  const normalizedMins = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  let hours = Math.floor(normalizedMins / 60);
  const mins = normalizedMins % 60;
  const period = hours >= 12 ? (uppercase ? 'PM' : 'pm') : (uppercase ? 'AM' : 'am');
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minsStr} ${period}`;
}

/**
 * Converts 24-hour time "18:15" to 12-hour string "6:15 PM".
 */
export function time24To12(time24: string): string {
  if (!time24) return '9:30 AM';
  const mins = parseTimeToMinutes(time24);
  return formatMinutesToTime(mins, true);
}

/**
 * Converts 12-hour or arbitrary time string to HTML time input format "HH:MM" (24-hour).
 * E.g. "6:15 PM" -> "18:15", "6:15 AM" -> "06:15".
 */
export function time12To24(time12: string): string {
  if (!time12) return '09:30';
  const mins = parseTimeToMinutes(time12);
  const normalizedMins = ((Math.round(mins) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMins / 60);
  const m = normalizedMins % 60;
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr}`;
}

/**
 * Normalizes any time representation into standard 12-hour format string (e.g. "6:15 PM").
 */
export function normalizeTimeSlot(timeStr: string | null | undefined): string {
  if (!timeStr) return '9:30 AM';
  return formatMinutesToTime(parseTimeToMinutes(timeStr), true);
}


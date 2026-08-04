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

export function getLastVisitAndTreatment(patient: Patient) {
  // 1. Find last completed visit/appointment/invoice
  const appointments = patient.appointments || [];
  const invoices = patient.invoices || [];
  const treatmentPlans = patient.treatmentPlans || [];

  const completedApts = appointments.filter(
    (a) => a.status === 'Completed' || a.status === 'In-Chair'
  );
  let lastVisitDate = 'No visits yet';

  if (completedApts.length > 0) {
    lastVisitDate = formatDate(completedApts[0].date);
  } else if (patient.visitHistory && patient.visitHistory.length > 0) {
    lastVisitDate = formatDate(patient.visitHistory[0].date);
  } else if (invoices.length > 0) {
    lastVisitDate = formatDate(invoices[0].date);
  }

  // 2. Find last COMPLETED treatment
  const completedTreatments = treatmentPlans.filter((tp) => tp.status === 'Completed');
  let lastTxName = 'No completed treatment yet';

  if (completedTreatments.length > 0) {
    lastTxName = completedTreatments[0].procedureName;
  } else if (patient.visitHistory && patient.visitHistory.length > 0 && patient.visitHistory[0].procedures.length > 0) {
    lastTxName = patient.visitHistory[0].procedures[0];
  }

  if (lastTxName !== 'No completed treatment yet' && lastTxName.includes('-') && !lastTxName.includes(' ')) {
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
  RCT_Needed: { label: 'RCT Needed', colorClass: 'text-rose-700 dark:text-rose-400', bgClass: 'bg-rose-50 dark:bg-rose-950/40', borderClass: 'border-rose-300 dark:border-rose-700', iconSymbol: '⚡' },
  RCT_Done: { label: 'RCT Completed', colorClass: 'text-purple-700 dark:text-purple-400', bgClass: 'bg-purple-50 dark:bg-purple-950/40', borderClass: 'border-purple-300 dark:border-purple-700', iconSymbol: '★' },
  Crown: { label: 'Crown / Cap', colorClass: 'text-yellow-700 dark:text-yellow-400', bgClass: 'bg-yellow-50 dark:bg-yellow-950/40', borderClass: 'border-yellow-300 dark:border-yellow-700', iconSymbol: '👑' },
  Missing: { label: 'Missing', colorClass: 'text-zinc-500 dark:text-zinc-400', bgClass: 'bg-zinc-100 dark:bg-zinc-800', borderClass: 'border-zinc-300 dark:border-zinc-600', iconSymbol: '✕' },
  Implant: { label: 'Dental Implant', colorClass: 'text-indigo-700 dark:text-indigo-400', bgClass: 'bg-indigo-50 dark:bg-indigo-950/40', borderClass: 'border-indigo-300 dark:border-indigo-700', iconSymbol: '⚓' },
  Extraction_Needed: { label: 'Extraction Needed', colorClass: 'text-red-700 dark:text-red-400', bgClass: 'bg-red-50 dark:bg-red-950/40', borderClass: 'border-red-300 dark:border-red-700', iconSymbol: '⚠' },
  Sensitivity: { label: 'Sensitivity', colorClass: 'text-cyan-700 dark:text-cyan-400', bgClass: 'bg-cyan-50 dark:bg-cyan-950/40', borderClass: 'border-cyan-300 dark:border-cyan-700', iconSymbol: '≈' },
  Scaling_Needed: { label: 'Tartar / Scaling Needed', colorClass: 'text-teal-700 dark:text-teal-400', bgClass: 'bg-teal-50 dark:bg-teal-950/40', borderClass: 'border-teal-300 dark:border-teal-700', iconSymbol: '▒' },
};

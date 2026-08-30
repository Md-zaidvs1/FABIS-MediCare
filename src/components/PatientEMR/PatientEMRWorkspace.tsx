import React, { useState, useEffect, useMemo } from 'react';
import { 
  Patient, 
  ToothRecord, 
  ToothCondition, 
  TreatmentPlanItem, 
  Invoice, 
  Prescription,
  Vitals,
  DoctorProfile,
  FollowUpTask,
  VisitRecord
} from '../../types';
import { universalToFDI, fdiToUniversal, formatDate, CONDITION_CONFIG, getToothName, getLastVisitAndTreatment, formatPatientId, formatCurrency } from '../../utils/formatters';
import { 
  shareClinicalHistoryPdf, 
  generateClinicalHistoryJsPdf, 
  printPdfBlob,
  generatePrescriptionJsPdf,
  generateInvoiceJsPdf,
  generateInvoiceThermalJsPdf,
  shareInvoicePdf,
  sharePrescriptionPdf
} from '../../utils/pdfShare';
import { 
  getStoredCustomMedicalConditions, 
  saveCustomMedicalConditions, 
  getStoredCustomExamFindings, 
  saveCustomExamFindings,
  getStoredCustomRecessionTags,
  saveCustomRecessionTags,
  getStoredCustomPeriodontalFindings,
  saveCustomPeriodontalFindings,
  getStoredCustomClinicLogo 
} from '../../utils/storage';
import { ToothShape, LargeAnatomicalToothView } from './ToothShape';
import { TeethChart } from '../TeethChart/TeethChart';
import { FdiDentalArchChart } from '../TeethChart/FdiDentalArchChart';
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  Heart, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp, 
  History, 
  Pill, 
  FileCheck,
  Receipt,
  Plus,
  Download,
  FileText,
  CreditCard,
  Clock
} from 'lucide-react';

interface PatientEMRWorkspaceProps {
  patient: Patient;
  doctor?: DoctorProfile;
  initialTab?: string;
  onBackToDirectory: () => void;
  onUpdatePatientTeeth: (patientId: string, toothNumber: number, condition: ToothCondition, notes?: string, diagnoses?: string[]) => void;
  onAddTreatmentPlan: (patientId: string, plan: Omit<TreatmentPlanItem, 'id' | 'patientId'>) => void;
  onUpdateTreatmentStatus: (patientId: string, planId: string, status: TreatmentPlanItem['status']) => void;
  onUpdateTreatmentPlanCost?: (patientId: string, planId: string, estimatedCost: number) => void;
  onDeleteTreatmentPlan?: (patientId: string, planId: string) => void;
  onUpdateVitals: (patientId: string, vitals: Vitals) => void;
  onSaveClinicalExamination?: (
    patientId: string,
    examData: {
      vitals: Vitals;
      chiefComplaint: string;
      medicalConditions: { condition: string; hasCondition: boolean }[];
      dentalHistory: string;
      clinicalFindings: string[];
      calculus: '+' | '++' | '+++' | null;
      stains: '+' | '++' | '+++' | null;
      gingivalRecession: string;
      teethMap: Record<number, ToothRecord>;
      treatmentPlanText: string;
    }
  ) => void;
  onOpenBookAppointment: (date?: string, patientId?: string) => void;
  onOpenCreateInvoice: (patientId?: string) => void;
  onOpenPrescription: (patientId?: string) => void;
  onViewInvoiceModal: (invoice: Invoice) => void;
  onViewPrescriptionModal: (rx: Prescription) => void;
  onDeletePrescription?: (patientId: string, rxId: string) => void;
  onUpdateFollowUpStatus?: (followUpId: string, status: FollowUpTask['status']) => void;
  onRescheduleFollowUp?: (followUpId: string, days?: number) => void;
}

// FDI Teeth Grid Setup (Permanent Dentition 32 Teeth)
const UPPER_RIGHT_FDI = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT_FDI = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT_FDI = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT_FDI = [31, 32, 33, 34, 35, 36, 37, 38];

const ALL_CONDITIONS: { value: ToothCondition; label: string; bg: string }[] = [
  { value: 'Healthy', label: 'Healthy', bg: '#10b981' },
  { value: 'Caries', label: 'Decay / Caries', bg: '#f59e0b' },
  { value: 'Filling', label: 'Filling', bg: '#0284c7' },
  { value: 'Missing', label: 'Missing', bg: '#64748b' },
  { value: 'RCT_Needed', label: 'RCT Needed', bg: '#e11d48' },
  { value: 'RCT_Done', label: 'RCT Done', bg: '#9333ea' },
  { value: 'Crown', label: 'Crown', bg: '#6366f1' },
  { value: 'Extraction_Needed', label: 'Extraction Needed', bg: '#dc2626' },
  { value: 'Sensitivity', label: 'Sensitivity', bg: '#ea580c' },
  { value: 'Scaling_Needed', label: 'Scaling Needed', bg: '#0d9488' },
];

const getConditionHex = (cond: string): string => {
  const match = ALL_CONDITIONS.find((c) => c.value === cond);
  if (match) return match.bg;
  if (cond && cond !== 'Healthy') return '#e11d48'; // Custom condition highlight
  return '#10b981';
};

export const PatientEMRWorkspace: React.FC<PatientEMRWorkspaceProps> = ({
  patient,
  doctor = {
    id: 'DOC-1',
    name: 'Dr. Alex Mercer',
    title: 'Dr.',
    qualifications: 'BDS, MDS (Oral & Maxillofacial Surgery)',
    regNumber: 'D-2024-FABIS',
    clinicName: 'FABIS MediCare Dental Clinic',
    clinicAddress: '104, Medical Square, Health Avenue',
    clinicPhone: '+91 98765 43210',
    clinicEmail: 'care@fabismedicare.com',
    currencySymbol: '₹',
  },
  onBackToDirectory,
  onUpdatePatientTeeth,
  onAddTreatmentPlan,
  onUpdateTreatmentStatus,
  onUpdateTreatmentPlanCost,
  onDeleteTreatmentPlan,
  onUpdateVitals,
  onSaveClinicalExamination,
  onOpenBookAppointment,
  onOpenCreateInvoice,
  onOpenPrescription,
  onViewInvoiceModal = (_inv: Invoice) => {},
  onViewPrescriptionModal = (_rx: Prescription) => {},
  onDeletePrescription,
  onUpdateFollowUpStatus,
  onRescheduleFollowUp,
}) => {
  // --- VITALS STATE ---
  const [bpInput, setBpInput] = useState<string>(patient.vitals?.bloodPressure || '');
  const [pulseInput, setPulseInput] = useState<string>(patient.vitals?.pulseRate?.toString() || '');
  const [sugarInput, setSugarInput] = useState<string>(patient.vitals?.bloodSugar?.toString() || '');
  const [spo2Input, setSpo2Input] = useState<string>(patient.vitals?.spO2?.toString() || '');
  const [tempInput, setTempInput] = useState<string>(patient.vitals?.temperature?.toString() || '');
  const [showExtraVitals, setShowExtraVitals] = useState<boolean>(false);

  // --- CHIEF COMPLAINT STATE ---
  const [chiefComplaint, setChiefComplaint] = useState<string>('');

  // --- PAST MEDICAL HISTORY STATE ---
  const [allMedicalConditions, setAllMedicalConditions] = useState<string[]>([]);
  const [medConditionsMap, setMedConditionsMap] = useState<Record<string, boolean>>({});
  const [newConditionInput, setNewConditionInput] = useState<string>('');
  const [isAddingCondition, setIsAddingCondition] = useState<boolean>(false);

  // --- PAST DENTAL HISTORY STATE ---
  const [dentalHistory, setDentalHistory] = useState<string>(patient.medicalHistory?.notes || '');

  // --- CLINICAL EXAMINATION STATE ---
  const [allExamFindings, setAllExamFindings] = useState<string[]>([]);
  const [selectedFindings, setSelectedFindings] = useState<string[]>([]);
  const [newFindingInput, setNewFindingInput] = useState<string>('');
  const [isAddingFinding, setIsAddingFinding] = useState<boolean>(false);

  // --- POCKET DEPTH / PERIODONTAL STATE ---
  const [calculusLevel, setCalculusLevel] = useState<'+' | '++' | '+++' | null>(null);
  const [stainsLevel, setStainsLevel] = useState<'+' | '++' | '+++' | null>(null);
  const [customPeriodontalFindings, setCustomPeriodontalFindings] = useState<string[]>([]);
  const [customPerioLevels, setCustomPerioLevels] = useState<Record<string, '+' | '++' | '+++' | null>>({});
  const [isAddingPerioFinding, setIsAddingPerioFinding] = useState<boolean>(false);
  const [newPerioFindingInput, setNewPerioFindingInput] = useState<string>('');

  // --- GINGIVAL RECESSION STATE ---
  const [gingivalRecession, setGingivalRecession] = useState<string>(patient.clinicalExamination?.gingivalRecession || '');
  const [customRecessionTags, setCustomRecessionTags] = useState<string[]>([]);
  const [isAddingRecessionTag, setIsAddingRecessionTag] = useState<boolean>(false);
  const [newRecessionTagInput, setNewRecessionTagInput] = useState<string>('');

  // --- FDI DENTAL CHART STATE ---
  const [teethMap, setTeethMap] = useState<Record<number, ToothRecord>>(patient.teethMap || {});
  const [selectedFdiNumber, setSelectedFdiNumber] = useState<number>(16); // Default 16 FDI
  const [selectedToothCondition, setSelectedToothCondition] = useState<ToothCondition | string>('Healthy');
  const [selectedToothNotes, setSelectedToothNotes] = useState<string>('');
  const [isAddingCustomCondition, setIsAddingCustomCondition] = useState<boolean>(false);
  const [customToothConditionInput, setCustomToothConditionInput] = useState<string>('');

  // --- TREATMENT PLAN STATE ---
  const [treatmentPlanText, setTreatmentPlanText] = useState<string>('');
  const [isAddingCustomProcedure, setIsAddingCustomProcedure] = useState<boolean>(false);
  const [newCustomProcedureInput, setNewCustomProcedureInput] = useState<string>('');

  // UI States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [showHistorySection, setShowHistorySection] = useState<boolean>(true);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'visit' | 'prescription' | 'billing'>('all');
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [invoiceForWhatsAppPrompt, setInvoiceForWhatsAppPrompt] = useState<Invoice | null>(null);

  const toggleCardExpand = (cardId: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Chronological Patient History Timeline (Prescriptions + Billing + Clinical Visits)
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      type: 'prescription' | 'billing' | 'visit';
      date: string;
      data: any;
    }> = [];

    (patient.prescriptions || []).forEach((rx) => {
      events.push({
        id: `rx-${rx.id}`,
        type: 'prescription',
        date: rx.date,
        data: rx,
      });
    });

    (patient.invoices || []).forEach((inv) => {
      events.push({
        id: `inv-${inv.id}`,
        type: 'billing',
        date: inv.date,
        data: inv,
      });
    });

    (patient.visitHistory || []).forEach((v) => {
      events.push({
        id: `visit-${v.id}`,
        type: 'visit',
        date: v.date,
        data: v,
      });
    });

    return events.sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  }, [patient.prescriptions, patient.invoices, patient.visitHistory]);

  const filteredTimelineEvents = useMemo(() => {
    if (historyFilter === 'all') return timelineEvents;
    return timelineEvents.filter((ev) => ev.type === historyFilter);
  }, [timelineEvents, historyFilter]);

  // Initialize medical conditions, clinical findings, and recession tags from storage and patient data
  useEffect(() => {
    setBpInput(patient.vitals?.bloodPressure || '');
    setPulseInput(patient.vitals?.pulseRate?.toString() || '');
    setSugarInput(patient.vitals?.bloodSugar?.toString() || '');
    setSpo2Input(patient.vitals?.spO2?.toString() || '');
    setTempInput(patient.vitals?.temperature?.toString() || '');
    setChiefComplaint('');
    setDentalHistory(patient.medicalHistory?.notes || '');
    setGingivalRecession(patient.clinicalExamination?.gingivalRecession || '');

    const storedConditions = getStoredCustomMedicalConditions();
    const existingSystemic = patient.medicalHistory?.systemicConditions || [];
    const mergedConditions = Array.from(new Set([...storedConditions, ...existingSystemic]));
    setAllMedicalConditions(mergedConditions);

    const initialMap: Record<string, boolean> = {};
    mergedConditions.forEach((c) => {
      const hasIt = existingSystemic.includes(c);
      initialMap[c] = hasIt;
    });
    setMedConditionsMap(initialMap);

    const storedFindings = getStoredCustomExamFindings();
    setAllExamFindings(storedFindings);

    const storedRecessionTags = getStoredCustomRecessionTags();
    setCustomRecessionTags(storedRecessionTags);

    const storedPerioFindings = getStoredCustomPeriodontalFindings();
    setCustomPeriodontalFindings(storedPerioFindings);

    // Initial teeth map sync
    setTeethMap(patient.teethMap || {});
  }, [patient.id]);

  // Sync selected tooth details when tooth selection changes
  useEffect(() => {
    const univNum = fdiToUniversal(selectedFdiNumber);
    const existing = teethMap[univNum];
    if (existing) {
      setSelectedToothCondition(existing.condition);
      setSelectedToothNotes(existing.notes || '');
    } else {
      setSelectedToothCondition('Healthy');
      setSelectedToothNotes('');
    }
    setIsAddingCustomCondition(false);
    setCustomToothConditionInput('');
  }, [selectedFdiNumber, teethMap]);

  // Handle Tooth Condition Update in Local State & notify parent
  const handleUpdateToothCondition = (newCondition: ToothCondition | string) => {
    setSelectedToothCondition(newCondition);
    const univNum = fdiToUniversal(selectedFdiNumber);
    const updatedRecord: ToothRecord = {
      toothNumber: univNum,
      fdiNumber: selectedFdiNumber,
      name: getToothName(univNum),
      condition: newCondition as ToothCondition,
      notes: selectedToothNotes,
      diagnoses: [newCondition],
    };

    const updatedMap = {
      ...teethMap,
      [univNum]: updatedRecord,
    };
    setTeethMap(updatedMap);
    onUpdatePatientTeeth(patient.id, univNum, newCondition as ToothCondition, selectedToothNotes, [newCondition]);
  };

  // Add Custom Medical Condition (No predefined suggestions)
  const handleAddCustomCondition = () => {
    const trimmed = newConditionInput.trim();
    if (!trimmed) return;
    if (!allMedicalConditions.includes(trimmed)) {
      const updated = [...allMedicalConditions, trimmed];
      setAllMedicalConditions(updated);
      saveCustomMedicalConditions(updated);
      setMedConditionsMap((prev) => ({ ...prev, [trimmed]: true }));
    } else {
      setMedConditionsMap((prev) => ({ ...prev, [trimmed]: true }));
    }
    setNewConditionInput('');
    setIsAddingCondition(false);
  };

  // Add Custom Exam Finding (No predefined suggestions)
  const handleAddCustomFinding = () => {
    const trimmed = newFindingInput.trim();
    if (!trimmed) return;
    if (!allExamFindings.includes(trimmed)) {
      const updated = [...allExamFindings, trimmed];
      setAllExamFindings(updated);
      saveCustomExamFindings(updated);
      setSelectedFindings((prev) => [...prev, trimmed]);
    } else {
      if (!selectedFindings.includes(trimmed)) {
        setSelectedFindings((prev) => [...prev, trimmed]);
      }
    }
    setNewFindingInput('');
    setIsAddingFinding(false);
  };

  // Toggle Clinical Exam Finding chip
  const toggleFinding = (finding: string) => {
    setSelectedFindings((prev) =>
      prev.includes(finding) ? prev.filter((f) => f !== finding) : [...prev, finding]
    );
  };

  // Add Custom Recession Tag (Permanently saved to storage)
  const handleAddRecessionTag = () => {
    const trimmed = newRecessionTagInput.trim();
    if (!trimmed) return;
    if (!customRecessionTags.includes(trimmed)) {
      const updated = [...customRecessionTags, trimmed];
      setCustomRecessionTags(updated);
      saveCustomRecessionTags(updated);
    }
    // Also append to gingival recession details
    setGingivalRecession((prev) => (prev ? `${prev}, ${trimmed}` : trimmed));
    setNewRecessionTagInput('');
    setIsAddingRecessionTag(false);
  };

  // Permanently Remove Custom Recession Tag
  const handleRemoveRecessionTag = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customRecessionTags.filter((t) => t !== tag);
    setCustomRecessionTags(updated);
    saveCustomRecessionTags(updated);
  };

  // Toggle/Append tag to Gingival Recession textarea
  const handleToggleRecessionTag = (tag: string) => {
    setGingivalRecession((prev) => {
      if (!prev) return tag;
      if (prev.includes(tag)) {
        return prev
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== tag)
          .join(', ');
      }
      return `${prev}, ${tag}`;
    });
  };

  // Add Custom Periodontal Finding (Permanently saved to storage)
  const handleAddCustomPerioFinding = () => {
    const trimmed = newPerioFindingInput.trim();
    if (!trimmed) return;
    const upper = trimmed.toUpperCase();
    if (!customPeriodontalFindings.includes(upper)) {
      const updated = [...customPeriodontalFindings, upper];
      setCustomPeriodontalFindings(updated);
      saveCustomPeriodontalFindings(updated);
      setCustomPerioLevels((prev) => ({ ...prev, [upper]: '+' }));
    }
    setNewPerioFindingInput('');
    setIsAddingPerioFinding(false);
  };

  // Permanently Remove Custom Periodontal Finding
  const handleRemoveCustomPerioFinding = (finding: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPeriodontalFindings.filter((f) => f !== finding);
    setCustomPeriodontalFindings(updated);
    saveCustomPeriodontalFindings(updated);
    setCustomPerioLevels((prev) => {
      const next = { ...prev };
      delete next[finding];
      return next;
    });
  };

  // Save Custom Tooth Condition for selected tooth
  const handleSaveCustomToothCondition = () => {
    const trimmed = customToothConditionInput.trim();
    if (!trimmed) return;
    handleUpdateToothCondition(trimmed);
    setIsAddingCustomCondition(false);
    setCustomToothConditionInput('');
  };

  // Append snippet into Treatment Plan text area
  const appendTreatmentPlanSnippet = (snippet: string) => {
    setTreatmentPlanText((prev) => {
      if (!prev.trim()) return snippet;
      return `${prev.trim()}\n• ${snippet}`;
    });
  };

  // Add Custom Quick Procedure to Treatment Plan
  const handleAddCustomProcedure = () => {
    const trimmed = newCustomProcedureInput.trim();
    if (!trimmed) return;
    appendTreatmentPlanSnippet(trimmed);
    setNewCustomProcedureInput('');
    setIsAddingCustomProcedure(false);
  };

  // Master Save Function: Saves all EMR sections, records visit, then automatically continues to Prescription
  const handleSaveAll = () => {
    setIsSaving(true);

    const vitalsData: Vitals = {
      bloodPressure: bpInput.trim() || undefined,
      pulseRate: pulseInput ? parseInt(pulseInput, 10) : undefined,
      bloodSugar: sugarInput.trim() || undefined,
      spO2: spo2Input ? parseInt(spo2Input, 10) : undefined,
      temperature: tempInput ? parseFloat(tempInput) : undefined,
      updatedAt: new Date().toISOString(),
    };

    const medicalConditionsArray = Object.entries(medConditionsMap).map(([condition, hasCondition]) => ({
      condition,
      hasCondition,
    }));

    // Compile comprehensive recession summary
    const compiledRecession = gingivalRecession.trim();

    if (onSaveClinicalExamination) {
      onSaveClinicalExamination(patient.id, {
        vitals: vitalsData,
        chiefComplaint: chiefComplaint.trim(),
        medicalConditions: medicalConditionsArray,
        dentalHistory: dentalHistory.trim(),
        clinicalFindings: selectedFindings,
        calculus: calculusLevel,
        stains: stainsLevel,
        gingivalRecession: compiledRecession,
        teethMap,
        treatmentPlanText: treatmentPlanText.trim(),
      });
    } else {
      onUpdateVitals(patient.id, vitalsData);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccessMessage('EMR saved successfully. Opening Prescription...');
      // Flow Step: EMR Save -> Automatically continue to existing Prescription entry screen
      setTimeout(() => {
        onOpenPrescription(patient.id);
      }, 500);
    }, 400);
  };

  // A4 PDF Generation & Direct Print & WhatsApp
  const handleShareWhatsAppA4History = async () => {
    setIsGeneratingPdf(true);
    try {
      const customLogo = getStoredCustomClinicLogo();
      await shareClinicalHistoryPdf({
        patient,
        doctor,
        customLogo,
      });
    } catch (err) {
      console.error('Error sharing clinical history PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadA4HistoryPdf = () => {
    try {
      const customLogo = getStoredCustomClinicLogo();
      const blob = generateClinicalHistoryJsPdf(patient, doctor, customLogo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Clinical_History_${patient.mrn}_${patient.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error('Error downloading clinical history PDF:', err);
    }
  };

  const handlePrintA4History = () => {
    const customLogo = getStoredCustomClinicLogo();
    const blob = generateClinicalHistoryJsPdf(patient, doctor, customLogo);
    printPdfBlob(blob);
  };

  // Helper for Last visit & treatment
  const lastVisitInfo = getLastVisitAndTreatment(patient);

  return (
    <div className="space-y-6 pb-16 min-w-0 max-w-7xl mx-auto font-sans text-slate-800 antialiased">
      
      {/* ========================================================
          PATIENT HEADER (Professional Clinical Hierarchy)
      ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Back button + Patient Clinical Info */}
          <div className="flex items-start sm:items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToDirectory}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0"
              title="Back to Patient Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {patient.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-mono font-black border border-sky-200">
                  {formatPatientId(patient)}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  {patient.age} Yrs • {patient.gender}
                </span>
                {patient.bloodGroup && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    {patient.bloodGroup}
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2.5 flex-wrap">
                <span>Phone: <strong className="text-slate-800 font-semibold">{patient.phone || 'N/A'}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Last Visit: <strong className="text-slate-800 font-semibold">{lastVisitInfo.lastVisitDate}</strong>{lastVisitInfo.lastTxName ? ` (${lastVisitInfo.lastTxName})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => onOpenPrescription(patient.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Pill className="w-4 h-4 text-indigo-600" />
              <span>Prescription</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenCreateInvoice(patient.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-sky-600" />
              <span>Invoice / Bill</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenBookAppointment(undefined, patient.id)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Appointment</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {saveSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs font-bold text-emerald-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          CLINICAL EXAMINATION SECTIONS (WITHOUT NUMBERING)
      ======================================================== */}
      <div className="space-y-5">
        
        {/* ----------------------------------------------------
            VITALS
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              VITALS
            </h2>
            <button
              type="button"
              onClick={() => setShowExtraVitals(!showExtraVitals)}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 cursor-pointer flex items-center gap-1"
            >
              {showExtraVitals ? 'Fewer Vitals' : '+ Add Vital (SpO2 / Temp)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Blood Pressure */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Blood Pressure (mmHg)
              </label>
              <input
                type="text"
                value={bpInput}
                onChange={(e) => setBpInput(e.target.value)}
                placeholder="120/80"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            </div>

            {/* Pulse */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pulse (bpm)
              </label>
              <input
                type="number"
                value={pulseInput}
                onChange={(e) => setPulseInput(e.target.value)}
                placeholder="72"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            </div>

            {/* Blood Sugar */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Blood Sugar (mg/dL)
              </label>
              <input
                type="number"
                value={sugarInput}
                onChange={(e) => setSugarInput(e.target.value)}
                placeholder="110"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            </div>

            {/* Optional SpO2 */}
            {showExtraVitals && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={spo2Input}
                  onChange={(e) => setSpo2Input(e.target.value)}
                  placeholder="98"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                />
              </div>
            )}

            {/* Optional Temperature */}
            {showExtraVitals && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  placeholder="98.6"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                />
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------
            CHIEF COMPLAINT
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mb-3">
            CHIEF COMPLAINT
          </h2>

          <textarea
            rows={3}
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Type patient's chief complaint (e.g., Severe pain in lower right molar for 3 days, aggravated by hot & cold fluids)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-y"
          />
        </div>

        {/* ----------------------------------------------------
            PAST MEDICAL HISTORY
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              PAST MEDICAL HISTORY
            </h2>
            
            <button
              type="button"
              onClick={() => setIsAddingCondition(!isAddingCondition)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors cursor-pointer border border-sky-200"
            >
              + Add
            </button>
          </div>

          {/* Simple custom field input: Field name: [__________] [ Add ] */}
          {isAddingCondition && (
            <div className="mb-3.5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-700 shrink-0">Field name:</span>
              <input
                type="text"
                value={newConditionInput}
                onChange={(e) => setNewConditionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCondition()}
                placeholder="Enter field name..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-sky-500"
                autoFocus
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={handleAddCustomCondition}
                  disabled={!newConditionInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCondition(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Custom Medical History Fields List */}
          {allMedicalConditions.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 italic border border-dashed border-slate-200">
              No medical history fields added yet. Click <strong>"[ + Add ]"</strong> to create a custom field.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allMedicalConditions.map((condition) => {
                const isYes = medConditionsMap[condition] === true;
                return (
                  <div
                    key={condition}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isYes ? 'bg-rose-50/70 border-rose-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {condition}
                    </span>

                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setMedConditionsMap((prev) => ({ ...prev, [condition]: true }))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                          isYes
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setMedConditionsMap((prev) => ({ ...prev, [condition]: false }))}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
                          !isYes
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------
            PAST DENTAL HISTORY
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mb-3">
            PAST DENTAL HISTORY
          </h2>

          <textarea
            rows={2}
            value={dentalHistory}
            onChange={(e) => setDentalHistory(e.target.value)}
            placeholder="Type previous dental treatments or history (e.g., RCT done on upper molar in 2024, routine scaling 6 months ago)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-y"
          />
        </div>

        {/* ----------------------------------------------------
            CLINICAL EXAMINATION
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              CLINICAL EXAMINATION
            </h2>

            <button
              type="button"
              onClick={() => setIsAddingFinding(!isAddingFinding)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors cursor-pointer border border-sky-200"
            >
              + Add
            </button>
          </div>

          {/* Simple custom field input: Field name: [__________] [ Add ] */}
          {isAddingFinding && (
            <div className="mb-3.5 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-700 shrink-0">Field name:</span>
              <input
                type="text"
                value={newFindingInput}
                onChange={(e) => setNewFindingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomFinding()}
                placeholder="Enter finding name..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-sky-500"
                autoFocus
              />
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={handleAddCustomFinding}
                  disabled={!newFindingInput.trim()}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingFinding(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Findings Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {allExamFindings.map((finding) => {
              const isSelected = selectedFindings.includes(finding);
              return (
                <button
                  key={finding}
                  type="button"
                  onClick={() => toggleFinding(finding)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs scale-102'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{finding}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ----------------------------------------------------
            POCKET DEPTH
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              POCKET DEPTH
            </h2>
            <button
              type="button"
              onClick={() => setIsAddingPerioFinding(!isAddingPerioFinding)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors cursor-pointer border border-sky-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Add custom periodontal finding input */}
          {isAddingPerioFinding && (
            <div className="p-3 bg-sky-50/70 border-2 border-sky-400 rounded-xl flex items-center gap-2 shadow-xs">
              <input
                type="text"
                value={newPerioFindingInput}
                onChange={(e) => setNewPerioFindingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomPerioFinding()}
                placeholder="Enter custom periodontal finding (e.g. Deep Pockets, Furcation Defect, Bleeding on Probing)..."
                className="flex-1 bg-white border border-sky-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-sky-600 shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomPerioFinding}
                disabled={!newPerioFindingInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingPerioFinding(false);
                  setNewPerioFindingInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* CALCULUS */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold text-slate-900 tracking-wide">CALCULUS</span>
              <div className="flex items-center gap-1.5">
                {(['+', '++', '+++'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setCalculusLevel(calculusLevel === lvl ? null : lvl)}
                    className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center ${
                      calculusLevel === lvl
                        ? 'bg-sky-600 text-white shadow-xs scale-105'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* STAINS */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs font-extrabold text-slate-900 tracking-wide">STAINS</span>
              <div className="flex items-center gap-1.5">
                {(['+', '++', '+++'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setStainsLevel(stainsLevel === lvl ? null : lvl)}
                    className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center ${
                      stainsLevel === lvl
                        ? 'bg-amber-600 text-white shadow-xs scale-105'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Periodontal Findings */}
            {customPeriodontalFindings.map((finding) => {
              const currentLvl = customPerioLevels[finding];
              return (
                <div key={finding} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2 group">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCustomPerioFinding(finding, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all shrink-0 cursor-pointer"
                      title="Remove custom finding"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-extrabold text-slate-900 tracking-wide truncate" title={finding}>
                      {finding}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(['+', '++', '+++'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setCustomPerioLevels((prev) => ({
                            ...prev,
                            [finding]: prev[finding] === lvl ? null : lvl,
                          }))
                        }
                        className={`w-8 h-8 rounded-lg font-black text-xs transition-all cursor-pointer flex items-center justify-center ${
                          currentLvl === lvl
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ----------------------------------------------------
            GINGIVAL RECESSION
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              GINGIVAL RECESSION
            </h2>
            
            <button
              type="button"
              onClick={() => setIsAddingRecessionTag(!isAddingRecessionTag)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs transition-colors cursor-pointer border border-sky-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Add custom recession tag input */}
          {isAddingRecessionTag && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <input
                type="text"
                value={newRecessionTagInput}
                onChange={(e) => setNewRecessionTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRecessionTag()}
                placeholder="Enter custom recession label (e.g. Miller Class II, Mandibular Anterior)..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-sky-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddRecessionTag}
                disabled={!newRecessionTagInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingRecessionTag(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Custom Gingival Recession Entries Tags */}
          {customRecessionTags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Custom Gingival Recession Entries:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {customRecessionTags.map((tag) => {
                  const isIncluded = gingivalRecession.toLowerCase().includes(tag.toLowerCase());
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleRecessionTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isIncluded
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <span>{tag}</span>
                      <span
                        onClick={(e) => handleRemoveRecessionTag(tag, e)}
                        className="hover:text-rose-300 transition-colors p-0.5 rounded-full"
                        title="Delete custom tag"
                      >
                        <X className="w-3 h-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* High-visibility Recession Details Input Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Recession Details
            </label>
            <textarea
              rows={3}
              value={gingivalRecession}
              onChange={(e) => setGingivalRecession(e.target.value)}
              placeholder="Enter gingival recession details"
              className="w-full bg-white border-2 border-sky-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 rounded-2xl p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-y shadow-2xs"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              e.g., Recession noted in #41, 42 (1mm), #31 (2mm) on buccal aspect.
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------
            FDI DENTAL CHART
        ---------------------------------------------------- */}
        <div className="space-y-4">
          {/* Anatomical FDI Dental Arch Chart with Crown & Root Vectors */}
          <TeethChart
            teethMap={teethMap}
            selectedToothNumber={selectedFdiNumber >= 50 ? selectedFdiNumber : fdiToUniversal(selectedFdiNumber)}
            onSelectTooth={(num) => {
              const fdi = num >= 50 ? num : universalToFDI(num);
              setSelectedFdiNumber(fdi);
            }}
          />

          {/* Selected Tooth Detail Panel */}
          <div className="mt-4 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              
              {/* Left: Large Anatomical Tooth View */}
              <div className="shrink-0">
                <LargeAnatomicalToothView
                  fdiNumber={selectedFdiNumber}
                  condition={selectedToothCondition}
                  conditionHex={getConditionHex(selectedToothCondition)}
                />
              </div>

              {/* Right: Tooth Title, Subtitle, Action Buttons, and Clinical Notes */}
              <div className="flex-1 w-full space-y-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Tooth #{selectedFdiNumber}
                  </h3>
                  <p className="text-sm font-semibold text-sky-700 mt-0.5">
                    {getToothName(fdiToUniversal(selectedFdiNumber))} (FDI {selectedFdiNumber})
                  </p>
                </div>

                {/* Primary Action Buttons Matching Reference Image */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: 'Decay', value: 'Caries' },
                    { label: 'Filling', value: 'Filling' },
                    { label: 'Missing', value: 'Missing' },
                    { label: 'RCT', value: 'RCT_Done' },
                    { label: 'Crown', value: 'Crown' },
                    { label: 'Extraction', value: 'Extraction_Needed' },
                  ].map((btn) => {
                    const isCurrent = selectedToothCondition === btn.value;
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => handleUpdateToothCondition(btn.value)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-900 text-white shadow-xs scale-102'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs'
                        }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}

                  {/* Healthy / Reset Action */}
                  <button
                    type="button"
                    onClick={() => handleUpdateToothCondition('Healthy')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      selectedToothCondition === 'Healthy'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs'
                    }`}
                  >
                    Healthy
                  </button>

                  {/* Add Custom Button with Signature Border */}
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCondition(!isAddingCustomCondition)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom</span>
                  </button>
                </div>

                {/* Custom Condition Inline Form */}
                {isAddingCustomCondition && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Custom Tooth Condition:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customToothConditionInput}
                        onChange={(e) => setCustomToothConditionInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomToothCondition()}
                        placeholder="e.g. Incipient enamel caries, Fractured cusp, Grade 2 Mobility..."
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-sky-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCustomToothCondition}
                        disabled={!customToothConditionInput.trim()}
                        className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomCondition(false)}
                        className="p-2 text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Clinical Notes Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600">
                    Tooth Clinical Notes
                  </label>
                  <input
                    type="text"
                    value={selectedToothNotes}
                    onChange={(e) => {
                      setSelectedToothNotes(e.target.value);
                      const univ = fdiToUniversal(selectedFdiNumber);
                      onUpdatePatientTeeth(
                        patient.id,
                        univ,
                        selectedToothCondition as ToothCondition,
                        e.target.value,
                        [selectedToothCondition]
                      );
                    }}
                    placeholder={`Notes for Tooth #${selectedFdiNumber} (e.g., mesial marginal ridge decay, tender on percussion)...`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-sky-500 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            TREATMENT PLAN
        ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              TREATMENT PLAN
            </h2>

            {/* Quick Action Snippet Helpers + Custom Add */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() => appendTreatmentPlanSnippet(`Tooth #${selectedFdiNumber}: Root Canal Treatment & Crown`)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Tooth #{selectedFdiNumber} RCT
              </button>
              <button
                type="button"
                onClick={() => appendTreatmentPlanSnippet('Full Mouth Ultrasonic Scaling & Polishing')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Scaling
              </button>
              <button
                type="button"
                onClick={() => appendTreatmentPlanSnippet(`Tooth #${selectedFdiNumber}: Composite Restoration`)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Filling
              </button>
              <button
                type="button"
                onClick={() => appendTreatmentPlanSnippet('Post-treatment antibiotic and analgesic coverage')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer"
              >
                Meds Note
              </button>

              <button
                type="button"
                onClick={() => setIsAddingCustomProcedure(!isAddingCustomProcedure)}
                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold border border-sky-200 cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Custom Quick Add Inline Form */}
          {isAddingCustomProcedure && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
              <input
                type="text"
                value={newCustomProcedureInput}
                onChange={(e) => setNewCustomProcedureInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomProcedure()}
                placeholder="Enter custom procedure / plan note..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 outline-none focus:border-sky-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomProcedure}
                disabled={!newCustomProcedureInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCustomProcedure(false)}
                className="p-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <textarea
            rows={4}
            value={treatmentPlanText}
            onChange={(e) => setTreatmentPlanText(e.target.value)}
            placeholder="Type comprehensive treatment plan (e.g., Phase 1: Ultrasonic Scaling. Phase 2: RCT Tooth #16 with PFM Crown. Phase 3: Composite restoration #21)..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-y"
          />
        </div>

        {/* ====================================================
            SAVE / CANCEL BOTTOM ACTION BAR
        ==================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex items-center justify-end gap-2.5 sticky bottom-4 z-20">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>

        {/* ====================================================
            PATIENT HISTORY — COMPACT CLINICAL TIMELINE
        ==================================================== */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <History className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  PATIENT HISTORY
                </h2>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">
                  <span className="font-mono font-bold text-sky-700">{formatPatientId(patient)}</span> • {timelineEvents.length} Events
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'visit', label: 'Visits' },
                  { key: 'prescription', label: 'Prescriptions' },
                  { key: 'billing', label: 'Bills' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setHistoryFilter(f.key as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      historyFilter === f.key
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareWhatsAppA4History}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Share A4 Patient Clinical History PDF to WhatsApp"
                >
                  <span>💬</span>
                  <span>{isGeneratingPdf ? 'Generating...' : 'WhatsApp History'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadA4HistoryPdf}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  title="Download A4 Clinical History PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePrintA4History}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  title="Print A4 Clinical History"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistorySection(!showHistorySection)}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 cursor-pointer ml-1"
                >
                  <span>{showHistorySection ? 'Hide' : 'Show'}</span>
                  {showHistorySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {showHistorySection && (
            <div className="mt-4 pt-3 border-t border-slate-200">
              {filteredTimelineEvents.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-medium space-y-1">
                  <div>No timeline records match the selected filter.</div>
                  <div className="text-slate-400">Save clinical examinations, issue prescriptions, or create bills to build the patient history.</div>
                </div>
              ) : (
                <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {filteredTimelineEvents.map((event) => {
                    const isExpanded = !!expandedCardIds[event.id];

                    if (event.type === 'prescription') {
                      const rx: Prescription = event.data;
                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline Dot Icon */}
                          <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs border-2 border-white">
                            <Pill className="w-3 h-3" />
                          </div>

                          <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 hover:border-sky-300 transition-all space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                                  <span>{formatDate(rx.date)}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-800 uppercase tracking-wider">
                                  Prescription
                                </span>
                              </div>

                              {rx.nextVisitDate && (
                                <div className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Follow-Up: {formatDate(rx.nextVisitDate)}</span>
                                </div>
                              )}
                            </div>

                            {/* Diagnosis */}
                            {rx.diagnosis && (
                              <div className="text-xs text-slate-800">
                                <span className="text-slate-500 font-medium">Diagnosis: </span>
                                <span className="font-bold">{rx.diagnosis}</span>
                              </div>
                            )}

                            {/* Compact Medicines Tags */}
                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {rx.medicines.map((m) => (
                                <span
                                  key={m.id}
                                  className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                                  <span>{m.name}</span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    ({m.frequency}{m.duration ? `, ${m.duration}` : ''})
                                  </span>
                                </span>
                              ))}
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700 space-y-2 bg-white/70 p-2.5 rounded-lg">
                                {rx.specialInstructions && (
                                  <div>
                                    <span className="font-bold text-slate-900">Advice / Instructions: </span>
                                    <span>{rx.specialInstructions}</span>
                                  </div>
                                )}
                                <div>
                                  <div className="font-bold text-slate-900 mb-1">Prescribed Medicines:</div>
                                  <div className="space-y-1">
                                    {rx.medicines.map((m, idx) => (
                                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded text-xs">
                                        <span className="font-semibold text-slate-800">{m.name}</span>
                                        <span className="text-slate-600 font-mono">{m.frequency} • {m.duration} • {m.timing || 'After food'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Actions & Details Toggle */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customLogo = getStoredCustomClinicLogo();
                                    const pdfBlob = generatePrescriptionJsPdf(rx, doctor, patient, customLogo);
                                    if (pdfBlob) printPdfBlob(pdfBlob);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Printer className="w-3 h-3 text-sky-400" />
                                  <span>A4 PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customLogo = getStoredCustomClinicLogo();
                                    sharePrescriptionPdf({
                                      rx,
                                      doctor,
                                      patient,
                                      customLogo,
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>💬</span>
                                  <span>WhatsApp</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleCardExpand(event.id)}
                                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Less' : 'Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (event.type === 'billing') {
                      const inv: Invoice = event.data;
                      const isPaid = inv.status === 'Paid';
                      const isPartial = inv.status === 'Partial';

                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline Dot Icon */}
                          <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs border-2 border-white">
                            <Receipt className="w-3 h-3" />
                          </div>

                          <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 hover:border-emerald-300 transition-all space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{formatDate(inv.date)}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                  Bill {inv.id ? `#${inv.id}` : ''}
                                </span>
                              </div>

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : isPartial
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}
                              >
                                {inv.status}
                              </span>
                            </div>

                            {/* Treatments / Items Summary */}
                            <div className="text-xs text-slate-800 flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500 font-medium">Treatments: </span>
                              {inv.items && inv.items.length > 0 ? (
                                inv.items.map((it, idx) => (
                                  <span key={idx} className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs">
                                    {it.description} {it.quantity > 1 ? `(${it.quantity}x)` : ''}
                                  </span>
                                ))
                              ) : (
                                <span className="font-semibold text-slate-800">Dental Consultation / Procedure</span>
                              )}
                            </div>

                            {/* Amount & Payment Info */}
                            <div className="flex items-center justify-between text-xs bg-slate-100/80 px-3 py-1.5 rounded-lg">
                              <div>
                                <span className="text-slate-500 font-medium">Amount: </span>
                                <strong className="text-slate-900 font-black">{formatCurrency(inv.netTotal)}</strong>
                              </div>
                              <div className="text-slate-700">
                                Payment: <strong className="text-slate-900">{inv.paymentMethod || 'UPI'}</strong>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700 space-y-2 bg-white/70 p-2.5 rounded-lg">
                                <div className="font-bold text-slate-900">Itemized Breakdown:</div>
                                <div className="space-y-1">
                                  {inv.items?.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded text-xs">
                                      <span className="font-semibold text-slate-800">{it.description} (x{it.quantity})</span>
                                      <span className="text-slate-900 font-mono font-bold">{formatCurrency(it.unitPrice * it.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                                {inv.notes && (
                                  <div className="text-slate-600">
                                    <span className="font-bold text-slate-800">Notes: </span>
                                    <span>{inv.notes}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Actions & Details Toggle */}
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customLogo = getStoredCustomClinicLogo();
                                    const pdfBlob = generateInvoiceJsPdf(inv, doctor, patient, customLogo);
                                    if (pdfBlob) printPdfBlob(pdfBlob);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <FileText className="w-3 h-3 text-sky-400" />
                                  <span>A4 Invoice</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const customLogo = getStoredCustomClinicLogo();
                                    const pdfBlob = generateInvoiceThermalJsPdf(inv, doctor, patient, customLogo);
                                    if (pdfBlob) printPdfBlob(pdfBlob);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Printer className="w-3 h-3 text-white" />
                                  <span>80mm Thermal</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setInvoiceForWhatsAppPrompt(inv)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>💬</span>
                                  <span>WhatsApp</span>
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleCardExpand(event.id)}
                                className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Less' : 'Details'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Visit event
                    const visit: VisitRecord = event.data;
                    return (
                      <div key={event.id} className="relative group">
                        {/* Timeline Dot Icon */}
                        <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-xs border-2 border-white">
                          <History className="w-3 h-3" />
                        </div>

                        <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 transition-all space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-900 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{formatDate(visit.date)}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-200 text-slate-700 uppercase tracking-wider">
                              Clinical Visit
                            </span>
                          </div>

                          {visit.chiefComplaint && (
                            <div className="text-xs text-slate-800">
                              <span className="text-slate-500 font-medium">Chief Complaint: </span>
                              <span className="font-bold">{visit.chiefComplaint}</span>
                            </div>
                          )}

                          {/* Findings & Teeth summary */}
                          <div className="flex flex-wrap gap-1.5 text-xs">
                            {visit.clinicalFindings && visit.clinicalFindings.length > 0 && (
                              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold text-slate-800">
                                Findings: {visit.clinicalFindings.join(', ')}
                              </span>
                            )}
                            {visit.toothFindings && visit.toothFindings.length > 0 && (
                              <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold text-slate-800">
                                FDI Teeth: {visit.toothFindings.map((tf) => `#${tf.fdiNumber || universalToFDI(tf.toothNumber)}: ${tf.condition}`).join(', ')}
                              </span>
                            )}
                          </div>

                          {visit.treatmentPlanText && (
                            <div className="text-xs text-slate-800">
                              <span className="text-slate-500 font-medium">Plan: </span>
                              <span className="font-bold">{visit.treatmentPlanText}</span>
                            </div>
                          )}

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-700 space-y-1.5 bg-white/70 p-2.5 rounded-lg">
                              {visit.gingivalRecession && (
                                <div>
                                  <span className="font-bold text-slate-800">Gingival Recession / Perio: </span>
                                  <span>{visit.gingivalRecession}</span>
                                </div>
                              )}
                              {visit.calculus && (
                                <div>
                                  <span className="font-bold text-slate-800">Calculus: </span>
                                  <span>{visit.calculus}</span>
                                </div>
                              )}
                              {visit.stains && (
                                <div>
                                  <span className="font-bold text-slate-800">Stains: </span>
                                  <span>{visit.stains}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Details Toggle */}
                          <div className="flex justify-end pt-1 border-t border-slate-200/70">
                            <button
                              type="button"
                              onClick={() => toggleCardExpand(event.id)}
                              className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Less' : 'Details'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* WhatsApp Invoice Format Selection Modal */}
        {invoiceForWhatsAppPrompt && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
                  <span>💬</span>
                  <span>Share Invoice via WhatsApp</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceForWhatsAppPrompt(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium">
                  Select which invoice layout you want to share with{' '}
                  <strong className="text-slate-900">{patient.name}</strong> ({formatPatientId(patient)}):
                </p>
                <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/60 mt-2">
                  Inv #{invoiceForWhatsAppPrompt.invoiceNumber} • {formatCurrency(invoiceForWhatsAppPrompt.netTotal)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const inv = invoiceForWhatsAppPrompt;
                    setInvoiceForWhatsAppPrompt(null);
                    const customLogo = getStoredCustomClinicLogo();
                    shareInvoicePdf({
                      invoice: inv,
                      doctor,
                      patient,
                      customLogo,
                      format: 'a4',
                    });
                  }}
                  className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer shadow-xs"
                >
                  <FileText className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">A4 PDF</span>
                  <span className="text-[10px] text-slate-400">Full Detailed Page</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const inv = invoiceForWhatsAppPrompt;
                    setInvoiceForWhatsAppPrompt(null);
                    const customLogo = getStoredCustomClinicLogo();
                    shareInvoicePdf({
                      invoice: inv,
                      doctor,
                      patient,
                      customLogo,
                      format: 'thermal',
                    });
                  }}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white flex flex-col items-center justify-center gap-1.5 transition-all text-center group cursor-pointer shadow-xs"
                >
                  <Printer className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">80mm Thermal</span>
                  <span className="text-[10px] text-amber-100">POS Slip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInvoiceForWhatsAppPrompt(null)}
                className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

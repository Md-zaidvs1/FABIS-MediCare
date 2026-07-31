import React, { useState } from 'react';
import { 
  Patient, 
  ToothRecord, 
  ToothCondition, 
  ToothSurface,
  ToothPerioRecord,
  ClinicalMedia,
  TreatmentPlanItem, 
  Invoice, 
  Prescription,
  Vitals,
  VitalsLogRecord,
  TreatmentTemplate,
  DoctorProfile,
  FollowUpTask
} from '../../types';
import { TeethChart } from '../TeethChart/TeethChart';
import { AnatomicalToothSVG } from '../TeethChart/AnatomicalToothSVG';
import { SurfaceSelector } from '../TeethChart/SurfaceSelector';
import { PerioChartModule } from '../TeethChart/PerioChartModule';
import { SOAPTemplatesModal } from './SOAPTemplatesModal';
import { PhasedTreatmentPlan } from './PhasedTreatmentPlan';
import { DocumentVaultModule } from './DocumentVaultModule';
import { formatCurrency, formatDate, CONDITION_CONFIG, getToothName, getLastVisitAndTreatment } from '../../utils/formatters';
import { shareInvoicePdf, sharePrescriptionPdf } from '../../utils/pdfShare';
import { QUICK_DIAGNOSES, QUICK_TREATMENTS, DEFAULT_TREATMENT_TEMPLATES } from '../../data/initialData';
import { 
  getStoredCustomDiagnoses, 
  saveCustomDiagnoses, 
  getStoredCustomTreatments, 
  saveCustomTreatments, 
  getStoredDeletedPredefinedDiagnoses,
  saveDeletedPredefinedDiagnoses,
  getStoredDeletedPredefinedTreatments,
  saveDeletedPredefinedTreatments,
  getStoredVitalsLogs,
  saveVitalsLogForPatient,
  getStoredCustomClinicLogo,
  formatCurrentTimestamp,
  CustomTreatmentItem 
} from '../../utils/storage';
import { 
  User, 
  Activity, 
  Layers, 
  FileText, 
  Receipt, 
  Image as ImageIcon, 
  Plus, 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Download, 
  Printer, 
  ExternalLink,
  Edit3,
  Stethoscope,
  Clock,
  Sparkles,
  Zap,
  Bookmark,
  X,
  PlusCircle,
  Tag,
  Check,
  Search,
  Trash2
} from 'lucide-react';

interface PatientEMRWorkspaceProps {
  patient: Patient;
  doctor?: DoctorProfile;
  onBackToDirectory: () => void;
  onUpdatePatientTeeth: (patientId: string, toothNumber: number, condition: ToothCondition, notes?: string, diagnoses?: string[]) => void;
  onAddTreatmentPlan: (patientId: string, plan: Omit<TreatmentPlanItem, 'id' | 'patientId'>) => void;
  onUpdateTreatmentStatus: (patientId: string, planId: string, status: TreatmentPlanItem['status']) => void;
  onUpdateTreatmentPlanCost?: (patientId: string, planId: string, estimatedCost: number) => void;
  onDeleteTreatmentPlan?: (patientId: string, planId: string) => void;
  onUpdateVitals: (patientId: string, vitals: Vitals) => void;
  onOpenBookAppointment: (date?: string, patientId?: string) => void;
  onOpenCreateInvoice: (patientId?: string) => void;
  onOpenPrescription: (patientId?: string) => void;
  onViewInvoiceModal: (invoice: Invoice) => void;
  onViewPrescriptionModal: (rx: Prescription) => void;
  onDeletePrescription?: (patientId: string, rxId: string) => void;
  onUpdateFollowUpStatus?: (followUpId: string, status: FollowUpTask['status']) => void;
  onRescheduleFollowUp?: (followUpId: string, days?: number) => void;
}

export const PatientEMRWorkspace: React.FC<PatientEMRWorkspaceProps> = ({
  patient,
  doctor,
  onBackToDirectory,
  onUpdatePatientTeeth,
  onAddTreatmentPlan,
  onUpdateTreatmentStatus,
  onUpdateTreatmentPlanCost,
  onDeleteTreatmentPlan,
  onUpdateVitals,
  onOpenBookAppointment,
  onOpenCreateInvoice,
  onOpenPrescription,
  onViewInvoiceModal,
  onViewPrescriptionModal,
  onDeletePrescription,
  onUpdateFollowUpStatus,
  onRescheduleFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'teethMap' | 'perio' | 'treatments' | 'prescriptions' | 'invoices' | 'timeline' | 'media'>('overview');

  // Teeth Map Selection State
  const [selectedToothNum, setSelectedToothNum] = useState<number>(30);
  const [toothConditionInput, setToothConditionInput] = useState<ToothCondition>('Healthy');
  const [toothNotesInput, setToothNotesInput] = useState<string>('');
  const [selectedToothDiagnoses, setSelectedToothDiagnoses] = useState<string[]>([]);
  const [selectedSurfaces, setSelectedSurfaces] = useState<ToothSurface[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // SOAP Template Modal State
  const [isSOAPModalOpen, setIsSOAPModalOpen] = useState<boolean>(false);

  // Custom Diagnosis State
  const [customDiagnoses, setCustomDiagnoses] = useState<string[]>(getStoredCustomDiagnoses);
  const [deletedPredefinedDiags, setDeletedPredefinedDiags] = useState<string[]>(getStoredDeletedPredefinedDiagnoses);
  const [isAddCustomDiagOpen, setIsAddCustomDiagOpen] = useState(false);
  const [customDiagName, setCustomDiagName] = useState('');
  const [customDiagNotes, setCustomDiagNotes] = useState('');
  const [customDiagError, setCustomDiagError] = useState<string | null>(null);

  // Custom Treatment State
  const [customTreatments, setCustomTreatments] = useState<CustomTreatmentItem[]>(getStoredCustomTreatments);
  const [deletedPredefinedTx, setDeletedPredefinedTx] = useState<string[]>(getStoredDeletedPredefinedTreatments);
  const [isAddCustomTxOpen, setIsAddCustomTxOpen] = useState(false);
  const [customTxName, setCustomTxName] = useState('');
  const [customTxCategory, setCustomTxCategory] = useState<TreatmentPlanItem['category']>('Endodontics');
  const [customTxCost, setCustomTxCost] = useState<number>(2500);
  const [customTxNotes, setCustomTxNotes] = useState('');
  const [customTxError, setCustomTxError] = useState<string | null>(null);

  // Quick Pick Search Queries
  const [diagSearchQuery, setDiagSearchQuery] = useState('');
  const [txSearchQuery, setTxSearchQuery] = useState('');

  // Treatment Plan Form State
  const [newProcName, setNewProcName] = useState('');
  const [newProcCat, setNewProcCat] = useState<TreatmentPlanItem['category']>('Endodontics');
  const [newProcCost, setNewProcCost] = useState<number>(5000);
  const [newProcTooth, setNewProcTooth] = useState<number | undefined>(30);

  // Vitals Form State
  const [bpInput, setBpInput] = useState(patient.vitals?.bloodPressure || '');
  const [pulseInput, setPulseInput] = useState(patient.vitals?.pulseRate?.toString() || '');
  const [sugarInput, setSugarInput] = useState(patient.vitals?.bloodSugar || '');

  // Vitals Toast Alert State
  const [toastAlert, setToastAlert] = useState<{ message: string } | null>(null);

  // Vitals History Logs State
  const [vitalsLogs, setVitalsLogs] = useState<VitalsLogRecord[]>(() =>
    getStoredVitalsLogs(patient.mrn)
  );

  // Sync vitals inputs & history when active patient changes
  React.useEffect(() => {
    setBpInput(patient.vitals?.bloodPressure || '');
    setPulseInput(patient.vitals?.pulseRate?.toString() || '');
    setSugarInput(patient.vitals?.bloodSugar || '');
    setVitalsLogs(getStoredVitalsLogs(patient.mrn));
  }, [patient.id, patient.mrn, patient.vitals]);

  // Media Lightbox State
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  const selectedToothRecord: ToothRecord = patient.teethMap[selectedToothNum] || {
    toothNumber: selectedToothNum,
    fdiNumber: selectedToothNum,
    name: getToothName(selectedToothNum),
    condition: 'Healthy',
  };

  // Sync tooth inputs whenever selectedToothNum or patient teethMap updates
  React.useEffect(() => {
    const rec = patient.teethMap[selectedToothNum];
    if (rec) {
      setToothConditionInput(rec.condition);
      setToothNotesInput(rec.notes || '');
      setSelectedToothDiagnoses(rec.diagnoses || []);
      setSelectedSurfaces(rec.surfaces || []);
    } else {
      setToothConditionInput('Healthy');
      setToothNotesInput('');
      setSelectedToothDiagnoses([]);
      setSelectedSurfaces([]);
    }
  }, [selectedToothNum, patient.teethMap]);

  const handleToothSelect = (num: number) => {
    setSelectedToothNum(num);
    setNewProcTooth(num);
  };

  const handleSaveToothCondition = () => {
    onUpdatePatientTeeth(patient.id, selectedToothNum, toothConditionInput, toothNotesInput, selectedToothDiagnoses);
    setSaveFeedback(`Tooth #${selectedToothNum} record saved successfully!`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleApplyQuickDiagnosis = (diag: string) => {
    if (!selectedToothDiagnoses.includes(diag)) {
      const updatedDiags = [...selectedToothDiagnoses, diag];
      setSelectedToothDiagnoses(updatedDiags);

      let newCondition = toothConditionInput;
      const lower = diag.toLowerCase();
      if (lower.includes('caries') || lower.includes('cavity')) newCondition = 'Caries';
      else if (lower.includes('pain') || lower.includes('pulpitis') || lower.includes('abscess')) newCondition = 'RCT_Needed';
      else if (lower.includes('gingivitis') || lower.includes('calculus') || lower.includes('tartar')) newCondition = 'Scaling_Needed';
      else if (lower.includes('hypersensitivity')) newCondition = 'Sensitivity';
      else if (lower.includes('broken') || lower.includes('fractured') || lower.includes('impacted')) newCondition = 'Extraction_Needed';

      setToothConditionInput(newCondition);
      onUpdatePatientTeeth(patient.id, selectedToothNum, newCondition, toothNotesInput, updatedDiags);
      setSaveFeedback(`Added problem "${diag}" to Tooth #${selectedToothNum}`);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleRemoveToothDiagnosis = (diagToRemove: string) => {
    const updatedDiags = selectedToothDiagnoses.filter((d) => d !== diagToRemove);
    setSelectedToothDiagnoses(updatedDiags);
    onUpdatePatientTeeth(patient.id, selectedToothNum, toothConditionInput, toothNotesInput, updatedDiags);
    setSaveFeedback(`Removed problem "${diagToRemove}" from Tooth #${selectedToothNum}`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleDeleteToothTreatment = (tpId: string, procedureName: string) => {
    if (onDeleteTreatmentPlan) {
      onDeleteTreatmentPlan(patient.id, tpId);
      setSaveFeedback(`Removed treatment "${procedureName}" from Tooth #${selectedToothNum}`);
      setTimeout(() => setSaveFeedback(null), 3000);
    }
  };

  const handleSaveCustomDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDiagName.trim();
    if (!trimmed) {
      setCustomDiagError('Diagnosis Name is required.');
      return;
    }

    // Check duplicate against active built-in and existing custom
    const activeBuiltIns = QUICK_DIAGNOSES.filter(
      (d) => !deletedPredefinedDiags.some((del) => del.toLowerCase() === d.toLowerCase())
    );
    const allDiags = [...activeBuiltIns, ...customDiagnoses];
    const isDup = allDiags.some((d) => d.toLowerCase() === trimmed.toLowerCase());
    if (isDup) {
      setCustomDiagError('A diagnosis with this name already exists.');
      return;
    }

    // If re-adding a deleted predefined, un-delete it
    const reAddedPredefined = deletedPredefinedDiags.find((del) => del.toLowerCase() === trimmed.toLowerCase());
    if (reAddedPredefined) {
      const updatedDel = deletedPredefinedDiags.filter((del) => del.toLowerCase() !== trimmed.toLowerCase());
      setDeletedPredefinedDiags(updatedDel);
      saveDeletedPredefinedDiagnoses(updatedDel);
    } else {
      const updated = [...customDiagnoses, trimmed];
      setCustomDiagnoses(updated);
      saveCustomDiagnoses(updated);
    }

    // Immediately apply to current selected tooth
    handleApplyQuickDiagnosis(trimmed);

    // Reset & close modal
    setCustomDiagName('');
    setCustomDiagNotes('');
    setCustomDiagError(null);
    setIsAddCustomDiagOpen(false);
  };

  const handleDeleteCustomDiagnosis = (diagToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete custom diagnosis shortcut "${diagToDelete}"?`)) {
      const updated = customDiagnoses.filter((d) => d.toLowerCase() !== diagToDelete.toLowerCase());
      setCustomDiagnoses(updated);
      saveCustomDiagnoses(updated);
    }
  };

  const handleDeletePredefinedDiagnosis = (diagToDelete: string) => {
    if (window.confirm(`Are you sure you want to remove default diagnosis shortcut "${diagToDelete}"?`)) {
      const updated = [...deletedPredefinedDiags, diagToDelete];
      setDeletedPredefinedDiags(updated);
      saveDeletedPredefinedDiagnoses(updated);
    }
  };

  const handleSaveCustomTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = customTxName.trim();
    if (!trimmedName) {
      setCustomTxError('Treatment Name is required.');
      return;
    }
    if (!customTxCost || customTxCost < 0) {
      setCustomTxError('Default Treatment Amount (₹) must be a positive number.');
      return;
    }

    // Check duplicate against active built-in and existing custom
    const activeBuiltInTx = QUICK_TREATMENTS.filter(
      (t) => !deletedPredefinedTx.some((del) => del.toLowerCase() === t.name.toLowerCase())
    );
    const allTxNames = [...activeBuiltInTx.map((t) => t.name), ...customTreatments.map((t) => t.name)];
    const isDup = allTxNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase());
    if (isDup) {
      setCustomTxError('A treatment with this name already exists.');
      return;
    }

    const newTx: CustomTreatmentItem = {
      name: trimmedName,
      category: customTxCategory,
      cost: Number(customTxCost),
      description: customTxNotes.trim() || undefined,
    };

    // If re-adding a deleted predefined, un-delete it
    const reAddedPredefined = deletedPredefinedTx.find((del) => del.toLowerCase() === trimmedName.toLowerCase());
    if (reAddedPredefined) {
      const updatedDel = deletedPredefinedTx.filter((del) => del.toLowerCase() !== trimmedName.toLowerCase());
      setDeletedPredefinedTx(updatedDel);
      saveDeletedPredefinedTreatments(updatedDel);
    } else {
      const updated = [...customTreatments, newTx];
      setCustomTreatments(updated);
      saveCustomTreatments(updated);
    }

    // Immediately apply procedure to selected tooth & patient treatment plan
    handleApplyQuickTreatment(newTx);

    // Reset & close modal
    setCustomTxName('');
    setCustomTxCategory('Endodontics');
    setCustomTxCost(2500);
    setCustomTxNotes('');
    setCustomTxError(null);
    setIsAddCustomTxOpen(false);
  };

  const handleDeleteCustomTreatment = (txName: string) => {
    if (window.confirm(`Are you sure you want to delete custom treatment shortcut "${txName}"?`)) {
      const updated = customTreatments.filter((t) => t.name.toLowerCase() !== txName.toLowerCase());
      setCustomTreatments(updated);
      saveCustomTreatments(updated);
    }
  };

  const handleDeletePredefinedTreatment = (txNameToDelete: string) => {
    if (window.confirm(`Are you sure you want to remove default treatment shortcut "${txNameToDelete}"?`)) {
      const updated = [...deletedPredefinedTx, txNameToDelete];
      setDeletedPredefinedTx(updated);
      saveDeletedPredefinedTreatments(updated);
    }
  };

  const handleApplyQuickTreatment = (tx: { name: string; category: TreatmentPlanItem['category']; cost: number }) => {
    // Check if active duplicate treatment already exists for selected tooth
    const exists = patient.treatmentPlans.some(
      (tp) =>
        tp.toothNumber === selectedToothNum &&
        tp.procedureName.trim().toLowerCase() === tx.name.trim().toLowerCase() &&
        (tp.status === 'Planned' || tp.status === 'In-Progress')
    );

    if (exists) {
      setSaveFeedback(`"${tx.name}" is already active in Treatment Plan for Tooth #${selectedToothNum}.`);
      setTimeout(() => setSaveFeedback(null), 3000);
      return;
    }

    onAddTreatmentPlan(patient.id, {
      procedureName: tx.name,
      category: tx.category,
      estimatedCost: tx.cost,
      toothNumber: selectedToothNum,
      status: 'Planned',
    });

    setSaveFeedback(`Added "${tx.name}" (₹${tx.cost.toLocaleString('en-IN')}) to Treatment Plan for Tooth #${selectedToothNum}`);
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Filtered Quick Pick Lists based on Search Queries and Deletions
  const activeBuiltInDiags = QUICK_DIAGNOSES.filter(
    (d) => !deletedPredefinedDiags.some((del) => del.toLowerCase() === d.toLowerCase())
  );
  const filteredBuiltInDiags = activeBuiltInDiags.filter((d) =>
    d.toLowerCase().includes(diagSearchQuery.trim().toLowerCase())
  );
  const filteredCustomDiags = customDiagnoses.filter((d) =>
    d.toLowerCase().includes(diagSearchQuery.trim().toLowerCase())
  );

  const activeBuiltInTx = QUICK_TREATMENTS.filter(
    (t) => !deletedPredefinedTx.some((del) => del.toLowerCase() === t.name.toLowerCase())
  );
  const filteredBuiltInTx = activeBuiltInTx.filter((t) =>
    t.name.toLowerCase().includes(txSearchQuery.trim().toLowerCase())
  );
  const filteredCustomTx = customTreatments.filter((t) =>
    t.name.toLowerCase().includes(txSearchQuery.trim().toLowerCase())
  );

  const handleApplyTreatmentTemplate = (template: TreatmentTemplate) => {
    template.items.forEach((item) => {
      onAddTreatmentPlan(patient.id, {
        procedureName: item.procedureName,
        category: item.category,
        estimatedCost: item.estimatedCost,
        toothNumber: item.toothRequired ? selectedToothNum : undefined,
        status: 'Planned',
      });
    });
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    const nowTimestamp = formatCurrentTimestamp();
    const updatedVitals: Vitals = {
      bloodPressure: bpInput.trim() || undefined,
      pulseRate: pulseInput.trim() ? parseInt(pulseInput, 10) : undefined,
      bloodSugar: sugarInput.trim() || undefined,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    // 1. Update parent state for instant Overview card update
    onUpdateVitals(patient.id, updatedVitals);

    // 2. Save timestamped vitals log entry
    const newLogRecord: VitalsLogRecord = {
      id: `VIT-${Date.now()}`,
      patientMrn: patient.mrn,
      timestamp: nowTimestamp,
      bloodPressure: bpInput.trim() || 'N/A',
      pulseRate: pulseInput.trim() ? parseInt(pulseInput, 10) : undefined,
      bloodSugar: sugarInput.trim() || 'N/A',
    };

    const updatedLogsList = saveVitalsLogForPatient(patient.mrn, newLogRecord);
    setVitalsLogs(updatedLogsList);

    // 3. Trigger instant visual success notification toast
    setToastAlert({
      message: `✅ Vitals saved successfully for ${patient.name}`,
    });

    // Auto-dismiss toast
    setTimeout(() => {
      setToastAlert(null);
    }, 3500);
  };

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcName.trim()) return;
    onAddTreatmentPlan(patient.id, {
      procedureName: newProcName,
      category: newProcCat,
      estimatedCost: newProcCost,
      toothNumber: newProcTooth,
      status: 'Planned',
    });
    setNewProcName('');
  };

  // Balance calculation
  const totalBalanceDue = patient.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Patient Visit History derived
  const { lastVisitDate, lastTxName } = getLastVisitAndTreatment(patient);

  return (
    <div className="space-y-6 pb-12 relative">
      {/* Visual Save Confirmation Toast Alert */}
      {toastAlert && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-zinc-900 text-white border border-emerald-500/40 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 min-w-[280px]">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-base">
            ✓
          </div>
          <div className="text-xs sm:text-sm font-semibold text-emerald-100 flex-1">
            {toastAlert.message}
          </div>
          <button
            onClick={() => setToastAlert(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* 3. Patient EMR Banner Alert */}
      {(() => {
        const pendingFollowUps = (patient.followUps || []).filter((f) => f.status !== 'Completed');
        if (pendingFollowUps.length === 0) return null;
        const activeAlert = pendingFollowUps[0];

        return (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-3xl shadow-sm text-amber-950 space-y-2.5 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-extrabold text-base shadow-2xs">
                  ⚠️
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-[10px] uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-md">
                      DOCTOR ALERT
                    </span>
                    <span className="text-xs font-bold text-amber-800">
                      Target Due Date: {formatDate(activeAlert.dueDate)}
                    </span>
                  </div>
                  <p className="text-sm font-extrabold text-amber-950 mt-1">
                    Internal Follow-Up Due: {activeAlert.reason}
                  </p>
                  {activeAlert.notes && (
                    <p className="text-xs text-amber-800 italic mt-0.5">
                      Doctor Note: "{activeAlert.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateFollowUpStatus) {
                      onUpdateFollowUpStatus(activeAlert.id, 'Completed');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Completed</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onRescheduleFollowUp) {
                      onRescheduleFollowUp(activeAlert.id, 3);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs border border-amber-300 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Reschedule (+3 Days)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Top Navigation & Patient Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-zinc-200 space-y-4 shadow-sm text-zinc-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDirectory}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
              title="Back to Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-zinc-900">{patient.name}</h1>
                <span className="text-xs font-semibold text-zinc-500">
                  ({patient.age} Yrs / {patient.gender})
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#D4AF37]/15 text-[#9a7814] border border-[#D4AF37]/30">
                  MRN: {patient.mrn}
                </span>
              </div>

              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-zinc-700">
                  <Phone className="w-3.5 h-3.5 text-[#b89323]" /> {patient.phone}
                </span>
                {(patient.streetAddress || patient.cityArea || patient.address) && (
                  <span className="flex items-center gap-1 font-medium text-zinc-700">
                    <MapPin className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {[patient.streetAddress, patient.cityArea, patient.pincode ? `Pincode: ${patient.pincode}` : ''].filter(Boolean).join(', ') || patient.address}
                    </span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Group for active patient */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onOpenBookAppointment(undefined, patient.id)}
              className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white font-bold text-xs shadow transition-all"
            >
              + Book Visit
            </button>
            <button
              onClick={() => onOpenCreateInvoice(patient.id)}
              className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-zinc-950 font-bold text-xs shadow-xs"
            >
              + Invoice
            </button>
            <button
              onClick={() => onOpenPrescription(patient.id)}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-200"
            >
              + Rx
            </button>
          </div>
        </div>

        {/* Compact Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50/80 p-3 rounded-2xl border border-zinc-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Last Visit</span>
            <span className="font-bold text-zinc-800">{lastVisitDate}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Last Treatment</span>
            <span className="font-bold text-zinc-800 truncate block">{lastTxName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Pending Balance</span>
            <span className={`font-mono font-bold ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatCurrency(totalBalanceDue)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Medical Conditions</span>
            <span className="font-bold text-amber-800 truncate block">
              {patient.medicalHistory.systemicConditions.length > 0 ? patient.medicalHistory.systemicConditions.join(', ') : 'None Reported'}
            </span>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full min-w-0 scrollbar-thin">
          {[
            { id: 'overview', label: 'Overview & Vitals', icon: User },
            { id: 'teethMap', label: 'Dental Chart & Tooth Desk', icon: Activity },
            { id: 'perio', label: '6-Point Perio Chart', icon: Stethoscope },
            { id: 'treatments', label: 'Treatment Plans', icon: Layers, count: patient.treatmentPlans.length },
            { id: 'prescriptions', label: 'Rx Prescriptions', icon: FileText, count: patient.prescriptions.length },
            { id: 'invoices', label: 'Invoices & Billing', icon: Receipt, count: patient.invoices.length },
            { id: 'timeline', label: 'Visit History Timeline', icon: Clock },
            { id: 'media', label: 'Clinical Vault & Media', icon: ImageIcon, count: patient.media?.length || 0 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#D4AF37] text-zinc-950 shadow-sm border border-[#b89323]'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 border border-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-zinc-950 text-[#D4AF37]' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview & Vitals */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vitals Recorder & History */}
          <div className="lg:col-span-5 space-y-6">
            {/* Real-time Current Active Vitals Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#b89323]" />
                  <span>Current Overview & Vitals</span>
                </h3>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {patient.vitals?.updatedAt ? `Updated: ${formatDate(patient.vitals.updatedAt)}` : 'Recorded Today'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Blood Pressure</span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-[#b89323] mt-0.5 block">
                    {patient.vitals?.bloodPressure || bpInput || '120/80'}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium">mmHg</span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Pulse Rate</span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-rose-600 mt-0.5 block">
                    {patient.vitals?.pulseRate || (pulseInput ? parseInt(pulseInput, 10) : 72)}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium">bpm</span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Blood Sugar</span>
                  <span className="text-sm sm:text-base font-extrabold font-mono text-amber-700 mt-0.5 block">
                    {patient.vitals?.bloodSugar || sugarInput || '100 mg/dL'}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-medium">Random</span>
                </div>
              </div>
            </div>

            {/* Vitals Form Recorder */}
            <form
              onSubmit={handleSaveVitals}
              className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#b89323]" />
                  <span>Log New Vitals Reading</span>
                </h3>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Vitals</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">BP (mmHg)</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={bpInput}
                    onChange={(e) => setBpInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Pulse (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={pulseInput}
                    onChange={(e) => setPulseInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Blood Sugar</label>
                  <input
                    type="text"
                    placeholder="100 mg/dL"
                    value={sugarInput}
                    onChange={(e) => setSugarInput(e.target.value)}
                    className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none font-medium"
                  />
                </div>
              </div>
            </form>

            {/* Vitals History Log with Timestamps */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#b89323]" />
                  <span>Vitals History Timeline</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4AF37]/20 text-amber-900 border border-[#b89323]/30">
                  {vitalsLogs.length} Entries Logged
                </span>
              </div>

              {vitalsLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  No historical vitals logs recorded yet.
                </div>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                  {vitalsLogs.map((log, idx) => (
                    <div key={log.id} className="relative pl-7 space-y-1">
                      <div className="absolute left-1 top-1.5 w-3 h-3 rounded-full bg-[#b89323] border-2 border-white z-10 shadow-xs" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-900">{log.timestamp}</span>
                        {idx === 0 && (
                          <span className="px-2 py-0.2 rounded-md text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl flex flex-wrap items-center gap-2 text-xs font-mono font-semibold text-zinc-800">
                        <span className="px-2 py-0.5 bg-white rounded-md border border-zinc-200 shadow-2xs">
                          BP: <strong className="text-[#b89323]">{log.bloodPressure || 'N/A'}</strong>
                        </span>
                        <span className="px-2 py-0.5 bg-white rounded-md border border-zinc-200 shadow-2xs">
                          Pulse: <strong className="text-rose-600">{log.pulseRate ? `${log.pulseRate} bpm` : 'N/A'}</strong>
                        </span>
                        <span className="px-2 py-0.5 bg-white rounded-md border border-zinc-200 shadow-2xs">
                          Sugar: <strong className="text-amber-700">{log.bloodSugar || 'N/A'}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medical History & Patient Address Card */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#3BA7F5]" />
                <span>Patient Address & Clinical Background</span>
              </h3>

              <div className="space-y-2 text-xs text-zinc-700">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Registered Patient Address</span>
                  <div className="font-semibold text-zinc-800 space-y-0.5">
                    {patient.streetAddress && <p>🏠 {patient.streetAddress}</p>}
                    {patient.cityArea && <p>📍 {patient.cityArea}{patient.pincode ? ` - ${patient.pincode}` : ''}</p>}
                    {!patient.streetAddress && !patient.cityArea && (
                      <p>{patient.address || 'Address not registered.'}</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Systemic Conditions</span>
                  <span className="font-bold text-amber-800">
                    {patient.medicalHistory.systemicConditions.length > 0
                      ? patient.medicalHistory.systemicConditions.join(', ')
                      : 'None reported'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Doctor Clinical Notes</span>
                  <p className="text-zinc-600 mt-0.5">{patient.medicalHistory.notes || 'No notes.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Visit History & Active Plans */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Treatment Summary */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-zinc-900">Active Treatment Procedures</h3>
              <div className="space-y-2">
                {patient.treatmentPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-900">{plan.procedureName}</div>
                      <div className="text-[11px] text-zinc-500">
                        Tooth: #{plan.toothNumber || 'General'} • Cost: {formatCurrency(plan.estimatedCost)}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        plan.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices Summary */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900">Billing Summary</h3>
                <span className="text-xs font-mono font-bold text-rose-600">
                  Total Dues: {formatCurrency(totalBalanceDue)}
                </span>
              </div>
              {patient.invoices.map((inv, idx) => (
                <div
                  key={`${inv.id}-${idx}`}
                  onClick={() => onViewInvoiceModal(inv)}
                  className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-[#D4AF37] cursor-pointer flex items-center justify-between text-xs transition-all"
                >
                  <div>
                    <div className="font-mono font-bold text-[#9a7814]">{inv.id}</div>
                    <div className="text-[11px] text-zinc-500">{formatDate(inv.date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-zinc-900">{formatCurrency(inv.netTotal)}</div>
                    <div className="text-[11px] text-rose-600 font-mono font-bold">
                      Due: {formatCurrency(inv.balanceDue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Dental Chart & Tooth Desk */}
      {activeTab === 'teethMap' && (
        <div className="space-y-6">
          <TeethChart
            teethMap={patient.teethMap}
            selectedToothNumber={selectedToothNum}
            onSelectTooth={handleToothSelect}
          />

          {/* Quick Diagnosis & Quick Treatment Shortcuts Bar */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-5 text-zinc-900">
            {/* "What's the Problem?" Section */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100">
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 shrink-0">
                  <Zap className="w-4 h-4 text-[#b89323]" />
                  <span>What’s the Problem? for Tooth #{selectedToothNum}:</span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {deletedPredefinedDiags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Restore all removed default diagnosis shortcuts?')) {
                          setDeletedPredefinedDiags([]);
                          saveDeletedPredefinedDiagnoses([]);
                        }
                      }}
                      className="text-[10px] text-zinc-500 hover:text-[#9a7814] underline font-medium cursor-pointer shrink-0"
                    >
                      Restore Defaults
                    </button>
                  )}

                  {/* Search box for diagnoses */}
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search diagnoses..."
                      value={diagSearchQuery}
                      onChange={(e) => setDiagSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#D4AF37] focus:bg-white transition-all"
                    />
                    {diagSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDiagSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Add Custom Diagnosis button */}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDiagName(diagSearchQuery.trim() || '');
                      setCustomDiagNotes('');
                      setCustomDiagError(null);
                      setIsAddCustomDiagOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#9a7814] border border-[#D4AF37]/60 text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#b89323]" />
                    <span>+ Add Custom Diagnosis</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis Tags Container */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* Built-in Quick Diagnoses */}
                {filteredBuiltInDiags.map((diag) => (
                  <div
                    key={diag}
                    className="group relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 text-zinc-800 text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyQuickDiagnosis(diag)}
                      className="hover:text-[#9a7814] text-left cursor-pointer"
                    >
                      + {diag}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePredefinedDiagnosis(diag);
                      }}
                      title={`Remove default diagnosis shortcut "${diag}"`}
                      className="ml-0.5 p-0.5 rounded-md hover:bg-rose-100 text-zinc-400 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Custom User-Defined Diagnoses */}
                {filteredCustomDiags.map((diag) => (
                  <div
                    key={diag}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/90 hover:bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyQuickDiagnosis(diag)}
                      className="flex items-center gap-1 hover:text-[#9a7814] text-left cursor-pointer"
                    >
                      <Tag className="w-3 h-3 text-[#b89323] shrink-0" />
                      <span>+ {diag}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomDiagnosis(diag);
                      }}
                      title={`Delete custom diagnosis "${diag}"`}
                      className="ml-0.5 p-0.5 rounded-md hover:bg-rose-100 text-amber-800 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Empty State when searching */}
                {filteredBuiltInDiags.length === 0 && filteredCustomDiags.length === 0 && (
                  <div className="w-full py-2 flex flex-col sm:flex-row items-center justify-between gap-2 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500">
                    <span>No diagnoses found matching "{diagSearchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomDiagName(diagSearchQuery.trim());
                        setCustomDiagNotes('');
                        setCustomDiagError(null);
                        setIsAddCustomDiagOpen(true);
                      }}
                      className="text-[#9a7814] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add "{diagSearchQuery}" as Custom Diagnosis</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* "What Treatment Is Needed?" Section */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100">
                <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5 shrink-0">
                  <Sparkles className="w-4 h-4 text-[#b89323]" />
                  <span>What Treatment Is Needed? for Tooth #{selectedToothNum}:</span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {deletedPredefinedTx.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Restore all removed default treatment shortcuts?')) {
                          setDeletedPredefinedTx([]);
                          saveDeletedPredefinedTreatments([]);
                        }
                      }}
                      className="text-[10px] text-zinc-500 hover:text-emerald-700 underline font-medium cursor-pointer shrink-0"
                    >
                      Restore Defaults
                    </button>
                  )}

                  {/* Search box for treatments */}
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search treatments..."
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#D4AF37] focus:bg-white transition-all"
                    />
                    {txSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTxSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Add Custom Treatment button */}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTxName(txSearchQuery.trim() || '');
                      setCustomTxCategory('Endodontics');
                      setCustomTxCost(2500);
                      setCustomTxNotes('');
                      setCustomTxError(null);
                      setIsAddCustomTxOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-100/60 hover:bg-emerald-200/80 text-emerald-900 border border-emerald-300 text-[11px] font-extrabold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+ Add Custom Treatment</span>
                  </button>
                </div>
              </div>

              {/* Treatment Tags Container */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* Built-in Quick Treatments */}
                {filteredBuiltInTx.map((tx) => (
                  <div
                    key={tx.name}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyQuickTreatment(tx)}
                      className="flex items-center gap-1 hover:text-emerald-950 text-left cursor-pointer"
                    >
                      <span>+ {tx.name}</span>
                      <span className="text-[#9a7814] font-mono font-bold">({formatCurrency(tx.cost)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePredefinedTreatment(tx.name);
                      }}
                      title={`Remove default treatment shortcut "${tx.name}"`}
                      className="ml-0.5 p-0.5 rounded-md hover:bg-rose-100 text-emerald-700 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Custom User-Defined Treatments */}
                {filteredCustomTx.map((tx) => (
                  <div
                    key={tx.name}
                    className="group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplyQuickTreatment(tx)}
                      className="flex items-center gap-1 hover:text-[#9a7814] text-left cursor-pointer"
                    >
                      <Tag className="w-3 h-3 text-[#b89323] shrink-0" />
                      <span>+ {tx.name}</span>
                      <span className="text-[#9a7814] font-mono font-bold">({formatCurrency(tx.cost)})</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomTreatment(tx.name);
                      }}
                      title={`Delete custom treatment "${tx.name}"`}
                      className="ml-0.5 p-0.5 rounded-md hover:bg-rose-100 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Empty State when searching */}
                {filteredBuiltInTx.length === 0 && filteredCustomTx.length === 0 && (
                  <div className="w-full py-2 flex flex-col sm:flex-row items-center justify-between gap-2 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500">
                    <span>No treatments found matching "{txSearchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTxName(txSearchQuery.trim());
                        setCustomTxCategory('Endodontics');
                        setCustomTxCost(2500);
                        setCustomTxNotes('');
                        setCustomTxError(null);
                        setIsAddCustomTxOpen(true);
                      }}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add "{txSearchQuery}" as Custom Treatment</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tooth Condition Editor Box */}
            <div className="pt-3 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#b89323]" />
                    <span>Selected Tooth Desk: Tooth #{selectedToothNum}</span>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    FDI Notation {selectedToothRecord.fdiNumber} • {getToothName(selectedToothNum)}
                  </p>
                </div>

                <button
                  onClick={handleSaveToothCondition}
                  className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  Save Tooth Record
                </button>
              </div>

              {/* Selected Tooth Anatomical Showcase + Controls Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Card: Anatomical Visual Showcase */}
                <div className="lg:col-span-4 bg-zinc-50/80 border border-zinc-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Anatomical Preview
                  </div>
                  
                  {/* Visual SVG Tooth Graphic */}
                  <div className="w-16 h-24 my-2 relative flex items-center justify-center">
                    <AnatomicalToothSVG
                      toothNumber={selectedToothNum}
                      fdiNumber={selectedToothRecord.fdiNumber}
                      condition={toothConditionInput}
                      isSelected={true}
                    />
                  </div>

                  {/* Tooth Info */}
                  <div className="text-xs font-black text-zinc-900 mt-1">
                    {getToothName(selectedToothNum).split('(#')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    Universal #{selectedToothNum} / FDI {selectedToothRecord.fdiNumber}
                  </div>

                  {/* Condition Badge */}
                  {(() => {
                    const cfg = CONDITION_CONFIG[toothConditionInput] || CONDITION_CONFIG.Healthy;
                    return (
                      <div className={`mt-2.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bgClass} ${cfg.colorClass} ${cfg.borderClass} flex items-center gap-1.5`}>
                        <span>{cfg.iconSymbol}</span>
                        <span>{cfg.label}</span>
                      </div>
                    );
                  })()}

                  {/* Surface Charting Selector */}
                  <div className="w-full mt-3">
                    <SurfaceSelector
                      toothNumber={selectedToothNum}
                      toothName={getToothName(selectedToothNum)}
                      selectedSurfaces={selectedSurfaces}
                      onChangeSurfaces={(surfaces) => {
                        setSelectedSurfaces(surfaces);
                        onUpdatePatientTeeth(patient.id, selectedToothNum, toothConditionInput, toothNotesInput, selectedToothDiagnoses);
                      }}
                    />
                  </div>
                </div>

                {/* Right Columns: Problems, Treatments, Status & Notes */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Save Feedback Toast */}
                  {saveFeedback && (
                    <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{saveFeedback}</span>
                    </div>
                  )}

                  {/* 1. SELECTED PROBLEMS / CLINICAL FINDINGS */}
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Selected Problems / Clinical Findings (Tooth #{selectedToothNum}):</span>
                      </span>
                      {selectedToothDiagnoses.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          {selectedToothDiagnoses.length} Problem{selectedToothDiagnoses.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {selectedToothDiagnoses.length === 0 ? (
                      <p className="text-xs text-amber-900/60 italic py-1">
                        No problems selected for Tooth #{selectedToothNum} yet. Click a quick diagnosis option above.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 items-center pt-1">
                        {selectedToothDiagnoses.map((diag) => (
                          <span
                            key={diag}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white text-amber-950 border border-amber-300 text-xs font-bold shadow-2xs"
                          >
                            <span className="text-emerald-600 font-extrabold">✓</span>
                            <span>{diag}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleRemoveToothDiagnosis(diag);
                              }}
                              className="ml-1 p-0.5 rounded-full hover:bg-rose-100 text-zinc-400 hover:text-rose-700 transition-colors cursor-pointer"
                              title={`Remove "${diag}" from Tooth #${selectedToothNum}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. SELECTED TREATMENTS & PROCEDURES */}
                  {(() => {
                    const toothTreatments = patient.treatmentPlans.filter(
                      (t) => t.toothNumber === selectedToothNum
                    );
                    return (
                      <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Selected Treatments & Procedures (Tooth #{selectedToothNum}):</span>
                          </span>
                          {toothTreatments.length > 0 && (
                            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              {toothTreatments.length} Procedure{toothTreatments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {toothTreatments.length === 0 ? (
                          <p className="text-xs text-emerald-900/60 italic py-1">
                            No treatments added for Tooth #{selectedToothNum} yet. Click a quick treatment option above.
                          </p>
                        ) : (
                          <div className="space-y-2 pt-1">
                            {toothTreatments.map((tp) => (
                              <div
                                key={tp.id}
                                className="bg-white p-2.5 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-zinc-900 flex items-center gap-2 flex-wrap">
                                    <span>{tp.procedureName}</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                                      {tp.category}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#9a7814]">
                                    <span>Amount:</span>
                                    <span className="text-zinc-500">₹</span>
                                    <input
                                      type="number"
                                      value={tp.estimatedCost}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        if (onUpdateTreatmentPlanCost) {
                                          onUpdateTreatmentPlanCost(patient.id, tp.id, val);
                                        }
                                      }}
                                      className="w-20 px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-[#9a7814] focus:outline-none focus:border-[#D4AF37]"
                                    />
                                  </div>

                                  <select
                                    value={tp.status}
                                    onChange={(e) =>
                                      onUpdateTreatmentStatus(patient.id, tp.id, e.target.value as any)
                                    }
                                    className={`px-2 py-1 rounded-lg text-xs font-bold border outline-none cursor-pointer ${
                                      tp.status === 'Completed'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : tp.status === 'In-Progress'
                                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                                        : tp.status === 'Cancelled'
                                        ? 'bg-zinc-100 text-zinc-500 border-zinc-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                    }`}
                                  >
                                    <option value="Planned">Planned</option>
                                    <option value="In-Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>

                                  {onDeleteTreatmentPlan && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleDeleteToothTreatment(tp.id, tp.procedureName);
                                      }}
                                      className="p-1 rounded-lg hover:bg-rose-100 text-zinc-400 hover:text-rose-700 transition-colors cursor-pointer"
                                      title={`Remove "${tp.procedureName}" from Tooth #${selectedToothNum}`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. TOOTH CONDITION SELECTOR */}
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-2">
                      Tooth Status / Condition:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(Object.keys(CONDITION_CONFIG) as ToothCondition[]).map((cond) => {
                        const cfg = CONDITION_CONFIG[cond];
                        const isSelected = toothConditionInput === cond;
                        return (
                          <button
                            key={cond}
                            type="button"
                            onClick={() => setToothConditionInput(cond)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 min-w-0 ${
                              isSelected
                                ? 'bg-[#D4AF37]/15 text-[#9a7814] border-[#D4AF37] shadow-xs'
                                : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                            }`}
                          >
                            <span className="font-mono text-sm shrink-0">{cfg.iconSymbol}</span>
                            <span className="truncate">{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. CLINICAL FINDINGS & NOTES */}
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-2">
                      Clinical Findings & Notes:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Record clinical observations, root canal depth, mobility, or restoration details..."
                      value={toothNotesInput}
                      onChange={(e) => setToothNotesInput(e.target.value)}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#D4AF37] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: 6-Point Periodontal Charting */}
      {activeTab === 'perio' && (
        <PerioChartModule
          patient={patient}
          onUpdatePerioMap={(perioMap) => {
            patient.perioMap = perioMap;
          }}
        />
      )}

      {/* Tab 3: Treatment Plans & Reusable Templates */}
      {activeTab === 'treatments' && (
        <div className="space-y-6">
          {/* Phased Treatment Plan & Multi-Visit Roadmap */}
          <PhasedTreatmentPlan
            patient={patient}
            onUpdateTreatmentPlans={(plans) => {
              patient.treatmentPlans = plans;
            }}
          />

          {/* Reusable Treatment Templates Banner */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3 text-zinc-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#b89323]" />
                <span>Reusable Treatment Templates (1-Click Package Load)</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEFAULT_TREATMENT_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 hover:border-[#D4AF37] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="font-bold text-zinc-900 text-xs">{tmpl.name}</div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{tmpl.description}</p>
                    <div className="mt-2 space-y-1">
                      {tmpl.items.map((it, idx) => (
                        <div key={idx} className="text-[10px] text-zinc-600 flex justify-between">
                          <span>• {it.procedureName}</span>
                          <span className="font-mono font-bold text-[#9a7814]">{formatCurrency(it.estimatedCost)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyTreatmentTemplate(tmpl)}
                    className="mt-3 w-full py-1.5 rounded-lg bg-[#18181b] hover:bg-zinc-800 text-white text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Apply Package Items
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Treatment Plan Form */}
          <form
            onSubmit={handleAddPlan}
            className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-4 text-zinc-900"
          >
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#b89323]" />
              <span>Add Custom Treatment Procedure</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Procedure Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Root Canal Treatment"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Category</label>
                <select
                  value={newProcCat}
                  onChange={(e) => setNewProcCat(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none"
                >
                  <option value="Endodontics">Endodontics (RCT)</option>
                  <option value="Prosthodontics">Prosthodontics (Crown/Bridge)</option>
                  <option value="Periodontics">Periodontics (Scaling)</option>
                  <option value="Oral Surgery">Oral Surgery (Extraction/Implant)</option>
                  <option value="Orthodontics">Orthodontics (Braces)</option>
                  <option value="Cosmetic">Cosmetic (Whitening)</option>
                  <option value="Preventive">Preventive (Filling)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Tooth # (Optional)</label>
                <input
                  type="number"
                  placeholder="1-32"
                  value={newProcTooth || ''}
                  onChange={(e) => setNewProcTooth(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase">Est. Cost (₹)</label>
                <input
                  type="number"
                  required
                  value={newProcCost}
                  onChange={(e) => setNewProcCost(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 p-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#D4AF37] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white font-bold text-xs"
              >
                Add Procedure
              </button>
            </div>
          </form>

          {/* Treatment Plans Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden text-zinc-900">
            <div className="p-4 border-b border-zinc-100 font-bold text-zinc-900 text-sm">
              Patient Treatment Plan Registry
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-200">
                    <th className="p-3">Procedure</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Tooth #</th>
                    <th className="p-3">Cost</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {patient.treatmentPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-zinc-50/80">
                      <td className="p-3 font-bold">{plan.procedureName}</td>
                      <td className="p-3 text-zinc-500">{plan.category}</td>
                      <td className="p-3 font-mono">#{plan.toothNumber || 'General'}</td>
                      <td className="p-3 font-mono text-[#9a7814] font-bold">
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-500">₹</span>
                          <input
                            type="number"
                            value={plan.estimatedCost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (onUpdateTreatmentPlanCost) {
                                onUpdateTreatmentPlanCost(patient.id, plan.id, val);
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-[#9a7814] focus:outline-none focus:border-[#D4AF37]"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={plan.status}
                          onChange={(e) =>
                            onUpdateTreatmentStatus(patient.id, plan.id, e.target.value as any)
                          }
                          className="px-2 py-1 rounded bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-800 outline-none cursor-pointer"
                        >
                          <option value="Planned">Planned</option>
                          <option value="In-Progress">In-Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenCreateInvoice(patient.id)}
                            className="px-2.5 py-1 rounded bg-[#D4AF37]/15 text-[#9a7814] hover:bg-[#D4AF37]/25 text-[11px] font-bold border border-[#D4AF37]/40 cursor-pointer"
                          >
                            Invoice This
                          </button>
                          {onDeleteTreatmentPlan && (
                            <button
                              type="button"
                              onClick={() => onDeleteTreatmentPlan(patient.id, plan.id)}
                              className="p-1 rounded-lg hover:bg-rose-100 text-zinc-400 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Delete Treatment Plan Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Prescriptions */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Rx Prescriptions History</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSOAPModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#9a7814] font-extrabold text-xs border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-[#b89323]" />
                <span>+ Pre-Written SOAP Templates</span>
              </button>

              <button
                onClick={() => onOpenPrescription(patient.id)}
                className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white font-bold text-xs shadow"
              >
                + Create New Rx
              </button>
            </div>
          </div>

          <SOAPTemplatesModal
            isOpen={isSOAPModalOpen}
            onClose={() => setIsSOAPModalOpen(false)}
            onApplyTemplate={(soapText) => {
              onOpenPrescription(patient.id);
            }}
          />

          <div className="space-y-4">
            {patient.prescriptions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 shadow-sm">
                No prescriptions issued yet. Click "+ Create New Rx" above.
              </div>
            ) : (
              patient.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3 text-zinc-900"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                    <div>
                      <div className="text-xs font-mono font-bold text-[#9a7814]">{rx.id}</div>
                      <div className="text-xs text-zinc-500">Date: {formatDate(rx.date)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() =>
                          sharePrescriptionPdf({
                            rx,
                            doctor,
                            patient,
                            customLogo: getStoredCustomClinicLogo(),
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Share digital prescription PDF via WhatsApp"
                      >
                        <span className="text-xs">💬</span>
                        <span>Share via WhatsApp</span>
                      </button>

                      <button
                        onClick={() => onViewPrescriptionModal(rx)}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Print or preview prescription"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Print Rx</span>
                      </button>

                      {onDeletePrescription && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete this prescription record (${rx.id})?`)) {
                              onDeletePrescription(patient.id, rx.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-colors cursor-pointer"
                          title="Delete prescription record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-zinc-500 font-mono">Diagnosis: </span>
                      <span className="text-zinc-900 font-bold">{rx.diagnosis}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Prescribed Medicines</span>
                    <div className="divide-y divide-zinc-200/80">
                      {rx.medicines.map((m) => (
                        <div key={m.id} className="py-1.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-zinc-900">{m.name}</span>
                            <span className="text-zinc-500 ml-2 font-mono">({m.dosage})</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#9a7814] font-bold">{m.frequency}</span>
                            <span className="text-zinc-500 ml-2">({m.duration})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Invoices & Billing */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Billing Ledger</h3>
            <button
              onClick={() => onOpenCreateInvoice(patient.id)}
              className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white font-bold text-xs shadow"
            >
              + Create Invoice
            </button>
          </div>

          <div className="space-y-3">
            {patient.invoices.map((inv, idx) => (
              <div
                key={`${inv.id}-${idx}`}
                className="bg-white p-4.5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D4AF37] transition-all text-zinc-900"
              >
                <div>
                  <div className="font-mono font-bold text-[#9a7814] text-sm">{inv.id}</div>
                  <div className="text-xs text-zinc-500 font-medium">Date: {formatDate(inv.date)}</div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">
                    {inv.items.length} Item(s) • Method: <span className="font-semibold text-zinc-800">{inv.paymentMethod || 'UPI'}</span>
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="font-bold text-zinc-900 text-sm sm:text-base">{formatCurrency(inv.netTotal)}</div>
                  <div className="text-rose-600 font-mono text-xs font-bold">
                    Due: {formatCurrency(inv.balanceDue)} (Paid: {formatCurrency(inv.paidAmount)})
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => onViewInvoiceModal(inv)}
                    className="px-3 py-2 min-h-[38px] rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="Print Invoice"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#3BA7F5]" />
                    <span>Print Invoice</span>
                  </button>

                  <button
                    onClick={() =>
                      shareInvoicePdf({
                        invoice: inv,
                        doctor,
                        patient,
                        customLogo: getStoredCustomClinicLogo(),
                      })
                    }
                    className="px-3 py-2 min-h-[38px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Share invoice PDF via WhatsApp"
                  >
                    <span className="text-xs">💬</span>
                    <span>Share via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onViewInvoiceModal(inv)}
                    className="px-3 py-2 min-h-[38px] rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold border border-zinc-200 transition-all cursor-pointer flex items-center gap-1.5"
                    title="View full receipt details"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Chronological Visit History Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6 text-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b89323]" />
              <span>Complete Patient Visit & Treatment Timeline</span>
            </h3>
            <span className="text-xs text-zinc-500">Chronological Clinical Records</span>
          </div>

          <div className="relative pl-6 border-l-2 border-zinc-200 space-y-8">
            {/* Combine prescriptions & invoices into chronological timeline */}
            {patient.prescriptions.concat(
              patient.invoices.map((inv) => ({
                id: inv.id,
                patientId: inv.patientId,
                doctorName: '',
                date: inv.date,
                chiefComplaint: 'Billing & Invoice Generation',
                diagnosis: `Net Invoice Total: ${formatCurrency(inv.netTotal)} (Paid: ${formatCurrency(inv.paidAmount)})`,
                medicines: [],
              }))
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-[#D4AF37] border-2 border-white shadow-xs" />
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 font-mono">{formatDate(item.date)}</span>
                    <span className="text-[10px] font-mono text-[#9a7814] font-bold">{item.id}</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-zinc-800">{item.chiefComplaint}</span>
                    <p className="text-zinc-600 mt-1">{item.diagnosis}</p>
                  </div>
                  {item.medicines && item.medicines.length > 0 && (
                    <div className="text-[11px] bg-white p-2.5 rounded-lg border border-zinc-200 text-zinc-700">
                      <span className="font-bold text-zinc-900 block mb-1">Prescribed Medicines:</span>
                      {item.medicines.map((m) => (
                        <div key={m.id} className="flex justify-between">
                          <span>• {m.name} ({m.dosage})</span>
                          <span className="text-[#9a7814] font-bold">{m.frequency}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Clinical Media, X-Rays & Document Vault */}
      {activeTab === 'media' && (
        <DocumentVaultModule
          patient={patient}
          onUpdateMedia={(media) => {
            patient.media = media;
          }}
        />
      )}

      {/* Lightbox Image Modal */}
      {activeMediaUrl && (
        <div
          onClick={() => setActiveMediaUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="max-w-4xl w-full bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-zinc-900 font-bold text-sm">
              <span>Clinical Image Inspection</span>
              <button onClick={() => setActiveMediaUrl(null)} className="text-zinc-500 hover:text-zinc-900">✕ Close</button>
            </div>
            <img src={activeMediaUrl} alt="Inspection" className="w-full max-h-[70vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Modal: Add Custom Quick Diagnosis */}
      {isAddCustomDiagOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-[#9a7814] font-extrabold text-base">
                <PlusCircle className="w-5 h-5 text-[#b89323]" />
                <span>Add Custom Quick Diagnosis</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomDiagOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Create a custom diagnosis shortcut for Tooth #{selectedToothNum} and future clinical entries. It will immediately appear in your Quick Diagnosis list.
            </p>

            <form onSubmit={handleSaveCustomDiagnosis} className="space-y-4 text-xs">
              {/* Diagnosis Name */}
              <div>
                <label className="text-zinc-700 font-bold block mb-1">
                  Diagnosis Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bruxism, Cracked Tooth Syndrome, Pericoronitis"
                  value={customDiagName}
                  onChange={(e) => {
                    setCustomDiagName(e.target.value);
                    if (customDiagError) setCustomDiagError(null);
                  }}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:border-[#D4AF37] outline-none"
                  autoFocus
                />
              </div>

              {/* Optional Description / Notes */}
              <div>
                <label className="text-zinc-700 font-bold block mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Severe occlusal wear, nocturnal grinding, or sensitivity"
                  value={customDiagNotes}
                  onChange={(e) => setCustomDiagNotes(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Inline Error */}
              {customDiagError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{customDiagError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomDiagOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-zinc-950 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Diagnosis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Quick Treatment */}
      {isAddCustomTxOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl text-zinc-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>Add Custom Treatment Shortcut</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCustomTxOpen(false)}
                className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Create a custom treatment shortcut with a default pricing amount for Tooth #{selectedToothNum} and future clinical records.
            </p>

            <form onSubmit={handleSaveCustomTreatment} className="space-y-4 text-xs">
              {/* Treatment Name */}
              <div>
                <label className="text-zinc-700 font-bold block mb-1">
                  Treatment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Mouth Rehabilitation, Night Guard, Veneer"
                  value={customTxName}
                  onChange={(e) => {
                    setCustomTxName(e.target.value);
                    if (customTxError) setCustomTxError(null);
                  }}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:border-[#D4AF37] outline-none"
                  autoFocus
                />
              </div>

              {/* Default Treatment Amount */}
              <div>
                <label className="text-zinc-700 font-bold block mb-1">
                  Default Treatment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 25000"
                  value={customTxCost}
                  onChange={(e) => {
                    setCustomTxCost(parseFloat(e.target.value) || 0);
                    if (customTxError) setCustomTxError(null);
                  }}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 font-mono font-bold focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Optional Description / Notes */}
              <div>
                <label className="text-zinc-700 font-bold block mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes full arch scanning, provisional crowns, and final seating"
                  value={customTxNotes}
                  onChange={(e) => setCustomTxNotes(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-900 focus:border-[#D4AF37] outline-none"
                />
              </div>

              {/* Inline Error */}
              {customTxError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{customTxError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomTxOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-[#D4AF37]" />
                  <span>Save Treatment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

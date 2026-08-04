import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient, Prescription, MedicineItem, DoctorProfile } from '../../types';
import {
  formatTodayISO,
  formatDate,
} from '../../utils/formatters';
import { handleSharePdfOrWhatsApp, sharePrescriptionPdf, printPdfBlob } from '../../utils/pdfShare';
import { generatePrescriptionJsPdf } from '../../utils/jsPdfPrescriptionGenerator';
import { InternalFollowUpTrigger, FollowUpAlertConfig } from '../PatientEMR/InternalFollowUpTrigger';
import {
  getStoredDeletedPredefinedMedicines,
  saveDeletedPredefinedMedicines,
  getStoredCustomMedicines,
  saveCustomMedicines,
  getStoredCustomClinicLogo,
} from '../../utils/storage';
import { FileText, X, Plus, Trash2, Printer, Search, CheckCircle2, Pill, Receipt } from 'lucide-react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  patients: Patient[];
  defaultPatientId?: string;
  initialPrescription?: Prescription | null;
  onSavePrescription: (
    patientId: string,
    rx: Omit<Prescription, 'id' | 'patientId'>,
    followUpAlert?: { dueDate: string; reason: string; notes?: string }
  ) => void;
}

export interface PresetMedicine {
  name: string;
  category: string;
  genericFormula: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
}

const COMMON_DENTAL_MEDS: PresetMedicine[] = [
  { name: 'Amoxicillin 500mg', category: 'Antibiotic', genericFormula: 'Amoxicillin Trihydrate', dosage: '1 Cap', frequency: '1-0-1', timing: 'After Food', duration: '5 Days' },
  { name: 'Augmentin 625mg', category: 'Broad Spectrum Antibiotic', genericFormula: 'Amoxicillin 500mg + Clavulanic Acid 125mg', dosage: '1 Tab', frequency: '1-0-1', timing: 'After Food', duration: '5 Days' },
  { name: 'Ketorolac DT 10mg', category: 'NSAID / Analgesic', genericFormula: 'Ketorolac Tromethamine (Dispersible)', dosage: '1 Tab in 1/2 glass water', frequency: '1-0-1', timing: 'SOS Pain', duration: '3 Days' },
  { name: 'Ibuprofen 400mg + Paracetamol 325mg', category: 'Analgesic & Antipyretic', genericFormula: 'Ibuprofen + Paracetamol', dosage: '1 Tab', frequency: '1-0-1', timing: 'After Food', duration: '3 Days' },
  { name: 'Zerodol-SP', category: 'Anti-inflammatory Painkiller', genericFormula: 'Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg', dosage: '1 Tab', frequency: '1-0-1', timing: 'After Food', duration: '5 Days' },
  { name: 'Pantoprazole 40mg', category: 'Antacid / PPI', genericFormula: 'Pantoprazole Sodium', dosage: '1 Cap', frequency: '1-0-0', timing: 'Before Food', duration: '5 Days' },
  { name: 'Chlorhexidine 0.2% Mouthwash', category: 'Antiseptic Mouthwash', genericFormula: 'Chlorhexidine Gluconate 0.2%', dosage: '10ml swish & spit', frequency: '1-0-1', timing: 'After Brushing', duration: '7 Days' },
  { name: 'Metronidazole 400mg', category: 'Anti-amoebic / Antibacterial', genericFormula: 'Metronidazole', dosage: '1 Tab', frequency: '1-1-1', timing: 'After Food', duration: '5 Days' },
  { name: 'Doxycycline 100mg', category: 'Tetracycline Antibiotic', genericFormula: 'Doxycycline Hyclate', dosage: '1 Cap', frequency: '1-0-1', timing: 'After Food', duration: '7 Days' },
  { name: 'Chymoral Forte', category: 'Anti-edematous / Anti-swelling', genericFormula: 'Trypsin Chymotrypsin (100k AU)', dosage: '1 Tab', frequency: '1-1-1', timing: 'Before Food', duration: '5 Days' },
  { name: 'Tranexa 500mg', category: 'Hemostatic (Bleeding)', genericFormula: 'Tranexamic Acid', dosage: '1 Tab', frequency: '1-1-1', timing: 'After Food', duration: '3 Days' },
  { name: 'Triamcinolone Acetonide 0.1% Paste', category: 'Topical Steroid (Ulcer)', genericFormula: 'Triamcinolone Acetonide Oral Paste', dosage: 'Apply thin layer', frequency: '0-0-1', timing: 'At Bedtime', duration: '5 Days' },
];

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  doctor,
  patients,
  defaultPatientId,
  initialPrescription,
  onSavePrescription,
}) => {
  const [patientId, setPatientId] = useState(defaultPatientId || (patients[0]?.id || ''));
  const [chiefComplaint, setChiefComplaint] = useState('Severe pain in lower right tooth (#30)');
  const [diagnosis, setDiagnosis] = useState('Acute Irreversible Pulpitis #30');
  const [medicines, setMedicines] = useState<MedicineItem[]>([
    { id: '1', name: 'Amoxicillin 500mg', dosage: '1 Cap', frequency: '1-0-1', timing: 'After Food', duration: '5 Days' },
    { id: '2', name: 'Ketorolac DT 10mg', dosage: '1 Tab in 1/2 glass water', frequency: '1-0-1', timing: 'SOS Pain', duration: '3 Days' },
  ]);
  const [specialInstructions, setSpecialInstructions] = useState('Avoid hot/spicy food on affected side. Warm saline rinses 3x daily.');
  const [rxDate, setRxDate] = useState<string>(formatTodayISO());
  const [nextVisitDate, setNextVisitDate] = useState(formatTodayISO());
  const [isPreview, setIsPreview] = useState(false);
  const [followUpConfig, setFollowUpConfig] = useState<FollowUpAlertConfig | null>(null);

  // Persistent Presets State
  const [deletedPresetMeds, setDeletedPresetMeds] = useState<string[]>(() => getStoredDeletedPredefinedMedicines());
  const [customPresetMeds, setCustomPresetMeds] = useState<PresetMedicine[]>(() => getStoredCustomMedicines());

  // Search & Custom Form State
  const rxPreviewRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDosage, setCustomDosage] = useState('1 Tablet');
  const [customFrequency, setCustomFrequency] = useState('1-0-1');
  const [customTiming, setCustomTiming] = useState('After Food');
  const [customDuration, setCustomDuration] = useState('5 Days');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredCustomClinicLogo());

  React.useEffect(() => {
    if (isOpen) {
      setCustomLogo(getStoredCustomClinicLogo());
      if (initialPrescription) {
        setPatientId(initialPrescription.patientId);
        setDiagnosis(initialPrescription.diagnosis || '');
        setChiefComplaint(initialPrescription.chiefComplaint || '');
        setMedicines(initialPrescription.medicines || []);
        setSpecialInstructions(initialPrescription.specialInstructions || '');
        setRxDate(initialPrescription.date || formatTodayISO());
        setNextVisitDate(initialPrescription.nextVisitDate || formatTodayISO());
        setIsPreview(true);
      } else {
        if (defaultPatientId) {
          setPatientId(defaultPatientId);
        } else if (patients.length > 0) {
          setPatientId(patients[0].id);
        }
        setRxDate(formatTodayISO());
        setIsPreview(false);
      }
    }
  }, [isOpen, initialPrescription, defaultPatientId, patients]);

  if (!isOpen) return null;

  const selectedPatient = patients.find((p) => p.id === patientId);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleAddQuickMed = (med: PresetMedicine) => {
    const newItem: MedicineItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      timing: med.timing,
      duration: med.duration,
    };
    setMedicines((prev) => [...prev, newItem]);
    showToast(`Added "${med.name}" to prescription`);
  };

  const handleDeletePresetMed = (medName: string) => {
    const updatedDeleted = [...deletedPresetMeds, medName];
    setDeletedPresetMeds(updatedDeleted);
    saveDeletedPredefinedMedicines(updatedDeleted);

    if (customPresetMeds.some((cm) => cm.name === medName)) {
      const updatedCustom = customPresetMeds.filter((cm) => cm.name !== medName);
      setCustomPresetMeds(updatedCustom);
      saveCustomMedicines(updatedCustom);
    }

    showToast(`Deleted quick template "${medName}"`);
  };

  const handleToggleCustomForm = () => {
    if (!isCustomFormOpen && searchQuery.trim() && !customName) {
      setCustomName(searchQuery.trim());
    }
    setIsCustomFormOpen(!isCustomFormOpen);
  };

  const handleAddCustomMedicine = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customName.trim()) return;

    const newItem: MedicineItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      name: customName.trim(),
      dosage: customDosage.trim() || '1 Tablet',
      frequency: customFrequency.trim() || '1-0-1',
      timing: customTiming.trim() || 'After Food',
      duration: customDuration.trim() || '5 Days',
    };

    setMedicines((prev) => [...prev, newItem]);

    // Save as custom preset as well
    const newPreset: PresetMedicine = {
      name: customName.trim(),
      category: 'Custom',
      genericFormula: customName.trim(),
      dosage: customDosage.trim() || '1 Tablet',
      frequency: customFrequency.trim() || '1-0-1',
      timing: customTiming.trim() || 'After Food',
      duration: customDuration.trim() || '5 Days',
    };
    if (!customPresetMeds.some((m) => m.name === newPreset.name)) {
      const updatedCustom = [...customPresetMeds, newPreset];
      setCustomPresetMeds(updatedCustom);
      saveCustomMedicines(updatedCustom);
    }

    showToast(`Added custom medicine "${customName.trim()}" to Rx`);

    // Reset custom form
    setCustomName('');
    setCustomDosage('1 Tablet');
    setCustomFrequency('1-0-1');
    setCustomTiming('After Food');
    setCustomDuration('5 Days');
    setIsCustomFormOpen(false);
  };

  const handleRemoveMed = (id: string) => {
    const medToRemove = medicines.find((m) => m.id === id);
    setMedicines(medicines.filter((m) => m.id !== id));
    if (medToRemove) {
      showToast(`Removed "${medToRemove.name}" from prescription`);
    }
  };

  const handleDirectPrintA4 = () => {
    if (!selectedPatient) return;
    const currentRx: Prescription = {
      id: initialPrescription?.id || `RX-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorName: doctor.name,
      date: rxDate || formatTodayISO(),
      chiefComplaint,
      diagnosis,
      medicines,
      specialInstructions,
      nextVisitDate,
    };
    const pdfBlob = generatePrescriptionJsPdf(currentRx, doctor, selectedPatient, getStoredCustomClinicLogo());
    printPdfBlob(pdfBlob);
  };

  const handleShareWhatsAppA4 = () => {
    if (!selectedPatient) return;
    const currentRx: Prescription = {
      id: initialPrescription?.id || `RX-${Date.now().toString().slice(-4)}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      doctorName: doctor.name,
      date: rxDate || formatTodayISO(),
      chiefComplaint,
      diagnosis,
      medicines,
      specialInstructions,
      nextVisitDate,
    };
    sharePrescriptionPdf({
      rx: currentRx,
      doctor,
      patient: selectedPatient,
      customLogo: getStoredCustomClinicLogo(),
    });
  };

  const handleUpdateMed = (id: string, field: keyof MedicineItem, value: string) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Filter Quick Dental Templates
  const allPresetMeds = [...COMMON_DENTAL_MEDS, ...customPresetMeds];
  const activePresetMeds = allPresetMeds.filter((med) => !deletedPresetMeds.includes(med.name));

  const filteredMeds = activePresetMeds.filter((med) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      med.name.toLowerCase().includes(q) ||
      med.category.toLowerCase().includes(q) ||
      med.genericFormula.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    if (medicines.length === 0) {
      showToast('Please add at least one medicine to generate prescription.');
      return;
    }

    const followUpAlert = followUpConfig && followUpConfig.enabled
      ? {
          dueDate: followUpConfig.dueDate,
          reason: followUpConfig.reason || `Rx Follow-Up for ${diagnosis}`,
          notes: followUpConfig.notes,
        }
      : undefined;

    onSavePrescription(patientId, {
      doctorName: doctor.name,
      date: formatTodayISO(),
      chiefComplaint,
      diagnosis,
      medicines,
      specialInstructions,
      nextVisitDate,
    }, followUpAlert);

    setIsPreview(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-[94vw] sm:w-[90vw] md:w-[90vw] max-w-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[#1E293B] max-h-[92vh] flex flex-col justify-between">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8ECF3] pb-4 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3BA7F5] font-extrabold text-base sm:text-lg">
            <FileText className="w-5 h-5 text-[#3BA7F5]" />
            <span>Digital Rx Prescription Generator</span>
          </div>
          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1E293B] hover:bg-slate-100 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Toast Notification */}
        {feedbackMessage && (
          <div className="my-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {!isPreview ? (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-3">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Select Patient *</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] font-medium focus:border-[#3BA7F5] outline-none cursor-pointer"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn} - {p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#1E293B] font-bold block mb-1.5">Chief Complaint *</label>
                  <input
                    type="text"
                    required
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#1E293B] font-bold block mb-1.5">Clinical Diagnosis *</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none"
                  />
                </div>
              </div>

              {/* Section 1: Medicine Search & Quick Templates */}
              <div className="space-y-3 p-4 bg-[#F8FAFC] rounded-2xl border border-[#E8ECF3]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-[#1E293B] font-extrabold text-xs flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-[#3BA7F5]" />
                    <span>Search & Quick Medicine Templates:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleCustomForm}
                    className="px-4 py-2 min-h-[44px] rounded-2xl bg-[#EBF7FC] hover:bg-[#3BA7F5]/20 text-[#1E88A8] border border-[#3BA7F5]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#3BA7F5]" />
                    <span>{isCustomFormOpen ? 'Close Custom Form' : '+ Add Custom Medicine'}</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search medicines (e.g., Augmentin, Zerodol, Amoxicillin)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 p-3 min-h-[44px] bg-white border border-[#E8ECF3] rounded-2xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:border-[#3BA7F5] outline-none font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-[#94A3B8] hover:text-[#1E293B] p-1 rounded-full cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Custom Medicine Manual Form */}
                {isCustomFormOpen && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                        <Pill className="w-4 h-4 text-amber-600" />
                        <span>Add Custom Medicine Manually</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCustomFormOpen(false)}
                        className="text-amber-800 hover:text-amber-950 text-xs font-bold p-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">Medicine Name & Strength *</label>
                        <input
                          type="text"
                          placeholder="e.g. Zerodol-SP or Ofloxacin 200mg"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          className="w-full p-2.5 min-h-[44px] bg-white border border-amber-300 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-[#3BA7F5]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">Dosage / Form</label>
                        <input
                          type="text"
                          placeholder="e.g. 1 Tablet, 1 Capsule, 10ml"
                          value={customDosage}
                          onChange={(e) => setCustomDosage(e.target.value)}
                          className="w-full p-2.5 min-h-[44px] bg-white border border-amber-300 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-[#3BA7F5]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">Frequency</label>
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="e.g. 1-0-1 or Once Daily"
                            value={customFrequency}
                            onChange={(e) => setCustomFrequency(e.target.value)}
                            className="w-full p-2.5 min-h-[44px] bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-[#1E88A8] outline-none focus:border-[#3BA7F5]"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {['1-0-1', '1-1-1', '1-0-0', '0-0-1', 'Once Daily', 'SOS Pain'].map((f) => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => setCustomFrequency(f)}
                                className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                                  customFrequency === f ? 'bg-[#3BA7F5] text-white border-[#3BA7F5]' : 'bg-white text-zinc-700 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">Timing</label>
                        <div className="space-y-1.5">
                          <select
                            value={customTiming}
                            onChange={(e) => setCustomTiming(e.target.value)}
                            className="w-full p-2.5 min-h-[44px] bg-white border border-amber-300 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-[#3BA7F5] cursor-pointer"
                          >
                            <option value="After Food">After Food (After Meals)</option>
                            <option value="Before Food">Before Food (Empty Stomach)</option>
                            <option value="With Food">With Food</option>
                            <option value="At Bedtime">At Bedtime</option>
                            <option value="After Brushing">After Brushing</option>
                            <option value="SOS Pain">SOS (Only When Pain)</option>
                          </select>
                          <div className="flex flex-wrap gap-1.5">
                            {['After Food', 'Before Food', 'With Food', 'SOS Pain'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setCustomTiming(t)}
                                className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  customTiming === t ? 'bg-[#3BA7F5] text-white border-[#3BA7F5]' : 'bg-white text-zinc-700 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-amber-900 block mb-1">Duration</label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder="e.g. 3 Days, 5 Days, 7 Days"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            className="flex-1 p-2.5 min-h-[44px] bg-white border border-amber-300 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-[#3BA7F5]"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            {['3 Days', '5 Days', '7 Days', '10 Days'].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setCustomDuration(d)}
                                className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                  customDuration === d ? 'bg-[#3BA7F5] text-white border-[#3BA7F5]' : 'bg-white text-zinc-700 border-amber-200 hover:bg-amber-100'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleAddCustomMedicine}
                        disabled={!customName.trim()}
                        className="px-5 py-2.5 min-h-[44px] bg-[#3BA7F5] hover:bg-[#2A96E4] disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Rx</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Filtered Preset Medicine List */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredMeds.length === 0 ? (
                    <div className="p-3 text-center text-[#64748B] text-xs italic bg-white rounded-2xl border border-[#E8ECF3]">
                      No preset medicines match "{searchQuery}". Click <strong>"+ Add Custom Medicine"</strong> above to add it manually!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredMeds.map((med) => (
                        <div
                          key={med.name}
                          className="px-3 py-2 min-h-[44px] rounded-2xl bg-white hover:bg-[#EBF7FC] border border-[#E8ECF3] hover:border-[#3BA7F5]/50 transition-all group flex items-center justify-between shadow-2xs"
                        >
                          <button
                            type="button"
                            onClick={() => handleAddQuickMed(med)}
                            className="flex-1 flex items-center justify-between text-left cursor-pointer min-w-0 mr-2 py-1 min-h-[44px]"
                            title={`Add ${med.name} to prescription`}
                          >
                            <span className="font-bold text-xs text-[#1E293B] group-hover:text-[#3BA7F5] truncate">
                              + {med.name}
                            </span>
                            <span className="text-[11px] font-mono font-extrabold text-[#1E88A8] shrink-0 ml-1.5">
                              • {med.frequency}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDeletePresetMed(med.name);
                            }}
                            className="p-2 text-[#94A3B8] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                            title={`Delete template "${med.name}"`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Prescribed Medicines List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[#1E293B] font-bold text-xs flex items-center gap-1.5">
                    <span>Prescribed Medicines ({medicines.length}):</span>
                  </label>
                  {medicines.length === 0 && (
                    <span className="text-xs text-rose-600 font-bold">
                      At least 1 medicine required
                    </span>
                  )}
                </div>

                {medicines.length === 0 ? (
                  <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-dashed border-[#E8ECF3] text-center text-[#64748B] text-xs italic">
                    No medicines added yet. Select from quick templates or click "+ Add Custom Medicine".
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {medicines.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-white rounded-2xl border border-[#E8ECF3] hover:border-[#3BA7F5]/40 transition-colors shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xs font-black text-[#3BA7F5]">Rx</span>
                            <input
                              type="text"
                              required
                              placeholder="Medicine Name & Strength"
                              value={m.name}
                              onChange={(e) => handleUpdateMed(m.id, 'name', e.target.value)}
                              className="flex-1 p-2.5 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-xl text-xs font-bold text-[#1E293B] outline-none focus:border-[#3BA7F5]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMed(m.id)}
                            className="px-3 py-2 min-h-[44px] bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer shrink-0 text-xs font-bold flex items-center gap-1 border border-rose-200"
                            title={`Delete ${m.name} from prescription`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-[#64748B] block mb-0.5">Dosage</label>
                            <input
                              type="text"
                              placeholder="1 Tablet"
                              value={m.dosage}
                              onChange={(e) => handleUpdateMed(m.id, 'dosage', e.target.value)}
                              className="w-full p-2 min-h-[40px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-xl text-[#1E293B] text-xs outline-none focus:border-[#3BA7F5]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#64748B] block mb-0.5">Frequency</label>
                            <input
                              type="text"
                              placeholder="1-0-1"
                              value={m.frequency}
                              onChange={(e) => handleUpdateMed(m.id, 'frequency', e.target.value)}
                              className="w-full p-2 min-h-[40px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-xl text-[#1E88A8] font-mono font-bold text-xs outline-none focus:border-[#3BA7F5]"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#64748B] block mb-0.5">Timing</label>
                            <select
                              value={m.timing || 'After Food'}
                              onChange={(e) => handleUpdateMed(m.id, 'timing', e.target.value)}
                              className="w-full p-2 min-h-[40px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-xl text-[#1E293B] text-xs outline-none focus:border-[#3BA7F5] cursor-pointer"
                            >
                              <option value="After Food">After Food</option>
                              <option value="Before Food">Before Food</option>
                              <option value="With Food">With Food</option>
                              <option value="At Bedtime">At Bedtime</option>
                              <option value="After Brushing">After Brushing</option>
                              <option value="SOS Pain">SOS Pain</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-[#64748B] block mb-0.5">Duration</label>
                            <input
                              type="text"
                              placeholder="5 Days"
                              value={m.duration}
                              onChange={(e) => handleUpdateMed(m.id, 'duration', e.target.value)}
                              className="w-full p-2 min-h-[40px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-xl text-[#1E293B] text-xs outline-none focus:border-[#3BA7F5]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Special Instructions & Advice</label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none"
                />
              </div>

              {/* Internal Doctor Follow-Up / Alert Trigger */}
              <InternalFollowUpTrigger
                initialReason={`Check post-op healing for ${diagnosis || 'prescription'}`}
                onChange={setFollowUpConfig}
              />
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-[#E8ECF3] flex flex-wrap items-center justify-end gap-3 z-20 shrink-0 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 min-h-[44px] rounded-full bg-[#F1F5F9] text-[#64748B] font-bold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={medicines.length === 0}
                className="px-6 py-3 min-h-[44px] rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] disabled:opacity-50 text-white font-bold shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer"
              >
                Generate & Preview Rx
              </button>
            </div>
          </form>
        ) : (
          /* Printable Rx Letterhead View with Sticky Footer */
          <div className="flex-1 flex flex-col justify-between overflow-hidden pt-3">
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4">
              {/* Standard A4 Rx Direct Letterhead Preview */}
              <div
                ref={rxPreviewRef}
                className="bg-white text-[#0F172A] rounded-2xl border border-slate-200 relative overflow-hidden max-w-3xl mx-auto shadow-sm p-6 sm:p-8 space-y-6"
              >
                  {/* Top Cyan Accent Strip */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-[#0284C7]" />

                  <div className="relative z-10 space-y-5 pt-1">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      {/* Left: Clinic Identity (Logoless) */}
                      <div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-[#0284C7] uppercase tracking-tight">
                          {doctor.clinicName || 'RK DENTAL CLINIC'}
                        </h1>
                        <p className="text-xs font-semibold text-slate-600">MULTISPECIALTY DENTAL CARE & ORAL SURGERY</p>
                        <p className="text-[11px] text-slate-500">{doctor.clinicAddress || 'No. 626, Melin Road, Veyyakkam 604410'}</p>
                        <p className="text-[11px] text-[#0284C7] font-medium">
                          Tel: {doctor.clinicPhone || '8883261285 / 04182-247369'} | Email: {doctor.clinicEmail || 'info@rkdentalclinic.com'}
                        </p>
                      </div>

                      {/* Right: Doctor Profile */}
                      <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <h2 className="text-sm font-bold text-[#0F172A]">
                          {doctor.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Dr. V. Radhakrishnan'}
                        </h2>
                        <p className="text-xs text-slate-600">{doctor.qualifications || 'B.D.S. - Dental Surgeon'}</p>
                        <p className="text-[11px] font-bold text-[#0284C7]">Reg No: {doctor.regNumber || '25927'}</p>
                        <p className="text-[10px] text-slate-400 italic">Dental EMR Verified</p>
                      </div>
                    </div>

                    {/* Patient Information Bar */}
                    <div className="bg-[#F8FAFC] border border-[#0284C7]/30 rounded-xl p-3.5 text-xs font-semibold text-[#0F172A] grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[#0284C7] font-bold block text-[10px] uppercase">Patient Name</span>
                        <span className="font-bold text-[#0F172A]">{selectedPatient?.name || 'ZAID KHAN'}</span>
                      </div>
                      <div>
                        <span className="text-[#0284C7] font-bold block text-[10px] uppercase">Age / Gender</span>
                        <span>{selectedPatient?.age || 28} Yrs / {selectedPatient?.gender || 'Male'}</span>
                      </div>
                      <div>
                        <span className="text-[#0284C7] font-bold block text-[10px] uppercase">Date</span>
                        <span>{formatDate(rxDate)}</span>
                      </div>
                      <div>
                        <span className="text-[#0284C7] font-bold block text-[10px] uppercase">MRN / Rx ID</span>
                        <span className="font-mono text-[#0284C7] font-bold">{selectedPatient?.mrn || initialPrescription?.id || 'RX-1001'}</span>
                      </div>
                    </div>

                    {/* Clinical Details */}
                    {(chiefComplaint || diagnosis) && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs space-y-1">
                        {chiefComplaint && (
                          <p><strong className="text-[#0284C7]">Chief Complaint:</strong> <span className="text-slate-700">{chiefComplaint}</span></p>
                        )}
                        {diagnosis && (
                          <p><strong className="text-[#0284C7]">Diagnosis:</strong> <span className="text-slate-700">{diagnosis}</span></p>
                        )}
                      </div>
                    )}

                    {/* Rx Symbol */}
                    <div className="text-3xl font-serif font-black text-[#0284C7]">Rx</div>

                    {/* Medicines Table */}
                    <div className="overflow-x-auto min-w-0">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0E7490] text-white font-bold text-[11px]">
                            <th className="py-2 px-3 rounded-l-md">#</th>
                            <th className="py-2 px-3">Medicine Name & Dosage</th>
                            <th className="py-2 px-3">Dosage</th>
                            <th className="py-2 px-3">Frequency / Timing</th>
                            <th className="py-2 px-3 rounded-r-md">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 border-x border-b border-slate-100">
                          {medicines.map((m, idx) => (
                            <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                              <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-[#0F172A]">{m.name}</div>
                                {m.dosage && <div className="text-[10px] text-slate-500">Dose: {m.dosage}</div>}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{m.dosage || '1 Tab'}</td>
                              <td className="py-2.5 px-3 font-bold text-[#0284C7]">
                                {m.frequency}{m.timing ? ` (${m.timing})` : ''}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-[#0F172A]">{m.duration}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Special Instructions */}
                    {specialInstructions && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-0.5">
                        <p className="font-bold text-amber-900">DOCTOR ADVICE / SPECIAL INSTRUCTIONS:</p>
                        <p className="text-amber-800 italic">{specialInstructions}</p>
                      </div>
                    )}

                    {/* Follow-Up Date */}
                    {nextVisitDate && (
                      <div className="inline-block bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0284C7]">
                        Next Visit / Follow-up: {formatDate(nextVisitDate)}
                      </div>
                    )}

                    {/* Footer Section */}
                    <div className="border-t border-slate-200 pt-4 text-[11px] flex justify-between items-end gap-4">
                      <div>
                        <p className="font-bold text-[#0284C7]">Digital EMR Certified Prescription</p>
                        <p className="text-[10px] text-slate-400">* Please follow prescribed dosage instructions carefully.</p>
                      </div>
                      <div className="text-center border-t border-slate-400 pt-1 w-44">
                        <p className="font-bold text-[#0F172A]">
                          {doctor.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Dr. V. Radhakrishnan'}
                        </p>
                        <p className="text-[10px] text-slate-500">Doctor Signature & Stamp</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 80mm POS Thermal Receipt Rx View */
                <div ref={rxPreviewRef} className="bg-white text-[#1E293B] p-4 rounded-2xl space-y-3 text-[11px] font-mono border-2 border-dashed border-[#E8ECF3] max-w-[340px] mx-auto shadow-xs">
                  <div className="text-center border-b border-zinc-200 pb-2 space-y-0.5">
                    <h2 className="font-extrabold text-sm text-[#1E293B] uppercase">{doctor.clinicName}</h2>
                    <p className="text-[10px] text-[#64748B]">{doctor.clinicAddress}</p>
                    <p className="text-[10px] text-[#64748B]">Tel: {doctor.clinicPhone}</p>
                    <div className="pt-1 text-[10px] font-bold text-[#1E293B]">*** PRESCRIPTION RECEIPT ***</div>
                  </div>

                  <div className="text-[10px] space-y-0.5 border-b border-zinc-200 pb-2">
                    <div>Date: {formatDate(rxDate)}</div>
                    <div>Patient: <span className="font-bold">{selectedPatient?.name}</span></div>
                    <div>MRN: {selectedPatient?.mrn || 'N/A'}</div>
                    <div>Doctor: Dr. {doctor.name}</div>
                    <div>Dx: <span className="font-bold">{diagnosis || 'Dental Condition'}</span></div>
                  </div>

                  <div className="space-y-2 border-b border-zinc-200 pb-2">
                    <div className="font-bold text-[10px] text-[#1E293B] uppercase">Rx Medications:</div>
                    {medicines.map((m, idx) => (
                      <div key={m.id} className="text-[10px] space-y-0.5">
                        <div className="font-bold text-[#1E293B]">{idx + 1}. {m.name}</div>
                        <div className="text-[9px] text-[#64748B] pl-2">
                          Dose: {m.dosage} | Freq: {m.frequency} ({m.timing || 'After Food'}) | Dur: {m.duration}
                        </div>
                      </div>
                    ))}
                  </div>

                  {specialInstructions && (
                    <div className="text-[10px] border-b border-zinc-200 pb-2 space-y-0.5">
                      <span className="font-bold">Advice:</span>
                      <p className="text-[#64748B] italic">{specialInstructions}</p>
                    </div>
                  )}

                  <div className="text-center text-[9px] text-[#94A3B8] border-t border-zinc-200 pt-2 font-sans italic">
                    Digital EMR Verified Rx
                  </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-[#E8ECF3] flex flex-wrap items-center justify-between gap-3 z-20 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className="px-5 py-3 min-h-[44px] rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] text-xs font-bold border border-[#E8ECF3] transition-colors cursor-pointer"
              >
                Back to Edit
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDirectPrintA4}
                  className="px-5 py-3 min-h-[44px] rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#3BA7F5]" /> Print
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsAppA4}
                  className="px-4 py-3 min-h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-colors cursor-pointer"
                  title="Share PDF Prescription layout via WhatsApp"
                >
                  <FileText className="w-4 h-4 text-emerald-100" /> Share via WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

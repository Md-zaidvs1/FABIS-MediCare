import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, ChairStatus } from '../../types';
import { formatTodayISO } from '../../utils/formatters';
import { getStoredChairs } from '../../utils/storage';
import { scheduleSmsReminderApi } from '../../utils/smsApi';
import {
  CalendarPlus,
  X,
  Search,
  UserPlus,
  Clock,
  AlertTriangle,
  Check,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  defaultDate?: string;
  defaultPatientId?: string;
  onBookAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onOpenAddPatient?: () => void;
}

// Helper to convert time strings ("10:30 AM") to minutes from midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 540;
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numericPart = clean.replace(/(AM|PM)/g, '').trim();
  const parts = numericPart.split(':');
  let hours = parseInt(parts[0], 10) || 9;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Helper to calculate End Time string from Start Time and Duration
function calculateEndTime(startStr: string, durationMins: number = 30): string {
  if (!startStr) return '';
  const startMins = parseTimeToMinutes(startStr);
  const endMins = startMins + durationMins;
  let hours = Math.floor(endMins / 60) % 24;
  const minutes = endMins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  let formattedHours = hours % 12;
  if (formattedHours === 0) formattedHours = 12;
  const hStr = formattedHours < 10 ? `0${formattedHours}` : `${formattedHours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hStr}:${mStr} ${period}`;
}

// Generate 5-minute interval time options from 9:00 AM to 10:00 PM
const FIVE_MIN_TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let mins = 540; mins <= 1320; mins += 5) {
    let hours = Math.floor(mins / 60);
    const m = mins % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    slots.push(`${hStr}:${mStr} ${period}`);
  }
  return slots;
})();

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

const PROCEDURE_SUGGESTIONS = [
  'Consultation & Diagnosis',
  'Root Canal Treatment (RCT)',
  'Ultrasonic Scaling & Polishing',
  'Zirconia Crown Measurement & Fitting',
  'Composite Tooth Restoration',
  'Complicated Surgical Extraction',
  'Dental Implant Surgery',
  'Orthodontic Alignment',
  'Teeth Whitening',
];

function parseDateInputToIso(inputStr: string): string | null {
  if (!inputStr) return null;
  const clean = inputStr.trim();
  const parts = clean.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      day = parseInt(parts[2], 10);
    }
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      if (year < 100) year += 2000;
      const mStr = month < 10 ? `0${month}` : `${month}`;
      const dStr = day < 10 ? `0${day}` : `${day}`;
      return `${year}-${mStr}-${dStr}`;
    }
  }
  return null;
}

function formatIsoToDDMMYYYY(isoStr: string): string {
  if (!isoStr || !isoStr.includes('-')) return isoStr;
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  defaultDate,
  defaultPatientId,
  onBookAppointment,
  onOpenAddPatient,
}) => {
  // Patient Search & Selection State
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatientId || '');
  const [isChangingPatient, setIsChangingPatient] = useState<boolean>(!defaultPatientId);

  // Form Field States
  const [availableChairs, setAvailableChairs] = useState<ChairStatus[]>(getStoredChairs());
  const [chair, setChair] = useState<string>(() => availableChairs[0]?.id || 'Chair 1');

  useEffect(() => {
    const handleUpdate = () => {
      const chairs = getStoredChairs();
      setAvailableChairs(chairs);
      if (chairs.length > 0 && !chairs.some((c) => c.id === chair)) {
        setChair(chairs[0].id);
      }
    };
    window.addEventListener('fabis_chairs_updated', handleUpdate);
    return () => window.removeEventListener('fabis_chairs_updated', handleUpdate);
  }, [chair]);

  const [date, setDate] = useState(defaultDate || formatTodayISO());
  const [manualDateStr, setManualDateStr] = useState(formatIsoToDDMMYYYY(defaultDate || formatTodayISO()));
  const [entryMethod, setEntryMethod] = useState<'picker' | 'manual'>('picker');

  const [timeSlot, setTimeSlot] = useState('09:30 AM');
  const [isCustomTimeInput, setIsCustomTimeInput] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [procedure, setProcedure] = useState('Root Canal Treatment (RCT)');
  const [doctorName, setDoctorName] = useState('Dr. Fabis (BDS, MDS)');
  const [status, setStatus] = useState<Appointment['status']>('Scheduled');
  const [notes, setNotes] = useState('');
  const [sendSmsReminder, setSendSmsReminder] = useState(true);

  // Sync default props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultPatientId) {
        setSelectedPatientId(defaultPatientId);
        setIsChangingPatient(false);
      } else if (patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patients[0].id);
        setIsChangingPatient(false);
      }
      if (defaultDate) {
        setDate(defaultDate);
        setManualDateStr(formatIsoToDDMMYYYY(defaultDate));
      }
    }
  }, [isOpen, defaultPatientId, defaultDate, patients]);

  // Filter patients by Name / MRN / Mobile
  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients.slice(0, 8);
    const q = patientSearchQuery.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.replace(/\D/g, '').includes(q)
    );
  }, [patients, patientSearchQuery]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  // Check Overlapping Appointments for selected Date & Chair
  const overlapWarning = useMemo(() => {
    if (!date || !timeSlot || !chair || !selectedPatient) return null;

    const newStartMins = parseTimeToMinutes(timeSlot);
    const newEndMins = newStartMins + durationMinutes;

    // Collect all appointments across all patients for this date & chair
    for (const p of patients) {
      for (const apt of p.appointments) {
        if (apt.date === date && apt.chair === chair && apt.status !== 'Cancelled') {
          const aptStart = parseTimeToMinutes(apt.timeSlot);
          const aptEnd = aptStart + (apt.durationMinutes || 30);

          // Overlap condition: max(start1, start2) < min(end1, end2)
          if (Math.max(newStartMins, aptStart) < Math.min(newEndMins, aptEnd)) {
            return {
              patientName: apt.patientName,
              timeSlot: apt.timeSlot,
              endTime: calculateEndTime(apt.timeSlot, apt.durationMinutes || 30),
              procedure: apt.procedure,
            };
          }
        }
      }
    }
    return null;
  }, [patients, date, timeSlot, durationMinutes, chair, selectedPatient]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const newAptId = `APT-${Date.now()}`;

    onBookAppointment({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      date,
      timeSlot,
      durationMinutes,
      procedure,
      chair,
      status,
      notes,
    });

    if (sendSmsReminder) {
      scheduleSmsReminderApi({
        appointmentId: newAptId,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
        appointmentDate: date,
        appointmentTime: timeSlot,
        procedure,
        chair,
      }).catch((err) => console.error('Failed to queue automated SMS reminder:', err));
    }

    onClose();
  };

  const computedEndTime = calculateEndTime(timeSlot, durationMinutes);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-[#E8ECF3] dark:border-slate-800 rounded-[28px] w-[95vw] sm:w-[90vw] md:w-[85vw] max-w-2xl p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.15)] text-[#1E293B] dark:text-slate-100 max-h-[92vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8ECF3] dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3BA7F5] font-black text-base sm:text-lg">
            <div className="p-2 rounded-2xl bg-[#3BA7F5]/10 text-[#3BA7F5]">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
                Book Appointment
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Schedule clinical visit & chair allocation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-4 text-xs">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            
            {/* 1. PATIENT SELECTION & SEARCH */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-slate-900 dark:text-slate-100 font-extrabold text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#3BA7F5]" />
                  <span>Patient Selection *</span>
                </label>

                {onOpenAddPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAddPatient();
                    }}
                    className="px-3 py-1 bg-[#3BA7F5]/10 hover:bg-[#3BA7F5]/20 text-[#3BA7F5] rounded-xl font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Register New Patient</span>
                  </button>
                )}
              </div>

              {!isChangingPatient && selectedPatient ? (
                /* Selected Patient Summary Card */
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedPatient.name}</span>
                      <span className="text-xs font-mono font-bold text-[#3BA7F5] bg-[#3BA7F5]/10 px-2 py-0.5 rounded-md">
                        {selectedPatient.mrn}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-mono">
                      <span>📱 {selectedPatient.phone}</span>
                      <span>🎂 {selectedPatient.age} yrs ({selectedPatient.gender})</span>
                      <span>🩸 Blood Group: {selectedPatient.bloodGroup || 'O+'}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsChangingPatient(true)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl cursor-pointer shrink-0"
                  >
                    Change Patient
                  </button>
                </div>
              ) : (
                /* Patient Search Box & Results Dropdown */
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patient by Name, MRN, or Mobile number..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs outline-none focus:border-[#3BA7F5]"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">
                        No patient found matching search query.
                      </div>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setIsChangingPatient(false);
                          }}
                          className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                            selectedPatientId === p.id ? 'bg-[#3BA7F5]/10 font-bold' : ''
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 ml-2">
                              ({p.mrn})
                            </span>
                          </div>
                          <span className="text-xs font-mono text-emerald-600 font-bold">
                            {p.phone}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* OVERLAP WARNING BANNER */}
            {overlapWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 rounded-2xl p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                  <div className="font-black">⚠️ Schedule Overlap Warning</div>
                  <div>
                    Chair <strong className="font-black">{chair}</strong> already has an appointment with{' '}
                    <strong className="font-black">{overlapWarning.patientName}</strong> ({overlapWarning.timeSlot} – {overlapWarning.endTime}) for {overlapWarning.procedure}.
                  </div>
                  <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold italic">
                    Doctor Notice: Double-booking is allowed if multiple clinical staff are present.
                  </div>
                </div>
              </div>
            )}

            {/* 2. DATE & TIME SELECTION */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#3BA7F5]" /> Date & Time Entry Mode
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setEntryMethod('picker')}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      entryMethod === 'picker'
                        ? 'bg-[#3BA7F5] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Method 1: Picker
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMethod('manual')}
                    className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                      entryMethod === 'manual'
                        ? 'bg-[#3BA7F5] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Method 2: Manual Type (DD/MM/YYYY)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Appointment Date */}
                <div>
                  <label className="text-slate-900 dark:text-slate-100 font-extrabold block mb-1">
                    Appointment Date *
                  </label>
                  {entryMethod === 'picker' ? (
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setManualDateStr(formatIsoToDDMMYYYY(e.target.value));
                      }}
                      className="w-full p-3 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none font-bold"
                    />
                  ) : (
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="DD/MM/YYYY (e.g. 03/08/2026)"
                        value={manualDateStr}
                        onChange={(e) => {
                          const val = e.target.value;
                          setManualDateStr(val);
                          const parsed = parseDateInputToIso(val);
                          if (parsed) {
                            setDate(parsed);
                          }
                        }}
                        className="w-full p-3 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none"
                      />
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                        Parsed Iso Date: {date}
                      </span>
                    </div>
                  )}
                </div>

                {/* Appointment Time */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-900 dark:text-slate-100 font-extrabold flex items-center gap-1">
                      <span>Appointment Time *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomTimeInput(!isCustomTimeInput)}
                      className="text-[10px] font-bold text-[#3BA7F5] hover:underline cursor-pointer"
                    >
                      {isCustomTimeInput ? 'Select Interval' : 'Manual Time'}
                    </button>
                  </div>

                  {isCustomTimeInput || entryMethod === 'manual' ? (
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10:30 AM or 02:45 PM"
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full p-3 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none"
                    />
                  ) : (
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full p-3 min-h-[44px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none cursor-pointer font-bold font-mono"
                    >
                      {FIVE_MIN_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* 3. DURATION PILLS & CALCULATED END TIME */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-900 dark:text-slate-100 font-extrabold">
                  Appointment Duration *
                </label>
                <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  ⏱️ Slot: {timeSlot} – {computedEndTime} ({durationMinutes} mins)
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {DURATION_PRESETS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => {
                      setDurationMinutes(dur);
                      setIsCustomDuration(false);
                    }}
                    className={`px-3 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                      durationMinutes === dur && !isCustomDuration
                        ? 'bg-[#3BA7F5] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {dur} min
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsCustomDuration(true)}
                  className={`px-3 py-2 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    isCustomDuration
                      ? 'bg-[#3BA7F5] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Custom
                </button>

                {isCustomDuration && (
                  <div className="flex items-center gap-1 min-w-[120px]">
                    <input
                      type="number"
                      min={5}
                      max={480}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                      className="w-20 p-2 border border-slate-300 rounded-xl font-mono font-bold text-xs"
                    />
                    <span className="text-xs font-bold text-slate-500">mins</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. PROCEDURE / TREATMENT */}
            <div className="space-y-1.5">
              <label className="text-slate-900 dark:text-slate-100 font-extrabold block">
                Procedure / Treatment *
              </label>

              <input
                type="text"
                required
                placeholder="Type or select procedure below..."
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none"
              />

              {/* Procedure Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {PROCEDURE_SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setProcedure(item)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      procedure === item
                        ? 'bg-[#3BA7F5]/20 text-[#3BA7F5] border border-[#3BA7F5]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. DOCTOR & CHAIR SELECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-900 dark:text-slate-100 font-extrabold block mb-1">
                  Attending Doctor *
                </label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none cursor-pointer font-bold"
                >
                  <option value="Dr. Fabis (BDS, MDS - Endodontist)">Dr. Fabis (BDS, MDS - Endodontist)</option>
                  <option value="Dr. Sarah Khan (BDS - General Dentist)">Dr. Sarah Khan (BDS - General Dentist)</option>
                  <option value="Dr. Rahul Mehta (MDS - Oral Surgeon)">Dr. Rahul Mehta (MDS - Oral Surgeon)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-900 dark:text-slate-100 font-extrabold block mb-1">
                  Assigned Dental Chair *
                </label>
                <select
                  value={chair}
                  onChange={(e) => setChair(e.target.value as any)}
                  className="w-full p-3 min-h-[44px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none cursor-pointer font-bold"
                >
                  {availableChairs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 6. STATUS SELECTION */}
            <div>
              <label className="text-slate-900 dark:text-slate-100 font-extrabold block mb-1">
                Appointment Initial Status
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'Scheduled', label: '🟢 Confirmed', color: 'bg-emerald-600 text-white' },
                  { id: 'Arrived', label: '🟡 Waiting', color: 'bg-amber-600 text-white' },
                  { id: 'In-Chair', label: '🔵 In Treatment', color: 'bg-sky-600 text-white' },
                  { id: 'Completed', label: '✅ Completed', color: 'bg-slate-700 text-white' },
                  { id: 'Cancelled', label: '⚫ Cancelled', color: 'bg-rose-600 text-white' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatus(st.id as Appointment['status'])}
                    className={`p-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
                      status === st.id
                        ? `${st.color} shadow-xs ring-2 ring-offset-1 ring-[#3BA7F5]`
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. NOTES / INSTRUCTIONS */}
            <div>
              <label className="text-slate-900 dark:text-slate-100 font-extrabold block mb-1">
                Clinical Notes / Operatory Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Patient prefers 2% Lignocaine with adrenaline, keep X-ray sensor ready..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:border-[#3BA7F5] outline-none text-xs"
              />
            </div>

            {/* 8. AUTOMATED SMS REMINDER */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="sendSmsReminder"
                  checked={sendSmsReminder}
                  onChange={(e) => setSendSmsReminder(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="sendSmsReminder" className="cursor-pointer">
                  <span className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200 block">
                    Queue Automated TextBee SMS Reminder
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">
                    Automatically sends 24h & 2h before visit to {selectedPatient?.phone || 'patient'}
                  </span>
                </label>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full shrink-0">
                TextBee Gateway
              </span>
            </div>
          </div>

          {/* Modal Action Footer */}
          <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs pt-4 pb-1 border-t border-[#E8ECF3] dark:border-slate-800 flex items-center justify-end gap-3 z-20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 min-h-[44px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 min-h-[44px] rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-black shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Appointment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

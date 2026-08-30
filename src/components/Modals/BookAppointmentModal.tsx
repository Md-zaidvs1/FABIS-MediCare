import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment } from '../../types';
import {
  formatTodayISO,
  formatPatientId,
  parseTimeToMinutes,
  formatMinutesToTime,
  time24To12,
  time12To24,
  normalizeTimeSlot,
} from '../../utils/formatters';
import { scheduleSmsReminderApi } from '../../utils/smsApi';
import {
  CalendarPlus,
  X,
  Search
} from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  defaultDate?: string;
  defaultTimeSlot?: string;
  defaultPatientId?: string;
  onBookAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  onOpenAddPatient?: () => void;
}

const STANDARD_PROCEDURES = [
  'Consultation & Diagnosis',
  'Root Canal Treatment (RCT)',
  'Ultrasonic Scaling & Polishing',
  'Composite Restoration / Filling',
  'Zirconia Crown Measurement & Fitting',
  'Extraction / Surgical Extraction',
  'Dental Implant Placement',
  'Orthodontic Adjustment',
  'Teeth Whitening',
  'Pediatric Dental Care',
];

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  defaultDate,
  defaultTimeSlot,
  defaultPatientId,
  onBookAppointment,
  onOpenAddPatient,
}) => {
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(defaultPatientId || '');
  const [isSearchingPatient, setIsSearchingPatient] = useState<boolean>(!defaultPatientId);

  // Form Fields
  const [date, setDate] = useState(defaultDate || formatTodayISO());
  const [timeSlot, setTimeSlot] = useState(defaultTimeSlot ? normalizeTimeSlot(defaultTimeSlot) : '09:30 AM');
  const [timeInput, setTimeInput] = useState(defaultTimeSlot ? time12To24(defaultTimeSlot) : '09:30');
  const durationMinutes = 30;
  const [procedure, setProcedure] = useState('Consultation & Diagnosis');
  const [isCustomProcedure, setIsCustomProcedure] = useState(false);
  const [customProcedureName, setCustomProcedureName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultPatientId) {
        setSelectedPatientId(defaultPatientId);
        setIsSearchingPatient(false);
      } else if (patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patients[0].id);
        setIsSearchingPatient(false);
      }
      if (defaultDate) {
        setDate(defaultDate);
      }
      const initialSlot = defaultTimeSlot ? normalizeTimeSlot(defaultTimeSlot) : '09:30 AM';
      setTimeSlot(initialSlot);
      setTimeInput(time12To24(initialSlot));
    }
  }, [isOpen, defaultPatientId, defaultDate, defaultTimeSlot, patients]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || patients[0];
  }, [patients, selectedPatientId]);

  const filteredPatients = useMemo(() => {
    if (!patientSearchQuery.trim()) return patients.slice(0, 8);
    const q = patientSearchQuery.trim().toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.phone.replace(/\D/g, '').includes(q)
    );
  }, [patients, patientSearchQuery]);

  // Conflict detection
  const hasConflict = useMemo(() => {
    if (!date || !timeSlot) return false;
    const newStartMins = parseTimeToMinutes(timeSlot);
    const newEndMins = newStartMins + durationMinutes;

    for (const p of patients) {
      for (const apt of p.appointments || []) {
        if (apt.date === date && apt.status !== 'Cancelled') {
          const aptStart = parseTimeToMinutes(apt.timeSlot);
          const aptEnd = aptStart + (apt.durationMinutes || 30);
          if (Math.max(newStartMins, aptStart) < Math.min(newEndMins, aptEnd)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [patients, date, timeSlot, durationMinutes]);

  if (!isOpen) return null;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTimeInput(val);
    if (val) {
      setTimeSlot(time24To12(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    const finalTimeSlot = normalizeTimeSlot(timeSlot || time24To12(timeInput));
    const activeProcedure = isCustomProcedure ? (customProcedureName.trim() || 'Custom Procedure') : procedure;

    onBookAppointment({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      date,
      timeSlot: finalTimeSlot,
      durationMinutes,
      procedure: activeProcedure,
      chair: 'Main Clinic',
      status: 'Scheduled',
      notes: notes.trim(),
    });

    scheduleSmsReminderApi({
      appointmentId: `APT-${Date.now()}`,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      appointmentDate: date,
      appointmentTime: finalTimeSlot,
      procedure: activeProcedure,
      chair: 'Main Clinic',
    }).catch(() => {});

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 sm:p-6 shadow-xl text-slate-800 max-h-[92vh] flex flex-col justify-between">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
            <CalendarPlus className="w-5 h-5 text-sky-500" />
            <span>Book Appointment</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pt-3.5 text-xs">
          
          {/* 1. Patient */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Patient</label>
              {onOpenAddPatient && (
                <button
                  type="button"
                  onClick={onOpenAddPatient}
                  className="text-xs font-bold text-sky-600 hover:text-sky-800 cursor-pointer"
                >
                  + New Patient
                </button>
              )}
            </div>

            {!isSearchingPatient && selectedPatient ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-sm text-slate-900">{selectedPatient.name}</div>
                  <div className="text-xs font-mono text-slate-500 font-semibold">Patient ID: {formatPatientId(selectedPatient)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSearchingPatient(true)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search patient name or ID..."
                    value={patientSearchQuery}
                    onChange={(e) => setPatientSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatientId(p.id);
                        setIsSearchingPatient(false);
                      }}
                      className="w-full p-2.5 text-left flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="font-bold text-slate-900">{p.name}</span>
                      <span className="text-xs font-mono font-bold text-sky-600">{formatPatientId(p)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-sky-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Time</label>
              <input
                type="time"
                value={timeInput}
                onChange={handleTimeChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-sky-500"
                required
              />
            </div>
          </div>

          {/* 3. Procedure / Treatment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Procedure / Treatment</label>
              <button
                type="button"
                onClick={() => setIsCustomProcedure(!isCustomProcedure)}
                className="text-xs font-bold text-sky-600 hover:text-sky-800 cursor-pointer"
              >
                {isCustomProcedure ? 'Choose from list' : '+ Custom'}
              </button>
            </div>

            {isCustomProcedure ? (
              <input
                type="text"
                value={customProcedureName}
                onChange={(e) => setCustomProcedureName(e.target.value)}
                placeholder="Type procedure name..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-sky-500"
                autoFocus
              />
            ) : (
              <select
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-sky-500 cursor-pointer"
              >
                {STANDARD_PROCEDURES.map((proc) => (
                  <option key={proc} value={proc}>{proc}</option>
                ))}
              </select>
            )}
          </div>

          {/* 5. Clinical Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Clinical Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Tooth #16 sensitivity check"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

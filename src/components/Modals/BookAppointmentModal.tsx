import React, { useState } from 'react';
import { Patient, Appointment } from '../../types';
import { formatTodayISO } from '../../utils/formatters';
import { CalendarPlus, X } from 'lucide-react';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  defaultDate?: string;
  defaultPatientId?: string;
  onBookAppointment: (appointment: Omit<Appointment, 'id'>) => void;
}

export const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  defaultDate,
  defaultPatientId,
  onBookAppointment,
}) => {
  const [patientId, setPatientId] = useState(defaultPatientId || (patients[0]?.id || ''));
  const [date, setDate] = useState(defaultDate || formatTodayISO());
  const [timeSlot, setTimeSlot] = useState('11:00 AM');
  const [procedure, setProcedure] = useState('Root Canal Treatment (RCT)');
  const [chair, setChair] = useState<Appointment['chair']>('Chair 1 (Main)');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPatient = patients.find((p) => p.id === patientId);
    if (!selectedPatient) return;

    onBookAppointment({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientPhone: selectedPatient.phone,
      date,
      timeSlot,
      durationMinutes: 45,
      procedure,
      chair,
      status: 'Scheduled',
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-[92vw] sm:w-[90vw] md:w-[90vw] max-w-lg p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[#1E293B] max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8ECF3] pb-4 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3BA7F5] font-extrabold text-base sm:text-lg">
            <CalendarPlus className="w-5 h-5 text-[#3BA7F5]" />
            <span>Book Clinical Visit</span>
          </div>
          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1E293B] rounded-full hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body & Sticky Action Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-3 text-xs">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Select Patient *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none cursor-pointer font-semibold"
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
                <label className="text-[#1E293B] font-bold block mb-1.5">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[#1E293B] font-bold block mb-1.5">Time Slot *</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none cursor-pointer font-semibold"
                >
                  {['09:30 AM', '10:15 AM', '11:00 AM', '11:45 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:30 PM', '06:30 PM'].map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Procedure / Treatment Sitting *</label>
              <select
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none cursor-pointer font-semibold"
              >
                <option value="Consultation & Diagnosis">Consultation & Diagnosis</option>
                <option value="Root Canal Sitting 1 (Access)">Root Canal Sitting 1 (Access)</option>
                <option value="Root Canal Sitting 2 (Obturation)">Root Canal Sitting 2 (Obturation)</option>
                <option value="Zirconia Crown Measurement & Fitting">Zirconia Crown Measurement & Fitting</option>
                <option value="Ultrasonic Scaling & Oral Prophylaxis">Ultrasonic Scaling & Oral Prophylaxis</option>
                <option value="Complicated Surgical Extraction">Complicated Surgical Extraction</option>
                <option value="Composite Tooth Restoration">Composite Tooth Restoration</option>
                <option value="Dental Implant Phase 1 Surgery">Dental Implant Phase 1 Surgery</option>
              </select>
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Assigned Dental Chair</label>
              <select
                value={chair}
                onChange={(e) => setChair(e.target.value as any)}
                className="w-full p-3 min-h-[44px] bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none cursor-pointer font-semibold"
              >
                <option value="Chair 1 (Main)">Chair 1 (Main Operatory)</option>
                <option value="Chair 2 (Minor)">Chair 2 (Minor Procedures)</option>
                <option value="Chair 3 (Surgical)">Chair 3 (Surgical OT)</option>
              </select>
            </div>

            <div>
              <label className="text-[#1E293B] font-bold block mb-1.5">Doctor / Assistant Instructions</label>
              <textarea
                rows={2}
                placeholder="e.g. Keep local anesthetic 2% ready, verify sinus tract..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E8ECF3] rounded-2xl text-[#1E293B] focus:border-[#3BA7F5] outline-none"
              />
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-4 pb-1 border-t border-[#E8ECF3] flex items-center justify-end gap-3 z-20 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 min-h-[44px] rounded-full bg-[#F1F5F9] text-[#64748B] font-bold hover:bg-[#E2E8F0] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 min-h-[44px] rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer"
            >
              Confirm Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

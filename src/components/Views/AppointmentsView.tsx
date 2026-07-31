import React, { useState } from 'react';
import { Patient, Appointment, FollowUpTask } from '../../types';
import { formatDate } from '../../utils/formatters';
import { CalendarDays, Plus, Clock, CheckSquare, PhoneCall, ArrowUpRight, Bell, Users } from 'lucide-react';
import { WaitingListDrawer } from '../Appointments/WaitingListDrawer';
import { RecallTrackerModal } from '../Appointments/RecallTrackerModal';

interface AppointmentsViewProps {
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onOpenBookAppointment: () => void;
  onUpdateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  onUpdateFollowUpStatus: (followUpId: string, status: FollowUpTask['status']) => void;
  onAddAppointment?: (appointment: Omit<Appointment, 'id'>) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  patients,
  onSelectPatient,
  onOpenBookAppointment,
  onUpdateAppointmentStatus,
  onUpdateFollowUpStatus,
  onAddAppointment,
}) => {
  const [tab, setTab] = useState<'appointments' | 'followups'>('appointments');
  const [isWaitingListOpen, setIsWaitingListOpen] = useState<boolean>(false);
  const [isRecallOpen, setIsRecallOpen] = useState<boolean>(false);

  // Local Walk-In Queue State
  const [waitingQueue, setWaitingQueue] = useState<Appointment[]>([
    {
      id: 'queue-1',
      patientId: 'p1',
      patientName: 'Rohan Sharma',
      patientPhone: '+91 98450 11223',
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Immediate Walk-In',
      durationMinutes: 20,
      procedure: 'Acute Toothache Examination',
      chair: 'Chair 1 (Main Operatory)',
      status: 'Scheduled',
    },
  ]);

  const allAppointments = patients.flatMap((p) => p.appointments);
  const allFollowUps = patients.flatMap((p) => p.followUps);

  const handleAddWaitingList = (patientName: string, phone: string, procedure: string) => {
    const newQueueItem: Appointment = {
      id: `queue-${Date.now()}`,
      patientId: `temp-${Date.now()}`,
      patientName,
      patientPhone: phone,
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'Walk-In Queue',
      durationMinutes: 30,
      procedure,
      chair: 'Chair 1 (Main Operatory)',
      status: 'Scheduled',
    };
    setWaitingQueue((prev) => [...prev, newQueueItem]);
  };

  const handleSeatPatient = (apptId: string, chair: Appointment['chair'], timeSlot: string) => {
    const queueItem = waitingQueue.find((q) => q.id === apptId);
    if (queueItem && onAddAppointment) {
      onAddAppointment({
        patientId: queueItem.patientId,
        patientName: queueItem.patientName,
        patientPhone: queueItem.patientPhone,
        date: new Date().toISOString().split('T')[0],
        timeSlot,
        durationMinutes: 30,
        procedure: queueItem.procedure,
        chair,
        status: 'In-Chair',
      });
      setWaitingQueue((prev) => prev.filter((q) => q.id !== apptId));
      alert(`Seated ${queueItem.patientName} at ${chair} (${timeSlot})!`);
    }
  };

  const handleRemoveWaitingList = (apptId: string) => {
    setWaitingQueue((prev) => prev.filter((q) => q.id !== apptId));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
        <div>
          <h2 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-[#3BA7F5]" />
            <span>Calendar & Clinical Visits Schedule</span>
          </h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">
            Manage operatory chair bookings, patient consultations, walk-in waiting list, and recall alerts
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsWaitingListOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-[#9a7814] font-extrabold text-xs border border-amber-300 transition-all cursor-pointer shadow-2xs"
          >
            <Clock className="w-4 h-4 text-[#b89323]" />
            <span>Waiting List Queue ({waitingQueue.length})</span>
          </button>

          <button
            onClick={() => setIsRecallOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-extrabold text-xs border border-sky-300 transition-all cursor-pointer shadow-2xs"
          >
            <Bell className="w-4 h-4 text-sky-600" />
            <span>Patient Recall Tracker</span>
          </button>

          <button
            onClick={() => onOpenBookAppointment()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Book Visit</span>
          </button>
        </div>
      </div>

      <WaitingListDrawer
        isOpen={isWaitingListOpen}
        onClose={() => setIsWaitingListOpen(false)}
        waitingListAppointments={waitingQueue}
        patients={patients}
        onAddWaitingList={handleAddWaitingList}
        onSeatPatient={handleSeatPatient}
        onRemoveWaitingList={handleRemoveWaitingList}
      />

      <RecallTrackerModal
        isOpen={isRecallOpen}
        onClose={() => setIsRecallOpen(false)}
        patients={patients}
        onAddAppointment={(appt) => {
          if (onAddAppointment) onAddAppointment(appt);
        }}
      />

      <div className="flex items-center gap-2 border-b border-[#E8ECF3] pb-3 touch-manipulation overflow-x-auto">
        <button
          onClick={() => setTab('appointments')}
          className={`px-5 py-3 min-h-[44px] rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            tab === 'appointments'
              ? 'bg-[#EBF7FC] text-[#1E88A8] border border-[#3BA7F5]/40 shadow-xs'
              : 'bg-white text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 border border-[#E8ECF3]'
          }`}
        >
          Scheduled Appointments ({allAppointments.length})
        </button>
        <button
          onClick={() => setTab('followups')}
          className={`px-5 py-3 min-h-[44px] rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            tab === 'followups'
              ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
              : 'bg-white text-[#64748B] hover:text-[#1E293B] hover:bg-slate-100 border border-[#E8ECF3]'
          }`}
        >
          Follow-Up Checklist ({allFollowUps.length})
        </button>
      </div>

      {tab === 'appointments' ? (
        <div className="space-y-3">
          {allAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white p-5 rounded-[24px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-[#3BA7F5]/40 transition-all text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-[#1E88A8] bg-[#EBF7FC] px-3 py-1 rounded-xl border border-[#3BA7F5]/30">
                    {formatDate(apt.date)} @ {apt.timeSlot}
                  </span>
                  <button
                    onClick={() => onSelectPatient(apt.patientId)}
                    className="font-bold text-[17px] text-[#1E293B] hover:text-[#3BA7F5] flex items-center gap-1 cursor-pointer"
                  >
                    {apt.patientName} <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
                  </button>
                </div>
                <div className="text-[#64748B] font-semibold text-sm">
                  {apt.procedure} • <span className="text-[#94A3B8]">{apt.chair}</span>
                </div>
                {apt.notes && <p className="text-xs text-[#64748B] italic">"{apt.notes}"</p>}
              </div>

              <select
                value={apt.status}
                onChange={(e) => onUpdateAppointmentStatus(apt.id, e.target.value as any)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E8ECF3] text-xs font-bold text-[#1E293B] outline-none cursor-pointer"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Arrived">Arrived</option>
                <option value="In Consultation">In Consultation</option>
                <option value="In-Chair">In-Chair / Operatory</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {allFollowUps.map((flw) => (
            <div
              key={flw.id}
              className="bg-white p-5 rounded-[24px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-purple-700 font-bold bg-purple-50 px-3 py-1 rounded-xl border border-purple-200">
                    Due: {formatDate(flw.dueDate)}
                  </span>
                  <button
                    onClick={() => onSelectPatient(flw.patientId)}
                    className="font-bold text-[17px] text-[#1E293B] hover:text-[#5B4CF0] cursor-pointer"
                  >
                    {flw.patientName}
                  </button>
                </div>
                <p className="text-sm font-medium text-[#64748B]">{flw.reason}</p>
              </div>

              <select
                value={flw.status}
                onChange={(e) => onUpdateFollowUpStatus(flw.id, e.target.value as any)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E8ECF3] text-xs font-bold text-[#1E293B] outline-none cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Call Placed">Call Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

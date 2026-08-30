import React, { useState } from 'react';
import { Patient, Appointment } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { shareTextMessage } from '../../utils/pdfShare';
import { Bell, Calendar, CheckCircle2, MessageCircle, Phone, Send, Sparkles, User, X } from 'lucide-react';

interface RecallTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onAddAppointment: (appointment: Omit<Appointment, 'id'>) => void;
}

export const RecallTrackerModal: React.FC<RecallTrackerModalProps> = ({
  isOpen,
  onClose,
  patients,
  onAddAppointment,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | '6-Month Checkup' | 'Post-Op Follow-Up' | 'Scaling Recall'>('All');
  const [remindedIds, setRemindedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Build recall items list from patients who have status 'Follow-up Due' or upcoming follow-up tasks or appointments
  const recallList: {
    id: string;
    patient: Patient;
    recallType: '6-Month Checkup' | 'Post-Op Follow-Up' | 'Scaling Recall';
    dueDate: string;
    reason: string;
    phone: string;
  }[] = [];

  (patients || []).forEach((p) => {
    // Check followUps
    if (p.followUps && p.followUps.length > 0) {
      (p.followUps || []).forEach((f) => {
        recallList.push({
          id: f.id,
          patient: p,
          recallType: f.reason.toLowerCase().includes('scaling') ? 'Scaling Recall' : 'Post-Op Follow-Up',
          dueDate: f.dueDate,
          reason: f.reason,
          phone: p.phone,
        });
      });
    } else if (p.status === 'Follow-up Due' || p.status === 'Completed') {
      recallList.push({
        id: `recall-${p.id}`,
        patient: p,
        recallType: '6-Month Checkup',
        dueDate: 'Due This Week',
        reason: 'Routine 6-Month Oral Health & Dental Hygiene Assessment',
        phone: p.phone,
      });
    }
  });

  const filteredList = activeTab === 'All'
    ? recallList
    : recallList.filter((item) => item.recallType === activeTab);

  const handleSendWhatsApp = (item: typeof recallList[0]) => {
    const message = `Hello ${item.patient.name}, this is FABIS MediCare Dental Clinic. You are due for your ${item.recallType} (${item.reason}). Kindly contact us to book your preferred appointment slot.`;
    shareTextMessage({
      title: `FABIS MediCare - ${item.recallType}`,
      text: message,
      patientMobile: item.phone || item.patient.phone || '',
      patientName: item.patient.name,
    });

    setRemindedIds((prev) => ({ ...prev, [item.id]: true }));
  };

  const handleQuickBook = (item: typeof recallList[0]) => {
    onAddAppointment({
      patientId: item.patient.id,
      patientName: item.patient.name,
      patientPhone: item.patient.phone,
      date: new Date().toISOString().split('T')[0],
      timeSlot: '02:30 PM',
      durationMinutes: 30,
      procedure: item.reason,
      chair: 'Chair 1 (Main Operatory)',
      status: 'Scheduled',
      isFollowUp: true,
      recallDueDate: item.dueDate,
      recallType: item.recallType === '6-Month Checkup' ? '6-Month Routine Checkup' : 'Post-Op Follow-Up',
      recallStatus: 'Confirmed',
    });
    alert(`Appointment booked for ${item.patient.name}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sky-50 via-white to-amber-50 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                <span>Automated Patient Recall & Follow-Up Engine</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  WhatsApp / SMS Triggers
                </span>
              </h2>
              <p className="text-xs text-zinc-500">Track patients due for 6-month checkups or post-op hygiene reviews</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          {['All', '6-Month Checkup', 'Post-Op Follow-Up', 'Scaling Recall'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#3BA7F5] text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-200 border border-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Recalls List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredList.map((item) => {
            const isReminded = remindedIds[item.id];

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 hover:border-sky-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200">
                      {item.recallType}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {item.dueDate}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                    <span>{item.patient.name}</span>
                    <span className="text-xs font-mono text-zinc-400 font-medium">({item.patient.mrn})</span>
                  </h3>

                  <p className="text-xs text-zinc-600 font-medium">{item.reason}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSendWhatsApp(item)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isReminded
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs active:scale-95'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{isReminded ? 'Reminder Sent ✓' : 'WhatsApp Trigger'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickBook(item)}
                    className="px-3 py-1.5 rounded-xl bg-[#3BA7F5] hover:bg-sky-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Visit</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No patients due for recall under this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

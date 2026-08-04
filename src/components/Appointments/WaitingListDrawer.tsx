import React, { useState } from 'react';
import { Appointment, Patient } from '../../types';
import { getStoredChairs } from '../../utils/storage';
import { Clock, Plus, Trash2, User, UserCheck, AlertCircle, X, ChevronRight } from 'lucide-react';

interface WaitingListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  waitingListAppointments: Appointment[];
  patients: Patient[];
  onAddWaitingList: (patientName: string, phone: string, procedure: string) => void;
  onSeatPatient: (appointmentId: string, chair: Appointment['chair'], timeSlot: string) => void;
  onRemoveWaitingList: (appointmentId: string) => void;
}

export const WaitingListDrawer: React.FC<WaitingListDrawerProps> = ({
  isOpen,
  onClose,
  waitingListAppointments,
  patients,
  onAddWaitingList,
  onSeatPatient,
  onRemoveWaitingList,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [procedureInput, setProcedureInput] = useState('Walk-In Consultation / Emergency');
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [targetChair, setTargetChair] = useState<Appointment['chair']>('Chair 1 (Main Operatory)');
  const [targetSlot, setTargetSlot] = useState('11:00 AM');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    onAddWaitingList(nameInput.trim(), phoneInput.trim() || '+91 98765 00000', procedureInput);
    setNameInput('');
    setPhoneInput('');
  };

  const handleSeatSubmit = (apptId: string) => {
    onSeatPatient(apptId, targetChair, targetSlot);
    setSelectedApptId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 bg-gradient-to-r from-amber-50 to-white border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-[#9a7814] border border-amber-200 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900">Walk-In Waiting List & Queue</h2>
              <p className="text-[11px] text-zinc-500">Manage queue for immediate chair assignment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form to Add Walk-In */}
        <form onSubmit={handleCreate} className="p-4 bg-zinc-50 border-b border-zinc-200 space-y-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-zinc-700 block">
            + Add Walk-In Patient to Queue
          </span>

          <div className="space-y-2">
            <input
              type="text"
              required
              placeholder="Patient Name *"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#3BA7F5]"
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Mobile Phone"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#3BA7F5]"
              />

              <input
                type="text"
                placeholder="Reason / Procedure"
                value={procedureInput}
                onChange={(e) => setProcedureInput(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-none focus:border-[#3BA7F5]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#D4AF37] hover:bg-[#b89323] text-zinc-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Waiting Drawer</span>
          </button>
        </form>

        {/* Queue Items List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-bold">
            <span>Patients Waiting ({waitingListAppointments.length})</span>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Live Queue
            </span>
          </div>

          {waitingListAppointments.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-[#3BA7F5] shadow-xs space-y-2 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-[#9a7814] font-mono font-bold text-xs flex items-center justify-center">
                    #{index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-900">{item.patientName}</h4>
                    <span className="text-[10px] font-mono text-zinc-500">{item.patientPhone}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveWaitingList(item.id)}
                  className="p-1 rounded-lg hover:bg-rose-100 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove from Waiting List"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-[11px] text-zinc-600 font-medium bg-zinc-50 p-2 rounded-xl">
                Procedure: <span className="font-bold text-zinc-800">{item.procedure}</span>
              </div>

              {/* Assign to Chair button */}
              {selectedApptId === item.id ? (
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block">Chair:</label>
                      <select
                        value={targetChair}
                        onChange={(e) => setTargetChair(e.target.value as any)}
                        className="w-full p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"
                      >
                        {getStoredChairs().map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-zinc-500 block">Time Slot:</label>
                      <input
                        type="text"
                        value={targetSlot}
                        onChange={(e) => setTargetSlot(e.target.value)}
                        className="w-full p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSeatSubmit(item.id)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all cursor-pointer"
                    >
                      Confirm Seat Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedApptId(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-100 text-zinc-600 font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedApptId(item.id)}
                  className="w-full py-1.5 rounded-xl bg-[#3BA7F5]/10 hover:bg-[#3BA7F5] text-[#3BA7F5] hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign Chair & Time Slot</span>
                </button>
              )}
            </div>
          ))}

          {waitingListAppointments.length === 0 && (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No walk-in patients in waiting queue right now.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { Patient, FollowUpTask } from '../../types';
import { formatDate, formatTodayISO } from '../../utils/formatters';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  Plus,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { InternalFollowUpTrigger, FollowUpAlertConfig } from '../PatientEMR/InternalFollowUpTrigger';

interface DoctorAlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patientId: string) => void;
  onMarkCompleted: (followUpId: string) => void;
  onReschedule: (followUpId: string, days?: number) => void;
  onAddFollowUp: (patientId: string, followUp: { dueDate: string; reason: string; notes?: string }) => void;
}

export const DoctorAlertCenterDrawer: React.FC<DoctorAlertCenterDrawerProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  onMarkCompleted,
  onReschedule,
  onAddFollowUp,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'today' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingNewAlert, setIsAddingNewAlert] = useState<boolean>(false);

  // New alert form state
  const [targetPatientId, setTargetPatientId] = useState<string>(patients[0]?.id || '');
  const [alertConfig, setAlertConfig] = useState<FollowUpAlertConfig | null>(null);

  const todayStr = useMemo(() => formatTodayISO(), []);

  // Collect all follow-ups across all patients
  const allFollowUps = useMemo(() => {
    return patients.flatMap((p) =>
      p.followUps.map((f) => ({
        ...f,
        patientMrn: p.mrn,
        patientAge: p.age,
        patientGender: p.gender,
      }))
    );
  }, [patients]);

  const filteredAlerts = useMemo(() => {
    return allFollowUps.filter((item) => {
      // Tab filter
      if (filterTab === 'pending') {
        if (item.status === 'Completed') return false;
      } else if (filterTab === 'today') {
        if (item.status === 'Completed' || item.dueDate !== todayStr) return false;
      } else if (filterTab === 'completed') {
        if (item.status !== 'Completed') return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.patientName.toLowerCase().includes(q);
        const matchesMrn = (item.patientMrn || '').toLowerCase().includes(q);
        const matchesReason = item.reason.toLowerCase().includes(q);
        const matchesPhone = item.patientPhone.includes(q);
        return matchesName || matchesMrn || matchesReason || matchesPhone;
      }

      return true;
    });
  }, [allFollowUps, filterTab, searchQuery, todayStr]);

  const pendingCount = allFollowUps.filter((f) => f.status !== 'Completed').length;
  const todayCount = allFollowUps.filter((f) => f.status !== 'Completed' && f.dueDate === todayStr).length;
  const overdueCount = allFollowUps.filter((f) => f.status !== 'Completed' && f.dueDate < todayStr).length;

  const handleCreateNewAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPatientId || !alertConfig || !alertConfig.reason.trim()) {
      alert('Please select a patient and enter a clinical reason.');
      return;
    }

    onAddFollowUp(targetPatientId, {
      dueDate: alertConfig.dueDate,
      reason: alertConfig.reason.trim(),
      notes: alertConfig.notes,
    });

    setIsAddingNewAlert(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0F172A]/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between text-zinc-900 animate-slideLeft">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 bg-amber-50/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-md">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-zinc-900">Doctor Alert Center</h2>
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                    {overdueCount} Overdue
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-600">
                Internal post-op reviews, suture removals, and clinical recall queue
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-zinc-200/80 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterTab('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterTab === 'pending'
                    ? 'bg-white text-zinc-900 shadow-xs font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All Active ({pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('today')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterTab === 'today'
                    ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Due Today ({todayCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('completed')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterTab === 'completed'
                    ? 'bg-emerald-700 text-white shadow-xs font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Completed
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingNewAlert(!isAddingNewAlert)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNewAlert ? 'Cancel' : '+ New Doctor Alert'}</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter alerts by patient name, MRN, phone, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* New Doctor Alert Form Modal / Container */}
          {isAddingNewAlert && (
            <form
              onSubmit={handleCreateNewAlert}
              className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>Create Internal Doctor Follow-Up Alert</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNewAlert(false)}
                  className="text-amber-800 hover:text-amber-950 font-bold text-xs"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-900 block mb-1">
                  Select Patient
                </label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.mrn}) — Ph: {p.phone}
                    </option>
                  ))}
                </select>
              </div>

              <InternalFollowUpTrigger
                compact
                initialReason="Check post-op swelling & suture removal"
                onChange={setAlertConfig}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNewAlert(false)}
                  className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs hover:bg-amber-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 shadow-sm transition-all"
                >
                  Save Internal Alert
                </button>
              </div>
            </form>
          )}

          {/* Cards List */}
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-70" />
              <p className="text-sm font-bold text-zinc-700">No matching alerts found</p>
              <p className="text-xs text-zinc-400">
                All patient reviews and doctor follow-up tasks are up to date!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((item) => {
                const isCompleted = item.status === 'Completed';
                const isOverdue = !isCompleted && item.dueDate < todayStr;
                const isDueToday = !isCompleted && item.dueDate === todayStr;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isCompleted
                        ? 'bg-zinc-50 border-zinc-200 opacity-75'
                        : isOverdue
                        ? 'bg-rose-50/60 border-rose-300 shadow-xs'
                        : isDueToday
                        ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                        : 'bg-white border-zinc-200 shadow-2xs hover:border-amber-300'
                    }`}
                  >
                    {/* Top Row: Patient Info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPatient(item.patientId);
                              onClose();
                            }}
                            className="font-extrabold text-sm text-zinc-900 hover:text-amber-700 hover:underline transition-colors flex items-center gap-1 group text-left"
                          >
                            <span>{item.patientName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all" />
                          </button>
                          <span className="text-xs text-zinc-500 font-semibold">
                            ({item.patientAge} Yrs / {item.patientGender})
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                            MRN: {item.patientMrn}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 font-semibold mt-0.5">
                          📞 {item.patientPhone}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Completed
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white border border-rose-700 shadow-2xs flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        ) : isDueToday ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white border border-amber-600 shadow-2xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due Today
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                            Due: {formatDate(item.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clinical Reason Box */}
                    <div className="p-3 bg-white/90 rounded-xl border border-zinc-200/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider">
                          Clinical Reason for Alert
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Due Date: {formatDate(item.dueDate)}
                        </span>
                      </div>
                      <p className="font-bold text-zinc-900 text-xs sm:text-sm">
                        {item.reason}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-zinc-600 italic pt-0.5">
                          Doctor Note: "{item.notes}"
                        </p>
                      )}
                    </div>

                    {/* Action Controls (Internal Only) */}
                    {!isCompleted && (
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onMarkCompleted(item.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onReschedule(item.id, 3)}
                            className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            <span>Reschedule (+3 Days)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onReschedule(item.id, 7)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-300 transition-all cursor-pointer"
                            title="Reschedule +7 Days"
                          >
                            +7 Days
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectPatient(item.patientId);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Open EMR</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500 font-medium shrink-0">
          <span>FABIS MediCare Doctor Alert System</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

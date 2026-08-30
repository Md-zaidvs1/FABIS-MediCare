import React, { useState, useMemo, useEffect } from 'react';
import { Patient, FollowUpTask } from '../../types';
import { formatDate, formatTodayISO, formatPatientId } from '../../utils/formatters';
import { getSmsStatus, sendManualSms } from '../../utils/smsApi';
import { shareTextMessage } from '../../utils/pdfShare';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Phone,
  MessageCircle,
  UserCheck,
  Calendar,
  AlertCircle,
  Send,
  Loader2
} from 'lucide-react';

interface DoctorAlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patientId: string, initialTab?: 'overview' | 'teethMap' | 'treatments' | 'prescriptions' | 'invoices') => void;
  onMarkCompleted: (followUpId: string, status?: FollowUpTask['status']) => void;
  onReschedule?: (followUpId: string, days?: number) => void;
  onAddFollowUp: (patientId: string, followUp: { dueDate: string; reason: string; notes?: string }) => void;
  onOpenSmsSettings?: () => void;
}

export const DoctorAlertCenterDrawer: React.FC<DoctorAlertCenterDrawerProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  onMarkCompleted,
  onAddFollowUp,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [isAddingNewAlert, setIsAddingNewAlert] = useState<boolean>(false);

  // SMS Connection Status
  const [isSmsConnected, setIsSmsConnected] = useState<boolean>(false);
  const [isCheckingSms, setIsCheckingSms] = useState<boolean>(false);

  // Send Message Modal State
  const [smsModal, setSmsModal] = useState<{
    isOpen: boolean;
    patientId: string;
    patientName: string;
    patientPhone: string;
    message: string;
    isSending: boolean;
    feedback: { type: 'success' | 'error'; text: string } | null;
  }>({
    isOpen: false,
    patientId: '',
    patientName: '',
    patientPhone: '',
    message: '',
    isSending: false,
    feedback: null,
  });

  // New follow-up form state
  const [newPatientId, setNewPatientId] = useState<string>(patients[0]?.id || '');
  const [newDueDate, setNewDueDate] = useState<string>(formatTodayISO());
  const [newReason, setNewReason] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const todayStr = useMemo(() => formatTodayISO(), []);

  // Check real SMS status on drawer open
  useEffect(() => {
    if (isOpen) {
      checkSmsStatus();
    }
  }, [isOpen]);

  const checkSmsStatus = async () => {
    setIsCheckingSms(true);
    try {
      const res = await getSmsStatus();
      const connected = Boolean(res.settings.connected && res.health.isOnline);
      setIsSmsConnected(connected);
    } catch {
      setIsSmsConnected(false);
    } finally {
      setIsCheckingSms(false);
    }
  };

  // Collect all follow-ups across all patients
  const allFollowUps = useMemo(() => {
    return patients.flatMap((p) =>
      (p.followUps || []).map((f) => ({
        ...f,
        patientMrn: p.mrn,
        patientAge: p.age,
        patientGender: p.gender,
      }))
    );
  }, [patients]);

  const filteredAlerts = useMemo(() => {
    return allFollowUps.filter((item) => {
      // Status filter
      if (statusFilter === 'pending' && item.status === 'Completed') return false;
      if (statusFilter === 'completed' && item.status !== 'Completed') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (item.patientName || '').toLowerCase().includes(q);
        const matchesMrn = (item.patientMrn || '').toLowerCase().includes(q);
        const rkId = formatPatientId(item.patientMrn || item.patientId).toLowerCase();
        const matchesRkId = rkId.includes(q);
        const matchesReason = (item.reason || '').toLowerCase().includes(q);
        const matchesPhone = (item.patientPhone || '').includes(q);
        return matchesName || matchesMrn || matchesRkId || matchesReason || matchesPhone;
      }

      return true;
    }).sort((a, b) => {
      // Pending first, then by dueDate ascending
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [allFollowUps, statusFilter, searchQuery]);

  const pendingCount = allFollowUps.filter((f) => f.status !== 'Completed').length;

  const handleCreateNewFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId || !newReason.trim()) {
      alert('Please select a patient and enter a follow-up reason.');
      return;
    }

    onAddFollowUp(newPatientId, {
      dueDate: newDueDate,
      reason: newReason.trim(),
      notes: newNotes.trim() || undefined,
    });

    setNewReason('');
    setNewNotes('');
    setIsAddingNewAlert(false);
  };

  const handleWhatsApp = (phone: string | undefined, patientName: string, reason: string) => {
    const msg = `Hello ${patientName}, gentle follow-up reminder from FABIS MediCare regarding: ${reason}. Please let us know how you are feeling or if you would like to schedule your visit.`;
    shareTextMessage({
      title: 'FABIS MediCare Follow-Up',
      text: msg,
      patientMobile: phone || '',
      patientName,
    });
  };

  const handleOpenSendMessage = (item: typeof allFollowUps[0]) => {
    const cleanDigits = (item.patientPhone || '').replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 8) {
      alert('Patient mobile number is not available.');
      return;
    }

    setSmsModal({
      isOpen: true,
      patientId: item.patientId,
      patientName: item.patientName,
      patientPhone: item.patientPhone || '',
      message: `Hello ${item.patientName}, gentle follow-up reminder from FABIS MediCare regarding: ${item.reason}. Kindly let us know if you need assistance.`,
      isSending: false,
      feedback: null,
    });
  };

  const handleSendSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsModal.patientPhone) {
      setSmsModal((prev) => ({
        ...prev,
        feedback: { type: 'error', text: 'Patient mobile number is not available.' },
      }));
      return;
    }

    if (!smsModal.message.trim()) {
      setSmsModal((prev) => ({
        ...prev,
        feedback: { type: 'error', text: 'Please enter a message to send.' },
      }));
      return;
    }

    setSmsModal((prev) => ({ ...prev, isSending: true, feedback: null }));

    try {
      // Check status if not known
      const res = await sendManualSms({
        patientId: smsModal.patientId,
        patientName: smsModal.patientName,
        recipientPhone: smsModal.patientPhone,
        message: smsModal.message.trim(),
        type: 'Follow-up',
      });

      setSmsModal((prev) => ({
        ...prev,
        isSending: false,
        feedback: { type: 'success', text: 'Message sent successfully.' },
      }));

      setTimeout(() => {
        setSmsModal((prev) => ({ ...prev, isOpen: false, feedback: null }));
      }, 1500);
    } catch (err: any) {
      setSmsModal((prev) => ({
        ...prev,
        isSending: false,
        feedback: { type: 'error', text: 'Message could not be sent. Please check TextBee connection.' },
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header with SMS Status */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 leading-tight">
                  Doctor Follow-Up & Notifications
                </h2>
                {/* Real SMS Connection Status Pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold shadow-2xs">
                  <span className="text-slate-600">SMS Status</span>
                  {isCheckingSms ? (
                    <span className="text-slate-400 font-medium">Checking...</span>
                  ) : isSmsConnected ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>● Connected</span>
                    </span>
                  ) : (
                    <span className="text-rose-700 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>● Not Connected</span>
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {pendingCount} patient {pendingCount === 1 ? 'follow-up' : 'follow-ups'} pending
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNewAlert(true)}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Follow-Up</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Simple Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ID (e.g. RK881), mobile, or reason..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({allFollowUps.length})
            </button>
          </div>
        </div>

        {/* Follow-up Patients List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-700">No follow-ups found</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {statusFilter === 'pending' ? 'All patient follow-ups are up to date.' : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((item) => {
              const isCompleted = item.status === 'Completed';
              const isOverdue = !isCompleted && item.dueDate < todayStr;
              const isToday = !isCompleted && item.dueDate === todayStr;
              const rkPatientId = formatPatientId(item.patientMrn || item.patientId);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-slate-50 border-slate-200 opacity-75'
                      : isOverdue
                      ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
                      : isToday
                      ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Top Row: Patient Info & Date */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-slate-900">
                          {item.patientName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[11px] border border-slate-200">
                          {rkPatientId}
                        </span>
                        {item.patientAge && item.patientGender && (
                          <span className="text-xs text-slate-500 font-medium">
                            • {item.patientAge}y / {item.patientGender}
                          </span>
                        )}
                      </div>

                      {/* Reason & Notes */}
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        Reason: <span className="font-normal text-slate-700">{item.reason}</span>
                      </p>
                      {item.notes && item.notes !== item.reason && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Due Date & Status Pill */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs font-bold justify-end">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span
                          className={
                            isCompleted
                              ? 'text-slate-500'
                              : isOverdue
                              ? 'text-rose-600'
                              : isToday
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }
                        >
                          {formatDate(item.dueDate)}
                        </span>
                      </div>
                      <div className="mt-1">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Done
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Overdue
                          </span>
                        ) : isToday ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Today
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean Action Buttons: [ WhatsApp ] [ Call ] [ Send Message ] [ Complete ] [ Open EMR ] */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* 1. WhatsApp Button */}
                      <button
                        type="button"
                        onClick={() => handleWhatsApp(item.patientPhone, item.patientName, item.reason)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      {/* 2. Call Button */}
                      {item.patientPhone ? (
                        <a
                          href={`tel:${item.patientPhone}`}
                          className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs border border-sky-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-sky-600" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs border border-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>No Phone</span>
                        </button>
                      )}

                      {/* 3. Send Message Button (TextBee SMS) */}
                      <button
                        type="button"
                        onClick={() => handleOpenSendMessage(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Send Message</span>
                      </button>

                      {/* 4. Complete Button */}
                      {!isCompleted ? (
                        <button
                          type="button"
                          onClick={() => onMarkCompleted(item.id, 'Completed')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkCompleted(item.id, 'Pending')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Reopen</span>
                        </button>
                      )}
                    </div>

                    {/* 5. Open EMR Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPatient(item.patientId, 'overview');
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                      <span>Open EMR</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Send Message via TextBee */}
        {smsModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Send Message
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSendSmsSubmit} className="space-y-3.5">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Patient:</span>
                    <span className="font-extrabold text-slate-900">{smsModal.patientName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Mobile:</span>
                    <span className="font-mono font-bold text-slate-900">{smsModal.patientPhone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Message</label>
                  <textarea
                    rows={4}
                    value={smsModal.message}
                    onChange={(e) => setSmsModal((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Type your message to the patient here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
                    disabled={smsModal.isSending}
                    required
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{smsModal.message.length} characters</span>
                    <span>SMS Gateway: TextBee</span>
                  </div>
                </div>

                {/* Feedback status message */}
                {smsModal.feedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-bold ${
                      smsModal.feedback.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {smsModal.feedback.text}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSmsModal((prev) => ({ ...prev, isOpen: false }))}
                    disabled={smsModal.isSending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={smsModal.isSending}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {smsModal.isSending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Follow-Up Form */}
        {isAddingNewAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  + Create New Patient Follow-Up
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNewAlert(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewFollowUp} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Select Patient</label>
                  <select
                    value={newPatientId}
                    onChange={(e) => setNewPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-sky-500"
                    required
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatPatientId(p)}) - {p.phone || 'No Mobile'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Follow-Up Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Reason / Treatment</label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="e.g. Suture removal, Post-op sensitivity check, Crown fitting..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-sky-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Clinical Notes (Optional)</label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Additional instructions or notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAlert(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Save Follow-Up
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

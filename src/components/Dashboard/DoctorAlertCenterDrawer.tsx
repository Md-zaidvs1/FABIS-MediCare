import React, { useState, useMemo, useEffect } from 'react';
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
  Check,
  MessageSquare,
  Send,
  Phone,
  PhoneCall,
  ExternalLink,
  RefreshCw,
  Settings,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { InternalFollowUpTrigger, FollowUpAlertConfig } from '../PatientEMR/InternalFollowUpTrigger';
import { getSmsStatus, sendManualSms } from '../../utils/smsApi';

interface DoctorAlertCenterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onSelectPatient: (patientId: string, initialTab?: 'overview' | 'teethMap' | 'treatments' | 'prescriptions' | 'invoices') => void;
  onMarkCompleted: (followUpId: string, status?: FollowUpTask['status']) => void;
  onReschedule: (followUpId: string, days?: number) => void;
  onAddFollowUp: (patientId: string, followUp: { dueDate: string; reason: string; notes?: string }) => void;
  onOpenSmsSettings?: () => void;
}

export const DoctorAlertCenterDrawer: React.FC<DoctorAlertCenterDrawerProps> = ({
  isOpen,
  onClose,
  patients,
  onSelectPatient,
  onMarkCompleted,
  onReschedule,
  onAddFollowUp,
  onOpenSmsSettings,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'today' | 'tomorrow' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddingNewAlert, setIsAddingNewAlert] = useState<boolean>(false);

  // TextBee Gateway Status State
  const [smsGateway, setSmsGateway] = useState<{
    isConnected: boolean;
    deviceName?: string;
    deviceId?: string;
    error?: string;
    lastCheckedAt?: string;
    isLoading: boolean;
  }>({
    isConnected: false,
    isLoading: false,
  });

  // Inline SMS Composer / Sending State per Follow-up
  const [activeComposerId, setActiveComposerId] = useState<string | null>(null);
  const [customSmsText, setCustomSmsText] = useState<string>('');
  const [sendingSmsId, setSendingSmsId] = useState<string | null>(null);
  const [smsFeedback, setSmsFeedback] = useState<{
    followUpId: string;
    success: boolean;
    message: string;
    errorDetail?: string;
  } | null>(null);

  // New alert form state
  const [targetPatientId, setTargetPatientId] = useState<string>(patients[0]?.id || '');
  const [alertConfig, setAlertConfig] = useState<FollowUpAlertConfig | null>(null);

  const todayStr = useMemo(() => formatTodayISO(), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch TextBee Status whenever drawer opens
  const refreshSmsGatewayStatus = async () => {
    setSmsGateway((prev) => ({ ...prev, isLoading: true }));
    try {
      const data = await getSmsStatus();
      setSmsGateway({
        isConnected: Boolean(data.settings?.connected && data.health?.isOnline),
        deviceName: data.settings?.deviceName || 'TextBee Android Gateway',
        deviceId: data.settings?.deviceId || '',
        error: data.health?.error || (!data.settings?.connected ? 'Gateway disconnected in SMS Settings' : ''),
        lastCheckedAt: new Date().toLocaleTimeString(),
        isLoading: false,
      });
    } catch (err: any) {
      setSmsGateway({
        isConnected: false,
        error: err.message || 'Unable to communicate with backend SMS service',
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSmsGatewayStatus();
    }
  }, [isOpen]);

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
      // Tab filter
      if (filterTab === 'all') {
        if (item.status === 'Completed') return false;
      } else if (filterTab === 'today') {
        if (item.status === 'Completed' || item.dueDate !== todayStr) return false;
      } else if (filterTab === 'tomorrow') {
        if (item.status === 'Completed' || item.dueDate !== tomorrowStr) return false;
      } else if (filterTab === 'overdue') {
        if (item.status === 'Completed' || item.dueDate >= todayStr) return false;
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
  }, [allFollowUps, filterTab, searchQuery, todayStr, tomorrowStr]);

  const pendingCount = allFollowUps.filter((f) => f.status !== 'Completed').length;
  const todayCount = allFollowUps.filter((f) => f.status !== 'Completed' && f.dueDate === todayStr).length;
  const tomorrowCount = allFollowUps.filter((f) => f.status !== 'Completed' && f.dueDate === tomorrowStr).length;
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

  const handleOpenComposer = (item: any) => {
    const defaultMsg = `Hello ${item.patientName}, gentle follow-up reminder from RK Dental Clinic regarding: ${item.reason}. Pls call us at clinic if needed.`;
    setActiveComposerId(item.id);
    setCustomSmsText(defaultMsg);
    setSmsFeedback(null);
  };

  const handleSendTextBeeSms = async (item: any) => {
    setSendingSmsId(item.id);
    setSmsFeedback(null);

    const textToSend = customSmsText.trim() || `Hello ${item.patientName}, follow-up reminder from RK Dental Clinic regarding: ${item.reason}`;

    try {
      const res = await sendManualSms({
        patientId: item.patientId,
        patientName: item.patientName,
        recipientPhone: item.patientPhone,
        message: textToSend,
        type: 'Follow-up',
      });

      if (res.success) {
        setSmsFeedback({
          followUpId: item.id,
          success: true,
          message: `✓ TextBee SMS dispatched to ${item.patientPhone}!`,
        });
        setActiveComposerId(null);
      } else {
        setSmsFeedback({
          followUpId: item.id,
          success: false,
          message: res.error || 'Failed to dispatch SMS via TextBee Gateway',
          errorDetail: res.error || 'Check gateway connectivity in SMS settings.',
        });
      }
    } catch (err: any) {
      setSmsFeedback({
        followUpId: item.id,
        success: false,
        message: err.message || 'SMS Dispatch Error',
        errorDetail: err.message || 'Verify TextBee Android App is active on clinic phone.',
      });
    } finally {
      setSendingSmsId(null);
      refreshSmsGatewayStatus();
    }
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
                <h2 className="text-base font-black text-zinc-900">Doctor Alert & Follow-Up Center</h2>
                {overdueCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                    {overdueCount} Overdue
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-600">
                RK Dental Clinic • Clinical recall, post-op reviews & multi-channel follow-ups
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

        {/* TextBee SMS Gateway Status Banner */}
        <div className="px-5 py-3 border-b border-zinc-200 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            {smsGateway.isConnected ? (
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            ) : (
              <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
            )}
            <div>
              <div className="font-extrabold flex items-center gap-2">
                <span>TextBee Gateway:</span>
                <span className={smsGateway.isConnected ? 'text-emerald-300 font-black' : 'text-rose-300 font-black'}>
                  {smsGateway.isConnected ? `Connected (${smsGateway.deviceName})` : 'Disconnected / Error'}
                </span>
              </div>
              {smsGateway.error && (
                <div className="text-[11px] font-mono text-rose-300 mt-0.5">
                  ⚠️ {smsGateway.error}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={refreshSmsGatewayStatus}
              disabled={smsGateway.isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Refresh TextBee Gateway Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${smsGateway.isLoading ? 'animate-spin' : ''}`} />
            </button>

            {onOpenSmsSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSmsSettings();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>SMS Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-zinc-200/80 p-1 rounded-2xl text-xs font-bold flex-wrap">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterTab === 'all'
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
                Today ({todayCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('tomorrow')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterTab === 'tomorrow'
                    ? 'bg-sky-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Tomorrow ({tomorrowCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('overdue')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  filterTab === 'overdue'
                    ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Overdue ({overdueCount})
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
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingNewAlert ? 'Cancel' : '+ New Follow-Up Alert'}</span>
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
                  className="text-amber-800 hover:text-amber-950 font-bold text-xs cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 shadow-sm transition-all cursor-pointer"
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
                const isDueTomorrow = !isCompleted && item.dueDate === tomorrowStr;

                // Clean phone for WhatsApp and Call links
                const cleanDigits = item.patientPhone.replace(/\D/g, '');
                const waPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
                const defaultMsg = `Hello ${item.patientName}, gentle follow-up reminder from RK Dental Clinic regarding: ${item.reason}. Pls contact us if needed.`;

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
                        : isDueTomorrow
                        ? 'bg-sky-50/60 border-sky-300 shadow-xs'
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
                              onSelectPatient(item.patientId, 'overview');
                              onClose();
                            }}
                            className="font-extrabold text-sm text-zinc-900 hover:text-amber-700 hover:underline transition-colors flex items-center gap-1 group text-left cursor-pointer"
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
                        ) : isDueTomorrow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-sky-600 text-white border border-sky-700 shadow-2xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due Tomorrow
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
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
                          Due: {formatDate(item.dueDate)}
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

                    {/* Feedback Toast / Banner */}
                    {smsFeedback && smsFeedback.followUpId === item.id && (
                      <div
                        className={`p-3 rounded-xl text-xs border ${
                          smsFeedback.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold'
                            : 'bg-rose-50 border-rose-300 text-rose-900 space-y-1'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{smsFeedback.message}</span>
                          <button
                            type="button"
                            onClick={() => setSmsFeedback(null)}
                            className="text-zinc-500 hover:text-zinc-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        {smsFeedback.errorDetail && (
                          <p className="text-[11px] font-mono font-medium text-rose-700">
                            Details: {smsFeedback.errorDetail}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Direct Multi-Channel Patient Contact Action Toolbar */}
                    {!isCompleted && (
                      <div className="space-y-2 pt-1 border-t border-zinc-200/80">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                            Direct Outreach:
                          </span>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 1. SMS (TextBee Gateway) Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenComposer(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Send SMS via TextBee Android Gateway"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>SMS (TextBee)</span>
                            </button>

                            {/* 2. WhatsApp Button */}
                            <a
                              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(defaultMsg)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Send WhatsApp Message"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>

                            {/* 3. Call Button */}
                            <a
                              href={`tel:${item.patientPhone}`}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                              title="Call Patient Directly"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>
                          </div>
                        </div>

                        {/* Inline SMS Composer Box */}
                        {activeComposerId === item.id && (
                          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 text-white space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-extrabold text-sky-400 flex items-center gap-1">
                                <Send className="w-3.5 h-3.5" /> TextBee SMS Composer
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveComposerId(null)}
                                className="text-slate-400 hover:text-white font-bold text-xs"
                              >
                                Cancel
                              </button>
                            </div>

                            <textarea
                              rows={2}
                              value={customSmsText}
                              onChange={(e) => setCustomSmsText(e.target.value)}
                              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 outline-none focus:border-sky-500"
                            />

                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Recipient: <strong className="text-white">{item.patientPhone}</strong></span>
                              <button
                                type="button"
                                onClick={() => handleSendTextBeeSms(item)}
                                disabled={sendingSmsId === item.id}
                                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {sendingSmsId === item.id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Sending...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3 h-3" />
                                    <span>Send SMS Now</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Status Management Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200/60 gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onMarkCompleted(item.id, 'Completed')}
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
                              onSelectPatient(item.patientId, 'overview');
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Open EMR</span>
                          </button>
                        </div>
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
          <span>FABIS MediCare Doctor Alert & Notification System</span>
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

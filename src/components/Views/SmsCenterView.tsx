import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Smartphone,
  Send,
  RotateCcw,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Settings,
  Calendar,
  User,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  getSmsDashboardData,
  getSmsHistory,
  getSmsTemplates,
  getScheduledFollowups,
  retrySms,
  sendFollowupSmsNow,
  saveSmsTemplate,
  deleteSmsTemplate,
  scheduleFollowupSms,
  SmsDashboardData,
} from '../../utils/smsApi';
import { Patient, SmsLogRecord, SmsTemplateRecord } from '../../types';
import { SendSmsModal } from '../Modals/SendSmsModal';
import { SmsIntegrationSettings } from '../Settings/SmsIntegrationSettings';

interface SmsCenterViewProps {
  patients?: Patient[];
  onOpenPatientProfile?: (patientId: string) => void;
}

export const SmsCenterView: React.FC<SmsCenterViewProps> = ({
  patients = [],
  onOpenPatientProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'history' | 'templates' | 'settings'>('queue');
  const [dashboardData, setDashboardData] = useState<SmsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Queue & Followups
  const [followupsQueue, setFollowupsQueue] = useState<any[]>([]);

  // History State
  const [logs, setLogs] = useState<SmsLogRecord[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Templates State
  const [templates, setTemplates] = useState<SmsTemplateRecord[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Partial<SmsTemplateRecord> | null>(null);

  // Send Manual Modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [modalPatient, setModalPatient] = useState<{ id?: string; name?: string; phone?: string }>({});

  // Schedule Followup Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [scheduleFollowupType, setScheduleFollowupType] = useState('Dental Review & Checkup');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleMessage, setScheduleMessage] = useState('');

  // Banners
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const dbData = await getSmsDashboardData();
      setDashboardData(dbData);

      const fuList = await getScheduledFollowups();
      setFollowupsQueue(fuList);

      const hist = await getSmsHistory({ status: statusFilter, type: typeFilter, search: historySearch });
      setLogs(hist.logs || []);

      const tpls = await getSmsTemplates();
      setTemplates(tpls);
    } catch (err: any) {
      console.warn('[SMS Center] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSubTab, statusFilter, typeFilter]);

  const handleRetryLog = async (logId: string) => {
    try {
      const res = await retrySms(logId);
      setBanner({ type: 'success', message: res.message || 'SMS retried successfully!' });
      loadData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to retry SMS' });
    }
  };

  const handleSendFollowupNow = async (id: string) => {
    try {
      const res = await sendFollowupSmsNow(id);
      setBanner({ type: 'success', message: res.message || 'Follow-up SMS dispatched!' });
      loadData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to send follow-up SMS' });
    }
  };

  const handleSaveTemplateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate?.title || !editingTemplate?.category || !editingTemplate?.body) {
      setBanner({ type: 'error', message: 'Title, category, and body are required' });
      return;
    }

    try {
      await saveSmsTemplate(editingTemplate as any);
      setBanner({ type: 'success', message: 'SMS template saved successfully!' });
      setEditingTemplate(null);
      loadData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to save template' });
    }
  };

  const handleDeleteTemplateItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this SMS template?')) return;
    try {
      await deleteSmsTemplate(id);
      setBanner({ type: 'success', message: 'Template deleted.' });
      loadData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to delete template' });
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === selectedPatientId);
    if (!pat) {
      setBanner({ type: 'error', message: 'Please select a patient' });
      return;
    }

    try {
      await scheduleFollowupSms({
        patientId: pat.id,
        patientName: pat.name,
        patientPhone: pat.phone,
        followupType: scheduleFollowupType,
        scheduledDate: scheduleDate,
        message: scheduleMessage || `Dear ${pat.name}, greetings from RK Dental Clinic. This is a follow-up reminder for your ${scheduleFollowupType} on ${scheduleDate}. Thank you.`,
      });

      setBanner({ type: 'success', message: `SMS follow-up scheduled for ${pat.name} on ${scheduleDate}` });
      setIsScheduleModalOpen(false);
      setScheduleMessage('');
      loadData();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to schedule follow-up' });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg sm:text-2xl text-slate-900 dark:text-white">
              SMS Center & Patient Follow-ups
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              RK Dental Clinic • TextBee Android Gateway Communications Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setModalPatient({});
              setIsSendModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Send Direct SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ Schedule Follow-up</span>
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-2xs ${
            banner.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {banner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setBanner(null)}
            className="text-xs font-extrabold hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Gateway Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Android Gateway</span>
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-black text-sm text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
            {dashboardData?.gateway?.connected ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>OFFLINE</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1 truncate">
            {dashboardData?.gateway?.deviceName || 'Not Connected'}
          </div>
        </div>

        {/* Today Sent */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Today Dispatched</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-black text-lg text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {dashboardData?.counts?.todaySent || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            Successful dispatches today
          </div>
        </div>

        {/* Today Failed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Today Failed</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="font-black text-lg text-rose-600 dark:text-rose-400 mt-1 font-mono">
            {dashboardData?.counts?.todayFailed || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            {dashboardData?.counts?.todayFailed ? 'Requires retry' : 'No failed SMS today'}
          </div>
        </div>

        {/* Monthly Usage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500">Monthly Usage</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="font-black text-lg text-slate-900 dark:text-white mt-1 font-mono">
            {dashboardData?.counts?.monthlySent || 0} / 300
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            TextBee Free Tier Monthly Limit
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('queue')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'queue'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Reminders & Follow-up Queue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>SMS History Logs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('templates')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'templates'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>SMS Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('settings')}
          className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Gateway Integration Settings</span>
        </button>
      </div>

      {/* SUB-TAB CONTENT */}

      {/* 1. QUEUE TAB */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Scheduled Patient Follow-ups & Reminders</span>
            </h3>

            <button
              type="button"
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {followupsQueue.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="font-bold text-sm text-slate-700 dark:text-slate-300">
                No pending SMS follow-ups in queue
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Schedule dental recall reminders or post-treatment checkups to automatically send SMS to patients.
              </p>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer"
              >
                + Schedule New Follow-up
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">Patient Name</th>
                      <th className="p-3.5">Mobile Number</th>
                      <th className="p-3.5">Type / Reason</th>
                      <th className="p-3.5">Scheduled Date</th>
                      <th className="p-3.5">SMS Status</th>
                      <th className="p-3.5">Message Preview</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {followupsQueue.map((fu) => (
                      <tr key={fu.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => onOpenPatientProfile && onOpenPatientProfile(fu.patientId)}
                            className="hover:text-emerald-600 hover:underline cursor-pointer"
                          >
                            {fu.patientName}
                          </button>
                        </td>

                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {fu.patientPhone}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                            {fu.followupType || 'Dental Checkup'}
                          </span>
                        </td>

                        <td className="p-3.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {fu.scheduledDate}
                        </td>

                        <td className="p-3.5">
                          {fu.smsStatus === 'Sent' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ✅ SENT
                            </span>
                          ) : fu.smsStatus === 'Failed' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              ❌ FAILED
                            </span>
                          ) : fu.smsStatus === 'Gateway Unavailable' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              ⚠️ GATEWAY DISCONNECTED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              ⏳ PENDING
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-500 max-w-xs truncate">
                          {fu.message}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleSendFollowupNow(fu.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-2xs transition-all cursor-pointer flex items-center gap-1 ml-auto"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send SMS Now</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. HISTORY LOGS TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SMS logs by patient name, mobile, or message content..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Appointment">Appointment</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Manual">Manual</option>
                <option value="Test">Test</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Recipient Mobile</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">SMS Body</th>
                    <th className="p-3.5 text-right">Retry Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        No SMS logs matching selected filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          {log.patientName}
                        </td>

                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {log.recipient}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {log.type}
                          </span>
                        </td>

                        <td className="p-3.5">
                          {log.status === 'Sent' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              ✅ SENT
                            </span>
                          ) : log.status === 'Failed' ? (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 block w-fit">
                                ❌ FAILED
                              </span>
                              {log.error && (
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 block max-w-xs truncate">
                                  {log.error}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              ⏳ SENDING
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-sm truncate">
                          {log.message}
                        </td>

                        <td className="p-3.5 text-right">
                          {log.status === 'Failed' && (
                            <button
                              type="button"
                              onClick={() => handleRetryLog(log.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-extrabold text-[11px] border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEMPLATES TAB */}
      {activeSubTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Reusable SMS Templates</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Dynamic placeholders: <code className="text-emerald-600 font-mono font-bold">{`{{patient_name}}`}</code>, <code className="text-emerald-600 font-mono font-bold">{`{{clinic_name}}`}</code>, <code className="text-emerald-600 font-mono font-bold">{`{{doctor_name}}`}</code>, <code className="text-emerald-600 font-mono font-bold">{`{{appointment_date}}`}</code>, <code className="text-emerald-600 font-mono font-bold">{`{{appointment_time}}`}</code>, <code className="text-emerald-600 font-mono font-bold">{`{{clinic_phone}}`}</code>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setEditingTemplate({ title: '', category: 'Custom Message', body: '' })}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Template</span>
            </button>
          </div>

          {/* Edit Template Modal / Drawer */}
          {editingTemplate && (
            <form onSubmit={handleSaveTemplateForm} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {editingTemplate.id ? 'Edit SMS Template' : 'Create New SMS Template'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tooth Extraction Post-Op Care"
                    value={editingTemplate.title || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    Category *
                  </label>
                  <select
                    value={editingTemplate.category || 'Custom Message'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                    className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="Appointment Reminder">Appointment Reminder</option>
                    <option value="Follow-up Reminder">Follow-up Reminder</option>
                    <option value="Treatment Follow-up">Treatment Follow-up</option>
                    <option value="Dental Recall">Dental Recall</option>
                    <option value="Missed Appointment">Missed Appointment</option>
                    <option value="Custom Message">Custom Message</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Template Body Content *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Dear {{patient_name}}, greetings from {{clinic_name}}..."
                  value={editingTemplate.body || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl font-medium text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div key={tpl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {tpl.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 mt-1 inline-block">
                      {tpl.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingTemplate(tpl)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!tpl.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplateItem(tpl.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 font-mono">
                  {tpl.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SETTINGS TAB */}
      {activeSubTab === 'settings' && (
        <SmsIntegrationSettings />
      )}

      {/* Send Direct SMS Modal */}
      <SendSmsModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        patientId={modalPatient.id}
        patientName={modalPatient.name}
        patientPhone={modalPatient.phone}
        onSmsSentSuccess={loadData}
      />

      {/* Schedule Follow-up Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Schedule SMS Patient Follow-up
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    Follow-up Type
                  </label>
                  <input
                    type="text"
                    value={scheduleFollowupType}
                    onChange={(e) => setScheduleFollowupType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
                  Custom Message (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Leave empty for default follow-up message template..."
                  value={scheduleMessage}
                  onChange={(e) => setScheduleMessage(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold cursor-pointer"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

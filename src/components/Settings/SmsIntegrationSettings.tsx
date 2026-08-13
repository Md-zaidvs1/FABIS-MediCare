import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Key,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Power,
  ShieldCheck,
  Building,
  Clock,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { connectSmsGateway, disconnectSmsGateway, getSmsStatus, sendTestSms } from '../../utils/smsApi';
import { SmsPublicSettings } from '../../types';

export const SmsIntegrationSettings: React.FC = () => {
  const [deviceId, setDeviceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [clinicName, setClinicName] = useState('RK Dental Clinic');
  const [clinicPhone, setClinicPhone] = useState('+91 9876543210');
  const [doctorName, setDoctorName] = useState('Dr. Fabis (BDS, MDS)');
  const [defaultReminderTiming, setDefaultReminderTiming] = useState<'1 day before' | '2 days before' | 'Same day' | 'Custom'>('1 day before');

  const [settings, setSettings] = useState<SmsPublicSettings | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ isOnline: boolean; error?: string } | null>(null);
  const [counts, setCounts] = useState<{ todaySent: number; todayFailed: number; monthlySent: number } | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from RK Dental Clinic via TextBee Gateway. System operational.');

  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await getSmsStatus();
      if (data.settings) {
        setSettings(data.settings);
        setDeviceId(data.settings.deviceId || '');
        setClinicName(data.settings.clinicName || 'RK Dental Clinic');
        setClinicPhone(data.settings.clinicPhone || '+91 9876543210');
        setDoctorName(data.settings.doctorName || 'Dr. Fabis (BDS, MDS)');
        setDefaultReminderTiming(data.settings.defaultReminderTiming || '1 day before');
      }
      if (data.health) {
        setHealthStatus(data.health);
      }
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err: any) {
      console.warn('[SMS Settings] Error fetching status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceId.trim() || !apiKey.trim()) {
      setBanner({ type: 'error', message: 'Please provide both Device ID and API Key from your TextBee app.' });
      return;
    }

    setIsConnecting(true);
    setBanner(null);

    try {
      const res = await connectSmsGateway({
        deviceId: deviceId.trim(),
        apiKey: apiKey.trim(),
        clinicName,
        clinicPhone,
        doctorName,
        defaultReminderTiming,
      });

      setBanner({ type: 'success', message: res.message || 'TextBee Android Gateway connected successfully!' });
      setSettings(res.settings);
      setApiKey(''); // clear plain API key input for security
      fetchStatus();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to connect TextBee gateway' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect TextBee Android SMS Gateway? Outstanding SMS logs and patient data will be kept.')) {
      return;
    }

    setIsDisconnecting(true);
    setBanner(null);

    try {
      const res = await disconnectSmsGateway();
      setBanner({ type: 'success', message: res.message || 'Gateway disconnected successfully.' });
      setSettings(res.settings);
      setDeviceId('');
      setApiKey('');
      fetchStatus();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to disconnect gateway' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNumber.trim()) {
      setBanner({ type: 'error', message: 'Please enter a test recipient phone number (e.g. +919876543210).' });
      return;
    }

    setIsTesting(true);
    setBanner(null);

    try {
      const res = await sendTestSms(testNumber.trim(), testMessage.trim());
      setBanner({ type: 'success', message: res.message || 'Test SMS dispatched successfully!' });
      fetchStatus();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Test SMS failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-900 dark:text-slate-100">
      
      {/* Banner Notifications */}
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

      {/* Gateway Status Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  TextBee Android Gateway Integration
                </h3>
                {settings?.connected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    CONNECTED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    DISCONNECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Send appointment reminders and follow-up SMS directly from clinic Android phone (TextBee App)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={isLoadingStatus}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            <span>Refresh Health</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Gateway Device</div>
            <div className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 truncate">
              {settings?.deviceName || 'Not Connected'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Today Sent</div>
            <div className="font-black text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {counts?.todaySent || 0} SMS
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Monthly Sent</div>
            <div className="font-black text-sm text-slate-900 dark:text-white mt-1 font-mono">
              {counts?.monthlySent || 0} / 300
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Plan Limit</div>
            <div className="font-extrabold text-xs text-slate-700 dark:text-slate-300 mt-1">
              50/day (Free Tier)
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Connection & Configuration Form */}
      <form onSubmit={handleConnect} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
            <Key className="w-4 h-4 text-emerald-600" />
            <span>TextBee Gateway Credentials & Clinic Info</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg font-bold border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>API Key Secured Server-Side</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-extrabold block mb-1">
              TextBee Device ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 64b8a910e123456789"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl font-mono font-bold text-xs text-slate-900 dark:text-white focus:border-emerald-600 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Found under Devices section in your Android TextBee app
            </span>
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-extrabold block mb-1">
              TextBee API Key *
            </label>
            <input
              type="password"
              placeholder={settings?.hasApiKey ? `•••••••• (${settings.maskedApiKey})` : 'Enter TextBee API Key'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl font-mono font-bold text-xs text-slate-900 dark:text-white focus:border-emerald-600 outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Never exposed to frontend or browser storage
            </span>
          </div>
        </div>

        {/* Clinic Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
              Clinic Name (in SMS)
            </label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
              Clinic Contact Phone
            </label>
            <input
              type="text"
              value={clinicPhone}
              onChange={(e) => setClinicPhone(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
              Default Appointment Reminder
            </label>
            <select
              value={defaultReminderTiming}
              onChange={(e) => setDefaultReminderTiming(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="1 day before">1 Day Before Appointment</option>
              <option value="2 days before">2 Days Before Appointment</option>
              <option value="Same day">Same Day Morning</option>
            </select>
          </div>
        </div>

        {/* Form Footer Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {settings?.connected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Power className="w-4 h-4" />
              <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect Phone Gateway'}</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 font-semibold italic">
              Connect your clinic Android phone to enable automated patient SMS
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            {isConnecting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Validating & Connecting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Connect Device</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Test SMS Dispatcher */}
      <form onSubmit={handleSendTestSms} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
            <Send className="w-4 h-4 text-emerald-600" />
            <span>Dispatch Test SMS</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            Send immediate verification SMS via connected Android gateway
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
              Recipient Phone (+91 format)
            </label>
            <input
              type="text"
              required
              placeholder="+919876543210"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1">
              Test Message Body
            </label>
            <input
              type="text"
              required
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isTesting || !settings?.connected}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-extrabold disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2"
          >
            {isTesting ? (
              <span>Sending Test SMS...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Test SMS Now</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Setup Guide Card */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 space-y-3">
        <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>How to setup TextBee Android SMS Gateway at Clinic</span>
        </div>
        <ol className="list-decimal list-inside text-xs font-medium text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
          <li>Download and install the <strong>TextBee</strong> Android app on the clinic phone.</li>
          <li>Grant SMS and Background activity permissions to TextBee on the Android device.</li>
          <li>Copy your <strong>Device ID</strong> and <strong>API Key</strong> from the TextBee app.</li>
          <li>Paste the Device ID and API Key in the form above and click <strong>Save & Connect Device</strong>.</li>
          <li>Keep the clinic Android phone connected to Wi-Fi or mobile data for automatic dispatch.</li>
        </ol>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Power,
  Radio,
  Info,
  Eye,
  EyeOff,
  KeyRound,
  Save,
  Server,
} from 'lucide-react';
import {
  connectSmsGateway,
  disconnectSmsGateway,
  getSmsStatus,
  sendTestSms,
  autoRestoreSmsSettingsIfNeeded,
  checkTextBeeHealthDirect,
} from '../../utils/smsApi';
import { SmsPublicSettings, UserRole } from '../../types';
import { getStoredSmsGatewaySettings, saveStoredSmsGatewaySettings } from '../../utils/storage';
import { performSupabaseCloudBackup } from '../../utils/supabaseCloudBackup';

interface SmsIntegrationSettingsProps {
  activeRole?: UserRole;
}

export const SmsIntegrationSettings: React.FC<SmsIntegrationSettingsProps> = ({
  activeRole = 'doctor',
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<SmsPublicSettings | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ isOnline: boolean; error?: string } | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Test SMS from RK Dental Clinic via TextBee. System operational.');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      await autoRestoreSmsSettingsIfNeeded();
      const data = await getSmsStatus();
      const stored = getStoredSmsGatewaySettings();

      if (data.settings) {
        setSettings(data.settings);
        setDeviceId(data.settings.deviceId || stored?.deviceId || '');
        if (stored?.apiKey) {
          setApiKey(stored.apiKey);
        }
      } else if (stored) {
        setDeviceId(stored.deviceId || '');
        if (stored.apiKey) {
          setApiKey(stored.apiKey);
        }
      }
      if (data.health) {
        setHealthStatus(data.health);
      }
    } catch (err: any) {
      console.warn('[SMS Settings] Error fetching status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Listen for real-time multi-device SMS updates
    const handleSmsUpdated = () => {
      fetchStatus();
    };
    window.addEventListener('sms-settings-updated', handleSmsUpdated);
    return () => {
      window.removeEventListener('sms-settings-updated', handleSmsUpdated);
    };
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDeviceId = deviceId.trim();
    const stored = getStoredSmsGatewaySettings();
    const cleanApiKey = apiKey.trim() || stored?.apiKey || '';

    if (!cleanDeviceId || !cleanApiKey) {
      setBanner({ type: 'error', message: 'Please enter both TextBee Device ID and API Key.' });
      return;
    }

    setIsConnecting(true);
    setBanner(null);

    try {
      const res = await connectSmsGateway({
        deviceId: cleanDeviceId,
        clientId: cleanDeviceId,
        apiKey: cleanApiKey,
      });

      setBanner({ type: 'success', message: '✓ TextBee Connected & Saved for all clinic devices' });
      setSettings(res.settings);
      setApiKey(cleanApiKey);

      // Perform full cloud sync to Supabase clinic_backups so all devices immediately receive it
      performSupabaseCloudBackup().catch(() => {});
      fetchStatus();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to connect TextBee gateway' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setBanner(null);
    try {
      const stored = getStoredSmsGatewaySettings();
      const targetDeviceId = deviceId.trim() || stored?.deviceId || '';
      const targetApiKey = apiKey.trim() || stored?.apiKey || '';

      if (!targetDeviceId || !targetApiKey) {
        setBanner({ type: 'error', message: 'Please enter TextBee Device ID and API Key first.' });
        setIsTestingConn(false);
        return;
      }

      const health = await checkTextBeeHealthDirect({
        deviceId: targetDeviceId,
        apiKey: targetApiKey,
      });

      if (health.isOnline) {
        setBanner({ type: 'success', message: '✓ TextBee Connected (Android Gateway Online & Active)' });
        setHealthStatus({ isOnline: true });
      } else {
        setBanner({ type: 'error', message: health.error || '⚠ TextBee Disconnected. Please check connection and credentials.' });
        setHealthStatus({ isOnline: false, error: health.error });
      }
    } catch (err: any) {
      setBanner({ type: 'error', message: '⚠ TextBee Disconnected: ' + (err.message || 'Network error') });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect the TextBee SMS Gateway?')) {
      return;
    }

    setIsDisconnecting(true);
    setBanner(null);

    try {
      const res = await disconnectSmsGateway();
      setBanner({ type: 'success', message: res.message || 'TextBee disconnected.' });
      setSettings(res.settings);
      setDeviceId('');
      setApiKey('');
      fetchStatus();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to disconnect' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testNumber.trim()) {
      setBanner({ type: 'error', message: 'Please enter a test recipient mobile number (e.g. +919876543210).' });
      return;
    }

    setIsTestingSms(true);
    setBanner(null);

    try {
      const res = await sendTestSms(testNumber.trim(), testMessage.trim());
      setBanner({ type: 'success', message: res.message || 'Test SMS sent successfully via TextBee!' });
      fetchStatus();
    } catch (err: any) {
      setBanner({ type: 'error', message: err.message || 'Failed to send test SMS. Please check TextBee connection.' });
    } finally {
      setIsTestingSms(false);
    }
  };

  const isConnected = !!(settings?.connected && (healthStatus?.isOnline ?? true));

  return (
    <div className="space-y-5 text-xs text-theme-main max-w-4xl">
      {/* Banner Notifications */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-xs ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
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
            ✕
          </button>
        </div>
      )}

      {/* Main SMS Gateway Card */}
      <div className="bg-theme-card border border-theme-border rounded-[28px] p-6 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-theme-main">SMS Gateway (TextBee)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeRole === 'doctor' ? 'Doctor Access' : 'Admin Access'}
                </span>
              </div>
              <p className="text-xs text-theme-secondary font-medium">
                Automated appointment reminders & direct patient SMS via TextBee Android Gateway
              </p>
            </div>
          </div>

          {/* Status Display: Connected / Not Connected */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-full text-xs font-extrabold flex items-center gap-2 border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border-slate-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>{isConnected ? '● Connected' : '● Disconnected'}</span>
            </div>

            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              title="Refresh status from cloud"
              className="p-2 rounded-xl bg-theme-page hover:bg-slate-200 text-theme-secondary border border-theme-border cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Unified SMS Gateway Configuration Form for Doctor & Admin */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-theme-main font-bold block mb-1.5 flex items-center justify-between">
                <span>TextBee Device ID</span>
                <span className="text-[11px] font-normal text-theme-secondary">From TextBee App</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 660f... or client device id"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full p-3 bg-theme-page border border-theme-border rounded-2xl font-mono text-xs text-theme-main focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-theme-main font-bold block mb-1.5 flex items-center justify-between">
                <span>TextBee API Key / Secret API Key</span>
                <span className="text-[11px] font-normal text-theme-secondary">Dashboard API Key</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  required
                  placeholder={settings?.hasApiKey ? `•••••••• (${settings.maskedApiKey})` : 'Enter TextBee Secret API Key'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full p-3 pr-10 bg-theme-page border border-theme-border rounded-2xl font-mono text-xs text-theme-main focus:border-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              {settings?.connected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Power className="w-4 h-4" />
                  <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect Gateway'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingConn}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isTestingConn ? 'animate-spin' : ''}`} />
                <span>{isTestingConn ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <button
                type="submit"
                disabled={isConnecting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isConnecting ? 'Saving...' : 'Save & Connect'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Crucial Gateway Operational Notice & Cloud Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-amber-950">Android Gateway Requirement</p>
              <p className="text-amber-900/90 leading-relaxed font-medium">
                Keep the registered Android phone powered on with the TextBee app open, SIM card active, and connected to WiFi/mobile data.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-900 flex items-start gap-3">
            <Server className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-indigo-950">Multi-Device Cloud Sync</p>
              <p className="text-indigo-900/90 leading-relaxed font-medium">
                TextBee credentials saved here are instantly synchronized via Supabase to all clinic computers, doctor laptops, and admin terminals.
              </p>
            </div>
          </div>
        </div>

        {/* Test SMS Dispatcher */}
        <div className="pt-4 border-t border-theme-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-theme-main flex items-center gap-1.5">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Send Test SMS</span>
            </span>
            <span className="text-[11px] text-theme-secondary">Deliver instant test message to any phone</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="+919876543210"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="w-full p-2.5 bg-theme-page border border-theme-border rounded-xl font-mono text-xs text-theme-main outline-none focus:border-emerald-500"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-2.5 bg-theme-page border border-theme-border rounded-xl text-xs text-theme-main outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={isTestingSms || !isConnected}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTestingSms ? 'Sending...' : 'Send Test SMS'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



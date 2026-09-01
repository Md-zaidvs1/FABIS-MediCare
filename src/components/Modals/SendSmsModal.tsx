import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertTriangle, Sparkles, FileText, Phone } from 'lucide-react';
import { SmsTemplateRecord } from '../../types';
import { sendManualSms, getSmsTemplates } from '../../utils/smsApi';

interface SendSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  onSmsSentSuccess?: () => void;
}

export const SendSmsModal: React.FC<SendSmsModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName = 'Patient',
  patientPhone = '',
  onSmsSentSuccess,
}) => {
  const [phone, setPhone] = useState(patientPhone);
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<SmsTemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhone(patientPhone);
      setError(null);
      setSuccessMsg(null);
      fetchTemplates();
    }
  }, [isOpen, patientPhone]);

  const fetchTemplates = async () => {
    try {
      const tpls = await getSmsTemplates();
      setTemplates(tpls);
    } catch (e) {
      // ignore
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      // Replace placeholders with current patient info
      let body = tpl.body;
      body = body.replace(/\{\{patient_name\}\}/g, patientName);
      body = body.replace(/\{\{clinic_name\}\}/g, 'RK Dental Clinic');
      body = body.replace(/\{\{doctor_name\}\}/g, 'Dr. Alex Mercer');
      body = body.replace(/\{\{clinic_phone\}\}/g, '+91 9876543210');
      body = body.replace(/\{\{appointment_date\}\}/g, new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
      body = body.replace(/\{\{appointment_time\}\}/g, '10:30 AM');
      body = body.replace(/\{\{followup_date\}\}/g, new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
      setMessage(body);
    }
  };

  if (!isOpen) return null;

  const charCount = message.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide a valid recipient phone number');
      return;
    }
    if (!message.trim()) {
      setError('SMS message content cannot be empty');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await sendManualSms({
        patientId,
        patientName,
        recipientPhone: phone.trim(),
        message: message.trim(),
        type: 'Manual',
      });

      setSuccessMsg(res.message || 'SMS sent successfully through TextBee Android Gateway!');
      if (onSmsSentSuccess) onSmsSentSuccess();

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send SMS. Please check TextBee connection.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] w-full max-w-lg p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 flex flex-col justify-between space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                Send SMS to Patient
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dispatched via clinic TextBee Android Phone
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banners */}
        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSend} className="space-y-4 text-xs">
          {/* Recipient Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                Patient Name
              </label>
              <div className="font-black text-sm text-slate-900 dark:text-white">
                {patientName}
              </div>
            </div>

            <div>
              <label className="text-slate-500 dark:text-slate-400 font-bold block mb-1">
                Mobile Number (+91 format)
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Quick Template Picker */}
          {templates.length > 0 && (
            <div>
              <label className="text-slate-700 dark:text-slate-300 font-bold block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick SMS Template Shortcut:</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="">-- Choose an SMS Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-800 dark:text-slate-200 font-extrabold">
                SMS Message Body *
              </label>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
                {charCount} chars ({smsSegments} SMS segment{smsSegments > 1 ? 's' : ''})
              </span>
            </div>

            <textarea
              rows={4}
              required
              placeholder="Type SMS message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-600 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending SMS...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send SMS Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

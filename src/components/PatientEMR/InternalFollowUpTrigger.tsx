import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, Sparkles } from 'lucide-react';
import { formatDate, formatTodayISO } from '../../utils/formatters';

export interface FollowUpAlertConfig {
  enabled: boolean;
  dueDate: string;
  reason: string;
  notes?: string;
  presetSelected?: string;
}

interface InternalFollowUpTriggerProps {
  initialReason?: string;
  onChange: (config: FollowUpAlertConfig) => void;
  title?: string;
  compact?: boolean;
}

export const InternalFollowUpTrigger: React.FC<InternalFollowUpTriggerProps> = ({
  initialReason = 'Check post-op healing & swelling',
  onChange,
  title = 'Follow-Up',
  compact = false,
}) => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('3days');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [reason, setReason] = useState<string>(initialReason);
  const [notes, setNotes] = useState<string>('');

  const calculateDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSelectPreset = (presetKey: string, days: number) => {
    setSelectedPreset(presetKey);
    const newDate = calculateDate(days);
    setDueDate(newDate);
  };

  useEffect(() => {
    onChange({
      enabled,
      dueDate,
      reason,
      notes,
      presetSelected: selectedPreset,
    });
  }, [enabled, dueDate, reason, notes, selectedPreset]);

  const QUICK_REASONS = [
    'Check post-op swelling',
    'Suture removal for tooth #38',
    'Routine scaling check',
    'Crown fit review',
    'Endo obturation follow-up',
  ];

  return (
    <div className={`bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-zinc-900 transition-all ${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-200/80 text-amber-900 font-bold">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
              {title}
            </h4>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
          <span className="ml-2 text-xs font-bold text-amber-900">
            {enabled ? 'Active' : 'Off'}
          </span>
        </label>
      </div>

      {enabled && (
        <div className="space-y-3 pt-1 border-t border-amber-200/50">
          {/* Presets Row */}
          <div>
            <label className="text-[11px] font-bold text-amber-900 block mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Schedule</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('3days', 3)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPreset === '3days'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                In 3 Days
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('7days', 7)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPreset === '7days'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                In 7 Days
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('14days', 14)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPreset === '14days'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                In 14 Days
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('6months', 180)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  selectedPreset === '6months'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-amber-950 border-amber-300 hover:bg-amber-100'
                }`}
              >
                In 6 Months
              </button>
            </div>
          </div>

          {/* Date Picker & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="text-[11px] font-bold text-amber-900 block mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
              />
            </div>

            <div className="sm:col-span-8">
              <label className="text-[11px] font-bold text-amber-900 block mb-1">
                Clinical Reason
              </label>
              <input
                type="text"
                required={enabled}
                placeholder="e.g. Suture removal for tooth #38"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Quick Reasons Chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] font-bold text-amber-800">Quick Reasons:</span>
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-semibold border border-amber-300/80 transition-colors cursor-pointer"
              >
                + {r}
              </button>
            ))}
          </div>

          {/* Schedule Confirmation Banner */}
          <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-bold">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Scheduled: <span className="text-amber-800 underline">{formatDate(dueDate)}</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

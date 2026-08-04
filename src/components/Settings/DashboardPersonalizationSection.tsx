import React, { useState, useEffect } from 'react';
import { DashboardPersonalizationSettings, WelcomeCardIconType, DoctorProfile } from '../../types';
import { 
  getStoredDashboardSettings, 
  saveStoredDashboardSettings, 
  resetDashboardSettings,
  DEFAULT_DASHBOARD_SETTINGS 
} from '../../utils/storage';
import { formatCurrency, formatDate, formatTodayISO } from '../../utils/formatters';
import { 
  Sparkles, 
  Stethoscope, 
  Sun, 
  Shield, 
  Heart, 
  Crown, 
  Award, 
  Activity, 
  Smile, 
  Upload, 
  ImageIcon, 
  RotateCcw, 
  Save, 
  Check, 
  Calendar, 
  Building2, 
  Armchair, 
  Users, 
  DollarSign, 
  Clock, 
  Palette, 
  Type, 
  Eye, 
  Trash2,
  Quote,
  LayoutTemplate
} from 'lucide-react';

interface Props {
  doctor: DoctorProfile;
}

const ICON_OPTIONS: { type: WelcomeCardIconType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { type: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { type: 'Stethoscope', label: 'Stethoscope', icon: Stethoscope },
  { type: 'Sun', label: 'Sun', icon: Sun },
  { type: 'Shield', label: 'Shield', icon: Shield },
  { type: 'Heart', label: 'Heart', icon: Heart },
  { type: 'Crown', label: 'Crown', icon: Crown },
  { type: 'Award', label: 'Award', icon: Award },
  { type: 'Activity', label: 'Activity', icon: Activity },
  { type: 'Smile', label: 'Smile', icon: Smile },
];

const GRADIENT_PRESETS = [
  { id: 'slate-indigo', name: 'Slate Indigo', value: 'from-slate-900 via-indigo-950 to-slate-900' },
  { id: 'teal-emerald', name: 'Teal Emerald', value: 'from-slate-900 via-teal-950 to-emerald-950' },
  { id: 'midnight-obsidian', name: 'Midnight Obsidian', value: 'from-zinc-950 via-zinc-900 to-black' },
  { id: 'royal-purple', name: 'Royal Purple', value: 'from-slate-950 via-purple-950 to-blue-950' },
  { id: 'ocean-sapphire', name: 'Ocean Sapphire', value: 'from-blue-950 via-slate-900 to-cyan-950' },
  { id: 'sunrise-amber', name: 'Deep Amber', value: 'from-amber-950 via-stone-900 to-slate-950' },
];

const SOLID_PRESETS = [
  { id: 'slate', name: 'Midnight Slate', value: '#0f172a' },
  { id: 'navy', name: 'Royal Navy', value: '#1e3a8a' },
  { id: 'emerald', name: 'Deep Emerald', value: '#064e3b' },
  { id: 'zinc', name: 'Dark Zinc', value: '#18181b' },
  { id: 'indigo', name: 'Deep Indigo', value: '#311b92' },
  { id: 'maroon', name: 'Deep Crimson', value: '#4c0519' },
];

export const DashboardPersonalizationSection: React.FC<Props> = ({ doctor }) => {
  const [settings, setSettings] = useState<DashboardPersonalizationSettings>(getStoredDashboardSettings());
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const todayStr = formatTodayISO();

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredDashboardSettings(settings);
    setSavedNotice('Dashboard personalization settings saved permanently!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all dashboard welcome card settings to default values?')) {
      const reset = resetDashboardSettings();
      setSettings(reset);
      setSavedNotice('Reset to default settings!');
      setTimeout(() => setSavedNotice(null), 3000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please select a smaller banner image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSettings((prev) => ({
        ...prev,
        backgroundType: 'image',
        backgroundImageUrl: base64,
      }));
    };
    reader.readAsDataURL(file);
  };

  const renderIcon = (iconType: WelcomeCardIconType, className: string = 'w-5 h-5') => {
    const match = ICON_OPTIONS.find((i) => i.type === iconType);
    if (!match) return <Sparkles className={className} />;
    const IconComponent = match.icon;
    return <IconComponent className={className} />;
  };

  const effectiveClinicName = settings.clinicNameOverride?.trim() || doctor.clinicName || 'FABIS MediCare Dental Clinic';

  return (
    <div className="space-y-8 text-slate-800">
      
      {/* SECTION HEADER */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <LayoutTemplate className="w-6 h-6 text-sky-600" />
            <span>Dashboard Welcome Card Personalization</span>
          </h3>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Customize the greeting card banner, motivational quote, clinic branding, visible metrics, background styles, and card icons on your main Dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {savedNotice}
          </span>
        </div>
      )}

      {/* LIVE PREVIEW CARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-600" />
            <span>Live Welcome Card Preview</span>
          </h4>
          <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">
            Real-Time Render
          </span>
        </div>

        {/* The Welcome Card Mock */}
        <div
          className={`relative rounded-3xl p-6 sm:p-8 text-white shadow-lg overflow-hidden border border-slate-700/50 transition-all ${
            settings.backgroundType === 'gradient'
              ? `bg-gradient-to-r ${settings.backgroundGradient}`
              : ''
          }`}
          style={{
            backgroundColor: settings.backgroundType === 'solid' ? settings.backgroundColor : undefined,
            backgroundImage:
              settings.backgroundType === 'image' && settings.backgroundImageUrl
                ? `url(${settings.backgroundImageUrl})`
                : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark Overlay for image background */}
          {settings.backgroundType === 'image' && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/75 to-slate-950/60 backdrop-blur-[1px]" />
          )}

          <div className="relative z-10 space-y-5">
            {/* Top row: Title, Doctor Name, Clinic Badge, Card Icon & Date */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {effectiveClinicName}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Good Morning / Evening
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-1">
                  {settings.welcomeTitle || 'Welcome back'}, <span className="text-sky-300">{doctor.name || 'Dr. V. Radhakrishnan'}</span>
                </h1>
              </div>

              {/* Right Side Icon & Date Badge */}
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-slate-100">
                  <Calendar className="w-4 h-4 text-sky-300" />
                  <span>{formatDate(todayStr)}</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-300 backdrop-blur-md">
                  {renderIcon(settings.cardIcon, 'w-6 h-6')}
                </div>
              </div>
            </div>

            {/* Subtext Message */}
            {settings.welcomeMessage && (
              <p className="text-xs sm:text-sm font-medium text-slate-200/90 leading-relaxed max-w-3xl">
                {settings.welcomeMessage}
              </p>
            )}

            {/* Motivational Quote */}
            {settings.motivationalQuote && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md max-w-2xl">
                <Quote className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <p className="text-xs font-medium italic text-amber-100/90 leading-snug">
                  "{settings.motivationalQuote}"
                </p>
              </div>
            )}

            {/* Configured Metrics Bar */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10">
              {settings.showActiveChairs && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Active Chairs</div>
                    <div className="text-sm font-black text-white">3 Chairs</div>
                  </div>
                </div>
              )}

              {settings.showTodayAppointments && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Appointments</div>
                    <div className="text-sm font-black text-white">10 Scheduled</div>
                  </div>
                </div>
              )}

              {settings.showWaitingPatients && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Waiting Room</div>
                    <div className="text-sm font-black text-white">2 Patients</div>
                  </div>
                </div>
              )}

              {settings.showTodayRevenue && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-300">Today's Revenue</div>
                    <div className="text-sm font-black text-white">{formatCurrency(14500, doctor.currencySymbol || '₹')}</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* EDIT FORM SETTINGS */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* COLUMN 1: TEXT CONTENT & ICON */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Type className="w-4 h-4 text-sky-600" />
            <span>Card Text & Quotes</span>
          </h4>

          {/* Welcome Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Welcome Greeting Title
            </label>
            <input
              type="text"
              value={settings.welcomeTitle}
              onChange={(e) => setSettings({ ...settings, welcomeTitle: e.target.value })}
              placeholder="e.g. Welcome back, Good Day,"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Welcome Submessage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Welcome Sub-Message
            </label>
            <textarea
              rows={2}
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              placeholder="e.g. Here is your clinical overview for today..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Motivational Quote */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Motivational Daily Quote / Note
            </label>
            <textarea
              rows={2}
              value={settings.motivationalQuote}
              onChange={(e) => setSettings({ ...settings, motivationalQuote: e.target.value })}
              placeholder="e.g. Every smile you restore brings confidence..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Clinic Name Override */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Clinic Name Override (Optional)
            </label>
            <p className="text-[11px] text-slate-400 mb-1.5">
              Leave blank to use main doctor profile clinic name ({doctor.clinicName || 'FABIS MediCare'}).
            </p>
            <input
              type="text"
              value={settings.clinicNameOverride || ''}
              onChange={(e) => setSettings({ ...settings, clinicNameOverride: e.target.value })}
              placeholder={doctor.clinicName || 'e.g. FABIS Dental Specialty Care'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          {/* Icon Chooser */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Choose Welcome Card Icon
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ICON_OPTIONS.map((item) => {
                const isSelected = settings.cardIcon === item.type;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSettings({ ...settings, cardIcon: item.type })}
                    className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 text-sky-700 ring-2 ring-sky-500/20 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: BACKGROUND STYLING & TOGGLES */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-4 h-4 text-purple-600" />
            <span>Background Style & Visible Metrics</span>
          </h4>

          {/* Background Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Background Style Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, backgroundType: 'gradient' })}
                className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  settings.backgroundType === 'gradient'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Gradient
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, backgroundType: 'solid' })}
                className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  settings.backgroundType === 'solid'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Solid Color
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, backgroundType: 'image' })}
                className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                  settings.backgroundType === 'image'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Banner Image
              </button>
            </div>
          </div>

          {/* Gradient Presets */}
          {settings.backgroundType === 'gradient' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Choose Gradient Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, backgroundGradient: preset.value })}
                    className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      settings.backgroundGradient === preset.value
                        ? 'border-purple-600 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                    <div className={`w-8 h-6 rounded-lg bg-gradient-to-r ${preset.value} border border-slate-700/30`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Solid Color Picker */}
          {settings.backgroundType === 'solid' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Select Solid Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
                {SOLID_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSettings({ ...settings, backgroundColor: preset.value })}
                    className={`p-1.5 rounded-xl border text-center flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      settings.backgroundColor === preset.value ? 'ring-2 ring-purple-600 border-purple-600' : 'border-slate-200'
                    }`}
                  >
                    <div className="w-full h-5 rounded-md" style={{ backgroundColor: preset.value }} />
                    <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Banner Upload */}
          {settings.backgroundType === 'image' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Upload Dashboard Banner Image
              </label>
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
                {settings.backgroundImageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={settings.backgroundImageUrl}
                      alt="Banner Preview"
                      className="h-24 w-full object-cover rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, backgroundImageUrl: '' })}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-600">Select a background banner graphic or clinic hero image</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 5MB</p>
                  </div>
                )}

                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold hover:bg-slate-800 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Upload Banner Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* SHOW / HIDE METRICS TOGGLES */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
              Visible Metrics on Card
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Active Chairs */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Armchair className="w-4 h-4 text-amber-500" />
                  Show Active Chairs
                </span>
                <input
                  type="checkbox"
                  checked={settings.showActiveChairs}
                  onChange={(e) => setSettings({ ...settings, showActiveChairs: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              {/* Appointments */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  Show Today's Appointments
                </span>
                <input
                  type="checkbox"
                  checked={settings.showTodayAppointments}
                  onChange={(e) => setSettings({ ...settings, showTodayAppointments: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              {/* Waiting Patients */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Show Waiting Patients
                </span>
                <input
                  type="checkbox"
                  checked={settings.showWaitingPatients}
                  onChange={(e) => setSettings({ ...settings, showWaitingPatients: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>

              {/* Today Revenue */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-500" />
                  Show Today's Revenue
                </span>
                <input
                  type="checkbox"
                  checked={settings.showTodayRevenue}
                  onChange={(e) => setSettings({ ...settings, showTodayRevenue: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Reset to Default
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Personalization</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

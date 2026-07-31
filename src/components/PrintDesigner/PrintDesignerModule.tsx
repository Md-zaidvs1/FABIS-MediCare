// FABIS MediCare - Modular Print Designer Engine Module

import React, { useState, useEffect, useRef } from 'react';
import { DoctorProfile, Patient } from '../../types';
import {
  PrintTemplateConfig,
  TemplateType,
} from './TemplateStorage';
import { TemplateManager } from './TemplateManager';
import { A4Designer } from './A4Designer';
import { ThermalDesigner } from './ThermalDesigner';
import { PrescriptionDesigner } from './PrescriptionDesigner';
import { PrintPreview } from './PrintPreview';
import {
  Printer,
  FileText,
  Save,
  RotateCcw,
  Copy,
  Download,
  Upload,
  CheckCircle2,
  Sparkles,
  Sliders,
  Eye,
  Star,
  AlertCircle,
} from 'lucide-react';

interface PrintDesignerModuleProps {
  doctor: DoctorProfile;
  patient?: Patient | null;
}

export const PrintDesignerModule: React.FC<PrintDesignerModuleProps> = ({ doctor, patient }) => {
  const [activeType, setActiveType] = useState<TemplateType>('invoice_a4');
  const [currentConfig, setCurrentConfig] = useState<PrintTemplateConfig>(() =>
    TemplateManager.getActive('invoice_a4')
  );

  const [availableTemplates, setAvailableTemplates] = useState<PrintTemplateConfig[]>([]);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = TemplateManager.getActive(activeType);
    setCurrentConfig(loaded);
    setAvailableTemplates(TemplateManager.getTemplatesByType(activeType));
  }, [activeType]);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSelectTemplate = (id: string) => {
    const all = TemplateManager.getTemplatesByType(activeType);
    const match = all.find((t) => t.id === id);
    if (match) {
      setCurrentConfig(match);
      TemplateManager.saveTemplate(match);
    }
  };

  const handleSave = () => {
    const saved = TemplateManager.saveTemplate(currentConfig);
    setCurrentConfig(saved);
    setAvailableTemplates(TemplateManager.getTemplatesByType(activeType));
    showFeedback('Print template saved and set as active!');
  };

  const handleRestoreDefault = () => {
    if (window.confirm('Reset this template to factory default settings?')) {
      const restored = TemplateManager.restoreDefault(activeType);
      setCurrentConfig(restored);
      setAvailableTemplates(TemplateManager.getTemplatesByType(activeType));
      showFeedback('Template restored to default settings!');
    }
  };

  const handleDuplicate = () => {
    const dup = TemplateManager.duplicateTemplate(currentConfig);
    setCurrentConfig(dup);
    setAvailableTemplates(TemplateManager.getTemplatesByType(activeType));
    showFeedback(`Template duplicated as "${dup.name}"!`);
  };

  const handleExport = () => {
    TemplateManager.exportTemplate(currentConfig);
    showFeedback('Template exported as JSON!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = TemplateManager.importTemplateJSON(content, activeType);
        setCurrentConfig(imported);
        setAvailableTemplates(TemplateManager.getTemplatesByType(activeType));
        showFeedback(`Successfully imported template "${imported.name}"!`);
      } catch (err: any) {
        showFeedback(err.message || 'Failed to import JSON template', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white p-6 rounded-[28px] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Printer className="w-4 h-4 text-purple-400" />
            <span>FABIS MediCare Print Engine (Phase 1)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Modular Print & PDF Template Designer
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl font-medium">
            Customize A4 Tax Invoices, 80mm Thermal Receipts, and A4 Medical Prescriptions with real-time live preview.
          </p>
        </div>

        {/* Notice Feedback Banner */}
        {notice && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              notice.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
        )}
      </div>

      {/* Document Type Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        {[
          { id: 'invoice_a4', label: '1. Professional A4 Invoice', icon: FileText, color: 'text-purple-600' },
          { id: 'receipt_80mm', label: '2. 80mm Thermal Receipt', icon: Printer, color: 'text-slate-700' },
          { id: 'prescription_a4', label: '3. Professional A4 Prescription', icon: Sparkles, color: 'text-sky-600' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveType(tab.id as TemplateType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-md border border-slate-200/80 scale-[1.01]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Template Selector & Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8ECF3] shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Template Selection Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Star className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-bold text-xs text-slate-700 shrink-0">Saved Template:</span>
          <select
            value={currentConfig.id}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-xs text-slate-900 outline-none focus:border-purple-600 w-full md:w-64"
          >
            {availableTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restore Default Factory Settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicate}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Duplicate Current Template"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export Template as JSON File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Import Template from JSON File"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-purple-200" />
            <span>Save & Set Default</span>
          </button>
        </div>
      </div>

      {/* Grid: Designer Configurator (Left) + Real-time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configurator Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
            <Sliders className="w-4 h-4 text-purple-700" />
            <h3 className="font-extrabold text-sm text-slate-900">Template Customization Settings</h3>
          </div>

          {activeType === 'invoice_a4' && (
            <A4Designer config={currentConfig} doctor={doctor} onChange={setCurrentConfig} />
          )}

          {activeType === 'receipt_80mm' && (
            <ThermalDesigner config={currentConfig} doctor={doctor} onChange={setCurrentConfig} />
          )}

          {activeType === 'prescription_a4' && (
            <PrescriptionDesigner config={currentConfig} doctor={doctor} onChange={setCurrentConfig} />
          )}
        </div>

        {/* Right Column: Real-time Live Preview */}
        <div className="lg:col-span-6 space-y-3 sticky top-4">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-700" />
              <h3 className="font-extrabold text-sm text-slate-900">Instant Live Preview</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Sync
            </span>
          </div>

          <PrintPreview config={currentConfig} doctor={doctor} patient={patient} />
        </div>
      </div>
    </div>
  );
};

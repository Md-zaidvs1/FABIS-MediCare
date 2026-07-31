// FABIS MediCare - Professional A4 Prescription Designer Component

import React from 'react';
import { PrintTemplateConfig } from './TemplateStorage';
import { DoctorProfile } from '../../types';
import {
  Palette,
  Layout,
  Type,
  Building,
  FileText,
  Check,
  PenTool,
  Stethoscope,
} from 'lucide-react';

interface PrescriptionDesignerProps {
  config: PrintTemplateConfig;
  doctor: DoctorProfile;
  onChange: (updated: PrintTemplateConfig) => void;
}

const RX_PRESET_COLORS = [
  { name: 'Sky Blue Medical', hex: '#0EA5E9' },
  { name: 'Teal Health', hex: '#0D9488' },
  { name: 'Deep Royal Purple', hex: '#581C87' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Classic Slate', hex: '#0F172A' },
];

export const PrescriptionDesigner: React.FC<PrescriptionDesignerProps> = ({ config, doctor, onChange }) => {
  const updateField = <K extends keyof PrintTemplateConfig>(field: K, value: PrintTemplateConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-5 text-xs text-[#1E293B]">
      {/* Header Banner */}
      <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
            A4 Prescription Template
          </span>
          <h3 className="font-extrabold text-sm text-slate-900 mt-1">Configure A4 Medical Prescription Header & Layout</h3>
        </div>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="p-2 bg-white border border-sky-200 rounded-xl font-bold text-slate-800 text-xs outline-none focus:border-sky-600 w-full sm:w-64"
          placeholder="Template Title"
        />
      </div>

      {/* 1. Theme Color & Typography */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Palette className="w-4 h-4 text-sky-600" />
          <span>Colors & Typography</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Primary Accent Color</label>
            <div className="flex flex-wrap items-center gap-2">
              {RX_PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => updateField('primaryColor', color.hex)}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
                    config.primaryColor === color.hex ? 'border-sky-700 scale-110 shadow-sm' : 'border-white'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {config.primaryColor === color.hex && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0 bg-transparent"
                title="Custom Hex Color"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Font Size</label>
              <select
                value={config.fontSize}
                onChange={(e) => updateField('fontSize', e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
              >
                <option value="small">Compact (9pt)</option>
                <option value="medium">Standard (10pt)</option>
                <option value="large">Spacious (11pt)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Font Weight</label>
              <select
                value={config.fontWeight}
                onChange={(e) => updateField('fontWeight', e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-sky-600"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Margins */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Layout className="w-4 h-4 text-sky-600" />
          <span>Prescription Page Margins (mm)</span>
        </h4>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Page Margin (mm)</label>
            <input
              type="number"
              min="5"
              max="30"
              value={config.marginMm}
              onChange={(e) => updateField('marginMm', parseInt(e.target.value, 10) || 12)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-center outline-none focus:border-sky-600"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Header Height (mm)</label>
            <input
              type="number"
              min="15"
              max="50"
              value={config.headerHeightMm}
              onChange={(e) => updateField('headerHeightMm', parseInt(e.target.value, 10) || 25)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-center outline-none focus:border-sky-600"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Footer Height (mm)</label>
            <input
              type="number"
              min="10"
              max="40"
              value={config.footerHeightMm}
              onChange={(e) => updateField('footerHeightMm', parseInt(e.target.value, 10) || 20)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-center outline-none focus:border-sky-600"
            />
          </div>
        </div>
      </div>

      {/* 3. Header Visibility Toggles */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Building className="w-4 h-4 text-sky-600" />
          <span>Prescription Header Visibility</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {[
            { key: 'showLogo', label: 'Clinic Logo' },
            { key: 'showClinicName', label: 'Clinic Name' },
            { key: 'showClinicAddress', label: 'Clinic Address' },
            { key: 'showClinicPhone', label: 'Phone Number' },
            { key: 'showClinicEmail', label: 'Email' },
            { key: 'showDoctorName', label: 'Doctor Name' },
            { key: 'showQualification', label: 'Doctor Qualifications' },
            { key: 'showRegNumber', label: 'Doctor Reg Number' },
          ].map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer ${
                config[item.key as keyof PrintTemplateConfig]
                  ? 'bg-sky-50 border-sky-200 text-sky-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={!!config[item.key as keyof PrintTemplateConfig]}
                onChange={(e) => updateField(item.key as any, e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span className="truncate">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Patient Advice & Doctor Signature */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Patient Advice & Doctor Signature</span>
        </h4>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Default Dosage Advice / Guidelines</label>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTerms}
                onChange={(e) => updateField('showTerms', e.target.checked)}
                className="rounded text-sky-600"
              />
              Show Advice Box
            </label>
          </div>
          {config.showTerms && (
            <textarea
              rows={2}
              value={config.termsText}
              onChange={(e) => updateField('termsText', e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs outline-none focus:border-sky-600 text-slate-800"
              placeholder="e.g. Take medicines strictly according to dosage..."
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Get Well Soon Wish</label>
            <input
              type="text"
              value={config.thankYouMessage}
              onChange={(e) => updateField('thankYouMessage', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-sky-600"
              placeholder="e.g. Wishing you a speedy recovery!"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Footer Note</label>
            <input
              type="text"
              value={config.footerText}
              onChange={(e) => updateField('footerText', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-sky-600"
              placeholder="e.g. Valid Medical Prescription — FABIS MediCare"
            />
          </div>
        </div>

        {/* Signature Line */}
        <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-950 flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-sky-600" /> Doctor Signature & Stamp Line
            </span>
            <input
              type="checkbox"
              checked={config.showSignature}
              onChange={(e) => updateField('showSignature', e.target.checked)}
              className="rounded text-sky-600 cursor-pointer"
            />
          </div>
          {config.showSignature && (
            <input
              type="text"
              value={config.signatureText || ''}
              onChange={(e) => updateField('signatureText', e.target.value)}
              placeholder="Signature Label"
              className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium"
            />
          )}
        </div>
      </div>
    </div>
  );
};

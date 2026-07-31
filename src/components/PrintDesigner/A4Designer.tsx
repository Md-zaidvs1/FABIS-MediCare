// FABIS MediCare - Professional A4 Invoice Designer Component

import React from 'react';
import { PrintTemplateConfig } from './TemplateStorage';
import { DoctorProfile } from '../../types';
import {
  Palette,
  Type,
  Layout,
  FileText,
  Check,
  Eye,
  EyeOff,
  Sliders,
  QrCode,
  PenTool,
  Building,
  User,
  Sparkles,
} from 'lucide-react';

interface A4DesignerProps {
  config: PrintTemplateConfig;
  doctor: DoctorProfile;
  onChange: (updated: PrintTemplateConfig) => void;
}

const PRESET_COLORS = [
  { name: 'Royal Purple', hex: '#581C87' },
  { name: 'Navy Slate', hex: '#0F172A' },
  { name: 'Sky Blue', hex: '#0EA5E9' },
  { name: 'Teal Medical', hex: '#0D9488' },
  { name: 'Emerald Health', hex: '#059669' },
  { name: 'Burgundy Red', hex: '#881337' },
];

export const A4Designer: React.FC<A4DesignerProps> = ({ config, doctor, onChange }) => {
  const updateField = <K extends keyof PrintTemplateConfig>(field: K, value: PrintTemplateConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-5 text-xs text-[#1E293B]">
      {/* Template Name & Header */}
      <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
            A4 Invoice Template
          </span>
          <h3 className="font-extrabold text-sm text-slate-900 mt-1">Configure A4 Tax Invoice Layout</h3>
        </div>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="p-2 bg-white border border-purple-200 rounded-xl font-bold text-slate-800 text-xs outline-none focus:border-purple-600 w-full sm:w-64"
          placeholder="Template Title"
        />
      </div>

      {/* 1. Brand Color & Typography */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Palette className="w-4 h-4 text-purple-600" />
          <span>Colors & Typography</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Color */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Primary Accent Color</label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => updateField('primaryColor', color.hex)}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-transform cursor-pointer ${
                    config.primaryColor === color.hex ? 'border-purple-700 scale-110 shadow-sm' : 'border-white'
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

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Font Size</label>
              <select
                value={config.fontSize}
                onChange={(e) => updateField('fontSize', e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-purple-600"
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
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-purple-600"
              >
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Layout Margins & Heights */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Layout className="w-4 h-4 text-purple-600" />
          <span>Margins & Section Heights (mm)</span>
        </h4>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Page Margin (mm)</label>
            <input
              type="number"
              min="5"
              max="30"
              value={config.marginMm}
              onChange={(e) => updateField('marginMm', parseInt(e.target.value, 10) || 10)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:border-purple-600 text-center"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Header Height (mm)</label>
            <input
              type="number"
              min="15"
              max="50"
              value={config.headerHeightMm}
              onChange={(e) => updateField('headerHeightMm', parseInt(e.target.value, 10) || 20)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:border-purple-600 text-center"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Footer Height (mm)</label>
            <input
              type="number"
              min="10"
              max="40"
              value={config.footerHeightMm}
              onChange={(e) => updateField('footerHeightMm', parseInt(e.target.value, 10) || 15)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:border-purple-600 text-center"
            />
          </div>
        </div>
      </div>

      {/* 3. Header & Doctor Info Toggles */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Building className="w-4 h-4 text-purple-600" />
          <span>Clinic Header & Doctor Visibility</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {[
            { key: 'showLogo', label: 'Clinic Logo' },
            { key: 'showClinicName', label: 'Clinic Name' },
            { key: 'showClinicAddress', label: 'Address' },
            { key: 'showClinicPhone', label: 'Phone Number' },
            { key: 'showClinicEmail', label: 'Email' },
            { key: 'showDoctorName', label: 'Doctor Name' },
            { key: 'showQualification', label: 'Qualifications' },
            { key: 'showRegNumber', label: 'Reg Number' },
            { key: 'showPatientPhone', label: 'Patient Phone' },
          ].map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer ${
                config[item.key as keyof PrintTemplateConfig]
                  ? 'bg-purple-50 border-purple-200 text-purple-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={!!config[item.key as keyof PrintTemplateConfig]}
                onChange={(e) => updateField(item.key as any, e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="truncate">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 4. Terms, Signature & QR Code Config */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <FileText className="w-4 h-4 text-purple-600" />
          <span>Footer, Terms, Signature & QR Code</span>
        </h4>

        {/* Terms */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-800">Terms & Conditions</label>
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTerms}
                onChange={(e) => updateField('showTerms', e.target.checked)}
                className="rounded text-purple-600"
              />
              Show Terms
            </label>
          </div>
          {config.showTerms && (
            <textarea
              rows={2}
              value={config.termsText}
              onChange={(e) => updateField('termsText', e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] outline-none focus:border-purple-600 text-slate-800"
              placeholder="Enter invoice terms and payment rules..."
            />
          )}
        </div>

        {/* Thank You Message */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Thank You Message</label>
              <input
                type="checkbox"
                checked={config.showThankYou}
                onChange={(e) => updateField('showThankYou', e.target.checked)}
                className="rounded text-purple-600"
              />
            </div>
            <input
              type="text"
              disabled={!config.showThankYou}
              value={config.thankYouMessage}
              onChange={(e) => updateField('thankYouMessage', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-purple-600 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Footer Text</label>
              <input
                type="checkbox"
                checked={config.showFooter}
                onChange={(e) => updateField('showFooter', e.target.checked)}
                className="rounded text-purple-600"
              />
            </div>
            <input
              type="text"
              disabled={!config.showFooter}
              value={config.footerText}
              onChange={(e) => updateField('footerText', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-purple-600 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Signature & QR Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5 text-purple-600" /> Signature Line
              </span>
              <input
                type="checkbox"
                checked={config.showSignature}
                onChange={(e) => updateField('showSignature', e.target.checked)}
                className="rounded text-purple-600 cursor-pointer"
              />
            </div>
            {config.showSignature && (
              <input
                type="text"
                value={config.signatureText || ''}
                onChange={(e) => updateField('signatureText', e.target.value)}
                placeholder="Signature Label"
                className="w-full p-2 bg-white border border-purple-200 rounded-lg text-slate-800 font-medium"
              />
            )}
          </div>

          <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-950 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-sky-600" /> UPI QR Code Block
              </span>
              <input
                type="checkbox"
                checked={config.showQrCode}
                onChange={(e) => updateField('showQrCode', e.target.checked)}
                className="rounded text-sky-600 cursor-pointer"
              />
            </div>
            {config.showQrCode && (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={config.qrCodeLabel || ''}
                  onChange={(e) => updateField('qrCodeLabel', e.target.value)}
                  placeholder="QR Code Label (e.g. Scan to Pay via UPI)"
                  className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-medium text-xs"
                />
                <input
                  type="text"
                  value={config.qrCodeText || ''}
                  onChange={(e) => updateField('qrCodeText', e.target.value)}
                  placeholder="UPI Link / Address"
                  className="w-full p-2 bg-white border border-sky-200 rounded-lg text-slate-800 font-mono text-[11px]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

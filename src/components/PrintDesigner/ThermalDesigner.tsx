// FABIS MediCare - Professional 80mm Thermal Receipt Designer Component

import React from 'react';
import { PrintTemplateConfig } from './TemplateStorage';
import { DoctorProfile } from '../../types';
import {
  Palette,
  Layout,
  Type,
  Building,
  QrCode,
  Sparkles,
  FileText,
} from 'lucide-react';

interface ThermalDesignerProps {
  config: PrintTemplateConfig;
  doctor: DoctorProfile;
  onChange: (updated: PrintTemplateConfig) => void;
}

export const ThermalDesigner: React.FC<ThermalDesignerProps> = ({ config, doctor, onChange }) => {
  const updateField = <K extends keyof PrintTemplateConfig>(field: K, value: PrintTemplateConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-5 text-xs text-[#1E293B]">
      {/* Template Header */}
      <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-800 bg-slate-200 px-2 py-0.5 rounded-md">
            80mm Thermal Receipt
          </span>
          <h3 className="font-extrabold text-sm text-slate-900 mt-1">Configure Thermal Cash Receipt Roll</h3>
        </div>
        <input
          type="text"
          value={config.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs outline-none focus:border-slate-800 w-full sm:w-64"
          placeholder="Template Title"
        />
      </div>

      {/* 1. Header Details Toggles */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Building className="w-4 h-4 text-slate-800" />
          <span>Receipt Header Information</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {[
            { key: 'showClinicName', label: 'Clinic Name' },
            { key: 'showClinicAddress', label: 'Address' },
            { key: 'showClinicPhone', label: 'Phone Number' },
            { key: 'showDoctorName', label: 'Doctor Name' },
            { key: 'showRegNumber', label: 'Reg Number' },
            { key: 'showPatientPhone', label: 'Patient Mobile' },
          ].map((item) => (
            <label
              key={item.key}
              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors cursor-pointer ${
                config[item.key as keyof PrintTemplateConfig]
                  ? 'bg-slate-100 border-slate-300 text-slate-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <input
                type="checkbox"
                checked={!!config[item.key as keyof PrintTemplateConfig]}
                onChange={(e) => updateField(item.key as any, e.target.checked)}
                className="rounded text-slate-800 focus:ring-slate-800 cursor-pointer"
              />
              <span className="truncate">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 2. Paper Layout & Font Density */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Layout className="w-4 h-4 text-slate-800" />
          <span>Thermal Paper Roll Settings</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Side Margins (mm)</label>
            <input
              type="number"
              min="2"
              max="15"
              value={config.marginMm}
              onChange={(e) => updateField('marginMm', parseInt(e.target.value, 10) || 4)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-center outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Font Size</label>
            <select
              value={config.fontSize}
              onChange={(e) => updateField('fontSize', e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800"
            >
              <option value="small">Compact (7.5pt)</option>
              <option value="medium">Standard (8.5pt)</option>
              <option value="large">Large (9.5pt)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Font Weight</label>
            <select
              value={config.fontWeight}
              onChange={(e) => updateField('fontWeight', e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800"
            >
              <option value="normal">Normal</option>
              <option value="bold">High Contrast Bold</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Footer & QR Code Settings */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <QrCode className="w-4 h-4 text-slate-800" />
          <span>Footer & Payment QR Code</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Thank You Banner</label>
            <input
              type="text"
              value={config.thankYouMessage}
              onChange={(e) => updateField('thankYouMessage', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800"
              placeholder="e.g. THANK YOU FOR YOUR VISIT!"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Footer Note</label>
            <input
              type="text"
              value={config.footerText}
              onChange={(e) => updateField('footerText', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800"
              placeholder="e.g. Keep smiling."
            />
          </div>
        </div>

        {/* QR Code */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-slate-700" /> UPI QR Code on Thermal Tape
            </span>
            <input
              type="checkbox"
              checked={config.showQrCode}
              onChange={(e) => updateField('showQrCode', e.target.checked)}
              className="rounded text-slate-800 cursor-pointer"
            />
          </div>
          {config.showQrCode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={config.qrCodeLabel || ''}
                onChange={(e) => updateField('qrCodeLabel', e.target.value)}
                placeholder="Label (e.g. Scan UPI)"
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
              />
              <input
                type="text"
                value={config.qrCodeText || ''}
                onChange={(e) => updateField('qrCodeText', e.target.value)}
                placeholder="UPI Address String"
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-[11px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

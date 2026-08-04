// FABIS MediCare - Professional 80mm Thermal Receipt Designer Component

import React, { useRef } from 'react';
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
  Upload,
  Trash2,
  BarChart,
  Minus,
  Globe,
  Mail,
  Phone,
  MapPin,
  PenTool,
  Check,
} from 'lucide-react';

interface ThermalDesignerProps {
  config: PrintTemplateConfig;
  doctor: DoctorProfile;
  onChange: (updated: PrintTemplateConfig) => void;
}

export const ThermalDesigner: React.FC<ThermalDesignerProps> = ({ config, doctor, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadKey, setActiveUploadKey] = React.useState<
    'logoUrl' | 'signatureImageUrl' | 'stampImageUrl' | 'watermarkImageUrl'
  >('logoUrl');

  const updateField = <K extends keyof PrintTemplateConfig>(field: K, value: PrintTemplateConfig[K]) => {
    onChange({ ...config, [field]: value });
  };

  const handleImageUpload = (key: 'logoUrl' | 'signatureImageUrl' | 'stampImageUrl' | 'watermarkImageUrl') => {
    setActiveUploadKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        if (activeUploadKey === 'logoUrl') onChange({ ...config, logoUrl: dataUrl, showLogo: true });
        if (activeUploadKey === 'signatureImageUrl') onChange({ ...config, signatureImageUrl: dataUrl, showSignature: true });
        if (activeUploadKey === 'stampImageUrl') onChange({ ...config, stampImageUrl: dataUrl });
        if (activeUploadKey === 'watermarkImageUrl') onChange({ ...config, watermarkImageUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-5 text-xs text-[#1E293B]">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

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

      {/* 1. Clinic Branding & Header Options */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-slate-800" />
            <span>Clinic Name & Branding Header</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
            <input
              type="checkbox"
              checked={config.showLogo}
              onChange={(e) => updateField('showLogo', e.target.checked)}
              className="rounded text-slate-800 focus:ring-slate-800 cursor-pointer"
            />
            <span>Show Logo</span>
          </label>
        </h4>

        {/* Logo Upload Box */}
        {config.showLogo && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded bg-white border p-0.5" />
              ) : (
                <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                  Logo
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">Clinic Logo</p>
                <p className="text-[10px] text-slate-500">Upload custom logo image for receipt header</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleImageUpload('logoUrl')}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800 cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Upload</span>
              </button>
              {config.logoUrl && (
                <button
                  type="button"
                  onClick={() => updateField('logoUrl', '')}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Remove Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Text Fields */}
        <div className="space-y-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Clinic Name</label>
            <input
              type="text"
              value={config.clinicNameOverride ?? doctor.clinicName ?? 'RK DENTAL CLINIC'}
              onChange={(e) => updateField('clinicNameOverride', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-slate-800 text-xs"
              placeholder="e.g. RK DENTAL CLINIC"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Clinic Address</label>
            <textarea
              rows={2}
              value={config.clinicAddressOverride ?? doctor.clinicAddress ?? 'No.10/1 School street, near police station, Kalavai 632506'}
              onChange={(e) => updateField('clinicAddressOverride', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800 text-xs resize-none"
              placeholder="Enter full address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Phone Number</label>
              <input
                type="text"
                value={config.clinicPhoneOverride ?? doctor.clinicPhone ?? '+91 8883261285'}
                onChange={(e) => updateField('clinicPhoneOverride', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800 text-xs"
                placeholder="e.g. +91 8883261285"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Email (Optional)</label>
              <input
                type="text"
                value={config.clinicEmailOverride ?? doctor.clinicEmail ?? ''}
                onChange={(e) => updateField('clinicEmailOverride', e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800 text-xs"
                placeholder="e.g. rkdental@example.com"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          {[
            { key: 'showClinicName', label: 'Clinic Name' },
            { key: 'showClinicAddress', label: 'Address' },
            { key: 'showClinicPhone', label: 'Phone Number' },
            { key: 'showClinicEmail', label: 'Email Address' },
            { key: 'showPatientPhone', label: 'Patient Phone' },
            { key: 'showPaymentMode', label: 'Payment Mode' },
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

      {/* 2. Paper Layout, Fonts & Formatting */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Type className="w-4 h-4 text-slate-800" />
          <span>Font Family, Colors & Divider Lines</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Font Family</label>
            <select
              value={config.fontFamily || 'Courier Prime'}
              onChange={(e) => updateField('fontFamily', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800 text-xs"
            >
              <option value="Courier Prime">Monospace (Thermal Printer Default)</option>
              <option value="Inter">Inter Clean</option>
              <option value="Roboto">Roboto Standard</option>
              <option value="Playfair Display">Playfair Serif</option>
              <option value="Montserrat">Montserrat Modern</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Font Size</label>
            <select
              value={config.fontSize}
              onChange={(e) => updateField('fontSize', e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800 text-xs"
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
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800 text-xs"
            >
              <option value="normal">Normal</option>
              <option value="bold">High Contrast Bold</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Divider Style</label>
            <select
              value={config.dividerStyle || 'dotted'}
              onChange={(e) => updateField('dividerStyle', e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800 text-xs"
            >
              <option value="dotted">. . . Dotted Line (Classic Thermal)</option>
              <option value="solid">--- Solid Line</option>
              <option value="dashed">- - - Dashed Line</option>
              <option value="double">=== Double Line</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Side Margins (mm)</label>
            <input
              type="number"
              min="2"
              max="15"
              value={config.marginMm}
              onChange={(e) => updateField('marginMm', parseInt(e.target.value, 10) || 4)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-center outline-none focus:border-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Default Payment Badge</label>
            <input
              type="text"
              value={config.paymentModeOverride ?? 'CARD'}
              onChange={(e) => updateField('paymentModeOverride', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 uppercase outline-none focus:border-slate-800 text-xs"
              placeholder="e.g. CARD / CASH / UPI"
            />
          </div>
        </div>
      </div>

      {/* 3. Footer, Barcode & Custom Assets */}
      <div className="p-4 bg-white rounded-2xl border border-[#E8ECF3] shadow-2xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <BarChart className="w-4 h-4 text-slate-800" />
          <span>Footer, Barcode & Assets</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Thank You Banner</label>
            <input
              type="text"
              value={config.thankYouMessage}
              onChange={(e) => updateField('thankYouMessage', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-slate-800 text-xs"
              placeholder="e.g. THANK YOU FOR YOUR VISIT!"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Footer Sub-text</label>
            <input
              type="text"
              value={config.footerText}
              onChange={(e) => updateField('footerText', e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-slate-800 text-xs"
              placeholder="e.g. Keep smiling."
            />
          </div>
        </div>

        {/* Barcode Option */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4 text-slate-700" />
            <div>
              <p className="font-bold text-slate-900">Receipt Barcode</p>
              <p className="text-[10px] text-slate-500">Display invoice ID barcode at the bottom of receipt</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config.showBarcode ?? true}
            onChange={(e) => updateField('showBarcode', e.target.checked)}
            className="rounded text-slate-800 cursor-pointer"
          />
        </div>

        {/* QR Code Option */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-slate-700" /> UPI Payment QR Code
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
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-xs"
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

        {/* Signature & Stamp Image Uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <PenTool className="w-3.5 h-3.5" /> Doctor Signature
              </span>
              <button
                type="button"
                onClick={() => handleImageUpload('signatureImageUrl')}
                className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer"
              >
                Upload
              </button>
            </div>
            {config.signatureImageUrl && (
              <div className="flex items-center justify-between bg-white p-1 rounded border text-[10px]">
                <span className="truncate text-slate-600">Signature Image</span>
                <button
                  type="button"
                  onClick={() => updateField('signatureImageUrl', '')}
                  className="text-rose-600 font-bold"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Official Clinic Stamp
              </span>
              <button
                type="button"
                onClick={() => handleImageUpload('stampImageUrl')}
                className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer"
              >
                Upload
              </button>
            </div>
            {config.stampImageUrl && (
              <div className="flex items-center justify-between bg-white p-1 rounded border text-[10px]">
                <span className="truncate text-slate-600">Stamp Image</span>
                <button
                  type="button"
                  onClick={() => updateField('stampImageUrl', '')}
                  className="text-rose-600 font-bold"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

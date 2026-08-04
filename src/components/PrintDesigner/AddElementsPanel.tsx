// FABIS MediCare - Add Elements Panel for Canva-like Editor

import React, { useState, useRef } from 'react';
import { CanvasElement, DYNAMIC_FIELDS_LIST } from './TemplateStorage';
import {
  Type,
  Database,
  Image as ImageIcon,
  Square,
  Minus,
  Circle,
  QrCode,
  BarChart,
  Table as TableIcon,
  Upload,
  Plus,
  Stethoscope,
  Smile,
  ShieldCheck,
  Building,
  User,
  Phone,
  FileText,
  Sparkles,
} from 'lucide-react';

interface AddElementsPanelProps {
  onAddElement: (el: Omit<CanvasElement, 'id'>) => void;
  onUploadImage: (type: 'logo' | 'watermark' | 'background' | 'signature' | 'stamp', dataUrl: string) => void;
}

export const AddElementsPanel: React.FC<AddElementsPanelProps> = ({
  onAddElement,
  onUploadImage,
}) => {
  const [activeTab, setActiveTab] = useState<'dynamic' | 'text' | 'images' | 'shapes' | 'elements'>('dynamic');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadType, setCurrentUploadType] = useState<'logo' | 'watermark' | 'background' | 'signature' | 'stamp'>('logo');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUploadImage(currentUploadType, dataUrl);
        // Also add image element to canvas
        onAddElement({
          type: 'image',
          imageType: currentUploadType,
          src: dataUrl,
          x: 35,
          y: 20,
          width: 30,
          height: 15,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerUpload = (type: 'logo' | 'watermark' | 'background' | 'signature' | 'stamp') => {
    setCurrentUploadType(type);
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4 text-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        {[
          { id: 'dynamic', label: 'Dynamic Fields', icon: Database },
          { id: 'text', label: 'Text', icon: Type },
          { id: 'images', label: 'Images', icon: ImageIcon },
          { id: 'shapes', label: 'Shapes', icon: Square },
          { id: 'elements', label: 'Design', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-lg font-extrabold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-purple-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: 26 Dynamic Fields */}
      {activeTab === 'dynamic' && (
        <div className="space-y-2">
          <p className="font-bold text-slate-700 text-[11px]">
            Click any dynamic field to place it on the canvas. Values populate automatically from patient & EMR records.
          </p>
          <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
            {DYNAMIC_FIELDS_LIST.map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() =>
                  onAddElement({
                    type: 'dynamic_field',
                    fieldKey: field.key,
                    labelOverride: field.label,
                    x: 20,
                    y: 30,
                    width: 35,
                    height: 5,
                    fontSize: 12,
                    bold: false,
                  })
                }
                className="p-2 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 border border-slate-200 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <p className="font-bold text-slate-900 text-[11px] group-hover:text-purple-900">{field.label}</p>
                  <p className="text-[9px] text-slate-400 font-mono">{field.category}</p>
                </div>
                <Plus className="w-3.5 h-3.5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Text */}
      {activeTab === 'text' && (
        <div className="space-y-2">
          <p className="font-bold text-slate-700 text-[11px]">Add customizable headings or text labels:</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'text',
                  content: 'TAX INVOICE',
                  x: 35,
                  y: 10,
                  width: 30,
                  height: 6,
                  fontSize: 20,
                  bold: true,
                  textAlign: 'center',
                })
              }
              className="w-full p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-black text-sm text-slate-900 flex items-center justify-between cursor-pointer"
            >
              <span>Add Large Heading</span>
              <Plus className="w-4 h-4 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'text',
                  content: 'Subheading / Section Title',
                  x: 10,
                  y: 25,
                  width: 40,
                  height: 5,
                  fontSize: 14,
                  bold: true,
                })
              }
              className="w-full p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 flex items-center justify-between cursor-pointer"
            >
              <span>Add Subheading</span>
              <Plus className="w-4 h-4 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'text',
                  content: 'Add body text or clinical notice details here.',
                  x: 10,
                  y: 40,
                  width: 50,
                  height: 8,
                  fontSize: 11,
                })
              }
              className="w-full p-2 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-normal text-xs text-slate-700 flex items-center justify-between cursor-pointer"
            >
              <span>Add Body Text</span>
              <Plus className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Upload Images */}
      {activeTab === 'images' && (
        <div className="space-y-2">
          <p className="font-bold text-slate-700 text-[11px]">
            Upload or place clinic branding assets onto the template canvas:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'logo', label: 'Upload Clinic Logo' },
              { type: 'watermark', label: 'Upload Watermark' },
              { type: 'background', label: 'Upload Background' },
              { type: 'signature', label: 'Upload Doctor Signature' },
              { type: 'stamp', label: 'Upload Official Stamp' },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => triggerUpload(item.type as any)}
                className="p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group"
              >
                <Upload className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-[11px] text-slate-800">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Shapes */}
      {activeTab === 'shapes' && (
        <div className="space-y-2">
          <p className="font-bold text-slate-700 text-[11px]">Add lines, dividers, or filled container shapes:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'shape',
                  shapeType: 'divider',
                  x: 10,
                  y: 30,
                  width: 80,
                  height: 1,
                  strokeColor: '#CBD5E1',
                  strokeWidth: 1,
                })
              }
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-purple-600" />
                <span>Divider Line</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'shape',
                  shapeType: 'box',
                  x: 10,
                  y: 40,
                  width: 80,
                  height: 15,
                  strokeColor: '#E2E8F0',
                  fillColor: '#F8FAFC',
                  borderRadius: 8,
                })
              }
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Square className="w-4 h-4 text-purple-600" />
                <span>Box Container</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'shape',
                  shapeType: 'circle',
                  x: 40,
                  y: 50,
                  width: 15,
                  height: 15,
                  strokeColor: '#581C87',
                  fillColor: '#F3E8FF',
                })
              }
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Circle className="w-4 h-4 text-purple-600" />
                <span>Circle</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Design Elements (QR, Barcode, Icons, Table) */}
      {activeTab === 'elements' && (
        <div className="space-y-2">
          <p className="font-bold text-slate-700 text-[11px]">Add interactive design elements:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'qr_code',
                  qrText: 'upi://pay?pa=fabismedicare@upi',
                  label: 'Scan to Pay UPI',
                  x: 70,
                  y: 70,
                  width: 20,
                  height: 15,
                })
              }
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>UPI QR Code</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'barcode',
                  x: 70,
                  y: 10,
                  width: 25,
                  height: 8,
                })
              }
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4 text-purple-600" />
                <span>MRN Barcode</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-purple-600" />
            </button>

            <button
              type="button"
              onClick={() =>
                onAddElement({
                  type: 'icon',
                  iconName: 'Stethoscope',
                  x: 10,
                  y: 10,
                  width: 8,
                  height: 8,
                })
              }
              className="p-2.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-600" />
                <span>Dental Icon</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-purple-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// FABIS MediCare - PNG Template Print Designer Engine

import React, { useState, useEffect, useRef } from 'react';
import { DoctorProfile, Patient } from '../../types';
import {
  PrintTemplateConfig,
  TemplateType,
  CanvasElement,
  getActiveTemplate,
  saveStoredTemplates,
  getStoredTemplates,
  setActiveTemplate,
  getDefaultOverlayElements,
} from './TemplateStorage';
import {
  Upload,
  Save,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Type,
  CheckCircle2,
  Printer,
  Sparkles,
  FileImage,
  Image as ImageIcon,
  Move,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  QrCode,
  PenTool,
  Building,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

interface PrintDesignerModuleProps {
  doctor: DoctorProfile;
  patient?: Patient | null;
}

export const PrintDesignerModule: React.FC<PrintDesignerModuleProps> = ({ doctor }) => {
  const [activeType, setActiveType] = useState<TemplateType>('invoice_a4');
  const [config, setConfig] = useState<PrintTemplateConfig>(() => getActiveTemplate('invoice_a4'));
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isMappingMode, setIsMappingMode] = useState<boolean>(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const pngFileInputRef = useRef<HTMLInputElement>(null);
  const assetFileInputRef = useRef<HTMLInputElement>(null);
  const [activeAssetUploadKey, setActiveAssetUploadKey] = useState<
    'logoUrl' | 'signatureImageUrl' | 'stampImageUrl' | 'watermarkImageUrl'
  >('logoUrl');

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load template config when activeType changes
  useEffect(() => {
    const active = getActiveTemplate(activeType);
    if (!active.elements || active.elements.length === 0) {
      active.elements = getDefaultOverlayElements(activeType);
    }
    setConfig(active);
    setSelectedElementId(null);
  }, [activeType]);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  // Helper to handle PNG Template File Upload
  const handlePngUploadClick = () => {
    pngFileInputRef.current?.click();
  };

  const handlePngFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict PNG Check
    if (!file.type.includes('png') && !file.name.toLowerCase().endsWith('.png')) {
      showFeedback('Invalid file format. Please upload PNG files only (.png format).', 'error');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        const defaultElements = getDefaultOverlayElements(activeType);

        const updated: PrintTemplateConfig = {
          ...config,
          backgroundImageUrl: dataUrl,
          elements: defaultElements,
          updatedAt: new Date().toISOString(),
        };

        setConfig(updated);

        const allTemplates = getStoredTemplates();
        const existingIndex = allTemplates.findIndex((t) => t.id === updated.id);
        let updatedTemplates: PrintTemplateConfig[];
        if (existingIndex >= 0) {
          updatedTemplates = [...allTemplates];
          updatedTemplates[existingIndex] = updated;
        } else {
          updatedTemplates = [...allTemplates, updated];
        }
        saveStoredTemplates(updatedTemplates);
        setActiveTemplate(updated.id, activeType);

        setIsMappingMode(true);
        showFeedback(
          'PNG template uploaded! In Field Mapping mode, drag dynamic fields to your PNG artwork slots. Hide any fields already printed on your PNG.'
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset Field Positions to Standard Layout
  const handleResetFields = () => {
    const defaults = getDefaultOverlayElements(activeType);
    setConfig({ ...config, elements: defaults });
    setSelectedElementId(null);
    showFeedback('Field positions reset to standard default mapping!');
  };

  // Helper to handle Asset File Upload (Logo, Signature, Stamp, Watermark)
  const handleAssetUploadClick = (key: 'logoUrl' | 'signatureImageUrl' | 'stampImageUrl' | 'watermarkImageUrl') => {
    setActiveAssetUploadKey(key);
    assetFileInputRef.current?.click();
  };

  const handleAssetFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        if (activeAssetUploadKey === 'logoUrl') {
          setConfig({ ...config, logoUrl: dataUrl, showLogo: true });
        } else if (activeAssetUploadKey === 'signatureImageUrl') {
          setConfig({ ...config, signatureImageUrl: dataUrl, showSignature: true });
        } else if (activeAssetUploadKey === 'stampImageUrl') {
          setConfig({ ...config, stampImageUrl: dataUrl });
        } else if (activeAssetUploadKey === 'watermarkImageUrl') {
          setConfig({ ...config, watermarkImageUrl: dataUrl });
        }
        showFeedback('Asset image updated!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save Template Action
  const handleSaveTemplate = () => {
    const allTemplates = getStoredTemplates();
    const existingIndex = allTemplates.findIndex((t) => t.id === config.id);

    const savedConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };

    let updatedTemplates: PrintTemplateConfig[];
    if (existingIndex >= 0) {
      updatedTemplates = [...allTemplates];
      updatedTemplates[existingIndex] = savedConfig;
    } else {
      updatedTemplates = [...allTemplates, savedConfig];
    }

    saveStoredTemplates(updatedTemplates);
    setActiveTemplate(savedConfig.id, activeType);
    showFeedback(`Saved! All future Prints, PDFs, and WhatsApp Shares will now use these exact field mapping positions.`);
  };

  // Element Manipulation Helpers
  const elements = config.elements || [];

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    const nextElements = elements.map((el) => (el.id === selectedElementId ? { ...el, ...updates } : el));
    setConfig({ ...config, elements: nextElements });
  };

  const toggleElementVisibility = (id: string) => {
    const nextElements = elements.map((el) => (el.id === id ? { ...el, hidden: !el.hidden } : el));
    setConfig({ ...config, elements: nextElements });
  };

  const handleAddCustomText = () => {
    const newEl: CanvasElement = {
      id: `el_custom_${Date.now()}`,
      type: 'text',
      content: 'Custom Note / Field',
      x: 10,
      y: 50,
      width: 40,
      height: 5,
      fontSize: 12,
      fontFamily: config.fontFamily || 'Inter',
      bold: false,
      color: '#0F172A',
      textAlign: 'left',
    };
    setConfig({ ...config, elements: [...elements, newEl] });
    setSelectedElementId(newEl.id);
    showFeedback('Added new custom text element!');
  };

  const handleDeleteElement = (id: string) => {
    const nextElements = elements.filter((el) => el.id !== id);
    setConfig({ ...config, elements: nextElements });
    if (selectedElementId === id) setSelectedElementId(null);
    showFeedback('Element removed.');
  };

  const handleRemoveBackgroundPng = () => {
    const updated: PrintTemplateConfig = {
      ...config,
      backgroundImageUrl: undefined,
      updatedAt: new Date().toISOString(),
    };
    setConfig(updated);

    // Save changes immediately to storage
    const allTemplates = getStoredTemplates();
    const existingIndex = allTemplates.findIndex((t) => t.id === updated.id);
    let updatedTemplates: PrintTemplateConfig[];
    if (existingIndex >= 0) {
      updatedTemplates = [...allTemplates];
      updatedTemplates[existingIndex] = updated;
    } else {
      updatedTemplates = [...allTemplates, updated];
    }

    saveStoredTemplates(updatedTemplates);
    setActiveTemplate(updated.id, activeType);

    showFeedback('Uploaded background PNG image deleted successfully.');
  };

  // Mouse Dragging for Canvas Elements
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedElementId(id);
    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });

    const targetEl = elements.find((el) => el.id === id);
    if (targetEl) {
      setElementStartPos({ x: targetEl.x, y: targetEl.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartPos.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartPos.y) / rect.height) * 100;

    const newX = Math.max(0, Math.min(95, Math.round((elementStartPos.x + deltaX) * 10) / 10));
    const newY = Math.max(0, Math.min(95, Math.round((elementStartPos.y + deltaY) * 10) / 10));

    updateSelectedElement({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Get Field Tag Name for Mapping Mode
  const getFieldTagName = (el: CanvasElement) => {
    if (el.labelOverride) return el.labelOverride;
    if (el.content) return el.content;
    if (el.fieldKey === 'patient_name') return 'Patient Name';
    if (el.fieldKey === 'mrn') return 'MRN / ID';
    if (el.fieldKey === 'appointment_date') return 'Date';
    if (el.fieldKey === 'invoice_number') return 'Invoice Number';
    if (el.fieldKey === 'grand_total') return 'Grand Total';
    if (el.fieldKey === 'payment_method') return 'Payment Mode';
    if (el.fieldKey === 'clinic_name') return 'Clinic Name';
    if (el.fieldKey === 'clinic_address') return 'Clinic Address';
    if (el.fieldKey === 'clinic_phone') return 'Clinic Phone';
    if (el.fieldKey === 'doctor_name') return 'Doctor Name';
    if (el.fieldKey === 'doctor_reg_no') return 'Reg Number';
    if (el.fieldKey === 'thank_you_message') return 'Thank You Note';
    if (el.type === 'table') return 'Treatment Table';
    return el.id;
  };

  // Get Display Value for canvas preview
  const getElementPreviewText = (el: CanvasElement) => {
    if (el.content) return el.content;
    if (el.fieldKey) {
      if (el.fieldKey === 'patient_name') return (el.labelOverride ? `${el.labelOverride}: ` : '') + 'Ananya Sharma';
      if (el.fieldKey === 'mrn') return (el.labelOverride ? `${el.labelOverride}: ` : '') + 'P-1008';
      if (el.fieldKey === 'appointment_date') return (el.labelOverride ? `${el.labelOverride}: ` : '') + '02 Aug 2026';
      if (el.fieldKey === 'invoice_number') return (el.labelOverride ? `${el.labelOverride}: ` : '') + 'INV-2026-089';
      if (el.fieldKey === 'grand_total') return (el.labelOverride ? `${el.labelOverride}: ` : '') + '₹5,500.00';
      if (el.fieldKey === 'payment_method') return (el.labelOverride ? `${el.labelOverride}: ` : '') + 'CARD / UPI';
      if (el.fieldKey === 'clinic_name') return doctor.clinicName || 'RK DENTAL CLINIC';
      if (el.fieldKey === 'clinic_address') return doctor.clinicAddress || 'Kalavai 632506';
      if (el.fieldKey === 'clinic_phone') return `Ph: ${doctor.clinicPhone || '+91 8883261285'}`;
      if (el.fieldKey === 'doctor_name') return `Dr. ${doctor.name}`;
      if (el.fieldKey === 'doctor_reg_no') return `Reg: ${doctor.regNumber || 'DENT-12345'}`;
      if (el.fieldKey === 'thank_you_message') return config.thankYouMessage || 'THANK YOU FOR YOUR VISIT!';
    }
    return el.labelOverride || el.id;
  };

  return (
    <div className="space-y-6 text-slate-800" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={pngFileInputRef}
        onChange={handlePngFileChange}
        accept="image/png,.png"
        className="hidden"
      />
      <input
        type="file"
        ref={assetFileInputRef}
        onChange={handleAssetFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Feedback Notice Toast */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 shadow-lg transition-all animate-bounce-in ${
            notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notice.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <p className="font-bold text-xs sm:text-sm">{notice.message}</p>
        </div>
      )}

      {/* Step-by-Step Workflow Banner */}
      <div className="bg-purple-900 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span>Doctor's Fast PNG Workflow:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-purple-100">
          <span className="bg-purple-800/80 px-2.5 py-1 rounded-lg border border-purple-700">1. Upload PNG</span>
          <span>➔</span>
          <span className="bg-purple-800/80 px-2.5 py-1 rounded-lg border border-purple-700 text-amber-300 font-bold">2. Fields Placed Auto</span>
          <span>➔</span>
          <span className="bg-purple-800/80 px-2.5 py-1 rounded-lg border border-purple-700">3. Drag / Adjust (Optional)</span>
          <span>➔</span>
          <span className="bg-purple-800/80 px-2.5 py-1 rounded-lg border border-purple-700 text-emerald-300 font-bold">4. Save & Print</span>
        </div>
      </div>

      {/* Header & Template Selector Tabs */}
      <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-purple-700 font-extrabold text-lg">
              <Printer className="w-5 h-5 text-purple-600" />
              <span>PNG Print Template Manager</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload Google PNG designs, configure dynamic fields, edit fonts, positions, and save as default.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSaveTemplate}
            className="w-full md:w-auto px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>

        {/* 2 Primary Upload Options Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveType('invoice_a4')}
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              activeType === 'invoice_a4'
                ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-xs">1. Upload A4 Template (PNG only)</p>
              <p className="text-[10px] text-slate-500">Full-page A4 Invoice / Prescription PNG background</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('receipt_80mm')}
            className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
              activeType === 'receipt_80mm'
                ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-xs font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-xs">2. Upload 80mm Thermal Template (PNG only)</p>
              <p className="text-[10px] text-slate-500">80mm POS Thermal Receipt roll PNG background</p>
            </div>
          </button>
        </div>
      </div>

      {/* Upload PNG Banner / Replace Options */}
      <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-600" />
              <span>
                {activeType === 'invoice_a4' ? 'A4 Invoice Background PNG' : '80mm Thermal Receipt Background PNG'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly accepts PNG image files. All patient & invoice details print on top automatically.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePngUploadClick}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto"
            >
              <Upload className="w-4 h-4" />
              <span>{config.backgroundImageUrl ? 'Replace PNG Image' : 'Upload PNG Image'}</span>
            </button>

            {config.backgroundImageUrl && (
              <button
                type="button"
                onClick={handleRemoveBackgroundPng}
                className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                title="Remove PNG Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {!config.backgroundImageUrl && (
          <div
            onClick={handlePngUploadClick}
            className="p-8 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl bg-purple-50/40 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <FileImage className="w-10 h-10 text-purple-600" />
            <p className="font-bold text-xs text-slate-900">
              Click here or drop your {activeType === 'invoice_a4' ? 'A4' : '80mm Thermal'} PNG design here
            </p>
            <p className="text-[11px] text-purple-700 font-semibold">Supports PNG format (.png only)</p>
          </div>
        )}
      </div>

      {/* Main Workspace: Interactive Canvas Preview + Field Overlay Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive Canvas Visual Stage */}
        <div className="lg:col-span-7 bg-slate-100 p-4 sm:p-6 rounded-[28px] border border-slate-200 flex flex-col items-center justify-start min-h-[600px] overflow-hidden">
          <div className="w-full flex flex-wrap items-center justify-between pb-3 gap-2 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Move className="w-4 h-4 text-purple-600" />
                <span>Visual Canvas Editor</span>
              </span>
              <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsMappingMode(true)}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    isMappingMode ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  🎯 Field Mapping Mode
                </button>
                <button
                  type="button"
                  onClick={() => setIsMappingMode(false)}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    !isMappingMode ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  👁️ Live Data Preview
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetFields}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Restore standard initial coordinates for all fields"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
              <span>Reset Field Positions</span>
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={canvasRef}
            className={`bg-white shadow-2xl relative select-none overflow-hidden transition-all border border-slate-300 ${
              activeType === 'receipt_80mm' ? 'w-[310px] min-h-[580px]' : 'w-[440px] h-[620px]'
            }`}
            style={{
              backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            {/* Watermark Overlay if present */}
            {config.watermarkImageUrl && (
              <div
                className="absolute inset-0 pointer-events-none opacity-15 bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: `url(${config.watermarkImageUrl})` }}
              />
            )}

            {/* Overlaid Canvas Elements */}
            {elements.map((el) => {
              if (el.hidden) return null;
              const isSelected = selectedElementId === el.id;

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el.id)}
                  className={`absolute cursor-move transition-all rounded px-1.5 py-0.5 ${
                    isSelected
                      ? 'ring-2 ring-purple-600 bg-purple-100/90 shadow-lg z-30'
                      : isMappingMode
                      ? 'border border-dashed border-purple-500 bg-purple-50/80 shadow-xs hover:bg-purple-100/80 z-20'
                      : 'hover:ring-1 hover:ring-purple-300 z-10'
                  }`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: el.width ? `${el.width}%` : 'auto',
                    fontSize: el.fontSize ? `${el.fontSize}px` : '12px',
                    fontFamily: el.fontFamily || config.fontFamily || 'sans-serif',
                    fontWeight: el.bold ? 'bold' : 'normal',
                    fontStyle: el.italic ? 'italic' : 'normal',
                    textDecoration: el.underline ? 'underline' : 'none',
                    color: el.color || '#000000',
                    textAlign: el.textAlign || 'left',
                  }}
                >
                  {isMappingMode ? (
                    <div className="flex items-center gap-1 font-bold text-[11px] text-purple-900 select-none">
                      <Move className="w-3 h-3 text-purple-700 shrink-0" />
                      <span>{getFieldTagName(el)}</span>
                    </div>
                  ) : el.type === 'table' ? (
                    <div className="border border-slate-300 bg-white/80 p-1 rounded text-[10px]">
                      <div className="font-bold flex justify-between border-b pb-0.5 mb-0.5">
                        <span>PROCEDURE</span>
                        <span>AMOUNT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dental Consultation</span>
                        <span>₹200.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Root Canal Treatment</span>
                        <span>₹4,500.00</span>
                      </div>
                    </div>
                  ) : el.type === 'barcode' ? (
                    <div className="bg-white/90 p-1 border border-slate-300 text-center text-[9px] font-mono font-bold">
                      ||||||||||||||||||||||||||||||||
                      <br />
                      RK-20260717-0001
                    </div>
                  ) : (
                    getElementPreviewText(el)
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Selected Field Formatting & Asset Management */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Selected Field Formatting Bar */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Type className="w-4 h-4 text-purple-600" />
                <span>Field Styling & Formatting</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFields}
                  className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  title="Reset positions to default layout"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  <span>Reset Fields</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomText}
                  className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Text</span>
                </button>
              </div>
            </div>

            {selectedElement ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Editing Field Label / Text</label>
                  <input
                    type="text"
                    value={selectedElement.content || selectedElement.labelOverride || selectedElement.fieldKey || ''}
                    onChange={(e) => updateSelectedElement({ content: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Font Family</label>
                    <select
                      value={selectedElement.fontFamily || 'Inter'}
                      onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs outline-none focus:border-purple-600"
                    >
                      <option value="Courier Prime">Courier Prime (Thermal)</option>
                      <option value="Inter">Inter Clean</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Playfair Display">Playfair Serif</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Arial">Arial Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Font Size (px)</label>
                    <input
                      type="number"
                      min="8"
                      max="48"
                      value={selectedElement.fontSize || 12}
                      onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value, 10) || 12 })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Typography Toggles & Alignment */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ bold: !selectedElement.bold })}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.bold ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ italic: !selectedElement.italic })}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.italic ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ underline: !selectedElement.underline })}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.underline ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Underline"
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'left' })}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textAlign === 'left' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'center' })}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textAlign === 'center' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedElement({ textAlign: 'right' })}
                      className={`p-1.5 rounded-lg cursor-pointer ${
                        selectedElement.textAlign === 'right' ? 'bg-purple-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="font-bold text-slate-600 text-[10px]">Color:</label>
                    <input
                      type="color"
                      value={selectedElement.color || '#000000'}
                      onChange={(e) => updateSelectedElement({ color: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Position Numeric Controls */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <div>
                    <label className="font-bold text-slate-600 text-[10px] block mb-0.5">X Position (%)</label>
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateSelectedElement({ x: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 text-[10px] block mb-0.5">Y Position (%)</label>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateSelectedElement({ y: parseFloat(e.target.value) || 0 })}
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {selectedElement.id.startsWith('el_custom_') && (
                  <button
                    type="button"
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Custom Text</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Click any field box on the canvas to adjust its font size, family, color, or coordinates.
              </p>
            )}
          </div>

          {/* 2. Clinic Branding Assets (Logo, Signature, Stamp, Watermark, QR) */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-purple-600" />
              <span>Branding Assets & Image Uploads</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleAssetUploadClick('logoUrl')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span className="truncate">Clinic Logo</span>
                <Upload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAssetUploadClick('signatureImageUrl')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span className="truncate">Doctor Signature</span>
                <Upload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAssetUploadClick('stampImageUrl')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span className="truncate">Clinic Stamp</span>
                <Upload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => handleAssetUploadClick('watermarkImageUrl')}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-between gap-1 transition-colors cursor-pointer"
              >
                <span className="truncate">Watermark PNG</span>
                <Upload className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              </button>
            </div>
          </div>

          {/* 3. Fields Show/Hide Manager Checklist */}
          <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <span>Field Mapping Checklist</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-semibold">Hide fields in artwork</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {elements.map((el) => {
                const label = getFieldTagName(el);
                return (
                  <div
                    key={el.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                      selectedElementId === el.id ? 'bg-purple-50 border-purple-400 font-bold' : 'bg-slate-50 border-slate-200'
                    }`}
                    onClick={() => setSelectedElementId(el.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${el.hidden ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                      <span className={`truncate text-slate-800 ${el.hidden ? 'line-through text-slate-400' : ''}`}>
                        {label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {el.hidden ? 'Hidden' : `(${Math.round(el.x)}%, ${Math.round(el.y)}%)`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleElementVisibility(el.id);
                        }}
                        className="p-1 text-slate-600 hover:text-purple-700 cursor-pointer"
                        title={el.hidden ? 'Show Field' : 'Hide Field (if already on PNG artwork)'}
                      >
                        {el.hidden ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-purple-600" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

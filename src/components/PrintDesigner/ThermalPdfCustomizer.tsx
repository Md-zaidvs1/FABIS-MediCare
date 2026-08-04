import React, { useState, useEffect, useMemo } from 'react';
import { DoctorProfile, Invoice, Patient } from '../../types';
import {
  PrintTemplateConfig,
  getActiveTemplate,
  saveStoredTemplates,
  getStoredTemplates,
  setActiveTemplate,
} from './TemplateStorage';
import { generateInvoiceThermalJsPdf } from '../../utils/jsPdfInvoiceGenerator';
import {
  Printer,
  Save,
  RotateCcw,
  Sparkles,
  Download,
  Type,
  Maximize2,
  Sliders,
  CheckCircle2,
  Building,
  FileText,
  Barcode,
  Eye,
  Leaf,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface ThermalPdfCustomizerProps {
  doctor: DoctorProfile;
}

// Sample sample invoice for instant live preview
const SAMPLE_PREVIEW_INVOICE: Invoice = {
  id: 'RK-20260717-0001',
  patientId: 'P-1001',
  patientName: 'ZAID KHAN',
  date: new Date().toISOString().split('T')[0],
  status: 'Paid',
  items: [
    { id: '1', description: 'Dental Consultation', totalPrice: 200, quantity: 1, unitPrice: 200 },
    { id: '2', description: 'Surgical / Impacted Extraction', totalPrice: 2500, quantity: 1, unitPrice: 2500 },
    { id: '3', description: 'Single Tooth Extraction', totalPrice: 500, quantity: 1, unitPrice: 500 },
  ],
  subtotal: 3200,
  discountAmount: 200,
  taxAmount: 0,
  netTotal: 3000,
  paidAmount: 3000,
  balanceDue: 0,
  paymentMethod: 'Card',
  paymentHistory: [],
};

const SAMPLE_PATIENT: Patient = {
  id: 'P-1001',
  mrn: 'MRN-1001',
  name: 'ZAID KHAN',
  phone: '7418773765',
  gender: 'Male',
  age: 28,
  status: 'Active',
  medicalHistory: {
    systemicConditions: [],
    currentMedications: [],
    bleedingDisorder: false,
  },
  teethMap: {},
  treatmentPlans: [],
  prescriptions: [],
  invoices: [],
  appointments: [],
  followUps: [],
  media: [],
  createdAt: new Date().toISOString(),
};

export const ThermalPdfCustomizer: React.FC<ThermalPdfCustomizerProps> = ({ doctor }) => {
  const [config, setConfig] = useState<PrintTemplateConfig>(() => getActiveTemplate('receipt_80mm'));
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'spacing' | 'header' | 'content' | 'footer'>('spacing');

  // Load initial config
  useEffect(() => {
    const loaded = getActiveTemplate('receipt_80mm');
    setConfig(loaded);
  }, []);

  // Re-generate live thermal PDF whenever config changes
  useEffect(() => {
    try {
      const blob = generateInvoiceThermalJsPdf(
        SAMPLE_PREVIEW_INVOICE,
        doctor,
        SAMPLE_PATIENT,
        null,
        config
      );
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Error generating live thermal preview:', err);
    }
  }, [config, doctor]);

  // Save changes to localStorage
  const handleSave = () => {
    try {
      const allTemplates = getStoredTemplates();
      const updated = allTemplates.map((t) => {
        if (t.type === 'receipt_80mm' && (t.id === config.id || t.isDefault)) {
          return {
            ...t,
            ...config,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      });

      // If config.id wasn't in list, append it
      if (!updated.some((t) => t.id === config.id)) {
        updated.push({ ...config, updatedAt: new Date().toISOString() });
      }

      saveStoredTemplates(updated);
      setActiveTemplate(config.id, 'receipt_80mm');

      // Dispatch storage event so other components update immediately
      window.dispatchEvent(new Event('storage'));

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save thermal config:', err);
    }
  };

  // Reset to default match
  const handleReset = () => {
    const defaultConfig: PrintTemplateConfig = {
      id: 'receipt_80mm_classic',
      name: 'Classic 80mm Thermal Receipt',
      type: 'receipt_80mm',
      presetCategory: 'classic_receipt',
      isDefault: true,
      fontFamily: 'Helvetica',
      primaryColor: '#000000',
      accentColor: '#000000',
      textColor: '#000000',
      fontSize: 'medium',
      fontWeight: 'bold',
      marginMm: 4,
      headerHeightMm: 15,
      footerHeightMm: 15,
      showLogo: false,
      showClinicName: true,
      clinicNameOverride: doctor.clinicName || 'RK DENTAL CLINIC',
      showClinicAddress: true,
      clinicAddressOverride: doctor.clinicAddress || 'No.10/1 School street, near police station, Kalavai 632506',
      showClinicPhone: true,
      clinicPhoneOverride: doctor.clinicPhone || '+91 8883261285',
      showClinicEmail: false,
      showDoctorName: false,
      showQualification: false,
      showRegNumber: false,
      showTerms: false,
      termsText: '',
      showThankYou: true,
      thankYouMessage: 'THANK YOU FOR YOUR VISIT!',
      showFooter: true,
      footerText: 'Keep smiling.',
      showSignature: false,
      showQrCode: false,
      showBarcode: true,
      barcodeText: 'RK-20260717-0001',
      dividerStyle: 'dotted',
      showPaymentMode: true,
      paymentModeOverride: 'CARD',
      fontSizeScale: 'standard',
      lineSpacing: 'normal',
      paperSaverMode: false,
      paperWidthMm: 80,
    };

    setConfig(defaultConfig);
    setIsSaved(false);
  };

  // Quick Preset Handlers
  const applyPaperSaverPreset = () => {
    setConfig((prev) => ({
      ...prev,
      paperSaverMode: true,
      fontSizeScale: 'compact',
      lineSpacing: 'tight',
      marginMm: 2.5,
      dividerStyle: 'dotted',
    }));
  };

  const applyStandardPreset = () => {
    setConfig((prev) => ({
      ...prev,
      paperSaverMode: false,
      fontSizeScale: 'standard',
      lineSpacing: 'normal',
      marginMm: 4,
      dividerStyle: 'dotted',
    }));
  };

  // Download test PDF
  const handleDownloadTestPdf = () => {
    try {
      const blob = generateInvoiceThermalJsPdf(
        SAMPLE_PREVIEW_INVOICE,
        doctor,
        SAMPLE_PATIENT,
        null,
        config
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Thermal_Receipt_Test_${config.paperWidthMm || 80}mm.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download test PDF error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-theme-main flex items-center gap-2">
                <span>Thermal PDF & Print Customizer</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Exact Receipt Match
                </span>
              </h2>
              <p className="text-xs text-theme-secondary mt-0.5">
                Customize font size, line gapping, paper saver mode, roll width (80mm/58mm), and clinic details with real-time preview.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-xl border border-theme-border text-theme-secondary hover:text-theme-main hover:bg-theme-page text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTestPdf}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Test Download PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-purple-700 hover:bg-purple-800 text-white'
              }`}
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Customization</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-4 border-t border-theme-border flex flex-wrap items-center justify-between gap-3 bg-theme-page/50 p-3 rounded-xl">
          <div className="flex items-center gap-2 text-xs text-theme-secondary font-bold">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Quick Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyPaperSaverPreset}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                config.paperSaverMode
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-theme-card text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Paper Saver Mode (Save 35% Length)</span>
            </button>

            <button
              type="button"
              onClick={applyStandardPreset}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                !config.paperSaverMode && config.fontSizeScale === 'standard'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                  : 'bg-theme-card text-theme-secondary border-theme-border hover:bg-theme-page'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Standard Match (Classic 80mm)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save Alert Notice */}
      {isSaved && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Thermal PDF configuration updated successfully! All invoice printouts, thermal receipts, and downloads will now reflect these settings.</span>
        </div>
      )}

      {/* Main Grid: Controls Left (6 cols), Live PDF Right (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Settings & Form Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section Navigation Tabs */}
          <div className="flex border-b border-theme-border bg-theme-card p-1.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('spacing')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'spacing'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-theme-secondary hover:text-theme-main'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Text & Spacing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('header')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'header'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-theme-secondary hover:text-theme-main'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Clinic Header</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-theme-secondary hover:text-theme-main'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Content & Items</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'footer'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-theme-secondary hover:text-theme-main'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Footer & Barcode</span>
            </button>
          </div>

          {/* TAB 1: Font Size, Line Spacing & Paper Saver */}
          {activeTab === 'spacing' && (
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-5 shadow-sm">
              <h3 className="text-sm font-extrabold text-theme-main flex items-center gap-2 border-b border-theme-border pb-3">
                <Type className="w-4 h-4 text-purple-600" />
                <span>Font Text Size & Line Spacing Settings</span>
              </h3>

              {/* Font Text Size Scale */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-theme-main block">
                  Font Text Size:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'compact', label: 'Compact', size: '7.5 pt' },
                    { id: 'standard', label: 'Standard', size: '8.0 pt' },
                    { id: 'large', label: 'Large', size: '9.0 pt' },
                    { id: 'xlarge', label: 'X-Large', size: '10.0 pt' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          fontSizeScale: item.id as any,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        (config.fontSizeScale || 'standard') === item.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20'
                          : 'border-theme-border bg-theme-page hover:bg-theme-card text-theme-main'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{item.label}</div>
                      <div className="text-[10px] text-theme-secondary mt-0.5">{item.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Line Spacing / Gapping */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-theme-main block">
                  Line Spacing & Row Gapping:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'tight', label: 'Tight Gap', desc: 'Minimal spacing' },
                    { id: 'normal', label: 'Normal Gap', desc: 'Balanced spacing' },
                    { id: 'relaxed', label: 'Relaxed', desc: 'Spacious lines' },
                    { id: 'spacious', label: 'Spacious', desc: 'Extra clear gap' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          lineSpacing: item.id as any,
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        (config.lineSpacing || 'normal') === item.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-600/20'
                          : 'border-theme-border bg-theme-page hover:bg-theme-card text-theme-main'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{item.label}</div>
                      <div className="text-[10px] text-theme-secondary mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper Saver Mode Toggle */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                      Paper Saver Mode (Eco-Friendly)
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                      Saves ~35% Roll Length
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    Reduces row padding, trims barcode height, and tightens margins to conserve thermal paper rolls.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={config.paperSaverMode || false}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        paperSaverMode: e.target.checked,
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Paper Roll Width & Margins */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-theme-main block">
                    Paper Roll Width:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, paperWidthMm: 80 }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        (config.paperWidthMm || 80) === 80
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'bg-theme-page text-theme-main border-theme-border hover:bg-theme-card'
                      }`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>80mm (Standard)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, paperWidthMm: 58 }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        config.paperWidthMm === 58
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'bg-theme-page text-theme-main border-theme-border hover:bg-theme-card'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>58mm (Handheld)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-theme-main block">
                    Print Margin: <span className="text-purple-600 font-extrabold">{config.marginMm || 4} mm</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={config.marginMm || 4}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        marginMm: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-theme-secondary font-bold">
                    <span>1 mm (Tight)</span>
                    <span>4 mm (Standard)</span>
                    <span>8 mm (Wide)</span>
                  </div>
                </div>
              </div>

              {/* Divider Line Style */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-theme-main block">
                  Divider Separator Style:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'dotted', label: 'Dotted (-----)' },
                    { id: 'solid', label: 'Solid (─────)' },
                    { id: 'dashed', label: 'Dashed (– – –)' },
                    { id: 'double', label: 'Double (═════)' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          dividerStyle: style.id as any,
                        }))
                      }
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        (config.dividerStyle || 'dotted') === style.id
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200'
                          : 'border-theme-border bg-theme-page text-theme-main hover:bg-theme-card'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Header & Clinic Details */}
          {activeTab === 'header' && (
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-theme-main flex items-center gap-2 border-b border-theme-border pb-3">
                <Building className="w-4 h-4 text-purple-600" />
                <span>Clinic Header & Branding Details</span>
              </h3>

              {/* Clinic Name */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-theme-main">
                    Clinic Name Header:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showClinicName !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showClinicName: e.target.checked,
                        }))
                      }
                      className="rounded accent-purple-600"
                    />
                    <span>Show on Receipt</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.clinicNameOverride || doctor.clinicName || 'RK DENTAL CLINIC'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      clinicNameOverride: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-extrabold bg-theme-card border border-theme-border rounded-lg text-theme-main focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. RK DENTAL CLINIC"
                />
              </div>

              {/* Clinic Address */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-theme-main">
                    Clinic Address:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showClinicAddress !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showClinicAddress: e.target.checked,
                        }))
                      }
                      className="rounded accent-purple-600"
                    />
                    <span>Show Address</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={
                    config.clinicAddressOverride ||
                    doctor.clinicAddress ||
                    'No.10/1 School street, near police station, Kalavai 632506'
                  }
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      clinicAddressOverride: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-theme-card border border-theme-border rounded-lg text-theme-main focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Clinic Address"
                />
              </div>

              {/* Phone Number */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-theme-main">
                    Clinic Phone Number:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showClinicPhone !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showClinicPhone: e.target.checked,
                        }))
                      }
                      className="rounded accent-purple-600"
                    />
                    <span>Show Phone</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.clinicPhoneOverride || doctor.clinicPhone || '+91 8883261285'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      clinicPhoneOverride: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-theme-card border border-theme-border rounded-lg text-theme-main focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. +91 8883261285"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Content & Items */}
          {activeTab === 'content' && (
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-theme-main flex items-center gap-2 border-b border-theme-border pb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>Receipt Content & Section Controls</span>
              </h3>

              {/* Payment Mode Box */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-theme-main">
                    Payment Mode Box:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showPaymentMode !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showPaymentMode: e.target.checked,
                        }))
                      }
                      className="rounded accent-purple-600"
                    />
                    <span>Show Payment Box</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {['CARD', 'CASH', 'UPI', 'NETBANKING'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          paymentModeOverride: mode,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                        (config.paymentModeOverride || 'CARD') === mode
                          ? 'bg-purple-700 text-white border-purple-700'
                          : 'bg-theme-card text-theme-secondary border-theme-border hover:bg-theme-page'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show barcode toggle */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border flex items-center justify-between">
                <div>
                  <div className="text-xs font-extrabold text-theme-main">Show Invoice Barcode</div>
                  <div className="text-[11px] text-theme-secondary">Prints scan code at the bottom of the thermal receipt.</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.showBarcode !== false}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      showBarcode: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Footer & Messages */}
          {activeTab === 'footer' && (
            <div className="bg-theme-card border border-theme-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-theme-main flex items-center gap-2 border-b border-theme-border pb-3">
                <Barcode className="w-4 h-4 text-purple-600" />
                <span>Footer Notes & Barcode Settings</span>
              </h3>

              {/* Thank You Message */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-theme-main">
                    Thank You Message:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showThankYou !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showThankYou: e.target.checked,
                        }))
                      }
                      className="rounded accent-purple-600"
                    />
                    <span>Show Thank You</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.thankYouMessage || 'THANK YOU FOR YOUR VISIT!'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      thankYouMessage: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs font-bold bg-theme-card border border-theme-border rounded-lg text-theme-main focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. THANK YOU FOR YOUR VISIT!"
                />
              </div>

              {/* Footer Note */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-theme-main">
                    Footer Note / Slogan:
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-theme-secondary font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showFooter !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          showFooter: e.target.checked,
                        }))
                      }
                      className="rounded accent-purple-600"
                    />
                    <span>Show Footer Note</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.footerText || 'Keep smiling.'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      footerText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-theme-card border border-theme-border rounded-lg text-theme-main focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. Keep smiling."
                />
              </div>

              {/* Barcode Text Override */}
              <div className="p-3.5 bg-theme-page rounded-xl border border-theme-border space-y-2">
                <label className="text-xs font-extrabold text-theme-main block">
                  Barcode Text Override / Prefix:
                </label>
                <input
                  type="text"
                  value={config.barcodeText || 'RK-20260717-0001'}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      barcodeText: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-xs bg-theme-card border border-theme-border rounded-lg text-theme-main focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g. RK-20260717-0001"
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Live Interactive Thermal PDF Preview */}
        <div className="lg:col-span-5 sticky top-6">
          <div className="bg-theme-card border border-theme-border rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-extrabold text-theme-main uppercase tracking-wider">
                  Live Thermal PDF Preview ({config.paperWidthMm || 80}mm)
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 uppercase">
                  {config.fontSizeScale || 'standard'} font
                </span>
                {config.paperSaverMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                    Eco Paper Saver
                  </span>
                )}
              </div>
            </div>

            {/* Live iframe render */}
            <div className="bg-gray-200 dark:bg-gray-900 rounded-xl p-3 flex justify-center items-center min-h-[460px] max-h-[600px] overflow-y-auto">
              {pdfBlobUrl ? (
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0&view=FitH`}
                  title="Thermal PDF Live Preview"
                  className="w-full h-[520px] rounded border border-gray-300 dark:border-gray-700 bg-white shadow-lg"
                />
              ) : (
                <div className="text-center py-12 text-theme-secondary text-xs">
                  Generating live receipt preview...
                </div>
              )}
            </div>

            <div className="text-center pt-1">
              <p className="text-[11px] text-theme-secondary font-medium">
                This exact PDF is sent directly to your thermal receipt printer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

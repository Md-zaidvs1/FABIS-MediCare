// FABIS MediCare - Print & PDF Workflow Modal Component

import React, { useState, useEffect } from 'react';
import {
  PrintTemplateConfig,
  getStoredTemplates,
  getActiveTemplate,
  getDefaultWhatsappFormat,
  setDefaultWhatsappFormat,
  setActiveTemplate,
} from './TemplateStorage';
import { DoctorProfile, Patient, Invoice, Prescription } from '../../types';
import { shareInvoicePdf, sharePrescriptionPdf, printPdfBlob } from '../../utils/pdfShare';
import { generateInvoiceJsPdf, generateInvoiceThermalJsPdf } from '../../utils/jsPdfInvoiceGenerator';
import { generatePrescriptionJsPdf } from '../../utils/jsPdfPrescriptionGenerator';
import {
  Printer,
  FileText,
  Receipt,
  MessageSquare,
  X,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface PrintWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  patient?: Patient | null;
  invoice?: Invoice | null;
  prescription?: Prescription | null;
}

export const PrintWorkflowModal: React.FC<PrintWorkflowModalProps> = ({
  isOpen,
  onClose,
  doctor,
  patient,
  invoice,
  prescription,
}) => {
  const [a4Templates, setA4Templates] = useState<PrintTemplateConfig[]>([]);
  const [thermalTemplates, setThermalTemplates] = useState<PrintTemplateConfig[]>([]);

  const [selectedA4Id, setSelectedA4Id] = useState<string>('');
  const [selectedThermalId, setSelectedThermalId] = useState<string>('');
  const [whatsappFormat, setWhatsappFormat] = useState<'a4' | 'thermal'>('a4');

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const all = getStoredTemplates();
      const a4s = all.filter((t) => t.type === 'invoice_a4' || t.type === 'prescription_a4');
      const thermals = all.filter((t) => t.type === 'receipt_80mm');

      setA4Templates(a4s);
      setThermalTemplates(thermals);

      const activeA4 = getActiveTemplate(prescription ? 'prescription_a4' : 'invoice_a4');
      const activeThermal = getActiveTemplate('receipt_80mm');

      setSelectedA4Id(activeA4.id);
      setSelectedThermalId(activeThermal.id);
      setWhatsappFormat(getDefaultWhatsappFormat());
      setStatusMessage(null);
    }
  }, [isOpen, prescription]);

  if (!isOpen) return null;

  const handleSelectA4 = (id: string) => {
    setSelectedA4Id(id);
    setActiveTemplate(id, prescription ? 'prescription_a4' : 'invoice_a4');
  };

  const handleSelectThermal = (id: string) => {
    setSelectedThermalId(id);
    setActiveTemplate(id, 'receipt_80mm');
  };

  const handleSelectWhatsappFormat = (format: 'a4' | 'thermal') => {
    setWhatsappFormat(format);
    setDefaultWhatsappFormat(format);
  };

  // Print A4 Action
  const handlePrintA4 = () => {
    setStatusMessage('Preparing A4 PDF for printing...');
    setTimeout(() => {
      if (prescription) {
        const pdfBlob = generatePrescriptionJsPdf(prescription, doctor, patient);
        printPdfBlob(pdfBlob);
      } else if (invoice) {
        const pdfBlob = generateInvoiceJsPdf(invoice, doctor, patient);
        printPdfBlob(pdfBlob);
      } else {
        window.print();
      }
      setStatusMessage(null);
    }, 300);
  };

  // Print Thermal Action
  const handlePrintThermal = () => {
    setStatusMessage('Preparing 80mm POS Thermal Receipt...');
    setTimeout(() => {
      if (invoice) {
        const pdfBlob = generateInvoiceThermalJsPdf(invoice, doctor, patient);
        printPdfBlob(pdfBlob);
      } else {
        window.print();
      }
      setStatusMessage(null);
    }, 300);
  };

  // Send WhatsApp Action (Zero extra confirmation)
  const handleSendWhatsapp = async () => {
    setStatusMessage('Generating PDF & initiating WhatsApp transmission...');
    try {
      if (prescription) {
        await sharePrescriptionPdf({
          rx: prescription,
          doctor,
          patient,
        });
      } else if (invoice) {
        await shareInvoicePdf({
          invoice,
          doctor,
          patient,
          format: whatsappFormat,
        });
      }
      setStatusMessage('WhatsApp transmission initiated successfully!');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error sending via WhatsApp:', err);
      setStatusMessage('Error generating WhatsApp PDF');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-[28px] w-full max-w-lg p-6 shadow-2xl text-slate-800 space-y-5 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-purple-700 font-extrabold text-base">
            <Printer className="w-5 h-5 text-purple-600" />
            <span>Print & WhatsApp Workflow</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Feedback Banner */}
        {statusMessage && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-xs font-bold text-purple-900 flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Workflow Configuration Form */}
        <div className="space-y-4 text-xs">
          {/* 1. A4 Template Selector */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>A4 Template</span>
            </label>
            <select
              value={selectedA4Id}
              onChange={(e) => handleSelectA4(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs outline-none focus:border-purple-600"
            >
              {a4Templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Thermal Template Selector */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
            <label className="font-extrabold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>Thermal Template (80mm POS)</span>
            </label>
            <select
              value={selectedThermalId}
              onChange={(e) => handleSelectThermal(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-xs outline-none focus:border-purple-600"
            >
              {thermalTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. WhatsApp Template Selector */}
          <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
            <label className="font-extrabold text-emerald-950 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Template Preference</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectWhatsappFormat('a4')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  whatsappFormat === 'a4'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>A4 Format</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectWhatsappFormat('thermal')}
                className={`p-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  whatsappFormat === 'thermal'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>80mm POS Format</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePrintA4}
            className="px-3 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-200" />
            <span>Print A4</span>
          </button>

          <button
            type="button"
            onClick={handlePrintThermal}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Print Thermal</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsapp}
            className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-200" />
            <span>Send WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer"
          >
            <span>Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

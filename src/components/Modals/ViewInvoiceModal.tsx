import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, DoctorProfile, Patient, Prescription } from '../../types';
import { formatCurrency, formatDate, formatPatientId } from '../../utils/formatters';
import { 
  shareInvoicePdf, 
  sharePrescriptionPdf, 
  printPdfBlob, 
  generateInvoiceThermalJsPdf, 
  generateInvoiceJsPdf,
  generatePrescriptionJsPdf 
} from '../../utils/pdfShare';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { 
  CheckCircle2, 
  Printer, 
  FileText, 
  Download, 
  Share2, 
  Receipt, 
  Pill, 
  Eye, 
  X, 
  Smartphone,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  patient?: Patient;
  invoice: Invoice | null;
}

type ActivePreview = 'a4_invoice' | 'thermal_invoice' | 'a4_prescription' | null;

export const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  doctor,
  patient,
  invoice,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredCustomClinicLogo());
  const [activePreview, setActivePreview] = useState<ActivePreview>('a4_invoice');

  useEffect(() => {
    if (isOpen) {
      setCustomLogo(getStoredCustomClinicLogo());
      setActivePreview('a4_invoice');
    }
  }, [isOpen]);

  // Find latest prescription for this patient (if any)
  const latestPrescription: Prescription | null = useMemo(() => {
    if (!patient?.prescriptions || patient.prescriptions.length === 0) return null;
    // Return the newest prescription
    return patient.prescriptions[0];
  }, [patient]);

  // Generate live A4 Invoice PDF Blob
  const a4InvoicePdfBlob = useMemo(() => {
    if (!isOpen || !invoice) return null;
    return generateInvoiceJsPdf(invoice, doctor, patient, customLogo);
  }, [isOpen, invoice, doctor, patient, customLogo]);

  // Generate live 80mm Thermal Invoice PDF Blob
  const thermalInvoicePdfBlob = useMemo(() => {
    if (!isOpen || !invoice) return null;
    return generateInvoiceThermalJsPdf(invoice, doctor, patient, customLogo);
  }, [isOpen, invoice, doctor, patient, customLogo]);

  // Generate live A4 Prescription PDF Blob
  const a4PrescriptionPdfBlob = useMemo(() => {
    if (!isOpen || !latestPrescription) return null;
    return generatePrescriptionJsPdf(latestPrescription, doctor, patient, customLogo);
  }, [isOpen, latestPrescription, doctor, patient, customLogo]);

  if (!isOpen || !invoice) return null;

  const patientName = patient?.name || invoice.patientName || 'Patient';
  const patientRk = formatPatientId(patient || invoice.patientId);

  // ----------------------------------------------------
  // PRESCRIPTION ACTIONS
  // ----------------------------------------------------
  const handlePrintA4Prescription = () => {
    if (a4PrescriptionPdfBlob) {
      printPdfBlob(a4PrescriptionPdfBlob);
    }
  };

  const handleDownloadA4Prescription = () => {
    if (!a4PrescriptionPdfBlob || !latestPrescription) return;
    const url = URL.createObjectURL(a4PrescriptionPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prescription_${latestPrescription.id}_${patientName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareA4Prescription = async () => {
    if (!latestPrescription) return;
    await sharePrescriptionPdf({
      rx: latestPrescription,
      doctor,
      patient,
      customLogo,
      format: 'a4',
    });
  };

  const handleWhatsAppPrescription = async () => {
    if (!latestPrescription) return;
    await sharePrescriptionPdf({
      rx: latestPrescription,
      doctor,
      patient,
      customLogo,
      format: 'a4',
    });
  };

  // ----------------------------------------------------
  // INVOICE / BILL ACTIONS
  // ----------------------------------------------------
  const handlePrintA4Invoice = () => {
    if (a4InvoicePdfBlob) printPdfBlob(a4InvoicePdfBlob);
  };

  const handlePrintThermalInvoice = () => {
    if (thermalInvoicePdfBlob) printPdfBlob(thermalInvoicePdfBlob);
  };

  const handleDownloadA4Invoice = () => {
    if (!a4InvoicePdfBlob || !invoice) return;
    const url = URL.createObjectURL(a4InvoicePdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.id}_${patientName.replace(/\s+/g, '_')}_A4.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleWhatsAppA4Invoice = async () => {
    await shareInvoicePdf({
      invoice,
      doctor,
      patient,
      customLogo,
      format: 'a4',
    });
  };

  const handleWhatsAppThermalInvoice = async () => {
    await shareInvoicePdf({
      invoice,
      doctor,
      patient,
      customLogo,
      format: 'thermal',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-full max-w-4xl p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.18)] text-[#1E293B] max-h-[94vh] flex flex-col justify-between my-auto">
        
        {/* Top Header: Treatment Completed */}
        <div className="flex items-center justify-between border-b border-[#E8ECF3] pb-3.5 gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Treatment Completed
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                  Session Finalized
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Patient: <span className="font-bold text-slate-800">{patientName}</span> ({patientRk}) • Date: {formatDate(invoice.date)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Action Cards: TWO CLEARLY SEPARATED SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 shrink-0">
          
          {/* ==================================================== */}
          {/* SECTION 1: PRESCRIPTION */}
          {/* ==================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/60 border border-sky-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-sky-200/80">
                <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
                  <Pill className="w-4 h-4 text-sky-600" />
                  <span>PRESCRIPTION</span>
                </div>
                {latestPrescription ? (
                  <span className="text-[11px] font-bold text-sky-700 font-mono">
                    #{latestPrescription.id}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    No Rx on File
                  </span>
                )}
              </div>

              {latestPrescription ? (
                <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Diagnosis:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]" title={latestPrescription.diagnosis}>
                      {latestPrescription.diagnosis || 'Dental Examination'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Medicines Prescribed:</span>
                    <span className="font-bold text-sky-700">{latestPrescription.medicines?.length || 0} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span>{formatDate(latestPrescription.date)}</span>
                  </div>
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">
                  No medical prescription was issued during this appointment.
                </p>
              )}
            </div>

            {/* Prescription Action Buttons */}
            {latestPrescription ? (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-sky-200/80">
                <button
                  type="button"
                  onClick={() => setActivePreview('a4_prescription')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activePreview === 'a4_prescription'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-sky-800 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview A4 Rx</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintA4Prescription}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Print / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareA4Prescription}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share A4</span>
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppPrescription}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-slate-400 font-medium">
                Prescription tools unavailable (no Rx)
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* SECTION 2: BILL / INVOICE */}
          {/* ==================================================== */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200/80">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-sm">
                  <Receipt className="w-4 h-4 text-indigo-600" />
                  <span>BILL / INVOICE</span>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 font-mono">
                  #{invoice.id}
                </span>
              </div>

              <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Net Total:</span>
                  <span className="font-extrabold text-indigo-900">{formatCurrency(invoice.netTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode / Status:</span>
                  <span className="font-bold text-slate-800">{invoice.paymentMethod || 'Cash'} • {invoice.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Procedures:</span>
                  <span>{invoice.items?.length || 0} items listed</span>
                </div>
              </div>
            </div>

            {/* Invoice Action Buttons Grid */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-indigo-200/80">
              <button
                type="button"
                onClick={() => setActivePreview('a4_invoice')}
                className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activePreview === 'a4_invoice'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview A4</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePreview('thermal_invoice')}
                className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activePreview === 'thermal_invoice'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Printer className="w-3 h-3" />
                <span>Preview 80mm</span>
              </button>

              <button
                type="button"
                onClick={handlePrintA4Invoice}
                className="px-2 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Printer className="w-3 h-3 text-sky-400" />
                <span>Print A4</span>
              </button>

              <button
                type="button"
                onClick={handlePrintThermalInvoice}
                className="px-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Printer className="w-3 h-3 text-white" />
                <span>Print 80mm</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppA4Invoice}
                className="px-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Smartphone className="w-3 h-3" />
                <span>WA (A4)</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppThermalInvoice}
                className="px-2 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
              >
                <Smartphone className="w-3 h-3" />
                <span>WA (80mm)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Document Preview Display Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[460px] bg-slate-100/90 rounded-2xl border border-slate-200 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              <Eye className="w-4 h-4 text-sky-600" />
              <span>
                Document Preview:{' '}
                {activePreview === 'a4_invoice' && 'A4 Tax Invoice'}
                {activePreview === 'thermal_invoice' && '80mm POS Thermal Cash Receipt'}
                {activePreview === 'a4_prescription' && 'A4 Medical Prescription'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActivePreview('a4_invoice')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreview === 'a4_invoice' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                A4 Invoice
              </button>
              <button
                type="button"
                onClick={() => setActivePreview('thermal_invoice')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreview === 'thermal_invoice' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
                }`}
              >
                80mm Invoice
              </button>
              {latestPrescription && (
                <button
                  type="button"
                  onClick={() => setActivePreview('a4_prescription')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePreview === 'a4_prescription' ? 'bg-sky-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  A4 Prescription
                </button>
              )}
            </div>
          </div>

          {/* Actual Rendered Preview Content */}
          {activePreview === 'a4_invoice' && (
            <div className="bg-white text-slate-800 p-6 rounded-2xl space-y-5 border border-slate-200 shadow-sm max-w-2xl mx-auto text-xs">
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-sky-500">
                <div>
                  {customLogo && (
                    <img src={customLogo} alt="Clinic Logo" className="max-h-12 max-w-[160px] object-contain mb-1.5" />
                  )}
                  <h2 className="text-base font-extrabold text-sky-600 uppercase">
                    {doctor.clinicName}
                  </h2>
                  <p className="text-[11px] text-slate-500">{doctor.clinicAddress}</p>
                  <p className="text-[11px] text-slate-500">Ph: {doctor.clinicPhone}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-sky-100 text-sky-700 font-extrabold text-[10px] rounded-md uppercase tracking-wider mb-1">
                    TAX INVOICE
                  </span>
                  <h3 className="text-xs font-bold text-slate-800">Dr. {doctor.name}</h3>
                  <p className="text-[10px] text-slate-500">{doctor.qualifications}</p>
                  <p className="text-[10px] text-sky-600 font-mono font-bold">Reg #: {doctor.regNumber}</p>
                </div>
              </div>

              {/* Patient & Invoice Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <div className="font-extrabold text-sky-600 uppercase text-[10px] border-b border-slate-200 pb-1">
                    PATIENT DETAILS
                  </div>
                  <div><span className="text-slate-500">Name:</span> <span className="font-bold text-slate-800">{patientName}</span></div>
                  <div><span className="text-slate-500">Patient ID:</span> <span className="font-mono font-bold text-slate-700">{patientRk}</span></div>
                  <div><span className="text-slate-500">Phone:</span> <span>{patient?.phone || 'N/A'}</span></div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                  <div className="font-extrabold text-sky-600 uppercase text-[10px] border-b border-slate-200 pb-1">
                    INVOICE INFO
                  </div>
                  <div><span className="text-slate-500">Invoice No:</span> <span className="font-mono font-bold text-slate-800">#{invoice.id}</span></div>
                  <div><span className="text-slate-500">Date:</span> <span>{formatDate(invoice.date)}</span></div>
                  <div><span className="text-slate-500">Payment:</span> <span className="font-bold uppercase text-slate-700">{invoice.paymentMethod || 'UPI'}</span></div>
                </div>
              </div>

              {/* Treatments Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-600 text-white font-bold uppercase text-[10px]">
                    <th className="py-2 px-2.5 rounded-l-lg">#</th>
                    <th className="py-2 px-2.5">Treatment Procedure</th>
                    <th className="py-2 px-2.5 text-center">Qty</th>
                    <th className="py-2 px-2.5 text-right">Rate</th>
                    <th className="py-2 px-2.5 text-right rounded-r-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-2 px-2.5 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-2.5 font-bold text-slate-800">
                          {item.description}
                          {(item as any).toothNumber && (
                            <span className="ml-1 text-sky-600 font-mono text-[10px]">(Tooth #{(item as any).toothNumber})</span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-center text-slate-600">{item.quantity || 1}</td>
                        <td className="py-2 px-2.5 text-right text-slate-600">{formatCurrency(item.unitPrice || item.totalPrice)}</td>
                        <td className="py-2 px-2.5 text-right font-bold text-slate-800">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-slate-400">No procedures</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-1">
                <div className="w-56 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoice.subtotal || invoice.netTotal)}</span>
                  </div>
                  {!!invoice.discount && invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-purple-900 bg-purple-100 p-1.5 rounded-lg">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(invoice.netTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePreview === 'thermal_invoice' && (
            <div className="bg-white text-slate-900 p-4 rounded-2xl space-y-3 border-2 border-dashed border-amber-300 shadow-md max-w-[320px] mx-auto text-xs font-mono">
              <div className="text-center border-b border-dashed border-slate-300 pb-2 space-y-0.5">
                <h3 className="text-xs font-black uppercase text-slate-900">{doctor.clinicName}</h3>
                <p className="text-[9px] text-slate-600">{doctor.clinicAddress}</p>
                <div className="text-[10px] font-black tracking-widest text-amber-600 uppercase pt-1">*** CASH RECEIPT ***</div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="flex justify-between"><span className="text-slate-500">Invoice:</span> <span className="font-bold">#{invoice.id}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date:</span> <span>{formatDate(invoice.date)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Patient:</span> <span className="font-bold">{patientName}</span></div>
              </div>

              <div className="border-b border-dashed border-slate-300 pb-2 space-y-1 text-[10px]">
                {invoice.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.description}</span>
                    <span className="font-bold">{formatCurrency(it.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-black text-xs text-purple-900">
                  <span>NET TOTAL:</span>
                  <span>{formatCurrency(invoice.netTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Paid:</span>
                  <span>{formatCurrency(invoice.paidAmount || invoice.netTotal)}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-slate-400 pt-1 border-t border-dashed border-slate-300">
                *** THANK YOU FOR YOUR VISIT ***
              </div>
            </div>
          )}

          {activePreview === 'a4_prescription' && latestPrescription && (
            <div className="bg-white text-slate-800 p-6 rounded-2xl space-y-5 border border-slate-200 shadow-sm max-w-2xl mx-auto text-xs">
              {/* Prescription Header */}
              <div className="flex justify-between items-start pb-4 border-b-2 border-sky-500">
                <div>
                  {customLogo && (
                    <img src={customLogo} alt="Clinic Logo" className="max-h-12 max-w-[160px] object-contain mb-1.5" />
                  )}
                  <h2 className="text-base font-extrabold text-sky-600 uppercase">
                    {doctor.clinicName}
                  </h2>
                  <p className="text-[11px] text-slate-500">{doctor.clinicAddress}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-0.5 bg-sky-100 text-sky-700 font-extrabold text-[10px] rounded-md uppercase tracking-wider mb-1">
                    MEDICAL PRESCRIPTION
                  </span>
                  <h3 className="text-xs font-bold text-slate-800">Dr. {doctor.name}</h3>
                  <p className="text-[10px] text-slate-500">{doctor.qualifications}</p>
                </div>
              </div>

              {/* Patient Meta */}
              <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-200 grid grid-cols-3 gap-2 text-[11px]">
                <div><span className="text-slate-500">Patient:</span> <span className="font-bold text-slate-800">{patientName}</span></div>
                <div><span className="text-slate-500">Patient ID:</span> <span className="font-mono font-bold text-slate-700">{patientRk}</span></div>
                <div><span className="text-slate-500">Date:</span> <span>{formatDate(latestPrescription.date)}</span></div>
              </div>

              {/* Diagnosis */}
              {latestPrescription.diagnosis && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Diagnosis / Clinical Findings: </span>
                  <span className="text-slate-800">{latestPrescription.diagnosis}</span>
                </div>
              )}

              {/* Medicines Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-sky-600 text-white font-bold uppercase text-[10px]">
                    <th className="py-2 px-2.5 rounded-l-lg">#</th>
                    <th className="py-2 px-2.5">Medicine Name</th>
                    <th className="py-2 px-2.5">Dosage / Timing</th>
                    <th className="py-2 px-2.5">Duration</th>
                    <th className="py-2 px-2.5 rounded-r-lg">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {latestPrescription.medicines?.map((m, idx) => (
                    <tr key={m.id || idx}>
                      <td className="py-2 px-2.5 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-bold text-slate-800">{m.name}</td>
                      <td className="py-2 px-2.5 text-slate-600">{m.dosage || m.frequency}</td>
                      <td className="py-2 px-2.5 text-slate-600">{m.duration}</td>
                      <td className="py-2 px-2.5 text-slate-600">{m.instructions || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Advice / Special Instructions */}
              {(latestPrescription.specialInstructions || (latestPrescription as any).advice) && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span className="font-bold">Doctor's Advice: </span>
                  <span>{latestPrescription.specialInstructions || (latestPrescription as any).advice}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Close */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E8ECF3] shrink-0">
          <div className="text-xs text-slate-500">
            All documents generated directly from patient clinical records.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
};

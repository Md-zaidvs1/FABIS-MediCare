import React, { useState, useEffect, useMemo } from 'react';
import { Invoice, DoctorProfile, Patient } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { shareInvoicePdf, printPdfBlob, generateInvoiceThermalJsPdf } from '../../utils/pdfShare';
import { generateInvoiceJsPdf } from '../../utils/jsPdfInvoiceGenerator';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { Receipt, X, Printer, FileText, Download, Share2, Sparkles } from 'lucide-react';

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: DoctorProfile;
  patient?: Patient;
  invoice: Invoice | null;
}

export const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  doctor,
  patient,
  invoice,
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredCustomClinicLogo());
  const [previewFormat, setPreviewFormat] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    if (isOpen) {
      setCustomLogo(getStoredCustomClinicLogo());
    }
  }, [isOpen]);

  // Generate live A4 PDF Blob
  const a4PdfBlob = useMemo(() => {
    if (!isOpen || !invoice) return null;
    return generateInvoiceJsPdf(invoice, doctor, patient, customLogo);
  }, [isOpen, invoice, doctor, patient, customLogo]);

  // Generate live 80mm Thermal PDF Blob
  const thermalPdfBlob = useMemo(() => {
    if (!isOpen || !invoice) return null;
    return generateInvoiceThermalJsPdf(invoice, doctor, patient, customLogo);
  }, [isOpen, invoice, doctor, patient, customLogo]);

  if (!isOpen || !invoice) return null;

  // Print Handlers
  const handlePrintA4 = () => {
    if (a4PdfBlob) printPdfBlob(a4PdfBlob);
  };

  const handlePrintThermal = () => {
    if (thermalPdfBlob) printPdfBlob(thermalPdfBlob);
  };

  // Download Handlers
  const handleDownloadA4 = () => {
    if (!a4PdfBlob || !invoice) return;
    const url = URL.createObjectURL(a4PdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.id}_A4.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadThermal = () => {
    if (!thermalPdfBlob || !invoice) return;
    const url = URL.createObjectURL(thermalPdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.id}_80mm_Thermal.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share Handlers
  const handleShareA4WhatsApp = async () => {
    await shareInvoicePdf({
      invoice,
      doctor,
      patient,
      customLogo,
      format: 'a4',
    });
  };

  const handleShareThermalWhatsApp = async () => {
    await shareInvoicePdf({
      invoice,
      doctor,
      patient,
      customLogo,
      format: 'thermal',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-[96vw] sm:w-[92vw] max-w-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-[#1E293B] max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E8ECF3] pb-3 gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-[#3BA7F5] font-extrabold text-base">
            <Receipt className="w-5 h-5 text-[#3BA7F5]" />
            <span>Clinical Invoice #{invoice.id}</span>
          </div>

          {/* Format Selector Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewFormat('a4')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                previewFormat === 'a4'
                  ? 'bg-white text-sky-700 shadow-xs border border-sky-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Standard</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewFormat('thermal')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                previewFormat === 'thermal'
                  ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>80mm Thermal Receipt</span>
            </button>
          </div>

          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1E293B] hover:bg-slate-100 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Specific Actions Bar */}
        <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-100 my-2 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center gap-2 font-bold text-sky-900">
            <Sparkles className="w-4 h-4 text-[#3BA7F5]" />
            <span>
              Active Format: <span className="uppercase text-[#3BA7F5] font-black">{previewFormat === 'a4' ? 'A4 Full Page Invoice' : '80mm POS Thermal Receipt'}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previewFormat === 'thermal' ? (
              <>
                <button
                  type="button"
                  onClick={handlePrintThermal}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print 80mm Receipt
                </button>
                <button
                  type="button"
                  onClick={handleDownloadThermal}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" /> Download 80mm PDF
                </button>
                <button
                  type="button"
                  onClick={handleShareThermalWhatsApp}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>💬</span> Share 80mm via WhatsApp
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#3BA7F5]" /> Print A4 Invoice
                </button>
                <button
                  type="button"
                  onClick={handleDownloadA4}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-700" /> Download A4 PDF
                </button>
                <button
                  type="button"
                  onClick={handleShareA4WhatsApp}
                  className="px-3.5 py-2 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>💬</span> Share A4 via WhatsApp
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Direct HTML Preview Container */}
        <div className="flex-1 overflow-y-auto my-2 min-h-[380px] max-h-[520px] bg-slate-100/90 rounded-2xl border border-slate-200 p-3 sm:p-5">
          {previewFormat === 'a4' ? (
            /* Standard A4 Direct HTML Invoice View */
            <div className="bg-white text-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 border border-slate-200 shadow-sm max-w-3xl mx-auto text-xs sm:text-sm">
              {/* Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b-2 border-sky-500">
                <div>
                  {customLogo && (
                    <img src={customLogo} alt="Clinic Logo" className="max-h-16 max-w-[200px] object-contain mb-2" />
                  )}
                  <h1 className="text-lg sm:text-xl font-extrabold text-sky-600 uppercase tracking-tight">
                    {doctor.clinicName}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">{doctor.clinicAddress}</p>
                  <p className="text-xs text-slate-500">Ph: {doctor.clinicPhone} | {doctor.clinicEmail || 'contact@clinic.com'}</p>
                  {doctor.website && <p className="text-xs text-slate-500">Web: {doctor.website}</p>}
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 font-extrabold text-xs rounded-lg uppercase tracking-wider mb-2">
                    TAX INVOICE
                  </span>
                  <h2 className="text-sm font-bold text-slate-800">{doctor.name ? `Dr. ${doctor.name}` : doctor.name}</h2>
                  <p className="text-[11px] text-slate-500">{doctor.qualifications}</p>
                  <p className="text-[10px] text-sky-600 font-mono font-bold">Reg #: {doctor.regNumber}</p>
                  {doctor.gstin && <p className="text-[10px] text-slate-400 font-mono">GSTIN: {doctor.gstin}</p>}
                </div>
              </div>

              {/* Patient & Invoice Info Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bill To Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-extrabold text-sky-600 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200">
                    BILL TO
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Patient:</span>
                    <span className="font-bold text-slate-800">{invoice.patientName || patient?.name || 'Patient'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Patient ID:</span>
                    <span className="font-mono text-slate-700">{patient?.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Age / Gender:</span>
                    <span className="text-slate-700">{patient ? `${patient.age} Yrs / ${patient.gender}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Phone:</span>
                    <span className="text-slate-700">{patient?.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* Invoice Details Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-extrabold text-sky-600 uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-200">
                    INVOICE DETAILS
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Invoice No:</span>
                    <span className="font-mono font-bold text-slate-800">#{invoice.id}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Invoice Date:</span>
                    <span className="text-slate-700">{formatDate(invoice.date)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Payment Method:</span>
                    <span className="font-bold text-slate-700 uppercase">{invoice.paymentMethod || 'UPI'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-500">Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {invoice.status || 'PAID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Treatments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-sky-600 text-white font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3 rounded-l-lg whitespace-nowrap">#</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Treatment / Procedure</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap">Qty</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Rate</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="py-3 px-3 font-medium text-slate-500 whitespace-nowrap">{idx + 1}</td>
                          <td className="py-3 px-3 font-bold text-slate-800">
                            {item.description}
                            {(item as any).toothNumber && (
                              <span className="ml-1 text-sky-600 font-mono text-[10px]">
                                (Tooth #{(item as any).toothNumber})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">{item.quantity || 1}</td>
                          <td className="py-3 px-3 text-right text-slate-600 whitespace-nowrap">{formatCurrency(item.unitPrice || item.totalPrice)}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-800 whitespace-nowrap">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-400">No procedures recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(invoice.subtotal || invoice.netTotal)}</span>
                  </div>
                  {!!invoice.discount && invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  {!!invoice.tax && invoice.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / GST:</span>
                      <span className="font-semibold">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-purple-900 bg-purple-100 p-2 rounded-lg border border-purple-200">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(invoice.netTotal)}</span>
                  </div>
                  {!!invoice.paidAmount && (
                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Paid Amount:</span>
                      <span className="font-semibold">{formatCurrency(invoice.paidAmount)}</span>
                    </div>
                  )}
                  {!!invoice.balance && invoice.balance > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(invoice.balance)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-sky-600">Thank you for choosing {doctor.clinicName || 'RK Dental Clinic'}.</p>
                <p>This is a computer-generated invoice and does not require a physical signature.</p>
              </div>
            </div>
          ) : (
            /* 80mm POS Thermal Receipt Preview */
            <div className="bg-white text-slate-900 p-5 rounded-2xl space-y-4 border-2 border-dashed border-amber-300 shadow-md max-w-[340px] mx-auto text-xs font-mono">
              {/* Thermal Store Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                {customLogo && (
                  <img src={customLogo} alt="Clinic Logo" className="max-h-12 max-w-[140px] mx-auto object-contain mb-1" />
                )}
                <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
                  {doctor.clinicName || 'RK DENTAL CLINIC'}
                </h2>
                <p className="text-[10px] text-slate-600 leading-tight">{doctor.clinicAddress}</p>
                <p className="text-[10px] text-slate-600">Ph: {doctor.clinicPhone}</p>
                <div className="pt-1.5 text-[10px] font-black tracking-widest text-amber-600 uppercase">
                  *** CASH RECEIPT ***
                </div>
              </div>

              {/* Thermal Meta Info */}
              <div className="text-[11px] space-y-1 border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold">#{invoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span>{formatDate(invoice.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold">{invoice.patientName || patient?.name || 'Patient'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span>Dr. {doctor.name}</span>
                </div>
              </div>

              {/* Thermal Line Items Table */}
              <div className="border-b border-dashed border-slate-300 pb-3 space-y-2">
                <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500 border-b border-slate-200 pb-1">
                  <span>Item / Qty</span>
                  <span>Amount</span>
                </div>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <div key={item.id || idx} className="space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-800 text-[11px]">
                        <span>{item.description}</span>
                        <span>{formatCurrency(item.totalPrice)}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 flex justify-between">
                        <span>{item.quantity || 1} x {formatCurrency(item.unitPrice || item.totalPrice)}</span>
                        {(item as any).toothNumber && <span>Tooth #{ (item as any).toothNumber }</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-2 text-[10px]">No procedures</div>
                )}
              </div>

              {/* Thermal Totals */}
              <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal || invoice.netTotal)}</span>
                </div>
                {!!invoice.discount && invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                  <span>NET TOTAL:</span>
                  <span className="text-purple-900">{formatCurrency(invoice.netTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Paid ({invoice.paymentMethod || 'UPI'}):</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                {!!invoice.balance && invoice.balance > 0 && (
                  <div className="flex justify-between font-bold text-rose-600">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(invoice.balance)}</span>
                  </div>
                )}
              </div>

              {/* Thermal Footer */}
              <div className="text-center text-[10px] text-slate-500 pt-1 space-y-1">
                <p className="font-bold text-slate-800 uppercase tracking-wider">*** THANK YOU FOR YOUR VISIT! ***</p>
                <p className="text-[9px] text-slate-400">Keep smiling • Direct EMR POS Receipt</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8ECF3] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 min-h-[44px] rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] text-xs font-bold border border-[#E8ECF3] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Action Buttons for both formats */}
            <button
              type="button"
              onClick={handlePrintThermal}
              className="px-4 py-3 min-h-[44px] rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Print 80mm Thermal Receipt roll"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print 80mm Thermal</span>
            </button>

            <button
              type="button"
              onClick={handlePrintA4}
              className="px-4 py-3 min-h-[44px] rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Print standard A4 invoice page"
            >
              <Printer className="w-4 h-4 text-[#3BA7F5]" />
              <span>Print A4 Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleShareThermalWhatsApp}
              className="px-4 py-3 min-h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-colors cursor-pointer"
              title="Share 80mm Thermal Receipt via WhatsApp"
            >
              <span>💬</span>
              <span>WhatsApp (80mm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { Invoice, DoctorProfile, Patient } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { shareInvoicePdf } from '../../utils/pdfShare';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { Receipt, X, Printer, FileText } from 'lucide-react';

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
  const [printMode, setPrintMode] = useState<'A4' | 'Thermal80mm'>('A4');
  const invoicePreviewRef = useRef<HTMLDivElement>(null);
  const [customLogo, setCustomLogo] = useState<string | null>(getStoredCustomClinicLogo());

  useEffect(() => {
    if (isOpen) {
      setCustomLogo(getStoredCustomClinicLogo());
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handleShareA4WhatsApp = async () => {
    setPrintMode('A4');
    await shareInvoicePdf({
      invoice,
      doctor,
      patient,
      customLogo,
      format: 'a4',
    });
  };

  const handleShareThermalWhatsApp = async () => {
    setPrintMode('Thermal80mm');
    await shareInvoicePdf({
      invoice,
      doctor,
      patient,
      customLogo,
      format: 'thermal',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E8ECF3] rounded-[28px] w-[94vw] sm:w-[90vw] md:w-[90vw] max-w-xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-[#1E293B] max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#E8ECF3] pb-4 gap-2 shrink-0">
          <div className="flex items-center gap-2 text-[#3BA7F5] font-extrabold text-base">
            <Receipt className="w-5 h-5 text-[#3BA7F5]" />
            <span>Clinical Receipt #{invoice.id}</span>
          </div>

          {/* Format Selector */}
          <div className="flex bg-[#F1F5F9] p-1 rounded-2xl border border-[#E8ECF3] text-xs">
            <button
              onClick={() => setPrintMode('A4')}
              className={`px-3 py-2 min-h-[44px] rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                printMode === 'A4'
                  ? 'bg-white text-[#1E293B] shadow-xs border border-[#E8ECF3]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#3BA7F5]" />
              <span>A4 Invoice</span>
            </button>
            <button
              onClick={() => setPrintMode('Thermal80mm')}
              className={`px-3 py-2 min-h-[44px] rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                printMode === 'Thermal80mm'
                  ? 'bg-white text-[#1E293B] shadow-xs border border-[#E8ECF3]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>80mm POS</span>
            </button>
          </div>

          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1E293B] hover:bg-slate-100 rounded-full transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="flex-1 overflow-y-auto my-3 pr-1">
          {printMode === 'A4' ? (
            /* Premium A4 Clinical Letterhead Invoice Format */
            <div ref={invoicePreviewRef} className="bg-white text-slate-800 p-6 sm:p-8 rounded-2xl space-y-6 text-xs border border-slate-200 shadow-xs font-sans max-w-2xl mx-auto">
              {/* Premium Header */}
              <div className="border-b-2 border-slate-300 pb-5 flex flex-wrap justify-between items-start gap-4">
                {/* Left: Clinic Details */}
                <div className="space-y-1 max-w-sm">
                  {customLogo && (
                    <img
                      src={customLogo}
                      alt="Clinic Logo"
                      className="max-h-16 max-w-[220px] object-contain mb-2"
                    />
                  )}
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight leading-tight">
                    {doctor.clinicName}
                  </h1>
                  <p className="text-xs text-slate-600 leading-relaxed">{doctor.clinicAddress}</p>
                  <p className="text-xs text-slate-600 font-medium">
                    Ph: {doctor.clinicPhone} {doctor.clinicEmail ? `| ${doctor.clinicEmail}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    GST / Reg #: {doctor.regNumber || '36ABCDE1234F1Z5'}
                  </p>
                </div>

                {/* Right: Invoice Info & Payment Status */}
                <div className="text-right space-y-2">
                  <h2 className="text-lg sm:text-xl font-bold tracking-wider text-slate-800 uppercase">
                    TAX INVOICE
                  </h2>
                  <div className="space-y-0.5 text-xs text-slate-700">
                    <p className="font-mono font-bold text-slate-900 text-sm">
                      Invoice No: <span className="text-slate-800">{invoice.id}</span>
                    </p>
                    <p className="text-slate-600">Date: {formatDate(invoice.date)}</p>
                  </div>
                  <div className="pt-1">
                    {invoice.balanceDue <= 0 || invoice.status === 'Paid' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs border border-emerald-300">
                        ✓ PAID IN FULL
                      </span>
                    ) : invoice.status === 'Partial' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-xs border border-amber-300">
                        PARTIALLY PAID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 text-rose-700 font-bold rounded-full text-xs border border-rose-300">
                        UNPAID
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Information Card */}
              <div className="bg-slate-50/80 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                  PATIENT DETAILS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-slate-700">
                  <div>
                    <span className="text-slate-500">Patient Name:</span>{' '}
                    <span className="font-bold text-slate-900 text-sm">{invoice.patientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">MRN:</span>{' '}
                    <span className="font-mono font-bold text-slate-900">{patient?.mrn || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Age / Gender:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {patient ? `${patient.age} Yrs / ${patient.gender}` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Mobile:</span>{' '}
                    <span className="font-semibold text-slate-800">{patient?.phone || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Attending Dentist:</span>{' '}
                    <span className="font-bold text-slate-900">Dr. {doctor.name}</span>{' '}
                    <span className="text-[11px] text-slate-500">({doctor.qualifications})</span>
                  </div>
                  {(patient?.streetAddress || patient?.cityArea || patient?.address) && (
                    <div className="sm:col-span-2 text-slate-600">
                      <span className="text-slate-500">Address:</span>{' '}
                      <span className="font-medium text-slate-800">
                        {[patient.streetAddress, patient.cityArea, patient.pincode].filter(Boolean).join(', ') || patient.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Procedure Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-y border-slate-300">
                      <th className="py-2.5 px-3">Procedure / Service</th>
                      <th className="py-2.5 px-3 text-center">Tooth #</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900">{item.description}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {item.toothNumber ? `#${item.toothNumber}` : 'General'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600">{item.quantity || 1}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Premium Totals Section */}
              <div className="pt-2">
                <div className="w-full sm:w-80 ml-auto space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 py-0.5">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>

                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-amber-800 font-semibold py-0.5">
                      <span>Discount Savings:</span>
                      <span className="font-mono">-{formatCurrency(invoice.discountAmount)}</span>
                    </div>
                  )}

                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-slate-600 py-0.5">
                      <span>Tax (GST):</span>
                      <span className="font-mono">+{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                  )}

                  {/* Highlighted Grand Total */}
                  <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center font-bold text-sm shadow-xs my-2">
                    <span>Grand Total:</span>
                    <span className="text-amber-400 font-mono font-extrabold text-base">
                      {formatCurrency(invoice.netTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-700 py-0.5">
                    <span>Paid Via ({invoice.paymentMethod || 'UPI'}):</span>
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(invoice.paidAmount)}</span>
                  </div>

                  {/* Balance Due or Payment Completed status */}
                  {invoice.balanceDue > 0 ? (
                    <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                      <span>Outstanding Balance:</span>
                      <span className="font-mono">{formatCurrency(invoice.balanceDue)}</span>
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-lg text-center text-xs mt-1">
                      ✓ Payment Completed (PAID IN FULL)
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Footer */}
              <div className="border-t border-slate-200 pt-5 text-center text-slate-500 text-[10px] space-y-1">
                <p className="font-semibold text-slate-700">
                  Thank you for choosing {doctor.clinicName}. We appreciate your trust in our care.
                </p>
                <p>Please preserve this invoice for future reference.</p>
              </div>
            </div>
          ) : (
            /* 80mm Thermal Receipt POS Format */
            <div ref={invoicePreviewRef} className="bg-white text-[#1E293B] p-4 rounded-2xl space-y-3 text-[11px] font-mono border-2 border-dashed border-[#E8ECF3] max-w-[340px] mx-auto shadow-xs">
              <div className="text-center border-b border-zinc-200 pb-2 space-y-0.5">
                <h2 className="font-extrabold text-sm text-[#1E293B] uppercase">{doctor.clinicName}</h2>
                <p className="text-[10px] text-[#64748B]">{doctor.clinicAddress}</p>
                <p className="text-[10px] text-[#64748B]">Ph: {doctor.clinicPhone}</p>
                <div className="pt-1 text-[10px] font-bold text-[#1E293B]">
                  *** RECEIPT #{invoice.id} ***
                </div>
              </div>

              <div className="text-[10px] space-y-0.5 border-b border-zinc-200 pb-2">
                <div>Date: {formatDate(invoice.date)}</div>
                <div>Patient: <span className="font-bold">{invoice.patientName}</span></div>
                <div>MRN: {patient?.mrn || 'N/A'}</div>
                {(patient?.streetAddress || patient?.cityArea || patient?.address) && (
                  <div className="text-[9px] text-zinc-600 truncate">
                    Addr: {[patient.streetAddress, patient.cityArea, patient.pincode].filter(Boolean).join(', ') || patient.address}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 border-b border-zinc-200 pb-2">
                {invoice.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-[10px]">
                    <span className="font-bold flex-1 truncate pr-2">
                      {item.toothNumber ? `[#${item.toothNumber}] ` : ''}{item.description}
                    </span>
                    <span className="font-mono shrink-0">{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-xs border-t border-zinc-200 pt-1">
                  <span>NET PAYABLE:</span>
                  <span>{formatCurrency(invoice.netTotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Paid ({invoice.paymentMethod || 'UPI'}):</span>
                  <span>{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Bal Due:</span>
                  <span>{formatCurrency(invoice.balanceDue)}</span>
                </div>
              </div>

              <div className="text-center text-[9px] text-[#94A3B8] border-t border-zinc-200 pt-2 font-sans italic">
                Thank you for choosing {doctor.clinicName}!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8ECF3] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 min-h-[44px] rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] text-xs font-bold border border-[#E8ECF3] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-3 min-h-[44px] rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#3BA7F5]" /> Print
            </button>

            <button
              type="button"
              onClick={handleShareA4WhatsApp}
              className="px-4 py-3 min-h-[44px] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-colors cursor-pointer"
              title="Share A4 PDF Invoice layout via WhatsApp"
            >
              <FileText className="w-4 h-4 text-emerald-100" /> Share A4 PDF via WhatsApp
            </button>

            <button
              type="button"
              onClick={handleShareThermalWhatsApp}
              className="px-4 py-3 min-h-[44px] rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-[0_8px_20px_rgba(13,148,136,0.3)] transition-colors cursor-pointer"
              title="Share 80mm POS Thermal Receipt layout via WhatsApp"
            >
              <Receipt className="w-4 h-4 text-teal-100" /> Share Thermal PDF via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

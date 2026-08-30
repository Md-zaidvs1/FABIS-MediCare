import React, { useState, useMemo } from 'react';
import { Patient, Invoice, UserRole, DoctorProfile } from '../../types';
import { formatCurrency, formatDate, formatPatientId } from '../../utils/formatters';
import { shareInvoicePdf, printPdfBlob, generateInvoiceThermalJsPdf, generateInvoiceJsPdf } from '../../utils/pdfShare';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { 
  Receipt, 
  Plus, 
  ArrowUpRight, 
  Printer, 
  FileText, 
  Search, 
  X, 
  Calendar,
  CreditCard
} from 'lucide-react';

interface BillingViewProps {
  patients: Patient[];
  doctor?: DoctorProfile;
  activeRole?: UserRole;
  onSelectPatient: (patientId: string) => void;
  onOpenCreateInvoice: () => void;
  onViewInvoiceModal: (invoice: Invoice) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  patients,
  doctor,
  activeRole = 'admin',
  onSelectPatient,
  onOpenCreateInvoice,
  onViewInvoiceModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [invoiceForWhatsAppPrompt, setInvoiceForWhatsAppPrompt] = useState<Invoice | null>(null);

  const getDefaultDoctor = (): DoctorProfile => doctor || {
    name: 'Dr. Dental Specialist',
    qualifications: 'BDS, MDS',
    regNumber: 'DENT-12345',
    clinicName: 'Dental Care Clinic',
    clinicAddress: 'Main Healthcare Avenue',
    clinicPhone: '+91 98765 43210',
    clinicEmail: 'contact@dentalclinic.com',
  };

  // Flatten all invoices and attach patient details
  const allInvoices = useMemo(() => {
    const list = (patients || []).flatMap((p) =>
      (p?.invoices || []).map((inv) => ({
        ...inv,
        patientObj: p,
        patientName: p?.name || '',
        patientPhone: p?.phone || '',
        patientRkId: formatPatientId(p),
      }))
    );
    // Sort newest first
    return list.sort((a, b) => new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime());
  }, [patients]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allInvoices.filter((inv) => {
      // Status filter
      const invStatus = (inv.status || '').toLowerCase();
      if (statusFilter === 'paid' && invStatus !== 'paid') return false;
      if (statusFilter === 'partial' && invStatus !== 'partial') return false;
      if (statusFilter === 'unpaid' && invStatus !== 'unpaid' && invStatus !== 'due' && invStatus !== 'pending') return false;

      // Search query
      if (!q) return true;
      const matchPatient = inv.patientName.toLowerCase().includes(q);
      const matchRk = inv.patientRkId.toLowerCase().includes(q);
      const matchInvId = inv.id.toLowerCase().includes(q);
      const matchPayment = (inv.paymentMethod || '').toLowerCase().includes(q);
      const matchItems = (inv.items || []).some((it) => it.description.toLowerCase().includes(q));

      return matchPatient || matchRk || matchInvId || matchPayment || matchItems;
    });
  }, [allInvoices, searchQuery, statusFilter]);

  const handlePrintThermalDirect = (inv: Invoice) => {
    const patient = (inv as any).patientObj || patients.find((p) => p.id === inv.patientId);
    const pdfBlob = generateInvoiceThermalJsPdf(inv, getDefaultDoctor(), patient, getStoredCustomClinicLogo());
    if (pdfBlob) printPdfBlob(pdfBlob);
  };

  const handlePrintA4Direct = (inv: Invoice) => {
    const patient = (inv as any).patientObj || patients.find((p) => p.id === inv.patientId);
    const pdfBlob = generateInvoiceJsPdf(inv, getDefaultDoctor(), patient, getStoredCustomClinicLogo());
    if (pdfBlob) printPdfBlob(pdfBlob);
  };

  const handleExecuteWhatsAppShare = (inv: Invoice, format: 'a4' | 'thermal') => {
    const patient = (inv as any).patientObj || patients.find((p) => p.id === inv.patientId);
    shareInvoicePdf({
      invoice: inv,
      doctor: getDefaultDoctor(),
      patient,
      customLogo: getStoredCustomClinicLogo(),
      format,
    });
    setInvoiceForWhatsAppPrompt(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-[24px] border border-[#E8ECF3] shadow-[0_8px_24px_rgba(0,0,0,0.03)] text-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#3BA7F5] shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1E293B] tracking-tight">
              BILLING HISTORY
            </h1>
            <div className="text-xs font-semibold text-[#64748B] mt-0.5">
              {allInvoices.length} {allInvoices.length === 1 ? 'Invoice Record' : 'Invoice Records'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenCreateInvoice()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient Name, RK Patient ID (e.g. RK881), Treatment, or UPI..."
            className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8ECF3] rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium outline-none focus:border-[#3BA7F5] focus:ring-2 focus:ring-sky-100 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E8ECF3] shadow-2xs shrink-0 self-start sm:self-auto">
          {[
            { key: 'all', label: 'All Bills' },
            { key: 'paid', label: 'Paid' },
            { key: 'partial', label: 'Partial' },
            { key: 'unpaid', label: 'Unpaid' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Billing History Spreadsheet Table & Mobile Cards */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#E8ECF3] p-10 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-slate-700">
            {searchQuery || statusFilter !== 'all' ? 'No matching bills found' : 'No bills recorded yet'}
          </div>
          <div className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Try changing your search query or status filter.'
              : 'Click "Create Invoice" above to generate a billing invoice for a patient.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop / Tablet Spreadsheet Table */}
          <div className="hidden lg:block bg-white rounded-[22px] border border-[#E8ECF3] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-[#E8ECF3] text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-black">Date</th>
                    <th className="py-3.5 px-4 font-black">Patient ID</th>
                    <th className="py-3.5 px-4 font-black">Patient Name</th>
                    <th className="py-3.5 px-4 font-black">Treatment / Items</th>
                    <th className="py-3.5 px-4 font-black text-right">Total</th>
                    <th className="py-3.5 px-4 font-black text-right">Paid</th>
                    <th className="py-3.5 px-4 font-black text-right">Due</th>
                    <th className="py-3.5 px-4 font-black text-center">Payment</th>
                    <th className="py-3.5 px-4 font-black text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8ECF3] text-slate-800">
                  {filteredInvoices.map((inv, idx) => {
                    const patient = inv.patientObj || patients.find((p) => p.id === inv.patientId);
                    const ptRkId = formatPatientId(patient || inv.patientId);
                    const isPaid = inv.status === 'Paid' || inv.status === 'PAID';
                    const isPartial = inv.status === 'Partial' || inv.status === 'PARTIAL';
                    
                    const treatmentSummary = inv.items && inv.items.length > 0 
                      ? inv.items.map(it => it.description).join(', ')
                      : 'Dental Clinical Care';

                    return (
                      <tr 
                        key={`${inv.id}-${inv.patientId}-${idx}`}
                        className="hover:bg-sky-50/40 transition-colors group"
                      >
                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span>{formatDate(inv.date)}</span>
                          </div>
                        </td>

                        {/* Patient ID */}
                        <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-sky-700">
                          <span className="bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80">
                            {ptRkId}
                          </span>
                        </td>

                        {/* Patient Name */}
                        <td className="py-3 px-4 whitespace-nowrap font-extrabold text-slate-900">
                          <button
                            type="button"
                            onClick={() => onSelectPatient(inv.patientId)}
                            className="hover:text-sky-600 flex items-center gap-1 transition-colors cursor-pointer text-left group-hover:underline"
                            title="Open Patient EMR"
                          >
                            <span>{inv.patientName}</span>
                            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />
                          </button>
                        </td>

                        {/* Treatment / Items */}
                        <td className="py-3 px-4 max-w-xs font-medium text-slate-600">
                          <div className="truncate" title={treatmentSummary}>
                            {treatmentSummary}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">#{inv.id}</span>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-black text-slate-900">
                          {formatCurrency(inv.netTotal)}
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-emerald-600">
                          {formatCurrency(inv.paidAmount)}
                        </td>

                        {/* Due Amount */}
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          {inv.balanceDue > 0 ? (
                            <span className="px-2 py-0.5 rounded-md font-bold text-rose-700 bg-rose-50 border border-rose-200 text-[11px]">
                              {formatCurrency(inv.balanceDue)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 text-[11px]">
                              ₹0
                            </span>
                          )}
                        </td>

                        {/* Payment Mode */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <CreditCard className="w-2.5 h-2.5 text-slate-500" />
                            <span>{inv.paymentMethod || 'UPI'}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* A4 Invoice Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintA4Direct(inv)}
                              title="Print A4 Prescription / Invoice"
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <FileText className="w-3 h-3 text-sky-400" />
                              <span>A4</span>
                            </button>

                            {/* 80mm Thermal Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintThermalDirect(inv)}
                              title="Print 80mm Thermal Receipt"
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <Printer className="w-3 h-3 text-white" />
                              <span>Thermal</span>
                            </button>

                            {/* WhatsApp Button */}
                            <button
                              type="button"
                              onClick={() => setInvoiceForWhatsAppPrompt(inv)}
                              title="Share Invoice on WhatsApp"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <span>💬</span>
                              <span>WA</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile & Small Screen Card Row List */}
          <div className="lg:hidden space-y-3">
            {filteredInvoices.map((inv, idx) => {
              const patient = inv.patientObj || patients.find((p) => p.id === inv.patientId);
              const ptRkId = formatPatientId(patient || inv.patientId);
              const isPaid = inv.status === 'Paid' || inv.status === 'PAID';
              const isPartial = inv.status === 'Partial' || inv.status === 'PARTIAL';
              const treatmentSummary = inv.items && inv.items.length > 0 
                ? inv.items.map(it => it.description).join(', ')
                : 'Dental Clinical Care';

              return (
                <div
                  key={`mob-${inv.id}-${inv.patientId}-${idx}`}
                  className="bg-white rounded-2xl border border-[#E8ECF3] p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-sky-500" />
                        {formatDate(inv.date)}
                      </span>
                      <span className="bg-sky-50 text-sky-700 font-mono font-bold text-[11px] px-2 py-0.5 rounded border border-sky-200">
                        {ptRkId}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isPartial
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectPatient(inv.patientId)}
                      className="font-bold text-sm text-slate-900 hover:text-sky-600 flex items-center gap-1"
                    >
                      <span>{inv.patientName}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900">{formatCurrency(inv.netTotal)}</div>
                      {inv.balanceDue > 0 ? (
                        <div className="text-[10px] font-bold text-rose-600">Due: {formatCurrency(inv.balanceDue)}</div>
                      ) : (
                        <div className="text-[10px] font-bold text-emerald-600">Paid</div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                    <span className="truncate">{treatmentSummary}</span>
                    <span className="font-bold text-slate-700 shrink-0">{inv.paymentMethod || 'UPI'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handlePrintA4Direct(inv)}
                      className="flex-1 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-sky-400" />
                      <span>A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintThermalDirect(inv)}
                      className="flex-1 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" />
                      <span>Thermal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceForWhatsAppPrompt(inv)}
                      className="flex-1 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>💬</span>
                      <span>WA</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WhatsApp Format Selection Modal */}
      {invoiceForWhatsAppPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  What do you want to share?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Select invoice layout to share with <strong className="text-slate-800 font-bold">{invoiceForWhatsAppPrompt.patientName}</strong> ({invoiceForWhatsAppPrompt.patientRkId}):
                </p>
                <div className="text-xs font-mono font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/60 mt-2">
                  Invoice #{invoiceForWhatsAppPrompt.id} • {formatCurrency(invoiceForWhatsAppPrompt.netTotal)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceForWhatsAppPrompt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleExecuteWhatsAppShare(invoiceForWhatsAppPrompt, 'a4')}
                className="p-4 rounded-2xl border-2 border-slate-900 bg-slate-900 text-white hover:bg-slate-800 transition-all flex flex-col items-center text-center gap-2 cursor-pointer shadow-sm group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-black text-sm text-white">A4 PDF</span>
                  <span className="block text-[11px] text-slate-300 font-medium mt-0.5">Full Detailed Bill</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteWhatsAppShare(invoiceForWhatsAppPrompt, 'thermal')}
                className="p-4 rounded-2xl border-2 border-amber-500 bg-amber-500 text-white hover:bg-amber-600 transition-all flex flex-col items-center text-center gap-2 cursor-pointer shadow-sm group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-black text-sm text-white">80mm Thermal</span>
                  <span className="block text-[11px] text-amber-100 font-medium mt-0.5">Compact POS Receipt</span>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInvoiceForWhatsAppPrompt(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



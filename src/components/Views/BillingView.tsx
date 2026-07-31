import React from 'react';
import { Patient, Invoice, UserRole, DoctorProfile } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { shareInvoicePdf } from '../../utils/pdfShare';
import { getStoredCustomClinicLogo } from '../../utils/storage';
import { Receipt, DollarSign, AlertCircle, Plus, ArrowUpRight, Lock, Printer } from 'lucide-react';
import { ProductionCollectionAnalytics } from '../Billing/ProductionCollectionAnalytics';

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
  const allInvoices = patients.flatMap((p) => p.invoices);

  const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalPending = allInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-[#1E293B]">
        <div>
          <h2 className="text-xl font-extrabold text-[#1E293B] flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#3BA7F5]" />
            <span>Invoices & Patient Checkout Ledger</span>
          </h2>
          <p className="text-sm font-medium text-[#64748B] mt-1">
            Generate patient billing invoices, checkout discounts, and print A4 / 80mm thermal receipts
          </p>
        </div>

        <button
          onClick={() => onOpenCreateInvoice()}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#3BA7F5] hover:bg-[#2A96E4] text-white font-bold text-sm shadow-[0_8px_20px_rgba(59,167,245,0.3)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Create Invoice</span>
        </button>
      </div>

      {activeRole === 'admin' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-[24px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-2">
            <span className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wider">Total Collected Revenue (Admin Only)</span>
            <div className="text-3xl font-black text-[#10B981]">{formatCurrency(totalRevenue)}</div>
          </div>

          <div className="bg-white p-6 rounded-[24px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-2">
            <span className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wider">Total Pending Dues (Admin Only)</span>
            <div className="text-3xl font-black text-rose-600">{formatCurrency(totalPending)}</div>
          </div>
        </div>
      ) : (
        <div className="bg-[#EBF7FC] p-4 rounded-2xl border border-[#3BA7F5]/30 text-xs text-[#1E88A8] flex items-center gap-3 font-medium">
          <Lock className="w-5 h-5 text-[#3BA7F5] shrink-0" />
          <div>
            <span className="font-bold block text-[#1E293B]">Doctor Role Access</span>
            <span>You can create patient invoices, apply checkout discounts, and print receipts. Global clinic revenue summaries are restricted to Admin role.</span>
          </div>
        </div>
      )}

      {/* Production vs Collection Analytics */}
      {activeRole === 'admin' && (
        <ProductionCollectionAnalytics patients={patients} />
      )}

      <div className="bg-white rounded-[28px] border border-[#E8ECF3] shadow-[0_10px_30px_rgba(0,0,0,0.03)] overflow-hidden text-[#1E293B]">
        <div className="p-5 border-b border-[#E8ECF3] font-bold text-[#1E293B] text-base">
          Patient Invoices Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#94A3B8] font-bold text-xs uppercase tracking-wider border-b border-[#E8ECF3]">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Date</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Total</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Balance Due</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECF3] text-[#1E293B]">
              {allInvoices.map((inv, idx) => (
                <tr key={`${inv.id}-${inv.patientId}-${idx}`} className="hover:bg-[#F8FAFC]/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-[#3BA7F5]">{inv.id}</td>
                  <td className="p-4 text-[#64748B] font-medium">{formatDate(inv.date)}</td>
                  <td className="p-4 font-bold text-[#1E293B]">
                    <button
                      onClick={() => onSelectPatient(inv.patientId)}
                      className="hover:text-[#3BA7F5] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {inv.patientName} <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
                    </button>
                  </td>
                  <td className="p-4 font-mono font-bold text-[#1E293B]">{formatCurrency(inv.netTotal)}</td>
                  <td className="p-4 font-mono text-[#10B981] font-bold">{formatCurrency(inv.paidAmount)}</td>
                  <td className="p-4 font-mono text-rose-600 font-bold">{formatCurrency(inv.balanceDue)}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => onViewInvoiceModal(inv)}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                        title="Print Invoice"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#3BA7F5]" />
                        <span className="hidden xl:inline">Print</span>
                      </button>
                      <button
                        onClick={() => {
                          const patient = patients.find((p) => p.id === inv.patientId);
                          const defaultDoctor: DoctorProfile = doctor || {
                            name: 'Dr. Dental Specialist',
                            qualifications: 'BDS, MDS',
                            regNumber: 'DENT-12345',
                            clinicName: 'Dental Care Clinic',
                            clinicAddress: 'Main Healthcare Avenue',
                            clinicPhone: '+91 98765 43210',
                            clinicEmail: 'contact@dentalclinic.com',
                          };
                          shareInvoicePdf({
                            invoice: inv,
                            doctor: defaultDoctor,
                            patient,
                            customLogo: getStoredCustomClinicLogo(),
                          });
                        }}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Share invoice PDF via WhatsApp"
                      >
                        <span className="text-xs">💬</span>
                        <span className="hidden xl:inline">WhatsApp</span>
                      </button>
                      <button
                        onClick={() => onViewInvoiceModal(inv)}
                        className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] text-xs font-bold border border-[#E8ECF3] transition-all cursor-pointer inline-flex items-center gap-1"
                        title="View Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-600" />
                        <span>View</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

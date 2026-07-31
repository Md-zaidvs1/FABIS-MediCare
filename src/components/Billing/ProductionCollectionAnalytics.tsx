import React from 'react';
import { Invoice, Patient } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, TrendingUp, Wallet, ArrowUpRight, PieChart, CreditCard } from 'lucide-react';

interface ProductionCollectionAnalyticsProps {
  patients: Patient[];
  invoices: Invoice[];
}

export const ProductionCollectionAnalytics: React.FC<ProductionCollectionAnalyticsProps> = ({
  patients,
  invoices,
}) => {
  // Total Produced Value = Sum of net total of all invoices + completed treatment plans value
  let totalInvoicedProduction = 0;
  let totalActualCollected = 0;
  let totalBalanceDue = 0;

  invoices.forEach((inv) => {
    totalInvoicedProduction += inv.netTotal || 0;
    totalActualCollected += inv.paidAmount || 0;
    totalBalanceDue += inv.balanceDue || 0;
  });

  // Calculate Breakdown by Payment Method
  const methodTotals: Record<string, number> = {
    UPI: 0,
    Cash: 0,
    Card: 0,
    'Net Banking': 0,
    Insurance: 0,
  };

  invoices.forEach((inv) => {
    if (inv.paymentHistory) {
      inv.paymentHistory.forEach((pm) => {
        methodTotals[pm.method] = (methodTotals[pm.method] || 0) + pm.amount;
      });
    } else if (inv.paymentMethod) {
      methodTotals[inv.paymentMethod] = (methodTotals[inv.paymentMethod] || 0) + inv.paidAmount;
    }
  });

  const collectionPercentage = totalInvoicedProduction > 0
    ? Math.round((totalActualCollected / totalInvoicedProduction) * 100)
    : 100;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs text-zinc-900 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-200">
              Financial Intelligence
            </span>
            <h2 className="text-base font-extrabold text-zinc-900">
              Total Production vs. Cash / UPI Collection Analytics
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Compare clinical total produced value against actual realized cash flow & dues.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-50 px-3.5 py-1.5 rounded-full border border-zinc-200 text-xs font-mono font-bold text-emerald-800">
          <span>Collection Rate:</span>
          <span className="text-sm font-black text-emerald-700">{collectionPercentage}%</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Produced */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Total Produced Value</span>
            <TrendingUp className="w-4 h-4 text-[#9a7814]" />
          </div>
          <div className="text-2xl font-mono font-black text-zinc-900">
            {formatCurrency(totalInvoicedProduction)}
          </div>
          <span className="text-[11px] text-zinc-500 font-medium block">
            Gross clinical procedure fees invoiced across all patients
          </span>
        </div>

        {/* Actual Realized Collected */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Actual Collections</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-black text-emerald-700">
            {formatCurrency(totalActualCollected)}
          </div>
          <span className="text-[11px] text-emerald-800 font-medium block">
            Realized cash flow deposited ({collectionPercentage}% of production)
          </span>
        </div>

        {/* Pending Outstanding Dues */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Outstanding Dues</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-mono font-black text-rose-600">
            {formatCurrency(totalBalanceDue)}
          </div>
          <span className="text-[11px] text-rose-700 font-medium block">
            Uncollected patient balance pending recovery
          </span>
        </div>
      </div>

      {/* Collection Progress Bar */}
      <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
        <div className="flex items-center justify-between text-xs font-bold">
          <span>Realized Collections Progress</span>
          <span className="font-mono text-emerald-700">{formatCurrency(totalActualCollected)} / {formatCurrency(totalInvoicedProduction)}</span>
        </div>
        <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#3BA7F5] transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, collectionPercentage)}%` }}
          />
        </div>
      </div>

      {/* Collection Breakdown by Payment Channel */}
      <div className="space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-[#3BA7F5]" />
          <span>Realized Collections by Payment Channel</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {Object.entries(methodTotals).map(([method, amount]) => (
            <div
              key={method}
              className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-center space-y-1"
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase block">{method}</span>
              <span className="text-sm font-mono font-bold text-zinc-900 block">
                {formatCurrency(amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

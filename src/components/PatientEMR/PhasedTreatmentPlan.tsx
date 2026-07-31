import React, { useState } from 'react';
import { TreatmentPlanItem, Patient } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Layers, CheckCircle2, ShieldCheck, Printer, FileText, Plus, Trash2, Signature } from 'lucide-react';

interface PhasedTreatmentPlanProps {
  patient: Patient;
  onUpdateTreatmentPlans: (plans: TreatmentPlanItem[]) => void;
}

export const PhasedTreatmentPlan: React.FC<PhasedTreatmentPlanProps> = ({
  patient,
  onUpdateTreatmentPlans,
}) => {
  const [plans, setPlans] = useState<TreatmentPlanItem[]>(patient.treatmentPlans || []);
  const [signatureName, setSignatureName] = useState<string>('');
  const [isSigned, setIsSigned] = useState<boolean>(
    patient.treatmentPlans.some((p) => p.isAccepted)
  );
  const [activePhaseFilter, setActivePhaseFilter] = useState<string>('All');

  const phases: ('Phase 1: Urgent / Pain Relief' | 'Phase 2: Restorative & Endo' | 'Phase 3: Cosmetic & Maintenance')[] = [
    'Phase 1: Urgent / Pain Relief',
    'Phase 2: Restorative & Endo',
    'Phase 3: Cosmetic & Maintenance',
  ];

  // Helper to categorize items that don't have explicit phase assigned
  const getPhaseForItem = (item: TreatmentPlanItem) => {
    if (item.phase) return item.phase;
    if (item.category === 'Oral Surgery' || item.category === 'Endodontics') {
      return 'Phase 1: Urgent / Pain Relief';
    }
    if (item.category === 'Prosthodontics' || item.category === 'Preventive') {
      return 'Phase 2: Restorative & Endo';
    }
    return 'Phase 3: Cosmetic & Maintenance';
  };

  const handleToggleAcceptance = (planId: string) => {
    const updated = plans.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          isAccepted: !p.isAccepted,
          acceptedDate: !p.isAccepted ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return p;
    });
    setPlans(updated);
    onUpdateTreatmentPlans(updated);
  };

  const handleSignEstimate = () => {
    if (!signatureName.trim()) {
      alert('Please enter patient signature name to confirm acceptance.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const updated = plans.map((p) => ({
      ...p,
      isAccepted: true,
      acceptedDate: today,
      patientSignature: signatureName.trim(),
    }));
    setPlans(updated);
    setIsSigned(true);
    onUpdateTreatmentPlans(updated);
  };

  const handlePrintEstimate = () => {
    window.print();
  };

  // Group items by phase
  const groupedPlans = phases.map((phaseName) => {
    const items = plans.filter((p) => getPhaseForItem(p) === phaseName);
    const subtotal = items.reduce((sum, item) => sum + item.estimatedCost, 0);
    return { phaseName, items, subtotal };
  });

  const grandTotalEstimate = plans.reduce((sum, item) => sum + item.estimatedCost, 0);
  const acceptedTotalEstimate = plans
    .filter((p) => p.isAccepted)
    .reduce((sum, item) => sum + item.estimatedCost, 0);

  return (
    <div className="space-y-6 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-200">
              Multi-Visit Roadmap
            </span>
            <h2 className="text-base font-extrabold text-zinc-900">
              Phased Treatment Planning & Financial Cost Estimate
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Procedures ordered by Phase 1 (Urgent), Phase 2 (Restorative), and Phase 3 (Cosmetic).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintEstimate}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs border border-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-zinc-600" />
            <span>Print Estimate</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs">
        <div className="bg-white p-3 rounded-xl border border-zinc-200">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">Total Estimated Cost</span>
          <span className="text-lg font-mono font-black text-zinc-900 mt-0.5 block">
            {formatCurrency(grandTotalEstimate)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-zinc-200">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">Accepted Procedures Total</span>
          <span className="text-lg font-mono font-black text-emerald-600 mt-0.5 block">
            {formatCurrency(acceptedTotalEstimate)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-zinc-200">
          <span className="text-[10px] font-bold text-zinc-400 uppercase block">Acceptance Status</span>
          <span
            className={`text-xs font-extrabold mt-1 inline-flex items-center gap-1 ${
              isSigned ? 'text-emerald-700' : 'text-amber-800'
            }`}
          >
            {isSigned ? '✓ Patient Formally Approved' : '⏳ Pending Patient Approval'}
          </span>
        </div>
      </div>

      {/* Phased Cards Layout */}
      <div className="space-y-5">
        {groupedPlans.map(({ phaseName, items, subtotal }, idx) => (
          <div
            key={phaseName}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              idx === 0
                ? 'bg-rose-50/40 border-rose-200'
                : idx === 1
                ? 'bg-amber-50/40 border-amber-200'
                : 'bg-sky-50/40 border-sky-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/80">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono ${
                    idx === 0
                      ? 'bg-rose-600 text-white'
                      : idx === 1
                      ? 'bg-amber-600 text-white'
                      : 'bg-sky-600 text-white'
                  }`}
                >
                  Phase {idx + 1}
                </span>
                <h3 className="text-sm font-extrabold text-zinc-900">{phaseName}</h3>
              </div>

              <div className="text-xs font-mono font-bold text-zinc-700">
                Phase Total: <span className="text-zinc-900 font-extrabold">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            {/* Procedures Table */}
            <div className="divide-y divide-zinc-200/60 mt-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAcceptance(item.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        item.isAccepted
                          ? 'bg-emerald-600 border-emerald-700 text-white'
                          : 'bg-white border-zinc-300 hover:border-emerald-500'
                      }`}
                      title={item.isAccepted ? 'Accepted by patient' : 'Click to accept'}
                    >
                      {item.isAccepted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-2">
                        <span>{item.procedureName}</span>
                        {item.toothNumber && (
                          <span className="text-[10px] font-mono bg-zinc-200 px-1.5 py-0.2 rounded text-zinc-800">
                            Tooth #{item.toothNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-medium">
                        Category: {item.category} • Status: <span className="font-semibold">{item.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-mono font-extrabold text-zinc-900 text-sm">
                      {formatCurrency(item.estimatedCost)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isAccepted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                      }`}
                    >
                      {item.isAccepted ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="py-4 text-center text-xs text-zinc-400 italic">
                  No procedures assigned to this phase yet.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Patient Acceptance Signature Box */}
      <div className="bg-gradient-to-r from-amber-50/80 to-white p-5 rounded-2xl border border-amber-200 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#9a7814]" />
          <h3 className="text-sm font-extrabold text-zinc-900">
            Patient Pre-Treatment Financial Acceptance & Consent
          </h3>
        </div>

        <p className="text-xs text-zinc-600">
          I hereby confirm that I have reviewed the multi-visit treatment plan estimate outlined above and give my informed consent to proceed with the accepted procedures.
        </p>

        {isSigned ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
            <div>
              <span className="font-bold block">✓ Formally Accepted & Signed</span>
              <span className="text-[11px] text-emerald-700">
                Patient Signature: <span className="font-mono font-bold">{signatureName || patient.name}</span>
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
              Approved
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <input
              type="text"
              placeholder="Type Patient Full Name as Digital Signature *"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              className="flex-1 w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-[#3BA7F5]"
            />

            <button
              type="button"
              onClick={handleSignEstimate}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              Sign & Approve Estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

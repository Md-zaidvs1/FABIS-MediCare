import React, { useState } from 'react';
import { ToothPerioRecord, Patient } from '../../types';
import { universalToFDI, getToothName } from '../../utils/formatters';
import { Activity, AlertTriangle, Check, Droplets, Info, Save } from 'lucide-react';

interface PerioChartModuleProps {
  patient: Patient;
  onUpdatePerioMap: (perioMap: Record<number, ToothPerioRecord>) => void;
}

export const PerioChartModule: React.FC<PerioChartModuleProps> = ({
  patient,
  onUpdatePerioMap,
}) => {
  const [perioState, setPerioState] = useState<Record<number, ToothPerioRecord>>(
    patient.perioMap || {}
  );
  const [selectedToothNum, setSelectedToothNum] = useState<number>(3); // Default upper molar
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Default perio record helper
  const getPerioForTooth = (toothNum: number): ToothPerioRecord => {
    return (
      perioState[toothNum] || {
        toothNumber: toothNum,
        probingDepths: [2, 2, 3, 2, 2, 2], // MB, B, DB, ML, L, DL
        recession: [0, 0, 0, 0, 0, 0],
        bop: [false, false, false, false, false, false],
        mobility: 0,
        furcation: 0,
      }
    );
  };

  const handleUpdateProbingDepth = (toothNum: number, siteIndex: number, depth: number) => {
    const current = getPerioForTooth(toothNum);
    const newDepths = [...current.probingDepths] as [number, number, number, number, number, number];
    newDepths[siteIndex] = Math.max(1, Math.min(12, depth));

    const updated = { ...current, probingDepths: newDepths };
    setPerioState((prev) => ({ ...prev, [toothNum]: updated }));
    setHasUnsavedChanges(true);
  };

  const handleToggleBop = (toothNum: number, siteIndex: number) => {
    const current = getPerioForTooth(toothNum);
    const currentBop = current.bop || [false, false, false, false, false, false];
    const newBop = [...currentBop] as [boolean, boolean, boolean, boolean, boolean, boolean];
    newBop[siteIndex] = !newBop[siteIndex];

    const updated = { ...current, bop: newBop };
    setPerioState((prev) => ({ ...prev, [toothNum]: updated }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateMobility = (toothNum: number, mobility: 0 | 1 | 2 | 3) => {
    const current = getPerioForTooth(toothNum);
    const updated = { ...current, mobility };
    setPerioState((prev) => ({ ...prev, [toothNum]: updated }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAll = () => {
    onUpdatePerioMap(perioState);
    setHasUnsavedChanges(false);
  };

  // Calculate Periodontal Statistics
  let totalBopSites = 0;
  let totalDeepPockets = 0; // >= 4mm
  let maxProbingDepth = 0;

  for (let i = 1; i <= 32; i++) {
    const rec = perioState[i];
    if (rec) {
      rec.probingDepths.forEach((d) => {
        if (d >= 4) totalDeepPockets++;
        if (d > maxProbingDepth) maxProbingDepth = d;
      });
      if (rec.bop) {
        rec.bop.forEach((b) => {
          if (b) totalBopSites++;
        });
      }
    }
  }

  const selectedPerio = getPerioForTooth(selectedToothNum);
  const siteLabels = ['MB', 'B', 'DB', 'ML', 'L', 'DL'];

  return (
    <div className="space-y-6 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs text-zinc-900">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-sky-100 text-sky-800 border border-sky-200 font-extrabold text-xs">
              6-Point Charting
            </span>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <span>Periodontal Probing & Soft Tissue Exam</span>
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Record 6-point probing depths, bleeding on probing (BOP), and mobility grades per tooth.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2 rounded-xl bg-[#3BA7F5] hover:bg-sky-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Perio Exam</span>
          </button>
        </div>
      </div>

      {/* Periodontal Summary Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200 text-xs">
        <div className="p-2.5 bg-white rounded-xl border border-zinc-200/80">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Deep Pockets (≥4mm)</span>
          <span className={`text-base font-black font-mono mt-0.5 block ${totalDeepPockets > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {totalDeepPockets} sites
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-zinc-200/80">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Bleeding Sites (BOP)</span>
          <span className={`text-base font-black font-mono mt-0.5 block ${totalBopSites > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
            {totalBopSites} positive
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-zinc-200/80">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Max Probing Depth</span>
          <span className={`text-base font-black font-mono mt-0.5 block ${maxProbingDepth >= 5 ? 'text-rose-600' : 'text-zinc-800'}`}>
            {maxProbingDepth > 0 ? `${maxProbingDepth} mm` : 'Normal (2-3mm)'}
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-zinc-200/80">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Periodontal Status</span>
          <span className="text-xs font-bold text-zinc-800 mt-1 block">
            {totalDeepPockets > 4
              ? 'Moderate / Severe Periodontitis'
              : totalDeepPockets > 0
              ? 'Localized Mild Periodontitis'
              : totalBopSites > 0
              ? 'Gingivitis (BOP +ve)'
              : 'Healthy Periodontium'}
          </span>
        </div>
      </div>

      {/* Interactive Selected Tooth Probing Deck */}
      <div className="bg-gradient-to-r from-sky-50/50 via-zinc-50 to-white p-5 rounded-2xl border border-sky-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-100 pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200">
              Editing Tooth #{selectedToothNum} (FDI {universalToFDI(selectedToothNum)})
            </span>
            <h3 className="text-sm font-extrabold text-zinc-900 mt-1">
              {getToothName(selectedToothNum)}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-600">Mobility Grade:</span>
            {[0, 1, 2, 3].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleUpdateMobility(selectedToothNum, m as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  (selectedPerio.mobility || 0) === m
                    ? 'bg-sky-600 text-white border-sky-700 shadow-sm'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                Grade {m}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Probing Depth Site Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {siteLabels.map((site, idx) => {
            const depth = selectedPerio.probingDepths[idx];
            const isBop = selectedPerio.bop?.[idx] || false;
            const isWarning = depth >= 4;

            return (
              <div
                key={site}
                className={`p-3 rounded-2xl border transition-all text-center space-y-2 ${
                  isWarning
                    ? 'bg-rose-50/80 border-rose-300 shadow-xs'
                    : 'bg-white border-zinc-200 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-extrabold text-zinc-500">
                  <span>{site}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleBop(selectedToothNum, idx)}
                    className={`p-1 rounded-full transition-all cursor-pointer ${
                      isBop
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-400 hover:text-rose-600'
                    }`}
                    title={isBop ? 'Bleeding on Probing (+ve)' : 'Toggle Bleeding on Probing'}
                  >
                    <Droplets className="w-3 h-3" />
                  </button>
                </div>

                {/* Depth Stepper */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateProbingDepth(selectedToothNum, idx, depth - 1)}
                    className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    -
                  </button>
                  <span
                    className={`text-lg font-mono font-black ${
                      isWarning ? 'text-rose-600 scale-105' : 'text-zinc-900'
                    }`}
                  >
                    {depth}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateProbingDepth(selectedToothNum, idx, depth + 1)}
                    className="w-6 h-6 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-sm flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </div>

                <div className="text-[10px] text-zinc-400 font-medium">
                  {depth >= 4 ? 'Pocket' : 'Normal'} {isBop && '• BOP (+)'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Mouth Tooth Quick Picker Grid */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-700 block">Select Tooth to Edit Probing Depths:</label>
        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
          {Array.from({ length: 32 }, (_, i) => i + 1).map((num) => {
            const pRec = perioState[num];
            const hasDeepPockets = pRec?.probingDepths.some((d) => d >= 4);
            const isSel = selectedToothNum === num;

            return (
              <button
                key={num}
                type="button"
                onClick={() => setSelectedToothNum(num)}
                className={`py-2 rounded-xl text-center font-mono text-xs font-extrabold border transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[#3BA7F5] text-white border-sky-700 shadow-md scale-105 z-10'
                    : hasDeepPockets
                    ? 'bg-rose-100 text-rose-900 border-rose-300 hover:border-rose-400'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                }`}
              >
                #{num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

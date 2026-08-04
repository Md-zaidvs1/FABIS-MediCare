import React, { useState, useEffect } from 'react';
import { ToothRecord, ToothCondition } from '../../types';
import { CONDITION_CONFIG, universalToFDI, getToothName, isPrimaryTooth } from '../../utils/formatters';
import { AnatomicalToothSVG, getToothCategory } from './AnatomicalToothSVG';

interface TeethChartProps {
  teethMap: Record<number, ToothRecord>;
  selectedToothNumber: number | null;
  onSelectTooth: (toothNumber: number) => void;
  readOnly?: boolean;
}

export type ChartMode = 'adult' | 'child';

// Adult Arch Sequences (16 teeth per arch: 8 per quadrant)
const upperArchAdult = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const lowerArchAdult = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

// Child Arch Sequences (FDI Notation, 10 teeth per arch: 5 per quadrant)
const upperArchChild = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerArchChild = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Anatomical Parabolic Arch Curve Y-Offsets (px)
const upperYOffsetsAdult = [68, 52, 38, 26, 16, 9, 3, 0, 0, 3, 9, 16, 26, 38, 52, 68];
const lowerYOffsetsAdult = [-68, -52, -38, -26, -16, -9, -3, 0, 0, -3, -9, -16, -26, -38, -52, -68];
const upperAnglesAdult = [-16, -12, -9, -6, -4, -2, -1, 0, 0, 1, 2, 4, 6, 9, 12, 16];
const lowerAnglesAdult = [16, 12, 9, 6, 4, 2, 1, 0, 0, -1, -2, -4, -6, -9, -12, -16];

const upperYOffsetsChild = [42, 26, 14, 5, 0, 0, 5, 14, 26, 42];
const lowerYOffsetsChild = [-42, -26, -14, -5, 0, 0, -5, -14, -26, -42];
const upperAnglesChild = [-12, -8, -4, -1, 0, 0, 1, 4, 8, 12];
const lowerAnglesChild = [12, 8, 4, 1, 0, 0, -1, -4, -8, -12];

export const TeethChart: React.FC<TeethChartProps> = ({
  teethMap,
  selectedToothNumber,
  onSelectTooth,
}) => {
  const [showLegend, setShowLegend] = useState(false);

  // Initialize chartMode based on current selection if primary, default to adult
  const [chartMode, setChartMode] = useState<ChartMode>(() => {
    if (selectedToothNumber !== null && isPrimaryTooth(selectedToothNumber)) {
      return 'child';
    }
    return 'adult';
  });

  // Auto-sync chartMode when selectedToothNumber changes externally
  useEffect(() => {
    if (selectedToothNumber !== null) {
      if (isPrimaryTooth(selectedToothNumber) && chartMode !== 'child') {
        setChartMode('child');
      } else if (!isPrimaryTooth(selectedToothNumber) && chartMode !== 'adult' && selectedToothNumber <= 32) {
        setChartMode('adult');
      }
    }
  }, [selectedToothNumber]);

  const handleModeSwitch = (newMode: ChartMode) => {
    if (newMode === chartMode) return;
    setChartMode(newMode);

    const activeSequence = newMode === 'adult' ? upperArchAdult : upperArchChild;
    const isCurrentValid = selectedToothNumber !== null && (
      newMode === 'child' ? isPrimaryTooth(selectedToothNumber) : !isPrimaryTooth(selectedToothNumber)
    );

    if (!isCurrentValid) {
      onSelectTooth(activeSequence[0]);
    }
  };

  const renderToothNode = (num: number, isUpper: boolean, indexInArch: number, mode: ChartMode) => {
    const fdiNum = universalToFDI(num);
    const record = teethMap[num] || teethMap[fdiNum] || {
      toothNumber: num,
      fdiNumber: fdiNum,
      name: getToothName(num),
      condition: 'Healthy',
    };

    const isSelected = selectedToothNumber === num || (selectedToothNumber !== null && universalToFDI(selectedToothNumber) === fdiNum);
    const condConfig = CONDITION_CONFIG[record.condition as ToothCondition] || CONDITION_CONFIG.Healthy;

    const yOffsets = mode === 'adult'
      ? (isUpper ? upperYOffsetsAdult : lowerYOffsetsAdult)
      : (isUpper ? upperYOffsetsChild : lowerYOffsetsChild);

    const angles = mode === 'adult'
      ? (isUpper ? upperAnglesAdult : lowerAnglesAdult)
      : (isUpper ? upperAnglesChild : lowerAnglesChild);

    const yOffset = yOffsets[indexInArch] || 0;
    const angle = angles[indexInArch] || 0;
    const category = getToothCategory(num);

    const categoryLabelMap: Record<string, string> = {
      incisor_central: 'Central Incisor',
      incisor_lateral: 'Lateral Incisor',
      canine: 'Canine',
      premolar: 'Premolar',
      molar: 'Molar',
      wisdom: 'Wisdom Molar',
    };

    return (
      <div
        key={num}
        style={{
          transform: `translateY(${yOffset}px) rotate(${angle}deg)`,
        }}
        className="transition-all duration-300 ease-out flex flex-col items-center justify-center shrink-0 z-10 w-[54px] sm:w-[58px]"
      >
        <button
          type="button"
          id={`tooth-btn-${fdiNum}`}
          onClick={() => onSelectTooth(num)}
          title={`${getToothName(num)} - ${condConfig.label}`}
          className={`group relative flex flex-col items-center justify-between p-2 rounded-2xl transition-all duration-200 text-center focus:outline-none w-full min-h-[120px] touch-manipulation cursor-pointer active:scale-95 ${
            isSelected
              ? 'ring-3 ring-[#3BA7F5] ring-offset-2 ring-offset-white bg-[#EBF7FC] border-2 border-[#3BA7F5] shadow-xl scale-110 z-30'
              : record.condition !== 'Healthy'
              ? `${condConfig.bgClass} ${condConfig.borderClass} hover:border-[#3BA7F5]/60 hover:scale-105 border-2 shadow-xs`
              : 'bg-white hover:bg-[#F8FAFC] border border-[#E8ECF3] hover:border-[#3BA7F5]/50 shadow-xs hover:scale-105'
          }`}
        >
          {/* Top FDI Header ONLY */}
          <div className="text-[12px] font-mono font-black text-zinc-900 group-hover:text-[#1E88A8] transition-colors flex items-center justify-center gap-0.5">
            <span className="text-[9px] text-zinc-400 font-normal">FDI</span>
            <span>{fdiNum}</span>
          </div>

          {/* Anatomical Tooth Vector Icon */}
          <div className="my-1 relative w-9 h-14 flex items-center justify-center shrink-0">
            <AnatomicalToothSVG
              toothNumber={num}
              fdiNumber={fdiNum}
              condition={record.condition as ToothCondition}
              isSelected={isSelected}
            />
          </div>

          {/* Condition Symbol Pill if not healthy */}
          {record.condition !== 'Healthy' && (
            <div
              className={`w-full mt-1 py-0.5 px-0.5 rounded text-[8px] font-extrabold text-center truncate whitespace-nowrap overflow-hidden text-ellipsis ${condConfig.bgClass} ${condConfig.colorClass} border ${condConfig.borderClass}`}
            >
              <span>{condConfig.iconSymbol}</span>{' '}
              <span className="truncate">{condConfig.label.split(' ')[0]}</span>
            </div>
          )}
        </button>

        {/* Category Label below node */}
        <div className="text-[8px] font-mono text-zinc-400 font-semibold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-center truncate w-full">
          {categoryLabelMap[category]?.split(' ')[0]}
        </div>
      </div>
    );
  };

  const isAdult = chartMode === 'adult';
  const activeUpperArch = isAdult ? upperArchAdult : upperArchChild;
  const activeLowerArch = isAdult ? lowerArchAdult : lowerArchChild;
  const splitIndex = isAdult ? 8 : 5;

  return (
    <div className="space-y-6 bg-white p-4 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs text-zinc-900 overflow-hidden">
      {/* Chart Header Bar with Adult / Child Toggle Switch */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#9a7814] font-black text-xl italic shadow-2xs shrink-0">
            🦷
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
              <span>Anatomical Dental Arch Chart</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                FDI Notation
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Curved maxillary & mandibular arch mapping. Click any tooth to open Tooth Desk.
            </p>
          </div>
        </div>

        {/* ADULT / CHILD TOGGLE SWITCH */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-2xl border border-zinc-200 shadow-2xs self-stretch sm:self-auto justify-center">
          <button
            type="button"
            id="chart-mode-adult-btn"
            onClick={() => handleModeSwitch('adult')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isAdult
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/90 font-black scale-102'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>👨 Adult</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-semibold">
              32 Permanent
            </span>
          </button>

          <button
            type="button"
            id="chart-mode-child-btn"
            onClick={() => handleModeSwitch('child')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              !isAdult
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/90 font-black scale-102'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <span>👶 Child</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-semibold">
              20 Primary
            </span>
          </button>
        </div>
      </div>

      {/* MAXILLARY ARCH (UPPER CURVED DENTAL ARCH) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] ring-2 ring-[#D4AF37]/20" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
              Maxillary Arch (Upper Teeth)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 font-semibold flex items-center gap-2">
            <span>Right Side</span>
            <span>→</span>
            <span className="text-[#9a7814] font-extrabold uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
              Midline
            </span>
            <span>←</span>
            <span>Left Side</span>
          </div>
        </div>

        {/* Curved Anatomical Upper Arch Scroll Container */}
        <div className="overflow-x-auto pb-6 pt-3 min-w-0 scrollbar-thin">
          <div className="relative flex items-center justify-center min-w-max mx-auto px-6 py-8 bg-gradient-to-b from-amber-50/30 via-zinc-50/50 to-transparent rounded-3xl border border-zinc-200/80 shadow-2xs">
            {/* Background SVG Arch Arc Curve Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox={isAdult ? '0 0 1000 180' : '0 0 700 180'}
              preserveAspectRatio="none"
            >
              <path
                d={isAdult ? 'M 40,145 Q 500,20 960,145' : 'M 40,120 Q 350,20 660,120'}
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <line
                x1={isAdult ? '500' : '350'}
                y1="20"
                x2={isAdult ? '500' : '350'}
                y2="160"
                stroke="#D4AF37"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            </svg>

            {/* Teeth Nodes in Arch Sequence */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 relative z-10">
              {activeUpperArch.map((num, idx) => (
                <React.Fragment key={num}>
                  {idx === splitIndex && (
                    <div className="flex flex-col items-center justify-center h-28 w-8 mx-1 sm:mx-2 border-x border-dashed border-[#D4AF37] bg-[#D4AF37]/10 rounded-xl shrink-0 z-20">
                      <span className="text-[9px] font-mono font-black text-[#9a7814] uppercase tracking-widest text-center">
                        MID
                      </span>
                    </div>
                  )}
                  {renderToothNode(num, true, idx, chartMode)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OCCLUSAL MIDLINE AXIS SEPARATOR */}
      <div className="relative flex items-center justify-center my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-zinc-200" />
        </div>
        <span className="relative px-4 py-1 bg-white border border-zinc-200 text-[10px] font-mono font-extrabold uppercase text-zinc-600 rounded-full shadow-2xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <span>Occlusal Midline Axis</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
        </span>
      </div>

      {/* MANDIBULAR ARCH (LOWER CURVED DENTAL ARCH) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 ring-2 ring-sky-500/20" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
              Mandibular Arch (Lower Teeth)
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400 font-semibold flex items-center gap-2">
            <span>Right Side</span>
            <span>→</span>
            <span className="text-sky-800 font-extrabold uppercase bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200/80">
              Midline
            </span>
            <span>←</span>
            <span>Left Side</span>
          </div>
        </div>

        {/* Curved Anatomical Lower Arch Scroll Container */}
        <div className="overflow-x-auto pt-6 pb-3 min-w-0 scrollbar-thin">
          <div className="relative flex items-center justify-center min-w-max mx-auto px-6 py-8 bg-gradient-to-t from-sky-50/30 via-zinc-50/50 to-transparent rounded-3xl border border-zinc-200/80 shadow-2xs">
            {/* Background SVG Arch Arc Curve Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox={isAdult ? '0 0 1000 180' : '0 0 700 180'}
              preserveAspectRatio="none"
            >
              <path
                d={isAdult ? 'M 40,35 Q 500,160 960,35' : 'M 40,35 Q 350,160 660,35'}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <line
                x1={isAdult ? '500' : '350'}
                y1="20"
                x2={isAdult ? '500' : '350'}
                y2="160"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
            </svg>

            {/* Teeth Nodes in Arch Sequence */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 relative z-10">
              {activeLowerArch.map((num, idx) => (
                <React.Fragment key={num}>
                  {idx === splitIndex && (
                    <div className="flex flex-col items-center justify-center h-28 w-8 mx-1 sm:mx-2 border-x border-dashed border-sky-500 bg-sky-500/10 rounded-xl shrink-0 z-20">
                      <span className="text-[9px] font-mono font-black text-sky-800 uppercase tracking-widest text-center">
                        MID
                      </span>
                    </div>
                  )}
                  {renderToothNode(num, false, idx, chartMode)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT CLINICAL STATUS GUIDE */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={() => setShowLegend(!showLegend)}
          className="text-xs font-bold text-zinc-500 hover:text-[#9a7814] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>ⓘ Tooth Status Guide</span>
          <span className="text-[10px] text-zinc-400 font-mono">
            ({showLegend ? 'Hide Legend' : 'Show Legend'})
          </span>
        </button>

        {showLegend && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {(Object.keys(CONDITION_CONFIG) as ToothCondition[]).map((condKey) => {
              const cfg = CONDITION_CONFIG[condKey];
              return (
                <div
                  key={condKey}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.bgClass} ${cfg.colorClass} ${cfg.borderClass}`}
                >
                  <span className="font-mono">{cfg.iconSymbol}</span>
                  <span>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { ToothRecord, ToothCondition } from '../../types';
import { CONDITION_CONFIG, universalToFDI, getToothName } from '../../utils/formatters';
import { AnatomicalToothSVG, getToothCategory } from './AnatomicalToothSVG';

interface TeethChartProps {
  teethMap: Record<number, ToothRecord>;
  selectedToothNumber: number | null;
  onSelectTooth: (toothNumber: number) => void;
  readOnly?: boolean;
}

export const TeethChart: React.FC<TeethChartProps> = ({
  teethMap,
  selectedToothNumber,
  onSelectTooth,
}) => {
  const [showLegend, setShowLegend] = React.useState(false);

  // Maxillary Arch Sequence (Upper Right #1-8 -> Midline -> Upper Left #9-16)
  const upperArchSequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  // Mandibular Arch Sequence (Lower Right #32-25 -> Midline -> Lower Left #24-17)
  const lowerArchSequence = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  // Anatomical Parabolic Arch Curve Y-Offsets (px) from apex (midline)
  const upperYOffsets = [68, 52, 38, 26, 16, 9, 3, 0, 0, 3, 9, 16, 26, 38, 52, 68];
  const lowerYOffsets = [-68, -52, -38, -26, -16, -9, -3, 0, 0, -3, -9, -16, -26, -38, -52, -68];

  // Anatomical inward curve rotation angles (degrees)
  const upperAngles = [-16, -12, -9, -6, -4, -2, -1, 0, 0, 1, 2, 4, 6, 9, 12, 16];
  const lowerAngles = [16, 12, 9, 6, 4, 2, 1, 0, 0, -1, -2, -4, -6, -9, -12, -16];

  const renderToothNode = (num: number, isUpper: boolean, indexInArch: number) => {
    const record = teethMap[num] || {
      toothNumber: num,
      fdiNumber: universalToFDI(num),
      name: `Tooth #${num}`,
      condition: 'Healthy',
    };

    const isSelected = selectedToothNumber === num;
    const condConfig = CONDITION_CONFIG[record.condition as ToothCondition] || CONDITION_CONFIG.Healthy;
    const yOffset = isUpper ? upperYOffsets[indexInArch] : lowerYOffsets[indexInArch];
    const angle = isUpper ? upperAngles[indexInArch] : lowerAngles[indexInArch];
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
        className="transition-all duration-300 ease-out flex flex-col items-center justify-center shrink-0 z-10"
      >
        <button
          type="button"
          id={`tooth-btn-${num}`}
          onClick={() => onSelectTooth(num)}
          title={`${getToothName(num)} (Universal #${num} / FDI ${record.fdiNumber}) - ${condConfig.label}`}
          className={`group relative flex flex-col items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all duration-200 text-center focus:outline-none min-w-[52px] sm:min-w-[58px] min-h-[125px] touch-manipulation cursor-pointer active:scale-95 ${
            isSelected
              ? 'ring-3 ring-[#3BA7F5] ring-offset-2 ring-offset-white bg-[#EBF7FC] border-2 border-[#3BA7F5] shadow-xl scale-110 z-30'
              : record.condition !== 'Healthy'
              ? `${condConfig.bgClass} ${condConfig.borderClass} hover:border-[#3BA7F5]/60 hover:scale-105 border-2 shadow-xs`
              : 'bg-white hover:bg-[#F8FAFC] border border-[#E8ECF3] hover:border-[#3BA7F5]/50 shadow-xs hover:scale-105'
          }`}
        >
          {/* Top FDI Header */}
          <div className="text-[12px] font-mono font-black text-zinc-900 group-hover:text-[#1E88A8] transition-colors flex items-center justify-center gap-0.5">
            <span className="text-[9px] text-zinc-400 font-normal">FDI</span>
            <span>{record.fdiNumber}</span>
          </div>

          {/* Anatomical Tooth Vector Icon */}
          <div className="my-1 relative w-9 h-14 flex items-center justify-center shrink-0">
            <AnatomicalToothSVG
              toothNumber={num}
              fdiNumber={record.fdiNumber}
              condition={record.condition as ToothCondition}
              isSelected={isSelected}
            />
          </div>

          {/* Universal Tooth Number Badge */}
          <div className="text-[10px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
            #{num}
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
        <div className="text-[8px] font-mono text-zinc-400 font-semibold uppercase mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {categoryLabelMap[category]?.split(' ')[0]}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-white p-4 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs text-zinc-900 overflow-hidden">
      {/* Chart Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#9a7814] font-black text-lg italic shadow-2xs">
            🦷
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
              <span>Anatomical Dental Arch Chart</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                FDI / Universal
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500 font-medium">
              Curved maxillary & mandibular arch mapping. Click any tooth to launch Tooth Desk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-600 bg-zinc-50 px-3.5 py-1.5 rounded-full border border-zinc-200 shadow-2xs">
          <span>Maxillary Upper (#1-16)</span>
          <span className="text-zinc-300">•</span>
          <span>Mandibular Lower (#17-32)</span>
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

        {/* Curved Anatomical Upper Arch Container */}
        <div className="overflow-x-auto pb-6 pt-3 min-w-0 scrollbar-thin">
          <div className="relative flex items-center justify-center min-w-[880px] px-4 py-8 bg-gradient-to-b from-amber-50/30 via-zinc-50/50 to-transparent rounded-3xl border border-zinc-200/80 shadow-2xs">
            {/* Background SVG Arch Arc Curve Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 880 180"
              preserveAspectRatio="none"
            >
              <path
                d="M 50,145 Q 440,20 830,145"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <line x1="440" y1="20" x2="440" y2="160" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3,3" />
            </svg>

            {/* Teeth Nodes in Arch Sequence */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 relative z-10">
              {upperArchSequence.map((num, idx) => (
                <React.Fragment key={num}>
                  {idx === 8 && (
                    <div className="flex flex-col items-center justify-center h-28 px-1.5 mx-1 border-x border-dashed border-[#D4AF37] bg-[#D4AF37]/10 rounded-xl shrink-0 z-20">
                      <span className="text-[9px] font-mono font-black text-[#9a7814] uppercase rotate-90 sm:rotate-0 tracking-widest px-1">
                        Midline
                      </span>
                    </div>
                  )}
                  {renderToothNode(num, true, idx)}
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

        {/* Curved Anatomical Lower Arch Container */}
        <div className="overflow-x-auto pt-6 pb-3 min-w-0 scrollbar-thin">
          <div className="relative flex items-center justify-center min-w-[880px] px-4 py-8 bg-gradient-to-t from-sky-50/30 via-zinc-50/50 to-transparent rounded-3xl border border-zinc-200/80 shadow-2xs">
            {/* Background SVG Arch Arc Curve Line */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
              viewBox="0 0 880 180"
              preserveAspectRatio="none"
            >
              <path
                d="M 50,35 Q 440,160 830,35"
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <line x1="440" y1="20" x2="440" y2="160" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
            </svg>

            {/* Teeth Nodes in Arch Sequence */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 relative z-10">
              {lowerArchSequence.map((num, idx) => (
                <React.Fragment key={num}>
                  {idx === 8 && (
                    <div className="flex flex-col items-center justify-center h-28 px-1.5 mx-1 border-x border-dashed border-sky-500 bg-sky-500/10 rounded-xl shrink-0 z-20">
                      <span className="text-[9px] font-mono font-black text-sky-800 uppercase rotate-90 sm:rotate-0 tracking-widest px-1">
                        Midline
                      </span>
                    </div>
                  )}
                  {renderToothNode(num, false, idx)}
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

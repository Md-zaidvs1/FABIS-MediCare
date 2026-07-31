import React from 'react';
import { ToothSurface } from '../../types';

interface SurfaceSelectorProps {
  toothNumber: number;
  toothName: string;
  selectedSurfaces: ToothSurface[];
  onChangeSurfaces: (surfaces: ToothSurface[]) => void;
}

export const SurfaceSelector: React.FC<SurfaceSelectorProps> = ({
  toothNumber,
  toothName,
  selectedSurfaces = [],
  onChangeSurfaces,
}) => {
  const isMolarOrPremolar = [1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 28, 29, 30, 31, 32].includes(
    toothNumber
  );

  const centerLabel = isMolarOrPremolar ? 'O' : 'I'; // Occlusal vs Incisal

  const toggleSurface = (surface: ToothSurface) => {
    if (selectedSurfaces.includes(surface)) {
      onChangeSurfaces(selectedSurfaces.filter((s) => s !== surface));
    } else {
      onChangeSurfaces([...selectedSurfaces, surface]);
    }
  };

  const getSurfaceClass = (surface: ToothSurface) => {
    const active = selectedSurfaces.includes(surface);
    return active
      ? 'bg-rose-500 text-white font-black shadow-md border-rose-600 scale-105'
      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold border-zinc-300';
  };

  return (
    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">Surface Charting</span>
          <span className="text-xs font-bold text-zinc-800">
            Tooth #{toothNumber} ({toothName})
          </span>
        </div>
        <div className="text-[10px] font-mono font-bold text-[#b89323] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          {selectedSurfaces.length > 0 ? selectedSurfaces.join('-') : 'Whole Tooth'}
        </div>
      </div>

      {/* Visual Surface Diagram Cross Layout */}
      <div className="flex flex-col items-center justify-center gap-1.5 my-2">
        {/* Top: Facial / Buccal */}
        <button
          type="button"
          onClick={() => toggleSurface('F')}
          className={`w-20 py-1.5 rounded-lg text-xs transition-all border flex items-center justify-center gap-1 cursor-pointer ${getSurfaceClass(
            'F'
          )}`}
          title="Facial / Buccal Surface"
        >
          <span>Facial (F)</span>
        </button>

        {/* Middle Row: Mesial - Occlusal/Incisal - Distal */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleSurface('M')}
            className={`w-16 py-2 rounded-lg text-xs transition-all border flex items-center justify-center gap-1 cursor-pointer ${getSurfaceClass(
              'M'
            )}`}
            title="Mesial Surface"
          >
            <span>Mesial (M)</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSurface(centerLabel as ToothSurface)}
            className={`w-16 py-2 rounded-lg text-xs transition-all border flex items-center justify-center gap-1 cursor-pointer ${getSurfaceClass(
              centerLabel as ToothSurface
            )}`}
            title={isMolarOrPremolar ? 'Occlusal Surface' : 'Incisal Surface'}
          >
            <span>{centerLabel === 'O' ? 'Occlusal (O)' : 'Incisal (I)'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSurface('D')}
            className={`w-16 py-2 rounded-lg text-xs transition-all border flex items-center justify-center gap-1 cursor-pointer ${getSurfaceClass(
              'D'
            )}`}
            title="Distal Surface"
          >
            <span>Distal (D)</span>
          </button>
        </div>

        {/* Bottom: Lingual / Palatal */}
        <button
          type="button"
          onClick={() => toggleSurface('L')}
          className={`w-20 py-1.5 rounded-lg text-xs transition-all border flex items-center justify-center gap-1 cursor-pointer ${getSurfaceClass(
            'L'
          )}`}
          title="Lingual / Palatal Surface"
        >
          <span>Lingual (L)</span>
        </button>
      </div>

      {/* Surface Badges Legend */}
      <div className="flex flex-wrap items-center justify-center gap-1 pt-1 border-t border-zinc-200/60 text-[10px]">
        {['M', centerLabel, 'D', 'F', 'L'].map((surf) => {
          const isSel = selectedSurfaces.includes(surf as ToothSurface);
          return (
            <button
              key={surf}
              type="button"
              onClick={() => toggleSurface(surf as ToothSurface)}
              className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                isSel
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-300'
              }`}
            >
              {isSel ? '✓ ' : '+ '}
              {surf}
            </button>
          );
        })}
      </div>
    </div>
  );
};

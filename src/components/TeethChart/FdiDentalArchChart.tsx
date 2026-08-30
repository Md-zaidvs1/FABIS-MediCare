import React, { useState } from 'react';
import { ToothRecord, ToothCondition } from '../../types';
import { universalToFDI, fdiToUniversal, getToothName, isPrimaryTooth } from '../../utils/formatters';

interface FdiDentalArchChartProps {
  teethMap: Record<number, ToothRecord>;
  selectedFdiNumber: number | null;
  onSelectTooth: (fdiNumber: number) => void;
  readOnly?: boolean;
  activeMode?: 'adult' | 'child';
  onModeChange?: (mode: 'adult' | 'child') => void;
}

interface ToothArchCoord {
  fdi: number;
  univ: number | string;
  palmer: number | string;
  quadrant: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  x: number;
  y: number;
  angle: number;
  type: 'molar' | 'premolar' | 'canine' | 'incisor_central' | 'incisor_lateral';
  width: number;
  height: number;
  outerNumX: number;
  outerNumY: number;
  innerNumX: number;
  innerNumY: number;
}

// -------------------------------------------------------------
// ADULT PERMANENT DENTITION COORDINATES (32 TEETH)
// Precise anatomical parabolic arch matching the reference image
// -------------------------------------------------------------
const ADULT_TOOTH_COORDS: ToothArchCoord[] = [
  // ==========================================
  // UPPER RIGHT QUADRANT 1 (FDI 18 -> 11)
  // ==========================================
  {
    fdi: 18,
    univ: 1,
    palmer: 8,
    quadrant: 1,
    x: 215,
    y: 382,
    angle: -26,
    type: 'molar',
    width: 38,
    height: 34,
    outerNumX: 172,
    outerNumY: 385,
    innerNumX: 254,
    innerNumY: 380,
  },
  {
    fdi: 17,
    univ: 2,
    palmer: 7,
    quadrant: 1,
    x: 228,
    y: 334,
    angle: -22,
    type: 'molar',
    width: 41,
    height: 37,
    outerNumX: 180,
    outerNumY: 334,
    innerNumX: 272,
    innerNumY: 335,
  },
  {
    fdi: 16,
    univ: 3,
    palmer: 6,
    quadrant: 1,
    x: 242,
    y: 280,
    angle: -18,
    type: 'molar',
    width: 43,
    height: 39,
    outerNumX: 192,
    outerNumY: 278,
    innerNumX: 288,
    innerNumY: 283,
  },
  {
    fdi: 15,
    univ: 4,
    palmer: 5,
    quadrant: 1,
    x: 260,
    y: 228,
    angle: -14,
    type: 'premolar',
    width: 32,
    height: 29,
    outerNumX: 206,
    outerNumY: 225,
    innerNumX: 304,
    innerNumY: 234,
  },
  {
    fdi: 14,
    univ: 5,
    palmer: 4,
    quadrant: 1,
    x: 282,
    y: 182,
    angle: -10,
    type: 'premolar',
    width: 33,
    height: 30,
    outerNumX: 232,
    outerNumY: 175,
    innerNumX: 324,
    innerNumY: 192,
  },
  {
    fdi: 13,
    univ: 6,
    palmer: 3,
    quadrant: 1,
    x: 312,
    y: 144,
    angle: -6,
    type: 'canine',
    width: 29,
    height: 27,
    outerNumX: 268,
    outerNumY: 130,
    innerNumX: 345,
    innerNumY: 162,
  },
  {
    fdi: 12,
    univ: 7,
    palmer: 2,
    quadrant: 1,
    x: 345,
    y: 118,
    angle: -3,
    type: 'incisor_lateral',
    width: 26,
    height: 22,
    outerNumX: 315,
    outerNumY: 96,
    innerNumX: 364,
    innerNumY: 142,
  },
  {
    fdi: 11,
    univ: 8,
    palmer: 1,
    quadrant: 1,
    x: 376,
    y: 104,
    angle: 0,
    type: 'incisor_central',
    width: 30,
    height: 23,
    outerNumX: 366,
    outerNumY: 76,
    innerNumX: 378,
    innerNumY: 132,
  },

  // ==========================================
  // UPPER LEFT QUADRANT 2 (FDI 21 -> 28)
  // ==========================================
  {
    fdi: 21,
    univ: 9,
    palmer: 1,
    quadrant: 2,
    x: 414,
    y: 104,
    angle: 0,
    type: 'incisor_central',
    width: 30,
    height: 23,
    outerNumX: 424,
    outerNumY: 76,
    innerNumX: 412,
    innerNumY: 132,
  },
  {
    fdi: 22,
    univ: 10,
    palmer: 2,
    quadrant: 2,
    x: 445,
    y: 118,
    angle: 3,
    type: 'incisor_lateral',
    width: 26,
    height: 22,
    outerNumX: 475,
    outerNumY: 96,
    innerNumX: 426,
    innerNumY: 142,
  },
  {
    fdi: 23,
    univ: 11,
    palmer: 3,
    quadrant: 2,
    x: 478,
    y: 144,
    angle: 6,
    type: 'canine',
    width: 29,
    height: 27,
    outerNumX: 522,
    outerNumY: 130,
    innerNumX: 445,
    innerNumY: 162,
  },
  {
    fdi: 24,
    univ: 12,
    palmer: 4,
    quadrant: 2,
    x: 508,
    y: 182,
    angle: 10,
    type: 'premolar',
    width: 33,
    height: 30,
    outerNumX: 558,
    outerNumY: 175,
    innerNumX: 466,
    innerNumY: 192,
  },
  {
    fdi: 25,
    univ: 13,
    palmer: 5,
    quadrant: 2,
    x: 530,
    y: 228,
    angle: 14,
    type: 'premolar',
    width: 32,
    height: 29,
    outerNumX: 584,
    outerNumY: 225,
    innerNumX: 486,
    innerNumY: 234,
  },
  {
    fdi: 26,
    univ: 14,
    palmer: 6,
    quadrant: 2,
    x: 548,
    y: 280,
    angle: 18,
    type: 'molar',
    width: 43,
    height: 39,
    outerNumX: 598,
    outerNumY: 278,
    innerNumX: 502,
    innerNumY: 283,
  },
  {
    fdi: 27,
    univ: 15,
    palmer: 7,
    quadrant: 2,
    x: 562,
    y: 334,
    angle: 22,
    type: 'molar',
    width: 41,
    height: 37,
    outerNumX: 610,
    outerNumY: 334,
    innerNumX: 518,
    innerNumY: 335,
  },
  {
    fdi: 28,
    univ: 16,
    palmer: 8,
    quadrant: 2,
    x: 575,
    y: 382,
    angle: 26,
    type: 'molar',
    width: 38,
    height: 34,
    outerNumX: 618,
    outerNumY: 385,
    innerNumX: 536,
    innerNumY: 380,
  },

  // ==========================================
  // LOWER RIGHT QUADRANT 4 (FDI 48 -> 41)
  // ==========================================
  {
    fdi: 48,
    univ: 32,
    palmer: 8,
    quadrant: 4,
    x: 215,
    y: 506,
    angle: 26,
    type: 'molar',
    width: 38,
    height: 34,
    outerNumX: 172,
    outerNumY: 502,
    innerNumX: 254,
    innerNumY: 508,
  },
  {
    fdi: 47,
    univ: 31,
    palmer: 7,
    quadrant: 4,
    x: 228,
    y: 554,
    angle: 22,
    type: 'molar',
    width: 41,
    height: 37,
    outerNumX: 180,
    outerNumY: 554,
    innerNumX: 272,
    innerNumY: 553,
  },
  {
    fdi: 46,
    univ: 30,
    palmer: 6,
    quadrant: 4,
    x: 242,
    y: 608,
    angle: 18,
    type: 'molar',
    width: 43,
    height: 39,
    outerNumX: 192,
    outerNumY: 610,
    innerNumX: 288,
    innerNumY: 605,
  },
  {
    fdi: 45,
    univ: 29,
    palmer: 5,
    quadrant: 4,
    x: 260,
    y: 660,
    angle: 14,
    type: 'premolar',
    width: 32,
    height: 29,
    outerNumX: 206,
    outerNumY: 663,
    innerNumX: 304,
    innerNumY: 654,
  },
  {
    fdi: 44,
    univ: 28,
    palmer: 4,
    quadrant: 4,
    x: 282,
    y: 706,
    angle: 10,
    type: 'premolar',
    width: 33,
    height: 30,
    outerNumX: 232,
    outerNumY: 713,
    innerNumX: 324,
    innerNumY: 696,
  },
  {
    fdi: 43,
    univ: 27,
    palmer: 3,
    quadrant: 4,
    x: 312,
    y: 744,
    angle: 6,
    type: 'canine',
    width: 29,
    height: 27,
    outerNumX: 268,
    outerNumY: 758,
    innerNumX: 345,
    innerNumY: 726,
  },
  {
    fdi: 42,
    univ: 26,
    palmer: 2,
    quadrant: 4,
    x: 345,
    y: 770,
    angle: 3,
    type: 'incisor_lateral',
    width: 25,
    height: 21,
    outerNumX: 315,
    outerNumY: 792,
    innerNumX: 364,
    innerNumY: 746,
  },
  {
    fdi: 41,
    univ: 25,
    palmer: 1,
    quadrant: 4,
    x: 376,
    y: 784,
    angle: 0,
    type: 'incisor_central',
    width: 27,
    height: 21,
    outerNumX: 366,
    outerNumY: 812,
    innerNumX: 378,
    innerNumY: 756,
  },

  // ==========================================
  // LOWER LEFT QUADRANT 3 (FDI 31 -> 38)
  // ==========================================
  {
    fdi: 31,
    univ: 24,
    palmer: 1,
    quadrant: 3,
    x: 414,
    y: 784,
    angle: 0,
    type: 'incisor_central',
    width: 27,
    height: 21,
    outerNumX: 424,
    outerNumY: 812,
    innerNumX: 412,
    innerNumY: 756,
  },
  {
    fdi: 32,
    univ: 23,
    palmer: 2,
    quadrant: 3,
    x: 445,
    y: 770,
    angle: -3,
    type: 'incisor_lateral',
    width: 25,
    height: 21,
    outerNumX: 475,
    outerNumY: 792,
    innerNumX: 426,
    innerNumY: 746,
  },
  {
    fdi: 33,
    univ: 22,
    palmer: 3,
    quadrant: 3,
    x: 478,
    y: 744,
    angle: -6,
    type: 'canine',
    width: 29,
    height: 27,
    outerNumX: 522,
    outerNumY: 758,
    innerNumX: 445,
    innerNumY: 726,
  },
  {
    fdi: 34,
    univ: 21,
    palmer: 4,
    quadrant: 3,
    x: 508,
    y: 706,
    angle: -10,
    type: 'premolar',
    width: 33,
    height: 30,
    outerNumX: 558,
    outerNumY: 713,
    innerNumX: 466,
    innerNumY: 696,
  },
  {
    fdi: 35,
    univ: 20,
    palmer: 5,
    quadrant: 3,
    x: 530,
    y: 660,
    angle: -14,
    type: 'premolar',
    width: 32,
    height: 29,
    outerNumX: 584,
    outerNumY: 663,
    innerNumX: 486,
    innerNumY: 654,
  },
  {
    fdi: 36,
    univ: 19,
    palmer: 6,
    quadrant: 3,
    x: 548,
    y: 608,
    angle: -18,
    type: 'molar',
    width: 43,
    height: 39,
    outerNumX: 598,
    outerNumY: 610,
    innerNumX: 502,
    innerNumY: 605,
  },
  {
    fdi: 37,
    univ: 18,
    palmer: 7,
    quadrant: 3,
    x: 562,
    y: 554,
    angle: -22,
    type: 'molar',
    width: 41,
    height: 37,
    outerNumX: 610,
    outerNumY: 554,
    innerNumX: 518,
    innerNumY: 553,
  },
  {
    fdi: 38,
    univ: 17,
    palmer: 8,
    quadrant: 3,
    x: 575,
    y: 506,
    angle: -26,
    type: 'molar',
    width: 38,
    height: 34,
    outerNumX: 618,
    outerNumY: 502,
    innerNumX: 536,
    innerNumY: 508,
  },
];

// -------------------------------------------------------------
// PRIMARY DECIDUOUS DENTITION COORDINATES (20 TEETH)
// -------------------------------------------------------------
const CHILD_TOOTH_COORDS: ToothArchCoord[] = [
  // Upper Right (55 -> 51)
  { fdi: 55, univ: 'A', palmer: 'E', quadrant: 5, x: 250, y: 310, angle: -20, type: 'molar', width: 38, height: 34, outerNumX: 200, outerNumY: 310, innerNumX: 295, innerNumY: 310 },
  { fdi: 54, univ: 'B', palmer: 'D', quadrant: 5, x: 275, y: 245, angle: -14, type: 'molar', width: 36, height: 32, outerNumX: 225, outerNumY: 240, innerNumX: 315, innerNumY: 250 },
  { fdi: 53, univ: 'C', palmer: 'C', quadrant: 5, x: 308, y: 185, angle: -8, type: 'canine', width: 28, height: 26, outerNumX: 265, outerNumY: 170, innerNumX: 345, innerNumY: 200 },
  { fdi: 52, univ: 'D', palmer: 'B', quadrant: 5, x: 344, y: 140, angle: -4, type: 'incisor_lateral', width: 26, height: 22, outerNumX: 310, outerNumY: 115, innerNumX: 365, innerNumY: 165 },
  { fdi: 51, univ: 'E', palmer: 'A', quadrant: 5, x: 378, y: 120, angle: 0, type: 'incisor_central', width: 30, height: 23, outerNumX: 366, outerNumY: 88, innerNumX: 380, innerNumY: 150 },

  // Upper Left (61 -> 65)
  { fdi: 61, univ: 'F', palmer: 'A', quadrant: 6, x: 412, y: 120, angle: 0, type: 'incisor_central', width: 30, height: 23, outerNumX: 424, outerNumY: 88, innerNumX: 410, innerNumY: 150 },
  { fdi: 62, univ: 'G', palmer: 'B', quadrant: 6, x: 446, y: 140, angle: 4, type: 'incisor_lateral', width: 26, height: 22, outerNumX: 480, outerNumY: 115, innerNumX: 425, innerNumY: 165 },
  { fdi: 63, univ: 'H', palmer: 'C', quadrant: 6, x: 482, y: 185, angle: 8, type: 'canine', width: 28, height: 26, outerNumX: 525, outerNumY: 170, innerNumX: 445, innerNumY: 200 },
  { fdi: 64, univ: 'I', palmer: 'D', quadrant: 6, x: 515, y: 245, angle: 14, type: 'molar', width: 36, height: 32, outerNumX: 565, outerNumY: 240, innerNumX: 475, innerNumY: 250 },
  { fdi: 65, univ: 'J', palmer: 'E', quadrant: 6, x: 540, y: 310, angle: 20, type: 'molar', width: 38, height: 34, outerNumX: 590, outerNumY: 310, innerNumX: 495, innerNumY: 310 },

  // Lower Right (85 -> 81)
  { fdi: 85, univ: 'T', palmer: 'E', quadrant: 8, x: 250, y: 578, angle: 20, type: 'molar', width: 38, height: 34, outerNumX: 200, outerNumY: 578, innerNumX: 295, innerNumY: 578 },
  { fdi: 84, univ: 'S', palmer: 'D', quadrant: 8, x: 275, y: 643, angle: 14, type: 'molar', width: 36, height: 32, outerNumX: 225, outerNumY: 648, innerNumX: 315, innerNumY: 638 },
  { fdi: 83, univ: 'R', palmer: 'C', quadrant: 8, x: 308, y: 703, angle: 8, type: 'canine', width: 28, height: 26, outerNumX: 265, outerNumY: 718, innerNumX: 345, innerNumY: 688 },
  { fdi: 82, univ: 'Q', palmer: 'B', quadrant: 8, x: 344, y: 748, angle: 4, type: 'incisor_lateral', width: 26, height: 22, outerNumX: 310, outerNumY: 773, innerNumX: 365, innerNumY: 723 },
  { fdi: 81, univ: 'P', palmer: 'A', quadrant: 8, x: 378, y: 768, angle: 0, type: 'incisor_central', width: 30, height: 23, outerNumX: 366, outerNumY: 800, innerNumX: 380, innerNumY: 738 },

  // Lower Left (71 -> 75)
  { fdi: 71, univ: 'O', palmer: 'A', quadrant: 7, x: 412, y: 768, angle: 0, type: 'incisor_central', width: 30, height: 23, outerNumX: 424, outerNumY: 800, innerNumX: 410, innerNumY: 738 },
  { fdi: 72, univ: 'N', palmer: 'B', quadrant: 7, x: 446, y: 748, angle: -4, type: 'incisor_lateral', width: 26, height: 22, outerNumX: 480, outerNumY: 773, innerNumX: 425, innerNumY: 723 },
  { fdi: 73, univ: 'M', palmer: 'C', quadrant: 7, x: 482, y: 703, angle: -8, type: 'canine', width: 28, height: 26, outerNumX: 525, outerNumY: 718, innerNumX: 445, innerNumY: 688 },
  { fdi: 74, univ: 'L', palmer: 'D', quadrant: 7, x: 515, y: 643, angle: -14, type: 'molar', width: 36, height: 32, outerNumX: 565, outerNumY: 648, innerNumX: 475, innerNumY: 638 },
  { fdi: 75, univ: 'K', palmer: 'E', quadrant: 7, x: 540, y: 578, angle: -20, type: 'molar', width: 38, height: 34, outerNumX: 590, outerNumY: 578, innerNumX: 495, innerNumY: 578 },
];

export const FdiDentalArchChart: React.FC<FdiDentalArchChartProps> = ({
  teethMap,
  selectedFdiNumber,
  onSelectTooth,
  readOnly = false,
  activeMode = 'adult',
  onModeChange,
}) => {
  const [hoveredTooth, setHoveredTooth] = useState<ToothArchCoord | null>(null);
  const [internalMode, setInternalMode] = useState<'adult' | 'child'>(activeMode);

  const currentMode = onModeChange ? activeMode : internalMode;

  const handleModeSelect = (mode: 'adult' | 'child') => {
    if (onModeChange) {
      onModeChange(mode);
    } else {
      setInternalMode(mode);
    }
  };

  const activeCoords = currentMode === 'adult' ? ADULT_TOOTH_COORDS : CHILD_TOOTH_COORDS;

  // Helper to render individual 3D occlusal tooth
  const renderOcclusalTooth = (tooth: ToothArchCoord) => {
    const univNum = typeof tooth.univ === 'number' ? tooth.univ : tooth.fdi;
    const record = teethMap[univNum] || teethMap[tooth.fdi] || {
      toothNumber: typeof tooth.univ === 'number' ? tooth.univ : tooth.fdi,
      fdiNumber: tooth.fdi,
      condition: 'Healthy',
    };

    const isSelected = selectedFdiNumber === tooth.fdi;
    const isHovered = hoveredTooth?.fdi === tooth.fdi;
    const cond = record.condition as ToothCondition || 'Healthy';

    const halfW = tooth.width / 2;
    const halfH = tooth.height / 2;

    return (
      <g
        key={tooth.fdi}
        transform={`translate(${tooth.x}, ${tooth.y}) rotate(${tooth.angle})`}
        onClick={() => !readOnly && onSelectTooth(tooth.fdi)}
        onMouseEnter={() => setHoveredTooth(tooth)}
        onMouseLeave={() => setHoveredTooth(null)}
        className="cursor-pointer group select-none"
        id={`tooth-fdi-${tooth.fdi}`}
      >
        {/* Selection & Hover Glow Effect */}
        {isSelected && (
          <ellipse
            cx="0"
            cy="0"
            rx={halfW + 7}
            ry={halfH + 7}
            fill="none"
            stroke="#38BDF8"
            strokeWidth="3.5"
            className="animate-pulse"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.9))',
            }}
          />
        )}
        {isHovered && !isSelected && (
          <ellipse
            cx="0"
            cy="0"
            rx={halfW + 4}
            ry={halfH + 4}
            fill="rgba(56, 189, 248, 0.2)"
            stroke="#38BDF8"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />
        )}

        {/* Anatomical 3D Occlusal Tooth Shape Based on Category */}
        {tooth.type === 'molar' && (
          <g>
            {/* Base Molar Body */}
            <rect
              x={-halfW}
              y={-halfH}
              width={tooth.width}
              height={tooth.height}
              rx={12}
              fill={cond === 'Missing' ? 'url(#fdi-missing-grad)' : cond === 'Crown' ? 'url(#fdi-crown-grad)' : 'url(#fdi-enamel-molar-grad)'}
              stroke={isSelected ? '#38BDF8' : '#B8A898'}
              strokeWidth="1.2"
              filter="url(#fdi-drop-shadow)"
            />
            {/* Cusps Contours & Fissures */}
            {cond !== 'Missing' && (
              <>
                {/* 4 Occlusal Cusps Depressions */}
                <path
                  d={`M ${-halfW + 4},0 Q 0,0 0,${-halfH + 4} M 0,${-halfH + 4} Q 0,0 ${halfW - 4},0 M ${halfW - 4},0 Q 0,0 0,${halfH - 4} M 0,${halfH - 4} Q 0,0 ${-halfW + 4},0`}
                  fill="none"
                  stroke="#9C8775"
                  strokeWidth="1"
                  opacity="0.8"
                />
                {/* Central Pit */}
                <circle cx="0" cy="0" r="2.5" fill="#846F5D" opacity="0.6" />
                {/* Enamel Gloss Specular Reflection */}
                <ellipse cx={-halfW * 0.35} cy={-halfH * 0.35} rx={halfW * 0.35} ry={halfH * 0.25} fill="#FFFFFF" opacity="0.6" />
              </>
            )}
          </g>
        )}

        {tooth.type === 'premolar' && (
          <g>
            {/* Base Premolar Bicuspid Body */}
            <rect
              x={-halfW}
              y={-halfH}
              width={tooth.width}
              height={tooth.height}
              rx={10}
              fill={cond === 'Missing' ? 'url(#fdi-missing-grad)' : cond === 'Crown' ? 'url(#fdi-crown-grad)' : 'url(#fdi-enamel-premolar-grad)'}
              stroke={isSelected ? '#38BDF8' : '#B8A898'}
              strokeWidth="1.2"
              filter="url(#fdi-drop-shadow)"
            />
            {/* Central Developmental Groove */}
            {cond !== 'Missing' && (
              <>
                <line x1={-halfW + 5} y1="0" x2={halfW - 5} y2="0" stroke="#9C8775" strokeWidth="1.2" opacity="0.8" />
                <circle cx={-halfW + 6} cy="0" r="1.5" fill="#846F5D" />
                <circle cx={halfW - 6} cy="0" r="1.5" fill="#846F5D" />
                {/* Specular */}
                <ellipse cx={0} cy={-halfH * 0.3} rx={halfW * 0.4} ry={halfH * 0.25} fill="#FFFFFF" opacity="0.6" />
              </>
            )}
          </g>
        )}

        {tooth.type === 'canine' && (
          <g>
            {/* Pointed Canine Contour */}
            <path
              d={`M 0,${-halfH} C ${halfW},${-halfH * 0.5} ${halfW},${halfH * 0.6} 0,${halfH} C ${-halfW},${halfH * 0.6} ${-halfW},${-halfH * 0.5} 0,${-halfH} Z`}
              fill={cond === 'Missing' ? 'url(#fdi-missing-grad)' : cond === 'Crown' ? 'url(#fdi-crown-grad)' : 'url(#fdi-enamel-canine-grad)'}
              stroke={isSelected ? '#38BDF8' : '#B8A898'}
              strokeWidth="1.2"
              filter="url(#fdi-drop-shadow)"
            />
            {cond !== 'Missing' && (
              <>
                {/* Labial Ridge & Cingulum */}
                <line x1="0" y1={-halfH + 3} x2="0" y2={halfH - 4} stroke="#9C8775" strokeWidth="1" opacity="0.6" />
                <ellipse cx="0" cy={-halfH * 0.2} rx={halfW * 0.35} ry={halfH * 0.3} fill="#FFFFFF" opacity="0.6" />
              </>
            )}
          </g>
        )}

        {(tooth.type === 'incisor_central' || tooth.type === 'incisor_lateral') && (
          <g>
            {/* Incisal Chisel Contour */}
            <path
              d={`M ${-halfW + 3},${-halfH} Q 0,${-halfH - 1} ${halfW - 3},${-halfH} C ${halfW + 1},0 ${halfW - 2},${halfH} 0,${halfH} C ${-halfW + 2},${halfH} ${-halfW - 1},0 ${-halfW + 3},${-halfH} Z`}
              fill={cond === 'Missing' ? 'url(#fdi-missing-grad)' : cond === 'Crown' ? 'url(#fdi-crown-grad)' : 'url(#fdi-enamel-incisor-grad)'}
              stroke={isSelected ? '#38BDF8' : '#B8A898'}
              strokeWidth="1.2"
              filter="url(#fdi-drop-shadow)"
            />
            {cond !== 'Missing' && (
              <>
                {/* Incisal Edge Line */}
                <line x1={-halfW + 5} y1={-halfH + 2} x2={halfW - 5} y2={-halfH + 2} stroke="#FFFFFF" strokeWidth="1.5" opacity="0.8" />
                <ellipse cx="0" cy={0} rx={halfW * 0.35} ry={halfH * 0.25} fill="#FFFFFF" opacity="0.5" />
              </>
            )}
          </g>
        )}

        {/* Condition Clinical Markings */}
        {cond === 'Caries' && (
          <circle cx="0" cy="0" r="4" fill="#78350F" stroke="#451A03" strokeWidth="1" />
        )}
        {cond === 'Filling' && (
          <circle cx="0" cy="0" r="4.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
        )}
        {cond === 'RCT_Done' && (
          <circle cx="0" cy="0" r="4" fill="#9333EA" stroke="#581C87" strokeWidth="1.2" />
        )}
        {cond === 'RCT_Needed' && (
          <circle cx="0" cy="0" r="4" fill="#E11D48" stroke="#881337" strokeWidth="1.2" />
        )}
        {cond === 'Missing' && (
          <g>
            <line x1={-halfW + 4} y1={-halfH + 4} x2={halfW - 4} y2={halfH - 4} stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <line x1={halfW - 4} y1={-halfH + 4} x2={-halfW + 4} y2={halfH - 4} stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {cond === 'Implant' && (
          <g>
            <circle cx="0" cy="0" r="5" fill="#64748B" stroke="#0F172A" strokeWidth="1.5" />
            <polygon points="-2,-2 2,-2 3,0 2,2 -2,2 -3,0" fill="#CBD5E1" />
          </g>
        )}

        {/* FDI 2-Digit Number Printed Directly inside the Tooth Crown (Red / Coral) */}
        {cond !== 'Missing' ? (
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#DC2626"
            fontSize={tooth.type === 'molar' ? '12.5' : tooth.type === 'premolar' ? '11.5' : '10.5'}
            fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif"
            style={{
              filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.9)) drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
              pointerEvents: 'none',
            }}
          >
            {tooth.fdi}
          </text>
        ) : (
          <text
            x="0"
            y="3.5"
            textAnchor="middle"
            fill="#EF4444"
            fontSize="10"
            fontWeight="900"
            style={{ pointerEvents: 'none' }}
          >
            ✕
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full bg-[#0C0E14] text-white rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-800/90 shadow-2xl overflow-hidden relative">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2 pb-3 border-b border-slate-800/60">
        <div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
            <span>FDI Dental Chart</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold">
              Permanent Dentition
            </span>
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Anatomical Maxillary & Mandibular Arch mapping • FDI / Universal / Palmer Tri-System
          </p>
        </div>

        {/* Dentition Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700/70">
          <button
            type="button"
            onClick={() => handleModeSelect('adult')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentMode === 'adult'
                ? 'bg-sky-500 text-white shadow-xs font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Adult (32 Permanent)
          </button>
          <button
            type="button"
            onClick={() => handleModeSelect('child')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentMode === 'child'
                ? 'bg-sky-500 text-white shadow-xs font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Child (20 Primary)
          </button>
        </div>
      </div>

      {/* Main SVG Dental Stage */}
      <div className="w-full flex justify-center items-center py-2 overflow-x-auto">
        <div className="min-w-[620px] max-w-[780px] w-full aspect-[780/890] relative select-none">
          <svg
            viewBox="0 0 780 890"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Drop Shadows */}
              <filter id="fdi-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5" />
              </filter>
              <filter id="fdi-gum-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
              </filter>

              {/* Tooth Enamel 3D Gradients */}
              <radialGradient id="fdi-enamel-molar-grad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="45%" stopColor="#FFFDF7" />
                <stop offset="80%" stopColor="#EDE1D1" />
                <stop offset="100%" stopColor="#D4C1AE" />
              </radialGradient>

              <radialGradient id="fdi-enamel-premolar-grad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="50%" stopColor="#FFFDF7" />
                <stop offset="85%" stopColor="#EDE1D1" />
                <stop offset="100%" stopColor="#D4C1AE" />
              </radialGradient>

              <radialGradient id="fdi-enamel-canine-grad" cx="45%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="55%" stopColor="#FFFDF7" />
                <stop offset="90%" stopColor="#EDE1D1" />
                <stop offset="100%" stopColor="#D4C1AE" />
              </radialGradient>

              <radialGradient id="fdi-enamel-incisor-grad" cx="50%" cy="25%" r="70%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#FFFDF7" />
                <stop offset="90%" stopColor="#EDE1D1" />
                <stop offset="100%" stopColor="#D4C1AE" />
              </radialGradient>

              {/* Special Conditions Gradients */}
              <linearGradient id="fdi-crown-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#CA8A04" />
              </linearGradient>

              <linearGradient id="fdi-missing-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* Realistic Coral Gum Tissue Gradients */}
              <radialGradient id="fdi-maxillary-gum-grad" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#E89297" />
                <stop offset="50%" stopColor="#DE7B81" />
                <stop offset="85%" stopColor="#C95F66" />
                <stop offset="100%" stopColor="#B34B52" />
              </radialGradient>

              <radialGradient id="fdi-mandibular-gum-grad" cx="50%" cy="70%" r="70%">
                <stop offset="0%" stopColor="#E89297" />
                <stop offset="50%" stopColor="#DE7B81" />
                <stop offset="85%" stopColor="#C95F66" />
                <stop offset="100%" stopColor="#B34B52" />
              </radialGradient>
            </defs>

            {/* =========================================================
                TITLE & QUADRANT HEADERS (Exact Typography from Image)
            ========================================================= */}
            {/* Top Center Title */}
            <text
              x="390"
              y="32"
              textAnchor="middle"
              fill="#F1F5F9"
              fontSize="20"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="0.5"
            >
              for permanent dentition
            </text>

            {/* Upper Quadrant Labels */}
            <text
              x="45"
              y="108"
              fill="#E2E8F0"
              fontSize="14"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Upper right quadrant
            </text>
            <text
              x="735"
              y="108"
              textAnchor="end"
              fill="#E2E8F0"
              fontSize="14"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Upper left quadrant
            </text>

            {/* Middle Arch Labels */}
            <text
              x="45"
              y="438"
              fill="#F8FAFC"
              fontSize="16"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Maxillary arch
            </text>
            <text
              x="735"
              y="472"
              textAnchor="end"
              fill="#F8FAFC"
              fontSize="16"
              fontWeight="800"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Mandibular arch
            </text>

            {/* Lower Quadrant Labels */}
            <text
              x="45"
              y="840"
              fill="#E2E8F0"
              fontSize="14"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Lower right quadrant
            </text>
            <text
              x="735"
              y="840"
              textAnchor="end"
              fill="#E2E8F0"
              fontSize="14"
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Lower left quadrant
            </text>

            {/* =========================================================
                MAXILLARY ARCH GINGIVAL BASE (Palate + Alveolar Ridge)
            ========================================================= */}
            <path
              d="M 180,410 C 170,270 240,80 390,70 C 540,80 610,270 600,410 C 560,400 510,260 480,210 C 440,150 340,150 300,210 C 270,260 220,400 180,410 Z"
              fill="url(#fdi-maxillary-gum-grad)"
              stroke="#A83E45"
              strokeWidth="2"
              filter="url(#fdi-gum-shadow)"
            />
            {/* Palatal Rugae Texture Lines */}
            <path
              d="M 330,195 Q 390,175 450,195 M 340,225 Q 390,205 440,225 M 355,255 Q 390,240 425,255 M 365,285 Q 390,275 415,285"
              fill="none"
              stroke="#BE535A"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* =========================================================
                MANDIBULAR ARCH GINGIVAL BASE (Horseshoe Ridge)
            ========================================================= */}
            <path
              d="M 180,475 C 170,615 240,805 390,815 C 540,805 610,615 600,475 C 560,485 510,625 480,675 C 440,735 340,735 300,675 C 270,625 220,485 180,475 Z"
              fill="url(#fdi-mandibular-gum-grad)"
              stroke="#A83E45"
              strokeWidth="2"
              filter="url(#fdi-gum-shadow)"
            />

            {/* =========================================================
                AXIS DIVIDERS (Vertical Midline & Horizontal Arch Divider)
            ========================================================= */}
            {/* Vertical Midline */}
            <line
              x1="390"
              y1="50"
              x2="390"
              y2="835"
              stroke="#E2E8F0"
              strokeWidth="1.5"
              opacity="0.8"
            />

            {/* Horizontal Arch Separator Line */}
            <line
              x1="45"
              y1="445"
              x2="735"
              y2="445"
              stroke="#E2E8F0"
              strokeWidth="1.8"
              opacity="0.9"
            />

            {/* =========================================================
                GREEN PALMER QUADRANT BRACKETS AT MIDLINE
            ========================================================= */}
            {/* Upper Right Quadrant 1 Symbol ( ┘ ) */}
            <path
              d="M 345,420 L 380,420 L 380,380"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Upper Left Quadrant 2 Symbol ( └ ) */}
            <path
              d="M 435,420 L 400,420 L 400,380"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Lower Right Quadrant 4 Symbol ( ┐ ) */}
            <path
              d="M 345,470 L 380,470 L 380,510"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Lower Left Quadrant 3 Symbol ( ┌ ) */}
            <path
              d="M 435,470 L 400,470 L 400,510"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* =========================================================
                NOTATION LABELS (Outer Purple Universal & Inner Green Palmer)
            ========================================================= */}
            {activeCoords.map((tooth) => (
              <g key={`notations-${tooth.fdi}`}>
                {/* Outer Purple Number (Universal) */}
                <text
                  x={tooth.outerNumX}
                  y={tooth.outerNumY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#D946EF"
                  fontSize="13.5"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  }}
                >
                  {tooth.univ}
                </text>

                {/* Inner Green Number (Palmer) */}
                <text
                  x={tooth.innerNumX}
                  y={tooth.innerNumY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#22C55E"
                  fontSize="12.5"
                  fontWeight="800"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  }}
                >
                  {tooth.palmer}
                </text>
              </g>
            ))}

            {/* =========================================================
                THE 3D OCCLUSAL TEETH NODES
            ========================================================= */}
            {activeCoords.map(renderOcclusalTooth)}
          </svg>
        </div>
      </div>

      {/* Interactive Legend & Quick Status Bar */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Notation Guide Key */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white" />
            <span className="text-slate-300 font-bold">FDI On-Tooth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-fuchsia-500" />
            <span className="text-slate-300 font-bold">Universal Outer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-bold">Palmer Inner</span>
          </div>
        </div>

        {/* Selected Tooth Info */}
        {selectedFdiNumber && (
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-sky-500/40">
            <span className="text-sky-400 font-mono font-bold">Selected:</span>
            <span className="font-extrabold text-white">Tooth #{selectedFdiNumber} FDI</span>
            <span className="text-slate-400">({getToothName(fdiToUniversal(selectedFdiNumber))})</span>
          </div>
        )}
      </div>
    </div>
  );
};

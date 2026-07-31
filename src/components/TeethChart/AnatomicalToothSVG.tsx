import React from 'react';
import { ToothCondition } from '../../types';

interface AnatomicalToothSVGProps {
  toothNumber: number;
  fdiNumber: number;
  condition: ToothCondition;
  isSelected?: boolean;
}

export type ToothCategory =
  | 'incisor_central'
  | 'incisor_lateral'
  | 'canine'
  | 'premolar'
  | 'molar'
  | 'wisdom';

export const getToothCategory = (num: number): ToothCategory => {
  if (num === 1 || num === 16 || num === 17 || num === 32) return 'wisdom';
  if ([2, 3, 14, 15, 18, 19, 30, 31].includes(num)) return 'molar';
  if ([4, 5, 12, 13, 20, 21, 28, 29].includes(num)) return 'premolar';
  if ([6, 11, 22, 27].includes(num)) return 'canine';
  if ([7, 10, 23, 26].includes(num)) return 'incisor_lateral';
  return 'incisor_central';
};

export const AnatomicalToothSVG: React.FC<AnatomicalToothSVGProps> = ({
  toothNumber,
  condition,
  isSelected,
}) => {
  const isUpper = toothNumber <= 16;
  const category = getToothCategory(toothNumber);

  // Unique SVG IDs for gradients per tooth
  const gradientPrefix = `tooth-${toothNumber}`;

  // Missing Tooth State Rendering
  if (condition === 'Missing') {
    return (
      <svg viewBox="0 0 50 75" className="w-full h-full opacity-60">
        {/* Dotted Alveolar Socket Contour */}
        <path
          d={
            isUpper
              ? 'M 15,10 C 15,35 20,40 25,40 C 30,40 35,35 35,10 Q 25,5 15,10 Z'
              : 'M 15,65 C 15,40 20,35 25,35 C 30,35 35,40 35,65 Q 25,70 15,65 Z'
          }
          fill="none"
          stroke="#a1a1aa"
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />
        {/* Empty Socket Symbol */}
        <text
          x="25"
          y={isUpper ? '28' : '52'}
          textAnchor="middle"
          fill="#71717a"
          fontSize="14"
          fontWeight="bold"
        >
          ✕
        </text>
      </svg>
    );
  }

  // Dental Implant State Rendering
  if (condition === 'Implant') {
    return (
      <svg viewBox="0 0 50 75" className="w-full h-full drop-shadow-xs">
        <defs>
          <linearGradient id={`${gradientPrefix}-implant`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="35%" stopColor="#94a3b8" />
            <stop offset="70%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id={`${gradientPrefix}-crown`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* Titanium Screw Abutment / Root */}
        {isUpper ? (
          <g>
            {/* Upper Implant Screw */}
            <rect x="21" y="8" width="8" height="32" rx="2" fill={`url(#${gradientPrefix}-implant)`} />
            {/* Screw Threads */}
            <line x1="19" y1="14" x2="31" y2="14" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="19" y1="20" x2="31" y2="20" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="19" y1="26" x2="31" y2="26" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="19" y1="32" x2="31" y2="32" stroke="#1e293b" strokeWidth="1.5" />
            {/* Abutment Connector Collar */}
            <polygon points="18,38 32,38 29,43 21,43" fill="#64748b" />
            {/* Ceramic Crown */}
            <path
              d="M 14,43 C 12,56 18,70 25,70 C 32,70 38,56 36,43 Z"
              fill={`url(#${gradientPrefix}-crown)`}
              stroke="#64748b"
              strokeWidth="1.5"
            />
          </g>
        ) : (
          <g>
            {/* Lower Ceramic Crown */}
            <path
              d="M 14,32 C 12,19 18,5 25,5 C 32,5 38,19 36,32 Z"
              fill={`url(#${gradientPrefix}-crown)`}
              stroke="#64748b"
              strokeWidth="1.5"
            />
            {/* Abutment Connector Collar */}
            <polygon points="18,32 32,32 29,37 21,37" fill="#64748b" />
            {/* Lower Implant Screw */}
            <rect x="21" y="37" width="8" height="32" rx="2" fill={`url(#${gradientPrefix}-implant)`} />
            {/* Screw Threads */}
            <line x1="19" y1="43" x2="31" y2="43" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="19" y1="49" x2="31" y2="49" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="19" y1="55" x2="31" y2="55" stroke="#1e293b" strokeWidth="1.5" />
            <line x1="19" y1="61" x2="31" y2="61" stroke="#1e293b" strokeWidth="1.5" />
          </g>
        )}
      </svg>
    );
  }

  // Common Anatomical Path Builders for upper/lower & tooth category
  const renderUpperAnatomicalPaths = () => {
    switch (category) {
      case 'incisor_central':
        return {
          root: 'M 19,38 Q 16,12 25,4 Q 34,12 31,38 Z',
          pulp: 'M 24,38 L 24,10 L 26,10 L 26,38 Z',
          crown: 'M 14,37 Q 13,58 17,68 Q 25,72 33,68 Q 37,58 36,37 Q 25,35 14,37 Z',
          crownCenterY: 54,
          neckY: 38,
        };
      case 'incisor_lateral':
        return {
          root: 'M 19,38 Q 18,12 25,5 Q 32,12 31,38 Z',
          pulp: 'M 24,38 L 24,12 L 26,12 L 26,38 Z',
          crown: 'M 16,37 Q 15,56 18,67 Q 25,70 32,67 Q 35,56 34,37 Q 25,35 16,37 Z',
          crownCenterY: 53,
          neckY: 38,
        };
      case 'canine':
        return {
          root: 'M 19,38 Q 16,8 25,2 Q 34,8 31,38 Z',
          pulp: 'M 24,38 L 24,8 L 26,8 L 26,38 Z',
          crown: 'M 16,37 Q 15,55 25,72 Q 35,55 34,37 Q 25,34 16,37 Z',
          crownCenterY: 54,
          neckY: 38,
        };
      case 'premolar':
        return {
          root: 'M 15,38 Q 12,18 19,6 Q 23,20 23,38 Z M 27,38 Q 27,20 31,6 Q 38,18 35,38 Z',
          pulp: 'M 18,38 L 18,12 M 31,38 L 31,12',
          crown: 'M 13,37 C 11,50 17,68 21,68 C 24,68 25,64 25,64 C 25,64 26,68 29,68 C 33,68 39,50 37,37 Q 25,34 13,37 Z',
          crownCenterY: 53,
          neckY: 38,
        };
      case 'molar':
        return {
          root: 'M 12,38 Q 8,18 13,4 Q 18,18 18,38 Z M 21,38 Q 23,16 25,3 Q 27,16 29,38 Z M 32,38 Q 32,18 37,4 Q 42,18 38,38 Z',
          pulp: 'M 13,38 L 13,10 M 25,38 L 25,8 M 37,38 L 37,10',
          crown: 'M 9,37 C 7,48 13,68 19,69 C 22,69 25,65 25,65 C 25,65 28,69 31,69 C 37,68 43,48 41,37 Q 25,33 9,37 Z',
          crownCenterY: 53,
          neckY: 38,
        };
      case 'wisdom':
      default:
        return {
          root: 'M 14,38 Q 12,20 18,8 Q 22,20 22,38 Z M 28,38 Q 28,20 32,8 Q 38,20 36,38 Z',
          pulp: 'M 17,38 L 17,14 M 33,38 L 33,14',
          crown: 'M 11,37 C 9,48 15,67 21,68 C 25,68 29,68 39,37 Q 25,34 11,37 Z',
          crownCenterY: 52,
          neckY: 38,
        };
    }
  };

  const renderLowerAnatomicalPaths = () => {
    switch (category) {
      case 'incisor_central':
        return {
          root: 'M 19,37 Q 16,63 25,71 Q 34,63 31,37 Z',
          pulp: 'M 24,37 L 24,65 L 26,65 L 26,37 Z',
          crown: 'M 14,38 Q 13,17 17,7 Q 25,3 33,7 Q 37,17 36,38 Q 25,40 14,38 Z',
          crownCenterY: 21,
          neckY: 37,
        };
      case 'incisor_lateral':
        return {
          root: 'M 19,37 Q 18,63 25,70 Q 32,63 31,37 Z',
          pulp: 'M 24,37 L 24,63 L 26,63 L 26,37 Z',
          crown: 'M 16,38 Q 15,19 18,8 Q 25,5 32,8 Q 35,19 34,38 Q 25,40 16,38 Z',
          crownCenterY: 22,
          neckY: 37,
        };
      case 'canine':
        return {
          root: 'M 19,37 Q 16,67 25,73 Q 34,67 31,37 Z',
          pulp: 'M 24,37 L 24,67 L 26,67 L 26,37 Z',
          crown: 'M 16,38 Q 15,20 25,3 Q 35,20 34,38 Q 25,41 16,38 Z',
          crownCenterY: 21,
          neckY: 37,
        };
      case 'premolar':
        return {
          root: 'M 18,37 Q 16,63 25,71 Q 34,63 32,37 Z',
          pulp: 'M 25,37 L 25,65',
          crown: 'M 13,38 C 11,25 17,7 21,7 C 24,7 25,11 25,11 C 25,11 26,7 29,7 C 33,7 39,25 37,38 Q 25,41 13,38 Z',
          crownCenterY: 22,
          neckY: 37,
        };
      case 'molar':
        return {
          root: 'M 12,37 Q 8,57 15,72 Q 20,58 21,37 Z M 29,37 Q 30,58 35,72 Q 42,57 38,37 Z',
          pulp: 'M 15,37 L 15,65 M 34,37 L 34,65',
          crown: 'M 9,38 C 7,27 13,7 19,6 C 22,6 25,10 25,10 C 25,10 28,6 31,6 C 37,7 43,27 41,38 Q 25,42 9,38 Z',
          crownCenterY: 22,
          neckY: 37,
        };
      case 'wisdom':
      default:
        return {
          root: 'M 13,37 Q 11,55 18,69 Q 23,55 23,37 Z M 27,37 Q 27,55 32,69 Q 39,55 37,37 Z',
          pulp: 'M 17,37 L 17,62 M 33,37 L 33,62',
          crown: 'M 11,38 C 9,27 15,8 21,7 C 25,7 29,7 39,38 Q 25,41 11,38 Z',
          crownCenterY: 23,
          neckY: 37,
        };
    }
  };

  const pathData = isUpper ? renderUpperAnatomicalPaths() : renderLowerAnatomicalPaths();

  return (
    <svg
      viewBox="0 0 50 75"
      className="w-full h-full drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
    >
      <defs>
        {/* Enamel Gradient */}
        <linearGradient id={`${gradientPrefix}-enamel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#fbf9f4" />
          <stop offset="100%" stopColor="#eedec8" />
        </linearGradient>

        {/* Dentin Root Gradient */}
        <linearGradient id={`${gradientPrefix}-dentin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1e5d4" />
          <stop offset="100%" stopColor="#d4c0a5" />
        </linearGradient>

        {/* Gold Crown Gradient */}
        <linearGradient id={`${gradientPrefix}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>

        {/* Caries Decay Gradient */}
        <radialGradient id={`${gradientPrefix}-caries`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="60%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
      </defs>

      {/* 1. Tooth Root Layer */}
      <path
        d={pathData.root}
        fill={`url(#${gradientPrefix}-dentin)`}
        stroke="#a1a1aa"
        strokeWidth="1"
      />

      {/* 2. Root Canal Pulp / RCT Status Visualization */}
      {condition === 'RCT_Needed' ? (
        <g>
          {/* Glowing Red Pulp Channel */}
          <path
            d={pathData.pulp}
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-pulse"
          />
          {/* Red Flame/Lightning Pulpal Flare */}
          <circle cx="25" cy={pathData.neckY} r="4" fill="#dc2626" />
        </g>
      ) : condition === 'RCT_Done' ? (
        <g>
          {/* Violet/Purple Gutta Percha Filled Canal */}
          <path
            d={pathData.pulp}
            stroke="#a855f7"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ) : (
        /* Normal Faint Pulp Canal Line */
        <path
          d={pathData.pulp}
          stroke="#ca8a04"
          strokeWidth="1"
          opacity="0.3"
          strokeLinecap="round"
        />
      )}

      {/* 3. Sensitivity Radial Wave Layer */}
      {condition === 'Sensitivity' && (
        <g>
          <path
            d={`M 10,${pathData.neckY} Q 25,${pathData.neckY - 6} 40,${pathData.neckY}`}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="3,2"
          />
          <path
            d={`M 8,${pathData.neckY + (isUpper ? 6 : -6)} Q 25,${pathData.neckY + (isUpper ? 0 : -12)} 42,${pathData.neckY + (isUpper ? 6 : -6)}`}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
        </g>
      )}

      {/* 4. Tooth Crown Layer */}
      {condition === 'Crown' ? (
        /* Full Gold Crown Cap Overlay */
        <g>
          <path
            d={pathData.crown}
            fill={`url(#${gradientPrefix}-gold)`}
            stroke="#a16207"
            strokeWidth="1.5"
          />
          {/* Metallic Crown Luster Shine */}
          <path
            d={pathData.crown}
            fill="none"
            stroke="#fef08a"
            strokeWidth="1"
            opacity="0.8"
          />
        </g>
      ) : (
        /* Standard Natural Enamel Crown */
        <path
          d={pathData.crown}
          fill={`url(#${gradientPrefix}-enamel)`}
          stroke={condition === 'Extraction_Needed' ? '#ef4444' : isSelected ? '#b89323' : '#a1a1aa'}
          strokeWidth={condition === 'Extraction_Needed' || isSelected ? '2' : '1'}
        />
      )}

      {/* 5. Caries / Cavity Lesion Overlay */}
      {condition === 'Caries' && (
        <g>
          <ellipse
            cx="25"
            cy={pathData.crownCenterY}
            rx="6"
            ry="5"
            fill={`url(#${gradientPrefix}-caries)`}
            stroke="#451a03"
            strokeWidth="1"
          />
        </g>
      )}

      {/* 6. Tartar / Scaling Calculus Band Overlay */}
      {condition === 'Scaling_Needed' && (
        <path
          d={`M 12,${pathData.neckY} Q 25,${pathData.neckY + (isUpper ? 3 : -3)} 38,${pathData.neckY} L 37,${pathData.neckY + (isUpper ? 5 : -5)} Q 25,${pathData.neckY + (isUpper ? 8 : -2)} 13,${pathData.neckY + (isUpper ? 5 : -5)} Z`}
          fill="#d97706"
          opacity="0.9"
        />
      )}

      {/* 7. Extraction Needed Warning Overlay */}
      {condition === 'Extraction_Needed' && (
        <g>
          <line
            x1="12"
            y1={pathData.crownCenterY - 10}
            x2="38"
            y2={pathData.crownCenterY + 10}
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1={pathData.crownCenterY - 10}
            x2="12"
            y2={pathData.crownCenterY + 10}
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
};

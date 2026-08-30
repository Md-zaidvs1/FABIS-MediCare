import React from 'react';

interface ToothShapeProps {
  fdiNumber: number;
  conditionHex?: string;
  condition?: string;
  isSelected?: boolean;
  className?: string;
}

export type ToothArchetype =
  | 'upper_molar_1st'
  | 'upper_molar_2nd'
  | 'upper_molar_3rd'
  | 'upper_premolar_1st'
  | 'upper_premolar_2nd'
  | 'upper_canine'
  | 'upper_lateral_incisor'
  | 'upper_central_incisor'
  | 'lower_central_incisor'
  | 'lower_lateral_incisor'
  | 'lower_canine'
  | 'lower_premolar_1st'
  | 'lower_premolar_2nd'
  | 'lower_molar_1st'
  | 'lower_molar_2nd'
  | 'lower_molar_3rd';

export function getToothArchetype(fdi: number): {
  arch: 'upper' | 'lower';
  archetype: ToothArchetype;
  isLeftQuadrant: boolean;
} {
  const quadrant = Math.floor(fdi / 10);
  const toothPos = fdi % 10;
  const isUpper = quadrant === 1 || quadrant === 2;
  const isLeftQuadrant = quadrant === 2 || quadrant === 3; // Patient's left side (right side on screen)

  if (isUpper) {
    if (toothPos === 1) return { arch: 'upper', archetype: 'upper_central_incisor', isLeftQuadrant };
    if (toothPos === 2) return { arch: 'upper', archetype: 'upper_lateral_incisor', isLeftQuadrant };
    if (toothPos === 3) return { arch: 'upper', archetype: 'upper_canine', isLeftQuadrant };
    if (toothPos === 4) return { arch: 'upper', archetype: 'upper_premolar_1st', isLeftQuadrant };
    if (toothPos === 5) return { arch: 'upper', archetype: 'upper_premolar_2nd', isLeftQuadrant };
    if (toothPos === 6) return { arch: 'upper', archetype: 'upper_molar_1st', isLeftQuadrant };
    if (toothPos === 7) return { arch: 'upper', archetype: 'upper_molar_2nd', isLeftQuadrant };
    return { arch: 'upper', archetype: 'upper_molar_3rd', isLeftQuadrant };
  } else {
    if (toothPos === 1) return { arch: 'lower', archetype: 'lower_central_incisor', isLeftQuadrant };
    if (toothPos === 2) return { arch: 'lower', archetype: 'lower_lateral_incisor', isLeftQuadrant };
    if (toothPos === 3) return { arch: 'lower', archetype: 'lower_canine', isLeftQuadrant };
    if (toothPos === 4) return { arch: 'lower', archetype: 'lower_premolar_1st', isLeftQuadrant };
    if (toothPos === 5) return { arch: 'lower', archetype: 'lower_premolar_2nd', isLeftQuadrant };
    if (toothPos === 6) return { arch: 'lower', archetype: 'lower_molar_1st', isLeftQuadrant };
    if (toothPos === 7) return { arch: 'lower', archetype: 'lower_molar_2nd', isLeftQuadrant };
    return { arch: 'lower', archetype: 'lower_molar_3rd', isLeftQuadrant };
  }
}

/**
 * Realistic Anatomical Tooth Component
 * Reproduces the visual reference in the FDI chart with ivory enamel,
 * warm cementum root shading, cervical curvature, anatomical cusps,
 * and internal pulp/dentin rendering for selected teeth or condition states.
 */
export const ToothShape: React.FC<ToothShapeProps> = ({
  fdiNumber,
  conditionHex = '#10b981',
  condition = 'Healthy',
  isSelected = false,
  className = 'w-8 h-12 sm:w-9 sm:h-14',
}) => {
  const { arch, archetype, isLeftQuadrant } = getToothArchetype(fdiNumber);
  const isUpper = arch === 'upper';

  // Unique Gradient IDs
  const idSuffix = `${fdiNumber}-${isSelected ? 'sel' : 'norm'}`;
  const enamelGradId = `enamel-${idSuffix}`;
  const rootGradId = `root-${idSuffix}`;
  const dentinGradId = `dentin-${idSuffix}`;
  const pulpGradId = `pulp-${idSuffix}`;

  // Mirror transform if left quadrant to provide bilateral anatomical symmetry
  const transform = isLeftQuadrant ? 'scale(-1, 1) translate(-36, 0)' : undefined;

  const showPulp = isSelected || condition === 'RCT_Done' || condition === 'RCT_Needed' || fdiNumber === 16;
  const isMissing = condition === 'Missing';
  const hasDecay = condition === 'Caries' || condition === 'Decay';
  const hasFilling = condition === 'Filling';
  const hasCrown = condition === 'Crown';
  const hasExtraction = condition === 'Extraction_Needed' || condition === 'Extraction';

  return (
    <svg
      viewBox="0 0 36 54"
      className={`${className} transition-transform duration-150 select-none overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Natural Dental Ivory Enamel Gradient */}
        <linearGradient id={enamelGradId} x1="0" y1={isUpper ? "24" : "4"} x2="0" y2={isUpper ? "52" : "28"} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#FCFBF7" />
          <stop offset="60%" stopColor="#F5EFE3" />
          <stop offset="90%" stopColor="#EADECB" />
          <stop offset="100%" stopColor="#D9C7AC" />
        </linearGradient>

        {/* Warm Anatomical Root Cementum Gradient */}
        <linearGradient id={rootGradId} x1="0" y1={isUpper ? "2" : "24"} x2="0" y2={isUpper ? "26" : "52"} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F7F1E6" />
          <stop offset="35%" stopColor="#EFE4D2" />
          <stop offset="70%" stopColor="#DFCBB0" />
          <stop offset="100%" stopColor="#C4AC8D" />
        </linearGradient>

        {/* Internal Dentin Tone */}
        <linearGradient id={dentinGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="65%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Rich Red Pulp Cavity */}
        <linearGradient id={pulpGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="45%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#9F1239" />
        </linearGradient>
      </defs>

      {/* Main Tooth Group with Optional Bilateral Quadrant Flip */}
      <g transform={transform} opacity={isMissing ? 0.35 : 1}>

        {/* =========================================================================
            UPPER ARCH (MAXILLARY) — ROOTS POINT UP (y: 2..26), CROWN POINTS DOWN (y: 22..52)
        ========================================================================= */}
        {isUpper && (
          <>
            {/* 1. UPPER 1ST MOLAR (16, 26) — 3 divergent roots (MB, DB, Palatal), broad 4-cusp crown */}
            {archetype === 'upper_molar_1st' && (
              <g id={`tooth-u-m1-${fdiNumber}`}>
                {/* Palatal (Central/Longer) Root */}
                <path
                  d="M13.5 24 C14.5 15, 15.5 2.5, 18 2 C20.5 2.5, 21.5 15, 22.5 24 Z"
                  fill={`url(#${rootGradId})`}
                  stroke="#A89478"
                  strokeWidth="0.75"
                />
                {/* Mesiobuccal (Left) Root */}
                <path
                  d="M8.5 25 C7.5 17, 5 8, 7.5 4 C10 4, 11.5 13, 13.5 25 Z"
                  fill={`url(#${rootGradId})`}
                  stroke="#A89478"
                  strokeWidth="0.75"
                />
                {/* Distobuccal (Right) Root */}
                <path
                  d="M22.5 25 C24.5 13, 26 4, 28.5 4 C31 8, 28.5 17, 27.5 25 Z"
                  fill={`url(#${rootGradId})`}
                  stroke="#A89478"
                  strokeWidth="0.75"
                />

                {/* Root Shading / Canal Highlights */}
                <path d="M18 3.5 L18 22" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
                <path d="M8 5.5 C8 11, 10 18, 11.5 23" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
                <path d="M28 5.5 C28 11, 26 18, 24.5 23" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />

                {/* CEJ Cervical Line */}
                <path d="M5.5 25.5 C11 23, 25 23, 30.5 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />

                {/* Anatomical Molar Crown (Broad 4-cusp contour pointing down) */}
                <path
                  d="M5.5 25.5 C4 30, 3.5 41, 6.5 47 C9 50.5, 13.5 48.5, 16 50.5 C18 51.5, 20 49, 22.5 50.5 C25 48.5, 29.5 50.5, 31.5 47 C34 41, 33.5 30, 31.5 25.5 C26 24, 10 24, 5.5 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />

                {/* Internal Cross-section (Pulp & Dentin) if selected or tooth 16 */}
                {showPulp && (
                  <g>
                    {/* Dentin Contour */}
                    <path
                      d="M8.5 27.5 C7 33, 7 42, 10 45.5 C12 47.5, 15 46, 17.5 47.5 C19.5 48.5, 21 46.5, 23.5 47.5 C25.5 46, 28.5 47.5, 30 45.5 C33 42, 33 33, 30.5 27.5 Z"
                      fill={`url(#${dentinGradId})`}
                      opacity="0.85"
                    />
                    {/* Pulp Chamber & Horns */}
                    <path
                      d="M13 28.5 C11.5 34, 11.5 39, 14 42 C16 43.5, 17 42.5, 18.5 43.5 C20 42.5, 21 43.5, 23 42 C25.5 39, 25.5 34, 24 28.5 C21 28, 16 28, 13 28.5 Z"
                      fill={`url(#${pulpGradId})`}
                    />
                    {/* Root Canal Lines extending up */}
                    <path d="M14 28.5 C12.5 20, 10 12, 8.5 6" stroke="#BE123C" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M18.5 28.5 L18.5 4" stroke="#BE123C" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M23 28.5 C24.5 20, 26.5 12, 27.5 6" stroke="#BE123C" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                )}

                {/* Cusp Grooves & Gloss Highlights */}
                <path d="M10 32 Q18.5 37 27 32 M18.5 27 L18.5 48" stroke="#FFFFFF" strokeWidth="0.85" strokeLinecap="round" opacity="0.75" />
                <path d="M7 28 C7 34, 7 42, 9 46" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
              </g>
            )}

            {/* 2. UPPER 2ND MOLAR (17, 27) — 3 roots closer together, 4 cusps */}
            {archetype === 'upper_molar_2nd' && (
              <g id={`tooth-u-m2-${fdiNumber}`}>
                <path d="M14 24 C14.5 15, 16 3, 18 2.5 C20 3, 21.5 15, 22 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M9 25 C8 17, 6.5 9, 9 5 C11 5, 12.5 14, 14 25 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M22 25 C23.5 14, 25 5, 27 5 C29.5 9, 28 17, 27 25 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 4 L18 22" stroke="#FFFFFF" strokeWidth="0.5" strokeLinecap="round" opacity="0.5" />
                <path d="M6 25.5 C11 23.5, 25 23.5, 30 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M6 25.5 C4.5 30, 4 40, 7 46 C9.5 49.5, 13.5 48, 16 50 C18 51, 20 48.5, 22.5 50 C25 48, 28.5 49.5, 30.5 46 C33 40, 32.5 30, 30.5 25.5 C25 24, 11 24, 6 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M11 32 Q18 36 26 32 M18 27 L18 47" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              </g>
            )}

            {/* 3. UPPER 3RD MOLAR / WISDOM (18, 28) — 3 fused/convergent roots, compact crown */}
            {archetype === 'upper_molar_3rd' && (
              <g id={`tooth-u-m3-${fdiNumber}`}>
                <path d="M11 25 C10 16, 12 4, 18 3.5 C24 4, 26 16, 25 25 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M15 5 C16.5 13, 17 20, 18 24 M21 5 C19.5 13, 19 20, 18 24" stroke="#A89478" strokeWidth="0.5" opacity="0.6" />
                <path d="M7 26 C12 24, 24 24, 29 26" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M7 26 C5.5 31, 5 40, 7.5 45.5 C10 49, 14 47.5, 18 49.5 C22 47.5, 26 49, 28.5 45.5 C31 40, 30.5 31, 29 26 C24 24.5, 12 24.5, 7 26 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M12 33 Q18 37 24 33" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              </g>
            )}

            {/* 4. UPPER 1ST PREMOLAR (14, 24) — Bifurcated dual root tips, bicuspid crown */}
            {archetype === 'upper_premolar_1st' && (
              <g id={`tooth-u-pm1-${fdiNumber}`}>
                {/* Buccal & Palatal Root Tips */}
                <path d="M11.5 24 C10.5 15, 10 5, 13.5 3 C15 5, 15.5 14, 16 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M20 24 C20.5 14, 21 5, 22.5 3 C26 5, 25.5 15, 24.5 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M13.5 4.5 L14.5 21" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
                <path d="M22.5 4.5 L21.5 21" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
                <path d="M8 25.5 C12 24, 24 24, 28 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M8 25.5 C6.5 30, 6 41, 8.5 46.5 C11 49.5, 14.5 48, 18 50 C21.5 48, 25 49.5, 27.5 46.5 C30 41, 29.5 30, 28 25.5 C24 24.5, 12 24.5, 8 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M13 32 Q18 36 23 32 M18 27 L18 46" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              </g>
            )}

            {/* 5. UPPER 2ND PREMOLAR (15, 25) — Single tapered root, bicuspid crown */}
            {archetype === 'upper_premolar_2nd' && (
              <g id={`tooth-u-pm2-${fdiNumber}`}>
                <path d="M12.5 24 C11.5 14, 13.5 3.5, 18 3 C22.5 3.5, 24.5 14, 23.5 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 4 L18 22" stroke="#FFFFFF" strokeWidth="0.5" strokeLinecap="round" opacity="0.5" />
                <path d="M8 25.5 C12 24, 24 24, 28 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M8 25.5 C6.5 30, 6 41, 8.5 46.5 C11 49.5, 14.5 48, 18 50 C21.5 48, 25 49.5, 27.5 46.5 C30 41, 29.5 30, 28 25.5 C24 24.5, 12 24.5, 8 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M13 32 Q18 36 23 32 M18 27 L18 46" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              </g>
            )}

            {/* 6. UPPER CANINE (13, 23) — Longest sturdy single root, prominent pointed cusp */}
            {archetype === 'upper_canine' && (
              <g id={`tooth-u-can-${fdiNumber}`}>
                <path d="M12.5 24 C11.5 13, 14 1.5, 18 1 C22 1.5, 24.5 13, 23.5 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 2 L18 22" stroke="#FFFFFF" strokeWidth="0.6" strokeLinecap="round" opacity="0.6" />
                <path d="M8.5 25.5 C13 23.5, 23 23.5, 27.5 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M8.5 25.5 C7 31, 7.5 41, 10.5 46.5 C13.5 49.5, 17 52.5, 18 53 C19 52.5, 22.5 49.5, 25.5 46.5 C28.5 41, 29 31, 27.5 25.5 C23 24, 13 24, 8.5 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                {/* Labial Ridge */}
                <path d="M18 26 L18 51" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
                <path d="M12 33 Q18 37 24 33" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.5" />
              </g>
            )}

            {/* 7. UPPER LATERAL INCISOR (12, 22) — Slender single root, smaller incisor crown */}
            {archetype === 'upper_lateral_incisor' && (
              <g id={`tooth-u-li-${fdiNumber}`}>
                <path d="M13.5 24 C13 13, 15 3.5, 18 3 C20.5 3.5, 23 13, 22.5 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 4 L18 22" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
                <path d="M9 25.5 C13 24, 23 24, 27 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M9 25.5 C8 31, 8 42, 9.5 47.5 C10.5 49.5, 12.5 50, 14.5 50 L21.5 50 C23.5 50, 25.5 49.5, 26.5 47.5 C28 42, 28 31, 27 25.5 C23 24.5, 13 24.5, 9 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <line x1="12" y1="48" x2="24" y2="48" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
              </g>
            )}

            {/* 8. UPPER CENTRAL INCISOR (11, 21) — Broad shovel/chisel incisor crown, straight root */}
            {archetype === 'upper_central_incisor' && (
              <g id={`tooth-u-ci-${fdiNumber}`}>
                <path d="M13 24 C12.5 13, 15 2.5, 18 2 C21 2.5, 23.5 13, 23 24 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 3 L18 22" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.6" />
                <path d="M8 25.5 C13 23.5, 23 23.5, 28 25.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path
                  d="M8 25.5 C7 31, 7 42, 8 48 C8.5 50, 10.5 50.5, 12 50.5 L24 50.5 C25.5 50.5, 27.5 50, 28 48 C29 42, 29 31, 28 25.5 C23 24, 13 24, 8 25.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <line x1="11" y1="48.5" x2="25" y2="48.5" stroke="#FFFFFF" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
                <path d="M14 29 L14 44 M22 29 L22 44" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
              </g>
            )}
          </>
        )}

        {/* =========================================================================
            LOWER ARCH (MANDIBULAR) — CROWN POINTS UP (y: 2..28), ROOTS POINT DOWN (y: 24..52)
        ========================================================================= */}
        {!isUpper && (
          <>
            {/* 9. LOWER 1ST MOLAR (46, 36) — 5-cusp wide crown on top, 2 wide divergent roots pointing down */}
            {archetype === 'lower_molar_1st' && (
              <g id={`tooth-l-m1-${fdiNumber}`}>
                {/* Crown on Top pointing Up */}
                <path
                  d="M5.5 27 C4 22, 4.5 12, 7 6 C9.5 2.5, 13.5 5, 16 3 C18 2, 20 4.5, 22.5 3 C25 5, 29 2.5, 31.5 6 C34 12, 34 22, 31.5 27 C26 28.5, 10 28.5, 5.5 27 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />

                {/* Internal Pulp cross-section if selected */}
                {showPulp && (
                  <g>
                    <path
                      d="M8.5 25 C7 20, 7 11, 10 7.5 C12 5.5, 15 7, 17.5 5.5 C19.5 4.5, 21 6.5, 23.5 5.5 C25.5 7, 28.5 5.5, 30 7.5 C33 11, 33 20, 30.5 25 Z"
                      fill={`url(#${dentinGradId})`}
                      opacity="0.85"
                    />
                    <path
                      d="M13 24 C11.5 19, 11.5 14, 14 11 C16 9.5, 17 10.5, 18.5 9.5 C20 10.5, 21 9.5, 23 11 C25.5 14, 25.5 19, 24 24 C21 24.5, 16 24.5, 13 24 Z"
                      fill={`url(#${pulpGradId})`}
                    />
                    {/* Canal roots extending down */}
                    <path d="M14 24 C12.5 32, 10 40, 8.5 48" stroke="#BE123C" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M23 24 C24.5 32, 26.5 40, 27.5 48" stroke="#BE123C" strokeWidth="1.2" strokeLinecap="round" />
                  </g>
                )}

                {/* Occlusal Fissures & Gloss */}
                <path d="M10 20 Q18.5 15 27 20 M18.5 6 L18.5 25" stroke="#FFFFFF" strokeWidth="0.85" strokeLinecap="round" opacity="0.75" />
                <path d="M7 24 C7 18, 7 10, 9 6" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

                {/* CEJ line */}
                <path d="M5.5 27 C11 29, 25 29, 31.5 27" stroke="#9A8368" strokeWidth="0.85" fill="none" />

                {/* 2 Divergent Curved Roots (Mesial & Distal) pointing Down */}
                {/* Mesial Root */}
                <path
                  d="M8.5 27.5 C7.5 35, 5 44, 8 49 C10.5 49, 12 40, 14 28.5 Z"
                  fill={`url(#${rootGradId})`}
                  stroke="#A89478"
                  strokeWidth="0.75"
                />
                {/* Distal Root */}
                <path
                  d="M22 28.5 C24 40, 25.5 49, 28 49 C31 44, 28.5 35, 27.5 27.5 Z"
                  fill={`url(#${rootGradId})`}
                  stroke="#A89478"
                  strokeWidth="0.75"
                />
                {/* Root canal highlight */}
                <path d="M9 29 C9 36, 7 43, 8 47" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
                <path d="M27 29 C27 36, 29 43, 28 47" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
              </g>
            )}

            {/* 10. LOWER 2ND MOLAR (47, 37) — 4-cusp crown on top, 2 parallel/curved roots */}
            {archetype === 'lower_molar_2nd' && (
              <g id={`tooth-l-m2-${fdiNumber}`}>
                <path
                  d="M6 27 C4.5 22, 4 12, 7 6 C9.5 2.5, 13.5 4, 16 2 C18 1, 20 3.5, 22.5 2 C25 4, 28.5 2.5, 30.5 6 C33 12, 32.5 22, 30.5 27 C25 28.5, 11 28.5, 6 27 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M11 20 Q18 16 26 20 M18 6 L18 25" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
                <path d="M6 27 C11 29, 25 29, 30.5 27" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M9 28 C8 35, 6.5 43, 9 47.5 C11 47.5, 12.5 39, 14 29 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M22 29 C23.5 39, 25 47.5, 27 47.5 C29.5 43, 28 35, 27 28 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
              </g>
            )}

            {/* 11. LOWER 3RD MOLAR (48, 38) — Fused/converging roots, compact rounded crown */}
            {archetype === 'lower_molar_3rd' && (
              <g id={`tooth-l-m3-${fdiNumber}`}>
                <path
                  d="M7 26.5 C5.5 21, 5 12, 7.5 6.5 C10 3, 14 4.5, 18 2.5 C22 4.5, 26 3, 28.5 6.5 C31 12, 30.5 21, 29 26.5 C24 28, 12 28, 7 26.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M12 19 Q18 15 24 19" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
                <path d="M7 26.5 C12 28.5, 24 28.5, 29 26.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M11 27.5 C10 36, 12 48, 18 48.5 C24 48, 26 36, 25 27.5 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
              </g>
            )}

            {/* 12. LOWER 1ST PREMOLAR (44, 34) — Prominent buccal cusp, single root */}
            {archetype === 'lower_premolar_1st' && (
              <g id={`tooth-l-pm1-${fdiNumber}`}>
                <path
                  d="M8 26.5 C6.5 22, 6 11, 8.5 5.5 C11 2.5, 14.5 4, 18 2 C21.5 4, 25 2.5, 27.5 5.5 C30 11, 29.5 22, 28 26.5 C24 28, 12 28, 8 26.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M13 20 Q18 16 23 20 M18 6 L18 25" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
                <path d="M8 26.5 C12 28.5, 24 28.5, 28 26.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M12.5 27.5 C11.5 37, 13.5 48, 18 49 C22.5 48, 24.5 37, 23.5 27.5 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 28 L18 47" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
              </g>
            )}

            {/* 13. LOWER 2ND PREMOLAR (45, 35) — Rounded bicuspid crown, single root */}
            {archetype === 'lower_premolar_2nd' && (
              <g id={`tooth-l-pm2-${fdiNumber}`}>
                <path
                  d="M8 26.5 C6.5 22, 6 11, 8.5 5.5 C11 2.5, 14.5 4, 18 2 C21.5 4, 25 2.5, 27.5 5.5 C30 11, 29.5 22, 28 26.5 C24 28, 12 28, 8 26.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M13 20 Q18 16 23 20 M18 6 L18 25" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.7" />
                <path d="M8 26.5 C12 28.5, 24 28.5, 28 26.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M12.5 27.5 C11.5 37, 13.5 48, 18 49 C22.5 48, 24.5 37, 23.5 27.5 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 28 L18 47" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
              </g>
            )}

            {/* 14. LOWER CANINE (43, 33) — Pointed canine crown on top, long single root */}
            {archetype === 'lower_canine' && (
              <g id={`tooth-l-can-${fdiNumber}`}>
                <path
                  d="M8.5 26.5 C7 21, 7.5 11, 10.5 5.5 C13.5 2.5, 17 0, 18 0 C19 0, 22.5 2.5, 25.5 5.5 C28.5 11, 29 21, 27.5 26.5 C23 28, 13 28, 8.5 26.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <path d="M18 2 L18 25" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.75" />
                <path d="M8.5 26.5 C13 28.5, 23 28.5, 27.5 26.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M12.5 27.5 C11.5 38, 14 50, 18 51 C22 50, 24.5 38, 23.5 27.5 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 28 L18 49" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.6" />
              </g>
            )}

            {/* 15. LOWER LATERAL INCISOR (42, 32) — Slender chisel crown on top, slender root */}
            {archetype === 'lower_lateral_incisor' && (
              <g id={`tooth-l-li-${fdiNumber}`}>
                <path
                  d="M9.5 26.5 C8.5 21, 8.5 11, 9.5 4.5 C10.5 2.5, 12 2, 14 2 L22 2 C24 2, 25.5 2.5, 26.5 4.5 C27.5 11, 27.5 21, 26.5 26.5 C22 28, 14 28, 9.5 26.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <line x1="12" y1="4" x2="24" y2="4" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                <path d="M9.5 26.5 C13 28, 23 28, 26.5 26.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M13.5 27.5 C13 38, 15 48.5, 18 49 C20.5 48.5, 23 38, 22.5 27.5 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 28 L18 47" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
              </g>
            )}

            {/* 16. LOWER CENTRAL INCISOR (41, 31) — Smallest symmetrical chisel crown on top, slender root */}
            {archetype === 'lower_central_incisor' && (
              <g id={`tooth-l-ci-${fdiNumber}`}>
                <path
                  d="M10 26.5 C9 21, 9 11, 10 4.5 C10.5 2.5, 12 2, 14 2 L22 2 C24 2, 25.5 2.5, 26 4.5 C27 11, 27 21, 26 26.5 C22 28, 14 28, 10 26.5 Z"
                  fill={`url(#${enamelGradId})`}
                  stroke="#9A8368"
                  strokeWidth="0.9"
                  strokeLinejoin="round"
                />
                <line x1="12" y1="4" x2="24" y2="4" stroke="#FFFFFF" strokeWidth="0.8" strokeLinecap="round" opacity="0.75" />
                <path d="M10 26.5 C13 28, 23 28, 26 26.5" stroke="#9A8368" strokeWidth="0.85" fill="none" />
                <path d="M13.5 27.5 C13 38, 15 48.5, 18 49 C20.5 48.5, 23 38, 22.5 27.5 Z" fill={`url(#${rootGradId})`} stroke="#A89478" strokeWidth="0.75" />
                <path d="M18 28 L18 47" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
              </g>
            )}
          </>
        )}
      </g>

      {/* =========================================================================
          CLINICAL CONDITION OVERLAYS (Decay, Filling, Crown, RCT, Extraction)
      ========================================================================= */}
      {hasDecay && (
        <circle
          cx="18"
          cy={isUpper ? "44" : "10"}
          r="4.5"
          fill="#EF4444"
          stroke="#991B1B"
          strokeWidth="1.2"
          className="animate-pulse"
        />
      )}

      {hasFilling && (
        <rect
          x="13"
          y={isUpper ? "39" : "8"}
          width="10"
          height="7"
          rx="2"
          fill="#0284C7"
          stroke="#0369A1"
          strokeWidth="1.2"
        />
      )}

      {hasCrown && (
        <path
          d={
            isUpper
              ? "M6 27 L30 27 L28 48 L8 48 Z"
              : "M6 25 L30 25 L28 4 L8 4 Z"
          }
          fill="#F59E0B"
          fillOpacity="0.4"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeDasharray="2 1"
        />
      )}

      {condition === 'RCT_Done' && (
        <path
          d={isUpper ? "M18 4 L18 46" : "M18 48 L18 6"}
          stroke="#9333EA"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {hasExtraction && (
        <g>
          <line x1="8" y1="8" x2="28" y2="46" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="8" x2="8" y2="46" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {isMissing && (
        <g>
          <line x1="6" y1="6" x2="30" y2="48" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <line x1="30" y1="6" x2="6" y2="48" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

interface LargeAnatomicalToothViewProps {
  fdiNumber: number;
  condition: string;
  conditionHex?: string;
  className?: string;
}

/**
 * Large Detailed Anatomical Tooth View (Matches the reference card at the bottom)
 * Shows enamel cross-section, dentin contour, red pulp chamber, and roots.
 */
export const LargeAnatomicalToothView: React.FC<LargeAnatomicalToothViewProps> = ({
  fdiNumber,
  condition,
  className = 'w-28 h-36 sm:w-32 sm:h-40',
}) => {
  const { arch } = getToothArchetype(fdiNumber);
  const isUpper = arch === 'upper';

  return (
    <div className={`relative flex items-center justify-center p-2.5 bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200/90 shadow-xs ${className}`}>
      <svg
        viewBox="0 0 100 135"
        className="w-full h-full drop-shadow-xs select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Realistic Translucent Ivory Enamel */}
          <linearGradient id="lg-enamel-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FCFBF7" />
            <stop offset="65%" stopColor="#F5EFE3" />
            <stop offset="90%" stopColor="#EADECB" />
            <stop offset="100%" stopColor="#D9C7AC" />
          </linearGradient>

          {/* Dentin Tone */}
          <linearGradient id="lg-dentin-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="50%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Crimson Red Pulp Chamber */}
          <linearGradient id="lg-pulp-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDA4AF" />
            <stop offset="45%" stopColor="#E11D48" />
            <stop offset="100%" stopColor="#9F1239" />
          </linearGradient>

          {/* Root Bone Gradient */}
          <linearGradient id="lg-root-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F1E6" />
            <stop offset="40%" stopColor="#EFE4D2" />
            <stop offset="85%" stopColor="#DFCBB0" />
            <stop offset="100%" stopColor="#C4AC8D" />
          </linearGradient>
        </defs>

        {isUpper ? (
          /* Upper Tooth (Roots UP, Crown DOWN) */
          <g>
            {/* Mesial & Distal Roots */}
            <path
              d="M26 50 C24 28, 20 10, 28 4 C34 4, 36 24, 40 50 Z"
              fill="url(#lg-root-grad)"
              stroke="#A89478"
              strokeWidth="1.5"
            />
            <path
              d="M74 50 C76 28, 80 10, 72 4 C66 4, 64 24, 60 50 Z"
              fill="url(#lg-root-grad)"
              stroke="#A89478"
              strokeWidth="1.5"
            />
            {/* Palatal Central Root */}
            <path
              d="M44 48 C46 25, 48 3, 52 3 C56 3, 58 25, 56 48 Z"
              fill="url(#lg-root-grad)"
              stroke="#A89478"
              strokeWidth="1.5"
            />

            {/* Root Canal Red Traces */}
            <path d="M28 6 C30 25, 36 38, 42 52" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M72 6 C70 25, 64 38, 58 52" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M52 5 L52 50" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />

            {/* Crown Enamel Body */}
            <path
              d="M16 52 C13 62, 11 90, 22 108 C30 118, 40 114, 50 120 C60 114, 70 118, 78 108 C89 90, 87 62, 84 52 C65 48, 35 48, 16 52 Z"
              fill="url(#lg-enamel-grad)"
              stroke="#9A8368"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Dentin Layer */}
            <path
              d="M26 56 C23 68, 21 86, 30 98 C36 104, 44 100, 50 106 C56 100, 64 104, 70 98 C79 86, 77 68, 74 56 C60 54, 40 54, 26 56 Z"
              fill="url(#lg-dentin-grad)"
              stroke="#D97706"
              strokeWidth="1"
              opacity="0.85"
            />

            {/* Pulp Chamber (Red cavity) */}
            <path
              d="M38 60 C35 68, 35 78, 42 86 C46 90, 54 90, 58 86 C65 78, 65 68, 62 60 C55 58, 45 58, 38 60 Z"
              fill="url(#lg-pulp-grad)"
              stroke="#9F1239"
              strokeWidth="1.2"
            />

            {/* Cusps Highlight Grooves */}
            <path
              d="M24 102 Q50 114 76 102 M50 60 L50 116"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Enamel Gloss */}
            <path
              d="M20 60 C18 74, 18 92, 25 102"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          </g>
        ) : (
          /* Lower Tooth (Crown UP, Roots DOWN) */
          <g>
            {/* Crown Enamel Body */}
            <path
              d="M16 78 C13 68, 11 40, 22 22 C30 12, 40 16, 50 10 C60 16, 70 12, 78 22 C89 40, 87 68, 84 78 C65 82, 35 82, 16 78 Z"
              fill="url(#lg-enamel-grad)"
              stroke="#9A8368"
              strokeWidth="2"
              strokeLinejoin="round"
            />

            {/* Dentin Layer */}
            <path
              d="M26 74 C23 62, 21 44, 30 32 C36 26, 44 30, 50 24 C56 30, 64 26, 70 32 C79 44, 77 62, 74 74 C60 76, 40 76, 26 74 Z"
              fill="url(#lg-dentin-grad)"
              stroke="#D97706"
              strokeWidth="1"
              opacity="0.85"
            />

            {/* Pulp Chamber */}
            <path
              d="M38 70 C35 62, 35 52, 42 44 C46 40, 54 40, 58 44 C65 52, 65 62, 62 70 C55 72, 45 72, 38 70 Z"
              fill="url(#lg-pulp-grad)"
              stroke="#9F1239"
              strokeWidth="1.2"
            />

            {/* Roots (Mesial & Distal) */}
            <path
              d="M26 80 C24 102, 20 120, 30 126 C36 126, 38 106, 42 80 Z"
              fill="url(#lg-root-grad)"
              stroke="#A89478"
              strokeWidth="1.5"
            />
            <path
              d="M74 80 C76 102, 80 120, 70 126 C64 126, 62 106, 58 80 Z"
              fill="url(#lg-root-grad)"
              stroke="#A89478"
              strokeWidth="1.5"
            />

            {/* Pulp Root Canals */}
            <path d="M30 124 C32 105, 36 92, 42 78" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M70 124 C68 105, 64 92, 58 78" stroke="#E11D48" strokeWidth="2.2" strokeLinecap="round" />

            {/* Cusps Highlights */}
            <path
              d="M24 28 Q50 16 76 28 M50 70 L50 14"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M20 70 C18 56, 18 38, 25 28"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.75"
            />
          </g>
        )}

        {/* Condition Marker Overlay */}
        {condition === 'Decay' || condition === 'Caries' ? (
          <circle cx="50" cy={isUpper ? "105" : "25"} r="9" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" className="animate-pulse" />
        ) : null}
        {condition === 'Filling' && (
          <circle cx="50" cy={isUpper ? "105" : "25"} r="8" fill="#0284C7" stroke="#0369A1" strokeWidth="1.5" />
        )}
        {condition === 'Crown' && (
          <path
            d={isUpper ? "M14 65 L86 65 L76 114 L24 114 Z" : "M14 65 L86 65 L76 16 L24 16 Z"}
            fill="#F59E0B"
            fillOpacity="0.4"
            stroke="#D97706"
            strokeWidth="2"
          />
        )}
        {condition === 'RCT' || condition === 'RCT_Done' ? (
          <g>
            <circle cx="50" cy="65" r="9" fill="#9333EA" stroke="#6D28D9" strokeWidth="1.5" />
            <text x="50" y="68" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">RCT</text>
          </g>
        ) : null}
        {condition === 'Missing' && (
          <g>
            <line x1="20" y1="20" x2="80" y2="115" stroke="#EF4444" strokeWidth="3.5" />
            <line x1="80" y1="20" x2="20" y2="115" stroke="#EF4444" strokeWidth="3.5" />
          </g>
        )}
      </svg>
    </div>
  );
};

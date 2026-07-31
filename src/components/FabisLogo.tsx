import React from 'react';

interface FabisLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPillars?: boolean;
}

export const FabisLogo: React.FC<FabisLogoProps> = ({
  className = '',
  size = 'md',
  showPillars = true,
}) => {
  const sizeClasses = {
    sm: 'max-w-[200px]',
    md: 'max-w-[280px]',
    lg: 'max-w-[340px]',
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none text-center w-full mx-auto ${sizeClasses[size]} ${className}`}>
      
      {/* Visual Logo Symbol */}
      <div className="relative w-full max-w-[220px] aspect-[1.25/1] flex items-center justify-center">
        <svg
          viewBox="0 0 260 190"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="fGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            <linearGradient id="fTopHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            <linearGradient id="bracketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E3A8A" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <linearGradient id="speedDash" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Top Browser Header Window */}
          <path
            d="M 68 28 C 68 22, 74 18, 84 18 L 176 18 C 186 18, 192 22, 192 28 L 192 48 L 68 48 Z"
            fill="#0F172A"
          />
          {/* Browser Dots */}
          <circle cx="84" cy="32" r="3.5" fill="#38BDF8" />
          <circle cx="96" cy="32" r="3.5" fill="#38BDF8" />
          <circle cx="108" cy="32" r="3.5" fill="#38BDF8" />

          {/* Left Code Bracket < */}
          <path
            d="M 58 65 L 36 88 L 58 111"
            stroke="url(#bracketGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Code Bracket > */}
          <path
            d="M 202 65 L 224 88 L 202 111"
            stroke="url(#bracketGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Central Stylized Curved Blue F */}
          <g id="CenterF">
            {/* Main Sweep */}
            <path
              d="M 132 32 C 108 32 92 52 84 90 C 78 118 75 142 75 142 C 75 142 89 108 107 88 C 120 74 144 71 165 71 L 160 52 C 145 52 124 55 120 58 C 124 44 136 32 150 32 Z"
              fill="url(#fGradMain)"
            />
            {/* Top Bar Accent */}
            <path
              d="M 122 32 L 176 32 C 180 32 183 35 182 39 L 178 50 C 177 53 174 55 170 55 L 126 55 C 122 55 120 52 121 48 Z"
              fill="url(#fTopHighlight)"
            />
            {/* Middle Bar */}
            <path
              d="M 102 82 C 118 82 144 80 158 80 C 162 80 165 83 164 87 L 161 95 C 160 98 157 100 153 100 C 139 100 115 102 98 102 C 94 102 92 99 93 95 L 95 87 Z"
              fill="url(#fTopHighlight)"
            />

            {/* Speed Dash Lines */}
            <rect x="120" y="108" width="46" height="4" rx="2" fill="url(#speedDash)" />
            <rect x="132" y="116" width="36" height="4" rx="2" fill="url(#speedDash)" />
            <rect x="114" y="124" width="50" height="4" rx="2" fill="url(#speedDash)" />
            <rect x="126" y="132" width="30" height="4" rx="2" fill="url(#speedDash)" />
            <rect x="138" y="140" width="20" height="4" rx="2" fill="url(#speedDash)" />
          </g>
        </svg>
      </div>

      {/* FABIS Brand Text */}
      <div className="mt-1 flex items-center justify-center font-sans tracking-wide">
        <span className="text-3xl sm:text-4xl font-black text-[#0B1A3A] tracking-tight">F</span>
        
        {/* Custom Angled A without crossbar */}
        <span className="inline-flex items-center justify-center mx-[1px]">
          <svg className="w-6 h-7 sm:w-7 sm:h-8 -mt-0.5" viewBox="0 0 32 36" fill="none">
            <path
              d="M 16 2 L 30 34 L 22.5 34 L 16 18.5 L 9.5 34 L 2 34 Z"
              fill="#2563EB"
            />
          </svg>
        </span>

        <span className="text-3xl sm:text-4xl font-black text-[#0B1A3A] tracking-tight">B</span>
        <span className="text-3xl sm:text-4xl font-black text-[#2563EB] tracking-tight mx-[1px]">i</span>
        <span className="text-3xl sm:text-4xl font-black text-[#0B1A3A] tracking-tight">S</span>
      </div>

      {/* Tagline: — WE BUILD. YOU GROW. — */}
      <div className="w-full flex items-center justify-center gap-2 mt-1.5 px-1">
        <div className="h-[1.5px] bg-[#2563EB]/40 flex-1 max-w-[32px]" />
        <span className="text-[10px] sm:text-[11px] font-extrabold text-[#1E3A8A] tracking-[0.18em] uppercase whitespace-nowrap">
          WE BUILD. YOU GROW.
        </span>
        <div className="h-[1.5px] bg-[#2563EB]/40 flex-1 max-w-[32px]" />
      </div>

      {/* 4 Pillars Section: DEVELOP | DESIGN | DEPLOY | SUPPORT */}
      {showPillars && (
        <div className="w-full grid grid-cols-4 gap-1 mt-3.5 pt-3 border-t border-slate-200/90 text-center">
          {/* DEVELOP */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-[#2563EB] font-black text-xs sm:text-sm leading-none">&lt;/&gt;</div>
            <span className="text-[9px] font-extrabold text-slate-700 tracking-wider uppercase mt-1">DEVELOP</span>
          </div>

          {/* DESIGN */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-4 h-3.5 rounded-[2px] border-2 border-[#2563EB] flex flex-col justify-between p-[1px]">
              <div className="h-[1.5px] bg-[#2563EB] w-full" />
              <div className="h-[1.5px] bg-[#2563EB] w-2/3" />
            </div>
            <span className="text-[9px] font-extrabold text-slate-700 tracking-wider uppercase mt-1">DESIGN</span>
          </div>

          {/* DEPLOY */}
          <div className="flex flex-col items-center justify-center">
            <svg className="w-4 h-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.156 20.206 10.231 17.9001 10.024C17.4523 6.587 14.5298 4 11 4C7.02249 4 3.75704 7.022 3.5135 11.026C1.5165 11.458 0 13.255 0 15.5C0 18.261 2.23858 20.5 5 20.5H17.5" />
              <polyline points="12 11 12 17" />
              <polyline points="9 14 12 11 15 14" />
            </svg>
            <span className="text-[9px] font-extrabold text-slate-700 tracking-wider uppercase mt-1">DEPLOY</span>
          </div>

          {/* SUPPORT */}
          <div className="flex flex-col items-center justify-center">
            <svg className="w-4 h-4 text-[#2563EB]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[9px] font-extrabold text-slate-700 tracking-wider uppercase mt-1">SUPPORT</span>
          </div>
        </div>
      )}
    </div>
  );
};

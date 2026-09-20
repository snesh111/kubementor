import React from 'react';

/**
 * Concept 3: Geometric K-Nexus Monogram
 * Precision vector icon crafted with modular Kubernetes container blocks,
 * an integrated cybernetic terminal chevron arm, and the iconic KubeMentor wordmark.
 */
export const KubeMentorBrandLogo = ({
  size = 'lg',
  showText = true,
  className = '',
  isHeroShield = false,
}) => {
  const sizeMap = {
    sm: {
      iconSize: 28,
      kubeText: 'text-sm font-black text-white tracking-wider',
      mentorText: 'text-sm font-black text-slate-100 tracking-wider',
      dotSize: 'w-1 h-1',
      gap: 'gap-2.5',
    },
    md: {
      iconSize: 36,
      kubeText: 'text-lg font-black text-white tracking-wider',
      mentorText: 'text-lg font-black text-slate-100 tracking-wider',
      dotSize: 'w-1.5 h-1.5',
      gap: 'gap-3',
    },
    lg: {
      iconSize: 50,
      kubeText: 'text-2xl sm:text-3xl font-black text-white tracking-wider',
      mentorText: 'text-2xl sm:text-3xl font-black text-slate-100 tracking-wider',
      dotSize: 'w-2 h-2',
      gap: 'gap-3.5',
    },
    xl: {
      iconSize: 68,
      kubeText: 'text-4xl sm:text-5xl font-black text-white tracking-wider',
      mentorText: 'text-4xl sm:text-5xl font-black text-slate-100 tracking-wider',
      dotSize: 'w-2.5 h-2.5',
      gap: 'gap-4',
    },
  };

  const current = sizeMap[size] || sizeMap.lg;

  // Concept 3: SVG Geometric K-Nexus Monogram
  const KNexusMonogramIcon = ({ dimension }) => (
    <div className="relative flex items-center justify-center shrink-0">
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Emerald Neon Glow */}
          <filter id="kEmeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#10b981" floodOpacity="0.85" />
          </filter>

          {/* Cyan Circuit Glow */}
          <filter id="kCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#06b6d4" floodOpacity="0.8" />
          </filter>

          {/* Linear Gradient for K-Arm */}
          <linearGradient id="kArmGrad" x1="28" y1="50" x2="82" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* --- 1. LEFT VERTICAL STEM: 3 MODULAR CONTAINER BLOCKS --- */}
        {/* Top Container Block */}
        <rect
          x="14"
          y="14"
          width="20"
          height="20"
          rx="3"
          stroke="#10b981"
          strokeWidth="3.5"
          fill="#061210"
          filter="url(#kEmeraldGlow)"
        />
        {/* Inner circuit pip */}
        <rect x="20" y="20" width="8" height="8" rx="1.5" fill="#10b981" />

        {/* Middle Container Block */}
        <rect
          x="14"
          y="40"
          width="20"
          height="20"
          rx="3"
          stroke="#10b981"
          strokeWidth="3.5"
          fill="#061210"
          filter="url(#kEmeraldGlow)"
        />
        {/* Vertical Bus Link */}
        <line x1="24" y1="34" x2="24" y2="40" stroke="#10b981" strokeWidth="3" />
        <line x1="24" y1="60" x2="24" y2="66" stroke="#10b981" strokeWidth="3" />

        {/* Bottom Container Block */}
        <rect
          x="14"
          y="66"
          width="20"
          height="20"
          rx="3"
          stroke="#10b981"
          strokeWidth="3.5"
          fill="#061210"
          filter="url(#kEmeraldGlow)"
        />

        {/* --- 2. TOP-RIGHT DIAGONAL ARM & CLUSTER BLOCK --- */}
        {/* Upper diagonal conduit */}
        <path
          d="M34 50 L64 24"
          stroke="#10b981"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#kEmeraldGlow)"
        />
        {/* Top Right Floating Container Node */}
        <rect
          x="62"
          y="14"
          width="22"
          height="22"
          rx="4"
          stroke="#10b981"
          strokeWidth="3.5"
          fill="#061210"
          filter="url(#kEmeraldGlow)"
        />
        <circle cx="73" cy="25" r="3" fill="#34d399" />

        {/* --- 3. BOTTOM-RIGHT ANGULAR TERMINAL CHEVRON PROMPT --- */}
        <path
          d="M36 50 L70 82 M52 82 L70 82 L70 64"
          stroke="url(#kArmGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#kCyanGlow)"
        />

        {/* Center Connection Node */}
        <circle cx="34" cy="50" r="4.5" fill="#34d399" filter="url(#kEmeraldGlow)" />
        <circle cx="34" cy="50" r="2" fill="#ffffff" />
      </svg>

      {/* Ambient Radial Aura on hover */}
      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/25 to-cyan-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );

  // If used as a standalone hero badge card
  if (isHeroShield) {
    return (
      <div
        className={`inline-flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-[#080d14]/90 border border-slate-800 shadow-2xl backdrop-blur-md group hover:border-emerald-500/60 transition-all select-none cursor-default ${className}`}
      >
        <KNexusMonogramIcon dimension={40} />
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 font-sans font-black text-lg tracking-tight leading-none">
            <span className="text-white">KUBE</span>
            <span className="text-slate-200">MENT</span>
            <span className="relative inline-flex items-center justify-center">
              <span className="text-slate-200">O</span>
              <span className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-slate-200">R</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider mt-1">
            K8S SIMULATION PLATFORM
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${current.gap} select-none group cursor-pointer ${className}`}>
      {/* 1. Geometric K-Nexus Monogram Icon */}
      <KNexusMonogramIcon dimension={current.iconSize} />

      {/* 2. Custom Typography Wordmark */}
      {showText && (
        <div className="flex items-center gap-1.5 font-sans font-black leading-none uppercase select-none">
          <span className={`${current.kubeText} drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]`}>
            KUBE
          </span>
          <div className="flex items-center">
            <span className={`${current.mentorText} drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]`}>
              MENT
            </span>
            {/* Iconic 'O' with glowing emerald center node */}
            <span className={`relative inline-flex items-center justify-center ${current.mentorText}`}>
              <span>O</span>
              <span
                className={`absolute ${current.dotSize} rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]`}
              />
            </span>
            <span className={`${current.mentorText} drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]`}>
              R
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KubeMentorBrandLogo;

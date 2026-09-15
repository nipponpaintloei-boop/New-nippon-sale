import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'compact';
  className?: string;
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  showBadge = true,
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]', iconSize: 28 },
    md: { icon: 'w-9 h-9', text: 'text-base', sub: 'text-[11px]', iconSize: 36 },
    lg: { icon: 'w-11 h-11', text: 'text-lg', sub: 'text-xs', iconSize: 44 },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm', iconSize: 64 },
  };

  const currentSize = sizeMap[size];

  // The custom vector brand emblem
  const emblem = (
    <div
      className={`relative flex-shrink-0 ${currentSize.icon} rounded-xl bg-gradient-to-br from-red-500 via-red-600 to-rose-800 p-0.5 shadow-md shadow-red-600/30 ring-1 ring-white/20 overflow-hidden flex items-center justify-center group`}
      id="brand-logo-emblem"
    >
      {/* Subtle sheen */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-white/30 opacity-70 pointer-events-none" />

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-1.5 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="emblemN" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FEE2E2" />
          </linearGradient>
          <linearGradient id="emblemGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        {/* Left Column */}
        <rect x="18" y="20" width="16" height="60" rx="6" fill="url(#emblemN)" />

        {/* Dynamic Diagonal Paint Stroke */}
        <path
          d="M 22 22 L 78 72 C 81 74.5 84 72 84 68 L 84 26 C 84 22 80 20 77 22 L 22 72 Z"
          fill="url(#emblemN)"
          fillOpacity="0.95"
        />

        {/* Right Column */}
        <rect x="66" y="20" width="16" height="60" rx="6" fill="url(#emblemN)" />

        {/* Dynamic Paint Droplet Top-Right Accent */}
        <path
          d="M 74 6 C 74 6 86 16 86 21 C 86 26.5 81.5 31 76 31 C 70.5 31 66 26.5 66 21 C 66 16 74 6 74 6 Z"
          fill="url(#emblemGold)"
        />
        <circle cx="73" cy="18" r="2.5" fill="#FFFFFF" opacity="0.8" />
      </svg>
    </div>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{emblem}</div>;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="brand-logo-full">
      {emblem}

      <div className="flex flex-col min-w-0 leading-tight">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-black tracking-tight ${currentSize.text} bg-gradient-to-r from-red-600 via-red-500 to-rose-600 dark:from-red-400 dark:via-rose-400 dark:to-amber-400 bg-clip-text text-transparent`}
          >
            NIPPON SALE
          </span>

          {showBadge && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              PRO
            </span>
          )}
        </div>

        {variant === 'full' && (
          <span className={`${currentSize.sub} text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5`}>
            ระบบบริหารงานขายสีนิปปอน
          </span>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useAppState } from '../../context/AppStateContext';

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
  const { settings } = useAppState();
  const brandConfig = settings.brandConfig;

  const brandName = brandConfig?.brandName || 'Sale Paint Pro';
  const subTitle = brandConfig?.subTitle || 'ระบบบริหารงานขายสีและสต็อก';
  const badgeText = brandConfig?.badgeText || 'PRO';
  const themeColor = brandConfig?.themeColor || 'blue';
  const logoImageUrl = brandConfig?.logoImageUrl;

  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-sm', sub: 'text-[9px]', iconSize: 28 },
    md: { icon: 'w-9 h-9', text: 'text-base', sub: 'text-[11px]', iconSize: 36 },
    lg: { icon: 'w-11 h-11', text: 'text-lg', sub: 'text-xs', iconSize: 44 },
    xl: { icon: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm', iconSize: 64 },
  };

  const currentSize = sizeMap[size];

  // Theme gradient lookup
  const getGradientClass = () => {
    switch (themeColor) {
      case 'red':
        return 'from-red-500 via-red-600 to-rose-800 shadow-red-600/30';
      case 'emerald':
        return 'from-emerald-500 via-emerald-600 to-teal-800 shadow-emerald-600/30';
      case 'violet':
        return 'from-violet-500 via-purple-600 to-indigo-800 shadow-violet-600/30';
      case 'amber':
        return 'from-amber-500 via-amber-600 to-orange-800 shadow-amber-600/30';
      case 'teal':
        return 'from-teal-500 via-teal-600 to-cyan-800 shadow-teal-600/30';
      case 'slate':
        return 'from-slate-600 via-slate-700 to-slate-900 shadow-slate-700/30';
      case 'blue':
      default:
        return 'from-blue-500 via-blue-600 to-indigo-800 shadow-blue-600/30';
    }
  };

  const getTextGradientClass = () => {
    switch (themeColor) {
      case 'red':
        return 'from-red-600 via-red-500 to-rose-600 dark:from-red-400 dark:via-rose-400 dark:to-amber-400';
      case 'emerald':
        return 'from-emerald-600 via-emerald-500 to-teal-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400';
      case 'violet':
        return 'from-violet-600 via-purple-500 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-pink-400';
      case 'amber':
        return 'from-amber-600 via-amber-500 to-orange-600 dark:from-amber-400 dark:via-yellow-400 dark:to-orange-400';
      case 'teal':
        return 'from-teal-600 via-teal-500 to-cyan-600 dark:from-teal-400 dark:via-cyan-400 dark:to-blue-400';
      case 'slate':
        return 'from-slate-800 via-slate-600 to-slate-900 dark:from-slate-200 dark:via-slate-300 dark:to-white';
      case 'blue':
      default:
        return 'from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-400';
    }
  };

  // Custom emblem or image
  const emblem = logoImageUrl ? (
    <div
      className={`relative flex-shrink-0 ${currentSize.icon} rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm flex items-center justify-center`}
    >
      <img
        src={logoImageUrl}
        alt={brandName}
        className="w-full h-full object-contain rounded-lg"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  ) : (
    <div
      className={`relative flex-shrink-0 ${currentSize.icon} rounded-xl bg-gradient-to-br ${getGradientClass()} p-0.5 shadow-md ring-1 ring-white/20 overflow-hidden flex items-center justify-center group`}
      id="brand-logo-emblem"
    >
      {/* Subtle sheen */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-white/30 opacity-70 pointer-events-none" />

      {/* Modern paint brush / roller emblem vector */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full p-1.5 drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
          <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Paint bucket / stroke */}
        <rect x="20" y="24" width="16" height="54" rx="6" fill="url(#logoGrad)" />
        <path
          d="M 24 24 L 76 68 C 80 71 84 68 84 64 L 84 26 C 84 22 80 20 76 23 L 24 68 Z"
          fill="url(#logoGrad)"
          fillOpacity="0.95"
        />
        <rect x="64" y="24" width="16" height="54" rx="6" fill="url(#logoGrad)" />

        {/* Droplet accent */}
        <path
          d="M 74 6 C 74 6 86 16 86 21 C 86 26.5 81.5 31 76 31 C 70.5 31 66 26.5 66 21 C 66 16 74 6 74 6 Z"
          fill="url(#logoAccent)"
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
            className={`font-black tracking-tight ${currentSize.text} bg-gradient-to-r ${getTextGradientClass()} bg-clip-text text-transparent`}
          >
            {brandName}
          </span>

          {showBadge && badgeText && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-400/20">
              {badgeText}
            </span>
          )}
        </div>

        {variant === 'full' && (
          <span className={`${currentSize.sub} text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5`}>
            {subTitle}
          </span>
        )}
      </div>
    </div>
  );
};

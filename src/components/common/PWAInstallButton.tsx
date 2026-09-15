import React from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  variant?: 'header' | 'sidebar' | 'drawer' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // If already installed on screen, show a badge or subtle status
  if (isInstalled) {
    if (variant === 'sidebar' || variant === 'drawer') {
      return (
        <div className={`px-3 py-2 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2 ${className}`}>
          <div className="w-5 h-5 rounded-full bg-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <div>
            <span className="font-semibold block">ติดตั้งแล้ว</span>
            <span className="text-[9px] text-emerald-400/70">ทำงานบนหน้าจอหลัก</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        onOpenModal();
      }
    } else {
      onOpenModal();
    }
  };

  if (variant === 'sidebar' || variant === 'drawer') {
    return (
      <button
        type="button"
        onClick={handleClick}
        id="sidebar-pwa-install-btn"
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer border border-red-500/30 bg-gradient-to-r from-red-950/40 to-rose-950/30 hover:from-red-900/50 hover:to-rose-900/40 text-red-200 hover:text-white shadow-sm ${className}`}
        title="ติดตั้ง Nippon Sale บนหน้าจอหลัก"
      >
        <div className="p-1.5 rounded-lg bg-red-600/30 text-red-400 group-hover:bg-red-600 group-hover:text-white transition-colors">
          <Download className="w-4 h-4 animate-pulse" />
        </div>
        <div className="text-left flex-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-red-200">ติดตั้งบนหน้าจอ</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-red-600/80 text-white rounded-full font-bold">
              PWA
            </span>
          </div>
          <span className="text-[10px] text-slate-400">ติดตั้งเป็นแอพลงเครื่อง</span>
        </div>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        id="compact-pwa-install-btn"
        className={`p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer ${className}`}
        title="ติดตั้งบนหน้าจอ"
      >
        <Download className="w-4 h-4" />
      </button>
    );
  }

  // Header default variant
  return (
    <button
      type="button"
      onClick={handleClick}
      id="header-pwa-install-btn"
      className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border-red-500 shadow-sm shadow-red-600/20 active:scale-95 ${className}`}
      title="ติดตั้งแอพพลิเคชันลงบนหน้าจอหลักเพื่อความสะดวกและรวดเร็ว"
    >
      <Download className="w-3.5 h-3.5 animate-bounce" />
      <span>ติดตั้งบนหน้าจอ</span>
      <span className="px-1 py-0.2 rounded text-[9px] font-black bg-white/20 uppercase">
        APP
      </span>
    </button>
  );
};

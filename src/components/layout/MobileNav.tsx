import React from 'react';
import { LayoutDashboard, History, Plus, Package, Menu } from 'lucide-react';
import { MainTabType } from './Sidebar';

interface MobileNavProps {
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenDrawer,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
      <button
        onClick={() => onSelectTab('dash')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'dash'
            ? 'text-red-600 dark:text-red-500 font-bold scale-105'
            : 'text-slate-500 dark:text-slate-400 font-medium'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">ภาพรวม</span>
      </button>

      <button
        onClick={() => onSelectTab('history')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'history'
            ? 'text-red-600 dark:text-red-500 font-bold scale-105'
            : 'text-slate-500 dark:text-slate-400 font-medium'
        }`}
      >
        <History className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">ประวัติ</span>
      </button>

      {/* Primary Action Button (FAB) for Sales Entry */}
      <button
        onClick={() => onSelectTab('entry')}
        className={`flex flex-col items-center justify-center -mt-6 w-14 h-14 rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer ${
          currentTab === 'entry'
            ? 'bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-500/40 ring-4 ring-red-100 dark:ring-red-950/80 scale-105'
            : 'bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-red-500/30'
        }`}
        title="บันทึกการขาย"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      <button
        onClick={() => onSelectTab('stock')}
        className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all cursor-pointer ${
          currentTab === 'stock'
            ? 'text-red-600 dark:text-red-500 font-bold scale-105'
            : 'text-slate-500 dark:text-slate-400 font-medium'
        }`}
      >
        <Package className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">สต็อก</span>
      </button>

      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center w-14 py-1 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 transition-colors cursor-pointer"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">เมนู</span>
      </button>
    </nav>
  );
};

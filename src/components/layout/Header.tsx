import React, { useState, useEffect } from 'react';
import { Menu, Bell, User, LogOut, Calendar, ChevronDown, Sparkles, FileSpreadsheet } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { THAI_MONTHS } from '../../data/constants';
import { extractUsername, signOutUser } from '../../services/auth';
import { getConnectionStatus, getGoogleSheetsConfig } from '../../services/googleSheetsSync';
import { Logo } from '../common/Logo';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  onOpenDrawer: () => void;
  onOpenActionCenter?: () => void;
  onOpenSheetsModal?: () => void;
  onOpenInstallModal?: () => void;
  actionCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDrawer,
  onOpenActionCenter,
  onOpenSheetsModal,
  onOpenInstallModal,
  actionCount = 0,
}) => {
  const { activeMonth, setActiveMonth, currentUser, setCurrentUser } = useAppState();
  const currentYear = parseInt(activeMonth.split('-')[0], 10) || new Date().getFullYear();

  const [sheetsStatus, setSheetsStatus] = useState<string>('disconnected');

  useEffect(() => {
    const update = () => setSheetsStatus(getConnectionStatus());
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveMonth(e.target.value);
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Mobile Menu button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDrawer}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            title="เปิดเมนู"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="lg:hidden">
            <Logo size="sm" variant="compact" />
          </div>
          <div className="hidden lg:block text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-semibold text-slate-700 dark:text-slate-300">สาขาเลย (Loei Branch)</span> · ระบบบริการและบันทึกยอดขาย
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl px-3.5 py-1.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 transition-colors">
          <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div className="relative flex items-center">
            <select
              value={activeMonth}
              onChange={handleMonthChange}
              className="appearance-none bg-transparent pr-6 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((year) =>
                THAI_MONTHS.map((mName, idx) => {
                  const mStr = `${year}-${String(idx + 1).padStart(2, '0')}`;
                  return (
                    <option key={mStr} value={mStr} className="text-slate-900 bg-white dark:bg-slate-900 font-medium">
                      เดือน {mName} {year + 543}
                    </option>
                  );
                })
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-0 pointer-events-none" />
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-2">
          {onOpenInstallModal && (
            <PWAInstallButton onOpenModal={onOpenInstallModal} variant="header" />
          )}

          {onOpenSheetsModal && (
            <button
              type="button"
              onClick={onOpenSheetsModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                sheetsStatus === 'connected'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
                  : sheetsStatus === 'expired'
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200'
              }`}
              title="ตั้งค่าเชื่อมต่อ Google Sheets Auto-sync"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">
                {sheetsStatus === 'connected'
                  ? 'Sheets เชื่อมต่อแล้ว'
                  : sheetsStatus === 'expired'
                  ? 'ต่ออายุ Sheets'
                  : 'เชื่อม Google Sheets'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  sheetsStatus === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : sheetsStatus === 'expired'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              ></span>
            </button>
          )}

          {onOpenActionCenter && (
            <button
              type="button"
              onClick={onOpenActionCenter}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5" />
              {actionCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {actionCount}
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {extractUsername(currentUser)}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  ออนไลน์
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">พร้อมใช้งาน</span>
              <span className="sm:hidden">พร้อม</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

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
  onOpenGoogleAuth?: () => void;
  actionCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDrawer,
  onOpenActionCenter,
  onOpenSheetsModal,
  onOpenInstallModal,
  onOpenGoogleAuth,
  actionCount = 0,
}) => {
  const { activeMonth, setActiveMonth, currentUser, setCurrentUser, googleProfile, setGoogleProfile } = useAppState();
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
    setGoogleProfile(null);
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

          {currentUser || googleProfile ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onOpenGoogleAuth}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer text-left"
                title="คลิกเพื่อดูข้อมูลบัญชีผู้ใช้"
              >
                {googleProfile?.picture ? (
                  <img
                    src={googleProfile.picture}
                    alt={googleProfile.name || 'User'}
                    className="w-7 h-7 rounded-full ring-2 ring-emerald-500 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                    {(extractUsername(currentUser, googleProfile) || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[120px] truncate">
                    {extractUsername(currentUser, googleProfile)}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    ออนไลน์
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenGoogleAuth}
              id="header-google-login-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
              title="เข้าสู่ระบบด้วย Google เพื่อซิงค์ข้อมูลกับ Google Sheets อัตโนมัติ"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

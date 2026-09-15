import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileBarChart2,
  Award,
  Package,
  Users,
  CalendarRange,
  ShoppingCart,
  Sun,
  Calendar,
  Target,
  FileText,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { useAppState } from '../../context/AppStateContext';
import { extractUsername } from '../../services/auth';

export type MainTabType =
  | 'dash'
  | 'entry'
  | 'history'
  | 'report'
  | 'commission'
  | 'stock'
  | 'customers'
  | 'yearly';

interface SidebarProps {
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onOpenOrderModal: () => void;
  onOpenDailyBrief: () => void;
  onOpenWeeklyReview: () => void;
  onOpenTargetModal: () => void;
  onOpenAuditModal: () => void;
  onOpenSheetsModal?: () => void;
  onOpenInstallModal?: () => void;
  onOpenGoogleAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenOrderModal,
  onOpenDailyBrief,
  onOpenWeeklyReview,
  onOpenTargetModal,
  onOpenAuditModal,
  onOpenSheetsModal,
  onOpenInstallModal,
  onOpenGoogleAuth,
}) => {
  const navItems: { id: MainTabType; label: string; sub: string; icon: React.ElementType }[] = [
    { id: 'dash', label: 'ภาพรวมยอดขาย', sub: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'บันทึกการขาย', sub: 'Sales Entry', icon: PlusCircle },
    { id: 'history', label: 'ประวัติและส่งออก', sub: 'History & Export', icon: History },
    { id: 'report', label: 'ส่วนแบ่งตลาด MKS', sub: 'Market Share', icon: FileBarChart2 },
    { id: 'commission', label: 'คำนวณคอมมิชชั่น', sub: 'Incentives', icon: Award },
    { id: 'stock', label: 'สต็อกและสินค้า', sub: 'Inventory Stock', icon: Package },
    { id: 'customers', label: 'ลูกค้าและ CRM', sub: 'Customers & Due', icon: Users },
    { id: 'yearly', label: 'ภาพรวมรายปี', sub: 'Yearly Overview', icon: CalendarRange },
  ];

  const { currentUser, googleProfile } = useAppState();

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-100 border-r border-slate-800/80 p-5 h-screen sticky top-0 overflow-y-auto select-none z-20 shadow-2xl">
      {/* Brand Header */}
      <div className="px-3 py-3 mb-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <Logo size="md" variant="full" />
      </div>

      {/* Google User Status / Login Banner */}
      {onOpenGoogleAuth && (
        <div className="mb-4">
          {currentUser || googleProfile ? (
            <button
              type="button"
              onClick={onOpenGoogleAuth}
              className="w-full p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 flex items-center gap-3 transition-colors cursor-pointer text-left group"
              title="จัดการบัญชีผู้ใช้งาน"
            >
              {googleProfile?.picture ? (
                <img
                  src={googleProfile.picture}
                  alt={googleProfile.name || 'User'}
                  className="w-9 h-9 rounded-full ring-2 ring-emerald-500/80 object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                  {(extractUsername(currentUser, googleProfile) || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate block">
                    {extractUsername(currentUser, googleProfile)}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {googleProfile?.email || currentUser?.email || 'เข้าสู่ระบบแล้ว'}
                </span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenGoogleAuth}
              id="sidebar-google-signin-btn"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-800/80 hover:from-slate-750 hover:to-slate-700 text-white border border-slate-700 text-xs font-bold transition-all shadow-sm group cursor-pointer"
              title="เข้าสู่ระบบด้วย Google เพื่อเปิดการซิงค์ข้อมูล Google Sheets อัตโนมัติ"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-lg bg-white flex items-center justify-center">
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
                </div>
                <span>ล็อกอินด้วย Google</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      )}

      {/* Main Navigation */}
      <div className="space-y-1.5">
        <div className="px-3 flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          <span>โมดูลการทำงาน</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">8 เมนู</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-red-400'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                </div>
                <div className="text-left truncate">
                  <div className="font-bold text-[13px] leading-tight">{item.label}</div>
                  <div className={`text-[10px] font-medium leading-none mt-0.5 ${isActive ? 'text-red-100' : 'text-slate-500'}`}>
                    {item.sub}
                  </div>
                </div>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-5 border-t border-slate-800/80" />

      {/* Quick Tools & Modals */}
      <div className="space-y-1.5">
        <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
          เครื่องมือส่งออก LINE
        </p>
        <button
          onClick={onOpenOrderModal}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-slate-800 text-red-400 group-hover:bg-red-950/50">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-semibold block text-slate-200">สร้างใบสั่งสินค้า</span>
            <span className="text-[10px] text-slate-500">คัดลอกส่งเข้า LINE</span>
          </div>
        </button>

        <button
          onClick={onOpenDailyBrief}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 group-hover:bg-amber-950/50">
            <Sun className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-semibold block text-slate-200">สรุปยอดประจำวัน</span>
            <span className="text-[10px] text-slate-500">Daily Brief ส่งกลุ่ม</span>
          </div>
        </button>

        <button
          onClick={onOpenWeeklyReview}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-950/50">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-semibold block text-slate-200">สรุปยอดสัปดาห์</span>
            <span className="text-[10px] text-slate-500">Weekly Review & Top 3</span>
          </div>
        </button>

        <button
          onClick={onOpenTargetModal}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 group-hover:bg-emerald-950/50">
            <Target className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-semibold block text-slate-200">ตั้งเป้าหมาย & PC</span>
            <span className="text-[10px] text-slate-500">ปรับ Target & Headcount</span>
          </div>
        </button>

        <button
          onClick={onOpenAuditModal}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-slate-800 text-purple-400 group-hover:bg-purple-950/50">
            <FileText className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="font-semibold block text-slate-200">บันทึกกิจกรรม</span>
            <span className="text-[10px] text-slate-500">Audit Logs ตรวจสอบ</span>
          </div>
        </button>

        {onOpenInstallModal && (
          <PWAInstallButton onOpenModal={onOpenInstallModal} variant="sidebar" />
        )}

        {onOpenSheetsModal && (
          <button
            onClick={onOpenSheetsModal}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors group cursor-pointer border border-emerald-900/40 bg-emerald-950/20"
          >
            <div className="p-1.5 rounded-lg bg-emerald-900/60 text-emerald-400 group-hover:bg-emerald-800/60">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold block text-emerald-200">Google Sheets</span>
                <span className="text-[9px] px-1 py-0.2 bg-emerald-900/80 text-emerald-300 rounded font-mono">Auto</span>
              </div>
              <span className="text-[10px] text-slate-500">ซิงค์อัตโนมัติ Cloud</span>
            </div>
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-4 px-3 border-t border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-400">Nippon Paint Pro</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400">v2.5</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">Local-First Engine & Cloud Sync</p>
      </div>
    </aside>
  );
};

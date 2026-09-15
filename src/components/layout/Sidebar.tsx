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

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-100 border-r border-slate-800/80 p-5 h-screen sticky top-0 overflow-y-auto select-none z-20 shadow-2xl">
      {/* Brand Header */}
      <div className="flex items-center gap-3.5 px-3 py-3 mb-6 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-red-500/25 ring-2 ring-red-400/20 flex-shrink-0">
          N
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="font-black text-white text-base tracking-tight leading-none">
              NIPPON SALE
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">
            ระบบบริหารงานขายสีนิปปอน
          </p>
        </div>
      </div>

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

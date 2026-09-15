import React from 'react';
import {
  X,
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
  FileSpreadsheet,
  Sliders,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import { MainTabType } from './Sidebar';
import { useAppState } from '../../context/AppStateContext';
import { signOutUser } from '../../services/auth';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: MainTabType;
  onSelectTab: (tab: MainTabType) => void;
  onOpenOrderModal: () => void;
  onOpenDailyBrief: () => void;
  onOpenWeeklyReview: () => void;
  onOpenTargetModal: () => void;
  onOpenCommissionRuleModal?: () => void;
  onOpenGallonRuleModal: () => void;
  onOpenImportModal: () => void;
  onOpenSheetsModal?: () => void;
  onOpenAuditModal: () => void;
  onOpenResetModal: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  onOpenOrderModal,
  onOpenDailyBrief,
  onOpenWeeklyReview,
  onOpenTargetModal,
  onOpenCommissionRuleModal,
  onOpenGallonRuleModal,
  onOpenImportModal,
  onOpenSheetsModal,
  onOpenAuditModal,
  onOpenResetModal,
}) => {
  const { currentUser, setCurrentUser } = useAppState();

  if (!isOpen) return null;

  const handleTabClick = (tab: MainTabType) => {
    onSelectTab(tab);
    onClose();
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start transition-opacity">
      <div className="w-80 max-w-[85vw] bg-slate-900 text-slate-100 h-full p-6 flex flex-col overflow-y-auto shadow-2xl border-r border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-black text-xl shadow-md">
              N
            </div>
            <div>
              <h2 className="font-black text-white text-base tracking-tight">NIPPON SALE</h2>
              <p className="text-xs text-slate-400">ระบบบริหารงานขายสีนิปปอน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="py-4 space-y-1.5">
          <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            เมนูหลักทั้งหมด
          </p>
          {[
            { id: 'dash', label: 'ภาพรวมยอดขาย', icon: LayoutDashboard },
            { id: 'entry', label: 'บันทึกการขาย', icon: PlusCircle },
            { id: 'history', label: 'ประวัติและส่งออก', icon: History },
            { id: 'report', label: 'ส่วนแบ่งตลาด MKS', icon: FileBarChart2 },
            { id: 'commission', label: 'คำนวณคอมมิชชั่น', icon: Award },
            { id: 'stock', label: 'สต็อกและสินค้า', icon: Package },
            { id: 'customers', label: 'ลูกค้าและ CRM', icon: Users },
            { id: 'yearly', label: 'ภาพรวมรายปี', icon: CalendarRange },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id as MainTabType)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="py-4 border-t border-slate-800 space-y-1">
          <p className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            เครื่องมือและบริการ
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenOrderModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-red-400" />
            <span>สร้างใบสั่งสินค้า (LINE)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenDailyBrief();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Sun className="w-4 h-4 text-amber-400" />
            <span>สรุปประจำวัน (Daily Brief)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenWeeklyReview();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>สรุปสัปดาห์ (Weekly Review)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenTargetModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4 text-emerald-400" />
            <span>ตั้งเป้าหมาย & Headcount</span>
          </button>

          {onOpenCommissionRuleModal && (
            <button
              onClick={() => {
                onClose();
                onOpenCommissionRuleModal();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-red-400" />
              <span>ตั้งเกณฑ์คอมมิชชั่นขั้นบันได</span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenGallonRuleModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            <span>ตั้งเกณฑ์ค่าถัง (Gallon Incentives)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenImportModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>นำเข้าไฟล์ Excel (.xlsx)</span>
          </button>

          {onOpenSheetsModal && (
            <button
              onClick={() => {
                onClose();
                onOpenSheetsModal();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 text-green-400" />
                <span>Google Sheets Auto-sync</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
                Auto
              </span>
            </button>
          )}

          <button
            onClick={() => {
              onClose();
              onOpenAuditModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>ประวัติกิจกรรม (Audit Log)</span>
          </button>
        </div>

        {/* Footer & Danger Actions */}
        <div className="mt-auto pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenResetModal();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>รีเซ็ตข้อมูลทั้งหมด</span>
          </button>

          {currentUser && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

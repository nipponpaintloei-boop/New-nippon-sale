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
import { signOutUser, extractUsername } from '../../services/auth';
import { Logo } from '../common/Logo';
import { PWAInstallButton } from '../common/PWAInstallButton';

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
  onOpenInstallModal?: () => void;
  onOpenGoogleAuth?: () => void;
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
  onOpenInstallModal,
  onOpenGoogleAuth,
}) => {
  const { currentUser, setCurrentUser, googleProfile, setGoogleProfile } = useAppState();

  if (!isOpen) return null;

  const handleTabClick = (tab: MainTabType) => {
    onSelectTab(tab);
    onClose();
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setGoogleProfile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-start transition-opacity">
      <div className="w-80 max-w-[85vw] bg-slate-900 text-slate-100 h-full p-6 flex flex-col overflow-y-auto shadow-2xl border-r border-slate-800">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Logo size="md" variant="full" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Google User Status / Login Banner in Drawer */}
        {onOpenGoogleAuth && (
          <div className="py-3 border-b border-slate-800/80">
            {currentUser || googleProfile ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleAuth();
                }}
                className="w-full p-2.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 flex items-center gap-3 transition-colors cursor-pointer text-left"
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
                    {googleProfile?.email || currentUser?.email}
                  </span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoogleAuth();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                  <span>เข้าสู่ระบบด้วย Google</span>
                </div>
              </button>
            )}
          </div>
        )}

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

          {onOpenInstallModal && (
            <div className="py-1">
              <PWAInstallButton
                onOpenModal={() => {
                  onClose();
                  onOpenInstallModal();
                }}
                variant="drawer"
              />
            </div>
          )}

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

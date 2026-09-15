import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import {
  loginWithGoogleSheets,
  getGoogleSheetsConfig,
  saveGoogleSheetsConfig,
  getConnectionStatus,
  syncToGoogleSheets,
  GoogleSheetsConfig,
} from '../../services/googleSheetsSync';
import { signOutUser } from '../../services/auth';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSheetsSetup?: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenSheetsSetup,
}) => {
  const { currentUser, setCurrentUser, googleProfile, setGoogleProfile, sales, products } = useAppState();

  const [clientIdInput, setClientIdInput] = useState<string>(() => {
    const config = getGoogleSheetsConfig();
    return config.clientId || '';
  });
  const [showConfigDetails, setShowConfigDetails] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const currentConfig = getGoogleSheetsConfig();
  const sheetsStatus = getConnectionStatus();
  const isAuthenticated = !!(currentUser || googleProfile);

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleGoogleSignIn = async () => {
    let effectiveClientId = clientIdInput.trim() || currentConfig.clientId;
    if (!effectiveClientId) {
      // Auto prompt to enter Client ID
      setShowConfigDetails(true);
      setStatusMessage({
        text: 'กรุณาระบุ Google OAuth Client ID ก่อนเข้าสู่ระบบ (ดูขั้นตอนด้านล่าง)',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    const res = await loginWithGoogleSheets(effectiveClientId);
    setIsLoading(false);

    if (res.success && res.user) {
      setGoogleProfile({
        email: res.user.email,
        name: res.user.name,
        picture: res.user.picture,
      });

      setStatusMessage({
        text: `ยินดีต้อนรับคุณ ${res.user.name || res.user.email}! เข้าสู่ระบบและเชื่อมต่อ Google Sheets สำเร็จ`,
        type: 'success',
      });

      // If spreadsheet is already set, auto-trigger a background sync
      if (currentConfig.spreadsheetId) {
        syncToGoogleSheets(sales, products, false);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } else if (res.success) {
      setStatusMessage({
        text: 'เข้าสู่ระบบสำเร็จแล้ว!',
        type: 'success',
      });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage({
        text: res.error || 'ไม่สามารถเข้าสู่ระบบ Google ได้',
        type: 'error',
      });
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setGoogleProfile(null);
    setStatusMessage({
      text: 'ออกจากระบบเรียบร้อยแล้ว',
      type: 'info',
    });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 px-6 pt-6 pb-5 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-lg p-2.5">
              {/* Google G Logo SVG */}
              <svg className="w-full h-full" viewBox="0 0 24 24">
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
            <div>
              <h3 className="text-lg font-black tracking-tight leading-none">
                {isAuthenticated ? 'ข้อมูลบัญชีผู้ใช้งาน' : 'เข้าสู่ระบบด้วย Google'}
              </h3>
              <p className="text-xs text-white/80 mt-1 font-medium">
                เชื่อมต่อระบบขายและซิงค์ Google Sheets ในคลิกเดียว
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {isAuthenticated ? (
            /* Logged in View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5">
                {googleProfile?.picture ? (
                  <img
                    src={googleProfile.picture}
                    alt={googleProfile.name || 'User'}
                    className="w-13 h-13 rounded-full ring-2 ring-emerald-500 shadow-sm object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-full bg-gradient-to-br from-red-600 to-amber-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                    {(googleProfile?.name || currentUser?.email || 'N')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white truncate text-sm">
                      {googleProfile?.name || currentUser?.email?.split('@')[0]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      ออนไลน์
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {googleProfile?.email || currentUser?.email}
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    เชื่อมต่อ Google Sheets พร้อมใช้งาน
                  </p>
                </div>
              </div>

              {/* Connected Sheet Summary */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-600 text-white flex-shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                      {currentConfig.spreadsheetName || (currentConfig.spreadsheetId ? 'Google Spreadsheet ที่เชื่อมต่อ' : 'ยังไม่ได้ระบุสเปรดชีต')}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {currentConfig.spreadsheetId ? `ID: ${currentConfig.spreadsheetId.slice(0, 15)}...` : 'คลิกเพื่อตั้งค่าสเปรดชีต'}
                    </span>
                  </div>
                </div>

                {onOpenSheetsSetup && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSheetsSetup();
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors cursor-pointer"
                  >
                    ตั้งค่าชีท
                  </button>
                )}
              </div>

              {/* Sign out button */}
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ (Sign Out)
              </button>
            </div>
          ) : (
            /* Login View */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-950/20 dark:to-amber-950/20 border border-red-200/60 dark:border-red-900/30">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300 mb-1">
                  <Sparkles className="w-4 h-4" />
                  สิทธิพิเศษเมื่อล็อกอินด้วย Google
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>ซิงค์ยอดขายและสต็อกขึ้น Google Sheets อัตโนมัติในคลิกเดียว</li>
                  <li>ระบุชื่อผู้บันทึกยอดขายลงในชีทของสาขาอย่างแม่นยำ</li>
                  <li>ระบบจำกัดสิทธิ์ความปลอดภัยด้วยมาตรฐานสากล</li>
                </ul>
              </div>

              {/* 1-Click Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                id="google-signin-btn"
                className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-red-600" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                )}
                <span>{isLoading ? 'กำลังเปิดหน้าต่าง Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>

              {/* Iframe tip */}
              {isInIframe && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                    หากหน้าต่างป๊อปอัปปิดเองหรือถูกบล็อก ให้กดเปิดแอพในแท็บใหม่
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="flex-shrink-0 px-2.5 py-1 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    แท็บใหม่
                  </button>
                </div>
              )}

              {/* Client ID Configuration accordion */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConfigDetails(!showConfigDetails)}
                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-between w-full font-semibold cursor-pointer"
                >
                  <span>การตั้งค่า Google OAuth Client ID {currentConfig.clientId ? '(ตั้งค่าแล้ว)' : '(จำเป็นต้องใส่)'}</span>
                  <span className="text-[10px] text-red-600">{showConfigDetails ? 'ซ่อน' : 'แก้ไข / ตรวจสอบ'}</span>
                </button>

                {showConfigDetails && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 space-y-3 border border-slate-200/70 dark:border-slate-750">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Google OAuth Client ID:
                      </label>
                      <input
                        type="text"
                        value={clientIdInput}
                        onChange={(e) => {
                          setClientIdInput(e.target.value);
                          saveGoogleSheetsConfig({ clientId: e.target.value.trim() });
                        }}
                        placeholder="เช่น 123456789-xxx.apps.googleusercontent.com"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      <div className="font-bold text-slate-700 dark:text-slate-300">Authorized JavaScript origins ที่ต้องใส่ใน Google Cloud:</div>
                      <div className="font-mono text-[9.5px] select-all text-blue-600 dark:text-blue-400 break-all">
                        {typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-k5jxs6yno5sryudinyz57g-459159427758.asia-east1.run.app'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px]">มาตรฐานความปลอดภัย Google OAuth 2.0</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

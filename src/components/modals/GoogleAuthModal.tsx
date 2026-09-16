import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, LogOut, ShieldCheck, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { getGoogleClientId, loginWithGoogle, signOutUser } from '../../services/auth';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSheetsSetup?: () => void;
  onOpenBrandSetup?: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onOpenSheetsSetup,
}) => {
  const {
    currentUser,
    setCurrentUser,
    googleProfile,
    setGoogleProfile,
    refreshData,
  } = useAppState();

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const isAuthenticated = !!(currentUser || googleProfile);
  const isConfigured = !!getGoogleClientId();
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const res = await loginWithGoogle();
    setIsLoading(false);

    if (res.success && res.user && res.profile) {
      setCurrentUser(res.user);
      setGoogleProfile(res.profile);
      await refreshData();
      setStatusMessage({
        text: `เข้าสู่ระบบสำเร็จ: ${res.profile.name || res.profile.email}`,
        type: 'success',
      });
      setTimeout(() => {
        onClose();
        onOpenBrandSetup?.();
      }, 700);
    } else {
      setStatusMessage({ text: res.error || 'ไม่สามารถเข้าสู่ระบบ Google ได้', type: 'error' });
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setGoogleProfile(null);
    setStatusMessage({ text: 'ออกจากระบบเรียบร้อยแล้ว', type: 'info' });
    setTimeout(onClose, 500);
  };

  const handleOpenInNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        <div className="relative bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 px-6 pt-6 pb-5 text-white">
          <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg p-2.5">
              <span className="text-xl font-black text-red-600">G</span>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">{isAuthenticated ? 'บัญชีผู้ใช้งาน' : 'เข้าสู่ระบบด้วย Google'}</h3>
              <p className="text-xs text-white/80 mt-1">บัญชี Google ใช้เป็นเจ้าของข้อมูลของโปรไฟล์นี้</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5">
                {googleProfile?.picture ? (
                  <img src={googleProfile.picture} alt={googleProfile.name || 'User'} className="w-12 h-12 rounded-full ring-2 ring-emerald-500 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-amber-600 text-white font-black text-xl flex items-center justify-center">
                    {(googleProfile?.name || currentUser?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 dark:text-white truncate">{googleProfile?.name || currentUser?.email}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{googleProfile?.email || currentUser?.email}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">ข้อมูลถูกแยกตามบัญชี Google นี้</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-200">
                <Sparkles className="w-4 h-4 inline mr-1" />
                หลังเข้าสู่ระบบ ให้ตั้งชื่อร้าน/แบรนด์ โลโก้ เป้ายอดขาย และค่าคอมมิชชั่นของธุรกิจคุณเองได้จากเมนูปรับแต่งแบรนด์และเมนูคอมมิชชั่น
              </div>

              {onOpenSheetsSetup && (
                <button type="button" onClick={() => { onClose(); onOpenSheetsSetup(); }} className="w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-700 font-bold text-xs hover:bg-emerald-50 flex items-center justify-center gap-2">
                  ตั้งค่า Google Sheets ของบัญชีนี้
                </button>
              )}

              <button type="button" onClick={handleSignOut} className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> ออกจากระบบ
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!isConfigured && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  แอปยังไม่ได้ตั้งค่า <b>VITE_GOOGLE_CLIENT_ID</b> ใน deployment จึงยังเข้าสู่ระบบไม่ได้
                </div>
              )}

              <button type="button" onClick={handleGoogleSignIn} disabled={isLoading || !isConfigured} className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-sm flex items-center justify-center gap-3 disabled:opacity-50">
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-red-600" /> : <span className="font-black text-xl text-red-600">G</span>}
                {isLoading ? 'กำลังเปิดหน้าต่าง Google...' : 'เข้าสู่ระบบด้วย Google'}
              </button>

              {isInIframe && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-800">ถ้า popup ถูกบล็อก ให้เปิดแอปในแท็บใหม่</span>
                  <button type="button" onClick={handleOpenInNewTab} className="px-2.5 py-1 text-[11px] font-bold bg-amber-600 text-white rounded-lg flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> แท็บใหม่
                  </button>
                </div>
              )}

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Google OAuth ใช้ระบุตัวเจ้าของโปรไฟล์ ไม่ต้องสร้าง Supabase account
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

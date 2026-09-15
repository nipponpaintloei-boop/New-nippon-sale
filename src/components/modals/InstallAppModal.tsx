import React from 'react';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Zap,
  Wifi,
  ShieldCheck,
  Monitor,
  Sparkles,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Logo } from '../common/Logo';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      id="install-app-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="install-app-modal-container"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient banner */}
        <div className="relative bg-gradient-to-br from-red-600 via-red-500 to-rose-700 p-6 text-white text-center overflow-hidden">
          {/* Background circles */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/15 rounded-full blur-lg pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Icon preview */}
          <div className="relative mx-auto mb-3 w-20 h-20 rounded-2xl bg-white p-1 shadow-xl shadow-red-950/30 flex items-center justify-center">
            <img
              src="/icon.svg"
              alt="Nippon Sale Icon"
              className="w-full h-full rounded-xl object-contain drop-shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
              PRO
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight">ติดตั้งบนหน้าจอหลัก</h2>
          <p className="text-xs text-red-100 mt-1 font-medium">
            Nippon Sale Pro — ใช้งานสะดวกเหมือนแอพแท้บนมือถือและคอมพิวเตอร์
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Status section */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">
                ติดตั้งเรียบร้อยแล้ว!
              </h3>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                คุณกำลังเปิดใช้งาน Nippon Sale ผ่านหน้าจอหลัก (Standalone Mode) อย่างสมบูรณ์แบบ
              </p>
            </div>
          ) : isInstallable ? (
            <div className="space-y-3 text-center">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer"
              >
                <Download className="w-5 h-5 animate-bounce" />
                <span>กดติดตั้งลงบนหน้าจอทันที</span>
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                คลิกเพียง 1 ครั้ง ระบบจะสร้างไอคอนแอพบนหน้าจอโทรศัพท์หรือคอมพิวเตอร์ของคุณ
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/70 dark:border-red-900/40 text-xs text-red-900 dark:text-red-200 font-semibold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>วิธีติดตั้งบน iPhone / iPad (ผ่าน Safari):</span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      แตะปุ่ม "แชร์" (Share)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ที่แถบเครื่องมือด้านล่างของหน้าจอ Safari (ไอคอนสี่เหลี่ยมลูกศรชี้ขึ้น{' '}
                      <Share className="inline w-3 h-3 text-blue-500" />)
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      เลือก "เพิ่มไปยังหน้าจอโฮม"
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      เลื่อนลงมาในเมนูแชร์ แล้วแตะ "Add to Home Screen"{' '}
                      <PlusSquare className="inline w-3 h-3 text-amber-500" />
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      แตะ "เพิ่ม" (Add)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      ที่มุมขวาบนของหน้าจอ ไอคอน Nippon Sale จะปรากฏบนหน้าจอโฮมของคุณทันที!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* General Browser / Desktop Instructions */
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <Monitor className="w-4 h-4 text-red-500" />
                  <span>วิธีติดตั้งผ่านเบราว์เซอร์:</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  • บน <strong>Chrome / Edge</strong>: สังเกตไอคอนติดตั้ง <Download className="inline w-3 h-3 text-red-500" /> หรือ <Sparkles className="inline w-3 h-3 text-amber-500" /> ที่แถบขวาของช่องกรอก URL แล้วกด <strong>"ติดตั้ง" (Install)</strong>
                  <br />
                  • บนมือถือ Android: แตะเมนู 3 จุด (⋮) มุมขวาบน แล้วเลือก <strong>"ติดตั้งแอป"</strong> หรือ <strong>"เพิ่มไปยังหน้าจอหลัก"</strong>
                </p>
              </div>
            </div>
          )}

          {/* Benefits Grid */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              จุดเด่นเมื่อติดตั้งบนหน้าจอ
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    เปิดไวใน 1 วิ
                  </span>
                  <span className="text-[10px] text-slate-500">แตะจากหน้าจอโฮมทันที</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    เต็มจอไร้แถบ
                  </span>
                  <span className="text-[10px] text-slate-500">ซ่อน URL bar สบายตา</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
                <Wifi className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    บันทึกออฟไลน์
                  </span>
                  <span className="text-[10px] text-slate-500">เน็ตหลุดข้อมูลไม่หาย</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    ปลอดภัยสูงสุด
                  </span>
                  <span className="text-[10px] text-slate-500">ซิงค์ชีทอัตโนมัติ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

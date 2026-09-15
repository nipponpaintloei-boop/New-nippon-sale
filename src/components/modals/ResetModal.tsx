import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, X, Loader2 } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose }) => {
  const { resetAllData } = useAppState();
  const [confirmText, setConfirmText] = useState<string>('');
  const [resetting, setResetting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    if (confirmText.toLowerCase() !== 'reset') return;
    setResetting(true);
    await resetAllData();
    setResetting(false);
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                รีเซ็ตข้อมูลทั้งหมด
              </h3>
              <p className="text-xs text-slate-400">คืนค่าข้อมูลระบบเป็นค่าเริ่มต้น</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            การดำเนินการนี้จะล้างข้อมูลยอดขาย สต็อก รายงาน MKS และข้อมูลลูกค้าที่ถูกบันทึกไว้
            และคืนค่าเป็นชุดข้อมูลตัวอย่างเริ่มต้น
          </p>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 font-medium">
            โปรดยืนยันโดยพิมพ์คำว่า <b className="font-mono font-black text-rose-600">RESET</b> ในช่องด้านล่าง:
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="พิมพ์ RESET เพื่อยืนยัน"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-center text-sm uppercase"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirmReset}
            disabled={confirmText.toLowerCase() !== 'reset' || resetting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
          >
            {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            <span>{resetting ? 'กำลังรีเซ็ต...' : 'ยืนยันรีเซ็ตข้อมูล'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

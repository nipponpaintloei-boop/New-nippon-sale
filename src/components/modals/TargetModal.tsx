import React, { useState, useEffect } from 'react';
import { Target, Users, Save, X } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { DEFAULT_TARGET } from '../../data/seedData';
import { thaiMonthYear } from '../../services/calculations';

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TargetModal: React.FC<TargetModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, activeMonth } = useAppState();
  const currentTarget = settings?.targets?.[activeMonth] || DEFAULT_TARGET;
  const currentPcCount = settings?.pcCount?.[activeMonth] || 1;

  const [targetVal, setTargetVal] = useState<number>(currentTarget);
  const [pcVal, setPcVal] = useState<number>(currentPcCount);

  useEffect(() => {
    setTargetVal(currentTarget);
    setPcVal(currentPcCount);
  }, [currentTarget, currentPcCount, activeMonth]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const updatedTargets = { ...(settings?.targets || {}), [activeMonth]: Number(targetVal) || 0 };
    const updatedPcCount = { ...(settings?.pcCount || {}), [activeMonth]: Number(pcVal) || 1 };
    await updateSettings({ targets: updatedTargets, pcCount: updatedPcCount });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ตั้งเป้าหมาย & Headcount PC
              </h3>
              <p className="text-xs text-slate-400">
                สำหรับเดือน {thaiMonthYear(activeMonth)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              เป้าหมายยอดขายประจำเดือน (บาท)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={targetVal}
              onChange={(e) => setTargetVal(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              จำนวนพนักงานขาย PC ประจำสาขา (คน)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={pcVal}
              onChange={(e) => setPcVal(Number(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              ใช้สำหรับหารเฉลี่ยผลตอบแทนคอมมิชชั่น PC ต่อคน
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};

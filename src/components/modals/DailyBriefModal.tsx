import React, { useState, useMemo } from 'react';
import { Sun, Copy, Check, X } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { computeSalesPace, todayISO } from '../../services/calculations';
import { DEFAULT_TARGET } from '../../data/seedData';
import { generateDailyBriefText } from '../../services/exportService';

interface DailyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyBriefModal: React.FC<DailyBriefModalProps> = ({ isOpen, onClose }) => {
  const { sales, settings, activeMonth } = useAppState();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [copied, setCopied] = useState<boolean>(false);

  const target = settings?.targets?.[activeMonth] || DEFAULT_TARGET;

  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(activeMonth));
  }, [sales, activeMonth]);

  const pace = useMemo(() => {
    return computeSalesPace(activeMonth, target, monthSales);
  }, [activeMonth, target, monthSales]);

  const todaySales = useMemo(() => {
    return sales.filter((s) => s.date === selectedDate);
  }, [sales, selectedDate]);

  const todayTotal = useMemo(() => {
    return todaySales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  }, [todaySales]);

  const dailyText = useMemo(() => {
    return generateDailyBriefText({
      date: selectedDate,
      todayTotal,
      todaySalesCount: todaySales.length,
      soFarTotal: pace.soFarTotal,
      target,
      paceStatus: pace.status,
      gap: Math.max(0, target - pace.soFarTotal),
    });
  }, [selectedDate, todayTotal, todaySales, pace, target]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(dailyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                สรุปยอดขายประจำวัน (Daily Brief)
              </h3>
              <p className="text-xs text-slate-400">สร้างข้อความสรุปส่งเข้ากลุ่ม LINE ตอนปิดกะ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              เลือกวันที่ต้องการสรุป
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              ข้อความสรุป (LINE Format):
            </span>
            <pre className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 font-mono text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 max-h-72 overflow-y-auto">
              {dailyText}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
          >
            ปิด
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ LINE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

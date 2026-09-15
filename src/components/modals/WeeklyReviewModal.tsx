import React, { useState, useMemo } from 'react';
import { Calendar, Copy, Check, X } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { todayISO } from '../../services/calculations';
import { generateWeeklyReviewText } from '../../services/exportService';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({ isOpen, onClose }) => {
  const { sales } = useAppState();
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(todayISO());
  const [copied, setCopied] = useState<boolean>(false);

  const weekSales = useMemo(() => {
    return sales.filter((s) => s.date >= fromDate && s.date <= toDate);
  }, [sales, fromDate, toDate]);

  const totalSales = useMemo(() => {
    return weekSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  }, [weekSales]);

  // Top 3 products
  const topProducts = useMemo(() => {
    const agg: Record<string, { total: number; qty: number }> = {};
    weekSales.forEach((s) => {
      if (!agg[s.name]) agg[s.name] = { total: 0, qty: 0 };
      agg[s.name].total += Number(s.total) || 0;
      agg[s.name].qty += Number(s.qty) || 0;
    });
    return Object.entries(agg)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [weekSales]);

  const weeklyText = useMemo(() => {
    return generateWeeklyReviewText({
      fromDate,
      toDate,
      totalSales,
      orderCount: weekSales.length,
      topProducts,
    });
  }, [fromDate, toDate, totalSales, weekSales, topProducts]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(weeklyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                สรุปยอดขายสัปดาห์ (Weekly Review)
              </h3>
              <p className="text-xs text-slate-400">สรุปภาพรวม 7 วันและ Top 3 สินค้าขายดีส่ง LINE</p>
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
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[11px] font-bold text-slate-500 uppercase">ช่วงวันที่:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            />
            <span className="text-xs text-slate-400">ถึง</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            />
          </div>

          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              ข้อความสรุป (LINE Format):
            </span>
            <pre className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 font-mono text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 max-h-72 overflow-y-auto">
              {weeklyText}
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
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ LINE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

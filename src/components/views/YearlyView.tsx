import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Award,
  BarChart3,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { THAI_MONTHS } from '../../data/constants';
import { DEFAULT_TARGET } from '../../data/seedData';
import { fmt } from '../../services/calculations';

export const YearlyView: React.FC = () => {
  const { sales, settings, activeMonth } = useAppState();
  const currentYearNum = parseInt(activeMonth.split('-')[0], 10) || new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);

  // 12 Months Data
  const monthlyStats = useMemo(() => {
    return THAI_MONTHS.map((name, index) => {
      const monthStr = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
      const mSales = sales.filter((s) => s.date.startsWith(monthStr));
      const total = mSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
      const qty = mSales.reduce((a, s) => a + (Number(s.qty) || 0), 0);
      const target = settings?.targets?.[monthStr] || DEFAULT_TARGET;
      const pct = target > 0 ? (total / target) * 100 : 0;
      return {
        monthStr,
        name,
        total,
        qty,
        target,
        pct,
      };
    });
  }, [sales, settings, selectedYear]);

  const yearTotal = useMemo(() => {
    return monthlyStats.reduce((a, b) => a + b.total, 0);
  }, [monthlyStats]);

  const yearTarget = useMemo(() => {
    return monthlyStats.reduce((a, b) => a + b.target, 0);
  }, [monthlyStats]);

  const yearQty = useMemo(() => {
    return monthlyStats.reduce((a, b) => a + b.qty, 0);
  }, [monthlyStats]);

  const maxMonthTotal = useMemo(() => {
    return Math.max(...monthlyStats.map((m) => m.total), 1);
  }, [monthlyStats]);

  const bestMonth = useMemo(() => {
    return [...monthlyStats].sort((a, b) => b.total - a.total)[0];
  }, [monthlyStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>การวิเคราะห์ข้อมูลระยะยาว</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ภาพรวมผลงานรายปี (Yearly Performance)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เปรียบเทียบผลงาน 12 เดือน ติดตามเป้าหมายและแนวโน้มการเติบโต
          </p>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-black text-sm px-3 text-slate-900 dark:text-white">
            ปี {selectedYear + 543} ({selectedYear})
          </span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>ยอดขายสะสมทั้งปี</span>
            <BarChart3 className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-4">
            <div className="text-3xl lg:text-4xl font-black font-mono text-red-600 dark:text-red-400">
              {fmt(yearTotal)}{' '}
              <span className="text-sm font-semibold text-slate-400">บาท</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              จากเป้ารวมทั้งปี {fmt(yearTarget)} บาท (
              {yearTarget > 0 ? ((yearTotal / yearTarget) * 100).toFixed(1) : 0}%)
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>จำนวนขายทั้งปี:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {fmt(yearQty)} ถัง
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>เฉลี่ยต่อเดือน</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-4">
            <div className="text-3xl lg:text-4xl font-black font-mono text-slate-900 dark:text-white">
              {fmt(yearTotal / 12)}{' '}
              <span className="text-sm font-semibold text-slate-400">บาท/ด.</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ยอดขายเฉลี่ยรายเดือนตลอดทั้งปี พ.ศ. {selectedYear + 543}
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>เป้าเฉลี่ยต่อเดือน:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {fmt(yearTarget / 12)} บ.
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>เดือนที่ทำยอดได้สูงสุด</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-4">
            <div className="text-3xl lg:text-4xl font-black font-mono text-slate-900 dark:text-white">
              {bestMonth ? bestMonth.name : '-'}{' '}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ทำได้ <b className="font-mono font-bold text-emerald-600">{fmt(bestMonth?.total || 0)}</b>{' '}
              บาท ({bestMonth?.pct.toFixed(1)}% ของเป้า)
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>ปริมาณขาย:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {bestMonth?.qty || 0} ถัง
            </span>
          </div>
        </div>
      </div>

      {/* 12-Month Bar Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            แผนภูมิแท่งเปรียบเทียบ 12 เดือน (พ.ศ. {selectedYear + 543})
          </h3>
          <span className="text-xs text-slate-400">หน่วย: บาท</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 sm:gap-4 items-end h-64 pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
          {monthlyStats.map((m) => {
            const hPct = maxMonthTotal > 0 ? (m.total / maxMonthTotal) * 100 : 0;
            const isMet = m.pct >= 100;
            return (
              <div key={m.monthStr} className="flex flex-col items-center h-full justify-end group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono font-bold bg-slate-900 text-white rounded px-1.5 py-0.5 mb-1 whitespace-nowrap shadow pointer-events-none">
                  {fmt(m.total)} บ. ({m.pct.toFixed(0)}%)
                </div>
                {/* Bar */}
                <div className="w-full max-w-[28px] bg-slate-100 dark:bg-slate-800 rounded-t-xl overflow-hidden h-44 flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-700 ease-out ${
                      isMet
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-500'
                        : 'bg-gradient-to-t from-red-600 to-rose-500'
                    }`}
                    style={{ height: `${Math.max(4, hPct)}%` }}
                  />
                </div>
                {/* Month label */}
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 truncate w-full text-center">
                  {m.name.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12 Months Table Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            ตารางข้อมูลผลงานรายเดือน (12 เดือน)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="py-3 px-4">เดือน</th>
                <th className="py-3 px-4 text-right">เป้าหมาย (บาท)</th>
                <th className="py-3 px-4 text-right">ยอดขายจริง (บาท)</th>
                <th className="py-3 px-4 text-center">จำนวน (ถัง)</th>
                <th className="py-3 px-4 text-center">% Achieved</th>
                <th className="py-3 px-4 text-right">ผลต่าง (Gap)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {monthlyStats.map((m) => {
                const diff = m.total - m.target;
                const isMet = diff >= 0;
                return (
                  <tr key={m.monthStr} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {m.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {fmt(m.target)} บ.
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {fmt(m.total)} บ.
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {m.qty}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-black px-2 py-0.5 rounded-full text-[11px] ${
                          isMet
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {m.pct.toFixed(1)}%
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-bold ${
                        isMet ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {isMet ? `+${fmt(diff)}` : fmt(diff)} บ.
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

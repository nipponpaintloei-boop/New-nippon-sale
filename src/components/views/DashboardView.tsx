import React, { useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Target,
  ArrowRight,
  Layers,
  Calendar,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import {
  computeSalesPace,
  fmt,
  thaiMonthYear,
} from '../../services/calculations';
import { DEFAULT_TARGET } from '../../data/seedData';
import { aggregateCustomers } from '../../services/customerService';
import { getLowStockProducts, getOversoldProducts } from '../../services/stockService';
import { ActionItem, SaleEntry } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
  onOpenTargetModal: () => void;
  onOpenSaleDetail?: (sale: SaleEntry) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenTargetModal,
  onOpenSaleDetail,
}) => {
  const { sales, products, settings, activeMonth, customersMeta } = useAppState();
  const confettiFired = useRef(false);

  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(activeMonth));
  }, [sales, activeMonth]);

  const target = settings?.targets?.[activeMonth] || DEFAULT_TARGET;

  const pace = useMemo(() => {
    return computeSalesPace(activeMonth, target, monthSales);
  }, [activeMonth, target, monthSales]);

  const pct = target > 0 ? (pace.soFarTotal / target) * 100 : 0;
  const gap = Math.max(0, target - pace.soFarTotal);

  // Confetti when reaching 100%
  useEffect(() => {
    if (pct >= 100 && !confettiFired.current) {
      confettiFired.current = true;
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [pct]);

  // Action Center Items
  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];

    // 1. Sales pace
    if (pace.statusCls === 'status-over') {
      items.push({
        priority: 1,
        icon: 'trendDown',
        view: 'dash',
        title: 'ยอดขายยังตามหลังแผน',
        detail: pace.statusReason,
      });
    } else if (pace.statusCls === 'status-low') {
      items.push({
        priority: 2,
        icon: 'clock',
        view: 'dash',
        title: 'ยอดขายต่ำกว่าเป้าเล็กน้อย',
        detail: pace.statusReason,
      });
    }

    // 2. Stock alerts
    const oversold = getOversoldProducts(products);
    if (oversold.length) {
      items.push({
        priority: 1,
        icon: 'box',
        view: 'stock',
        title: `สต็อกติดลบ ${oversold.length} รายการ`,
        detail: oversold.slice(0, 3).map((r) => `${r.name} ${r.size}`).join(', '),
      });
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const sales14Days = sales.filter((s) => s.date >= cutoffStr);
    const lowStock = getLowStockProducts(products, sales14Days);
    if (lowStock.length) {
      items.push({
        priority: 2,
        icon: 'box',
        view: 'stock',
        title: `สต็อกใกล้หมด ${lowStock.length} รายการ`,
        detail: 'สินค้าใกล้หมดตามอัตราการขายจริง (Run-rate 14 วัน)',
      });
    }

    // 3. Customer follow-up
    const custs = aggregateCustomers(sales, customersMeta);
    const overdue = custs.filter((c) => c.followStatus === 'overdue');
    const due = custs.filter((c) => c.followStatus === 'due');

    if (overdue.length) {
      items.push({
        priority: 1,
        icon: 'user',
        view: 'customers',
        title: `ลูกค้าเกินกำหนดซื้อซ้ำ ${overdue.length} ราย`,
        detail: overdue.slice(0, 3).map((c) => c.name || c.phone).join(', '),
      });
    } else if (due.length) {
      items.push({
        priority: 2,
        icon: 'user',
        view: 'customers',
        title: `ลูกค้าถึงรอบซื้อซ้ำ ${due.length} ราย`,
        detail: due.slice(0, 3).map((c) => c.name || c.phone).join(', '),
      });
    }

    return items;
  }, [pace, products, sales, customersMeta]);

  // Product Series Breakdown
  const seriesShare = useMemo(() => {
    const agg: Record<string, { total: number; qty: number }> = {};
    monthSales.forEach((s) => {
      const key = s.name.split(' ')[0] || 'อื่นๆ';
      if (!agg[key]) agg[key] = { total: 0, qty: 0 };
      agg[key].total += Number(s.total) || 0;
      agg[key].qty += Number(s.qty) || 0;
    });
    return Object.entries(agg)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [monthSales]);

  // Recent 8 sales
  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 8);
  }, [sales]);

  const fillHeight = Math.min(100, Math.max(8, pct));

  return (
    <div className="space-y-6 pb-24 lg:pb-12">
      {/* Top Banner / Month Hero Section with Paint Bucket Gauge */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span>ภาพรวมประจำเดือน</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {thaiMonthYear(activeMonth)}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
              ดำเนินการแล้ว <span className="text-white font-bold">{pace.daysPassed}</span> จากทั้งหมด{' '}
              <span className="text-white font-bold">{pace.dim} วัน</span> (เหลืออีก{' '}
              <span className="text-amber-400 font-bold">{pace.dim - pace.daysPassed} วัน</span> ในเดือนนี้)
            </p>
          </div>

          {/* Premium Paint Can Graphic */}
          <div className="flex items-center gap-6 bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 backdrop-blur-md self-start lg:self-center shadow-lg">
            {/* Paint Can Shape SVG container */}
            <div className="relative w-16 h-20 rounded-b-2xl rounded-t-lg bg-slate-700/70 border-2 border-slate-500 overflow-hidden shadow-inner flex-shrink-0">
              <div className="absolute top-1 left-2 right-2 h-2 rounded-t-lg border-t-2 border-slate-400 pointer-events-none z-10" />
              <div className="absolute top-0 inset-x-0 h-2 bg-slate-600 border-b border-slate-500 z-10" />
              <div
                className="absolute bottom-0 inset-x-0 transition-all duration-1000 ease-out bg-gradient-to-t from-red-600 via-rose-500 to-amber-400"
                style={{ height: `${fillHeight}%` }}
              >
                <div className="w-full h-1 bg-white/40 animate-pulse" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-white/90 text-sm pointer-events-none drop-shadow">
                N
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                เป้าหมายที่บรรลุ
              </span>
              <div className="text-2xl font-black font-mono text-white flex items-baseline gap-1">
                <span>{pct.toFixed(1)}%</span>
                <span className="text-xs text-slate-400 font-normal">ของเป้า</span>
              </div>
              <button
                onClick={onOpenTargetModal}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>ปรับเป้า ({fmt(target)} บ.)</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Hero 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Card 1: Actual Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-red-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>ยอดขายสะสมเดือนนี้</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="my-4">
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {fmt(pace.soFarTotal)}{' '}
              <span className="text-sm font-semibold text-slate-400">บาท</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  pct >= 100
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : pct >= 80
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {pct.toFixed(1)}% ทำได้แล้ว
              </div>
              <span className="text-xs text-slate-400 font-medium truncate">
                จากเป้า {fmt(target)} บ.
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-blue-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Gap / Needed */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>ยอดขายที่ยังขาดเพื่อถึงเป้า</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="my-4">
            <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {gap === 0 ? 'ถึงเป้าหมายแล้ว!' : fmt(gap)}{' '}
              {gap > 0 && <span className="text-sm font-semibold text-slate-400">บาท</span>}
            </div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed">
              {gap > 0 ? (
                <span>
                  ต้องการอีกวันละเฉลี่ย{' '}
                  <b className="text-slate-900 dark:text-white font-mono font-bold">
                    {fmt(gap / Math.max(1, pace.dim - pace.daysPassed))}
                  </b>{' '}
                  บาท (เหลือ {pace.dim - pace.daysPassed} วัน)
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  ยินดีด้วย! บรรลุเป้าหมายเดือนนี้เรียบร้อย
                </span>
              )}
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>ทำได้ปัจจุบันเฉลี่ย/วัน:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {fmt(pace.avgPerDay)} บ.
            </span>
          </div>
        </div>

        {/* Card 3: Sales Pace & Forecast */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>สถานะความเร็ว (Sales Pace)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${
                pace.statusCls === 'status-ok'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : pace.statusCls === 'status-low'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current"></span>
              <span>{pace.status}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
              {pace.statusReason}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>คาดการณ์ยอดสิ้นเดือน:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {fmt(pace.forecastTotal)} บ.
            </span>
          </div>
        </div>
      </div>

      {/* Action Center Section */}
      {actionItems.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 dark:border-amber-900/40 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-300 font-black text-sm sm:text-base">
              <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-sm">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span>สิ่งที่ต้องดำเนินการเร่งด่วน (Action Center)</span>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              {actionItems.length} รายการ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {actionItems.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(item.view)}
                className="group flex items-start justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>
                    <span>{item.title}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {item.detail}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop 2 Columns: Product Share & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Series Share (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  สัดส่วนยอดขายตามซีรีส์สินค้า
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                Top 5
              </span>
            </div>

            <div className="space-y-4">
              {seriesShare.length ? (
                seriesShare.map((p, idx) => {
                  const sPct = pace.soFarTotal > 0 ? (p.total / pace.soFarTotal) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[140px]">
                          {p.name}
                        </span>
                        <span className="font-mono text-slate-600 dark:text-slate-400 font-semibold">
                          {fmt(p.total)} บ. ({sPct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(sPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-xs text-slate-400">
                  ยังไม่มีข้อมูลการขายในเดือนนี้
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>จำนวนขายรวม {seriesShare.reduce((a, b) => a + b.qty, 0)} ถัง</span>
            <button
              onClick={() => onNavigate('stock')}
              className="font-bold text-red-600 hover:underline cursor-pointer"
            >
              ดูสต็อกสินค้า &rarr;
            </button>
          </div>
        </div>

        {/* Recent Sales Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  รายการขายล่าสุด
                </h3>
              </div>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>ดูประวัติทั้งหมด</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3 px-2">สินค้า</th>
                    <th className="pb-3 px-2">ฟิล์มสี</th>
                    <th className="pb-3 px-2">ขนาด</th>
                    <th className="pb-3 px-2">เบส</th>
                    <th className="pb-3 px-2">เบอร์สี / รหัสสี</th>
                    <th className="pb-3 px-2 text-center">จำนวน</th>
                    <th className="pb-3 px-2 text-right">ยอดรวม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                  {recentSales.map((s, idx) => (
                    <tr
                      key={s.id ? `dash-${s.id}-${idx}` : `dash-idx-${idx}`}
                      onClick={() => onOpenSaleDetail && onOpenSaleDetail(s)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-2 text-slate-900 dark:text-slate-100 font-bold max-w-[180px] truncate group-hover:text-red-600 transition-colors">
                        {s.name}
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-[11px] whitespace-nowrap">{s.filmColor || '-'}</td>
                      <td className="py-3 px-2 text-slate-500 text-[11px] whitespace-nowrap">{s.size || '-'}</td>
                      <td className="py-3 px-2 text-slate-500 text-[11px] whitespace-nowrap">{s.base || '-'}</td>
                      <td className="py-3 px-2 text-slate-500 text-[11px] whitespace-nowrap">{s.colorCode || '-'}</td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.qty}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-black text-slate-900 dark:text-white">
                        {fmt(s.total)} บ.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>แสดง 8 รายการล่าสุด</span>
            <button
              onClick={() => onNavigate('entry')}
              className="font-bold text-red-600 hover:text-red-700 cursor-pointer"
            >
              + บันทึกการขายใหม่
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

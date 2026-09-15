import { MKS_BRANDS } from '../data/constants';
import { MksBrand, MksDayRow, MksWeekRow } from '../types';

export interface MksDailyComputedRow {
  brand: MksBrand;
  pc: number;
  sales: number;
  sharePct: number;
  note: string;
}

export function computeMksDailySummary(
  rows: Record<string, MksDayRow>
): { rows: MksDailyComputedRow[]; totalSales: number; totalPc: number } {
  let totalSales = 0;
  let totalPc = 0;
  MKS_BRANDS.forEach((b) => {
    const r = rows[b.key] || { pc: b.pc || 0, sales: 0, note: '' };
    totalSales += Number(r.sales) || 0;
    totalPc += Number(r.pc) || 0;
  });

  const computed: MksDailyComputedRow[] = MKS_BRANDS.map((b) => {
    const r = rows[b.key] || { pc: b.pc || 0, sales: 0, note: '' };
    const sales = Number(r.sales) || 0;
    const sharePct = totalSales > 0 ? (sales / totalSales) * 100 : 0;
    return {
      brand: b,
      pc: Number(r.pc) || 0,
      sales,
      sharePct,
      note: r.note || '',
    };
  });

  return { rows: computed, totalSales, totalPc };
}

export interface MksWeeklyComputedRow {
  brand: MksBrand;
  pcReg: number;
  pcPro: number;
  target: number;
  sales: number;
  achPct: number;
  sharePct: number;
  note: string;
}

export function computeMksWeeklySummary(
  rows: Record<string, MksWeekRow>
): {
  rows: MksWeeklyComputedRow[];
  totalSales: number;
  totalTarget: number;
  totalPcReg: number;
  totalPcPro: number;
} {
  let totalSales = 0;
  let totalTarget = 0;
  let totalPcReg = 0;
  let totalPcPro = 0;

  MKS_BRANDS.forEach((b) => {
    const r = rows[b.key] || {
      pcReg: b.pc || 0,
      pcPro: 0,
      target: b.target || 0,
      sales: 0,
      note: '',
    };
    totalSales += Number(r.sales) || 0;
    totalTarget += Number(r.target) || 0;
    totalPcReg += Number(r.pcReg) || 0;
    totalPcPro += Number(r.pcPro) || 0;
  });

  const computed: MksWeeklyComputedRow[] = MKS_BRANDS.map((b) => {
    const r = rows[b.key] || {
      pcReg: b.pc || 0,
      pcPro: 0,
      target: b.target || 0,
      sales: 0,
      note: '',
    };
    const sales = Number(r.sales) || 0;
    const target = Number(r.target) || 0;
    const achPct = target > 0 ? (sales / target) * 100 : 0;
    const sharePct = totalSales > 0 ? (sales / totalSales) * 100 : 0;
    return {
      brand: b,
      pcReg: Number(r.pcReg) || 0,
      pcPro: Number(r.pcPro) || 0,
      target,
      sales,
      achPct,
      sharePct,
      note: r.note || '',
    };
  });

  return {
    rows: computed,
    totalSales,
    totalTarget,
    totalPcReg,
    totalPcPro,
  };
}

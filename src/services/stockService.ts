import { Product, SaleEntry } from '../types';

export function parseSeriesColorNo(name: string): { series: string; colorNo: string } | null {
  if (!name) return null;
  let m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/); // trailing (...)
  if (m) return { series: m[1].trim(), colorNo: m[2].trim() };
  m = name.match(/^(.*?)\s*\[([^\]]+)\]\s*$/); // trailing [...]
  if (m) return { series: m[1].trim(), colorNo: m[2].trim() };
  m = name.match(/^(สีน้ำมัน All in 1)\s+(\S+)$/); // "สีน้ำมัน All in 1 S914" style
  if (m) return { series: m[1].trim(), colorNo: m[2].trim() };
  return null;
}

export interface ProductIndexMap {
  productIndex: Record<string, Record<string, Record<string, Record<string, Product>>>>;
  seriesIndex: Record<string, Record<string, string>>;
  nameToSeries: Record<string, string>;
  productNames: string[];
  seriesList: string[];
}

export function buildProductIndexes(products: Product[]): ProductIndexMap {
  const productIndex: Record<string, Record<string, Record<string, Record<string, Product>>>> = {};
  products.forEach((r) => {
    if (!r.name) return;
    if (!productIndex[r.name]) productIndex[r.name] = {};
    const sizeKey = r.size || 'มาตรฐาน';
    if (!productIndex[r.name][sizeKey]) productIndex[r.name][sizeKey] = {};
    const baseKey = r.base || 'มาตรฐาน';
    if (!productIndex[r.name][sizeKey][baseKey]) productIndex[r.name][sizeKey][baseKey] = {};
    const colorKey = (r.colorCode || '').trim() || '__NO_COLOR__';
    productIndex[r.name][sizeKey][baseKey][colorKey] = r;
  });

  const seriesIndex: Record<string, Record<string, string>> = {};
  const namesAllBaseEmpty: Record<string, boolean> = {};
  products.forEach((r) => {
    if (!r.name) return;
    if (namesAllBaseEmpty[r.name] === undefined) namesAllBaseEmpty[r.name] = true;
    if (r.base) namesAllBaseEmpty[r.name] = false;
  });

  Object.keys(productIndex).forEach((name) => {
    if (!namesAllBaseEmpty[name]) return;
    const parsed = parseSeriesColorNo(name);
    if (!parsed) return;
    if (!seriesIndex[parsed.series]) seriesIndex[parsed.series] = {};
    seriesIndex[parsed.series][parsed.colorNo] = name;
  });

  const nameToSeries: Record<string, string> = {};
  Object.keys(seriesIndex).forEach((series) => {
    Object.values(seriesIndex[series]).forEach((rawName) => {
      nameToSeries[rawName] = series;
    });
  });

  return {
    productIndex,
    seriesIndex,
    nameToSeries,
    productNames: Object.keys(productIndex).sort(),
    seriesList: Object.keys(seriesIndex).sort(),
  };
}

export function recomputeStock(products: Product[], sales: SaleEntry[]): Product[] {
  const soldMap: Record<string, number> = {};
  sales.forEach((s) => {
    const key = s.sku || `${s.name}|${s.size}|${s.base}|${s.colorCode || ''}`;
    soldMap[key] = (soldMap[key] || 0) + (Number(s.qty) || 0);
  });

  return products.map((p) => {
    const key = p.sku || `${p.name}|${p.size}|${p.base}|${p.colorCode || ''}`;
    const sold = soldMap[key] || 0;
    const init = Number(p.init) || 0;
    const inflow = Number(p.inflow) || 0;
    const remain = init + inflow - sold;
    return {
      ...p,
      sold,
      remain,
      stock: remain,
      currentStock: remain,
    };
  });
}

export function getOversoldProducts(products: Product[]): Product[] {
  return products.filter((r) => r.name && Number(r.remain) < 0);
}

export function getLowStockProducts(
  products: Product[],
  salesSince14DaysAgo: SaleEntry[]
): { product: Product; runRateDays: number }[] {
  const recentSold: Record<string, number> = {};
  salesSince14DaysAgo.forEach((s) => {
    const key = s.sku || `${s.name}|${s.size}|${s.base}|${s.colorCode || ''}`;
    recentSold[key] = (recentSold[key] || 0) + (Number(s.qty) || 0);
  });

  const result: { product: Product; runRateDays: number }[] = [];
  products.forEach((r) => {
    if (!r.name || Number(r.remain) < 0) return;
    const key = r.sku || `${r.name}|${r.size}|${r.base}`;
    const avgPerDay = (recentSold[key] || 0) / 14;
    if (avgPerDay <= 0) return;
    const daysLeft = Number(r.remain) / avgPerDay;
    if (daysLeft <= 3) {
      result.push({ product: r, runRateDays: Math.round(daysLeft * 10) / 10 });
    }
  });

  return result;
}

import { CustomerMeta, CustomerRecord, SaleEntry } from '../types';
import { daysBetween, todayISO } from './calculations';

export function customerKey(name?: string, phone?: string): string | null {
  const n = (name || '').trim().toLowerCase();
  const p = (phone || '').trim().replace(/[^0-9]/g, '');
  return p || n || null;
}

export function aggregateCustomers(
  sales: SaleEntry[],
  customersMeta: Record<string, CustomerMeta>
): CustomerRecord[] {
  const map: Record<string, any> = {};

  sales.forEach((s) => {
    const key = customerKey(s.customerName, s.customerPhone);
    if (!key) return;

    if (!map[key]) {
      map[key] = {
        key,
        name: s.customerName || 'ลูกค้าทั่วไป',
        phone: s.customerPhone || '',
        total: 0,
        count: 0,
        lastDate: s.date,
        bills: {},
        products: {},
      };
    }

    const rec = map[key];
    rec.total += Number(s.total) || 0;
    rec.count += 1;
    if (s.date > rec.lastDate) rec.lastDate = s.date;
    if (s.customerName) rec.name = s.customerName;
    if (s.customerPhone) rec.phone = s.customerPhone;

    const bKey = s.billId || s.id;
    if (!rec.bills[bKey]) {
      rec.bills[bKey] = { billKey: bKey, date: s.date, total: 0, items: [] };
    }
    rec.bills[bKey].total += Number(s.total) || 0;
    rec.bills[bKey].items.push({
      name: s.name,
      size: s.size,
      base: s.base,
      qty: s.qty,
      total: s.total,
    });
    if (s.date > rec.bills[bKey].date) rec.bills[bKey].date = s.date;

    rec.products[s.name] = (rec.products[s.name] || 0) + (Number(s.qty) || 0);
  });

  const list: CustomerRecord[] = Object.keys(map).map((key) => {
    const rec = map[key];
    const meta = customersMeta[key] || {};
    rec.favorite = !!meta.favorite;
    rec.color = meta.color || null;
    rec.meta = meta;

    const billsList = Object.values(rec.bills).sort((a: any, b: any) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0
    );
    rec.billsList = billsList;
    rec.billCount = billsList.length;
    rec.totalOrders = billsList.length;
    rec.totalSpent = rec.total;
    rec.lastOrderDate = rec.lastDate;

    rec.topProducts = Object.entries(rec.products)
      .sort((a: any, b: any) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty: qty as number }));

    rec.boughtNames = Object.keys(rec.products);
    delete rec.bills;
    delete rec.products;

    // Follow-up calculations
    const uniqDates = Array.from(new Set(billsList.map((b: any) => b.date))).sort() as string[];
    let avgCycleDays: number | null = null;
    if (uniqDates.length >= 2) {
      let gapSum = 0;
      for (let i = 1; i < uniqDates.length; i++) {
        gapSum += daysBetween(uniqDates[i - 1], uniqDates[i]);
      }
      avgCycleDays = Math.round(gapSum / (uniqDates.length - 1));
    }
    rec.avgCycleDays = avgCycleDays;
    rec.daysSinceLast = daysBetween(rec.lastDate, todayISO());

    if (avgCycleDays === null || avgCycleDays <= 0) {
      rec.followStatus = 'new';
    } else if (rec.daysSinceLast >= avgCycleDays * 1.4) {
      rec.followStatus = 'overdue';
    } else if (rec.daysSinceLast >= avgCycleDays * 0.9) {
      rec.followStatus = 'due';
    } else {
      rec.followStatus = 'ok';
    }

    if (avgCycleDays && avgCycleDays > 0) {
      const nextDate = new Date(rec.lastDate);
      nextDate.setDate(nextDate.getDate() + avgCycleDays);
      rec.nextFollowUp = nextDate.toISOString().slice(0, 10);
    }

    return rec as CustomerRecord;
  });

  return list;
}

export function computeOverallProductPopularity(sales: SaleEntry[]): { name: string; qty: number }[] {
  const agg: Record<string, number> = {};
  sales.forEach((s) => {
    agg[s.name] = (agg[s.name] || 0) + (Number(s.qty) || 0);
  });
  return Object.entries(agg)
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));
}

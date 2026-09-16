import { getSupabaseClient, USE_CLOUD_SYNC } from '../config/supabase';
import { LOCAL_STORAGE_PREFIX, STORE_KEYS } from '../data/constants';
import { SaleEntry, SalesRowSupabase } from '../types';

export { USE_CLOUD_SYNC };

export function toSalesRow(entry: SaleEntry): SalesRowSupabase {
  return {
    id: String(entry.id),
    date: entry.date,
    name: entry.name,
    size: entry.size || '',
    base: entry.base || '',
    price: Number(entry.price) || 0,
    color_code: entry.colorCode || '',
    tint_price: Number(entry.tintPrice) || 0,
    qty: Number(entry.qty) || 0,
    total: Number(entry.total) || 0,
    sku: entry.sku || '',
    seed: !!entry.seed,
    bill_id: entry.billId || null,
    customer_name: entry.customerName || '',
    customer_phone: entry.customerPhone || '',
  };
}

export function fromSalesRow(row: any): SaleEntry {
  return {
    id: String(row.id),
    date: row.date,
    name: row.name,
    size: row.size || '',
    base: row.base || '',
    price: Number(row.price) || 0,
    colorCode: row.color_code || '',
    tintPrice: Number(row.tint_price) || 0,
    qty: Number(row.qty) || 0,
    total: Number(row.total) || 0,
    sku: row.sku || '',
    seed: !!row.seed,
    billId: row.bill_id || null,
    customerName: row.customer_name || '',
    customerPhone: row.customer_phone || '',
  };
}

export async function storageGet(key: string): Promise<{ value: string } | null> {
  // 1. Primary: Read from localStorage immediately (Local-First, zero latency)
  try {
    const value = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (value !== null) {
      return { value };
    }
  } catch (e) {
    console.warn('localStorage.getItem failed:', e);
  }

  // 2. Secondary local: Check window.storage if present in sandbox
  try {
    if (window.storage && typeof window.storage.get === 'function') {
      const s = await window.storage.get(key);
      if (s && typeof s.value === 'string') return s;
    }
  } catch (e) {
    console.warn('window.storage.get failed:', e);
  }

  // 3. Cloud fallback: Only if USE_CLOUD_SYNC is enabled
  if (USE_CLOUD_SYNC) {
    const client = getSupabaseClient();
    try {
      if (client) {
        const { data, error } = await client
          .from('app_data')
          .select('value')
          .eq('key', key)
          .maybeSingle();
        if (!error && data && typeof data.value === 'string') {
          // Cache locally
          try {
            localStorage.setItem(LOCAL_STORAGE_PREFIX + key, data.value);
          } catch {}
          return { value: data.value };
        }
        if (error) {
          console.warn('supabase get failed:', error.message);
        }
      }
    } catch (e) {
      console.warn('supabase get failed:', e);
    }
  }

  return null;
}

export async function storageSet(key: string, value: string): Promise<boolean> {
  let saved = false;
  // 1. Primary: Save to localStorage immediately (Local-First)
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, value);
    saved = true;
  } catch (e) {
    console.error('localStorage.setItem failed:', e);
  }

  // 2. Secondary local: Also save to window.storage if present
  try {
    if (window.storage && typeof window.storage.set === 'function') {
      await window.storage.set(key, value);
      saved = true;
    }
  } catch (e) {
    console.warn('window.storage.set failed:', e);
  }

  // 3. Cloud sync: Only if USE_CLOUD_SYNC is enabled
  if (USE_CLOUD_SYNC) {
    const client = getSupabaseClient();
    try {
      if (client) {
        const { error } = await client.from('app_data').upsert({ key, value }, { onConflict: 'key' });
        if (error) console.warn('supabase set failed:', error.message);
      }
    } catch (e) {
      console.warn('supabase set failed:', e);
    }
  }

  return saved;
}

export async function fetchSalesTable(): Promise<SaleEntry[] | null> {
  if (!USE_CLOUD_SYNC) {
    return null;
  }
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const PAGE_SIZE = 1000;
    let all: any[] = [];
    let from = 0;
    while (true) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await client
        .from('sales_entries')
        .select('*')
        .order('date', { ascending: true })
        .range(from, to);
      if (error) {
        console.warn('fetchSalesTable failed:', error.message);
        return all.length ? all.map(fromSalesRow) : null;
      }
      if (!data || !data.length) break;
      all = all.concat(data);
      if (data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    return all.map(fromSalesRow);
  } catch (e) {
    console.warn('fetchSalesTable failed:', e);
    return null;
  }
}

export async function upsertSalesRows(entries: SaleEntry[]): Promise<boolean> {
  if (!USE_CLOUD_SYNC) {
    return true;
  }
  const client = getSupabaseClient();
  if (!client || !entries.length) return false;
  try {
    const rows = entries.map(toSalesRow);
    const { error } = await client.from('sales_entries').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn('upsertSalesRows failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('upsertSalesRows failed:', e);
    return false;
  }
}

export async function deleteSalesRow(id: string): Promise<boolean> {
  if (!USE_CLOUD_SYNC) {
    return true;
  }
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('sales_entries').delete().eq('id', String(id));
    if (error) {
      console.warn('deleteSalesRow failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('deleteSalesRow failed:', e);
    return false;
  }
}

export async function clearSalesTable(): Promise<boolean> {
  if (!USE_CLOUD_SYNC) {
    return true;
  }
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const PAGE_SIZE = 1000;
    while (true) {
      const { data, error } = await client
        .from('sales_entries')
        .select('id')
        .range(0, PAGE_SIZE - 1);
      if (error) {
        console.warn('clearSalesTable select failed:', error.message);
        return false;
      }
      if (!data || !data.length) break;
      const toDelete = data.map((r: any) => r.id);
      const { error: delErr } = await client.from('sales_entries').delete().in('id', toDelete);
      if (delErr) {
        console.warn('clearSalesTable delete failed:', delErr.message);
        return false;
      }
      if (data.length < PAGE_SIZE) break;
    }
    return true;
  } catch (e) {
    console.warn('clearSalesTable failed:', e);
    return false;
  }
}

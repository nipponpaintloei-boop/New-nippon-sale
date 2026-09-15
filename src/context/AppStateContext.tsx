import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import {
  AppSettings,
  CustomerMeta,
  GallonIncentiveRule,
  MksDayData,
  MksWeekData,
  Product,
  SaleEntry,
} from '../types';
import { STORE_KEYS } from '../data/constants';
import {
  PRODUCTS_SEED,
  SALES_SEED,
  TARGETS_SEED,
} from '../data/seedData';
import {
  clearSalesTable,
  deleteSalesRow,
  fetchSalesTable,
  storageGet,
  storageSet,
  upsertSalesRows,
} from '../services/storage';
import { getSupabaseClient, USE_CLOUD_SYNC } from '../config/supabase';
import { checkSession, getSavedGoogleProfile, GoogleUserProfile, saveGoogleProfile, clearGoogleProfile } from '../services/auth';
import { todayISO } from '../services/calculations';
import { recomputeStock } from '../services/stockService';
import { addAuditItem } from '../services/auditService';
import { triggerAutoSync } from '../services/googleSheetsSync';

interface AppStateContextType {
  products: Product[];
  sales: SaleEntry[];
  settings: AppSettings;
  mksDayHistory: Record<string, MksDayData>;
  mksWeekHistory: Record<string, MksWeekData>;
  customersMeta: Record<string, CustomerMeta>;
  activeMonth: string;
  setActiveMonth: (m: string) => void;
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  googleProfile: GoogleUserProfile | null;
  setGoogleProfile: (p: GoogleUserProfile | null) => void;
  isLoading: boolean;
  saveProducts: (newProds: Product[], actionDetail?: string) => Promise<boolean>;
  addSalesEntries: (entries: SaleEntry[]) => Promise<boolean>;
  updateSaleEntry: (entryOrId: string | SaleEntry, patch?: Partial<SaleEntry>) => Promise<boolean>;
  deleteSaleEntry: (id: string, reason?: string) => Promise<boolean>;
  clearSalesEntries: (onlySeed?: boolean) => Promise<{ clearedCount: number }>;
  clearAllSales: () => Promise<boolean>;
  saveSettings: (newSettings: AppSettings) => Promise<boolean>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<boolean>;
  addProduct: (prod: Product) => Promise<boolean>;
  updateProduct: (idOrSku: string, patch: Partial<Product>) => Promise<boolean>;
  deleteProduct: (idOrSku: string) => Promise<boolean>;
  recomputeAllStock: () => Promise<boolean>;
  updateCustomerMeta: (custKey: string, meta: Partial<CustomerMeta>) => Promise<boolean>;
  saveMksDay: (date: string, rows: any) => Promise<boolean>;
  saveMksWeek: (from: string, to: string, rows: any) => Promise<boolean>;
  toggleCustomerFavorite: (custKey: string) => Promise<boolean>;
  setCustomerColor: (custKey: string, color: string | null) => Promise<boolean>;
  setMonthTarget: (mKey: string, target: number) => Promise<boolean>;
  setMonthHeadcount: (mKey: string, count: number) => Promise<boolean>;
  setGallonIncentives: (mKey: string, rules: GallonIncentiveRule[]) => Promise<boolean>;
  replaceProducts: (prods: Product[], auditDetail?: string) => Promise<boolean>;
  mergeProducts: (prods: Product[], auditDetail?: string) => Promise<{ addCount: number; updateCount: number }>;
  updateProductDetails: (sku: string, patch: Partial<Product>) => Promise<boolean>;
  restockProduct: (sku: string, qty: number, note?: string, date?: string) => Promise<boolean>;
  bulkRestockProducts: (items: { sku: string; qty: number; note?: string }[], date?: string, generalNote?: string) => Promise<boolean>;
  fixProductStock: (sku: string, actualStock: number, reason: string) => Promise<boolean>;
  updateCustomerInfo: (phone: string, info: { name: string; note?: string; tags?: string[] }) => Promise<boolean>;
  auditLogs: { id: string; timestamp: string; user?: string; action: string; details: string; }[];
  resetAllData: () => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

function seedProducts(): Product[] {
  const seen = new Set<string>();
  return PRODUCTS_SEED.map((r: any, idx: number) => {
    let sku = String(r[0] || '').trim();
    if (!sku || seen.has(sku)) {
      sku = sku ? `${sku}-${idx + 1}` : `NP-${String(idx + 1).padStart(4, '0')}`;
    }
    seen.add(sku);
    return {
      id: `prod-${sku}`,
      sku,
      name: String(r[1] || ''),
      size: String(r[2] || ''),
      base: String(r[3] || ''),
      price: Number(r[4]) || 0,
      init: Number(r[5]) || 0,
      inflow: Number(r[6]) || 0,
      sold: Number(r[7]) || 0,
      remain: Number(r[8]) || 0,
      stock: Number(r[8]) || 0,
      currentStock: Number(r[8]) || 0,
    };
  });
}

function seedSales(): SaleEntry[] {
  return SALES_SEED.map((r: any, i: number) => ({
    id: 'seed-' + i,
    date: String(r[0] || ''),
    name: String(r[1] || ''),
    size: String(r[2] || ''),
    base: String(r[3] || ''),
    price: Number(r[4]) || 0,
    colorCode: String(r[5] || ''),
    tintPrice: Number(r[6]) || 0,
    qty: Number(r[7]) || 0,
    total: Number(r[8]) || 0,
    sku: String(r[9] || ''),
    seed: true,
  }));
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    targets: { ...TARGETS_SEED },
    headcounts: {},
    gallonIncentives: {},
  });
  const [mksDayHistory, setMksDayHistory] = useState<Record<string, MksDayData>>({});
  const [mksWeekHistory, setMksWeekHistory] = useState<Record<string, MksWeekData>>({});
  const [customersMeta, setCustomersMeta] = useState<Record<string, CustomerMeta>>({});
  const [activeMonth, setActiveMonth] = useState<string>(todayISO().slice(0, 7));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleProfile, setGoogleProfile] = useState<GoogleUserProfile | null>(getSavedGoogleProfile());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Auth check
      const { user } = await checkSession();
      setCurrentUser(user);
      const savedGProfile = getSavedGoogleProfile();
      if (savedGProfile) {
        setGoogleProfile(savedGProfile);
      }

      // 2. Settings
      const setSnap = await storageGet(STORE_KEYS.settings);
      let parsedSettings: AppSettings = {
        targets: { ...TARGETS_SEED },
        headcounts: {},
        gallonIncentives: {},
      };
      if (setSnap && setSnap.value) {
        try {
          const loaded = JSON.parse(setSnap.value);
          if (loaded && typeof loaded === 'object') {
            parsedSettings = {
              targets: { ...TARGETS_SEED, ...(loaded.targets || {}) },
              headcounts: { ...(loaded.headcounts || {}) },
              gallonIncentives: { ...(loaded.gallonIncentives || {}) },
              ...loaded,
            };
          }
        } catch (e) {}
      }
      if (!parsedSettings.targets) parsedSettings.targets = { ...TARGETS_SEED };
      if (!parsedSettings.headcounts) parsedSettings.headcounts = {};
      if (!parsedSettings.gallonIncentives) parsedSettings.gallonIncentives = {};
      setSettings(parsedSettings);

      // 3. Sales
      let loadedSales: SaleEntry[] = [];
      const salesTable = await fetchSalesTable();
      if (salesTable && salesTable.length > 0) {
        loadedSales = salesTable;
      } else {
        const salesSnap = await storageGet(STORE_KEYS.sales);
        if (salesSnap && salesSnap.value) {
          try {
            loadedSales = JSON.parse(salesSnap.value);
          } catch (e) {}
        } else {
          loadedSales = seedSales();
        }
      }

      // 4. Products
      let loadedProducts: Product[] = [];
      const prodSnap = await storageGet(STORE_KEYS.products);
      if (prodSnap && prodSnap.value) {
        try {
          const parsed = JSON.parse(prodSnap.value);
          if (Array.isArray(parsed)) {
            const seen = new Set<string>();
            loadedProducts = parsed.map((p: any, idx: number) => {
              let sku = (p.sku || '').trim();
              if (!sku || seen.has(sku)) {
                sku = sku ? `${sku}-${idx + 1}` : `NP-${String(idx + 1).padStart(4, '0')}`;
              }
              seen.add(sku);
              return {
                ...p,
                id: p.id || `prod-${sku}`,
                sku,
              };
            });
          }
        } catch (e) {}
      } else {
        loadedProducts = seedProducts();
      }

      // Recompute remaining stock
      const computedProds = recomputeStock(loadedProducts, loadedSales);
      setProducts(computedProds);
      setSales(loadedSales);

      // 5. MKS Day & Week
      const mksDSnap = await storageGet(STORE_KEYS.mksDay);
      if (mksDSnap && mksDSnap.value) {
        try {
          setMksDayHistory(JSON.parse(mksDSnap.value));
        } catch (e) {}
      }
      const mksWSnap = await storageGet(STORE_KEYS.mksWeek);
      if (mksWSnap && mksWSnap.value) {
        try {
          setMksWeekHistory(JSON.parse(mksWSnap.value));
        } catch (e) {}
      }

      // 6. Customers Meta
      const custSnap = await storageGet(STORE_KEYS.customers);
      if (custSnap && custSnap.value) {
        try {
          setCustomersMeta(JSON.parse(custSnap.value));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Realtime subscription setup
  useEffect(() => {
    if (!USE_CLOUD_SYNC) return;
    const client = getSupabaseClient();
    if (!client) return;
    const channel = client
      .channel('app_data-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_data' },
        async (payload: any) => {
          const key = payload.new?.key || payload.old?.key;
          if (!key || key === STORE_KEYS.sales) return;
          const snap = await storageGet(key);
          if (!snap?.value) return;
          try {
            const data = JSON.parse(snap.value);
            if (key === STORE_KEYS.products) setProducts(data);
            else if (key === STORE_KEYS.settings) setSettings(data);
            else if (key === STORE_KEYS.mksDay) setMksDayHistory(data);
            else if (key === STORE_KEYS.mksWeek) setMksWeekHistory(data);
            else if (key === STORE_KEYS.customers) setCustomersMeta(data);
          } catch (e) {}
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_entries' },
        (payload: any) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setSales((prev) => prev.filter((s) => String(s.id) !== String(deletedId)));
            }
          } else if (payload.new) {
            const newRow = payload.new;
            const updatedEntry: SaleEntry = {
              id: String(newRow.id),
              date: newRow.date,
              name: newRow.name,
              size: newRow.size || '',
              base: newRow.base || '',
              price: Number(newRow.price) || 0,
              colorCode: newRow.color_code || '',
              tintPrice: Number(newRow.tint_price) || 0,
              qty: Number(newRow.qty) || 0,
              total: Number(newRow.total) || 0,
              sku: newRow.sku || '',
              seed: !!newRow.seed,
              billId: newRow.bill_id || null,
              customerName: newRow.customer_name || '',
              customerPhone: newRow.customer_phone || '',
            };
            setSales((prev) => {
              const idx = prev.findIndex((s) => String(s.id) === String(updatedEntry.id));
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = updatedEntry;
                return next;
              }
              return [...prev, updatedEntry];
            });
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // Actions
  const saveProducts = useCallback(
    async (newProds: Product[], actionDetail?: string) => {
      const computed = recomputeStock(newProds, sales);
      setProducts(computed);
      const ok = await storageSet(STORE_KEYS.products, JSON.stringify(computed));
      if (actionDetail) {
        setSettings((prev) => {
          const updated = addAuditItem(prev, 'สินค้า', actionDetail);
          storageSet(STORE_KEYS.settings, JSON.stringify(updated));
          return updated;
        });
      }
      triggerAutoSync(sales, computed);
      return ok;
    },
    [sales]
  );

  const addSalesEntries = useCallback(
    async (entries: SaleEntry[]) => {
      if (!entries.length) return true;
      const nextSales = [...sales, ...entries];
      setSales(nextSales);
      // Recompute products stock
      const nextProds = recomputeStock(products, nextSales);
      setProducts(nextProds);
      await upsertSalesRows(entries);
      await storageSet(STORE_KEYS.sales, JSON.stringify(nextSales));
      await storageSet(STORE_KEYS.products, JSON.stringify(nextProds));
      triggerAutoSync(nextSales, nextProds);
      return true;
    },
    [sales, products]
  );

  const updateSaleEntry = useCallback(
    async (entryOrId: string | SaleEntry, patch?: Partial<SaleEntry>) => {
      let targetId: string;
      let finalEntry: SaleEntry;

      if (typeof entryOrId === 'string') {
        targetId = entryOrId;
        const existing = sales.find((s) => String(s.id) === String(targetId));
        if (!existing) return false;
        finalEntry = { ...existing, ...(patch || {}) };
      } else {
        targetId = entryOrId.id;
        finalEntry = entryOrId;
      }

      const nextSales = sales.map((s) => (String(s.id) === String(targetId) ? finalEntry : s));
      setSales(nextSales);
      const nextProds = recomputeStock(products, nextSales);
      setProducts(nextProds);
      await upsertSalesRows([finalEntry]);
      await storageSet(STORE_KEYS.sales, JSON.stringify(nextSales));
      await storageSet(STORE_KEYS.products, JSON.stringify(nextProds));

      setSettings((prev) => {
        const isPast = finalEntry.date < todayISO();
        const updated = addAuditItem(
          prev,
          'แก้ไขรายการขาย',
          `${finalEntry.name} ${finalEntry.size} ${finalEntry.base} (${finalEntry.qty} ถัง ยอด ${finalEntry.total} บ.) วันที่ ${finalEntry.date}`,
          isPast
        );
        storageSet(STORE_KEYS.settings, JSON.stringify(updated));
        return updated;
      });
      triggerAutoSync(nextSales, nextProds);
      return true;
    },
    [sales, products]
  );

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const updated = { ...settings, ...patch };
      setSettings(updated);
      await storageSet(STORE_KEYS.settings, JSON.stringify(updated));
      return true;
    },
    [settings]
  );

  const addProduct = useCallback(
    async (prod: Product) => {
      let finalSku = (prod.sku || '').trim();
      const existingSkus = new Set(products.map((p) => p.sku));
      if (!finalSku || existingSkus.has(finalSku)) {
        finalSku = finalSku ? `${finalSku}-${Date.now()}` : `NP-${Date.now()}`;
      }
      // stock ที่กรอกมาต้องกลายเป็น "init" เพราะ recomputeStock จะคำนวณ
      // stock ใหม่เสมอจาก init + inflow - sold (ไม่สนใจค่า stock ที่ส่งมาตรงๆ)
      const desiredStock = Number(prod.stock) || 0;
      const newProd: Product = {
        ...prod,
        id: prod.id || `prod-${finalSku}`,
        sku: finalSku,
        init: desiredStock,
        inflow: Number(prod.inflow) || 0,
        sold: 0,
      };
      const newProds = [newProd, ...products];
      const recomputed = recomputeStock(newProds, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [products, sales]
  );

  const updateProduct = useCallback(
    async (idOrSku: string, patch: Partial<Product>) => {
      const newProds = products.map((p) => {
        if (p.sku !== idOrSku && p.id !== idOrSku) return p;
        const merged = { ...p, ...patch };
        // recomputeStock จะคำนวณ stock ใหม่จาก init + inflow - sold เสมอ
        // ถ้ามีคนแก้ "stock" ตรงๆ (เช่นปุ่ม +/- หรือแก้ในฟอร์มสินค้า)
        // ต้องแปลงกลับเป็นการปรับค่า init ไม่งั้นค่าที่แก้จะถูกเขียนทับทันที
        if (patch.stock !== undefined) {
          const inflow = Number(merged.inflow ?? p.inflow) || 0;
          const sold = Number(p.sold) || 0;
          merged.init = Number(patch.stock) - inflow + sold;
        }
        return merged;
      });
      const recomputed = recomputeStock(newProds, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [products, sales]
  );

  const deleteProduct = useCallback(
    async (idOrSku: string) => {
      const newProds = products.filter((p) => p.sku !== idOrSku && p.id !== idOrSku);
      const recomputed = recomputeStock(newProds, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [products, sales]
  );

  const recomputeAllStock = useCallback(async () => {
    const recomputed = recomputeStock(products, sales);
    setProducts(recomputed);
    await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));
    triggerAutoSync(sales, recomputed);
    return true;
  }, [products, sales]);

  const updateCustomerMeta = useCallback(
    async (custKey: string, meta: Partial<CustomerMeta>) => {
      const current = customersMeta[custKey] || {};
      const updated = {
        ...customersMeta,
        [custKey]: { ...current, ...meta },
      };
      setCustomersMeta(updated);
      await storageSet(STORE_KEYS.customers, JSON.stringify(updated));
      return true;
    },
    [customersMeta]
  );

  const deleteSaleEntry = useCallback(
    async (id: string, reason?: string) => {
      const target = sales.find((s) => String(s.id) === String(id));
      const nextSales = sales.filter((s) => String(s.id) !== String(id));
      setSales(nextSales);
      const nextProds = recomputeStock(products, nextSales);
      setProducts(nextProds);
      await deleteSalesRow(id);
      await storageSet(STORE_KEYS.sales, JSON.stringify(nextSales));
      await storageSet(STORE_KEYS.products, JSON.stringify(nextProds));

      if (target) {
        setSettings((prev) => {
          const isPast = target.date < todayISO();
          const detail = `${target.name} ${target.size} ${target.base} (${target.qty} ถัง ยอด ${target.total} บ.) วันที่ ${target.date}${reason ? ` [เหตุผล: ${reason}]` : ''}`;
          const updated = addAuditItem(prev, 'ลบรายการขาย', detail, isPast);
          storageSet(STORE_KEYS.settings, JSON.stringify(updated));
          return updated;
        });
      }
      triggerAutoSync(nextSales, nextProds);
      return true;
    },
    [sales, products]
  );

  const clearSalesEntries = useCallback(
    async (onlySeed: boolean = false) => {
      let remainingSales: SaleEntry[] = [];
      let countToClear = 0;

      if (onlySeed) {
        // Clear only seed sales (where seed === true or id starts with 'seed-')
        remainingSales = sales.filter((s) => !s.seed && !String(s.id).startsWith('seed-'));
        countToClear = sales.length - remainingSales.length;
      } else {
        // Clear all sales
        countToClear = sales.length;
        remainingSales = [];
      }

      setSales(remainingSales);
      const nextProds = recomputeStock(products, remainingSales);
      setProducts(nextProds);

      if (remainingSales.length === 0) {
        await clearSalesTable();
      } else {
        await clearSalesTable();
        if (remainingSales.length > 0) {
          await upsertSalesRows(remainingSales);
        }
      }

      await storageSet(STORE_KEYS.sales, JSON.stringify(remainingSales));
      await storageSet(STORE_KEYS.products, JSON.stringify(nextProds));

      setSettings((prev) => {
        const actionLabel = onlySeed ? 'ล้างยอดขายตัวอย่าง' : 'ล้างยอดขายทั้งหมด';
        const detail = onlySeed
          ? `ล้างยอดขายตัวอย่างเริ่มต้น ${countToClear} รายการ เพื่อเตรียมนำเข้าไฟล์จริง`
          : `ล้างประวัติการขายทั้งหมด ${countToClear} รายการ`;
        const updated = addAuditItem(prev, actionLabel, detail);
        storageSet(STORE_KEYS.settings, JSON.stringify(updated));
        return updated;
      });

      triggerAutoSync(remainingSales, nextProds);
      return { clearedCount: countToClear };
    },
    [sales, products]
  );

  const clearAllSales = useCallback(async () => {
    await clearSalesEntries(false);
    return true;
  }, [clearSalesEntries]);

  const saveSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    return await storageSet(STORE_KEYS.settings, JSON.stringify(newSettings));
  }, []);

  const saveMksDay = useCallback(
    async (date: string, rows: any) => {
      const updated = {
        ...mksDayHistory,
        [date]: { date, rows },
      };
      setMksDayHistory(updated);
      return await storageSet(STORE_KEYS.mksDay, JSON.stringify(updated));
    },
    [mksDayHistory]
  );

  const saveMksWeek = useCallback(
    async (from: string, to: string, rows: any) => {
      const key = `${from}_${to}`;
      const updated = {
        ...mksWeekHistory,
        [key]: { from, to, rows },
      };
      setMksWeekHistory(updated);
      return await storageSet(STORE_KEYS.mksWeek, JSON.stringify(updated));
    },
    [mksWeekHistory]
  );

  const toggleCustomerFavorite = useCallback(
    async (custKey: string) => {
      const current = customersMeta[custKey] || {};
      const updated = {
        ...customersMeta,
        [custKey]: {
          ...current,
          favorite: !current.favorite,
        },
      };
      setCustomersMeta(updated);
      return await storageSet(STORE_KEYS.customers, JSON.stringify(updated));
    },
    [customersMeta]
  );

  const setCustomerColor = useCallback(
    async (custKey: string, color: string | null) => {
      const current = customersMeta[custKey] || {};
      const updated = {
        ...customersMeta,
        [custKey]: {
          ...current,
          color,
        },
      };
      setCustomersMeta(updated);
      return await storageSet(STORE_KEYS.customers, JSON.stringify(updated));
    },
    [customersMeta]
  );

  const setMonthTarget = useCallback(
    async (mKey: string, target: number) => {
      const updatedTargets = {
        ...(settings?.targets || {}),
        [mKey]: target,
      };
      const updatedSettings = addAuditItem(
        { ...settings, targets: updatedTargets },
        'ปรับเป้าหมาย',
        `ปรับเป้าหมายเดือน ${mKey} เป็น ${target.toLocaleString()} บ.`
      );
      return await saveSettings(updatedSettings);
    },
    [settings, saveSettings]
  );

  const setMonthHeadcount = useCallback(
    async (mKey: string, count: number) => {
      const updatedHeadcounts = {
        ...(settings.headcounts || {}),
        [mKey]: count,
      };
      const updatedSettings = {
        ...settings,
        headcounts: updatedHeadcounts,
      };
      return await saveSettings(updatedSettings);
    },
    [settings, saveSettings]
  );

  const setGallonIncentives = useCallback(
    async (mKey: string, rules: GallonIncentiveRule[]) => {
      const updatedRules = {
        ...(settings.gallonIncentives || {}),
        [mKey]: rules,
      };
      const updatedSettings = addAuditItem(
        { ...settings, gallonIncentives: updatedRules },
        'ปรับเกณฑ์แกลลอน',
        `ปรับกฎค่าถังเดือน ${mKey} จำนวน ${rules.length} กฎ`
      );
      return await saveSettings(updatedSettings);
    },
    [settings, saveSettings]
  );

  const replaceProducts = useCallback(
    async (prods: Product[], auditDetail?: string) => {
      const recomputed = recomputeStock(prods, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));
      setSettings((prev) => {
        const detail = auditDetail || `แทนที่สินค้า ${prods.length} รายการ`;
        const updated = addAuditItem(prev, 'นำเข้า Excel', detail);
        storageSet(STORE_KEYS.settings, JSON.stringify(updated));
        return updated;
      });
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [sales]
  );

  const mergeProducts = useCallback(
    async (incomingProds: Product[], auditDetail?: string) => {
      const skuMap = new Map<string, Product>();
      const nameKeyMap = new Map<string, Product>();
      products.forEach((p) => {
        if (p.sku && p.sku.trim()) {
          skuMap.set(p.sku.trim().toLowerCase(), p);
        }
        const key = `${p.name.trim().toLowerCase()}|${(p.size || '').trim().toLowerCase()}|${(p.base || '').trim().toLowerCase()}`;
        nameKeyMap.set(key, p);
      });

      const updatedList: Product[] = [...products];
      let addCount = 0;
      let updateCount = 0;

      incomingProds.forEach((incoming) => {
        const incomingSkuKey = incoming.sku ? incoming.sku.trim().toLowerCase() : '';
        const incomingNameKey = `${incoming.name.trim().toLowerCase()}|${(incoming.size || '').trim().toLowerCase()}|${(incoming.base || '').trim().toLowerCase()}`;

        let matched: Product | undefined;
        let matchIdx = -1;

        if (incomingSkuKey && skuMap.has(incomingSkuKey)) {
          matched = skuMap.get(incomingSkuKey);
          matchIdx = updatedList.findIndex((p) => p.sku === matched!.sku);
        } else if (nameKeyMap.has(incomingNameKey)) {
          matched = nameKeyMap.get(incomingNameKey);
          matchIdx = updatedList.findIndex(
            (p) =>
              p.name.trim().toLowerCase() === incoming.name.trim().toLowerCase() &&
              (p.size || '').trim().toLowerCase() === (incoming.size || '').trim().toLowerCase() &&
              (p.base || '').trim().toLowerCase() === (incoming.base || '').trim().toLowerCase()
          );
        }

        if (matched && matchIdx >= 0) {
          updateCount++;
          const target = updatedList[matchIdx];
          updatedList[matchIdx] = {
            ...target,
            price: incoming.price !== undefined && incoming.price > 0 ? incoming.price : target.price,
            init: incoming.init !== undefined ? incoming.init : target.init,
            inflow: incoming.inflow !== undefined ? incoming.inflow : target.inflow,
            size: incoming.size || target.size,
            base: incoming.base || target.base,
            filmColor: incoming.filmColor || target.filmColor,
          };
        } else {
          addCount++;
          const newSku = incoming.sku && incoming.sku.trim()
            ? incoming.sku.trim()
            : 'SKU-' + Math.random().toString(36).slice(2, 7);
          const newProd: Product = {
            ...incoming,
            sku: newSku,
            init: incoming.init || 0,
            inflow: incoming.inflow || 0,
            sold: 0,
            remain: (incoming.init || 0) + (incoming.inflow || 0),
            stock: (incoming.init || 0) + (incoming.inflow || 0),
            currentStock: (incoming.init || 0) + (incoming.inflow || 0),
          };
          updatedList.push(newProd);
          skuMap.set(newSku.toLowerCase(), newProd);
          nameKeyMap.set(incomingNameKey, newProd);
        }
      });

      const recomputed = recomputeStock(updatedList, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));
      setSettings((prev) => {
        const detail = auditDetail || `เพิ่มใหม่ ${addCount} อัปเดต ${updateCount} รายการ`;
        const updated = addAuditItem(prev, 'นำเข้า Excel', detail);
        storageSet(STORE_KEYS.settings, JSON.stringify(updated));
        return updated;
      });
      triggerAutoSync(sales, recomputed);
      return { addCount, updateCount };
    },
    [products, sales]
  );

  const updateProductDetails = useCallback(
    async (sku: string, patch: Partial<Product>) => {
      const updated = products.map((p) => {
        if (p.sku === sku || (!sku && p.name === patch.name)) {
          const newInit = patch.stock !== undefined ? patch.stock : (patch.init !== undefined ? patch.init : p.init);
          return {
            ...p,
            ...patch,
            init: newInit,
            stock: newInit,
            remain: newInit + p.inflow - p.sold,
          };
        }
        return p;
      });
      const recomputed = recomputeStock(updated, sales);
      triggerAutoSync(sales, recomputed);
      return await saveProducts(recomputed, `แก้ไขสินค้า SKU: ${sku}`);
    },
    [products, sales, saveProducts]
  );

  const restockProduct = useCallback(
    async (sku: string, qty: number, note?: string, date?: string) => {
      let targetProd: Product | undefined;
      const updated = products.map((p) => {
        if (p.sku === sku) {
          targetProd = p;
          const newInflow = (p.inflow || 0) + qty;
          const newRemain = p.init + newInflow - p.sold;
          return {
            ...p,
            inflow: newInflow,
            remain: newRemain,
            stock: newRemain,
            currentStock: newRemain,
          };
        }
        return p;
      });
      const recomputed = recomputeStock(updated, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));

      const d = date || todayISO();
      const pName = targetProd ? `${targetProd.name} ${targetProd.size} ${targetProd.base}`.trim() : sku;
      const detail = `เติมสต็อก ${pName} จำนวน +${qty} วันที่ ${d}${note ? ` [โน้ต: ${note}]` : ''}`;
      setSettings((prev) => {
        const updatedSettings = addAuditItem(prev, 'เติมสต็อก', detail);
        storageSet(STORE_KEYS.settings, JSON.stringify(updatedSettings));
        return updatedSettings;
      });
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [products, sales]
  );

  const bulkRestockProducts = useCallback(
    async (
      items: { sku: string; qty: number; note?: string }[],
      date?: string,
      generalNote?: string
    ) => {
      if (!items.length) return true;
      const itemMap = new Map<string, { qty: number; note?: string }>();
      items.forEach((it) => {
        const existing = itemMap.get(it.sku);
        if (existing) {
          existing.qty += it.qty;
          if (it.note) existing.note = (existing.note ? existing.note + ', ' : '') + it.note;
        } else {
          itemMap.set(it.sku, { qty: it.qty, note: it.note });
        }
      });

      const d = date || todayISO();
      const auditDetails: string[] = [];
      const updated = products.map((p) => {
        const restock = itemMap.get(p.sku);
        if (restock && restock.qty > 0) {
          const newInflow = (p.inflow || 0) + restock.qty;
          const newRemain = p.init + newInflow - p.sold;
          const pName = `${p.name} ${p.size} ${p.base}`.trim();
          auditDetails.push(
            `เติมสต็อก ${pName} จำนวน +${restock.qty} วันที่ ${d}${restock.note ? ` [โน้ต: ${restock.note}]` : ''}`
          );
          return {
            ...p,
            inflow: newInflow,
            remain: newRemain,
            stock: newRemain,
            currentStock: newRemain,
          };
        }
        return p;
      });

      const recomputed = recomputeStock(updated, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));

      setSettings((prev) => {
        let currentSettings = prev;
        for (const detail of auditDetails) {
          currentSettings = addAuditItem(currentSettings, 'เติมสต็อก', detail);
        }
        if (generalNote) {
          currentSettings = addAuditItem(
            currentSettings,
            'เติมสต็อกชุดใหญ่',
            `เติมสต็อกจำนวน ${items.length} รายการ วันที่ ${d} [โน้ต: ${generalNote}]`
          );
        }
        storageSet(STORE_KEYS.settings, JSON.stringify(currentSettings));
        return currentSettings;
      });
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [products, sales]
  );

  const fixProductStock = useCallback(
    async (sku: string, actualStock: number, reason: string) => {
      let oldStock = 0;
      let prodName = sku;
      const updated = products.map((p) => {
        if (p.sku === sku) {
          oldStock = Number(p.remain) || 0;
          prodName = `${p.name} ${p.size} ${p.base}`.trim();
          const sold = Number(p.sold) || 0;
          const inflow = Number(p.inflow) || 0;
          const newInit = actualStock + sold - inflow;
          return {
            ...p,
            init: newInit,
            stock: actualStock,
            remain: actualStock,
            currentStock: actualStock,
          };
        }
        return p;
      });
      const recomputed = recomputeStock(updated, sales);
      setProducts(recomputed);
      await storageSet(STORE_KEYS.products, JSON.stringify(recomputed));

      const diff = actualStock - oldStock;
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
      const detail = `ปรับสต็อก ${prodName} จาก ${oldStock} เป็น ${actualStock} (${diffStr}) [เหตุผล: ${reason || 'ปรับยอดตรวจนับ'}]`;
      setSettings((prev) => {
        const updatedSettings = addAuditItem(prev, 'ปรับสต็อก', detail);
        storageSet(STORE_KEYS.settings, JSON.stringify(updatedSettings));
        return updatedSettings;
      });
      triggerAutoSync(sales, recomputed);
      return true;
    },
    [products, sales]
  );

  const updateCustomerInfo = useCallback(
    async (phone: string, info: { name: string; note?: string; tags?: string[] }) => {
      const current = customersMeta[phone] || {};
      const updated = {
        ...customersMeta,
        [phone]: {
          ...current,
          notes: info.note ?? current.notes,
        },
      };
      setCustomersMeta(updated);
      return await storageSet(STORE_KEYS.customers, JSON.stringify(updated));
    },
    [customersMeta]
  );

  const auditLogs = useMemo(() => {
    return (settings?.auditLog || []).map((item, idx) => ({
      id: 'log-' + idx,
      timestamp: item.time,
      user: 'Admin',
      action: item.action,
      details: item.detail,
    }));
  }, [settings?.auditLog]);

  const resetAllData = useCallback(async () => {
    const sProds = seedProducts();
    const sSales = seedSales();
    const defaultSettings: AppSettings = {
      targets: { ...TARGETS_SEED },
      headcounts: {},
      gallonIncentives: {},
    };
    await clearSalesTable();
    await storageSet(STORE_KEYS.products, JSON.stringify(sProds));
    await storageSet(STORE_KEYS.sales, JSON.stringify(sSales));
    await storageSet(STORE_KEYS.settings, JSON.stringify(defaultSettings));
    await storageSet(STORE_KEYS.mksDay, JSON.stringify({}));
    await storageSet(STORE_KEYS.mksWeek, JSON.stringify({}));
    await storageSet(STORE_KEYS.customers, JSON.stringify({}));
    setProducts(sProds);
    setSales(sSales);
    setSettings(defaultSettings);
    setMksDayHistory({});
    setMksWeekHistory({});
    setCustomersMeta({});
    return true;
  }, []);

  const value = useMemo(
    () => ({
      products,
      sales,
      settings,
      mksDayHistory,
      mksWeekHistory,
      customersMeta,
      activeMonth,
      setActiveMonth,
      currentUser,
      setCurrentUser,
      googleProfile,
      setGoogleProfile: (p: GoogleUserProfile | null) => {
        setGoogleProfile(p);
        if (p) {
          saveGoogleProfile(p);
        } else {
          clearGoogleProfile();
        }
      },
      isLoading,
      saveProducts,
      addSalesEntries,
      updateSaleEntry,
      deleteSaleEntry,
      clearSalesEntries,
      clearAllSales,
      saveSettings,
      updateSettings,
      addProduct,
      updateProduct,
      deleteProduct,
      recomputeAllStock,
      updateCustomerMeta,
      saveMksDay,
      saveMksWeek,
      toggleCustomerFavorite,
      setCustomerColor,
      setMonthTarget,
      setMonthHeadcount,
      setGallonIncentives,
      replaceProducts,
      mergeProducts,
      updateProductDetails,
      restockProduct,
      bulkRestockProducts,
      fixProductStock,
      updateCustomerInfo,
      auditLogs,
      resetAllData,
      refreshData: loadInitialData,
    }),
    [
      products,
      sales,
      settings,
      mksDayHistory,
      mksWeekHistory,
      customersMeta,
      activeMonth,
      currentUser,
      googleProfile,
      isLoading,
      saveProducts,
      addSalesEntries,
      updateSaleEntry,
      deleteSaleEntry,
      clearSalesEntries,
      clearAllSales,
      saveSettings,
      updateSettings,
      addProduct,
      updateProduct,
      deleteProduct,
      recomputeAllStock,
      updateCustomerMeta,
      saveMksDay,
      saveMksWeek,
      toggleCustomerFavorite,
      setCustomerColor,
      setMonthTarget,
      setMonthHeadcount,
      setGallonIncentives,
      replaceProducts,
      mergeProducts,
      updateProductDetails,
      restockProduct,
      bulkRestockProducts,
      fixProductStock,
      updateCustomerInfo,
      auditLogs,
      resetAllData,
      loadInitialData,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

import React, { useState } from 'react';
import { X, PackagePlus, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useAppState } from '../../context/AppStateContext';
import { triggerAutoSync } from '../../services/googleSheetsSync';
import { logAuditAction } from '../../services/auditService';

interface BulkStockInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StockInItem {
  productId: string;
  sku: string;
  name: string;
  qty: number;
}

export const BulkStockInModal: React.FC<BulkStockInModalProps> = ({ isOpen, onClose }) => {
  const { products, saveProducts, sales } = useAppState();

  const [items, setItems] = useState<StockInItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputQty, setInputQty] = useState<number>(1);
  const [docRef, setDocRef] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!selectedProductId) {
      setErrorMsg('กรุณาเลือกสินค้า');
      return;
    }
    const prod = products.find(
      (p) => (p.id && p.id === selectedProductId) || p.sku === selectedProductId
    );
    if (!prod) {
      setErrorMsg('ไม่พบข้อมูลสินค้า');
      return;
    }
    if (inputQty <= 0) {
      setErrorMsg('จำนวนต้องมากกว่า 0');
      return;
    }

    const prodId = prod.id || prod.sku;
    const existingIndex = items.findIndex(
      (i) => i.productId === prodId || (prod.sku && i.sku === prod.sku)
    );
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].qty += Number(inputQty);
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prodId,
          sku: prod.sku || '',
          name: `${prod.name} ${prod.size || ''} ${prod.base || ''}`.trim(),
          qty: Number(inputQty),
        },
      ]);
    }

    setSelectedProductId('');
    setInputQty(1);
    setErrorMsg('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSaveStockIn = async () => {
    if (items.length === 0) {
      setErrorMsg('กรุณาเพิ่มรายการสินค้าที่รับเข้าอย่างน้อย 1 รายการ');
      return;
    }

    setIsSaving(true);
    try {
      const itemMap = new Map<string, number>();
      items.forEach((item) => {
        if (item.productId) {
          itemMap.set(item.productId, (itemMap.get(item.productId) || 0) + item.qty);
        }
        if (item.sku) {
          itemMap.set(item.sku, (itemMap.get(item.sku) || 0) + item.qty);
        }
      });

      const updatedProducts = products.map((p) => {
        const addQty = (p.id && itemMap.get(p.id)) || (p.sku && itemMap.get(p.sku));
        if (addQty) {
          const newInflow = (Number(p.inflow) || 0) + addQty;
          const newRemain = (Number(p.remain) || Number(p.stock) || 0) + addQty;
          return {
            ...p,
            inflow: newInflow,
            remain: newRemain,
            stock: newRemain,
          };
        }
        return p;
      });

      await saveProducts(updatedProducts);

      // Record audit log
      const summaryText = items.map((i) => `${i.name} (+${i.qty})`).join(', ');
      logAuditAction(
        'STOCK_IN',
        `รับสินค้าเข้าสต็อก: ${summaryText} ${docRef ? `(อ้างอิง: ${docRef})` : ''}`
      );

      // Trigger auto-sync to Google Sheets (non-blocking)
      triggerAutoSync(sales, updatedProducts);

      setItems([]);
      setDocRef('');
      setNote('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'บันทึกการรับเข้าไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const totalAddedUnits = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                รับเข้าสต็อก (Bulk Stock In)
              </h3>
              <p className="text-xs text-slate-500">
                เพิ่มยอดสินค้าเข้าคลัง และซิงก์ข้อมูลอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reference Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                เลขที่เอกสาร / PO อ้างอิง:
              </label>
              <input
                type="text"
                value={docRef}
                onChange={(e) => setDocRef(e.target.value)}
                placeholder="เช่น PO-202603001"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                หมายเหตุเพิ่มเติม:
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น สินค้าเข้าจากศูนย์นิปปอน"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Add Item Line */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              เลือกสินค้าที่จะรับเข้า:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-8">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="">-- เลือกรายการสินค้า --</option>
                  {products.map((p, idx) => {
                    const optVal = p.id || p.sku || `prod-${idx}`;
                    return (
                      <option key={`stockin-opt-${p.id || p.sku || 'prod'}-${idx}`} value={optVal}>
                        {p.name} {p.size ? `[${p.size}]` : ''} {p.base ? `(${p.base})` : ''} - คงเหลือเดิม: {p.stock ?? p.remain ?? 0}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="sm:col-span-4 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white focus:outline-none font-mono"
                  placeholder="จำนวน"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
                  title="เพิ่มลงรายการ"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>รายการที่พร้อมรับเข้า ({items.length})</span>
              <span>รวม {totalAddedUnits} ถัง</span>
            </div>

            {items.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {items.map((item, idx) => (
                  <div
                    key={`stockin-item-${item.productId || item.sku || idx}-${idx}`}
                    className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">
                        {item.name}
                      </span>
                      {item.sku && (
                        <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        +{item.qty} ถัง
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                ยังไม่มีรายการสินค้าในรายการรับเข้า
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSaveStockIn}
            disabled={isSaving || items.length === 0}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'กำลังบันทึก...' : 'ยืนยันรับเข้าสต็อก'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

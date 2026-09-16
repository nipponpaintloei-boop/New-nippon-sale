import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useAppState } from '../../context/AppStateContext';

interface SingleRestockModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SingleRestockModal: React.FC<SingleRestockModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { restockProduct } = useAppState();
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setNote('');
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numQty = Number(qty);
    if (!numQty || numQty <= 0) {
      setErrorMsg('กรุณากรอกจำนวนที่ต้องการเติมให้มากกว่า 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const identifier = product.sku || product.id;
      const success = await restockProduct(identifier, numQty, note.trim());
      if (success) {
        onClose();
      } else {
        setErrorMsg('ไม่สามารถบันทึกการรับเข้าสต็อกได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเติมสต็อก');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRemain = Number(product.stock ?? product.remain ?? 0);
  const newProjectedRemain = currentRemain + (Number(qty) || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                รับเข้าสต็อก (เติมสต็อก)
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SKU: {product.sku || '-'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
          <div className="font-bold text-sm text-slate-900 dark:text-white">
            {product.name}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>ขนาด: {product.size || '-'}</span>
            <span>•</span>
            <span>เบส: {product.base || '-'}</span>
            {product.filmColor && (
              <>
                <span>•</span>
                <span>ฟิล์ม: {product.filmColor}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 text-xs">
            <span className="text-slate-500">คงเหลือปัจจุบัน:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
              currentRemain < 0
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                : currentRemain === 0
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
            }`}>
              {currentRemain} ถัง
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              จำนวนรับเข้าเพิ่ม (ถัง) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="flex-1 text-center font-mono font-bold text-lg px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Increment Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium mr-1">เพิ่มด่วน:</span>
            {[5, 10, 20, 50].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setQty((prev) => prev + step)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
              >
                +{step}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              หมายเหตุ / เลขที่เอกสารรับเข้า (ถ้ามี)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ใบส่งของ INV-2026/001, โอนย้ายสาขา"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Projected Result */}
          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
            <span>ยอดคงเหลือหลังรับเข้า:</span>
            <span className="font-mono font-bold text-sm">
              {newProjectedRemain} ถัง (+{qty})
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันรับเข้า'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

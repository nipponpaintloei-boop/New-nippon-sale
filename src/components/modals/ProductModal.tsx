import React, { useState, useEffect } from 'react';
import { Package, Save, X, Trash2 } from 'lucide-react';
import { Product } from '../../types';
import { useAppState } from '../../context/AppStateContext';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const { addProduct, updateProduct, deleteProduct } = useAppState();

  const [sku, setSku] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [size, setSize] = useState<string>('2.5GL');
  const [base, setBase] = useState<string>('A');
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);

  useEffect(() => {
    if (product) {
      setSku(product.sku);
      setName(product.name);
      setSize(product.size || '');
      setBase(product.base || '');
      setPrice(product.price || 0);
      setStock(product.stock || 0);
    } else {
      setSku('NP-' + Math.floor(1000 + Math.random() * 9000));
      setName('');
      setSize('2.5GL');
      setBase('A');
      setPrice(0);
      setStock(10);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!product;

  const handleSave = async () => {
    if (!name.trim()) {
      alert('กรุณาระบุชื่อสินค้า');
      return;
    }

    if (isEdit && product) {
      await updateProduct(product.id, {
        sku: sku.trim(),
        name: name.trim(),
        size: size.trim(),
        base: base.trim(),
        price: Number(price) || 0,
        stock: Number(stock) || 0,
      });
    } else {
      await addProduct({
        id: 'prod-' + Date.now(),
        sku: sku.trim() || 'NP-' + Date.now(),
        name: name.trim(),
        size: size.trim(),
        base: base.trim(),
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        init: 0,
        inflow: 0,
        sold: 0,
        remain: Number(stock) || 0,
        category: 'สีทาอาคาร',
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (product && confirm('คุณต้องการลบสินค้านี้ใช่หรือไม่?')) {
      await deleteProduct(product.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEdit ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
              </h3>
              <p className="text-xs text-slate-400">ระบบแคตตาล็อกและสต็อกสีนิปปอน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              รหัสสินค้า (SKU)
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              ชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น WEATHERBOND ADVANCE"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ขนาด</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="2.5GL, 5GL, 1GL"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">เบส (Base)</label>
              <input
                type="text"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                placeholder="A, B, C, D"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                ราคาต่อหน่วย (บาท)
              </label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                จำนวนสต็อกคงเหลือ
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          {isEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบสินค้านี้</span>
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

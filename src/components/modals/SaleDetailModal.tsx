import React, { useState, useEffect } from 'react';
import { Edit2, Save, Trash2, X, Calendar, User, DollarSign } from 'lucide-react';
import { SaleEntry } from '../../types';
import { useAppState } from '../../context/AppStateContext';
import { fmt } from '../../services/calculations';

interface SaleDetailModalProps {
  sale: SaleEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({
  sale,
  isOpen,
  onClose,
  onDelete,
}) => {
  const { updateSaleEntry, deleteSaleEntry } = useAppState();

  const [date, setDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [size, setSize] = useState<string>('');
  const [base, setBase] = useState<string>('');
  const [colorCode, setColorCode] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [tintPrice, setTintPrice] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  useEffect(() => {
    if (sale) {
      setDate(sale.date);
      setName(sale.name);
      setSize(sale.size || '');
      setBase(sale.base || '');
      setColorCode(sale.colorCode || '');
      setPrice(sale.price || 0);
      setTintPrice(sale.tintPrice || 0);
      setQty(sale.qty || 1);
      setCustomerName(sale.customerName || '');
      setCustomerPhone(sale.customerPhone || '');
    }
  }, [sale]);

  if (!isOpen || !sale) return null;

  const currentTotal = (Number(price) + Number(tintPrice)) * Number(qty);

  const handleSave = async () => {
    await updateSaleEntry(sale.id, {
      date,
      name,
      size,
      base,
      colorCode,
      price: Number(price),
      tintPrice: Number(tintPrice),
      qty: Number(qty),
      total: currentTotal,
      customerName,
      customerPhone,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (confirm('คุณต้องการลบรายการขายนี้ใช่หรือไม่?')) {
      await deleteSaleEntry(sale.id);
      if (onDelete) onDelete(sale.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                รายละเอียด & แก้ไขรายการขาย
              </h3>
              <p className="text-xs text-slate-400 font-mono">ID: {sale.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto space-y-3 text-xs pr-1">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              วันที่ทำรายการ
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              ชื่อสินค้า
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ขนาด</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">เบส</label>
              <input
                type="text"
                value={base}
                onChange={(e) => setBase(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">รหัสสี</label>
              <input
                type="text"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="w-full px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ราคา/หน่วย</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">+ แม่สี</label>
              <input
                type="number"
                value={tintPrice}
                onChange={(e) => setTintPrice(Number(e.target.value) || 0)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">จำนวน</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 1)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60">
            <span className="font-bold text-slate-700 dark:text-slate-300">ยอดรวมคำนวณใหม่:</span>
            <span className="text-base font-black font-mono text-red-600 dark:text-red-400">
              {fmt(currentTotal)} บาท
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ชื่อลูกค้า</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">เบอร์โทร</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ลบรายการนี้</span>
          </button>
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
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

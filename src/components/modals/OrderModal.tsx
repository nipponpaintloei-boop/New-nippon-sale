import React, { useState } from 'react';
import { ShoppingCart, Copy, Check, X } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { generateOrderText } from '../../services/exportService';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose }) => {
  const { products } = useAppState();
  const [storeName, setStoreName] = useState<string>('ร้านค้าตัวแทนจำหน่าย');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{ name: string; size: string; qty: number }[]>([
    { name: 'WEATHERBOND', size: '2.5GL', qty: 2 },
    { name: 'VINILEX 5000 (I)', size: '5GL', qty: 1 },
  ]);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const orderText = generateOrderText({
    storeName,
    customerName,
    items: selectedItems,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(orderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddItem = () => {
    setSelectedItems((prev) => [...prev, { name: '', size: '2.5GL', qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                สร้างใบสั่งสินค้า (ส่งเข้า LINE)
              </h3>
              <p className="text-xs text-slate-400">สร้างข้อความฟอร์แมตมาตรฐานสำหรับส่งเข้ากลุ่มสั่งของ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form & Preview */}
        <div className="overflow-y-auto space-y-4 text-xs pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                ชื่อร้านค้า / สาขา
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                ชื่อลูกค้า / ผู้สั่ง (ถ้ามี)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="ระบุชื่อลูกค้า..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                รายการสินค้าที่ต้องการสั่ง
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                + เพิ่มรายการ
              </button>
            </div>

            {selectedItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                    );
                  }}
                  placeholder="ชื่อสินค้า เช่น WEATHERBOND"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <input
                  type="text"
                  value={item.size}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, size: val } : it))
                    );
                  }}
                  placeholder="ขนาด"
                  className="w-20 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center"
                />
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    setSelectedItems((prev) =>
                      prev.map((it, i) => (i === idx ? { ...it, qty: val } : it))
                    );
                  }}
                  className="w-16 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-center font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Live Preview of formatted text */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-slate-500 uppercase">
              ตัวอย่างข้อความที่จะคัดลอก:
            </span>
            <pre className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 font-mono text-xs whitespace-pre-wrap text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700">
              {orderText}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
          >
            ปิด
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ LINE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

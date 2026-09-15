import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowDownRight,
  TrendingDown,
  PackagePlus,
  FileSpreadsheet,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { Product } from '../../types';
import { fmt } from '../../services/calculations';
import { getLowStockProducts, getOversoldProducts } from '../../services/stockService';
import { BulkStockInModal } from '../modals/BulkStockInModal';

interface StockViewProps {
  onOpenAddProductModal: () => void;
  onEditProduct: (product: Product) => void;
  onOpenImportModal?: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  onOpenAddProductModal,
  onEditProduct,
  onOpenImportModal,
}) => {
  const { products, sales, updateProduct, deleteProduct, recomputeAllStock } = useAppState();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'oversold'>('all');
  const [isBulkStockInOpen, setIsBulkStockInOpen] = useState<boolean>(false);

  // Compute 14-day sales for low stock estimation
  const sales14Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return sales.filter((s) => s.date >= cutoffStr);
  }, [sales]);

  const oversoldList = useMemo(() => getOversoldProducts(products), [products]);
  const lowStockList = useMemo(
    () => getLowStockProducts(products, sales14Days),
    [products, sales14Days]
  );

  const filteredProducts = useMemo(() => {
    let list = products;
    if (filterMode === 'oversold') {
      list = oversoldList;
    } else if (filterMode === 'low') {
      list = lowStockList;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.size.toLowerCase().includes(q) ||
          p.base.toLowerCase().includes(q) ||
          (p.filmColor || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, filterMode, oversoldList, lowStockList, searchTerm]);

  const totalUnits = useMemo(() => {
    return products.reduce((a, b) => a + (Number(b.stock) || 0), 0);
  }, [products]);

  const totalValue = useMemo(() => {
    return products.reduce((a, b) => a + (Number(b.stock) || 0) * (Number(b.price) || 0), 0);
  }, [products]);

  const handleInlineStockChange = async (p: Product, delta: number) => {
    const newStock = (Number(p.stock) || 0) + delta;
    await updateProduct(p.sku || p.id || '', { stock: newStock });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>คลังสินค้าและการตัดสต็อก</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            สต็อกและแคตตาล็อกสินค้า
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ติดตามจำนวนคงเหลือ สินค้าติดลบ และแจ้งเตือนใกล้หมด
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/80 transition-colors cursor-pointer shadow-2xs"
              title="นำเข้าสินค้าและสต็อกเดิมจากไฟล์ Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>นำเข้า Excel</span>
            </button>
          )}
          <button
            onClick={() => setIsBulkStockInOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800/80 transition-colors cursor-pointer"
            title="รับสินค้าเข้าสต็อกหลายรายการ"
          >
            <PackagePlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>+ รับเข้าสต็อก</span>
          </button>
          <button
            onClick={recomputeAllStock}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="คำนวณยอดคงเหลือใหม่จากการขาย"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>ซิงค์สต็อกใหม่</span>
          </button>
          <button
            onClick={onOpenAddProductModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มสินค้าใหม่</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            จำนวน SKU ทั้งหมด
          </span>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {products.length} <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            ยอดคงเหลือรวม
          </span>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {fmt(totalUnits)} <span className="text-xs font-normal text-slate-400">ถัง</span>
          </div>
        </div>

        <div
          onClick={() => setFilterMode(filterMode === 'low' ? 'all' : 'low')}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            filterMode === 'low'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              ใกล้หมด (14 วัน)
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-amber-600 mt-1">
            {lowStockList.length}{' '}
            <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
        </div>

        <div
          onClick={() => setFilterMode(filterMode === 'oversold' ? 'all' : 'oversold')}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            filterMode === 'oversold'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 ring-2 ring-red-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
              สต็อกติดลบ (&lt; 0)
            </span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-red-600 mt-1">
            {oversoldList.length}{' '}
            <span className="text-xs font-normal text-slate-400">รายการ</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, ขนาด, เบส..."
            className="w-full text-xs font-medium bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ทั้งหมด ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('low')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'low'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ใกล้หมด ({lowStockList.length})
          </button>
          <button
            onClick={() => setFilterMode('oversold')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'oversold'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ติดลบ ({oversoldList.length})
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            ตารางรายการสินค้า ({filteredProducts.length} รายการ)
          </h3>
          <span className="text-xs text-slate-400">
            มูลค่าคลังประเมิน: {fmt(totalValue)} บาท
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">ชื่อสินค้า</th>
                <th className="py-3.5 px-4 text-center">ขนาด</th>
                <th className="py-3.5 px-4 text-center">เบส</th>
                <th className="py-3.5 px-4 text-center">ฟิล์มสี</th>
                <th className="py-3.5 px-4 text-right">ราคา/ถัง</th>
                <th className="py-3.5 px-4 text-center">คงเหลือ (สต็อก)</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p, idx) => {
                  const isNeg = Number(p.stock) < 0;
                  const isZero = Number(p.stock) === 0;
                  return (
                    <tr
                      key={p.id ? `stock-id-${p.id}-${idx}` : `stock-sku-${p.sku || 'item'}-${idx}`}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isNeg ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                        {p.size || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                        {p.base || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600 dark:text-slate-300">
                        {p.filmColor || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {fmt(p.price)} บ.
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleInlineStockChange(p, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span
                            className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
                              isNeg
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                : isZero
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {p.stock}
                          </span>
                          <button
                            onClick={() => handleInlineStockChange(p, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="แก้ไขสินค้า"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400">
                    ไม่พบข้อมูลสินค้าที่ตรงกับคำค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkStockInModal
        isOpen={isBulkStockInOpen}
        onClose={() => setIsBulkStockInOpen(false)}
      />
    </div>
  );
};

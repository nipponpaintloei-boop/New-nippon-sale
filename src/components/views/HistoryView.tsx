import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Download,
  Trash2,
  Edit2,
  FileSpreadsheet,
  User,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { SaleEntry } from '../../types';
import { fmt, thaiMonthYear, todayISO } from '../../services/calculations';
import { exportSalesToExcel } from '../../services/exportService';

interface HistoryViewProps {
  onEditSale: (sale: SaleEntry) => void;
  onDeleteSale: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onEditSale, onDeleteSale }) => {
  const { sales, activeMonth } = useAppState();
  const [panel, setPanel] = useState<'day' | 'month'>('month');
  const [selectedDay, setSelectedDay] = useState<string>(todayISO());
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter sales
  const filteredSales = useMemo(() => {
    let list = sales;
    if (panel === 'day') {
      list = list.filter((s) => s.date === selectedDay);
    } else {
      list = list.filter((s) => s.date.startsWith(activeMonth));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.sku && s.sku.toLowerCase().includes(q)) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.customerPhone && s.customerPhone.includes(q)) ||
          (s.billId && s.billId.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [sales, panel, selectedDay, activeMonth, searchQuery]);

  const totalAmount = useMemo(() => {
    return filteredSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  }, [filteredSales]);

  const totalQty = useMemo(() => {
    return filteredSales.reduce((a, s) => a + (Number(s.qty) || 0), 0);
  }, [filteredSales]);

  const billCount = useMemo(() => {
    const bSet = new Set();
    filteredSales.forEach((s) => bSet.add(s.billId || s.id));
    return bSet.size;
  }, [filteredSales]);

  const handleExport = () => {
    exportSalesToExcel(filteredSales, `nippon-sales-${panel === 'day' ? selectedDay : activeMonth}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-12 max-w-7xl mx-auto">
      {/* Top Header & Panel Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ประวัติและส่งออกรายการขาย
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ค้นหา ตรวจสอบ แก้ไขข้อมูล และส่งออกรายงานเข้า Excel
          </p>
        </div>

        {/* Day / Month Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setPanel('month')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              panel === 'month'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            รายเดือน ({thaiMonthYear(activeMonth)})
          </button>
          <button
            onClick={() => setPanel('day')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              panel === 'day'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            รายวัน
          </button>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Date Selector */}
        <div className="sm:col-span-4 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
          {panel === 'day' ? (
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          ) : (
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
              ประจำเดือน: {thaiMonthYear(activeMonth)}
            </span>
          )}
        </div>

        {/* Search Box */}
        <div className="sm:col-span-8 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า, SKU, ชื่อลูกค้า, เบอร์โทร..."
            className="w-full text-xs font-medium bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Chips Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            ยอดขายรวม
          </span>
          <div className="text-2xl lg:text-3xl font-black font-mono text-red-600 dark:text-red-400">
            {fmt(totalAmount)} <span className="text-xs font-medium text-slate-400">บ.</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            จำนวนขายรวม
          </span>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-800 dark:text-slate-200">
            {fmt(totalQty)} <span className="text-xs font-medium text-slate-400">ถัง</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            จำนวนบิล
          </span>
          <div className="text-2xl lg:text-3xl font-black font-mono text-slate-800 dark:text-slate-200">
            {billCount} <span className="text-xs font-medium text-slate-400">บิล</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ส่งออกข้อมูล
            </span>
            <button
              onClick={handleExport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>ดาวน์โหลด Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            ตารางรายการขาย ({filteredSales.length} รายการ)
          </h3>
          <span className="text-xs text-slate-400">
            คลิกแก้ไขเพื่อปรับเปลี่ยนข้อมูลหรือลบ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="py-3.5 px-4">วันที่</th>
                <th className="py-3.5 px-4">สินค้า</th>
                <th className="py-3.5 px-4">ขนาด/เบส/เฉด</th>
                <th className="py-3.5 px-4 text-center">จำนวน</th>
                <th className="py-3.5 px-4 text-right">ยอดรวม</th>
                <th className="py-3.5 px-4">ลูกค้า</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredSales.length > 0 ? (
                filteredSales.map((s, idx) => (
                  <tr key={s.id ? `hist-${s.id}-${idx}` : `hist-idx-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">{s.date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                      {s.name}
                      {s.sku && <span className="block text-[10px] text-slate-400 font-mono">{s.sku}</span>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {[s.size, s.base, s.colorCode].filter(Boolean).join(' ') || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {s.qty}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      {fmt(s.total)} บ.
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {s.customerName || s.customerPhone ? (
                        <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{s.customerName || s.customerPhone}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditSale(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSale(s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    ไม่พบข้อมูลรายการขายที่ตรงตามเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

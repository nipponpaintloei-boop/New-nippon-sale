import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { CustomerAggregated } from '../../types';
import { aggregateCustomers } from '../../services/customerService';
import { fmt } from '../../services/calculations';

export const CustomersView: React.FC = () => {
  const { sales, customersMeta, updateCustomerMeta } = useAppState();
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'due' | 'ok'>('all');
  const [editingCust, setEditingCust] = useState<CustomerAggregated | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');
  const [editCycle, setEditCycle] = useState<number>(30);

  const customerList = useMemo(() => {
    return aggregateCustomers(sales, customersMeta);
  }, [sales, customersMeta]);

  const filteredCustomers = useMemo(() => {
    let list = customerList;
    if (filterStatus === 'overdue') {
      list = list.filter((c) => c.followStatus === 'overdue');
    } else if (filterStatus === 'due') {
      list = list.filter((c) => c.followStatus === 'due');
    } else if (filterStatus === 'ok') {
      list = list.filter((c) => c.followStatus === 'ok');
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.meta?.notes && c.meta.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }, [customerList, filterStatus, search]);

  const counts = useMemo(() => {
    return {
      all: customerList.length,
      overdue: customerList.filter((c) => c.followStatus === 'overdue').length,
      due: customerList.filter((c) => c.followStatus === 'due').length,
      ok: customerList.filter((c) => c.followStatus === 'ok').length,
    };
  }, [customerList]);

  const handleOpenEdit = (c: CustomerAggregated) => {
    setEditingCust(c);
    setEditNotes(c.meta?.notes || '');
    setEditCycle(c.meta?.repeatCycleDays || 30);
  };

  const handleSaveMeta = async () => {
    if (!editingCust) return;
    await updateCustomerMeta(editingCust.key, {
      name: editingCust.name,
      phone: editingCust.phone,
      repeatCycleDays: Number(editCycle) || 30,
      notes: editNotes.trim(),
    });
    setEditingCust(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบลูกค้าสัมพันธ์ & การซื้อซ้ำ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ฐานข้อมูลลูกค้า & รอบติดตาม (CRM)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            รวบรวมอัตโนมัติจากบิลขาย พร้อมระบบเตือนช่างทาสีและผู้รับเหมาที่ถึงรอบซื้อซ้ำ
          </p>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'all'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 ring-2 ring-slate-900'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[11px] font-bold opacity-70 uppercase tracking-wider block">
            ลูกค้าทั้งหมด
          </span>
          <div className="text-2xl lg:text-3xl font-black font-mono mt-1">
            {counts.all} <span className="text-xs font-normal opacity-70">ราย</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('overdue')}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'overdue'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 ring-2 ring-red-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">
              เกินกำหนดซื้อซ้ำ
            </span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-red-600 mt-1">
            {counts.overdue} <span className="text-xs font-normal text-slate-400">ราย</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('due')}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'due'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
              ถึงรอบสัปดาห์นี้
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-amber-600 mt-1">
            {counts.due} <span className="text-xs font-normal text-slate-400">ราย</span>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus('ok')}
          className={`p-5 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            filterStatus === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-400'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              ปกติ / เพิ่งซื้อ
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 mt-1">
            {counts.ok} <span className="text-xs font-normal text-slate-400">ราย</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center gap-2.5">
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, บันทึกความต้องการ..."
          className="w-full text-xs font-medium bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            รายชื่อลูกค้า ({filteredCustomers.length} รายการ)
          </h3>
          <span className="text-xs text-slate-400">
            คลิกแก้ไขเพื่อใส่โน้ตหรือเปลี่ยนรอบติดตาม
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <th className="py-3.5 px-4">ลูกค้า / ช่าง</th>
                <th className="py-3.5 px-4">เบอร์โทร</th>
                <th className="py-3.5 px-4 text-center">ซื้อล่าสุด</th>
                <th className="py-3.5 px-4 text-center">ยอดซื้อสะสม</th>
                <th className="py-3.5 px-4 text-center">สถานะติดตาม</th>
                <th className="py-3.5 px-4">บันทึกช่วยจำ</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  return (
                    <tr key={c.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {c.name || 'ลูกค้าทั่วไป'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-red-600 inline-flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.phone}</span>
                          </a>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 whitespace-nowrap">
                        {c.lastDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          {fmt(c.totalSpent)} บ.
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {c.orderCount} ออเดอร์
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.followStatus === 'overdue' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            เกินรอบ ({c.daysSinceLast} วัน)
                          </span>
                        ) : c.followStatus === 'due' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                            <Clock className="w-3 h-3" />
                            ถึงรอบติดตาม
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-[200px] truncate">
                        {c.meta?.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="แก้ไขบันทึก"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    ไม่พบข้อมูลลูกค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCust && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ข้อมูลติดตามลูกค้า: {editingCust.name || editingCust.phone}
              </h3>
              <button
                onClick={() => setEditingCust(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  รอบติดตามซื้อซ้ำ (วัน)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={editCycle}
                  onChange={(e) => setEditCycle(Number(e.target.value) || 30)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  บันทึกช่วยจำ / โครงการที่กำลังทำ
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="เช่น กำลังทาสีบ้านเดี่ยว 2 ชั้น, ชอบใช้สี Weatherbond..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingCust(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveMeta}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

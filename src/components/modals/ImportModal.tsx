import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Check, AlertCircle, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppState } from '../../context/AppStateContext';
import { SaleEntry } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { addSalesEntries } = useAppState();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResultMsg(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResultMsg(null);
    }
  };

  const handleProcessImport = async () => {
    if (!file) return;
    setImporting(true);
    setResultMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const json: any[] = XLSX.utils.sheet_to_json(ws);

      if (!json || json.length === 0) {
        setResultMsg({ type: 'error', text: 'ไม่พบข้อมูลในไฟล์ Excel' });
        setImporting(false);
        return;
      }

      // Map rows to SaleEntry
      const entries: SaleEntry[] = json.map((row: any, idx: number) => {
        const d = row['วันที่'] || row['Date'] || row['date'] || new Date().toISOString().slice(0, 10);
        const name = row['ชื่อสินค้า'] || row['Product'] || row['name'] || 'สินค้าทั่วไป';
        const size = String(row['ขนาด'] || row['Size'] || row['size'] || '');
        const base = String(row['เบส'] || row['Base'] || row['base'] || '');
        const price = Number(row['ราคา'] || row['Price'] || row['price']) || 0;
        const qty = Number(row['จำนวน'] || row['Qty'] || row['qty']) || 1;
        const total = Number(row['ยอดรวม'] || row['Total'] || row['total']) || price * qty;
        const customer = row['ลูกค้า'] || row['Customer'] || '';
        const phone = String(row['เบอร์โทร'] || row['Phone'] || '');

        return {
          id: 'imp-' + Date.now() + '-' + idx,
          date: String(d).slice(0, 10),
          name: String(name),
          size,
          base,
          colorCode: '',
          price,
          tintPrice: 0,
          qty,
          total,
          sku: 'NP-' + Date.now() + '-' + idx,
          customerName: String(customer),
          customerPhone: phone,
          seed: false,
        };
      });

      await addSalesEntries(entries);
      setResultMsg({
        type: 'success',
        text: `นำเข้าข้อมูลการขายสำเร็จจำนวน ${entries.length} รายการ`,
      });
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setResultMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                นำเข้าข้อมูลยอดขายจาก Excel (.xlsx)
              </h3>
              <p className="text-xs text-slate-400">อัปโหลดไฟล์ตารางยอดขายเพื่อรวมเข้าสู่ระบบ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-800/40 hover:border-red-400 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 mx-auto flex items-center justify-center text-slate-500">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {file ? file.name : 'ลากไฟล์ Excel มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">รองรับไฟล์ .xlsx, .xls, .csv</p>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            id="excel-file-upload"
            className="hidden"
          />
          <label
            htmlFor="excel-file-upload"
            className="inline-block px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            เลือกไฟล์จากเครื่อง
          </label>
        </div>

        {resultMsg && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              resultMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {resultMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{resultMsg.text}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs"
          >
            ปิด
          </button>
          <button
            onClick={handleProcessImport}
            disabled={!file || importing}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span>{importing ? 'กำลังนำเข้า...' : 'ยืนยันนำเข้าข้อมูล'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

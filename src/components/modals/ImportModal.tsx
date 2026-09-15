import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Check,
  AlertCircle,
  X,
  Loader2,
  Package,
  ShoppingCart,
  Database,
  Info,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppState } from '../../context/AppStateContext';
import { Product, SaleEntry } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'products' | 'sales';
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'products',
}) => {
  const { sales, mergeProducts, replaceProducts, addSalesEntries, clearSalesEntries } = useAppState();

  const [activeTab, setActiveTab] = useState<'products' | 'sales'>(defaultTab);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState<boolean>(false);
  const [clearingSeed, setClearingSeed] = useState<boolean>(false);
  const [resultMsg, setResultMsg] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Check how many sales currently exist and how many are seed/demo
  const seedSalesCount = sales.filter((s) => s.seed || String(s.id).startsWith('seed-')).length;
  const totalSalesCount = sales.length;

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setResultMsg(null);
  };

  const handleTabChange = (tab: 'products' | 'sales') => {
    setActiveTab(tab);
    resetState();
  };

  const handleClearSeedSales = async () => {
    if (!window.confirm(`คุณต้องการล้างรายการยอดขายตัวอย่างทั้งหมด (${seedSalesCount} รายการ) ออกจากระบบ เพื่อเตรียมนำเข้าไฟล์จริง ใช่หรือไม่?`)) {
      return;
    }
    setClearingSeed(true);
    try {
      const res = await clearSalesEntries(true);
      setResultMsg({
        type: 'success',
        text: `ล้างยอดขายตัวอย่างสำเร็จแล้ว ${res.clearedCount} รายการ!`,
        details: 'ขณะนี้ระบบพร้อมรองรับการนำเข้าไฟล์บันทึกยอดขายจริงของคุณแล้วครับ',
      });
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการล้างยอดขายตัวอย่าง: ' + err.message,
      });
    } finally {
      setClearingSeed(false);
    }
  };

  const handleClearAllSales = async () => {
    if (!window.confirm(`คุณต้องการลบประวัติการขายทั้งหมด (${totalSalesCount} รายการ) ออกจากระบบ เพื่อเริ่มต้นใหม่ทั้งหมด ใช่หรือไม่?`)) {
      return;
    }
    setClearingSeed(true);
    try {
      const res = await clearSalesEntries(false);
      setResultMsg({
        type: 'success',
        text: `ล้างประวัติการขายทั้งหมดสำเร็จแล้ว (${res.clearedCount} รายการ)`,
        details: 'ฐานข้อมูลยอดขายถูกเคลียร์ว่างเปล่า 100% พร้อมรับไฟล์จริง',
      });
    } catch (err: any) {
      setResultMsg({
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการล้างยอดขาย: ' + err.message,
      });
    } finally {
      setClearingSeed(false);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setResultMsg(null);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = wb.SheetNames[0];
      const ws = wb.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!json || json.length === 0) {
        setResultMsg({ type: 'error', text: 'ไม่พบข้อมูลในไฟล์ หรือชีตว่างเปล่า' });
        setPreviewData([]);
        setHeaders([]);
        return;
      }

      // Extract headers from first few rows
      const detectedHeaders = Object.keys(json[0] || {});
      setHeaders(detectedHeaders);
      setPreviewData(json.slice(0, 5)); // Preview first 5 rows
    } catch (err: any) {
      console.error(err);
      setResultMsg({ type: 'error', text: 'ไม่สามารถอ่านไฟล์ Excel ได้: ' + err.message });
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Helper to find field value across multiple possible header names
  const findValue = (row: any, candidates: string[]): any => {
    for (const c of candidates) {
      if (row[c] !== undefined && row[c] !== null && row[c] !== '') {
        return row[c];
      }
      const trimmedC = c.trim().toLowerCase();
      const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === trimmedC);
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
        return row[foundKey];
      }
    }
    return undefined;
  };

  const processProductImport = async () => {
    if (!file) return;
    setImporting(true);
    setResultMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!json || json.length === 0) {
        setResultMsg({ type: 'error', text: 'ไม่พบรายการสินค้าในไฟล์' });
        setImporting(false);
        return;
      }

      const productsToMerge: Product[] = [];

      json.forEach((row, idx) => {
        // Supported column aliases: Sku/ชื่อสินค้า/ขนาด/เบส/เบอร์สี/ราคา/สต็อก
        const skuRaw = findValue(row, ['Sku', 'SKU', 'sku', 'รหัสสินค้า', 'บาร์โค้ด', 'Code']);
        const nameRaw = findValue(row, ['ชื่อสินค้า', 'Product', 'Name', 'สินค้า', 'ชื่อ']);
        const sizeRaw = findValue(row, ['ขนาด', 'Size', 'size', 'ขนาดบรรจุ']);
        const baseRaw = findValue(row, ['เบส', 'Base', 'base', 'เบสสี']);
        const priceRaw = findValue(row, ['ราคา', 'Price', 'price', 'ราคาขาย', 'ราคาสินค้า', 'ราคาสินค้า/หน่วย']);
        const stockRaw = findValue(row, ['สต็อก', 'Stock', 'stock', 'จำนวนคงเหลือ', 'คงเหลือ', 'จำนวน', 'Init', 'สต๊อก']);
        const filmColorRaw = findValue(row, ['ฟิล์มสี', 'ฟิล์มสี ', 'FilmColor', 'Film Color', 'film color']);

        const name = nameRaw ? String(nameRaw).trim() : '';
        if (!name) return; // Skip empty rows

        const sku = skuRaw ? String(skuRaw).trim() : `NP-${Date.now().toString(36)}-${idx}`;
        const size = sizeRaw ? String(sizeRaw).trim() : '1 GL';
        const base = baseRaw ? String(baseRaw).trim() : 'มาตรฐาน';
        const price = Number(priceRaw) || 0;
        const stock = Number(stockRaw) || 0;
        const filmColor = filmColorRaw ? String(filmColorRaw).trim() : '';

        productsToMerge.push({
          sku,
          name,
          size,
          base,
          price,
          init: stock,
          inflow: 0,
          sold: 0,
          remain: stock,
          stock,
          currentStock: stock,
          filmColor,
        });
      });

      if (productsToMerge.length === 0) {
        setResultMsg({
          type: 'error',
          text: 'ไม่สามารถแปลงข้อมูลสินค้าได้ กรุณาตรวจสอบชื่อคอลัมน์ในไฟล์ Excel (ต้องมีคอลัมน์ ชื่อสินค้า)',
        });
        setImporting(false);
        return;
      }

      if (importMode === 'replace') {
        if (
          !window.confirm(
            `คุณต้องการลบสินค้าเดิมทั้งหมด (${previewData.length > 0 ? 'ที่มีอยู่ในระบบ' : ''}) แล้วแทนที่ด้วยไฟล์นี้ (${productsToMerge.length} รายการ) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`
          )
        ) {
          setImporting(false);
          return;
        }
        await replaceProducts(productsToMerge, `นำเข้าไฟล์สินค้า Excel (แทนที่ทั้งหมด): ${file.name}`);

        setResultMsg({
          type: 'success',
          text: `แทนที่สินค้าทั้งหมดสำเร็จ ${productsToMerge.length} รายการ!`,
          details: 'สินค้าเดิมทั้งหมดถูกลบและแทนที่ด้วยข้อมูลจากไฟล์นี้',
        });
      } else {
        const res = await mergeProducts(productsToMerge, `นำเข้าไฟล์สินค้า Excel: ${file.name}`);

        setResultMsg({
          type: 'success',
          text: `นำเข้าสินค้าสำเร็จทั้งหมด ${productsToMerge.length} รายการ!`,
          details: `เพิ่มสินค้าใหม่ ${res.addCount} รายการ, อัปเดตราคา/สต็อกเดิม ${res.updateCount} รายการ`,
        });
      }
      setFile(null);
      setPreviewData([]);
    } catch (err: any) {
      console.error(err);
      setResultMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการประมวลผลสินค้า: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  const processSalesImport = async () => {
    if (!file) return;
    setImporting(true);
    setResultMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const wsName = wb.SheetNames[0];
      const ws = wb.Sheets[wsName];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!json || json.length === 0) {
        setResultMsg({ type: 'error', text: 'ไม่พบรายการยอดขายในไฟล์' });
        setImporting(false);
        return;
      }

      const salesToAdd: SaleEntry[] = [];

      json.forEach((row, idx) => {
        // Supported columns: วันที่, ชื่อสินค้า, ขนาด, เบส, ราคาสินค้า/หน่วย, รหัสสี, ราคาแม่สี, จำนวน, ยอดรวม
        const dateRaw = findValue(row, ['วันที่', 'Date', 'date', 'วันเวลา', 'Time']);
        const nameRaw = findValue(row, ['ชื่อสินค้า', 'Product', 'name', 'สินค้า']);
        const sizeRaw = findValue(row, ['ขนาด', 'Size', 'size', 'ขนาดบรรจุ']);
        const baseRaw = findValue(row, ['เบส', 'Base', 'base', 'เบสสี']);
        const priceRaw = findValue(row, ['ราคาสินค้า/หน่วย', 'ราคา', 'Price', 'ราคาสินค้า', 'price']);
        const colorCodeRaw = findValue(row, ['รหัสสี', 'เบอร์สี', 'Color', 'ColorCode', 'เฉดสี', 'รหัสเฉดสี']);
        const tintPriceRaw = findValue(row, ['ราคาแม่สี', 'ค่าแม่สี', 'TintPrice', 'tintPrice', 'แม่สี']);
        const qtyRaw = findValue(row, ['จำนวน', 'Qty', 'qty', 'จำนวนขาย', 'ถัง']);
        const totalRaw = findValue(row, ['ยอดรวม', 'Total', 'total', 'ยอดขาย', 'รวมเงิน']);
        const skuRaw = findValue(row, ['Sku', 'SKU', 'sku', 'รหัสสินค้า']);
        const customerRaw = findValue(row, ['ลูกค้า', 'Customer', 'ชื่อลูกค้า', 'customer']);
        const phoneRaw = findValue(row, ['เบอร์โทร', 'เบอร์', 'Phone', 'phone']);

        const name = nameRaw ? String(nameRaw).trim() : '';
        if (!name) return; // Skip empty rows

        // Format Date string: YYYY-MM-DD
        let formattedDate = new Date().toISOString().slice(0, 10);
        if (dateRaw) {
          if (typeof dateRaw === 'number') {
            // Excel serial date format
            const parsedDate = XLSX.SSF.parse_date_code(dateRaw);
            if (parsedDate) {
              const y = parsedDate.y;
              const m = String(parsedDate.m).padStart(2, '0');
              const d = String(parsedDate.d).padStart(2, '0');
              formattedDate = `${y}-${m}-${d}`;
            }
          } else {
            const strDate = String(dateRaw).trim();
            // Match DD/MM/YYYY or YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}/.test(strDate)) {
              formattedDate = strDate.slice(0, 10);
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(strDate)) {
              const parts = strDate.split('/');
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              let y = parseInt(parts[2], 10);
              if (y > 2500) y -= 543; // Handle Buddhist Era
              formattedDate = `${y}-${m}-${d}`;
            } else {
              formattedDate = strDate.slice(0, 10);
            }
          }
        }

        const size = sizeRaw ? String(sizeRaw).trim() : '1 GL';
        const base = baseRaw ? String(baseRaw).trim() : 'มาตรฐาน';
        const price = Number(priceRaw) || 0;
        const tintPrice = Number(tintPriceRaw) || 0;
        const qty = Number(qtyRaw) || 1;
        const total = Number(totalRaw) || (price + tintPrice) * qty;
        const colorCode = colorCodeRaw ? String(colorCodeRaw).trim() : '';
        const sku = skuRaw ? String(skuRaw).trim() : `NP-HIST-${idx + 1}`;

        salesToAdd.push({
          id: 'imp-sale-' + Date.now() + '-' + idx,
          date: formattedDate,
          name,
          size,
          base,
          price,
          colorCode,
          tintPrice,
          qty,
          total,
          sku,
          customerName: customerRaw ? String(customerRaw) : '',
          customerPhone: phoneRaw ? String(phoneRaw) : '',
          seed: false,
        });
      });

      if (salesToAdd.length === 0) {
        setResultMsg({
          type: 'error',
          text: 'ไม่สามารถแปลงข้อมูลการขายได้ กรุณาตรวจสอบคอลัมน์ในไฟล์ Excel',
        });
        setImporting(false);
        return;
      }

      await addSalesEntries(salesToAdd);

      setResultMsg({
        type: 'success',
        text: `นำเข้าประวัติยอดขายสำเร็จจำนวน ${salesToAdd.length} รายการ!`,
        details: `ระบบได้รวมยอดขายและคำนวณตัดสต็อกสินค้าตามรายการย้อนหลังเรียบร้อยแล้ว`,
      });
      setFile(null);
      setPreviewData([]);
    } catch (err: any) {
      console.error(err);
      setResultMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการประมวลผลยอดขาย: ' + err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                นำเข้าข้อมูล Excel (.xlsx / .xls)
              </h3>
              <p className="text-xs text-slate-500">
                รองรับไฟล์สินค้าพร้อมสต็อก และไฟล์บันทึกยอดขายย้อนหลัง
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

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => handleTabChange('products')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'products'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 text-red-500" />
            <span>1. สินค้าและสต็อก</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('sales')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            <span>2. บันทึกยอดขายย้อนหลัง</span>
          </button>
        </div>

        {/* Import Mode Toggle for Product/Stock Tab */}
        {activeTab === 'products' && (
          <div className="space-y-2">
            <span className="block text-[11px] font-bold text-slate-500 uppercase">
              รูปแบบการนำเข้า
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                  importMode === 'merge'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-1 ring-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-emerald-300'
                }`}
              >
                <div className="font-bold text-slate-800 dark:text-slate-100">
                  เพิ่ม/อัปเดตเฉพาะรายการ
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  สินค้าใหม่จะถูกเพิ่ม ส่วนสินค้าเดิม (ตรง SKU/ชื่อ) จะอัปเดตราคา-สต็อก สินค้าอื่นที่ไม่อยู่ในไฟล์จะยังอยู่เหมือนเดิม
                </p>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                  importMode === 'replace'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 ring-1 ring-rose-400'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-rose-300'
                }`}
              >
                <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>แทนที่ทั้งหมด</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ลบสินค้าเดิมทั้งหมดออกจากระบบ แล้วใช้ข้อมูลจากไฟล์นี้แทนทั้งหมด
                </p>
              </button>
            </div>
            {importMode === 'replace' && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-[11px] text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>คำเตือน: โหมดนี้จะลบสินค้าเดิมทั้งหมดในระบบ ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบไฟล์ให้ครบถ้วนก่อนยืนยัน</span>
              </div>
            )}
          </div>
        )}

        {/* Action Banner for Clearing Seed Sales if on Sales Tab */}
        {activeTab === 'sales' && (seedSalesCount > 0 || totalSalesCount > 0) && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-900 dark:text-amber-200">
                    เตรียมพื้นที่ข้อมูลยอดขายก่อนนำเข้าไฟล์จริง
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    {seedSalesCount > 0
                      ? `ตรวจพบยอดขายตัวอย่างเริ่มต้น ${seedSalesCount} รายการ (จากทั้งหมด ${totalSalesCount} รายการ) แนะนำให้เคลียร์ออกเพื่อให้ข้อมูลร้านเป็นข้อมูลจริง 100%`
                      : `ปัจจุบันมีประวัติการขายอยู่ในระบบ ${totalSalesCount} รายการ`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {seedSalesCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearSeedSales}
                  disabled={clearingSeed}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="ลบเฉพาะรายการตัวอย่าง 81 รายการออก"
                >
                  {clearingSeed ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>ล้างยอดขายตัวอย่าง ({seedSalesCount} รายการ)</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAllSales}
                disabled={clearingSeed}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="ล้างประวัติการขายทั้งหมดเพื่อเริ่มต้นใหม่ 100%"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างยอดขายทั้งหมด</span>
              </button>
            </div>
          </div>
        )}

        {/* Expected Column Format Info Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 dark:text-blue-200">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span>
              {activeTab === 'products'
                ? 'คอลัมน์ที่ระบบรองรับ (ไฟล์สินค้าและสต็อก):'
                : 'คอลัมน์ที่ระบบรองรับ (ไฟล์ยอดขายย้อนหลัง):'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {activeTab === 'products' ? (
              <>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">Sku</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700 font-bold">ชื่อสินค้า *</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ขนาด</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">เบส</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">เบอร์สี</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ราคา</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700 font-bold">สต็อก</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ฟิล์มสี</span>
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700 font-bold">วันที่ *</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700 font-bold">ชื่อสินค้า *</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ขนาด</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">เบส</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ราคาสินค้า/หน่วย</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">รหัสสี</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ราคาแม่สี</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700 font-bold">จำนวน</span>
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] rounded-lg border border-blue-200/60 dark:border-blue-700">ยอดรวม</span>
              </>
            )}
          </div>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-7 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/60 mx-auto flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {file ? file.name : `ลากไฟล์ Excel (${activeTab === 'products' ? 'สินค้า/สต็อก' : 'ยอดขายย้อนหลัง'}) มาวางที่นี่`}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              รองรับไฟล์ .xlsx, .xls และ .csv (ขนาดไม่เกิน 20MB)
            </p>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            id="excel-file-upload-input"
            className="hidden"
          />
          <label
            htmlFor="excel-file-upload-input"
            className="inline-block px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            เลือกไฟล์จากอุปกรณ์
          </label>
        </div>

        {/* Preview of Loaded Data */}
        {file && previewData.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                ตัวอย่างข้อมูล 5 แถวแรกจากไฟล์ ({headers.length} คอลัมน์):
              </span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                พร้อมนำเข้า
              </span>
            </div>
            <div className="overflow-x-auto max-h-40 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold sticky top-0">
                  <tr>
                    {headers.slice(0, 7).map((h, i) => (
                      <th key={i} className="px-2.5 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewData.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      {headers.slice(0, 7).map((h, cIdx) => (
                        <td key={cIdx} className="px-2.5 py-1.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {String(row[h] !== undefined ? row[h] : '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result notification */}
        {resultMsg && (
          <div
            className={`p-4 rounded-2xl text-xs space-y-1 ${
              resultMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              {resultMsg.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              )}
              <span>{resultMsg.text}</span>
            </div>
            {resultMsg.details && (
              <p className="text-[11px] opacity-90 pl-6">{resultMsg.details}</p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
          <button
            type="button"
            onClick={activeTab === 'products' ? processProductImport : processSalesImport}
            disabled={!file || importing}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>
              {importing
                ? 'กำลังนำเข้าและประมวลผล...'
                : activeTab === 'products'
                ? importMode === 'replace'
                  ? 'ยืนยันแทนที่สินค้า & สต็อกทั้งหมด'
                  : 'ยืนยันนำเข้าสินค้า & สต็อก'
                : 'ยืนยันนำเข้ายอดขายย้อนหลัง'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

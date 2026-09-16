import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Product, SaleEntry } from '../types';

export interface ParsedCatalogResult {
  products: Partial<Product>[];
  totalRows: number;
  validRows: number;
  skippedRows: number;
  error?: string;
}

export function parseExcelCatalog(data: ArrayBuffer): ParsedCatalogResult {
  try {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { products: [], totalRows: 0, validRows: 0, skippedRows: 0, error: 'ไม่พบ Sheet ในไฟล์ Excel' };
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (!rawRows || rawRows.length < 2) {
      return { products: [], totalRows: 0, validRows: 0, skippedRows: 0, error: 'ข้อมูลในไฟล์ Excel ว่างเปล่า' };
    }

    const headers = rawRows[0].map((h: any) => String(h || '').trim().toLowerCase());
    const findCol = (keywords: string[]): number => {
      return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
    };

    const skuCol = findCol(['sku', 'รหัส', 'บาร์โค้ด', 'barcode']);
    const nameCol = findCol(['name', 'ชื่อ', 'สินค้า', 'รายการ']);
    const sizeCol = findCol(['size', 'ขนาด', 'บรรจุ']);
    const baseCol = findCol(['base', 'เบส', 'เฉด']);
    const priceCol = findCol(['price', 'ราคา', 'price_std']);
    const initCol = findCol(['init', 'ยอดยกมา', 'ตั้งต้น']);
    const inflowCol = findCol(['inflow', 'รับเข้า', 'เข้า']);
    const soldCol = findCol(['sold', 'ขาย', 'ยอดขาย']);
    const remainCol = findCol(['remain', 'คงเหลือ', 'เหลือ']);

    if (nameCol === -1) {
      return { products: [], totalRows: rawRows.length - 1, validRows: 0, skippedRows: rawRows.length - 1, error: 'ไม่พบคอลัมน์ชื่อสินค้าใน Excel' };
    }

    const products: Partial<Product>[] = [];
    const totalDataRows = rawRows.length - 1;
    let skippedCount = 0;

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || !row[nameCol]) {
        skippedCount++;
        continue;
      }
      const name = String(row[nameCol] || '').trim();
      if (!name) {
        skippedCount++;
        continue;
      }

      const sku = skuCol >= 0 ? String(row[skuCol] || '').trim() : '';
      const size = sizeCol >= 0 ? String(row[sizeCol] || '').trim() : '';
      const base = baseCol >= 0 ? String(row[baseCol] || '').trim() : '';
      const rawPrice = priceCol >= 0 ? Number(row[priceCol]) : 0;
      const price = isNaN(rawPrice) || rawPrice < 0 ? 0 : rawPrice;
      const init = initCol >= 0 ? Number(row[initCol]) || 0 : 0;
      const inflow = inflowCol >= 0 ? Number(row[inflowCol]) || 0 : 0;
      const sold = soldCol >= 0 ? Number(row[soldCol]) || 0 : 0;
      const remain = remainCol >= 0 ? Number(row[remainCol]) || 0 : init + inflow - sold;

      products.push({
        sku,
        name,
        size,
        base,
        price,
        init,
        inflow,
        sold,
        remain,
      });
    }

    return {
      products,
      totalRows: totalDataRows,
      validRows: products.length,
      skippedRows: skippedCount,
    };
  } catch (e: any) {
    return { products: [], totalRows: 0, validRows: 0, skippedRows: 0, error: e.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel' };
  }
}

export function exportProductsToExcel(products: Product[], filename = 'nippon-stock.xlsx'): void {
  const data = products.map((p) => ({
    รหัส_SKU: p.sku,
    ชื่อสินค้า: p.name,
    ขนาด: p.size,
    เบส: p.base,
    ราคาขาย: p.price,
    ยอดยกมา: p.init,
    รับเข้า: p.inflow,
    ขายแล้ว: p.sold,
    คงเหลือ: p.remain,
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');
  XLSX.writeFile(workbook, filename);
}

export function exportSalesToExcel(sales: SaleEntry[], filename = 'nippon-sales.xlsx'): void {
  const data = sales.map((s) => ({
    วันที่: s.date,
    เลขที่บิล: s.billId || s.id,
    ชื่อสินค้า: s.name,
    ขนาด: s.size,
    เบส: s.base,
    ฟิล์มสี: s.filmColor || '',
    รหัสเฉดสี: s.colorCode,
    ราคามาตรฐาน: s.price,
    ค่าแม่สี: s.tintPrice,
    จำนวน: s.qty,
    ยอดรวม: s.total,
    ชื่อลูกค้า: s.customerName || '',
    เบอร์โทร: s.customerPhone || '',
  }));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
  XLSX.writeFile(workbook, filename);
}

export async function captureElementAsImage(element: HTMLElement): Promise<string> {
  try {
    return await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
  } catch (err) {
    console.warn('Initial capture attempt encountered an issue, retrying with skipFonts', err);
    return await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: true,
    });
  }
}

export async function exportElementToPdf(element: HTMLElement, filename = 'report.pdf'): Promise<void> {
  const imgData = await captureElementAsImage(element);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(filename);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

export function generateOrderText(data: {
  storeName: string;
  customerName?: string;
  items: { name: string; size: string; qty: number }[];
}): string {
  const dateStr = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  let lines = [
    `📦 [ใบสั่งสินค้าสีนิปปอนเพนต์]`,
    `📅 วันที่: ${dateStr}`,
    `🏬 ร้านค้า/สาขา: ${data.storeName}`,
  ];

  if (data.customerName) {
    lines.push(`👤 ผู้สั่ง/ลูกค้า: ${data.customerName}`);
  }

  lines.push(`---------------------------`);
  lines.push(`📋 รายการสินค้า:`);

  data.items.forEach((it, idx) => {
    if (it.name.trim()) {
      lines.push(`${idx + 1}. ${it.name} [${it.size}] x ${it.qty} ถัง`);
    }
  });

  lines.push(`---------------------------`);
  lines.push(`รบกวนตรวจสอบและยืนยันการจัดส่ง ขอบคุณครับ/ค่ะ 🙏`);

  return lines.join('\n');
}

export function generateDailyBriefText(data: {
  date: string;
  todayTotal: number;
  todaySalesCount: number;
  soFarTotal: number;
  target: number;
  paceStatus: string;
  gap: number;
}): string {
  const pct = data.target > 0 ? ((data.soFarTotal / data.target) * 100).toFixed(1) : '0';
  return [
    `📊 [รายงานยอดขายประจำวันสีนิปปอนเพนต์]`,
    `📅 ประจำวันที่: ${data.date}`,
    `---------------------------`,
    `💰 ยอดขายวันนี้: ${Number(data.todayTotal).toLocaleString('th-TH')} บาท (${data.todaySalesCount} รายการ)`,
    `📈 ยอดขายสะสมเดือนนี้: ${Number(data.soFarTotal).toLocaleString('th-TH')} บาท`,
    `🎯 เป้าหมายเดือนนี้: ${Number(data.target).toLocaleString('th-TH')} บาท`,
    `📊 บรรลุแล้ว: ${pct}%`,
    `📌 สถานะความเร็วการขาย: ${data.paceStatus}`,
    `⏳ ยอดที่ต้องทำเพิ่ม: ${Number(data.gap).toLocaleString('th-TH')} บาท`,
    `---------------------------`,
    `นิปปอนเพนต์ ยอดเยี่ยมไปด้วยกัน 💪🚀`,
  ].join('\n');
}

export function generateWeeklyReviewText(data: {
  fromDate: string;
  toDate: string;
  totalSales: number;
  orderCount: number;
  topProducts: { name: string; total: number; qty: number }[];
}): string {
  const lines = [
    `📈 [สรุปยอดขายสัปดาห์ - Weekly Review]`,
    `🗓️ ช่วงวันที่: ${data.fromDate} ถึง ${data.toDate}`,
    `---------------------------`,
    `💵 ยอดขายรวมสัปดาห์นี้: ${Number(data.totalSales).toLocaleString('th-TH')} บาท`,
    `📦 จำนวนออเดอร์/รายการ: ${data.orderCount} รายการ`,
    `---------------------------`,
    `🏆 Top 3 สินค้าขายดีในสัปดาห์:`,
  ];

  data.topProducts.forEach((p, idx) => {
    lines.push(
      `${idx + 1}. ${p.name} - ${Number(p.total).toLocaleString('th-TH')} บ. (${p.qty} ชิ้น)`
    );
  });

  lines.push(`---------------------------`);
  lines.push(`ลุยต่อสัปดาห์ถัดไปเพื่อพิชิตเป้าหมาย! 🎨🔥`);
  return lines.join('\n');
}

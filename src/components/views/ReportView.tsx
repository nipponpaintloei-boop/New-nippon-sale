import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Download,
  Save,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { MKS_BRANDS } from '../../data/constants';
import {
  computeMksDailySummary,
  computeMksWeeklySummary,
} from '../../services/mksService';
import { fmt, todayISO } from '../../services/calculations';
import { captureElementAsImage, exportElementToPdf } from '../../services/exportService';

export const ReportView: React.FC = () => {
  const { mksDayHistory, mksWeekHistory, saveMksDay, saveMksWeek } = useAppState();
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');
  const [dailyDate, setDailyDate] = useState<string>(todayISO());

  // Week range
  const [weekFrom, setWeekFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [weekTo, setWeekTo] = useState<string>(todayISO());

  const [dailyRows, setDailyRows] = useState<Record<string, any>>({});
  const [weeklyRows, setWeeklyRows] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const reportCaptureRef = useRef<HTMLDivElement>(null);

  // Sync daily rows from history when date changes
  useMemo(() => {
    const saved = mksDayHistory[dailyDate]?.rows || {};
    const initialized: Record<string, any> = {};
    MKS_BRANDS.forEach((b) => {
      initialized[b.key] = saved[b.key] || { pc: b.pc || 0, sales: 0, note: '' };
    });
    setDailyRows(initialized);
  }, [dailyDate, mksDayHistory]);

  // Sync weekly rows from history when range changes
  useMemo(() => {
    const key = `${weekFrom}_${weekTo}`;
    const saved = mksWeekHistory[key]?.rows || {};
    const initialized: Record<string, any> = {};
    MKS_BRANDS.forEach((b) => {
      initialized[b.key] = saved[b.key] || {
        pcReg: b.pc || 0,
        pcPro: 0,
        target: b.target || 0,
        sales: 0,
        note: '',
      };
    });
    setWeeklyRows(initialized);
  }, [weekFrom, weekTo, mksWeekHistory]);

  // Summaries
  const dailySummary = useMemo(() => {
    return computeMksDailySummary(dailyRows);
  }, [dailyRows]);

  const weeklySummary = useMemo(() => {
    return computeMksWeeklySummary(weeklyRows);
  }, [weeklyRows]);

  const handleSave = async () => {
    if (mode === 'daily') {
      await saveMksDay(dailyDate, dailyRows);
      setSaveStatus('บันทึกข้อมูล MKS รายวันสำเร็จ');
    } else {
      await saveMksWeek(weekFrom, weekTo, weeklyRows);
      setSaveStatus('บันทึกข้อมูล MKS รายสัปดาห์สำเร็จ');
    }
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleCaptureImage = async () => {
    if (!reportCaptureRef.current || isCapturing) return;
    setIsCapturing(true);
    setSaveStatus('');
    try {
      const dataUrl = await captureElementAsImage(reportCaptureRef.current);
      setPreviewImage(dataUrl);
    } catch (e) {
      console.error('Capture failed:', e);
      setSaveStatus('สร้างภาพรายงานไม่สำเร็จ');
      setTimeout(() => setSaveStatus(''), 4000);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportCaptureRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setSaveStatus('');
    try {
      await exportElementToPdf(
        reportCaptureRef.current,
        `mks-report-${mode === 'daily' ? dailyDate : `${weekFrom}_${weekTo}`}.pdf`
      );
      setSaveStatus('ส่งออกรายงาน PDF เรียบร้อย');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      console.error('Export PDF failed:', e);
      setSaveStatus('เกิดข้อผิดพลาดในการส่งออก PDF');
      setTimeout(() => setSaveStatus(''), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Market Share Intelligence</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            รายงานส่วนแบ่งตลาด MKS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เปรียบเทียบยอดขายกับคู่แข่ง และแคปภาพส่งเข้ากลุ่ม LINE ทันที
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            onClick={() => setMode('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'daily'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            MKS รายวัน
          </button>
          <button
            onClick={() => setMode('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'weekly'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            MKS รายสัปดาห์
          </button>
        </div>
      </div>

      {/* Date controls & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {mode === 'daily' ? (
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">วันที่:</label>
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">ช่วงวันที่:</label>
            <input
              type="date"
              value={weekFrom}
              onChange={(e) => setWeekFrom(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
            <span className="text-xs text-slate-400 font-bold">ถึง</span>
            <input
              type="date"
              value={weekTo}
              onChange={(e) => setWeekTo(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>บันทึก</span>
          </button>
          <button
            onClick={handleCaptureImage}
            disabled={isCapturing}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isCapturing ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 text-blue-500" />
            )}
            <span>{isCapturing ? 'กำลังสร้างรูป...' : 'แคปภาพส่ง LINE'}</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-emerald-500" />
            )}
            <span>{isExportingPdf ? 'กำลังส่งออก PDF...' : 'ส่งออก PDF'}</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <p className="text-xs font-bold text-emerald-600 text-center animate-pulse">{saveStatus}</p>
      )}

      {/* Printable / Capturable Report Container */}
      <div
        ref={reportCaptureRef}
        className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
      >
        <div className="text-center pb-6 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="inline-block px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 font-bold text-xs uppercase tracking-wider mb-2">
            NIPPON PAINT - MARKET SHARE INTELLIGENCE
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            รายงานเปรียบเทียบส่วนแบ่งตลาด (MKS REPORT)
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {mode === 'daily'
              ? `ประจำวันที่ ${dailyDate}`
              : `ประจำสัปดาห์ วันที่ ${weekFrom} ถึง ${weekTo}`}
          </p>
        </div>

        {mode === 'daily' ? (
          /* Daily Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4">แบรนด์</th>
                  <th className="py-3 px-4 text-center">จน. PC</th>
                  <th className="py-3 px-4 text-right">ยอดขาย (บาท)</th>
                  <th className="py-3 px-4 text-center">แชร์ MKS (%)</th>
                  <th className="py-3 px-4">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {dailySummary.rows.map((r) => {
                  const isUs = r.brand.us;
                  return (
                    <tr
                      key={r.brand.key}
                      className={
                        isUs
                          ? 'bg-red-50/70 dark:bg-red-950/30 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-3 px-4 text-slate-900 dark:text-white flex items-center gap-2.5">
                        {isUs ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-300 flex-shrink-0"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0"></span>
                        )}
                        <span className={isUs ? 'text-red-700 dark:text-red-300 font-black text-[13px]' : ''}>
                          {r.brand.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={dailyRows[r.brand.key]?.pc ?? r.pc}
                          onChange={(e) =>
                            setDailyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                pc: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-16 text-center px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={dailyRows[r.brand.key]?.sales ?? r.sales}
                          onChange={(e) =>
                            setDailyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                sales: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-32 text-right px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-slate-800 dark:text-slate-200">
                        {r.sharePct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={dailyRows[r.brand.key]?.note ?? ''}
                          onChange={(e) =>
                            setDailyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                note: e.target.value,
                              },
                            }))
                          }
                          placeholder="หมายเหตุ..."
                          className="w-full px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white">
                  <td className="py-4 px-4 font-black">รวมทั้งหมด</td>
                  <td className="py-4 px-4 text-center font-mono text-sm">{dailySummary.totalPc} คน</td>
                  <td className="py-4 px-4 text-right font-mono text-sm text-red-600 dark:text-red-400">
                    {fmt(dailySummary.totalSales)} บ.
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-sm">100.0%</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* Weekly Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4">แบรนด์</th>
                  <th className="py-3 px-4 text-center">PC ประจำ</th>
                  <th className="py-3 px-4 text-center">PC เสริม</th>
                  <th className="py-3 px-4 text-right">เป้าหมาย</th>
                  <th className="py-3 px-4 text-right">ยอดขายจริง</th>
                  <th className="py-3 px-4 text-center">% Ach</th>
                  <th className="py-3 px-4 text-center">MKS (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {weeklySummary.rows.map((r) => {
                  const isUs = r.brand.us;
                  return (
                    <tr
                      key={r.brand.key}
                      className={
                        isUs
                          ? 'bg-red-50/70 dark:bg-red-950/30 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="py-3 px-4 text-slate-900 dark:text-white flex items-center gap-2">
                        {isUs ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-300 flex-shrink-0"></span>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0"></span>
                        )}
                        <span className={isUs ? 'text-red-700 dark:text-red-300 font-black' : ''}>
                          {r.brand.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={weeklyRows[r.brand.key]?.pcReg ?? r.pcReg}
                          onChange={(e) =>
                            setWeeklyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                pcReg: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-14 text-center px-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min="0"
                          value={weeklyRows[r.brand.key]?.pcPro ?? r.pcPro}
                          onChange={(e) =>
                            setWeeklyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                pcPro: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-14 text-center px-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={weeklyRows[r.brand.key]?.target ?? r.target}
                          onChange={(e) =>
                            setWeeklyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                target: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-28 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={weeklyRows[r.brand.key]?.sales ?? r.sales}
                          onChange={(e) =>
                            setWeeklyRows((prev) => ({
                              ...prev,
                              [r.brand.key]: {
                                ...(prev[r.brand.key] || {}),
                                sales: Number(e.target.value) || 0,
                              },
                            }))
                          }
                          className="w-28 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.achPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-white">
                        {r.sharePct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white">
                  <td className="py-4 px-4 font-black">รวมทั้งหมด</td>
                  <td className="py-4 px-4 text-center font-mono">{weeklySummary.totalPcReg}</td>
                  <td className="py-4 px-4 text-center font-mono">{weeklySummary.totalPcPro}</td>
                  <td className="py-4 px-4 text-right font-mono">{fmt(weeklySummary.totalTarget)} บ.</td>
                  <td className="py-4 px-4 text-right font-mono text-red-600 dark:text-red-400">
                    {fmt(weeklySummary.totalSales)} บ.
                  </td>
                  <td className="py-4 px-4 text-center font-mono">
                    {weeklySummary.totalTarget > 0
                      ? ((weeklySummary.totalSales / weeklySummary.totalTarget) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </td>
                  <td className="py-4 px-4 text-center font-mono">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <span>ภาพสรุปรายงาน MKS (พร้อมแชร์ LINE ทันที)</span>
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 my-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950/40 p-2">
              <img src={previewImage} alt="MKS Report" className="w-full rounded-xl shadow-sm" />
            </div>
            <div className="flex items-center justify-between gap-3 mt-4">
              <p className="text-[11px] text-slate-500">
                สามารถคลิกขวาคัดลอกรูปภาพเพื่อวางใน LINE ได้ทันที
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  download={`mks-report-${mode === 'daily' ? dailyDate : `${weekFrom}_${weekTo}`}.png`}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>บันทึกไฟล์ (.PNG)</span>
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

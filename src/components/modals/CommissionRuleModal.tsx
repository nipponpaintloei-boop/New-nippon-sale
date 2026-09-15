import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sliders,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Save,
  X,
  Sparkles,
  Info,
  Layers,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import {
  DEFAULT_COMMISSION_TIERS,
  PRESET_PERCENTAGE_TIERS,
  PRESET_SIMPLE_TIERS,
} from '../../data/constants';
import { CommissionRewardType, CommissionTierRule } from '../../types';
import { fmt, thaiMonthYear } from '../../services/calculations';
import { DEFAULT_TARGET } from '../../data/seedData';

interface CommissionRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommissionRuleModal: React.FC<CommissionRuleModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, sales, activeMonth } = useAppState();

  const target = settings?.targets?.[activeMonth] || DEFAULT_TARGET;
  const pcCount = settings?.pcCount?.[activeMonth] || 1;

  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(activeMonth));
  }, [sales, activeMonth]);

  const soFarTotal = useMemo(() => {
    return monthSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  }, [monthSales]);

  const currentPct = target > 0 ? (soFarTotal / target) * 100 : 0;

  // Working state for tiers
  const [tiers, setTiers] = useState<CommissionTierRule[]>(() => {
    if (settings?.commissionTiers && settings.commissionTiers.length > 0) {
      return settings.commissionTiers;
    }
    return DEFAULT_COMMISSION_TIERS;
  });

  // Add / Edit Tier Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  const [formMinPct, setFormMinPct] = useState<number>(80);
  const [formRewardType, setFormRewardType] = useState<CommissionRewardType>('fixed_amount');
  const [formRewardValue, setFormRewardValue] = useState<number>(6000);
  const [formLabel, setFormLabel] = useState<string>('');
  const [formDesc, setFormDesc] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  if (!isOpen) return null;

  // Sorted active tiers for simulation
  const sortedActiveTiers = [...tiers]
    .filter((t) => t.enabled !== false)
    .sort((a, b) => a.minPct - b.minPct);

  // Determine which tier qualifies right now
  let matchedTier: CommissionTierRule | undefined = undefined;
  let nextTier: CommissionTierRule | undefined = undefined;

  for (let i = 0; i < sortedActiveTiers.length; i++) {
    const t = sortedActiveTiers[i];
    if (currentPct >= t.minPct) {
      matchedTier = t;
      nextTier = sortedActiveTiers[i + 1] || undefined;
    } else {
      if (!matchedTier && !nextTier) {
        nextTier = t;
      }
      break;
    }
  }

  // Calculate current commission amount
  let currentEarned = 0;
  if (matchedTier) {
    if (matchedTier.rewardType === 'fixed_amount') {
      currentEarned = matchedTier.rewardValue;
    } else {
      currentEarned = Math.round((soFarTotal * matchedTier.rewardValue) / 100);
    }
  }

  // Next tier gap
  let gapSales = 0;
  let gapPct = 0;
  if (nextTier) {
    const needed = (nextTier.minPct / 100) * target;
    gapSales = Math.max(0, Math.round(needed - soFarTotal));
    gapPct = Math.max(0, Number((nextTier.minPct - currentPct).toFixed(1)));
  }

  // Open Form to Add
  const handleOpenAddForm = () => {
    setEditingTierId(null);
    setFormMinPct(80);
    setFormRewardType('fixed_amount');
    setFormRewardValue(6000);
    setFormLabel('ยอดขาย 80% (6,000 บาท)');
    setFormDesc('เมื่อขายได้ 80% ของเป้า ได้รับคอมมิชชั่น 6,000 บาท');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEditForm = (tier: CommissionTierRule) => {
    setEditingTierId(tier.id || null);
    setFormMinPct(tier.minPct);
    setFormRewardType(tier.rewardType);
    setFormRewardValue(tier.rewardValue);
    setFormLabel(tier.label || '');
    setFormDesc(tier.desc || '');
    setFormError('');
    setIsFormOpen(true);
  };

  // Save Tier from Form
  const handleSaveTierForm = () => {
    if (formMinPct <= 0 || formMinPct > 500) {
      setFormError('กรุณาระบุเปอร์เซ็นต์เป้าหมายขั้นต่ำระหว่าง 1% - 500%');
      return;
    }
    if (formRewardValue < 0) {
      setFormError('กรุณาระบุค่าผลตอบแทนที่ถูกต้อง (ไม่ติดลบ)');
      return;
    }

    const defaultLabel =
      formLabel.trim() ||
      (formRewardType === 'fixed_amount'
        ? `ยอดขาย ≥ ${formMinPct}% (${fmt(formRewardValue)} บ.)`
        : `ยอดขาย ≥ ${formMinPct}% (อัตรา ${formRewardValue}%)`);

    const defaultDesc =
      formDesc.trim() ||
      (formRewardType === 'fixed_amount'
        ? `เมื่อทำยอดขายได้ ${formMinPct}% ของเป้า ได้รับคอมมิชชั่น ${fmt(formRewardValue)} บาท`
        : `เมื่อทำยอดขายได้ ${formMinPct}% ของเป้า คิดคอมมิชชั่น ${formRewardValue}% ของยอดขายรวม`);

    if (editingTierId) {
      // Update existing
      setTiers((prev) =>
        prev.map((t) =>
          t.id === editingTierId
            ? {
                ...t,
                minPct: formMinPct,
                rewardType: formRewardType,
                rewardValue: formRewardValue,
                label: defaultLabel,
                desc: defaultDesc,
              }
            : t
        )
      );
    } else {
      // Create new tier
      const newId = `tier-${Date.now()}`;
      const newTier: CommissionTierRule = {
        id: newId,
        minPct: formMinPct,
        rewardType: formRewardType,
        rewardValue: formRewardValue,
        label: defaultLabel,
        desc: defaultDesc,
        enabled: true,
      };
      setTiers((prev) => [...prev, newTier]);
    }

    setIsFormOpen(false);
    setEditingTierId(null);
  };

  // Delete Tier
  const handleDeleteTier = (id?: string) => {
    if (!id) return;
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle Enabled
  const handleToggleTier = (id?: string) => {
    if (!id) return;
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: t.enabled === false ? true : false } : t))
    );
  };

  // Quick Presets
  const handleApplyPreset = (presetKey: 'fixed' | 'percentage' | 'simple') => {
    if (presetKey === 'fixed') {
      setTiers(DEFAULT_COMMISSION_TIERS);
    } else if (presetKey === 'percentage') {
      setTiers(PRESET_PERCENTAGE_TIERS);
    } else if (presetKey === 'simple') {
      setTiers(PRESET_SIMPLE_TIERS);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm('คุณต้องการรีเซ็ตเกณฑ์ขั้นบันไดคอมมิชชั่นกลับเป็นค่ามาตรฐาน Nippon Paint หรือไม่?')) {
      setTiers(DEFAULT_COMMISSION_TIERS);
    }
  };

  // Save changes to Global Settings
  const handleSaveAll = () => {
    // Sort tiers before saving
    const sorted = [...tiers].sort((a, b) => a.minPct - b.minPct);
    updateSettings({ commissionTiers: sorted });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-red-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  ตั้งค่าเกณฑ์คอมมิชชั่นขั้นบันได (Commission Tiers)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  ปรับแต่งได้อิสระ
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนด % เป้าหมายขั้นต่ำ และผลตอบแทน (เงินบาทคงที่ หรือ % ของยอดขาย)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Live Month Progress & Simulation Header Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-50 via-rose-50 to-amber-50 dark:from-red-950/40 dark:via-rose-950/30 dark:to-amber-950/30 border border-red-200/80 dark:border-red-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>จำลองผลลัพธ์เดือน {thaiMonthYear(activeMonth)}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                  ยอดขายจริงสะสม:{' '}
                  <span className="font-mono font-black text-red-600 dark:text-red-400">
                    {fmt(soFarTotal)}
                  </span>{' '}
                  / เป้าหมาย{' '}
                  <span className="font-mono font-black">{fmt(target)}</span> บาท (
                  <b className="font-mono">{currentPct.toFixed(1)}%</b>)
                </div>
              </div>

              <div className="text-left sm:text-right bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-red-100 dark:border-slate-800 shadow-sm shrink-0">
                <span className="text-[11px] text-slate-500 block">คอมมิชชั่นตามเกณฑ์ปัจจุบัน</span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {currentEarned > 0 ? `+${fmt(currentEarned)} บ.` : '0 บ.'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {matchedTier ? matchedTier.label : 'ยังไม่ถึงเกณฑ์ขั้นต่ำ'}
                </span>
              </div>
            </div>

            {/* Next Tier Progress Indicator */}
            {nextTier && (
              <div className="mt-3 pt-3 border-t border-red-200/60 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-amber-500" />
                  <span>
                    ขั้นถัดไป: <b>{nextTier.label}</b> (
                    {nextTier.rewardType === 'fixed_amount'
                      ? `${fmt(nextTier.rewardValue)} บาท`
                      : `${nextTier.rewardValue}%`}
                    )
                  </span>
                </div>
                <div className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                  {gapSales > 0 ? `ขาดอีก ${fmt(gapSales)} บ. (${gapPct}%)` : 'ปลดล็อกแล้ว!'}
                </div>
              </div>
            )}
          </div>

          {/* Quick Presets Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                เลือกรูปแบบสำเร็จรูป (Presets)
              </span>
              <button
                onClick={handleResetToDefault}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>คืนค่าเริ่มต้น</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('fixed')}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-600 bg-slate-50/50 dark:bg-slate-800/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-600">
                    มาตรฐาน Nippon Paint
                  </span>
                  <Award className="w-3.5 h-3.5 text-red-500" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  ยอดเงินคงที่: 80% = 6,000 บ. จนถึง 130% = 16,750 บ.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('percentage')}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-slate-50/50 dark:bg-slate-800/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">
                    เกณฑ์แบบเปอร์เซ็นต์
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  คิด % จากยอดขายรวม: 80% = 0.5%, 100% = 1.5%, 120% = 2.0%
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('simple')}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 bg-slate-50/50 dark:bg-slate-800/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600">
                    แบบบันได 3 ขั้น
                  </span>
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  เรียบง่าย 3 ระดับ: 80% = 6,000 บ., 100% = 10,000 บ., 120% = 15,000 บ.
                </p>
              </button>
            </div>
          </div>

          {/* Action Header & Add Tier Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                รายการขั้นบันไดคอมมิชชั่น ({tiers.length} ขั้น)
              </h3>
              <span className="text-xs text-slate-400">
                (เรียงตาม % ยอดขายจากน้อยไปมากอัตโนมัติ)
              </span>
            </div>

            {!isFormOpen && (
              <button
                onClick={handleOpenAddForm}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มขั้นบันไดใหม่</span>
              </button>
            )}
          </div>

          {/* Inline Add / Edit Tier Form */}
          {isFormOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border-2 border-red-500/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingTierId ? 'แก้ไขขั้นบันไดคอมมิชชั่น' : 'สร้างขั้นบันไดคอมมิชชั่นใหม่'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ปิด
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Min Percentage % */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ยอดขายขั้นต่ำ (% ของเป้าหมาย) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      step="1"
                      value={formMinPct}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormMinPct(val);
                        if (!formLabel || formLabel.includes('%')) {
                          setFormLabel(
                            formRewardType === 'fixed_amount'
                              ? `ยอดขาย ${val}% (${fmt(formRewardValue)} บาท)`
                              : `ยอดขาย ${val}% (${formRewardValue}%)`
                          );
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="เช่น 80"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    คิดเป็นยอดขาย:{' '}
                    <b className="font-mono text-slate-600 dark:text-slate-300">
                      {fmt((formMinPct / 100) * target)}
                    </b>{' '}
                    บาท
                  </p>
                </div>

                {/* Reward Type Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    รูปแบบผลตอบแทน <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormRewardType('fixed_amount');
                        if (formRewardValue <= 10) setFormRewardValue(6000);
                        setFormLabel(`ยอดขาย ${formMinPct}% (${fmt(6000)} บาท)`);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        formRewardType === 'fixed_amount'
                          ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      🪙 ยอดเงินคงที่ (บาท)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormRewardType('percentage');
                        if (formRewardValue > 100) setFormRewardValue(1.5);
                        setFormLabel(`ยอดขาย ${formMinPct}% (อัตรา ${1.5}%)`);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                        formRewardType === 'percentage'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      📊 เปอร์เซ็นต์ (% ยอดขาย)
                    </button>
                  </div>
                </div>

                {/* Reward Value Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {formRewardType === 'fixed_amount'
                      ? 'จำนวนเงินคอมมิชชั่นที่ได้รับ (บาท)'
                      : 'อัตราเปอร์เซ็นต์คอมมิชชั่น (%)'}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={formRewardType === 'fixed_amount' ? '500' : '0.25'}
                      value={formRewardValue}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormRewardValue(val);
                        setFormLabel(
                          formRewardType === 'fixed_amount'
                            ? `ยอดขาย ${formMinPct}% (${fmt(val)} บาท)`
                            : `ยอดขาย ${formMinPct}% (อัตรา ${val}%)`
                        );
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder={formRewardType === 'fixed_amount' ? 'เช่น 6000' : 'เช่น 1.5'}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {formRewardType === 'fixed_amount' ? 'บาท' : '%'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formRewardType === 'fixed_amount'
                      ? `เช่น ยอดขายถึง ${formMinPct}% ได้รับเงินรางวัล ${fmt(formRewardValue)} บาท`
                      : `เช่น หากยอดขาย 380,000 บาท จะได้ค่าคอมประมาณ ${fmt((380000 * formRewardValue) / 100)} บาท`}
                  </p>
                </div>

                {/* Label / Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อกำกับขั้น (Label)
                  </label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    placeholder="เช่น ยอดขาย 80% (6,000 บาท)"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveTierForm}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-red-600/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกขั้นนี้</span>
                </button>
              </div>
            </div>
          )}

          {/* Tiers List */}
          <div className="space-y-2.5">
            {sortedActiveTiers.length === 0 && (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-400">ยังไม่มีขั้นบันไดคอมมิชชั่น</p>
                <button
                  onClick={() => handleApplyPreset('fixed')}
                  className="mt-2 text-xs font-bold text-red-600 hover:underline cursor-pointer"
                >
                  คลิกเพื่อโหลดเกณฑ์มาตรฐาน Nippon Paint
                </button>
              </div>
            )}

            {sortedActiveTiers.map((tier, idx) => {
              const isMatched = matchedTier?.id === tier.id;
              const isPassed = currentPct >= tier.minPct;
              const isNext = nextTier?.id === tier.id;

              return (
                <div
                  key={tier.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isMatched
                      ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800 shadow-sm'
                      : isPassed
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : isNext
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Status Circle */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isMatched
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400'
                          : isPassed
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tier.minPct}%
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {tier.label || `ยอดขาย ≥ ${tier.minPct}%`}
                        </span>

                        {isMatched && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            ขั้นปัจจุบัน
                          </span>
                        )}

                        {isNext && !isMatched && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            เป้าหมายขั้นถัดไป
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            tier.rewardType === 'fixed_amount'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {tier.rewardType === 'fixed_amount'
                            ? `ยอดคงที่ ${fmt(tier.rewardValue)} บาท`
                            : `อัตรา ${tier.rewardValue}% ของยอดขาย`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tier.desc || `ยอดขายตั้งแต่ ${fmt((tier.minPct / 100) * target)} บาทขึ้นไป`}
                      </p>
                    </div>
                  </div>

                  {/* Reward & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">ผลตอบแทน</span>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {tier.rewardType === 'fixed_amount'
                          ? `${fmt(tier.rewardValue)} บ.`
                          : `${tier.rewardValue}% (~${fmt((target * tier.rewardValue) / 100)} บ.)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(tier)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="แก้ไขขั้นนี้"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="ลบขั้นนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            * การเปลี่ยนแปลงเกณฑ์จะมีผลต่อการคำนวณคอมมิชชั่นและการแสดงผลทันที
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-red-600/20"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกเกณฑ์คอมมิชชั่น</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

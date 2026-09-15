import React, { useMemo } from 'react';
import {
  Award,
  Users,
  Layers,
  ChevronRight,
  TrendingUp,
  Target,
  Sparkles,
  DollarSign,
  Sliders,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import {
  computeCommissionPlan,
  fmt,
  thaiMonthYear,
} from '../../services/calculations';
import { DEFAULT_TARGET } from '../../data/seedData';
import { COMMISSION_TIERS, GALLON_TIERS } from '../../data/constants';

interface CommissionViewProps {
  onOpenTargetModal: () => void;
  onOpenGallonRuleModal: () => void;
  onOpenCommissionRuleModal: () => void;
}

export const CommissionView: React.FC<CommissionViewProps> = ({
  onOpenTargetModal,
  onOpenGallonRuleModal,
  onOpenCommissionRuleModal,
}) => {
  const { sales, settings, activeMonth } = useAppState();

  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(activeMonth));
  }, [sales, activeMonth]);

  const target = settings?.targets?.[activeMonth] || DEFAULT_TARGET;
  const pcCount = settings?.pcCount?.[activeMonth] || 1;

  const plan = useMemo(() => {
    return computeCommissionPlan(
      activeMonth,
      target,
      pcCount,
      monthSales,
      settings?.gallonRules,
      settings?.commissionTiers
    );
  }, [activeMonth, target, pcCount, monthSales, settings]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบคำนวณเงินรางวัลและค่าถัง</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            ผลตอบแทนและคอมมิชชั่น PC (Incentives)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ประจำเดือน {thaiMonthYear(activeMonth)} | แบ่งตามจำนวน PC {pcCount} คน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCommissionRuleModal}
            className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-red-200/60 dark:border-red-800/60"
          >
            <Award className="w-4 h-4 text-red-600" />
            <span>เกณฑ์คอมมิชชั่น</span>
          </button>
          <button
            onClick={onOpenTargetModal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Target className="w-4 h-4 text-emerald-500" />
            <span>ปรับเป้า & PC</span>
          </button>
          <button
            onClick={onOpenGallonRuleModal}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>เกณฑ์ค่าถัง</span>
          </button>
        </div>
      </div>

      {/* Hero 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Grand Incentives */}
        <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-6 shadow-lg shadow-red-600/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-red-200 uppercase tracking-wider">
            <span>ผลตอบแทนรวมทีม</span>
            <Award className="w-5 h-5 text-white/90" />
          </div>
          <div className="my-4">
            <div className="text-3xl lg:text-4xl font-black font-mono tracking-tight text-white">
              {fmt(plan.grandTotal)}{' '}
              <span className="text-sm font-semibold text-red-200">บาท</span>
            </div>
            <div className="text-xs text-red-100 mt-2">
              เฉลี่ยต่อคน ({pcCount} PC):{' '}
              <b className="font-mono font-black text-white text-sm">
                {fmt(plan.grandPerPerson)}
              </b>{' '}
              บาท
            </div>
          </div>
          <div className="pt-3 border-t border-white/20 text-[11px] text-red-100 flex items-center justify-between">
            <span>ขั้นบรรลุ: {plan.tierDesc}</span>
            <span>Ach: {plan.pct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Tier Rate Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>คอมมิชชั่นตามขั้น (% Ach)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="my-4">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {fmt(plan.tierAmount)}{' '}
              <span className="text-xs font-medium text-slate-400">บาท</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {plan.tierRewardType === 'fixed_amount' ? (
                <>
                  ผลตอบแทนตามเกณฑ์: <b className="font-mono text-emerald-600 font-bold">{fmt(plan.tierAmount)} บ.</b>{' '}
                  ({plan.tierDesc})
                </>
              ) : (
                <>
                  อัตราคอมมิชชั่น: <b className="font-mono text-emerald-600 font-bold">{plan.tierRate}%</b>{' '}
                  ({plan.tierDesc})
                </>
              )}
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {plan.nextTier ? `ขาดอีก ${fmt(plan.nextTierGapSales)} บ. ถึงขั้นถัดไป` : 'บรรลุขั้นสูงสุดแล้ว'}
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              ขายได้ {fmt(plan.soFarTotal)} บ.
            </span>
          </div>
        </div>

        {/* Gallon Incentives Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>เงินรางวัลพิเศษค่าถัง</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="my-4">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {fmt(plan.gallonTotal)}{' '}
              <span className="text-xs font-medium text-slate-400">บาท</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              จำนวนขายที่ได้สิทธิ์: <b className="font-mono text-amber-600">{plan.gallonEligibleQty}</b>{' '}
              ถัง
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>เฉลี่ยต่อคน:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {fmt(plan.gallonTotal / Math.max(1, pcCount))} บ.
            </span>
          </div>
        </div>
      </div>

      {/* Tier Table & Details Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Tiers Schedule */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ตารางขั้นคอมมิชชั่น (Commission Tiers)
              </h3>
              <span className="text-[11px] text-slate-400">
                ปัจจุบัน {plan.pct.toFixed(1)}% | เป้า {fmt(target)} บาท
              </span>
            </div>
            <button
              onClick={onOpenCommissionRuleModal}
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>ปรับแต่งเกณฑ์</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {plan.activeCommissionTiers.map((tier, idx) => {
              const isCurrent = plan.currentMatchedTier?.id === tier.id;
              const isPassed = plan.pct >= tier.minPct;
              return (
                <div
                  key={tier.id || idx}
                  className={`flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all ${
                    isCurrent
                      ? 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 shadow-xs'
                      : isPassed
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    ) : (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      />
                    )}
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {tier.label || `ยอดขาย ≥ ${tier.minPct}%`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {tier.desc || `ยอดขายตั้งแต่ ${fmt((tier.minPct / 100) * target)} บาทขึ้นไป`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {tier.rewardType === 'fixed_amount'
                        ? `${fmt(tier.rewardValue)} บ.`
                        : `${tier.rewardValue}%`}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                        ขั้นปัจจุบัน
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gallon Tiers & Custom Rules Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                เกณฑ์เงินรางวัลค่าถัง (Gallon Incentives)
              </h3>
              <p className="text-[11px] text-slate-400">
                สรุปยอดขายและการคำนวณตามเงื่อนไขในเดือนนี้
              </p>
            </div>
            <button
              onClick={onOpenGallonRuleModal}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>ปรับแต่งเกณฑ์</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {plan.gallonRuleResults && plan.gallonRuleResults.length > 0 ? (
              plan.gallonRuleResults.map((item, idx) => {
                const rule = item.rule;
                const isEarned = item.earnedAmount > 0;
                return (
                  <div
                    key={rule.id || idx}
                    className={`p-3.5 rounded-2xl border transition-all text-xs ${
                      isEarned
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rule.name || rule.label}
                          </span>
                          {rule.size && rule.size !== 'ALL' && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200">
                              {rule.size}
                            </span>
                          )}
                          {rule.conditionType === 'bundle' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                              ครบชุดละ {rule.bundleSize} ถัง
                            </span>
                          )}
                          {rule.conditionType === 'revenue_threshold' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              ยอดถึง {fmt(rule.minRevenueRequired || 0)} บ.
                            </span>
                          )}
                          {rule.conditionType === 'min_qty_per_unit' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              ขั้นต่ำ {rule.minQtyRequired} ถัง
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {item.details || rule.desc}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`font-mono font-black text-sm ${
                            isEarned ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                          }`}
                        >
                          {isEarned ? `+${fmt(item.earnedAmount)} บ.` : '0 บ.'}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.matchedQty > 0 ? `ขายได้ ${item.matchedQty} ถัง` : 'ยังไม่มียอด'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar if not yet reached */}
                    {!isEarned && item.rule.conditionType && item.rule.conditionType !== 'per_unit' && item.rule.conditionType !== 'size_standard' && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{item.progressText}</span>
                        <span className="font-mono text-slate-400 font-bold">
                          {item.progressPct}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">ไม่มีเกณฑ์ค่าถังที่เปิดใช้งาน</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

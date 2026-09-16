import {
  COMMISSION_MAIN_TABLE,
  COMMISSION_SPECIAL_TABLE,
  COMMISSION_PERHEAD_TABLE,
  DEFAULT_COMMISSION_TIERS,
  GALLON_TIERS,
  THAI_MONTHS,
} from '../data/constants';
import {
  CommissionBreakdown,
  CommissionTierRule,
  GallonIncentiveResult,
  GallonIncentiveRule,
  RuleEvaluationResult,
  SaleEntry,
} from '../types';

export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function monthKey(dateStr: string): string {
  if (!dateStr) return todayISO().slice(0, 7);
  return dateStr.slice(0, 7);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function daysBetween(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.round((t2 - t1) / 86400000);
}

export function daysBetweenInclusive(d1: string, d2: string): number {
  return Math.abs(daysBetween(d1, d2)) + 1;
}

export function thaiMonthName(mKey: string): string {
  const parts = mKey.split('-');
  const m = parseInt(parts[1], 10);
  return THAI_MONTHS[m - 1] || mKey;
}

export function buddhistYear(year: number): number {
  return year + 543;
}

export function thaiFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  return `${d} ${THAI_MONTHS[m - 1]} ${buddhistYear(y)}`;
}

export function thaiMonthYear(mKey: string): string {
  const parts = mKey.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return `${THAI_MONTHS[m - 1]} ${buddhistYear(y)}`;
}

export function fmt(n: number): string {
  return (Number(n) || 0).toLocaleString('th-TH', { maximumFractionDigits: 0 });
}

export function fmtDec(n: number): string {
  return (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function lookupTiered(table: { pct: number; amt: number }[], pct: number): number {
  let amt = 0;
  for (const t of table) {
    if (pct >= t.pct) amt = t.amt;
  }
  return amt;
}

export function commissionInSpecialBand(target: number): boolean {
  return target >= 200000 && target <= 400000;
}

export function calcMainCommission(pct: number): number {
  return pct >= 80 ? lookupTiered(COMMISSION_MAIN_TABLE, pct) : 0;
}

export function calcSpecialCommission(pct: number, target: number): number {
  if (!commissionInSpecialBand(target)) return 0;
  return pct >= 80 ? lookupTiered(COMMISSION_SPECIAL_TABLE, pct) : 0;
}

export function calcPerHeadCommission(sales: number, headcount: number, pctReached: boolean): number {
  if (!pctReached) return 0;
  const hc = headcount > 0 ? headcount : 1;
  const perPerson = sales / hc;
  for (const t of COMMISSION_PERHEAD_TABLE) {
    if (perPerson >= t.min) return t.amt;
  }
  return 0;
}

export function calcCommissionBreakdown(
  target: number,
  sales: number,
  headcount: number
): CommissionBreakdown {
  const pct = target > 0 ? (sales / target) * 100 : 0;
  const monthGoalReached = pct >= 80;
  const main = calcMainCommission(pct);
  const special = calcSpecialCommission(pct, target);
  const hc = headcount > 0 ? headcount : 1;
  const perPersonSales = sales / hc;
  const perHead = calcPerHeadCommission(sales, hc, monthGoalReached);

  return {
    pct,
    main,
    special,
    perHead,
    perPersonSales,
    headcount: hc,
    monthGoalReached,
    total: main + special + perHead,
    inSpecialBand: commissionInSpecialBand(target),
  };
}

export function evaluateGallonRule(
  rule: GallonIncentiveRule,
  monthSales: SaleEntry[],
  claimedSaleIds?: Set<string>
): RuleEvaluationResult {
  if (rule.enabled === false) {
    return {
      rule,
      matchedQty: 0,
      matchedRevenue: 0,
      isQualified: false,
      progressPct: 0,
      progressText: 'ปิดการใช้งาน (Disabled)',
      earnedAmount: 0,
      details: 'เกณฑ์นี้ถูกปิดใช้งานชั่วคราว',
    };
  }

  const isStandardSize = rule.conditionType === 'size_standard';

  const matchedSales = monthSales.filter((s) => {
    // If standard size rule and this sale was already rewarded under a specific custom rule, skip
    if (isStandardSize && claimedSaleIds && claimedSaleIds.has(s.id)) {
      return false;
    }

    // 1. Product Filter
    const isSpecificProduct =
      rule.targetType === 'specific_product' ||
      (rule.productName && rule.productName !== 'ALL' && rule.productName !== '__ALL__');

    if (isSpecificProduct) {
      const pName = (rule.productName || '').trim().toLowerCase();
      const sName = (s.name || '').trim().toLowerCase();
      const sSku = (s.sku || '').trim().toLowerCase();
      const rSku = (rule.sku || '').trim().toLowerCase();

      if (rSku && sSku === rSku) {
        // Matched SKU
      } else if (pName && (sName === pName || sName.includes(pName))) {
        // Matched Product Name
      } else {
        return false;
      }
    }

    // 2. Size Filter (new multi-select + legacy single-size support)
    const selectedSizes = Array.isArray(rule.sizes) ? rule.sizes.filter(Boolean) : [];
    const rSize = (rule.size || '').trim();
    const sSize = (s.size || '').trim();
    if (selectedSizes.length > 0) {
      const normalizedSize = sSize.toLowerCase();
      if (!selectedSizes.some((size) => normalizedSize.includes(String(size).trim().toLowerCase()))) {
        return false;
      }
    } else if (rSize && rSize !== 'ALL' && rSize !== '__ALL__') {
      if (!sSize.toLowerCase().includes(rSize.toLowerCase())) return false;
    }

    // 3. Base Filter (new include/exclude mode + legacy support)
    const selectedBases = Array.isArray(rule.bases) ? rule.bases.filter(Boolean) : [];
    if (rule.baseMode === 'include' && selectedBases.length > 0) {
      if (!selectedBases.includes(s.base || '')) return false;
    } else if (rule.baseMode === 'exclude' && selectedBases.length > 0) {
      if (selectedBases.includes(s.base || '')) return false;
    } else if (rule.base && rule.base !== 'ALL' && rule.base !== '__ALL__') {
      if (Array.isArray(rule.base)) {
        if (!rule.base.includes(s.base || '')) return false;
      } else if (rule.base !== s.base) {
        return false;
      }
    }

    return true;
  });

  const matchedQty = matchedSales.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const matchedRevenue = matchedSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

  const cond = rule.conditionType || (rule.mode === 'perBundle' ? 'bundle' : 'per_unit');

  let earnedAmount = 0;
  let isQualified = false;
  let progressPct = 0;
  let progressText = '';
  let details = '';

  switch (cond) {
    case 'per_unit': {
      const rate = rule.ratePerUnit ?? rule.rate ?? rule.value ?? rule.ratePerCan ?? 0;
      earnedAmount = matchedQty * rate;
      isQualified = matchedQty > 0;
      progressPct = 100;
      progressText = matchedQty > 0 ? `ขายได้ ${matchedQty.toLocaleString()} ถัง` : 'ยังไม่มียอดขาย';
      details = `${matchedQty.toLocaleString()} ถัง × ${rate.toLocaleString()} บาท/ถัง = ${earnedAmount.toLocaleString()} บาท`;
      break;
    }

    case 'min_qty_per_unit': {
      // "สินค้า A ต้องขายครบขั้นต่ำ 4 ถัง ถึงจะจ่ายตามจำนวนที่ขายได้ถังละ 50 บาท"
      const minQty = rule.minQtyRequired || 4;
      const rate = rule.ratePerUnit ?? rule.rate ?? rule.value ?? 50;
      isQualified = matchedQty >= minQty;
      progressPct = minQty > 0 ? Math.min(100, Math.round((matchedQty / minQty) * 100)) : 100;

      if (isQualified) {
        earnedAmount = matchedQty * rate;
        progressText = `ผ่านเกณฑ์ขั้นต่ำ ${minQty} ถัง (ขายได้ ${matchedQty.toLocaleString()} ถัง)`;
        details = `${matchedQty.toLocaleString()} ถัง × ${rate.toLocaleString()} บาท = ${earnedAmount.toLocaleString()} บาท`;
      } else {
        earnedAmount = 0;
        const diff = minQty - matchedQty;
        progressText = `ขายได้ ${matchedQty.toLocaleString()} / ${minQty.toLocaleString()} ถัง (ขาดอีก ${diff} ถัง)`;
        details = `ยังไม่ถึงเกณฑ์ขั้นต่ำ ${minQty} ถัง (ยังไม่ได้รับเงินรางวัล)`;
      }
      break;
    }

    case 'bundle': {
      // "สินค้า A ต้องขาย 4 ถังรวมกันถึงจะจ่าย 200 บาท" (ทุกๆ 4 ถัง จ่าย 200 บาท)
      const bundleSize = rule.bundleSize || rule.minQtyRequired || 4;
      const bundleReward = rule.bundleReward || rule.value || 200;
      const completedBundles = Math.floor(matchedQty / bundleSize);
      earnedAmount = completedBundles * bundleReward;
      const remainder = matchedQty % bundleSize;
      isQualified = completedBundles > 0;
      progressPct = bundleSize > 0 ? Math.min(100, Math.round(((matchedQty % bundleSize) / bundleSize) * 100)) : 100;

      if (completedBundles > 0) {
        progressText = `ครบ ${completedBundles} ชุด (${completedBundles * bundleSize} ถัง) เศษ ${remainder} ถัง`;
        details = `${completedBundles} ชุด × ${bundleReward.toLocaleString()} บาท = ${earnedAmount.toLocaleString()} บาท`;
      } else {
        const diff = bundleSize - matchedQty;
        progressText = `ขายได้ ${matchedQty} / ${bundleSize} ถัง (ขาดอีก ${diff} ถังจะครบชุดแรก)`;
        details = `ยังไม่ครบชุดละ ${bundleSize} ถัง (ชุดละ ${bundleReward.toLocaleString()} บ.)`;
      }
      break;
    }

    case 'revenue_threshold': {
      // "สินค้า A ต้องขายรวมกันให้ถึง 200,000 บาท ถึงจะจ่ายรายถังตามจำนวนที่ขายได้ถังละ 50 บาท"
      const targetRevenue = rule.minRevenueRequired || 200000;
      const rate = rule.ratePerUnit ?? rule.rate ?? 50;
      isQualified = matchedRevenue >= targetRevenue;
      progressPct = targetRevenue > 0 ? Math.min(100, Math.round((matchedRevenue / targetRevenue) * 100)) : 100;

      if (isQualified) {
        earnedAmount = matchedQty * rate;
        progressText = `ยอดขายถึงเป้า ${matchedRevenue.toLocaleString()} / ${targetRevenue.toLocaleString()} บ. (บรรลุ 100%)`;
        details = `ปลดล็อกเงื่อนไขสำเร็จ! ได้รับ ${matchedQty.toLocaleString()} ถัง × ${rate.toLocaleString()} บาท/ถัง = ${earnedAmount.toLocaleString()} บาท`;
      } else {
        earnedAmount = 0;
        const diff = targetRevenue - matchedRevenue;
        progressText = `ยอดขาย ${matchedRevenue.toLocaleString()} / ${targetRevenue.toLocaleString()} บ. (ขาดอีก ${diff.toLocaleString()} บ.)`;
        details = `ยอดขายยังไม่ถึง ${targetRevenue.toLocaleString()} บาท (หากถึงจะได้ ${matchedQty.toLocaleString()} ถัง × ${rate} บ. = ${(matchedQty * rate).toLocaleString()} บ.)`;
      }
      break;
    }

    case 'size_standard':
    default: {
      const rate = rule.ratePerUnit ?? rule.rate ?? 0;
      earnedAmount = matchedQty * rate;
      isQualified = matchedQty > 0;
      progressPct = 100;
      progressText = matchedQty > 0 ? `ขายได้ ${matchedQty.toLocaleString()} ถัง` : 'ยังไม่มียอดขาย';
      details = `${matchedQty.toLocaleString()} ถัง × ${rate.toLocaleString()} บาท/ถัง = ${earnedAmount.toLocaleString()} บาท`;
      break;
    }
  }

  // Claim matched sales for specific rules
  if (!isStandardSize && earnedAmount > 0 && claimedSaleIds) {
    matchedSales.forEach((s) => claimedSaleIds.add(s.id));
  }

  return {
    rule,
    matchedQty,
    matchedRevenue,
    isQualified,
    progressPct,
    progressText,
    earnedAmount,
    details,
  };
}

export function calcGallonIncentive(
  rules: GallonIncentiveRule[],
  monthSales: SaleEntry[],
  headcount: number
): GallonIncentiveResult {
  const activeRules = rules && rules.length > 0 ? rules : GALLON_TIERS;
  const claimedSaleIds = new Set<string>();

  // Evaluate specific product rules first, then standard size rules
  const customRules = activeRules.filter((r) => r.conditionType !== 'size_standard');
  const standardRules = activeRules.filter((r) => r.conditionType === 'size_standard');
  const sortedRules = [...customRules, ...standardRules];

  const evaluated = sortedRules.map((rule) =>
    evaluateGallonRule(rule, monthSales, claimedSaleIds)
  );

  const rows = evaluated.map((ev) => ({
    rule: ev.rule,
    qty: ev.matchedQty,
    amount: ev.earnedAmount,
  }));

  const subtotal = evaluated.reduce((a, x) => a + x.earnedAmount, 0);
  const hc = headcount > 0 ? headcount : 1;
  const perPersonRaw = subtotal / hc;
  const perPersonCapped = Math.min(perPersonRaw, 5000);
  const paidTotal = perPersonCapped * hc;

  return { rows, subtotal, perPersonRaw, perPersonCapped, paidTotal, headcount: hc };
}

export interface SalesPaceResult {
  daily: { d: number; total: number; isFuture: boolean }[];
  mKey: string;
  dim: number;
  todayNum: number;
  soFarTotal: number;
  daysPassed: number;
  avgPerDay: number;
  forecastTotal: number;
  target: number;
  expectedToDate: number;
  paceGap: number;
  status: string;
  statusCls: 'status-ok' | 'status-low' | 'status-over';
  statusReason: string;
}

export function computeSalesPace(
  mKey: string,
  target: number,
  salesInMonth: SaleEntry[]
): SalesPaceResult {
  const now = new Date();
  const currentMonthKey = todayISO().slice(0, 7);
  const isCurrentMonth = mKey === currentMonthKey;
  const [yy, mm] = mKey.split('-').map(Number);
  const dim = daysInMonth(yy, mm);
  const todayNum = isCurrentMonth ? now.getDate() : dim;

  // Group sales by day
  const dayTotals: Record<number, number> = {};
  salesInMonth.forEach((s) => {
    const parts = s.date.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      dayTotals[day] = (dayTotals[day] || 0) + (Number(s.total) || 0);
    }
  });

  const daily = [];
  for (let d = 1; d <= dim; d++) {
    daily.push({
      d,
      total: dayTotals[d] || 0,
      isFuture: isCurrentMonth && d > todayNum,
    });
  }

  const soFar = daily.filter((x) => !x.isFuture);
  const soFarTotal = soFar.reduce((a, x) => a + x.total, 0);
  const daysPassed = Math.min(todayNum, dim);
  const avgPerDay = daysPassed > 0 ? soFarTotal / daysPassed : 0;
  const forecastTotal = isCurrentMonth ? Math.round(avgPerDay * dim) : soFarTotal;
  const expectedToDate = isCurrentMonth ? Math.round((target * daysPassed) / dim) : target;
  const paceGap = soFarTotal - expectedToDate;

  let status = '';
  let statusCls: 'status-ok' | 'status-low' | 'status-over' = 'status-ok';
  let statusReason = '';

  if (!isCurrentMonth) {
    if (target > 0 && soFarTotal >= target) {
      status = 'บรรลุเป้าหมาย';
      statusCls = 'status-ok';
      statusReason = `ยอดขาย ${fmt(soFarTotal)} บ. เกินเป้าหมาย ${fmt(target)} บ.`;
    } else {
      status = 'ไม่ถึงเป้าหมาย';
      statusCls = target > 0 && soFarTotal >= target * 0.9 ? 'status-low' : 'status-over';
      statusReason =
        target > 0
          ? `ยอดขาย ${fmt(soFarTotal)} บ. (${((soFarTotal / target) * 100).toFixed(0)}% ของเป้าหมาย ${fmt(target)} บ.)`
          : `ยอดขายรวม ${fmt(soFarTotal)} บ.`;
    }
  } else if (forecastTotal >= target) {
    status = 'ยอดขายตามเป้า (On Track)';
    statusCls = 'status-ok';
    statusReason =
      paceGap >= 0
        ? `ยอดขายนำแผน +${fmt(Math.abs(paceGap))} บ.`
        : `คาดการณ์สิ้นเดือน ${fmt(forecastTotal)} บ.`;
  } else if (forecastTotal >= target * 0.9) {
    status = 'ยอดขายต่ำกว่าเป้าเล็กน้อย (Slightly Behind)';
    statusCls = 'status-low';
    statusReason = `ยอดขายตามหลังแผน -${fmt(Math.abs(paceGap))} บ.`;
  } else {
    status = 'ต้องเร่งทำยอด (Action Needed)';
    statusCls = 'status-over';
    statusReason = `ตามหลังแผน -${fmt(Math.abs(paceGap))} บ. คาดการณ์ ${fmt(forecastTotal)} บ. (${target > 0 ? ((forecastTotal / target) * 100).toFixed(0) : 0}% ของเป้า)`;
  }

  return {
    daily,
    mKey,
    dim,
    todayNum,
    soFarTotal,
    daysPassed,
    avgPerDay,
    forecastTotal,
    target,
    expectedToDate,
    paceGap,
    status,
    statusCls,
    statusReason,
  };
}

export interface CommissionPlanResult {
  pct: number;
  soFarTotal: number;
  target: number;
  pcCount: number;
  tierRate: number;
  tierDesc: string;
  tierAmount: number;
  tierRewardType: 'fixed_amount' | 'percentage';
  tierRewardValue: number;
  currentMatchedTier?: CommissionTierRule;
  nextTier?: CommissionTierRule;
  nextTierGapSales: number;
  nextTierGapPct: number;
  activeCommissionTiers: CommissionTierRule[];
  gallonTotal: number;
  gallonEligibleQty: number;
  grandTotal: number;
  grandPerPerson: number;
  gallonRuleResults: RuleEvaluationResult[];
}

export function computeCommissionPlan(
  mKey: string,
  target: number,
  pcCount: number,
  monthSales: SaleEntry[],
  gallonRules?: GallonIncentiveRule[],
  commissionTiers?: CommissionTierRule[]
): CommissionPlanResult {
  const soFarTotal = monthSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const pct = target > 0 ? (soFarTotal / target) * 100 : 0;

  // Customizable Commission Tiers (Defaulting to Nippon Paint 80% = 6,000 Baht, etc.)
  const tiersToUse =
    commissionTiers && commissionTiers.length > 0
      ? commissionTiers
      : DEFAULT_COMMISSION_TIERS;

  // Filter only enabled tiers and sort ascending by minPct
  const activeTiers = [...tiersToUse]
    .filter((t) => t.enabled !== false)
    .sort((a, b) => a.minPct - b.minPct);

  // Find the highest tier that is met (pct >= tier.minPct)
  let currentMatchedTier: CommissionTierRule | undefined = undefined;
  let nextTier: CommissionTierRule | undefined = undefined;

  for (let i = 0; i < activeTiers.length; i++) {
    const tier = activeTiers[i];
    if (pct >= tier.minPct) {
      currentMatchedTier = tier;
      nextTier = activeTiers[i + 1] || undefined;
    } else {
      if (!currentMatchedTier && !nextTier) {
        nextTier = tier; // first tier to unlock
      }
      break;
    }
  }

  let tierAmount = 0;
  let tierRate = 0;
  let tierDesc = 'ยังไม่ถึงเกณฑ์ (ไม่มีค่าคอม)';
  let tierRewardType: 'fixed_amount' | 'percentage' = 'fixed_amount';
  let tierRewardValue = 0;

  if (currentMatchedTier) {
    tierRewardType = currentMatchedTier.rewardType;
    tierRewardValue = currentMatchedTier.rewardValue;

    if (currentMatchedTier.rewardType === 'fixed_amount') {
      tierAmount = Math.round(currentMatchedTier.rewardValue);
      tierDesc =
        currentMatchedTier.label ||
        `ยอดขาย ≥ ${currentMatchedTier.minPct}% (รับ ${fmt(currentMatchedTier.rewardValue)} บ.)`;
      tierRate = target > 0 ? Number(((tierAmount / target) * 100).toFixed(2)) : 0;
    } else {
      tierRate = currentMatchedTier.rewardValue;
      tierAmount = Math.round((soFarTotal * currentMatchedTier.rewardValue) / 100);
      tierDesc =
        currentMatchedTier.label ||
        `ยอดขาย ≥ ${currentMatchedTier.minPct}% (อัตรา ${currentMatchedTier.rewardValue}%)`;
    }
  } else if (activeTiers.length > 0) {
    const lowest = activeTiers[0];
    tierDesc = `ต่ำกว่า ${lowest.minPct}% (ยังไม่ถึงเกณฑ์)`;
  }

  // Calculate gaps to next tier
  let nextTierGapSales = 0;
  let nextTierGapPct = 0;
  if (nextTier) {
    const neededSales = (nextTier.minPct / 100) * target;
    nextTierGapSales = Math.max(0, Math.round(neededSales - soFarTotal));
    nextTierGapPct = Math.max(0, Number((nextTier.minPct - pct).toFixed(1)));
  }

  // Gallon incentive calculation using enhanced rule evaluator
  const activeRules = gallonRules && gallonRules.length > 0 ? gallonRules : GALLON_TIERS;
  const claimedSaleIds = new Set<string>();

  // Evaluate specific product rules first, followed by size-standard rules
  const customRules = activeRules.filter((r) => r.conditionType !== 'size_standard');
  const standardRules = activeRules.filter((r) => r.conditionType === 'size_standard');
  const sortedRules = [...customRules, ...standardRules];

  const gallonRuleResults = sortedRules.map((rule) =>
    evaluateGallonRule(rule, monthSales, claimedSaleIds)
  );

  const gallonTotal = gallonRuleResults.reduce((sum, res) => sum + res.earnedAmount, 0);
  const gallonEligibleQty = gallonRuleResults.reduce(
    (sum, res) => (res.earnedAmount > 0 ? sum + res.matchedQty : sum),
    0
  );

  const hc = pcCount > 0 ? pcCount : 1;
  const grandTotal = tierAmount + gallonTotal;
  const grandPerPerson = Math.round(grandTotal / hc);

  return {
    pct,
    soFarTotal,
    target,
    pcCount: hc,
    tierRate,
    tierDesc,
    tierAmount,
    tierRewardType,
    tierRewardValue,
    currentMatchedTier,
    nextTier,
    nextTierGapSales,
    nextTierGapPct,
    activeCommissionTiers: activeTiers,
    gallonTotal,
    gallonEligibleQty,
    grandTotal,
    grandPerPerson,
    gallonRuleResults,
  };
}

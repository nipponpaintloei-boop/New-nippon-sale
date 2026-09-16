export interface Product {
  sku: string;
  name: string;
  size: string;
  base: string;
  price: number;
  init: number;
  inflow: number;
  sold: number;
  remain: number;
  seed?: boolean;
  stock?: number;
  currentStock?: number;
  minStock?: number;
  id?: string;
  category?: string;
  filmColor?: string;
  colorCode?: string;
}

export interface SaleEntry {
  id: string;
  date: string;
  name: string;
  size: string;
  base: string;
  filmColor?: string;
  price: number;
  colorCode: string;
  tintPrice: number;
  qty: number;
  total: number;
  sku: string;
  seed?: boolean;
  billId?: string | null;
  customerName?: string;
  customerPhone?: string;
}


export type IncentiveConditionType =
  | 'per_unit'           // จ่ายรายถังโดยตรง (เช่น สินค้า A ได้ค่ารายถัง 50 บาท)
  | 'min_qty_per_unit'   // ต้องขายรวมกันให้ครบขั้นต่ำ X ถัง ถึงจะจ่ายรายถัง Y บาท
  | 'bundle'             // ต้องขายครบทุกๆ X ถัง จ่าย Y บาท (เช่น ขายครบ 4 ถัง จ่าย 200 บาท)
  | 'revenue_threshold'  // ยอดขายรวมถึง X บาท ถึงจะจ่ายรายถัง Y บาท (เช่น ยอดขายถึง 200,000 บ. จ่ายถังละ 50 บ.)
  | 'size_standard';     // อัตรามาตรฐานตามขนาดบรรจุภัณฑ์ (5GL, 2.5GL, 1GL, 1/4GL)

export interface GallonIncentiveRule {
  id?: string;
  name: string;
  size: string; // legacy single-size value: 'ALL' or '5GL', '2.5GL', '1GL', '1/4GL'
  sizes?: string[]; // multi-size selection, e.g. ['2.5GL', '1GL']
  base?: string | string[]; // legacy base filter
  baseMode?: 'all' | 'include' | 'exclude'; // multi-base filter mode
  bases?: string[]; // selected bases for include/exclude mode
  mode?: 'perUnit' | 'perBundle';
  bundleSize?: number;
  bundleReward?: number;
  value?: number; // Baht per unit or per bundle
  ratePerCan?: number;
  label?: string;
  desc?: string;
  rate?: number;
  
  // Enhanced condition fields
  conditionType?: IncentiveConditionType;
  targetType?: 'all' | 'specific_product' | 'size_only';
  productName?: string;
  sku?: string;
  ratePerUnit?: number;
  minQtyRequired?: number;
  minRevenueRequired?: number;
  enabled?: boolean;
}

export interface RuleEvaluationResult {
  rule: GallonIncentiveRule;
  matchedQty: number;
  matchedRevenue: number;
  isQualified: boolean;
  progressPct: number;
  progressText: string;
  earnedAmount: number;
  details: string;
}

export type CommissionRewardType = 'fixed_amount' | 'percentage';

export interface CommissionTierRule {
  id?: string;
  minPct: number; // e.g. 80
  maxPct?: number | null; // e.g. 85 or null
  rewardType: CommissionRewardType; // 'fixed_amount' (บาท) or 'percentage' (% ยอดขาย)
  rewardValue: number; // e.g. 6000 (baht) or 1.5 (percent)
  label?: string; // e.g. "ยอดขาย 80% - 84.9%"
  desc?: string;
  enabled?: boolean;
}

export interface BrandConfig {
  brandName: string; // e.g. "Sale Paint Pro", "TOA SALE", "NIPPON SALE"
  subTitle?: string; // e.g. "ระบบบริหารงานขายสีและสต็อก"
  branchName?: string; // e.g. "สาขาเลย (Loei Branch)"
  logoType?: 'preset' | 'custom_text' | 'image_url';
  logoImageUrl?: string;
  themeColor?: 'red' | 'blue' | 'emerald' | 'violet' | 'amber' | 'teal' | 'slate';
  accentColor?: string; // custom hex or tailwind class
  badgeText?: string; // e.g. "PRO"
}

export interface AppSettings {
  targets: Record<string, number>;
  headcounts?: Record<string, number>;
  pcCount?: Record<string, number>;
  gallonRules?: GallonIncentiveRule[];
  commissionTiers?: CommissionTierRule[];
  pinhash?: string;
  pin?: string;
  auditLog?: AuditItem[];
  gallonIncentives?: Record<string, GallonIncentiveRule[]>;
  orderByName?: string;
  brandConfig?: BrandConfig;
}


export interface AuditItem {
  time: string;
  action: string;
  detail: string;
  flagged?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user?: string;
  action: string;
  details: string;
}

export interface CustomerMeta {
  favorite?: boolean;
  color?: string | null;
  notes?: string;
  repeatCycleDays?: number;
  name?: string;
  phone?: string;
}

export interface CustomerRecord {
  key: string;
  name: string;
  phone: string;
  total: number;
  count: number;
  lastDate: string;
  favorite: boolean;
  color: string | null;
  note?: string;
  tags?: string[];
  billCount: number;
  billsList: {
    billKey: string;
    date: string;
    total: number;
    items: { name: string; size: string; base: string; qty: number; total: number }[];
  }[];
  topProducts: { name: string; qty: number }[];
  boughtNames: string[];
  avgCycleDays: number | null;
  daysSinceLast: number;
  followStatus: 'overdue' | 'due' | 'ok' | 'new';
  meta?: CustomerMeta;
  totalSpent?: number;
  totalOrders?: number;
  lastOrderDate?: string;
  nextFollowUp?: string;
}

export type CustomerSummary = CustomerRecord;
export type CustomerAggregated = CustomerRecord;

export interface CommissionTier {
  pct: number;
  amt: number;
}

export interface CommissionPerHeadTier {
  min: number;
  amt: number;
}


export interface MksBrand {
  key: string;
  label: string;
  us?: boolean;
  pc?: number;
  target?: number;
}

export interface MksDayRow {
  pc: number;
  sales: number;
  note?: string;
}

export interface MksWeekRow {
  pcReg: number;
  pcPro: number;
  target: number;
  sales: number;
  note?: string;
}

export interface MksDayData {
  date: string;
  rows: Record<string, MksDayRow>;
}

export interface MksWeekData {
  from: string;
  to: string;
  rows: Record<string, MksWeekRow>;
}

export interface ActionItem {
  priority: 1 | 2 | 3;
  icon: string;
  view: string;
  title: string;
  detail: string;
}

export interface CommissionBreakdown {
  pct: number;
  main: number;
  special: number;
  perHead: number;
  perPersonSales: number;
  headcount: number;
  monthGoalReached: boolean;
  total: number;
  inSpecialBand: boolean;
}

export interface GallonIncentiveResult {
  rows: {
    rule: GallonIncentiveRule;
    qty: number;
    amount: number;
  }[];
  subtotal: number;
  perPersonRaw: number;
  perPersonCapped: number;
  paidTotal: number;
  headcount: number;
}

export interface SalesPaceStatus {
  statusCls: 'status-over' | 'status-low' | 'status-ok' | 'status-high';
  statusLabel: string;
  statusReason: string;
  expectedSalesToDate: number;
  salesToDate: number;
  gapSales: number;
  dailyNeededRemaining: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  target: number;
}

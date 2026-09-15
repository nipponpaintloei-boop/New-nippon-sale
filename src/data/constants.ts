import { CommissionTierRule, GallonIncentiveRule, MksBrand } from '../types';

export const STORE_KEYS = {
  products: 'tint:products',
  sales: 'tint:sales',
  settings: 'tint:settings',
  mksDay: 'tint:mksDay',
  mksWeek: 'tint:mksWeek',
  customers: 'tint:customers',
};

export const LOCAL_STORAGE_PREFIX = 'nippon-sale:';

export const DEFAULT_TARGET = 380000;

export const COMMISSION_MAIN_TABLE = [
  { pct: 80, amt: 6000 },
  { pct: 85, amt: 6500 },
  { pct: 90, amt: 7000 },
  { pct: 95, amt: 7500 },
  { pct: 100, amt: 10000 },
  { pct: 105, amt: 11000 },
  { pct: 110, amt: 12000 },
  { pct: 115, amt: 13000 },
  { pct: 120, amt: 14250 },
  { pct: 125, amt: 15500 },
  { pct: 130, amt: 16750 },
];

/* Special Band: 200,000 - 400,000 */
export const COMMISSION_SPECIAL_TABLE = [
  { pct: 80, amt: 1000 },
  { pct: 90, amt: 1500 },
  { pct: 100, amt: 2000 },
];

/* Per-head: sale per person >= 200,000 */
export const COMMISSION_PERHEAD_TABLE = [
  { min: 400000, amt: 3000 },
  { min: 350000, amt: 2500 },
  { min: 300000, amt: 2000 },
  { min: 250000, amt: 1500 },
  { min: 200000, amt: 1000 },
  { min: 150000, amt: 0 },
];

export const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

export const MKS_BRANDS: MksBrand[] = [
  { key: 'NIPPON', label: 'NIPPON (เรา)', us: true, pc: 2, target: 380000 },
  { key: 'TOA', label: 'TOA', pc: 2, target: 1150000 },
  { key: 'BEGER', label: 'BEGER', pc: 2, target: 550000 },
  { key: 'JOTUN', label: 'JOTUN', pc: 1, target: 170000 },
  { key: 'CAPTAIN', label: 'CAPTAIN', pc: 2, target: 380000 },
  { key: 'DELTA', label: 'DELTA', pc: 2, target: 330000 },
  { key: 'DULUX', label: 'DULUX', pc: 1, target: 220000 },
  { key: 'JBP', label: 'JBP', pc: 2, target: 350000 },
];

export const CUST_COLOR_PALETTE = [
  { key: 'ochre', val: '#f0b23c', label: 'ทองโอเคอร์' },
  { key: 'teal', val: '#5f8fd8', label: 'ฟ้าน้ำทะเล' },
  { key: 'clay', val: '#d35b4e', label: 'ส้มดินเผา' },
  { key: 'moss', val: '#7cbf72', label: 'เขียวมอส' },
];

export const RECENT_EDIT_ACTIONS = [
  'นำเข้า Excel',
  'เพิ่มรายการขาย',
  'แก้ไขรายการขาย',
  'ลบรายการขาย',
  'เติมสต็อก',
  'ปรับสต็อก',
  'แก้ไขข้อมูลสินค้า',
];

export const COMMISSION_TIERS = [
  { minPct: 120, maxPct: null, rate: 2.0, label: 'บรรลุตั้งแต่ 120% ขึ้นไป' },
  { minPct: 110, maxPct: 120, rate: 1.75, label: 'บรรลุ 110% - 119%' },
  { minPct: 100, maxPct: 110, rate: 1.5, label: 'บรรลุ 100% - 109%' },
  { minPct: 90, maxPct: 100, rate: 1.0, label: 'บรรลุ 90% - 99%' },
  { minPct: 80, maxPct: 90, rate: 0.5, label: 'บรรลุ 80% - 89%' },
  { minPct: 0, maxPct: 80, rate: 0.0, label: 'ต่ำกว่า 80% (ไม่มีค่าคอมมิชชั่น)' },
];

/**
 * Standard Step Commission Tiers (Default: Fixed Baht based on Nippon Paint Standard Table)
 * e.g., 80% Ach -> 6,000 Baht, 100% Ach -> 10,000 Baht
 */
export const DEFAULT_COMMISSION_TIERS: CommissionTierRule[] = [
  {
    id: 'tier-80',
    minPct: 80,
    maxPct: 85,
    rewardType: 'fixed_amount',
    rewardValue: 6000,
    label: 'ยอดขาย 80% - 84.9%',
    desc: 'เมื่อขายได้ 80% ของเป้า ได้รับคอมมิชชั่น 6,000 บาท',
    enabled: true,
  },
  {
    id: 'tier-85',
    minPct: 85,
    maxPct: 90,
    rewardType: 'fixed_amount',
    rewardValue: 6500,
    label: 'ยอดขาย 85% - 89.9%',
    desc: 'เมื่อขายได้ 85% ของเป้า ได้รับคอมมิชชั่น 6,500 บาท',
    enabled: true,
  },
  {
    id: 'tier-90',
    minPct: 90,
    maxPct: 95,
    rewardType: 'fixed_amount',
    rewardValue: 7000,
    label: 'ยอดขาย 90% - 94.9%',
    desc: 'เมื่อขายได้ 90% ของเป้า ได้รับคอมมิชชั่น 7,000 บาท',
    enabled: true,
  },
  {
    id: 'tier-95',
    minPct: 95,
    maxPct: 100,
    rewardType: 'fixed_amount',
    rewardValue: 7500,
    label: 'ยอดขาย 95% - 99.9%',
    desc: 'เมื่อขายได้ 95% ของเป้า ได้รับคอมมิชชั่น 7,500 บาท',
    enabled: true,
  },
  {
    id: 'tier-100',
    minPct: 100,
    maxPct: 105,
    rewardType: 'fixed_amount',
    rewardValue: 10000,
    label: 'ยอดขาย 100% - 104.9%',
    desc: 'เมื่อขายได้ 100% ของเป้า ได้รับคอมมิชชั่น 10,000 บาท',
    enabled: true,
  },
  {
    id: 'tier-105',
    minPct: 105,
    maxPct: 110,
    rewardType: 'fixed_amount',
    rewardValue: 11000,
    label: 'ยอดขาย 105% - 109.9%',
    desc: 'เมื่อขายได้ 105% ของเป้า ได้รับคอมมิชชั่น 11,000 บาท',
    enabled: true,
  },
  {
    id: 'tier-110',
    minPct: 110,
    maxPct: 115,
    rewardType: 'fixed_amount',
    rewardValue: 12000,
    label: 'ยอดขาย 110% - 114.9%',
    desc: 'เมื่อขายได้ 110% ของเป้า ได้รับคอมมิชชั่น 12,000 บาท',
    enabled: true,
  },
  {
    id: 'tier-115',
    minPct: 115,
    maxPct: 120,
    rewardType: 'fixed_amount',
    rewardValue: 13000,
    label: 'ยอดขาย 115% - 119.9%',
    desc: 'เมื่อขายได้ 115% ของเป้า ได้รับคอมมิชชั่น 13,000 บาท',
    enabled: true,
  },
  {
    id: 'tier-120',
    minPct: 120,
    maxPct: 125,
    rewardType: 'fixed_amount',
    rewardValue: 14250,
    label: 'ยอดขาย 120% - 124.9%',
    desc: 'เมื่อขายได้ 120% ของเป้า ได้รับคอมมิชชั่น 14,250 บาท',
    enabled: true,
  },
  {
    id: 'tier-125',
    minPct: 125,
    maxPct: 130,
    rewardType: 'fixed_amount',
    rewardValue: 15500,
    label: 'ยอดขาย 125% - 129.9%',
    desc: 'เมื่อขายได้ 125% ของเป้า ได้รับคอมมิชชั่น 15,500 บาท',
    enabled: true,
  },
  {
    id: 'tier-130',
    minPct: 130,
    maxPct: null,
    rewardType: 'fixed_amount',
    rewardValue: 16750,
    label: 'ยอดขายตั้งแต่ 130% ขึ้นไป',
    desc: 'เมื่อขายได้ 130% ของเป้าขึ้นไป ได้รับคอมมิชชั่น 16,750 บาท',
    enabled: true,
  },
];

export const PRESET_PERCENTAGE_TIERS: CommissionTierRule[] = [
  {
    id: 'pct-80',
    minPct: 80,
    maxPct: 90,
    rewardType: 'percentage',
    rewardValue: 0.5,
    label: 'ยอดขาย 80% - 89.9%',
    desc: 'คิดคอมมิชชั่น 0.5% ของยอดขายรวม',
    enabled: true,
  },
  {
    id: 'pct-90',
    minPct: 90,
    maxPct: 100,
    rewardType: 'percentage',
    rewardValue: 1.0,
    label: 'ยอดขาย 90% - 99.9%',
    desc: 'คิดคอมมิชชั่น 1.0% ของยอดขายรวม',
    enabled: true,
  },
  {
    id: 'pct-100',
    minPct: 100,
    maxPct: 110,
    rewardType: 'percentage',
    rewardValue: 1.5,
    label: 'ยอดขาย 100% - 109.9%',
    desc: 'คิดคอมมิชชั่น 1.5% ของยอดขายรวม',
    enabled: true,
  },
  {
    id: 'pct-110',
    minPct: 110,
    maxPct: 120,
    rewardType: 'percentage',
    rewardValue: 1.75,
    label: 'ยอดขาย 110% - 119.9%',
    desc: 'คิดคอมมิชชั่น 1.75% ของยอดขายรวม',
    enabled: true,
  },
  {
    id: 'pct-120',
    minPct: 120,
    maxPct: null,
    rewardType: 'percentage',
    rewardValue: 2.0,
    label: 'ยอดขายตั้งแต่ 120% ขึ้นไป',
    desc: 'คิดคอมมิชชั่น 2.0% ของยอดขายรวม',
    enabled: true,
  },
];

export const PRESET_SIMPLE_TIERS: CommissionTierRule[] = [
  {
    id: 'simple-80',
    minPct: 80,
    maxPct: 100,
    rewardType: 'fixed_amount',
    rewardValue: 6000,
    label: 'ยอดขาย 80% - 99.9%',
    desc: 'บรรลุเป้าขั้นต่ำ 80% ได้รับคอมมิชชั่น 6,000 บาท',
    enabled: true,
  },
  {
    id: 'simple-100',
    minPct: 100,
    maxPct: 120,
    rewardType: 'fixed_amount',
    rewardValue: 10000,
    label: 'ยอดขาย 100% - 119.9%',
    desc: 'บรรลุเป้าหมาย 100% ได้รับคอมมิชชั่น 10,000 บาท',
    enabled: true,
  },
  {
    id: 'simple-120',
    minPct: 120,
    maxPct: null,
    rewardType: 'fixed_amount',
    rewardValue: 15000,
    label: 'ยอดขายเกินเป้า 120% ขึ้นไป',
    desc: 'ทำยอดทะลุเป้า 120% ได้รับคอมมิชชั่น 15,000 บาท',
    enabled: true,
  },
];

export const GALLON_TIERS: GallonIncentiveRule[] = [
  {
    id: 'tier-5gl',
    name: 'ถังใหญ่ (5GL)',
    size: '5GL',
    conditionType: 'size_standard',
    ratePerUnit: 50,
    rate: 50,
    label: 'ถังใหญ่ (5GL / ถังกลม)',
    desc: 'สีถังใหญ่ขนาด 5 แกลลอน',
    enabled: true,
  },
  {
    id: 'tier-25gl',
    name: 'ถังกลาง (2.5GL)',
    size: '2.5GL',
    conditionType: 'size_standard',
    ratePerUnit: 30,
    rate: 30,
    label: 'ถังกลาง (2.5GL)',
    desc: 'สีถังขนาด 2.5 แกลลอน',
    enabled: true,
  },
  {
    id: 'tier-1gl',
    name: 'แกลลอน (1GL)',
    size: '1GL',
    conditionType: 'size_standard',
    ratePerUnit: 15,
    rate: 15,
    label: 'แกลลอน (1GL)',
    desc: 'สีถังขนาด 1 แกลลอน',
    enabled: true,
  },
  {
    id: 'tier-quarter',
    name: 'กระป๋อง (1/4GL)',
    size: '1/4GL',
    conditionType: 'size_standard',
    ratePerUnit: 5,
    rate: 5,
    label: 'กระป๋อง (1/4GL)',
    desc: 'สีกระป๋องเล็กขนาด 1/4 แกลลอน',
    enabled: true,
  },
];

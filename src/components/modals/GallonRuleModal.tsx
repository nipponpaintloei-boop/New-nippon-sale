import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Save,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Package,
  DollarSign,
  Award,
  TrendingUp,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { GALLON_TIERS } from '../../data/constants';
import {
  GallonIncentiveRule,
  IncentiveConditionType,
  RuleEvaluationResult,
} from '../../types';
import { evaluateGallonRule, fmt } from '../../services/calculations';

interface GallonRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GallonRuleModal: React.FC<GallonRuleModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, products, sales, activeMonth } = useAppState();

  const monthSales = useMemo(() => {
    return sales.filter((s) => s.date.startsWith(activeMonth));
  }, [sales, activeMonth]);

  // Unique product names for dropdown
  const productOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.name) set.add(p.name);
    });
    sales.forEach((s) => {
      if (s.name) set.add(s.name);
    });
    return Array.from(set).sort();
  }, [products, sales]);

  const initialRules: GallonIncentiveRule[] = useMemo(() => {
    if (settings?.gallonRules && settings.gallonRules.length > 0) {
      return settings.gallonRules;
    }
    return GALLON_TIERS;
  }, [settings?.gallonRules]);

  const [rules, setRules] = useState<GallonIncentiveRule[]>(initialRules);
  const [activeTab, setActiveTab] = useState<'custom' | 'standard'>('custom');

  // Add / Edit Rule State
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formProductName, setFormProductName] = useState<string>('');
  const [formSize, setFormSize] = useState<string>('ALL');
  const [formConditionType, setFormConditionType] = useState<IncentiveConditionType>('per_unit');
  const [formRatePerUnit, setFormRatePerUnit] = useState<number>(50);
  const [formBundleSize, setFormBundleSize] = useState<number>(4);
  const [formBundleReward, setFormBundleReward] = useState<number>(200);
  const [formMinRevenue, setFormMinRevenue] = useState<number>(200000);
  const [formMinQty, setFormMinQty] = useState<number>(4);

  // Split into custom and standard rules
  const customRules = rules.filter((r) => r.conditionType !== 'size_standard');
  const standardRules = rules.filter((r) => r.conditionType === 'size_standard');

  if (!isOpen) return null;

  // Real-time evaluation of all rules against monthSales
  const evaluatedRulesMap = new Map<string, RuleEvaluationResult>();
  rules.forEach((r, idx) => {
    const key = r.id || `rule-${idx}`;
    evaluatedRulesMap.set(key, evaluateGallonRule(r, monthSales));
  });

  // Open Form for New Rule
  const handleOpenNewForm = (presetType?: IncentiveConditionType) => {
    const firstProd = productOptions[0] || 'สีน้ำทาภายนอก Nippon';
    setEditingRuleId(null);
    setFormSize('ALL');
    setFormProductName(firstProd);

    if (presetType === 'bundle') {
      setFormConditionType('bundle');
      setFormName(`${firstProd} ขายครบ 4 ถัง รับ 200 บ.`);
      setFormBundleSize(4);
      setFormBundleReward(200);
      setFormRatePerUnit(50);
      setFormMinRevenue(200000);
      setFormMinQty(4);
    } else if (presetType === 'revenue_threshold') {
      setFormConditionType('revenue_threshold');
      setFormName(`${firstProd} ยอดขายถึง 200,000 บ. จ่ายถังละ 50 บ.`);
      setFormMinRevenue(200000);
      setFormRatePerUnit(50);
      setFormBundleSize(4);
      setFormBundleReward(200);
      setFormMinQty(4);
    } else if (presetType === 'min_qty_per_unit') {
      setFormConditionType('min_qty_per_unit');
      setFormName(`${firstProd} ขายครบขั้นต่ำ 4 ถัง จ่ายถังละ 50 บ.`);
      setFormMinQty(4);
      setFormRatePerUnit(50);
      setFormBundleSize(4);
      setFormBundleReward(200);
      setFormMinRevenue(200000);
    } else {
      // Default per_unit
      setFormConditionType('per_unit');
      setFormName(`${firstProd} ค่ารายถัง 50 บ.`);
      setFormRatePerUnit(50);
      setFormBundleSize(4);
      setFormBundleReward(200);
      setFormMinRevenue(200000);
      setFormMinQty(4);
    }

    setIsFormOpen(true);
    setActiveTab('custom');
  };

  // Open Form for Editing Existing Rule
  const handleEditRule = (rule: GallonIncentiveRule) => {
    setEditingRuleId(rule.id || null);
    setFormName(rule.name || rule.label || '');
    setFormProductName(rule.productName || '');
    setFormSize(rule.size || 'ALL');
    setFormConditionType(rule.conditionType || 'per_unit');
    setFormRatePerUnit(rule.ratePerUnit ?? rule.rate ?? 50);
    setFormBundleSize(rule.bundleSize ?? 4);
    setFormBundleReward(rule.bundleReward ?? 200);
    setFormMinRevenue(rule.minRevenueRequired ?? 200000);
    setFormMinQty(rule.minQtyRequired ?? 4);
    setIsFormOpen(true);
  };

  // Save Rule from Form
  const handleSaveForm = () => {
    const newRule: GallonIncentiveRule = {
      id: editingRuleId || `custom-rule-${Date.now()}`,
      name: formName.trim() || `${formProductName || 'สินค้า'} (${getConditionLabel(formConditionType)})`,
      productName: formProductName.trim(),
      targetType: formProductName ? 'specific_product' : 'all',
      size: formSize,
      conditionType: formConditionType,
      ratePerUnit: Number(formRatePerUnit) || 0,
      rate: Number(formRatePerUnit) || 0,
      bundleSize: Number(formBundleSize) || 4,
      bundleReward: Number(formBundleReward) || 200,
      minRevenueRequired: Number(formMinRevenue) || 0,
      minQtyRequired: Number(formMinQty) || 0,
      enabled: true,
      label: formName.trim(),
      desc: getConditionSummaryText({
        conditionType: formConditionType,
        ratePerUnit: formRatePerUnit,
        bundleSize: formBundleSize,
        bundleReward: formBundleReward,
        minRevenueRequired: formMinRevenue,
        minQtyRequired: formMinQty,
      }),
    };

    if (editingRuleId) {
      setRules((prev) => prev.map((r) => (r.id === editingRuleId ? newRule : r)));
    } else {
      setRules((prev) => [newRule, ...prev]);
    }

    setIsFormOpen(false);
    setEditingRuleId(null);
  };

  // Toggle Rule Enable/Disable
  const handleToggleRule = (id?: string) => {
    if (!id) return;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: r.enabled === false ? true : false } : r))
    );
  };

  // Delete Custom Rule
  const handleDeleteRule = (id?: string) => {
    if (!id) return;
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Change rate on standard tiers
  const handleStandardRateChange = (id?: string, rate?: number) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, rate: Number(rate) || 0, ratePerUnit: Number(rate) || 0 } : r
      )
    );
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    setRules(GALLON_TIERS);
    setIsFormOpen(false);
  };

  // Save All Changes to AppState
  const handleSaveAll = async () => {
    await updateSettings({ gallonRules: rules });
    onClose();
  };

  // Live simulation for the active form
  const formPreviewRule: GallonIncentiveRule = {
    name: formName,
    productName: formProductName,
    targetType: formProductName ? 'specific_product' : 'all',
    size: formSize,
    conditionType: formConditionType,
    ratePerUnit: formRatePerUnit,
    bundleSize: formBundleSize,
    bundleReward: formBundleReward,
    minRevenueRequired: formMinRevenue,
    minQtyRequired: formMinQty,
    enabled: true,
  };
  const formPreviewEval = evaluateGallonRule(formPreviewRule, monthSales);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>ตั้งเกณฑ์เงินรางวัลค่าถัง (Gallon Incentives)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
                  ปรับแต่งได้
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดเงินรางวัลรายถัง, ขายครบชุด (Bundle) หรือจ่ายเมื่อยอดขายรวมถึงเป้าหมาย
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

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('custom');
                setIsFormOpen(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>เกณฑ์พิเศษรายสินค้า ({customRules.length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('standard');
                setIsFormOpen(false);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'standard'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>เกณฑ์มาตรฐานตามขนาด ({standardRules.length})</span>
            </button>
          </div>

          {activeTab === 'custom' && !isFormOpen && (
            <button
              onClick={() => handleOpenNewForm('per_unit')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มเกณฑ์ใหม่</span>
            </button>
          )}
        </div>

        {/* Modal Body Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ================= FORM MODE ================= */}
          {isFormOpen ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingRuleId ? 'แก้ไขเกณฑ์เงินรางวัล' : 'สร้างเกณฑ์เงินรางวัลใหม่'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ปิดฟอร์ม
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  เลือกประเภทเกณฑ์สำเร็จรูป:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormConditionType('per_unit');
                      setFormRatePerUnit(50);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      formConditionType === 'per_unit'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🎯 รายถัง</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ถังละ 50 บ.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormConditionType('bundle');
                      setFormBundleSize(4);
                      setFormBundleReward(200);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      formConditionType === 'bundle'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>📦 ครบชุด</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ทุก 4 ถัง จ่าย 200 บ.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormConditionType('revenue_threshold');
                      setFormMinRevenue(200000);
                      setFormRatePerUnit(50);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      formConditionType === 'revenue_threshold'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🏆 ยอดขายถึงเป้า</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ถึง 200k จ่าย 50 บ./ถัง</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormConditionType('min_qty_per_unit');
                      setFormMinQty(4);
                      setFormRatePerUnit(50);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                      formConditionType === 'min_qty_per_unit'
                        ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-500 text-amber-900 dark:text-amber-200 font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1">
                      <span>🔢 ขั้นต่ำจำนวน</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">ขั้นต่ำ 4 ถัง จ่าย 50 บ.</div>
                  </button>
                </div>
              </div>

              {/* Form Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rule Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ชื่อเกณฑ์ / โปรโมชั่น
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="เช่น สินค้า A ได้ค่าถัง 50 บ."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Target Product */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    สินค้าเป้าหมาย
                  </label>
                  <select
                    value={formProductName}
                    onChange={(e) => {
                      setFormProductName(e.target.value);
                      if (!formName || formName.includes('ค่ารายถัง') || formName.includes('ขายครบ')) {
                        setFormName(`${e.target.value || 'สินค้าทั้งหมด'} (${getConditionLabel(formConditionType)})`);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- ใช้กับสินค้าทั้งหมด (All Products) --</option>
                    {productOptions.map((p, idx) => (
                      <option key={idx} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Size */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    ขนาดบรรจุ
                  </label>
                  <select
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-850 text-xs text-slate-900 dark:text-white font-mono"
                  >
                    <option value="ALL">ทุกขนาด (All Sizes)</option>
                    <option value="5GL">5GL (ถังใหญ่)</option>
                    <option value="2.5GL">2.5GL (ถังกลาง)</option>
                    <option value="1GL">1GL (แกลลอน)</option>
                    <option value="1/4GL">1/4GL (กระป๋อง)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Condition Parameters */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>กำหนดตัวเลขเงื่อนไขและเงินรางวัล</span>
                </div>

                {formConditionType === 'per_unit' && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        เงินรางวัลต่อถัง
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formRatePerUnit}
                          onChange={(e) => setFormRatePerUnit(Number(e.target.value))}
                          className="w-28 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          บาท / ถัง
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {formConditionType === 'bundle' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        จำนวนถังต่อชุด
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={formBundleSize}
                          onChange={(e) => setFormBundleSize(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                        />
                        <span className="text-xs text-slate-500 font-medium">ถัง</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        เงินรางวัลต่อชุด
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formBundleReward}
                          onChange={(e) => setFormBundleReward(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-emerald-600"
                        />
                        <span className="text-xs text-slate-500 font-medium">บาท</span>
                      </div>
                    </div>
                  </div>
                )}

                {formConditionType === 'revenue_threshold' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        ยอดขายรวมขั้นต่ำเพื่อปลดล็อก
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={formMinRevenue}
                          onChange={(e) => setFormMinRevenue(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                        />
                        <span className="text-xs text-slate-500 font-medium">บาท</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        เมื่อปลดล็อกแล้ว จ่ายค่าถัง
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formRatePerUnit}
                          onChange={(e) => setFormRatePerUnit(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-emerald-600"
                        />
                        <span className="text-xs text-slate-500 font-medium">บาท/ถัง</span>
                      </div>
                    </div>
                  </div>
                )}

                {formConditionType === 'min_qty_per_unit' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        ต้องขายได้อย่างน้อย
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={formMinQty}
                          onChange={(e) => setFormMinQty(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                        />
                        <span className="text-xs text-slate-500 font-medium">ถังขึ้นไป</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300 block mb-1">
                        เมื่อถึงขั้นต่ำ จ่ายถังละ
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={formRatePerUnit}
                          onChange={(e) => setFormRatePerUnit(Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-emerald-600"
                        />
                        <span className="text-xs text-slate-500 font-medium">บาท/ถัง</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Preview / Simulation Card */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>ทดสอบคำนวณกับยอดขายเดือนนี้ ({activeMonth}):</span>
                  <span
                    className={`font-mono font-bold ${
                      formPreviewEval.earnedAmount > 0 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    รางวัลที่ได้: {fmt(formPreviewEval.earnedAmount)} บาท
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>{formPreviewEval.progressText}</span>
                  <span className="font-mono text-slate-400">
                    (ขายได้ {formPreviewEval.matchedQty} ถัง | ยอด {fmt(formPreviewEval.matchedRevenue)} บ.)
                  </span>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingRuleId ? 'บันทึกการแก้ไข' : 'เพิ่มเกณฑ์นี้'}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* ================= CUSTOM RULES TAB ================= */}
          {activeTab === 'custom' && !isFormOpen && (
            <div className="space-y-3">
              {customRules.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 mx-auto flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      ยังไม่มีเกณฑ์พิเศษรายสินค้า
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      สามารถสร้างเงื่อนไขพิเศษ เช่น จ่ายรายถัง 50 บ., ขายครบ 4 ถัง จ่าย 200 บ.,
                      หรือยอดขายรวมถึง 200,000 บ. จ่ายถังละ 50 บ.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => handleOpenNewForm('per_unit')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>🎯 เพิ่มเกณฑ์จ่ายรายถัง</span>
                    </button>
                    <button
                      onClick={() => handleOpenNewForm('bundle')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>📦 เพิ่มเกณฑ์ขายครบชุด (Bundle)</span>
                    </button>
                    <button
                      onClick={() => handleOpenNewForm('revenue_threshold')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>🏆 เพิ่มเกณฑ์ยอดถึง 200k</span>
                    </button>
                  </div>
                </div>
              ) : (
                customRules.map((rule, idx) => {
                  const evalRes = evaluatedRulesMap.get(rule.id || `rule-${idx}`) || {
                    matchedQty: 0,
                    matchedRevenue: 0,
                    isQualified: false,
                    progressPct: 0,
                    progressText: '',
                    earnedAmount: 0,
                    details: '',
                  };

                  const isEnabled = rule.enabled !== false;

                  return (
                    <div
                      key={rule.id || idx}
                      className={`p-4 rounded-2xl border transition-all space-y-3 ${
                        isEnabled
                          ? 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/40 dark:border-slate-800/40 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {rule.name || rule.label}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              {getConditionBadgeText(rule)}
                            </span>
                            {rule.size && rule.size !== 'ALL' && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                {rule.size}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {rule.desc || getConditionSummaryText(rule)}
                          </p>
                        </div>

                        {/* Control Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Enable/Disable Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule.id)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                              isEnabled
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}
                          >
                            {isEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          </button>
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleEditRule(rule)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Simulation Progress & Reward Bar */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              evalRes.earnedAmount > 0
                                ? 'bg-emerald-500'
                                : evalRes.isQualified
                                ? 'bg-amber-500'
                                : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          />
                          <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                            {evalRes.progressText}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {evalRes.earnedAmount > 0 ? `+${fmt(evalRes.earnedAmount)} บ.` : '0 บ.'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= STANDARD SIZE TIERS TAB ================= */}
          {activeTab === 'standard' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  เกณฑ์มาตรฐานจะคิดคำนวณอัตโนมัติตามขนาดถังสำหรับทุกสินค้าที่ขายได้
                  (ยกเว้นสินค้าที่ถูกคำนวณในเกณฑ์พิเศษรายสินค้าแล้ว)
                </p>
              </div>

              <div className="space-y-2">
                {standardRules.map((rule) => {
                  const isEnabled = rule.enabled !== false;
                  return (
                    <div
                      key={rule.id || rule.size}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-mono font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {rule.size}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {rule.label || rule.name}
                          </span>
                          <span className="text-[11px] text-slate-400">{rule.desc}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={rule.rate ?? rule.ratePerUnit ?? 0}
                          onChange={(e) => handleStandardRateChange(rule.id, Number(e.target.value))}
                          className="w-20 text-center px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
                        />
                        <span className="text-slate-500 font-medium">บาท/ถัง</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกเกณฑ์ทั้งหมด</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to return friendly badge text
function getConditionBadgeText(rule: GallonIncentiveRule): string {
  switch (rule.conditionType) {
    case 'bundle':
      return `ชุดละ ${rule.bundleSize || 4} ถัง = ${rule.bundleReward || 200} บ.`;
    case 'revenue_threshold':
      return `ยอดถึง ${fmt(rule.minRevenueRequired || 200000)} บ. -> ${rule.ratePerUnit || 50} บ./ถัง`;
    case 'min_qty_per_unit':
      return `ขั้นต่ำ ${rule.minQtyRequired || 4} ถัง -> ${rule.ratePerUnit || 50} บ./ถัง`;
    case 'per_unit':
    default:
      return `${rule.ratePerUnit || rule.rate || 50} บ./ถัง`;
  }
}

function getConditionLabel(type?: IncentiveConditionType): string {
  switch (type) {
    case 'bundle':
      return 'ขายครบชุด';
    case 'revenue_threshold':
      return 'ยอดถึงเป้า';
    case 'min_qty_per_unit':
      return 'ขั้นต่ำจำนวนถัง';
    case 'per_unit':
    default:
      return 'รายถัง';
  }
}

function getConditionSummaryText(rule: Partial<GallonIncentiveRule>): string {
  switch (rule.conditionType) {
    case 'bundle':
      return `ต้องขายครบทุกๆ ${rule.bundleSize || 4} ถัง ถึงจะจ่ายรางวัลชุดละ ${rule.bundleReward || 200} บาท`;
    case 'revenue_threshold':
      return `ต้องมียอดขายสินค้านี้รวมกันถึง ${fmt(rule.minRevenueRequired || 200000)} บาท จึงจะจ่ายรายถังตามจำนวนที่ขายได้จริง ถังละ ${rule.ratePerUnit || 50} บาท`;
    case 'min_qty_per_unit':
      return `ต้องขายสินค้านี้ได้อย่างน้อย ${rule.minQtyRequired || 4} ถังขึ้นไป จึงจะจ่ายรายถังตามจำนวนที่ขายได้จริง ถังละ ${rule.ratePerUnit || 50} บาท`;
    case 'per_unit':
    default:
      return `จ่ายเงินรางวัลตามจำนวนถังที่ขายได้ทันที ถังละ ${rule.ratePerUnit || rule.rate || 50} บาท`;
  }
}

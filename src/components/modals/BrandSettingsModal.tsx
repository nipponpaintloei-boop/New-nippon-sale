import React, { useState, useEffect } from 'react';
import { X, Palette, Check, Store, Building, Sparkles, Image, RefreshCw } from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { BrandConfig, BrandProfile } from '../../types';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_BRANDS = [
  { key: 'SALE_PAINT_PRO', name: 'Sale Paint Pro', subTitle: 'ระบบบริหารงานขายสีและสต็อกมืออาชีพ', themeColor: 'blue' as const, badgeText: 'PRO' },
  { key: 'NIPPON', name: 'NIPPON SALE', subTitle: 'ระบบบริหารงานขายสีนิปปอนเพนต์', themeColor: 'red' as const, badgeText: 'PRO' },
  { key: 'TOA', name: 'TOA SALE', subTitle: 'ระบบบริหารงานขายสีทีโอเอ', themeColor: 'emerald' as const, badgeText: 'PRO' },
  { key: 'JOTUN', name: 'JOTUN SALE', subTitle: 'ระบบบริหารงานขายสีโจตัน', themeColor: 'blue' as const, badgeText: 'PRO' },
  { key: 'DULUX', name: 'DULUX SALE', subTitle: 'ระบบบริหารงานขายสีดูลักซ์', themeColor: 'violet' as const, badgeText: 'PRO' },
  { key: 'BEGER', name: 'BEGER SALE', subTitle: 'ระบบบริหารงานขายสีเบเยอร์', themeColor: 'amber' as const, badgeText: 'PRO' },
  { key: 'CAPTAIN', name: 'CAPTAIN SALE', subTitle: 'ระบบบริหารงานขายสีกัปตัน', themeColor: 'teal' as const, badgeText: 'PRO' },
  { key: 'DELTA', name: 'DELTA SALE', subTitle: 'ระบบบริหารงานขายสีเดลต้า', themeColor: 'slate' as const, badgeText: 'PRO' },
  { key: 'JBP', name: 'JBP SALE', subTitle: 'ระบบบริหารงานขายสี JBP', themeColor: 'violet' as const, badgeText: 'PRO' },
];

const THEME_OPTIONS = [
  { id: 'red', name: 'แดง (Red)', bgClass: 'bg-red-500' },
  { id: 'blue', name: 'น้ำเงิน (Blue)', bgClass: 'bg-blue-600' },
  { id: 'emerald', name: 'เขียว (Emerald)', bgClass: 'bg-emerald-600' },
  { id: 'violet', name: 'ม่วง (Violet)', bgClass: 'bg-violet-600' },
  { id: 'amber', name: 'ส้ม/ทอง (Amber)', bgClass: 'bg-amber-500' },
  { id: 'teal', name: 'เขียวน้ำทะเล (Teal)', bgClass: 'bg-teal-600' },
  { id: 'slate', name: 'เทาเข้ม (Dark Slate)', bgClass: 'bg-slate-700' },
];

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings } = useAppState();

  const [brandName, setBrandName] = useState<string>('Sale Paint Pro');
  const [subTitle, setSubTitle] = useState<string>('ระบบบริหารงานขายสีและสต็อก');
  const [branchName, setBranchName] = useState<string>('สาขาเลย (Loei Branch)');
  const [badgeText, setBadgeText] = useState<string>('PRO');
  const [themeColor, setThemeColor] = useState<'red' | 'blue' | 'emerald' | 'violet' | 'amber' | 'teal' | 'slate'>('blue');
  const [logoImageUrl, setLogoImageUrl] = useState<string>('');
  const [selectedBrandKey, setSelectedBrandKey] = useState<string>('SALE_PAINT_PRO');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const activeKey = settings.activeBrandKey || 'SALE_PAINT_PRO';
      const profile = settings.brandProfiles?.[activeKey];
      const cfg = profile?.brandConfig || settings.brandConfig;
      setSelectedBrandKey(activeKey);
      if (cfg) {
        setBrandName(cfg.brandName || 'Sale Paint Pro');
        setSubTitle(cfg.subTitle || 'ระบบบริหารงานขายสีและสต็อก');
        setBranchName(cfg.branchName || 'สาขาเลย (Loei Branch)');
        setBadgeText(cfg.badgeText || 'PRO');
        setThemeColor(cfg.themeColor || 'blue');
        setLogoImageUrl(cfg.logoImageUrl || '');
      } else {
        setBrandName('Sale Paint Pro');
        setSubTitle('ระบบบริหารงานขายสีและสต็อก');
        setBranchName('สาขาเลย (Loei Branch)');
        setBadgeText('PRO');
        setThemeColor('blue');
        setLogoImageUrl('');
      }
      setSavedSuccess(false);
    }
  }, [isOpen, settings]);


  const handleApplyPreset = (preset: typeof PRESET_BRANDS[number]) => {
    setSelectedBrandKey(preset.key);
    const existing = settings.brandProfiles?.[preset.key];
    if (existing) {
      const cfg = existing.brandConfig;
      setBrandName(cfg.brandName || preset.name);
      setSubTitle(cfg.subTitle || preset.subTitle);
      setBranchName(cfg.branchName || settings.brandConfig?.branchName || 'สาขาเลย (Loei Branch)');
      setBadgeText(cfg.badgeText || preset.badgeText);
      setThemeColor(cfg.themeColor || preset.themeColor);
      setLogoImageUrl(cfg.logoImageUrl || '');
      return;
    }

    // New brand profiles start from the current sales/commission configuration.
    // Nothing is invented for pricing or commission; those remain editable through the existing modals.
    setBrandName(preset.name);
    setSubTitle(preset.subTitle);
    setThemeColor(preset.themeColor);
    setBadgeText(preset.badgeText);
    setLogoImageUrl('');
  };


  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const key = selectedBrandKey || brandName.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_') || 'SALE_PAINT_PRO';
    const updatedBrandConfig: BrandConfig = {
      brandName: brandName.trim() || 'Sale Paint Pro',
      subTitle: subTitle.trim() || 'ระบบบริหารงานขายสีและสต็อก',
      branchName: branchName.trim() || 'สาขาหลัก',
      badgeText: badgeText.trim() || 'PRO',
      themeColor,
      logoImageUrl: logoImageUrl.trim() || undefined,
    };

    const existingProfile = settings.brandProfiles?.[key];
    const updatedProfile: BrandProfile = {
      key,
      brandConfig: updatedBrandConfig,
      targets: { ...(existingProfile?.targets || settings.targets || {}) },
      headcounts: { ...(existingProfile?.headcounts || settings.headcounts || {}) },
      commissionTiers: existingProfile?.commissionTiers?.map((r) => ({ ...r })) || settings.commissionTiers?.map((r) => ({ ...r })),
      gallonIncentives: Object.fromEntries(
        Object.entries(existingProfile?.gallonIncentives || settings.gallonIncentives || {}).map(([month, rules]) => [month, rules.map((r) => ({ ...r }))])
      ),
      updatedAt: new Date().toISOString(),
    };

    const updatedProfiles: Record<string, BrandProfile> = {
      ...(settings.brandProfiles || {}),
      [key]: updatedProfile,
    };

    await updateSettings({
      brandConfig: updatedBrandConfig,
      activeBrandKey: key,
      brandProfiles: updatedProfiles,
      targets: { ...updatedProfile.targets },
      headcounts: { ...(updatedProfile.headcounts || {}) },
      commissionTiers: updatedProfile.commissionTiers,
      gallonIncentives: { ...(updatedProfile.gallonIncentives || {}) },
    });

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleResetToDefault = () => {
    setSelectedBrandKey('SALE_PAINT_PRO');
    setBrandName('Sale Paint Pro');
    setSubTitle('ระบบบริหารงานขายสีและสต็อก');
    setBranchName('สาขาเลย (Loei Branch)');
    setBadgeText('PRO');
    setThemeColor('blue');
    setLogoImageUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ปรับแต่งแบรนด์ & โปรไฟล์ร้านค้า
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เปลี่ยนชื่อแบรนด์, สีธีม, โลโก้ และสาขา เพื่อใช้กับทุกแบรนด์สี
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            ตัวอย่างโลโก้และชื่อแบรนด์ที่จะแสดงในระบบ:
          </span>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            {logoImageUrl ? (
              <img
                src={logoImageUrl}
                alt={brandName}
                className="w-10 h-10 rounded-xl object-contain bg-slate-50 border p-1"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm ${
                  themeColor === 'red'
                    ? 'bg-gradient-to-br from-red-500 to-rose-700'
                    : themeColor === 'emerald'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                    : themeColor === 'violet'
                    ? 'bg-gradient-to-br from-violet-500 to-purple-700'
                    : themeColor === 'amber'
                    ? 'bg-gradient-to-br from-amber-500 to-orange-700'
                    : themeColor === 'teal'
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-700'
                    : themeColor === 'slate'
                    ? 'bg-gradient-to-br from-slate-600 to-slate-900'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-700'
                }`}
              >
                {brandName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 dark:text-white text-base">
                  {brandName}
                </span>
                {badgeText && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {badgeText}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subTitle}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {branchName}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            เลือก / สลับโปรไฟล์แบรนด์:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_BRANDS.map((b) => (
              <button
                key={b.name}
                type="button"
                onClick={() => handleApplyPreset(b)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  brandName === b.name
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">การสลับแบรนด์จะมีผลเมื่อกด “บันทึกการตั้งค่า” และแต่ละแบรนด์จะเก็บเป้า/คอมมิชชั่นของตัวเองไว้</p>
        </div>

        {/* Brand Customization Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ชื่อแบรนด์หรือร้านค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="เช่น Sale Paint Pro, TOA, Nippon"
                className="w-full text-xs font-bold px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ป้ายกำกับ (Badge)
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="เช่น PRO, VIP, SALE"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              คำอธิบายใต้ชื่อแบรนด์ (Subtitle)
            </label>
            <input
              type="text"
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="เช่น ระบบบริหารงานขายสีและสต็อก"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ชื่อสาขา / หน่วยงาน
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="เช่น สาขาเลย (Loei Branch), สาขาขอนแก่น"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Theme Color Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              โทนสีธีมของแอพ (Theme Color):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {THEME_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeColor(t.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer transition-all ${
                    themeColor === t.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${t.bgClass} flex-shrink-0`} />
                  <span className="truncate">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Logo URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ลิงก์รูปภาพโลโก้แบรนด์ (URL รูปภาพ ถ้ามี)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={logoImageUrl}
                onChange={(e) => setLogoImageUrl(e.target.value)}
                placeholder="https://example.com/logo.png (เว้นว่างไว้เพื่อใช้ไอคอนอัตโนมัติ)"
                className="flex-1 text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {logoImageUrl && (
                <button
                  type="button"
                  onClick={() => setLogoImageUrl('')}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>คืนค่าเริ่มต้น</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกเรียบร้อย!</span>
                  </>
                ) : (
                  <span>บันทึกการตั้งค่าแบรนด์</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Plus,
  ShoppingCart,
  Trash2,
  Check,
  Search,
  User,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAppState } from '../../context/AppStateContext';
import { SaleEntry, Product } from '../../types';
import { buildProductIndexes } from '../../services/stockService';
import { fmt, todayISO } from '../../services/calculations';

interface SalesEntryViewProps {
  onSaleSaved?: () => void;
  onEditSale?: (sale: SaleEntry) => void;
  onDeleteSale?: (id: string) => void;
}

export const SalesEntryView: React.FC<SalesEntryViewProps> = ({
  onSaleSaved,
  onEditSale,
  onDeleteSale,
}) => {
  const { products, sales, addSalesEntries } = useAppState();
  const [date, setDate] = useState<string>(todayISO());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [selectedFilmColor, setSelectedFilmColor] = useState<string>('');
  const [colorCode, setColorCode] = useState<string>('');
  const [tintPrice, setTintPrice] = useState<string>('');
  const [qty, setQty] = useState<string>('1');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [billCart, setBillCart] = useState<SaleEntry[]>([]);
  const [billId, setBillId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const indexes = useMemo(() => buildProductIndexes(products), [products]);

  // Product suggestions
  const productSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return indexes.productNames
      .filter((name) => name.toLowerCase().includes(term))
      .slice(0, 10);
  }, [searchTerm, indexes]);

  // Sizes for selected product
  const availableSizes = useMemo(() => {
    if (!selectedProduct || !indexes.productIndex[selectedProduct]) return [];
    return Object.keys(indexes.productIndex[selectedProduct]);
  }, [selectedProduct, indexes]);

  // Bases for selected product and size
  const availableBases = useMemo(() => {
    if (!selectedProduct || !selectedSize || !indexes.productIndex[selectedProduct]?.[selectedSize])
      return [];
    return Object.keys(indexes.productIndex[selectedProduct][selectedSize]);
  }, [selectedProduct, selectedSize, indexes]);

  // Film finishes available for the selected product variant
  const availableFilmColors = useMemo(() => {
    if (!selectedProduct || !selectedSize || !selectedBase) return [];
    const filmMap = indexes.filmColorIndex[selectedProduct]?.[selectedSize]?.[selectedBase];
    if (!filmMap) return [];
    return Object.keys(filmMap)
      .filter((key) => key !== '__NO_FILM_COLOR__')
      .sort((a, b) => a.localeCompare(b, 'th'))
      .map((key) => ({ key, value: key }));
  }, [selectedProduct, selectedSize, selectedBase, indexes]);

  // Color numbers available for the selected product + film finish
  const availableColorCodes = useMemo(() => {
    if (!selectedProduct || !selectedSize || !selectedBase) return [];
    const filmMap = indexes.filmColorIndex[selectedProduct]?.[selectedSize]?.[selectedBase];
    if (!filmMap) return [];
    const filmKey = selectedFilmColor.trim() || '__NO_FILM_COLOR__';
    const colorMap = filmMap[filmKey];
    if (!colorMap) return [];
    return Object.keys(colorMap)
      .map((key) => {
        const product = colorMap[key] as Product;
        return { key, value: product.colorCode || '' };
      })
      .filter((x) => x.value)
      .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
  }, [selectedProduct, selectedSize, selectedBase, selectedFilmColor, indexes]);

  // Current matched product row
  const matchedRow: Product | null = useMemo(() => {
    if (!selectedProduct || !selectedSize || !selectedBase) return null;
    const filmMap = indexes.filmColorIndex[selectedProduct]?.[selectedSize]?.[selectedBase];
    if (!filmMap) return null;
    const filmKey = selectedFilmColor.trim() || '__NO_FILM_COLOR__';
    const colorMap = filmMap[filmKey];
    if (!colorMap) return null;
    const colorKey = colorCode.trim() || '__NO_COLOR__';
    // For mix/base products, the color code can be entered manually even when
    // that exact code does not exist as a Product row. In that case use the
    // variant's no-color row as the pricing/SKU source.
    return (
      colorMap[colorKey] ||
      colorMap['__NO_COLOR__'] ||
      (availableColorCodes.length === 1 ? colorMap[availableColorCodes[0].key] : null) ||
      null
    );
  }, [selectedProduct, selectedSize, selectedBase, selectedFilmColor, colorCode, availableColorCodes, indexes]);

  const unitPrice = matchedRow ? matchedRow.price : 0;

  const currentTotal = useMemo(() => {
    const q = Number(qty) || 0;
    const t = Number(tintPrice) || 0;
    return (unitPrice + t) * q;
  }, [unitPrice, tintPrice, qty]);

  const selectFirstFilmAndColor = (name: string, size: string, base: string) => {
    const filmMap = indexes.filmColorIndex[name]?.[size]?.[base] || {};
    const filmKeys = Object.keys(filmMap).filter((k) => k !== '__NO_FILM_COLOR__');
    const nextFilm = filmKeys.length === 1 ? filmKeys[0] : (filmKeys[0] || '');
    setSelectedFilmColor(nextFilm);

    const colorMap = filmMap[nextFilm || '__NO_FILM_COLOR__'] || {};
    const firstColor = Object.keys(colorMap).find((k) => k !== '__NO_COLOR__');
    setColorCode(firstColor ? (colorMap[firstColor]?.colorCode || '') : '');
  };

  const handleSelectProduct = (name: string) => {
    setSelectedProduct(name);
    setSearchTerm(name);
    const sizes = Object.keys(indexes.productIndex[name] || {});
    if (sizes.length > 0) {
      const defaultSize = sizes[0];
      setSelectedSize(defaultSize);
      const bases = Object.keys(indexes.productIndex[name][defaultSize] || {});
      const defaultBase = bases.length > 0 ? bases[0] : 'มาตรฐาน';
      setSelectedBase(defaultBase);
      selectFirstFilmAndColor(name, defaultSize, defaultBase);
    } else {
      setSelectedSize('มาตรฐาน');
      setSelectedBase('มาตรฐาน');
      setSelectedFilmColor('');
      setColorCode('');
    }
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    if (selectedProduct && indexes.productIndex[selectedProduct]?.[size]) {
      const bases = Object.keys(indexes.productIndex[selectedProduct][size]);
      const nextBase = bases.includes(selectedBase) ? selectedBase : (bases[0] || 'มาตรฐาน');
      setSelectedBase(nextBase);
      selectFirstFilmAndColor(selectedProduct, size, nextBase);
    }
  };

  const handleSelectBase = (base: string) => {
    setSelectedBase(base);
    if (selectedProduct && selectedSize) {
      selectFirstFilmAndColor(selectedProduct, selectedSize, base);
    }
  };

  const handleSelectFilmColor = (film: string) => {
    setSelectedFilmColor(film);
    const filmMap = indexes.filmColorIndex[selectedProduct]?.[selectedSize]?.[selectedBase] || {};
    const colorMap = filmMap[film || '__NO_FILM_COLOR__'] || {};
    const firstColor = Object.keys(colorMap).find((k) => k !== '__NO_COLOR__');
    setColorCode(firstColor ? (colorMap[firstColor]?.colorCode || '') : '');
  };

  const handleSelectColorCode = (code: string) => {
    setColorCode(code);
  };

  const ensureBillId = (): string => {
    if (!billId) {
      const newId = 'bill-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      setBillId(newId);
      return newId;
    }
    return billId;
  };

  const buildEntryFromForm = (): SaleEntry | null => {
    if (!matchedRow) return null;
    const q = Number(qty) || 0;
    if (q <= 0) return null;
    const t = Number(tintPrice) || 0;
    const currentBId = ensureBillId();

    return {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      date: date || todayISO(),
      name: selectedProduct,
      size: selectedSize === 'มาตรฐาน' ? '' : selectedSize,
      base: selectedBase === 'มาตรฐาน' ? '' : selectedBase,
      filmColor: selectedFilmColor.trim(),
      price: matchedRow.price,
      colorCode: colorCode.trim(),
      tintPrice: t,
      qty: q,
      total: (matchedRow.price + t) * q,
      sku: matchedRow.sku,
      seed: false,
      billId: currentBId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    };
  };

  const clearEntryFieldsOnly = () => {
    setSearchTerm('');
    setSelectedProduct('');
    setSelectedSize('');
    setSelectedBase('');
    setSelectedFilmColor('');
    setColorCode('');
    setTintPrice('');
    setQty('1');
  };

  const handleAddToCart = () => {
    const entry = buildEntryFromForm();
    if (!entry) {
      setStatusMessage('กรุณาเลือกสินค้า ขนาด เบส และจำนวนให้ถูกต้อง');
      return;
    }
    setBillCart((prev) => [...prev, entry]);
    clearEntryFieldsOnly();
    setStatusMessage('เพิ่มรายการลงในบิลแล้ว');
    setTimeout(() => setStatusMessage(''), 2000);
  };

  const handleRemoveFromCart = (index: number) => {
    setBillCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveBill = async () => {
    let entriesToSave = [...billCart];
    if (entriesToSave.length === 0) {
      const single = buildEntryFromForm();
      if (!single) {
        setStatusMessage('กรุณากรอกข้อมูลสินค้าให้ถูกต้อง');
        return;
      }
      entriesToSave = [single];
    }
    await addSalesEntries(entriesToSave);
    setBillCart([]);
    setBillId('');
    clearEntryFieldsOnly();
    setCustomerName('');
    setCustomerPhone('');
    setStatusMessage(`บันทึกการขายสำเร็จ (${entriesToSave.length} รายการ)`);
    setTimeout(() => setStatusMessage(''), 3000);
    if (onSaleSaved) onSaleSaved();
  };

  // Today's sales
  const todaySales = useMemo(() => {
    return sales.filter((s) => s.date === date);
  }, [sales, date]);

  const todayTotal = useMemo(() => {
    return todaySales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  }, [todaySales]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 lg:pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบบันทึกบิลขาย</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            บันทึกรายการขาย (Sales Entry)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            บันทึกแบบเดี่ยวหรือรวมหลายรายการในบิลเดียว ตัดสต็อกอัตโนมัติ
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Two Column Layout on Desktop: Left Entry Form, Right Cart & Today Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
          {/* Customer Section */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              ข้อมูลลูกค้า (ระบุหรือไม่ก็ได้)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="ชื่อลูกค้า / ช่าง / โครงการ"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์ (ใช้สะสม CRM)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Product Search Field */}
          <div className="relative space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              ค้นหาชื่อสินค้า <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selectedProduct && e.target.value !== selectedProduct) {
                    setSelectedProduct('');
                  }
                }}
                placeholder="พิมพ์ชื่อสินค้า เช่น WEATHERBOND, VINILEX..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
              />
            </div>

            {/* Suggestions Dropdown */}
            {productSuggestions.length > 0 && !selectedProduct && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {productSuggestions.map((name, idx) => (
                  <button
                    key={`sug-${name}-${idx}`}
                    type="button"
                    onClick={() => handleSelectProduct(name)}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Product Pick Pills (สินค้ายอดนิยม/แนะนำ เลือกด่วน) */}
            {!selectedProduct && (
              <div className="pt-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  สินค้ายอดนิยม (แตะเลือกได้ทันที):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {indexes.productNames.slice(0, 6).map((pName) => (
                    <button
                      key={`quick-prod-${pName}`}
                      type="button"
                      onClick={() => handleSelectProduct(pName)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 text-[11px] font-medium transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Select: Size & Base & Color Code */}
          <div className="space-y-4">
            {/* Quick Select Size (ขนาดบรรจุ) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ขนาดบรรจุ {selectedSize && <span className="text-red-600">({selectedSize})</span>}
                </label>
                {availableSizes.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {availableSizes.length} ขนาดให้เลือก
                  </span>
                )}
              </div>

              {availableSizes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((s, idx) => {
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={`quick-size-${s}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSize(s)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-600 shadow-red-500/25 ring-2 ring-red-500/30'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                  กรุณาค้นหาและเลือกสินค้าก่อนเพื่อดูขนาดบรรจุ
                </div>
              )}
            </div>

            {/* Quick Select Base (เบสสี A, B, C, D) & Color Code */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Base Buttons */}
              <div className="sm:col-span-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    เบสสี (Base) {selectedBase && <span className="text-red-600">({selectedBase})</span>}
                  </label>
                  {availableBases.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      กดเลือกเบสทันที
                    </span>
                  )}
                </div>

                {availableBases.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableBases.map((b, idx) => {
                      const isSelected = selectedBase === b;
                      const displayBase = b || 'มาตรฐาน';
                      return (
                        <button
                          key={`quick-base-${b}-${idx}`}
                          type="button"
                          onClick={() => handleSelectBase(b)}
                          className={`min-w-[54px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border shadow-xs ${
                            isSelected
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-slate-900/20 ring-2 ring-slate-400/30'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          <span>{displayBase}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center">
                    {selectedProduct ? 'ไม่มีเบสให้เลือก (สินค้ามาตรฐาน)' : 'เลือกสินค้าเพื่อดูเบส'}
                  </div>
                )}
              </div>

              {/* Film Finish */}
              <div className="sm:col-span-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    ฟิล์มสี {selectedFilmColor && <span className="text-red-600">({selectedFilmColor})</span>}
                  </label>
                  {availableFilmColors.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      เลือกฟิล์มสี
                    </span>
                  )}
                </div>
                {availableFilmColors.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableFilmColors.map(({ key, value }) => {
                      const isSelected = selectedFilmColor === value;
                      return (
                        <button
                          key={`film-${key}`}
                          type="button"
                          onClick={() => handleSelectFilmColor(value)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-500/20'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 inline mr-1" />}
                          {value}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                    {selectedProduct ? 'สินค้านี้ไม่มีฟิล์มสีให้เลือก' : 'เลือกสินค้าเพื่อดูฟิล์มสี'}
                  </div>
                )}
              </div>

              {/* Color Code / Film Color */}
              <div className="sm:col-span-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    รหัสเฉดสี (Color No.)
                  </label>
                  {matchedRow?.filmColor && (
                    <span className="text-[10px] font-bold text-slate-400">{matchedRow.filmColor}</span>
                  )}
                </div>
                {availableColorCodes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {availableColorCodes.map(({ key, value }) => (
                      <button
                        key={`color-${key}`}
                        type="button"
                        onClick={() => handleSelectColorCode(value)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                          colorCode === value
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-300'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="เช่น A5006, 0310"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                  />
                )}
                {matchedRow?.filmColor && (
                  <div className="text-[10px] text-slate-500">ฟิล์มสี: <span className="font-bold">{matchedRow.filmColor}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Calculations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                ราคาต่อหน่วย
              </span>
              <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">
                {fmt(unitPrice)} <span className="text-[10px] text-slate-400">บ.</span>
              </div>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                + ค่าแม่สี (บ.)
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={tintPrice}
                onChange={(e) => setTintPrice(e.target.value)}
                placeholder="0"
                className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                จำนวน (ถัง)
              </span>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">
                ยอดรวมรายการนี้
              </span>
              <div className="font-mono font-black text-sm text-red-600 dark:text-red-400">
                {fmt(currentTotal)} <span className="text-[10px]">บ.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!matchedRow}
              className="flex-1 py-3 px-4 rounded-2xl border-2 border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ เพิ่มลงบิล (รวมหลายรายการ)</span>
            </button>
            <button
              type="button"
              onClick={handleSaveBill}
              disabled={!matchedRow && billCart.length === 0}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-red-500/20 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{billCart.length > 0 ? `บันทึกบิลนี้ (${billCart.length} รายการ)` : 'บันทึกขายทันที'}</span>
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs font-bold text-emerald-600 text-center animate-pulse">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Right: Cart Preview & Today's Summary (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Cart Card if has items */}
          {billCart.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-red-200 dark:border-red-900/60 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    บิลปัจจุบัน ({billCart.length} รายการ)
                  </h3>
                </div>
                <div className="font-mono text-base font-black text-red-600">
                  {fmt(billCart.reduce((a, x) => a + x.total, 0))} บ.
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto space-y-1">
                {billCart.map((item, idx) => (
                  <div key={item.id ? `cart-${item.id}` : `cart-idx-${idx}`} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>{' '}
                      <span className="text-slate-400 text-[11px]">
                        {[item.size, item.base].filter(Boolean).join(' ')}
                      </span>
                      {item.colorCode && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                          {item.colorCode}
                        </span>
                      )}
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {item.qty} ถัง x {fmt(item.price + item.tintPrice)} บ.
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {fmt(item.total)} บ.
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveBill}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                บันทึกบิลนี้ ({billCart.length} รายการ)
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700 mx-auto flex items-center justify-center text-slate-500">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                บิลปัจจุบันยังไม่มีรายการ
              </p>
              <p className="text-[11px] text-slate-400">
                เลือกสินค้าแล้วกดปุ่ม "+ เพิ่มลงบิล" เพื่อรวมหลายรายการในบิลเดียว
              </p>
            </div>
          )}

          {/* Today's Sales Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  ยอดขายวันนี้ ({date})
                </h3>
                <p className="text-[11px] text-slate-400">{todaySales.length} รายการ</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">ยอดรวมวันนี้</span>
                <span className="text-xl font-black font-mono text-red-600 dark:text-red-400">
                  {fmt(todayTotal)} บ.
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2">สินค้า</th>
                    <th className="pb-2 text-center">จำนวน</th>
                    <th className="pb-2 text-right">ยอดรวม</th>
                    <th className="pb-2 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {todaySales.length > 0 ? (
                    todaySales.map((s, idx) => (
                      <tr key={s.id ? `sale-${s.id}-${idx}` : `sale-idx-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 max-w-[140px] truncate">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {[s.size, s.base, s.colorCode].filter(Boolean).join(' ')}
                          </div>
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {s.qty}
                        </td>
                        <td className="py-2.5 text-right font-mono font-black text-slate-900 dark:text-white">
                          {fmt(s.total)} บ.
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {onEditSale && (
                              <button
                                onClick={() => onEditSale(s)}
                                className="px-2 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                              >
                                แก้ไข
                              </button>
                            )}
                            {onDeleteSale && (
                              <button
                                onClick={() => onDeleteSale(s.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-xs text-slate-400">
                        ยังไม่มีรายการขายในวันที่ระบุ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

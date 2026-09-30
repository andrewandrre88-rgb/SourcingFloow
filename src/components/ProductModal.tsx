import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  Boxes,
  DollarSign,
  Layers,
  Link as LinkIcon,
  Tag,
  ExternalLink,
  Scale,
  Sparkles,
  Calculator,
  Truck,
  Image,
  FileText,
  Ship,
  Check,
  Upload,
  Trash2,
  RefreshCw,
  Building2,
  Plus,
  Star,
  Award,
  TrendingDown,
} from 'lucide-react';
import { CatalogProduct, CurrencyUnit, ExchangeRates, FactoryQuote } from '../types';
import { calculateCartonCbm } from '../lib/productsDb';
import { compressImageFile } from '../lib/imageUtils';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: CatalogProduct) => void;
  productToEdit?: CatalogProduct | null;
  exchangeRates: ExchangeRates;
}

const COMMON_CATEGORIES = [
  'Drinkware & Bottles',
  'Kitchen & Dining',
  'Textiles & Apparel',
  'Bags & Luggage',
  'Electronics & Hardware',
  'Beauty & Personal Care',
  'Packaging & Printing',
  'Home & Garden',
  'Toys & Kids',
  'General Merchandise',
];

const COMMON_MATERIALS = [
  'High Borosilicate Glass',
  '304 Stainless Steel (Food Grade)',
  '316 Stainless Steel (Medical Grade)',
  'Anodized Aluminum Alloy',
  '100% Organic Cotton Canvas',
  'Polyester / Oxford Cloth 600D',
  'ABS + PC Impact Plastic',
  'Food Grade Silicone (BPA-Free)',
  'Bamboo / Natural Wood',
  'Kraft Paper / Recycled Cardboard',
  'Ceramic / Porcelain',
  'PU Leather / Vegan Leather',
];

const COMMON_FOB_PORTS = [
  'Ningbo',
  'Shenzhen (Yantian / Shekou)',
  'Shanghai',
  'Guangzhou (Nansha)',
  'Yiwu / Ningbo',
  'Qingdao',
  'Xiamen',
  'Tianjin',
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  exchangeRates,
}) => {
  const [formData, setFormData] = useState<Partial<CatalogProduct>>({
    name: '',
    itemCode: '',
    category: 'Drinkware & Bottles',
    material: '',
    quantity: 1000,
    quantityUnit: 'pcs',
    unitsPerCarton: 24,
    cartons: 42,
    cartonLengthCm: 45,
    cartonWidthCm: 35,
    cartonHeightCm: 30,
    grossWeightKg: 8.0,
    netWeightKg: 6.8,
    exwPrice: 12.0,
    exwCurrency: 'RMB',
    fobPrice: 2.10,
    fobCurrency: 'USD',
    fobPort: 'Ningbo',
    targetPriceUsd: 2.95,
    supplierName: '',
    supplierUrl: '',
    supplierContact: '',
    hsCode: '',
    packagingType: '5-ply corrugated export master carton, 1pc bubble wrap + individual white box',
    colorVariants: '',
    imageUrl: '',
    notes: '',
    cartons20gp: 0,
    qty20gp: 0,
    cartons40gp: 0,
    qty40gp: 0,
    cartons40hc: 0,
    qty40hc: 0,
    cartons45hc: 0,
    qty45hc: 0,
    factoryQuotes: [],
  });

  const [activeTab, setActiveTab] = useState<'specs' | 'cartons' | 'pricing' | 'sourcing'>('specs');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP, GIF)');
      return;
    }
    setIsUploadingImage(true);
    try {
      const compressed = await compressImageFile(file, 640, 0.82);
      setFormData((prev) => ({ ...prev, imageUrl: compressed }));
    } catch (err) {
      console.warn('Image compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({ ...prev, imageUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        ...productToEdit,
        factoryQuotes: productToEdit.factoryQuotes ? [...productToEdit.factoryQuotes] : [],
      });
    } else {
      setFormData({
        name: '',
        itemCode: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'Drinkware & Bottles',
        material: '',
        quantity: 1000,
        quantityUnit: 'pcs',
        unitsPerCarton: 24,
        cartons: 42,
        cartonLengthCm: 45,
        cartonWidthCm: 35,
        cartonHeightCm: 30,
        grossWeightKg: 8.0,
        netWeightKg: 6.8,
        exwPrice: 12.0,
        exwCurrency: 'RMB',
        fobPrice: 2.10,
        fobCurrency: 'USD',
        fobPort: 'Ningbo',
        targetPriceUsd: 2.95,
        supplierName: '',
        supplierUrl: '',
        supplierContact: '',
        hsCode: '',
        packagingType: '5-ply corrugated export master carton, 1pc bubble wrap + individual white box',
        colorVariants: '',
        imageUrl: '',
        notes: '',
        cartons20gp: 0,
        qty20gp: 0,
        cartons40gp: 0,
        qty40gp: 0,
        cartons40hc: 0,
        qty40hc: 0,
        cartons45hc: 0,
        qty45hc: 0,
        factoryQuotes: [],
      });
    }
  }, [productToEdit, isOpen]);

  // Factory quotes management helpers
  const handleAddFactoryQuote = (suggestedName?: string) => {
    const existing = formData.factoryQuotes || [];
    const nextIdx = existing.length + 1;
    const newQuote: FactoryQuote = {
      id: `fq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      factoryName: suggestedName || `Factory ${nextIdx}`,
      price: formData.exwPrice || 10,
      currency: formData.exwCurrency || 'RMB',
      moq: formData.quantity || 1000,
      leadTimeDays: 20,
      contactPerson: '',
      supplierUrl: '',
      notes: '',
      isPrimary: existing.length === 0,
    };
    setFormData((prev) => ({
      ...prev,
      factoryQuotes: [...(prev.factoryQuotes || []), newQuote],
    }));
  };

  const handleUpdateFactoryQuote = (index: number, updates: Partial<FactoryQuote>) => {
    const quotes = [...(formData.factoryQuotes || [])];
    if (quotes[index]) {
      quotes[index] = { ...quotes[index], ...updates };
      setFormData((prev) => ({ ...prev, factoryQuotes: quotes }));
    }
  };

  const handleRemoveFactoryQuote = (index: number) => {
    const quotes = (formData.factoryQuotes || []).filter((_, i) => i !== index);
    if (quotes.length > 0 && !quotes.some((q) => q.isPrimary)) {
      quotes[0].isPrimary = true;
    }
    setFormData((prev) => ({ ...prev, factoryQuotes: quotes }));
  };

  const handleSetPrimaryFactoryQuote = (index: number) => {
    const quotes = (formData.factoryQuotes || []).map((q, i) => ({
      ...q,
      isPrimary: i === index,
    }));
    const selected = quotes[index];
    setFormData((prev) => ({
      ...prev,
      factoryQuotes: quotes,
      supplierName: selected.factoryName,
      supplierContact: selected.contactPerson || prev.supplierContact,
      supplierUrl: selected.supplierUrl || prev.supplierUrl,
      exwPrice: selected.price,
      exwCurrency: selected.currency,
    }));
  };

  if (!isOpen) return null;

  // Auto-calculated fields
  const l = Number(formData.cartonLengthCm || 0);
  const w = Number(formData.cartonWidthCm || 0);
  const h = Number(formData.cartonHeightCm || 0);
  const singleCbm = calculateCartonCbm(l, w, h);
  const qty = Number(formData.quantity || 0);
  const perCtn = Number(formData.unitsPerCarton || 1);
  const computedCartons = perCtn > 0 ? Math.ceil(qty / perCtn) : 0;
  const cartonsCount = formData.cartons !== undefined && formData.cartons > 0 ? formData.cartons : computedCartons;
  const totalCbm = Number((singleCbm * cartonsCount).toFixed(4));
  const totalGrossWeight = Number(((formData.grossWeightKg || 0) * cartonsCount).toFixed(2));

  // Container volume benchmarks: 20GP ~ 28 CBM, 40HQ ~ 68 CBM
  const pct20ft = totalCbm > 0 ? Math.min(100, Math.round((totalCbm / 28) * 100)) : 0;
  const pct40hq = totalCbm > 0 ? Math.min(100, Math.round((totalCbm / 68) * 100)) : 0;

  // Auto-calculate 20GP, 40GP, 40HC, 45HC container loads from single carton CBM
  const handleAutoCalcContainerLoads = () => {
    if (!singleCbm || singleCbm <= 0) {
      alert('Please enter carton length, width, and height first to calculate CBM volume.');
      return;
    }
    const c20 = Math.floor(28 / singleCbm);
    const q20 = c20 * perCtn;
    const c40 = Math.floor(58 / singleCbm);
    const q40 = c40 * perCtn;
    const c40h = Math.floor(68 / singleCbm);
    const q40h = c40h * perCtn;
    const c45h = Math.floor(78 / singleCbm);
    const q45h = c45h * perCtn;

    setFormData((prev) => ({
      ...prev,
      cartons20gp: c20,
      qty20gp: q20,
      cartons40gp: c40,
      qty40gp: q40,
      cartons40hc: c40h,
      qty40hc: q40h,
      cartons45hc: c45h,
      qty45hc: q45h,
    }));
  };

  // Pricing conversions
  const usdRate = exchangeRates.USD_TO_RMB || 7.25;
  const exwInUsd = formData.exwCurrency === 'RMB' ? (Number(formData.exwPrice || 0) / usdRate).toFixed(2) : Number(formData.exwPrice || 0).toFixed(2);
  const fobInRmb = formData.fobCurrency === 'USD' ? (Number(formData.fobPrice || 0) * usdRate).toFixed(2) : Number(formData.fobPrice || 0).toFixed(2);
  const estimatedMarginUsd = formData.targetPriceUsd ? (Number(formData.targetPriceUsd) - (formData.fobCurrency === 'USD' ? Number(formData.fobPrice || 0) : Number(fobInRmb) / usdRate)).toFixed(2) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      alert('Please enter a product name');
      return;
    }

    const newProduct: CatalogProduct = {
      id: productToEdit?.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      itemCode: formData.itemCode?.trim() || undefined,
      name: formData.name.trim(),
      category: formData.category?.trim() || undefined,
      material: formData.material?.trim() || 'General Specifications',
      quantity: Number(formData.quantity || 0),
      quantityUnit: formData.quantityUnit || 'pcs',
      unitsPerCarton: perCtn,
      cartons: cartonsCount,
      cartonLengthCm: l,
      cartonWidthCm: w,
      cartonHeightCm: h,
      cartonCbm: singleCbm,
      totalCbm: totalCbm,
      grossWeightKg: formData.grossWeightKg !== undefined ? Number(formData.grossWeightKg) : undefined,
      totalGrossWeightKg: totalGrossWeight,
      netWeightKg: formData.netWeightKg !== undefined ? Number(formData.netWeightKg) : undefined,
      exwPrice: Number(formData.exwPrice || 0),
      exwCurrency: formData.exwCurrency || 'RMB',
      fobPrice: Number(formData.fobPrice || 0),
      fobCurrency: formData.fobCurrency || 'USD',
      fobPort: formData.fobPort?.trim() || undefined,
      targetPriceUsd: formData.targetPriceUsd !== undefined ? Number(formData.targetPriceUsd) : undefined,
      supplierName: formData.supplierName?.trim() || undefined,
      supplierUrl: formData.supplierUrl?.trim() || undefined,
      supplierContact: formData.supplierContact?.trim() || undefined,
      hsCode: formData.hsCode?.trim() || undefined,
      packagingType: formData.packagingType?.trim() || undefined,
      colorVariants: formData.colorVariants?.trim() || undefined,
      imageUrl: formData.imageUrl?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      cartons20gp: formData.cartons20gp !== undefined && formData.cartons20gp !== null ? Number(formData.cartons20gp) : undefined,
      qty20gp: formData.qty20gp !== undefined && formData.qty20gp !== null ? Number(formData.qty20gp) : undefined,
      cartons40gp: formData.cartons40gp !== undefined && formData.cartons40gp !== null ? Number(formData.cartons40gp) : undefined,
      qty40gp: formData.qty40gp !== undefined && formData.qty40gp !== null ? Number(formData.qty40gp) : undefined,
      cartons40hc: formData.cartons40hc !== undefined && formData.cartons40hc !== null ? Number(formData.cartons40hc) : undefined,
      qty40hc: formData.qty40hc !== undefined && formData.qty40hc !== null ? Number(formData.qty40hc) : undefined,
      cartons45hc: formData.cartons45hc !== undefined && formData.cartons45hc !== null ? Number(formData.cartons45hc) : undefined,
      qty45hc: formData.qty45hc !== undefined && formData.qty45hc !== null ? Number(formData.qty45hc) : undefined,
      factoryQuotes: formData.factoryQuotes || [],
      createdAt: productToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newProduct);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>{productToEdit ? 'Edit Product Specifications' : 'New Master Product'}</span>
                {(formData.hsCode || formData.itemCode) && (
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {formData.hsCode ? `HS: ${formData.hsCode}` : formData.itemCode}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Cartons, dimensions, CBM, EXW, FOB prices & material specifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-100/60 px-5 pt-2 text-xs font-semibold gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`px-3.5 py-2 rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 font-medium ${
              activeTab === 'specs'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. Product & Material</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cartons')}
            className={`px-3.5 py-2 rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 font-medium ${
              activeTab === 'cartons'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>2. Cartons & CBM ({totalCbm.toFixed(3)} m³)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 font-medium ${
              activeTab === 'pricing'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. EXW & FOB Pricing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sourcing')}
            className={`px-3.5 py-2 rounded-t-lg transition flex items-center gap-1.5 cursor-pointer border-b-2 font-medium ${
              activeTab === 'sourcing'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>4. Sourcing & Quotes ({formData.factoryQuotes?.length || 0})</span>
          </button>
        </div>

        {/* Form Body */}
        <form id="product-master-form" onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PRODUCT & MATERIAL */}
          {activeTab === 'specs' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Product Title / Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Double-Wall Borosilicate Glass Coffee Mug (350ml)"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    HS Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7013.37.0000"
                    value={formData.hsCode || ''}
                    onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Category & Color Variants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    >
                      {COMMON_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color / Finish / Size Variants
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Matte Black, Amber Tint, Clear, Rose Gold"
                    value={formData.colorVariants || ''}
                    onChange={(e) => setFormData({ ...formData, colorVariants: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Material & Composition */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Material & Technical Composition <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Exact factory material grade</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. High Borosilicate Glass 3.3 (Heat Resistant -20°C to 150°C)"
                  value={formData.material || ''}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />

                {/* Quick Material Presets */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold self-center">Presets:</span>
                  {COMMON_MATERIALS.slice(0, 6).map((mat) => (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => setFormData({ ...formData, material: mat })}
                      className="px-2 py-0.5 text-[10px] rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition cursor-pointer"
                    >
                      {mat.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Image Upload (Replaces Image URL Link) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Product Image Upload</span>
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer transition hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFileChange(e.target.files[0]);
                    }
                  }}
                />

                {formData.imageUrl ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-4 shadow-2xs">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 shadow-2xs">
                      <img
                        src={formData.imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Product photo uploaded & ready</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Optimized and stored directly with your product specifications.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer active:scale-95"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isUploadingImage ? 'animate-spin' : ''}`} />
                          <span>{isUploadingImage ? 'Optimizing...' : 'Change Photo'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/60'
                        : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                      {isUploadingImage ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {isUploadingImage ? 'Optimizing & uploading image...' : 'Click to upload your product photo'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        or drag and drop an image file here (PNG, JPG, WEBP, GIF)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CARTONS & CBM */}
          {activeTab === 'cartons' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Quantities & Carton Calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Order / Batch Quantity <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.quantity || ''}
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        const c = perCtn > 0 ? Math.ceil(q / perCtn) : 0;
                        setFormData({ ...formData, quantity: q, cartons: c });
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-l-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={formData.quantityUnit || 'pcs'}
                      onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                      className="bg-slate-200 border border-l-0 border-slate-300 rounded-r-lg px-2 py-2 text-xs font-semibold text-slate-700"
                    >
                      <option value="pcs">pcs</option>
                      <option value="sets">sets</option>
                      <option value="pairs">pairs</option>
                      <option value="units">units</option>
                      <option value="boxes">boxes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Units Per Carton (pcs/ctn) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.unitsPerCarton || ''}
                    onChange={(e) => {
                      const u = Number(e.target.value);
                      const c = u > 0 ? Math.ceil(qty / u) : 0;
                      setFormData({ ...formData, unitsPerCarton: u, cartons: c });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Total Cartons (Auto)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={cartonsCount || ''}
                      onChange={(e) => setFormData({ ...formData, cartons: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-indigo-50/60 border border-indigo-300 rounded-lg text-xs font-bold text-indigo-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-[10px] text-indigo-600 font-bold uppercase">
                      ctns
                    </span>
                  </div>
                </div>
              </div>

              {/* Carton Dimensions: L x W x H */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Carton Outer Dimensions (Length × Width × Height in cm)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Standard 5-ply export carton</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Length (cm)</div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="e.g. 48"
                      value={formData.cartonLengthCm || ''}
                      onChange={(e) => setFormData({ ...formData, cartonLengthCm: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Width (cm)</div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="e.g. 32"
                      value={formData.cartonWidthCm || ''}
                      onChange={(e) => setFormData({ ...formData, cartonWidthCm: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Height (cm)</div>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      placeholder="e.g. 30"
                      value={formData.cartonHeightCm || ''}
                      onChange={(e) => setFormData({ ...formData, cartonHeightCm: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated CBM & Container Loading Metrics */}
              <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Calculator className="w-4 h-4 text-indigo-600" />
                    <span>Real-Time Volume & CBM Calculations</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Formula: (L × W × H) ÷ 1,000,000
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Single Carton CBM</div>
                    <div className="text-base font-bold font-mono text-indigo-700 mt-0.5">
                      {singleCbm.toFixed(4)} <span className="text-xs text-slate-500">m³</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Shipment CBM</div>
                    <div className="text-base font-bold font-mono text-indigo-700 mt-0.5">
                      {totalCbm.toFixed(3)} <span className="text-xs text-slate-500">m³</span>
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">20ft Container (28 CBM)</div>
                    <div className="text-sm font-bold font-mono text-slate-800 mt-0.5 flex items-center justify-between">
                      <span>{pct20ft}% filled</span>
                      <span className="text-[10px] text-slate-500">
                        (~{singleCbm > 0 ? Math.floor(28 / singleCbm) : 0} ctns)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct20ft}%` }} />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">40ft HQ Container (68 CBM)</div>
                    <div className="text-sm font-bold font-mono text-slate-800 mt-0.5 flex items-center justify-between">
                      <span>{pct40hq}% filled</span>
                      <span className="text-[10px] text-slate-500">
                        (~{singleCbm > 0 ? Math.floor(68 / singleCbm) : 0} ctns)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${pct40hq}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTAINER LOADS: 20GP, 40GP, 40HC, 45HC */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Container Loads (20GP, 40GP, 40HC, 45HC)</span>
                        <span className="text-[10px] font-normal text-slate-500 lowercase">(cartons & total units)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Save estimated or factory-verified container loading quantities for ocean freight
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCalcContainerLoads}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer self-start sm:self-auto active:scale-95 shadow-2xs"
                    title="Calculate cartons & quantities based on 28m³, 58m³, 68m³, and 78m³ usable volumes"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Auto-Calculate From CBM</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 20GP Container */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>20GP Container</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        28 m³
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        20GP Cartons
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(28 / singleCbm)) : '0'}
                        value={formData.cartons20gp || ''}
                        onChange={(e) => {
                          const ctns = Number(e.target.value);
                          setFormData({
                            ...formData,
                            cartons20gp: ctns,
                            qty20gp: ctns * perCtn,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        20GP Quantity ({formData.quantityUnit || 'pcs'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(28 / singleCbm) * perCtn) : '0'}
                        value={formData.qty20gp || ''}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setFormData({
                            ...formData,
                            qty20gp: q,
                            cartons20gp: perCtn > 0 ? Math.ceil(q / perCtn) : 0,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 40GP Container */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span>40GP Container</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        58 m³
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        40GP Cartons
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(58 / singleCbm)) : '0'}
                        value={formData.cartons40gp || ''}
                        onChange={(e) => {
                          const ctns = Number(e.target.value);
                          setFormData({
                            ...formData,
                            cartons40gp: ctns,
                            qty40gp: ctns * perCtn,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        40GP Quantity ({formData.quantityUnit || 'pcs'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(58 / singleCbm) * perCtn) : '0'}
                        value={formData.qty40gp || ''}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setFormData({
                            ...formData,
                            qty40gp: q,
                            cartons40gp: perCtn > 0 ? Math.ceil(q / perCtn) : 0,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 40HC Container */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>40HC / 40HQ</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        68 m³
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        40HC Cartons
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(68 / singleCbm)) : '0'}
                        value={formData.cartons40hc || ''}
                        onChange={(e) => {
                          const ctns = Number(e.target.value);
                          setFormData({
                            ...formData,
                            cartons40hc: ctns,
                            qty40hc: ctns * perCtn,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        40HC Quantity ({formData.quantityUnit || 'pcs'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(68 / singleCbm) * perCtn) : '0'}
                        value={formData.qty40hc || ''}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setFormData({
                            ...formData,
                            qty40hc: q,
                            cartons40hc: perCtn > 0 ? Math.ceil(q / perCtn) : 0,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 45HC Container */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>45HC / 45HQ</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        78 m³
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        45HC Cartons
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(78 / singleCbm)) : '0'}
                        value={formData.cartons45hc || ''}
                        onChange={(e) => {
                          const ctns = Number(e.target.value);
                          setFormData({
                            ...formData,
                            cartons45hc: ctns,
                            qty45hc: ctns * perCtn,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                        45HC Quantity ({formData.quantityUnit || 'pcs'})
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder={singleCbm > 0 ? String(Math.floor(78 / singleCbm) * perCtn) : '0'}
                        value={formData.qty45hc || ''}
                        onChange={(e) => {
                          const q = Number(e.target.value);
                          setFormData({
                            ...formData,
                            qty45hc: q,
                            cartons45hc: perCtn > 0 ? Math.ceil(q / perCtn) : 0,
                          });
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Weights (GW / NW) & Packaging Spec */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gross Weight (GW/ctn kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 7.5"
                    value={formData.grossWeightKg || ''}
                    onChange={(e) => setFormData({ ...formData, grossWeightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Total: {totalGrossWeight} kg
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-slate-500" />
                    <span>Net Weight (NW/ctn kg)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="e.g. 6.2"
                    value={formData.netWeightKg || ''}
                    onChange={(e) => setFormData({ ...formData, netWeightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Packaging Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5-ply export carton, bubble wrapped"
                    value={formData.packagingType || ''}
                    onChange={(e) => setFormData({ ...formData, packagingType: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRICING (EXW & FOB) */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* EXW Price Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                        EXW
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">EXW (Ex Works) Price</h4>
                        <p className="text-[10px] text-slate-500">Factory gate cost before domestic transit</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="e.g. 12.00"
                        value={formData.exwPrice || ''}
                        onChange={(e) => setFormData({ ...formData, exwPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <select
                      value={formData.exwCurrency || 'RMB'}
                      onChange={(e) => setFormData({ ...formData, exwCurrency: e.target.value as CurrencyUnit })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="RMB">¥ RMB</option>
                      <option value="USD">$ USD</option>
                    </select>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>Equivalent in {formData.exwCurrency === 'RMB' ? 'USD' : 'RMB'}:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formData.exwCurrency === 'RMB' ? `$${exwInUsd}` : `¥${(Number(formData.exwPrice || 0) * usdRate).toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* FOB Price Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                        FOB
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">FOB (Free On Board) Price</h4>
                        <p className="text-[10px] text-slate-500">Delivered & cleared onto departure vessel</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="e.g. 2.10"
                        value={formData.fobPrice || ''}
                        onChange={(e) => setFormData({ ...formData, fobPrice: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <select
                      value={formData.fobCurrency || 'USD'}
                      onChange={(e) => setFormData({ ...formData, fobCurrency: e.target.value as CurrencyUnit })}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800"
                    >
                      <option value="USD">$ USD</option>
                      <option value="RMB">¥ RMB</option>
                    </select>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                    <span>Equivalent in {formData.fobCurrency === 'USD' ? 'RMB' : 'USD'}:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formData.fobCurrency === 'USD' ? `¥${fobInRmb}` : `$${(Number(formData.fobPrice || 0) / usdRate).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* FOB Port of Loading & Client Target Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Ship className="w-3.5 h-3.5 text-indigo-600" />
                    <span>FOB Port of Loading</span>
                  </label>
                  <select
                    value={formData.fobPort || 'Ningbo'}
                    onChange={(e) => setFormData({ ...formData, fobPort: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                  >
                    {COMMON_FOB_PORTS.map((port) => (
                      <option key={port} value={port}>
                        {port} Port
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Client Selling Price ($ USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 2.95"
                      value={formData.targetPriceUsd || ''}
                      onChange={(e) => setFormData({ ...formData, targetPriceUsd: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                    {estimatedMarginUsd && (
                      <span className="absolute right-3 top-2 text-[10px] font-bold text-emerald-600">
                        Margin: +${estimatedMarginUsd}/pc
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Order Cost Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Total Factory Value (EXW): </span>
                  <span className="font-bold text-slate-900 font-mono">
                    ¥{((Number(formData.exwPrice || 0) * qty) * (formData.exwCurrency === 'RMB' ? 1 : usdRate)).toLocaleString()} RMB
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Total Export Value (FOB): </span>
                  <span className="font-bold text-indigo-700 font-mono">
                    ${((Number(formData.fobPrice || 0) * qty) / (formData.fobCurrency === 'USD' ? 1 : usdRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SOURCING & FACTORY QUOTES */}
          {activeTab === 'sourcing' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* FACTORY QUOTATIONS SECTION (FACTORY 1, FACTORY 2, ...) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Factory Quotations (Factory 1, Factory 2, etc.)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Save multiple factory quotes to compare unit prices, MOQs, production lead times, and terms.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddFactoryQuote()}
                      className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Quote</span>
                    </button>
                    {(!formData.factoryQuotes || formData.factoryQuotes.length === 0) && (
                      <div className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleAddFactoryQuote('Factory 1 - Hebei Glass')}
                          className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          + Factory 1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddFactoryQuote('Factory 2 - Ningbo Precision')}
                          className="px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                        >
                          + Factory 2
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quotes List */}
                {formData.factoryQuotes && formData.factoryQuotes.length > 0 ? (
                  <div className="space-y-3">
                    {formData.factoryQuotes.map((quote, idx) => {
                      const isMinPrice =
                        Math.min(
                          ...formData.factoryQuotes!.map((q) =>
                            q.currency === quote.currency ? q.price : Infinity
                          )
                        ) === quote.price;

                      return (
                        <div
                          key={quote.id || idx}
                          className={`p-3.5 rounded-xl border transition space-y-3 ${
                            quote.isPrimary
                              ? 'bg-white border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                          }`}
                        >
                          {/* Top Bar: Factory Label, Primary Badge, Best Price Badge, Delete */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                #{idx + 1} Factory
                              </span>
                              {quote.isPrimary ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                                  <Star className="w-3 h-3 fill-indigo-600 text-indigo-600" />
                                  <span>Primary Selected Supplier</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryFactoryQuote(idx)}
                                  className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 px-2 py-0.5 rounded border border-dashed border-slate-300 hover:border-indigo-300 transition cursor-pointer"
                                >
                                  Set as Primary
                                </button>
                              )}
                              {isMinPrice && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <TrendingDown className="w-3 h-3" />
                                  <span>Lowest Quote</span>
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFactoryQuote(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="Delete this factory quote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Row 1: Factory Name and Quotation Price */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                Factory / Supplier Name
                              </label>
                              <input
                                type="text"
                                placeholder={`e.g. Factory ${idx + 1} - Hebei Sunshine Glass`}
                                value={quote.factoryName}
                                onChange={(e) => handleUpdateFactoryQuote(idx, { factoryName: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                Unit Quote Price
                              </label>
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={quote.price || ''}
                                  onChange={(e) => handleUpdateFactoryQuote(idx, { price: Number(e.target.value) })}
                                  className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
                                />
                                <select
                                  value={quote.currency || 'RMB'}
                                  onChange={(e) => handleUpdateFactoryQuote(idx, { currency: e.target.value as CurrencyUnit })}
                                  className="bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-700"
                                >
                                  <option value="RMB">¥ RMB</option>
                                  <option value="USD">$ USD</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Row 2: MOQ, Lead Time, Contact Person */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                Factory MOQ ({formData.quantityUnit || 'pcs'})
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 1000"
                                value={quote.moq || ''}
                                onChange={(e) => handleUpdateFactoryQuote(idx, { moq: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                Production Lead Time (days)
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 20"
                                value={quote.leadTimeDays || ''}
                                onChange={(e) => handleUpdateFactoryQuote(idx, { leadTimeDays: Number(e.target.value) })}
                                className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                WeChat / Contact / WhatsApp
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. WeChat: factory_sales88"
                                value={quote.contactPerson || ''}
                                onChange={(e) => handleUpdateFactoryQuote(idx, { contactPerson: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Row 3: B2B URL & Terms / Notes */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                1688 / Website / Inquiry URL
                              </label>
                              <input
                                type="url"
                                placeholder="https://detail.1688.com/offer/..."
                                value={quote.supplierUrl || ''}
                                onChange={(e) => handleUpdateFactoryQuote(idx, { supplierUrl: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                                Specific Terms, Quality & Packaging Notes
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Includes custom color box, 30% deposit, LFGB test pass"
                                value={quote.notes || ''}
                                onChange={(e) => handleUpdateFactoryQuote(idx, { notes: e.target.value })}
                                className="w-full px-2.5 py-1.5 bg-slate-50/70 border border-slate-300 rounded text-xs font-normal text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          {/* Quick action: Apply as EXW */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-400">
                              Estimated order cost ({qty.toLocaleString()} {formData.quantityUnit || 'pcs'}):{' '}
                              <strong className="text-slate-800 font-mono">
                                {quote.currency === 'RMB' ? '¥' : '$'}{(quote.price * qty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryFactoryQuote(idx)}
                              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                            >
                              Sync to Product EXW Price & Supplier
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddFactoryQuote()}
                      className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another Factory Quotation</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white text-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No Factory Quotations Added Yet</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Add quotations from Factory 1, Factory 2, Factory 3, etc. to compare pricing side-by-side and select the best supplier.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddFactoryQuote('Factory 1')}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Factory 1 Quote</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddFactoryQuote('Factory 2')}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs cursor-pointer"
                      >
                        + Factory 2
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Customs HS Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Customs HS Code (for Export & Import Clearance)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7013.37.0000"
                  value={formData.hsCode || ''}
                  onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              {/* Notes & QC Specs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quality Requirements & Inspection Checklist
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Drop test passed from 1.2m. Custom laser etched logo. Inner white box must have Amazon barcode sticker."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs resize-none"
                />
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {activeTab === 'specs' && 'Step 1 of 4: Material & Name'}
            {activeTab === 'cartons' && `Step 2 of 4: Total ${totalCbm.toFixed(3)} CBM across ${cartonsCount} ctns`}
            {activeTab === 'pricing' && `Step 3 of 4: EXW ${formData.exwPrice} ${formData.exwCurrency} / FOB ${formData.fobPrice} ${formData.fobCurrency}`}
            {activeTab === 'sourcing' && 'Step 4 of 4: Supplier & HS Code'}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-master-form"
              id="product-modal-save-btn"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{productToEdit ? 'Update Product' : 'Save Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

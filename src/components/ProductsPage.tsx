import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  Boxes,
  DollarSign,
  Scale,
  Truck,
  Ship,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  ArrowUpRight,
  Download,
  Cloud,
  RefreshCw,
  Sparkles,
  Tag,
  Check,
  ChevronDown,
  Filter,
  Building2,
} from 'lucide-react';
import { CatalogProduct, ExchangeRates, CurrencyViewMode, CloudSyncState } from '../types';

interface ProductsPageProps {
  products: CatalogProduct[];
  exchangeRates: ExchangeRates;
  currencyView: CurrencyViewMode;
  user?: User | null;
  syncState?: CloudSyncState;
  onSync?: () => void;
  onAddProduct: () => void;
  onEditProduct: (product: CatalogProduct) => void;
  onViewProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct: (product: CatalogProduct) => void;
  onCreateInquiryFromProduct: (product: CatalogProduct) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  exchangeRates,
  currencyView,
  user,
  syncState,
  onSync,
  onAddProduct,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onCreateInquiryFromProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const usdRate = exchangeRates.USD_TO_RMB || 7.25;

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCode = p.itemCode?.toLowerCase().includes(q);
        const matchesMat = p.material.toLowerCase().includes(q);
        const matchesSup = p.supplierName?.toLowerCase().includes(q);
        const matchesHs = p.hsCode?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesMat && !matchesSup && !matchesHs) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Aggregate metrics
  const stats = useMemo(() => {
    const count = products.length;
    let totalPieces = 0;
    let totalCartons = 0;
    let totalCbm = 0;
    let totalGrossWeight = 0;
    let totalExwRmb = 0;
    let totalFobUsd = 0;

    products.forEach((p) => {
      const q = Number(p.quantity || 0);
      const ctns = Number(p.cartons || 0);
      totalPieces += q;
      totalCartons += ctns;

      const singleCbm = p.cartonCbm || ((Number(p.cartonLengthCm || 0) * Number(p.cartonWidthCm || 0) * Number(p.cartonHeightCm || 0)) / 1000000);
      totalCbm += p.totalCbm || (singleCbm * ctns);

      const gw = p.grossWeightKg ? (p.grossWeightKg * ctns) : (p.totalGrossWeightKg || 0);
      totalGrossWeight += gw;

      const exwRmb = p.exwCurrency === 'RMB' ? (p.exwPrice * q) : (p.exwPrice * q * usdRate);
      totalExwRmb += exwRmb;

      const fobUsd = p.fobCurrency === 'USD' ? (p.fobPrice * q) : (p.fobPrice * q / usdRate);
      totalFobUsd += fobUsd;
    });

    return {
      count,
      totalPieces,
      totalCartons,
      totalCbm: Number(totalCbm.toFixed(3)),
      totalGrossWeight: Math.round(totalGrossWeight),
      totalExwRmb: Math.round(totalExwRmb),
      totalFobUsd: Math.round(totalFobUsd),
    };
  }, [products, usdRate]);

  // Export CSV
  const handleExportCsv = () => {
    if (products.length === 0) return;
    const headers = [
      'Item Code',
      'Product Name',
      'Category',
      'Material',
      'Order Qty',
      'Unit',
      'Units/Carton',
      'Total Cartons',
      'Carton L (cm)',
      'Carton W (cm)',
      'Carton H (cm)',
      'Carton CBM (m3)',
      'Total CBM (m3)',
      '20GP Cartons',
      '20GP Qty',
      '40GP Cartons',
      '40GP Qty',
      '40HC Cartons',
      '40HC Qty',
      '45HC Cartons',
      '45HC Qty',
      'GW/ctn (kg)',
      'Total GW (kg)',
      'EXW Price',
      'EXW Currency',
      'FOB Price',
      'FOB Currency',
      'FOB Port',
      'Supplier',
      'HS Code',
      'Factory Quotations',
    ];

    const rows = products.map((p) => {
      const l = Number(p.cartonLengthCm || 0);
      const w = Number(p.cartonWidthCm || 0);
      const h = Number(p.cartonHeightCm || 0);
      const singleCbm = p.cartonCbm || Number(((l * w * h) / 1000000).toFixed(4));
      const perCtn = p.unitsPerCarton || 1;
      const c20 = p.cartons20gp || (singleCbm > 0 ? Math.floor(28 / singleCbm) : 0);
      const q20 = p.qty20gp || c20 * perCtn;
      const c40 = p.cartons40gp || (singleCbm > 0 ? Math.floor(58 / singleCbm) : 0);
      const q40 = p.qty40gp || c40 * perCtn;
      const c40h = p.cartons40hc || (singleCbm > 0 ? Math.floor(68 / singleCbm) : 0);
      const q40h = p.qty40hc || c40h * perCtn;
      const c45h = p.cartons45hc || (singleCbm > 0 ? Math.floor(78 / singleCbm) : 0);
      const q45h = p.qty45hc || c45h * perCtn;

      const quotesSummary = p.factoryQuotes && p.factoryQuotes.length > 0
        ? p.factoryQuotes
            .map((q, idx) => `${q.factoryName || `Factory ${idx + 1}`}: ${q.currency === 'RMB' ? '¥' : '$'}${q.price}${q.moq ? ` (MOQ ${q.moq})` : ''}${q.isPrimary ? ' [Primary]' : ''}`)
            .join(' | ')
        : '';

      return [
        `"${p.itemCode || ''}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        `"${p.material.replace(/"/g, '""')}"`,
        p.quantity,
        `"${p.quantityUnit || 'pcs'}"`,
        p.unitsPerCarton,
        p.cartons,
        p.cartonLengthCm,
        p.cartonWidthCm,
        p.cartonHeightCm,
        p.cartonCbm || '',
        p.totalCbm || '',
        c20,
        q20,
        c40,
        q40,
        c40h,
        q40h,
        c45h,
        q45h,
        p.grossWeightKg || '',
        p.totalGrossWeightKg || '',
        p.exwPrice,
        p.exwCurrency,
        p.fobPrice,
        p.fobCurrency,
        `"${p.fobPort || ''}"`,
        `"${p.supplierName || ''}"`,
        `"${p.hsCode || ''}"`,
        `"${quotesSummary.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SourcingFlow_Product_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Master Product Catalog</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {stats.count} Products
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cartons, units per carton, dimensions, CBM volume, EXW & FOB prices, and materials
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {/* Cloud Sync Status */}
          {user && onSync && (
            <button
              type="button"
              id="products-cloud-sync-btn"
              onClick={onSync}
              disabled={syncState?.isSyncing}
              title={
                syncState?.isSyncing
                  ? 'Synchronizing products with Cloud Firestore...'
                  : syncState?.lastSyncedAt
                  ? `Synced with Cloud (${products.length} products). Click to refresh.`
                  : 'Click to sync products across all devices'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer active:scale-95 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs"
            >
              {syncState?.isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                  <span className="text-indigo-600 font-bold">Syncing...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700">Sync Across Devices</span>
                  <span className="hidden sm:inline-flex text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                    Live
                  </span>
                </>
              )}
            </button>
          )}

          {/* Export Catalog */}
          <button
            type="button"
            id="products-export-csv-btn"
            onClick={handleExportCsv}
            disabled={products.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-2xs disabled:opacity-50"
            title="Download CSV product spec sheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card view with product images"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Logistics spec sheet table"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* New Product Button */}
          <button
            type="button"
            id="products-add-new-btn"
            onClick={onAddProduct}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
        </div>
      </div>

      {/* Aggregate Logistics & Cost Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Quantity</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">{stats.totalPieces.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400">units</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cartons</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-indigo-700">{stats.totalCartons.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400">ctns</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume (CBM)</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-indigo-700">{stats.totalCbm}</span>
            <span className="text-[11px] text-slate-400">m³</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Weight</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold font-mono text-slate-900">{stats.totalGrossWeight.toLocaleString()}</span>
            <span className="text-[11px] text-slate-400">kg</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Factory Cost (EXW)</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-slate-900">
              ¥{stats.totalExwRmb.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">RMB</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Export Value (FOB)</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg font-bold font-mono text-emerald-700">
              ${stats.totalFobUsd.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">USD</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by product name, SKU, material, supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Category:</span>
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRODUCT LISTINGS: GRID OR TABLE */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search query or category filter.'
                : 'Start building your master product catalog with carton dimensions, CBM, EXW, and FOB pricing.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onAddProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Product</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const l = Number(product.cartonLengthCm || 0);
            const w = Number(product.cartonWidthCm || 0);
            const h = Number(product.cartonHeightCm || 0);
            const singleCbm = product.cartonCbm || Number(((l * w * h) / 1000000).toFixed(4));
            const totalCbm = product.totalCbm || Number((singleCbm * product.cartons).toFixed(3));
            const exwInUsd = product.exwCurrency === 'RMB' ? (product.exwPrice / usdRate).toFixed(2) : product.exwPrice.toFixed(2);
            const fobInRmb = product.fobCurrency === 'USD' ? (product.fobPrice * usdRate).toFixed(2) : product.fobPrice.toFixed(2);

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition duration-150 overflow-hidden flex flex-col group"
              >
                {/* Product Card Top: Photo & Basic Info */}
                <div className="p-4 flex gap-3 items-start border-b border-slate-100">
                  {product.imageUrl ? (
                    <div
                      onClick={() => onViewProduct(product)}
                      className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                    >
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                    </div>
                  ) : (
                    <div
                      onClick={() => onViewProduct(product)}
                      className="w-20 h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shrink-0 cursor-pointer"
                    >
                      <Package className="w-6 h-6 opacity-40 mb-0.5" />
                      <span className="text-[9px]">No photo</span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      {product.itemCode && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {product.itemCode}
                        </span>
                      )}
                      {product.category && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                          {product.category}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => onViewProduct(product)}
                      className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 cursor-pointer hover:text-indigo-600 transition"
                      title={product.name}
                    >
                      {product.name}
                    </h4>

                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                      <span className="font-semibold text-slate-700">Material: </span>
                      {product.material}
                    </p>
                  </div>
                </div>

                {/* Packaging & Logistics Strip */}
                <div className="bg-slate-50/70 px-4 py-2.5 text-xs grid grid-cols-3 gap-2 border-b border-slate-100">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Quantity</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {product.quantity.toLocaleString()} {product.quantityUnit || 'pcs'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Cartons</span>
                    <span className="font-mono font-bold text-indigo-700 text-[11px]">
                      {product.cartons} ctns <span className="text-[10px] font-normal text-slate-500">({product.unitsPerCarton}/c)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Total CBM</span>
                    <span className="font-mono font-bold text-indigo-700 text-[11px]">
                      {totalCbm.toFixed(3)} m³
                    </span>
                  </div>
                </div>

                {/* Carton Dimensions & Price Summary */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                    <span className="text-[11px] text-slate-500">Carton Size:</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {l} × {w} × {h} cm ({singleCbm.toFixed(4)} m³)
                    </span>
                  </div>

                  {/* Container Loading Strip (20GP, 40GP, 40HC, 45HC) */}
                  {(() => {
                    const perCtn = product.unitsPerCarton || 1;
                    const c20 = product.cartons20gp || (singleCbm > 0 ? Math.floor(28 / singleCbm) : 0);
                    const q20 = product.qty20gp || c20 * perCtn;
                    const c40 = product.cartons40gp || (singleCbm > 0 ? Math.floor(58 / singleCbm) : 0);
                    const q40 = product.qty40gp || c40 * perCtn;
                    const c40h = product.cartons40hc || (singleCbm > 0 ? Math.floor(68 / singleCbm) : 0);
                    const q40h = product.qty40hc || c40h * perCtn;
                    const c45h = product.cartons45hc || (singleCbm > 0 ? Math.floor(78 / singleCbm) : 0);
                    const q45h = product.qty45hc || c45h * perCtn;

                    return (
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Ship className="w-3 h-3 text-indigo-600" />
                            <span>Container Loads</span>
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-normal">ctns (units)</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-center font-mono">
                          <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs">
                            <span className="text-[9px] font-bold text-blue-700 block">20GP</span>
                            <span className="text-[10px] font-bold text-slate-800">{c20}c</span>
                            <span className="text-[9px] text-slate-500 block truncate" title={`${q20.toLocaleString()} units`}>
                              {q20.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs">
                            <span className="text-[9px] font-bold text-indigo-700 block">40GP</span>
                            <span className="text-[10px] font-bold text-slate-800">{c40}c</span>
                            <span className="text-[9px] text-slate-500 block truncate" title={`${q40.toLocaleString()} units`}>
                              {q40.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs">
                            <span className="text-[9px] font-bold text-emerald-700 block">40HC</span>
                            <span className="text-[10px] font-bold text-slate-800">{c40h}c</span>
                            <span className="text-[9px] text-slate-500 block truncate" title={`${q40h.toLocaleString()} units`}>
                              {q40h.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs">
                            <span className="text-[9px] font-bold text-purple-700 block">45HC</span>
                            <span className="text-[10px] font-bold text-slate-800">{c45h}c</span>
                            <span className="text-[9px] text-slate-500 block truncate" title={`${q45h.toLocaleString()} units`}>
                              {q45h.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Factory Quotations Strip (Factory 1, Factory 2, etc.) */}
                  {product.factoryQuotes && product.factoryQuotes.length > 0 ? (
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Building2 className="w-3 h-3 text-indigo-600" />
                          <span>Factory Quotations</span>
                        </span>
                        <span className="text-[9px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {product.factoryQuotes.length} quotes
                        </span>
                      </div>
                      <div className="space-y-1">
                        {product.factoryQuotes.slice(0, 3).map((fq, idx) => {
                          const isMin = Math.min(...product.factoryQuotes!.map((q) => (q.currency === fq.currency ? q.price : Infinity))) === fq.price;
                          return (
                            <div
                              key={fq.id || idx}
                              className={`flex items-center justify-between px-2 py-0.5 rounded text-[10px] font-mono border ${
                                fq.isPrimary
                                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-bold'
                                  : isMin
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-1 truncate max-w-[155px]">
                                <span className="text-[9px] font-sans font-bold text-slate-500 uppercase">
                                  {fq.factoryName.startsWith('Factory') ? fq.factoryName.split(' ')[0] + ' ' + fq.factoryName.split(' ')[1] : `F${idx + 1}`}
                                </span>
                                <span className="truncate text-slate-600 font-sans text-[10px]" title={fq.factoryName}>
                                  {fq.factoryName.includes('-') ? fq.factoryName.split('-')[1]?.trim() : fq.factoryName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="font-bold">
                                  {fq.currency === 'RMB' ? `¥${fq.price.toFixed(2)}` : `$${fq.price.toFixed(2)}`}
                                </span>
                                {fq.isPrimary && (
                                  <span className="text-[8px] px-1 rounded bg-indigo-200 text-indigo-800 font-sans font-bold">
                                    Primary
                                  </span>
                                )}
                                {isMin && !fq.isPrimary && (
                                  <span className="text-[8px] px-1 rounded bg-emerald-200 text-emerald-800 font-sans font-bold">
                                    Best
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {product.factoryQuotes.length > 3 && (
                          <div className="text-right text-[9px] text-slate-400 font-medium">
                            +{product.factoryQuotes.length - 3} more quotations
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50/60 p-2 rounded-lg border border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-[10px]">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>Factory Quotes (F1, F2...)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        + Add quotes
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg border border-amber-200/80 bg-amber-50/30">
                      <div className="text-[9px] font-bold text-amber-700 uppercase">EXW Factory</div>
                      <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">
                        {product.exwCurrency === 'RMB' ? `¥${product.exwPrice.toFixed(2)}` : `$${product.exwPrice.toFixed(2)}`}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {product.exwCurrency === 'RMB' ? `~$${exwInUsd}` : `~¥${(product.exwPrice * usdRate).toFixed(2)}`}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg border border-emerald-200/80 bg-emerald-50/30">
                      <div className="text-[9px] font-bold text-emerald-700 uppercase">
                        FOB {product.fobPort ? `(${product.fobPort})` : ''}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                        {product.fobCurrency === 'USD' ? `$${product.fobPrice.toFixed(2)}` : `¥${product.fobPrice.toFixed(2)}`}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {product.fobCurrency === 'USD' ? `~¥${fobInRmb}` : `~$${(product.fobPrice / usdRate).toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => onCreateInquiryFromProduct(product)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md transition flex items-center gap-1 cursor-pointer"
                      title="Create Sourcing Inquiry from this Product"
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      <span>Create Inquiry</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                        title="View Full Product Specs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                        title="Duplicate Product"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProduct(product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Item / Name</th>
                  <th className="py-3 px-3">Material</th>
                  <th className="py-3 px-3 text-right">Quantity</th>
                  <th className="py-3 px-3 text-right">Cartons</th>
                  <th className="py-3 px-3 text-right">Units/Ctn</th>
                  <th className="py-3 px-3">Carton Size (L×W×H)</th>
                  <th className="py-3 px-3 text-right">Total CBM</th>
                  <th className="py-3 px-3 min-w-[220px]">Container Loads (20GP / 40GP / 40HC / 45HC)</th>
                  <th className="py-3 px-3 min-w-[210px]">Factory Quotations (Factory 1, 2, ...)</th>
                  <th className="py-3 px-3 text-right">EXW Price</th>
                  <th className="py-3 px-3 text-right">FOB Price</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const l = Number(p.cartonLengthCm || 0);
                  const w = Number(p.cartonWidthCm || 0);
                  const h = Number(p.cartonHeightCm || 0);
                  const singleCbm = p.cartonCbm || Number(((l * w * h) / 1000000).toFixed(4));
                  const totalCbm = p.totalCbm || Number((singleCbm * p.cartons).toFixed(3));
                  const perCtn = p.unitsPerCarton || 1;
                  const c20 = p.cartons20gp || (singleCbm > 0 ? Math.floor(28 / singleCbm) : 0);
                  const q20 = p.qty20gp || c20 * perCtn;
                  const c40 = p.cartons40gp || (singleCbm > 0 ? Math.floor(58 / singleCbm) : 0);
                  const q40 = p.qty40gp || c40 * perCtn;
                  const c40h = p.cartons40hc || (singleCbm > 0 ? Math.floor(68 / singleCbm) : 0);
                  const q40h = p.qty40hc || c40h * perCtn;
                  const c45h = p.cartons45hc || (singleCbm > 0 ? Math.floor(78 / singleCbm) : 0);
                  const q45h = p.qty45hc || c45h * perCtn;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt="" className="w-7 h-7 rounded object-cover shrink-0 border border-slate-200" />
                          )}
                          <div className="truncate">
                            <span
                              onClick={() => onViewProduct(p)}
                              className="hover:text-indigo-600 cursor-pointer truncate font-bold block"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                            {p.itemCode && <span className="text-[10px] font-mono text-slate-500">{p.itemCode}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[150px] truncate" title={p.material}>
                        {p.material}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {p.quantity.toLocaleString()} {p.quantityUnit || 'pcs'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                        {p.cartons} ctns
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {p.unitsPerCarton}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {l}×{w}×{h} cm
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                        {totalCbm.toFixed(3)} m³
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                          <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 flex items-center justify-between gap-1 shadow-2xs" title={`20GP (28 CBM): ${c20} cartons, ${q20.toLocaleString()} units`}>
                            <span className="font-bold text-blue-700 text-[10px]">20GP:</span>
                            <span className="text-slate-800 font-semibold">{c20}c <span className="text-[10px] text-slate-500">({q20.toLocaleString()})</span></span>
                          </div>
                          <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 flex items-center justify-between gap-1 shadow-2xs" title={`40GP (58 CBM): ${c40} cartons, ${q40.toLocaleString()} units`}>
                            <span className="font-bold text-indigo-700 text-[10px]">40GP:</span>
                            <span className="text-slate-800 font-semibold">{c40}c <span className="text-[10px] text-slate-500">({q40.toLocaleString()})</span></span>
                          </div>
                          <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 flex items-center justify-between gap-1 shadow-2xs" title={`40HC (68 CBM): ${c40h} cartons, ${q40h.toLocaleString()} units`}>
                            <span className="font-bold text-emerald-700 text-[10px]">40HC:</span>
                            <span className="text-slate-800 font-semibold">{c40h}c <span className="text-[10px] text-slate-500">({q40h.toLocaleString()})</span></span>
                          </div>
                          <div className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80 flex items-center justify-between gap-1 shadow-2xs" title={`45HC (78 CBM): ${c45h} cartons, ${q45h.toLocaleString()} units`}>
                            <span className="font-bold text-purple-700 text-[10px]">45HC:</span>
                            <span className="text-slate-800 font-semibold">{c45h}c <span className="text-[10px] text-slate-500">({q45h.toLocaleString()})</span></span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 min-w-[210px]">
                        {p.factoryQuotes && p.factoryQuotes.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-1">
                              {p.factoryQuotes.map((fq, idx) => {
                                const isMin = Math.min(...p.factoryQuotes!.map((q) => (q.currency === fq.currency ? q.price : Infinity))) === fq.price;
                                return (
                                  <div
                                    key={fq.id || idx}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 shadow-2xs ${
                                      fq.isPrimary
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold ring-1 ring-indigo-400/30'
                                        : isMin
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                    title={`${fq.factoryName}\nPrice: ${fq.currency === 'RMB' ? '¥' : '$'}${fq.price.toFixed(2)}${fq.moq ? `\nMOQ: ${fq.moq.toLocaleString()} pcs` : ''}${fq.leadTimeDays ? `\nLead: ${fq.leadTimeDays}d` : ''}${fq.notes ? `\nNotes: ${fq.notes}` : ''}`}
                                  >
                                    <span className="font-sans font-bold text-[9px] text-slate-500 uppercase">
                                      {fq.factoryName.startsWith('Factory')
                                        ? fq.factoryName.split(' ')[0] + ' ' + fq.factoryName.split(' ')[1]
                                        : `F${idx + 1}`}
                                    </span>
                                    <span className="font-bold">
                                      {fq.currency === 'RMB' ? `¥${fq.price.toFixed(2)}` : `$${fq.price.toFixed(2)}`}
                                    </span>
                                    {fq.isPrimary && (
                                      <span className="text-[8px] px-1 py-0.2 rounded bg-indigo-200/80 text-indigo-800 font-sans font-bold uppercase">
                                        Primary
                                      </span>
                                    )}
                                    {isMin && !fq.isPrimary && (
                                      <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-200/80 text-emerald-800 font-sans font-bold uppercase">
                                        Best
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>{p.factoryQuotes.length} quotes</span>
                              <button
                                type="button"
                                onClick={() => onEditProduct(p)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-medium"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="text-[10px] text-slate-400 hover:text-indigo-600 px-2 py-1 rounded border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            <span>Add Quotes</span>
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {p.exwCurrency === 'RMB' ? `¥${p.exwPrice.toFixed(2)}` : `$${p.exwPrice.toFixed(2)}`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                        {p.fobCurrency === 'USD' ? `$${p.fobPrice.toFixed(2)}` : `¥${p.fobPrice.toFixed(2)}`}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onCreateInquiryFromProduct(p)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Create Inquiry"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onViewProduct(p)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="View"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(p)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

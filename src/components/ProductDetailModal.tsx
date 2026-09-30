import React from 'react';
import {
  X,
  Package,
  Boxes,
  DollarSign,
  Scale,
  Truck,
  Ship,
  ExternalLink,
  Edit2,
  Copy,
  Trash2,
  Share2,
  Check,
  Tag,
  ArrowUpRight,
  Layers,
  Calculator,
  Building2,
  Star,
  TrendingDown,
} from 'lucide-react';
import { CatalogProduct, ExchangeRates, CurrencyViewMode } from '../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct | null;
  exchangeRates: ExchangeRates;
  currencyView: CurrencyViewMode;
  onEdit: (product: CatalogProduct) => void;
  onDelete: (productId: string) => void;
  onCreateInquiry: (product: CatalogProduct) => void;
  onDuplicate: (product: CatalogProduct) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  exchangeRates,
  currencyView,
  onEdit,
  onDelete,
  onCreateInquiry,
  onDuplicate,
}) => {
  if (!isOpen || !product) return null;

  const usdRate = exchangeRates.USD_TO_RMB || 7.25;
  const l = Number(product.cartonLengthCm || 0);
  const w = Number(product.cartonWidthCm || 0);
  const h = Number(product.cartonHeightCm || 0);
  const singleCbm = product.cartonCbm || Number(((l * w * h) / 1000000).toFixed(4));
  const totalCbm = product.totalCbm || Number((singleCbm * product.cartons).toFixed(3));
  const totalGw = product.totalGrossWeightKg || Number(((product.grossWeightKg || 0) * product.cartons).toFixed(2));

  const pct20ft = totalCbm > 0 ? Math.min(100, Math.round((totalCbm / 28) * 100)) : 0;
  const pct40hq = totalCbm > 0 ? Math.min(100, Math.round((totalCbm / 68) * 100)) : 0;

  const exwInUsd = product.exwCurrency === 'RMB' ? (product.exwPrice / usdRate).toFixed(2) : product.exwPrice.toFixed(2);
  const fobInRmb = product.fobCurrency === 'USD' ? (product.fobPrice * usdRate).toFixed(2) : product.fobPrice.toFixed(2);

  // Container load estimates / saved values
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 line-clamp-1">{product.name}</h2>
                {product.itemCode && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {product.itemCode}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {product.category || 'General Product'} • {product.quantity.toLocaleString()} {product.quantityUnit || 'pcs'}
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Top visual block: Image & Key Highlights */}
          <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-50 p-4 rounded-xl border border-slate-200">
            {product.imageUrl ? (
              <div className="w-full sm:w-36 h-36 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs">
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full sm:w-36 h-36 rounded-lg border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                <Package className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-[11px]">No photo</span>
              </div>
            )}

            <div className="flex-1 space-y-2.5 min-w-0">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Material</span>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{product.material}</p>
              </div>

              {product.colorVariants && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Variants</span>
                  <p className="text-xs text-slate-700 mt-0.5">{product.colorVariants}</p>
                </div>
              )}

              {/* Pricing row */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-amber-600 uppercase block">EXW Price</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {product.exwCurrency === 'RMB' ? `¥${product.exwPrice.toFixed(2)}` : `$${product.exwPrice.toFixed(2)}`}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {product.exwCurrency === 'RMB' ? `~$${exwInUsd} USD` : `~¥${(product.exwPrice * usdRate).toFixed(2)}`}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase block">FOB Price</span>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {product.fobCurrency === 'USD' ? `$${product.fobPrice.toFixed(2)}` : `¥${product.fobPrice.toFixed(2)}`}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {product.fobPort ? `${product.fobPort} Port` : `~¥${fobInRmb} RMB`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Carton & CBM Logistics Specs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <span>Cartons, CBM & Packaging Specifications</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Cartons</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {product.cartons} <span className="text-xs text-slate-500 font-normal">ctns</span>
                </span>
                <span className="text-[10px] text-slate-400">{product.unitsPerCarton} pcs / ctn</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Carton Dimensions</span>
                <span className="text-xs font-bold font-mono text-slate-900 mt-1 block">
                  {l} × {w} × {h} cm
                </span>
                <span className="text-[10px] text-slate-400">{singleCbm.toFixed(4)} m³ / ctn</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Volume</span>
                <span className="text-base font-bold font-mono text-indigo-700 mt-0.5 block">
                  {totalCbm.toFixed(3)} <span className="text-xs text-slate-500 font-normal">CBM</span>
                </span>
                <span className="text-[10px] text-slate-400">{pct20ft}% of 20ft container</span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Gross Weight</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  {totalGw} <span className="text-xs text-slate-500 font-normal">kg</span>
                </span>
                <span className="text-[10px] text-slate-400">{product.grossWeightKg || 0} kg / ctn</span>
              </div>
            </div>

            {/* Container load breakdown: 20GP, 40GP, 40HC, 45HC */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Container Load Capacities (Ocean Freight)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Current Shipment: {pct20ft}% of 20GP • {pct40hq}% of 40HC
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800">20GP</span>
                    <span className="text-[9px] text-slate-400 font-mono">28 m³</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700">
                    {c20.toLocaleString()} ctns
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {q20.toLocaleString()} {product.quantityUnit || 'pcs'}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800">40GP</span>
                    <span className="text-[9px] text-slate-400 font-mono">58 m³</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700">
                    {c40.toLocaleString()} ctns
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {q40.toLocaleString()} {product.quantityUnit || 'pcs'}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800">40HC</span>
                    <span className="text-[9px] text-slate-400 font-mono">68 m³</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-700">
                    {c40h.toLocaleString()} ctns
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {q40h.toLocaleString()} {product.quantityUnit || 'pcs'}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800">45HC</span>
                    <span className="text-[9px] text-slate-400 font-mono">78 m³</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-purple-700">
                    {c45h.toLocaleString()} ctns
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {q45h.toLocaleString()} {product.quantityUnit || 'pcs'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FACTORY QUOTATIONS COMPARISON */}
          {product.factoryQuotes && product.factoryQuotes.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Factory Quotations Comparison ({product.factoryQuotes.length} Factories)</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Order Size: {product.quantity.toLocaleString()} {product.quantityUnit || 'pcs'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.factoryQuotes.map((fq, idx) => {
                  const isMin =
                    Math.min(
                      ...product.factoryQuotes!.map((q) =>
                        q.currency === fq.currency ? q.price : Infinity
                      )
                    ) === fq.price;

                  const priceInUsd =
                    fq.currency === 'USD'
                      ? fq.price.toFixed(2)
                      : (fq.price / usdRate).toFixed(2);
                  const priceInRmb =
                    fq.currency === 'RMB'
                      ? fq.price.toFixed(2)
                      : (fq.price * usdRate).toFixed(2);

                  const totalBatchCost =
                    fq.currency === 'RMB'
                      ? `¥${(fq.price * product.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `$${(fq.price * product.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                  return (
                    <div
                      key={fq.id || idx}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-2.5 shadow-2xs ${
                        fq.isPrimary
                          ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20'
                          : isMin
                          ? 'bg-emerald-50/30 border-emerald-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            #{idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {fq.isPrimary && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full uppercase">
                                <Star className="w-2.5 h-2.5 fill-indigo-600 text-indigo-600" />
                                <span>Primary</span>
                              </span>
                            )}
                            {isMin && !fq.isPrimary && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase">
                                <TrendingDown className="w-2.5 h-2.5" />
                                <span>Lowest</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug" title={fq.factoryName}>
                            {fq.factoryName}
                          </h4>
                          {fq.contactPerson && (
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                              {fq.contactPerson}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Unit Quote:</span>
                          <div className="text-right">
                            <span className="text-sm font-bold font-mono text-slate-900">
                              {fq.currency === 'RMB' ? `¥${fq.price.toFixed(2)}` : `$${fq.price.toFixed(2)}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {fq.currency === 'RMB' ? `~$${priceInUsd}` : `~¥${priceInRmb}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Total ({product.quantity.toLocaleString()} pcs):</span>
                          <span className="font-mono font-bold text-slate-900">{totalBatchCost}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 text-slate-600">
                          <div>
                            <span className="text-slate-400">MOQ: </span>
                            <span className="font-semibold">{fq.moq ? `${fq.moq.toLocaleString()} pcs` : 'Standard'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400">Lead: </span>
                            <span className="font-semibold">{fq.leadTimeDays ? `${fq.leadTimeDays} days` : 'Negotiable'}</span>
                          </div>
                        </div>

                        {fq.notes && (
                          <div className="text-[10px] text-slate-600 bg-white/80 p-1.5 rounded border border-slate-200 mt-1 italic leading-relaxed">
                            {fq.notes}
                          </div>
                        )}

                        {fq.supplierUrl && (
                          <a
                            href={fq.supplierUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 pt-1"
                          >
                            <span>Open 1688 / Factory URL</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Supplier & Sourcing Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>Sourcing & Factory Information</span>
            </h3>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Factory / Supplier:</span>
                  <span className="font-bold text-slate-900">{product.supplierName || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Supplier Contact / WeChat:</span>
                  <span className="font-bold text-slate-900">{product.supplierContact || 'None listed'}</span>
                </div>
              </div>

              {product.hsCode && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">Customs HS Code:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {product.hsCode}
                  </span>
                </div>
              )}

              {product.supplierUrl && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 text-[11px]">B2B Product Listing:</span>
                  <a
                    href={product.supplierUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <span>Open 1688 / Factory link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Quality Specs */}
          {product.notes && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                QC & Inspection Notes
              </h3>
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 text-xs text-amber-950 whitespace-pre-wrap leading-relaxed">
                {product.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(product.id);
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs font-semibold flex items-center gap-1 border border-rose-200"
              title="Delete Product"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDuplicate(product);
              }}
              className="p-2 text-slate-600 hover:bg-slate-200/60 rounded-lg transition text-xs font-semibold flex items-center gap-1 border border-slate-300"
              title="Duplicate Product"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Specs</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateInquiry(product);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Create Inquiry from Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

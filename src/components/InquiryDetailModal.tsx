import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Edit2,
  Share2,
  Copy,
  Trash2,
  Check,
  Package,
  Building2,
  Globe,
  Phone,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Truck,
  FileText,
  Calendar,
  Layers,
  Award,
  Users,
  UserCheck,
  Coins,
  Box,
  Scale,
  Ruler,
  Target,
  AlertCircle,
  Clock,
  MessageCircle,
  Receipt,
  CreditCard,
  Tag,
} from 'lucide-react';
import { InquiryItem, OrderStatus } from '../types';
import {
  formatCurrency,
  formatUnitPrice,
  formatDualUnitPrice,
  formatDualTotal,
  calculateHelperCommissionAmount,
  calculateTotalHelperCommissions,
  calculateTotalInquiryExpenses,
  calculatePackagingDetails,
} from '../lib/currency';
import { detectB2BPlatform } from '../lib/b2bPlatforms';
import {
  getCountryFlag,
  cleanPhoneNumber,
  extractClientPhone,
  getWhatsAppWebUrl,
  getWhatsAppMessengerUrl,
  openWhatsAppMessenger,
  DEFAULT_WHATSAPP_MESSAGE,
} from '../lib/countryFlags';

interface InquiryDetailModalProps {
  isOpen: boolean;
  item?: InquiryItem | null;
  inquiry?: InquiryItem | null;
  usdToRmbRate: number;
  onClose: () => void;
  onEdit: (item: InquiryItem) => void;
  onShare: (item: InquiryItem) => void;
  onDuplicate?: (item: InquiryItem) => void;
  onDeleteRequest?: (item: InquiryItem) => void;
  onStatusChange: (item: InquiryItem, newStatus: OrderStatus) => void;
}

const ALL_STATUSES: OrderStatus[] = [
  'New Inquiry',
  '1688 Sourcing',
  'Quoted to Client',
  'Sample Ordered',
  'Sample Approved',
  'Order Placed',
  'In Production',
  'QC & Inspection',
  'Shipped',
  'Completed',
  'Cancelled',
];

export const InquiryDetailModal: React.FC<InquiryDetailModalProps> = ({
  isOpen,
  item: propItem,
  inquiry: propInquiry,
  usdToRmbRate,
  onClose,
  onEdit,
  onShare,
  onDuplicate,
  onDeleteRequest,
  onStatusChange,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const item = propItem || propInquiry;
  if (!isOpen || !item) return null;

  const rate = usdToRmbRate || 7.25;
  const unitCostUsd = (item.price1688Rmb || 0) / rate;
  const domesticShippingUsd = (item.domesticShippingRmb || 0) / rate;
  const total1688Rmb = ((item.price1688Rmb || 0) * (item.quantity || 1)) + (item.domesticShippingRmb || 0);
  const total1688Usd = total1688Rmb / rate;

  const totalHelpersCommission = calculateTotalHelperCommissions(
    item.helperCommissions,
    item.estimatedProfitUsd || 0,
    item.quantity || 1
  );

  const totalInquiryExpenses = calculateTotalInquiryExpenses(item.inquiryExpenses, rate);

  const netAgentProfit = Number(
    ((item.estimatedProfitUsd || 0) - totalHelpersCommission - totalInquiryExpenses.totalUsd).toFixed(2)
  );

  const packaging = calculatePackagingDetails({
    quantity: item.quantity || 1,
    pcsPerBox: item.pcsPerBox,
    boxLengthCm: item.boxLengthCm,
    boxWidthCm: item.boxWidthCm,
    boxHeightCm: item.boxHeightCm,
    grossWeightKg: item.grossWeightKg,
    netWeightKg: item.netWeightKg,
  });

  const hasProductSpecs = Boolean(
    item.material ||
    item.colorVariant ||
    item.packagingType ||
    item.hsCode ||
    item.unitWeightG ||
    item.boxLengthCm ||
    item.pcsPerBox ||
    item.grossWeightKg ||
    item.moq ||
    item.sampleQuantity ||
    item.deliveryLeadTimeDays ||
    item.annualEstimatedQuantity ||
    item.quantityTolerancePercent
  );

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'New Inquiry':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case '1688 Sourcing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Quoted to Client':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Sample Ordered':
      case 'Sample Approved':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Order Placed':
      case 'In Production':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'QC & Inspection':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Shipped':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div
      id="inquiry-detail-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div
        id="inquiry-detail-modal-container"
        className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 font-mono truncate">
                  {item.inquiryNumber}
                </h2>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                Inquiry Details & Quotation Breakdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Status dropdown */}
            <select
              id="detail-modal-status-select"
              value={item.orderStatus}
              onChange={(e) => onStatusChange(item, e.target.value as OrderStatus)}
              className={`text-[10px] sm:text-xs font-bold uppercase px-2 sm:px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getStatusBadgeStyle(
                item.orderStatus
              )}`}
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st} className="bg-white text-slate-800 normal-case font-normal text-xs">
                  {st}
                </option>
              ))}
            </select>

            <button
              id="detail-modal-close-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-4 sm:space-y-5 text-slate-800 text-xs">
          {/* Top Grid: Product & Client Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-400" />
                  <span>Product Information</span>
                </div>

                <div className="flex items-start gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.product}
                      className="w-16 h-16 rounded-lg border border-slate-200 object-cover shrink-0 bg-white shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-slate-200 bg-white flex items-center justify-center shrink-0 text-slate-300">
                      <Package className="w-8 h-8" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                      {item.product}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                        {Number(item.quantity || 1).toLocaleString()} {item.quantityUnit || 'pcs'}
                      </span>
                      {item.targetPriceUsd && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-1">
                          <Target className="w-3 h-3 text-emerald-600" />
                          Target: {formatUnitPrice(item.targetPriceUsd, 'USD')}
                        </span>
                      )}
                      {item.moq && (
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                          (item.quantity || 0) >= item.moq
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          MOQ: {item.moq.toLocaleString()} {item.quantityUnit || 'pcs'}
                        </span>
                      )}
                      {item.supplierName && (
                        <span className="text-slate-500 truncate" title={item.supplierName}>
                          Store: <strong className="text-slate-700">{item.supplierName}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {item.productUrl1688 && (() => {
                const plat = detectB2BPlatform(item.productUrl1688);
                return (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Sourcing / B2B Link:</span>
                    <a
                      href={item.productUrl1688}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold border ${plat.badgeBg} ${plat.badgeText} ${plat.badgeBorder} hover:opacity-85 transition`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${plat.dotColor}`} />
                      <span>Open {plat.name}</span>
                      <ExternalLink className="w-3 h-3 opacity-75" />
                    </a>
                  </div>
                );
              })()}
            </div>

            {/* Client Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Customer & Destination</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{item.customerName}</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                      <span className="text-sm leading-none">{getCountryFlag(item.country)}</span>
                      <span>{item.country || 'Global'}</span>
                    </span>
                  </div>

                  {item.customerContact && (() => {
                    const clientPhone = extractClientPhone(item.whatsapp || item.customerContact, item.country);
                    const messengerUrl = clientPhone
                      ? getWhatsAppMessengerUrl(
                          clientPhone,
                          DEFAULT_WHATSAPP_MESSAGE
                        )
                      : null;
                    const waWebUrl = clientPhone
                      ? getWhatsAppWebUrl(
                          clientPhone,
                          DEFAULT_WHATSAPP_MESSAGE
                        )
                      : null;

                    return (
                      <div className="flex items-center justify-between text-slate-600 bg-white p-2 rounded border border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 font-medium text-xs">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {item.customerContact}
                          </span>
                          {messengerUrl && (
                            <div className="flex items-center gap-1">
                              <a
                                href={messengerUrl}
                                onClick={(e) => {
                                  e.preventDefault();
                                  openWhatsAppMessenger(
                                    clientPhone,
                                    DEFAULT_WHATSAPP_MESSAGE
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs cursor-pointer"
                                title={`Open client directly in WhatsApp App (+${clientPhone})`}
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp App</span>
                              </a>
                              {waWebUrl && (
                                <a
                                  href={waWebUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 transition"
                                  title="Or open in WhatsApp Web browser tab"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Web</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => copyToClipboard(item.customerContact || '', 'contact')}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition"
                          title="Copy contact"
                        >
                          {copiedField === 'contact' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })()}

                  {item.wechatId && (
                    <div className="flex items-center justify-between text-slate-600 bg-white p-2 rounded border border-slate-200/70">
                      <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        WeChat: {item.wechatId}
                      </span>
                      <button
                        onClick={() => copyToClipboard(item.wechatId || '', 'wechat')}
                        className="text-slate-400 hover:text-emerald-600 p-0.5 rounded transition"
                        title="Copy WeChat ID"
                      >
                        {copiedField === 'wechat' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="font-mono text-slate-500">
                  {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : item.date}
                </span>
              </div>
            </div>
          </div>

          {/* Product Specifications & Packaging Details (if any specs exist) */}
          {hasProductSpecs && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-indigo-600" />
                  Product Specifications & Master Carton Packaging
                </span>
                {packaging.totalCartons > 0 && (
                  <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                    {packaging.totalCartons} Master Cartons
                  </span>
                )}
              </div>

              <div className="p-4 bg-white space-y-3.5">
                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {item.material && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Material</div>
                      <div className="font-medium text-slate-800 mt-0.5">{item.material}</div>
                    </div>
                  )}

                  {item.colorVariant && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Color / Finish</div>
                      <div className="font-medium text-slate-800 mt-0.5">{item.colorVariant}</div>
                    </div>
                  )}

                  {item.packagingType && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Packaging Type</div>
                      <div className="font-medium text-slate-800 mt-0.5">{item.packagingType}</div>
                    </div>
                  )}

                  {item.hsCode && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">HS / Tariff Code</div>
                      <div className="font-mono font-semibold text-slate-800 mt-0.5">{item.hsCode}</div>
                    </div>
                  )}

                  {item.unitWeightG && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Unit Weight</div>
                      <div className="font-mono font-semibold text-slate-800 mt-0.5">{item.unitWeightG} g / pc</div>
                    </div>
                  )}

                  {item.moq && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Supplier MOQ</div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {item.moq.toLocaleString()} {item.quantityUnit || 'pcs'}
                      </div>
                    </div>
                  )}

                  {item.sampleQuantity && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Sample Units</div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {item.sampleQuantity} {item.quantityUnit || 'pcs'}
                      </div>
                    </div>
                  )}

                  {item.deliveryLeadTimeDays && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Lead Time</span>
                      </div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {item.deliveryLeadTimeDays} days
                      </div>
                    </div>
                  )}

                  {item.annualEstimatedQuantity && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Est. Annual Volume</div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {item.annualEstimatedQuantity.toLocaleString()} {item.quantityUnit || 'pcs'}/yr
                      </div>
                    </div>
                  )}

                  {item.quantityTolerancePercent !== undefined && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] font-bold uppercase text-slate-500">Quantity Tolerance</div>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        ±{item.quantityTolerancePercent}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Carton Dimensions & Volume Bento */}
                {(item.boxLengthCm || item.pcsPerBox || item.grossWeightKg) && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    {/* Dimensions */}
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Ruler className="w-3 h-3 text-slate-400" />
                        <span>Carton Size (L×W×H)</span>
                      </div>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">
                        {item.boxLengthCm && item.boxWidthCm && item.boxHeightCm
                          ? `${item.boxLengthCm} × ${item.boxWidthCm} × ${item.boxHeightCm} cm`
                          : '-'}
                      </div>
                      {packaging.cbmPerCarton > 0 && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {packaging.cbmPerCarton} m³ / carton
                        </div>
                      )}
                    </div>

                    {/* Pcs per box */}
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Box className="w-3 h-3 text-slate-400" />
                        <span>Pcs / Master Carton</span>
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {item.pcsPerBox ? `${item.pcsPerBox} pcs / box` : '-'}
                      </div>
                      {packaging.totalCartons > 0 && (
                        <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                          {packaging.totalCartons} cartons total
                        </div>
                      )}
                    </div>

                    {/* Total Volume */}
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">Total Shipment Volume</div>
                      <div className="font-bold font-mono text-indigo-700 mt-0.5 text-sm">
                        {packaging.totalCbm > 0 ? `${packaging.totalCbm} CBM` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-500">Cubic Meters</div>
                    </div>

                    {/* Gross Weight */}
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400" />
                        <span>Est. Total Weight</span>
                      </div>
                      <div className="font-bold font-mono text-emerald-700 mt-0.5 text-sm">
                        {packaging.totalGrossWeightKg > 0 ? `${packaging.totalGrossWeightKg} kg GW` : '-'}
                      </div>
                      {item.grossWeightKg && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {item.grossWeightKg} kg / carton
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing & Financial Breakdown */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Financials & Sourcing Margin
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Rate: 1 USD = ¥{rate.toFixed(2)} RMB
              </span>
            </div>

            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
              {/* Unit Sourcing Cost */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500">Supplier Unit Price</div>
                <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  ¥{formatUnitPrice(item.price1688Rmb || 0, 'RMB')}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ≈ {formatUnitPrice(unitCostUsd, 'USD')}
                </div>
              </div>

              {/* Domestic Shipping */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-slate-400" />
                  <span>Domestic Freight</span>
                </div>
                <div className="text-base font-bold font-mono text-slate-800 mt-0.5">
                  ¥{formatUnitPrice(item.domesticShippingRmb || 0, 'RMB')}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  ≈ {formatCurrency(domesticShippingUsd, 'USD')}
                </div>
              </div>

              {/* Profit Margin */}
              <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200">
                <div className="text-[10px] font-bold uppercase text-emerald-700 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span>
                    {item.marginMode === 'deal_usd' || item.marginMode === 'deal_rmb'
                      ? 'Whole Deal Profit'
                      : 'Gross Margin'}
                  </span>
                </div>
                <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                  {item.marginMode === 'deal_usd'
                    ? `+${formatCurrency(item.marginDealTotal ?? item.estimatedProfitUsd ?? 0, 'USD')}`
                    : item.marginMode === 'deal_rmb'
                    ? `+¥${formatCurrency(item.marginDealTotal ?? ((item.estimatedProfitUsd || 0) * rate), 'RMB')}`
                    : item.marginFixedUsd && item.marginFixedUsd > 0 && !item.marginPercent
                    ? `+${formatUnitPrice(item.marginFixedUsd, 'USD')}/pc`
                    : `+${item.marginPercent || 0}%`}
                </div>
                <div className="text-[11px] text-emerald-700 font-mono font-medium mt-0.5">
                  {item.marginMode === 'deal_usd' || item.marginMode === 'deal_rmb' ? (
                    <>
                      +{formatUnitPrice((item.estimatedProfitUsd || 0) / Math.max(1, Number(item.quantity) || 1), 'USD')}/pc • +{formatCurrency(item.estimatedProfitUsd || 0, 'USD')}
                    </>
                  ) : (
                    <>
                      +{formatCurrency(item.estimatedProfitUsd || 0, 'USD')}{' '}
                      <span className="text-emerald-600/80 font-normal">
                        (¥{formatCurrency((item.estimatedProfitUsd || 0) * rate, 'RMB')})
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Client Unit Price */}
              <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200">
                <div className="text-[10px] font-bold uppercase text-indigo-700">Client Unit Price</div>
                <div className="text-base font-bold font-mono text-indigo-800 mt-0.5">
                  {formatUnitPrice(item.clientUnitPriceUsd || 0, 'USD')}
                </div>
                <div className="text-[11px] text-indigo-700 font-mono font-medium mt-0.5">
                  ¥{formatUnitPrice((item.clientUnitPriceUsd || 0) * rate, 'RMB')} / pc
                </div>
              </div>
            </div>

            {/* Total Quotation Highlight Bar */}
            <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-300">Total Client Quotation ({Number(item.quantity || 1).toLocaleString()} pcs):</span>
                <div className="text-lg font-bold text-white tracking-tight font-mono">
                  {formatCurrency(item.totalQuotationUsd || 0, 'USD')}{' '}
                  <span className="text-sm font-normal text-slate-300">
                    (¥{formatCurrency((item.totalQuotationUsd || 0) * rate, 'RMB')})
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                {totalHelpersCommission > 0 && (
                  <div className="text-left sm:text-right">
                    <span className="text-amber-300 text-[11px] block">Collaborators Payout:</span>
                    <div className="text-sm font-bold text-amber-300 font-mono">
                      -{formatCurrency(totalHelpersCommission, 'USD')}{' '}
                      <span className="text-[10px] font-normal text-amber-300/80">
                        (-¥{formatCurrency(totalHelpersCommission * rate, 'RMB')})
                      </span>
                    </div>
                  </div>
                )}

                {totalInquiryExpenses.totalUsd > 0 && (
                  <div className="text-left sm:text-right pl-3 border-l border-slate-700">
                    <span className="text-rose-300 text-[11px] block">Inquiry Expenses:</span>
                    <div className="text-sm font-bold text-rose-300 font-mono">
                      -{formatCurrency(totalInquiryExpenses.totalUsd, 'USD')}{' '}
                      <span className="text-[10px] font-normal text-rose-300/80">
                        (-¥{formatCurrency(totalInquiryExpenses.totalRmb, 'RMB')})
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-left sm:text-right pl-3 border-l border-slate-700">
                  <span className="text-emerald-400 text-[11px] block">
                    {totalHelpersCommission > 0 || totalInquiryExpenses.totalUsd > 0 ? 'Your Net Profit:' : 'Total Net Profit:'}
                  </span>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    +{formatCurrency(netAgentProfit, 'USD')}{' '}
                    <span className="text-xs font-normal text-emerald-400/80">
                      (+¥{formatCurrency(netAgentProfit * rate, 'RMB')})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inquiry Out-of-Pocket Expenses Section (if any exist) */}
          {item.inquiryExpenses && item.inquiryExpenses.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Inquiry Out-of-Pocket Expenses ({item.inquiryExpenses.length})
                </span>
                <span className="text-xs font-bold font-mono text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full self-start sm:self-auto">
                  Total Expenses: -{formatCurrency(totalInquiryExpenses.totalUsd, 'USD')} (-¥{formatCurrency(totalInquiryExpenses.totalRmb, 'RMB')})
                </span>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {item.inquiryExpenses.map((expense, idx) => {
                  const amtUsd = expense.currency === 'RMB' ? expense.amount / rate : expense.amount;
                  const amtRmb = expense.currency === 'RMB' ? expense.amount : expense.amount * rate;

                  return (
                    <div
                      key={expense.id || idx}
                      className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                            <span>{expense.title || expense.category || 'Out-of-Pocket Expense'}</span>
                            {expense.hasFapiao && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                发票 Fapiao
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            {expense.supplierOrPayee && (
                              <span className="text-slate-600 font-medium">Payee: {expense.supplierOrPayee}</span>
                            )}
                            {expense.paymentMethod && (
                              <span className="text-slate-500">Method: {expense.paymentMethod}</span>
                            )}
                            {expense.date && (
                              <span className="text-slate-400">Date: {expense.date}</span>
                            )}
                            {expense.notes && (
                              <span className="text-slate-400 italic">Note: {expense.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center pl-10 sm:pl-0">
                        <div className="text-xs font-bold font-mono text-rose-600">
                          -{formatCurrency(amtUsd, 'USD')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            (-¥{formatCurrency(amtRmb, 'RMB')})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Recorded: {expense.currency === 'RMB' ? `¥${expense.amount}` : `$${expense.amount}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collaborator & Helper Commissions Section (if any exist) */}
          {item.helperCommissions && item.helperCommissions.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Collaborator & Helper Commissions ({item.helperCommissions.length})
                </span>
                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Total Payout: {formatCurrency(totalHelpersCommission, 'USD')}
                </span>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {item.helperCommissions.map((helper, idx) => {
                  const payout = calculateHelperCommissionAmount(
                    helper,
                    item.estimatedProfitUsd || 0,
                    item.quantity || 1
                  );

                  return (
                    <div
                      key={helper.id || idx}
                      className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                            <span>{helper.name || `Helper #${idx + 1}`}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {helper.role || 'Sourcing Assistant'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            {helper.contact && (
                              <span className="text-slate-600 font-medium">Contact: {helper.contact}</span>
                            )}
                            {helper.notes && (
                              <span className="text-slate-400 italic">Note: {helper.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center pl-10 sm:pl-0">
                        <div className="text-xs font-bold font-mono text-emerald-700">
                          {formatCurrency(payout, 'USD')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            (¥{formatCurrency(payout * rate, 'RMB')})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {helper.type === 'percentage_profit'
                            ? `${helper.value}% of Margin`
                            : helper.type === 'fixed_per_unit'
                            ? `$${helper.value}/pc (${Number(item.quantity || 1).toLocaleString()} pcs)`
                            : `Fixed Flat $${helper.value}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Supplier Quotes Comparison (if any exist) */}
          {item.quotes && item.quotes.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Compared Suppliers ({item.quotes.length})
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  Multiple Chinese B2B factory quotes
                </span>
              </div>

              <div className="divide-y divide-slate-100 bg-white">
                {item.quotes.map((quote, idx) => {
                  const isWinning = quote.id === item.selectedQuoteId || (!item.selectedQuoteId && idx === 0);
                  const quotePriceUsd = (quote.price1688Rmb || 0) / rate;
                  const plat = quote.productUrl1688 ? detectB2BPlatform(quote.productUrl1688) : null;

                  return (
                    <div
                      key={quote.id || idx}
                      className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isWinning ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isWinning ? (
                          <span className="p-1 rounded bg-amber-100 text-amber-700 border border-amber-200" title="Selected Winning Quote">
                            <Award className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
                            #{idx + 1}
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                            <span>{quote.supplierName || `Supplier #${idx + 1}`}</span>
                            {isWinning && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                                Selected Winner
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            {quote.wechatId && <span>WeChat: {quote.wechatId}</span>}
                            {quote.whatsapp && <span>WhatsApp: {quote.whatsapp}</span>}
                            {quote.productUrl1688 && plat && (
                              <a
                                href={quote.productUrl1688}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${plat.badgeBg} ${plat.badgeText} ${plat.badgeBorder} hover:opacity-80`}
                              >
                                <span className={`w-1 h-1 rounded-full ${plat.dotColor}`} />
                                <span>{plat.shortName} Link</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:self-center">
                        <div className="font-bold font-mono text-slate-900 text-xs">
                          ¥{formatUnitPrice(quote.price1688Rmb || 0, 'RMB')}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ≈ {formatUnitPrice(quotePriceUsd, 'USD')}
                          {quote.domesticShippingRmb ? ` + ¥${formatUnitPrice(quote.domesticShippingRmb, 'RMB')} ship` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sourcing Specifications & Notes */}
          {item.notes ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Sourcing Notes & Special Specifications</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {item.notes}
              </p>
            </div>
          ) : (
            <div className="text-slate-400 italic text-xs px-1">
              No special sourcing notes recorded for this inquiry.
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-3.5 sm:px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              id="detail-modal-close-bottom-btn"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition text-center"
            >
              Close
            </button>
            {onDeleteRequest && (
              <button
                id="detail-modal-delete-btn"
                onClick={() => {
                  onClose();
                  onDeleteRequest(item);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition shadow-2xs cursor-pointer"
                title="Delete this inquiry"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onDuplicate && (
              <button
                id="detail-modal-duplicate-btn"
                onClick={() => onDuplicate(item)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-amber-700 font-semibold text-xs transition shadow-2xs"
                title="Duplicate this inquiry into a new quotation"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            )}

            <button
              id="detail-modal-share-btn"
              onClick={() => onShare(item)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-semibold text-xs transition shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Share Quote</span>
            </button>

            <button
              id="detail-modal-edit-btn"
              onClick={() => onEdit(item)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

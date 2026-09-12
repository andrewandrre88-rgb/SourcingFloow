import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  Edit2,
  Trash2,
  Share2,
  Copy,
  ChevronDown,
  ArrowUpDown,
  FileText,
  DollarSign,
  Percent,
  Package,
  Eye,
  Users,
  Box,
  Target,
} from 'lucide-react';
import { InquiryItem, OrderStatus, CurrencyViewMode } from '../types';
import {
  formatCurrency,
  formatUnitPrice,
  formatDualUnitPrice,
  formatDualTotal,
  formatAmountByViewMode,
  formatUnitAmountByViewMode,
  calculateTotalHelperCommissions,
} from '../lib/currency';
import { detectB2BPlatform } from '../lib/b2bPlatforms';

interface InquiryTableProps {
  inquiries: InquiryItem[];
  usdToRmbRate: number;
  currencyView?: CurrencyViewMode;
  onView: (item: InquiryItem) => void;
  onEdit: (item: InquiryItem) => void;
  onDeleteRequest: (item: InquiryItem) => void;
  onStatusChange: (item: InquiryItem, newStatus: OrderStatus) => void;
  onQuickShare: (item: InquiryItem) => void;
  onDuplicate: (item: InquiryItem) => void;
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

export const InquiryTable: React.FC<InquiryTableProps> = ({
  inquiries,
  usdToRmbRate,
  currencyView = 'USD',
  onView,
  onEdit,
  onDeleteRequest,
  onStatusChange,
  onQuickShare,
  onDuplicate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof InquiryItem>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter inquiries
  const filtered = inquiries.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.inquiryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.supplierName && item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || item.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort inquiries
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField] ?? '';
    let bVal = b[sortField] ?? '';

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof InquiryItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'New Inquiry':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case '1688 Sourcing':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Quoted to Client':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Sample Ordered':
      case 'Sample Approved':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'Order Placed':
      case 'In Production':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'QC & Inspection':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      case 'Shipped':
        return 'bg-teal-100 text-teal-700 border-teal-300';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Search & Filter Header */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            id="inquiry-search-input"
            type="text"
            placeholder="Search inquiries, clients, products, suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 whitespace-nowrap">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter:</span>
          </span>
          <select
            id="inquiry-status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 text-xs text-slate-700 rounded px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs font-medium"
          >
            <option value="All">All Inquiries ({inquiries.length})</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st} ({inquiries.filter((i) => i.orderStatus === st).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Responsive Line-by-Line Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold select-none border-b border-slate-200">
            <tr>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
                onClick={() => handleSort('inquiryNumber')}
              >
                <div className="flex items-center gap-1">
                  <span>Inquiry #</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
                onClick={() => handleSort('customerName')}
              >
                <div className="flex items-center gap-1">
                  <span>Customer Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
                onClick={() => handleSort('country')}
              >
                <div className="flex items-center gap-1">
                  <span>Country</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap min-w-[180px]"
                onClick={() => handleSort('product')}
              >
                <div className="flex items-center gap-1">
                  <span>Product & Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap text-right"
                onClick={() => handleSort('price1688Rmb')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Supplier Quote (¥)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap text-right"
                onClick={() => handleSort('marginPercent')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Margin</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap text-right"
                onClick={() => handleSort('totalQuotationUsd')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Client Quote ($)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                className="py-2.5 px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap text-center"
                onClick={() => handleSort('orderStatus')}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Order Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white text-[13px]">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No sourcing inquiries found</p>
                    <p className="text-xs text-slate-400">
                      {searchTerm
                        ? 'Try modifying your search or status filter.'
                        : 'Click "+ New Inquiry" to create your first client quotation.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              sorted.map((item) => {
                const unitCostUsd = (item.price1688Rmb || 0) / (usdToRmbRate || 7.25);
                const profitUsd = item.estimatedProfitUsd || 0;
                const helpersCommissionUsd = calculateTotalHelperCommissions(
                  item.helperCommissions,
                  profitUsd,
                  item.quantity || 1
                );
                const netProfitUsd = Number((profitUsd - helpersCommissionUsd).toFixed(2));
                const helperCount = item.helperCommissions?.length || 0;

                return (
                  <tr
                    key={item.id}
                    id={`inquiry-row-${item.id}`}
                    className="hover:bg-slate-50 bg-white transition-colors group"
                  >
                    {/* Inquiry Number & Date */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onView(item)}
                        className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 text-xs text-left hover:underline transition cursor-pointer"
                        title="Click to view full inquiry details"
                      >
                        {item.inquiryNumber}
                      </button>
                      <div className="text-[10px] text-slate-400">{item.date}</div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.customerName}</div>
                      {item.customerContact && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={item.customerContact}>
                          {item.customerContact}
                        </div>
                      )}
                      {item.wechatId && (
                        <div className="text-[11px] text-emerald-600 truncate max-w-[150px] font-medium" title={item.wechatId}>
                          WeChat: {item.wechatId}
                        </div>
                      )}
                    </td>

                    {/* Country */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.country || 'Global'}
                      </span>
                    </td>

                    {/* Product & Qty */}
                    <td className="py-2.5 px-4 min-w-[180px] max-w-[240px]">
                      <div className="flex items-start gap-2.5">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt="Product"
                            className="w-10 h-10 rounded border border-slate-200 object-cover shrink-0 bg-white"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-slate-800 font-medium truncate" title={item.product}>
                            {item.product}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {Number(item.quantity || 1).toLocaleString()} {item.quantityUnit || 'pcs'}
                            </span>
                            {item.targetPriceUsd && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-mono bg-emerald-50 border border-emerald-200 rounded text-emerald-700 font-semibold"
                                title={`Client Target: ${formatUnitPrice(item.targetPriceUsd, 'USD')}${item.targetPriceRmb ? ` (¥${formatUnitPrice(item.targetPriceRmb, 'RMB')})` : ''}`}
                              >
                                <Target className="w-2.5 h-2.5 text-emerald-600" />
                                Target {formatUnitPrice(item.targetPriceUsd, 'USD')}
                              </span>
                            )}
                            {item.moq && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                (MOQ: {item.moq.toLocaleString()})
                              </span>
                            )}
                            {item.boxLengthCm && item.pcsPerBox && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-mono bg-slate-100 border border-slate-200 rounded text-slate-600" title={`Box: ${item.boxLengthCm}x${item.boxWidthCm}x${item.boxHeightCm}cm | ${item.pcsPerBox}pcs/box`}>
                                <Box className="w-2.5 h-2.5 text-indigo-500" />
                                {item.pcsPerBox}pcs/ctn
                              </span>
                            )}
                            {item.productUrl1688 && (() => {
                              const plat = detectB2BPlatform(item.productUrl1688);
                              return (
                                <a
                                  href={item.productUrl1688}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${plat.badgeBg} ${plat.badgeText} ${plat.badgeBorder} hover:opacity-80 transition`}
                                  title={`Open ${plat.name} page`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${plat.dotColor}`} />
                                  <span>{plat.shortName} link</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                </a>
                              );
                            })()}
                          </div>
                          {item.material && (
                            <div className="text-[10px] text-slate-500 truncate mt-0.5" title={item.material}>
                              {item.material} {item.colorVariant ? `• ${item.colorVariant}` : ''}
                            </div>
                          )}
                          {item.quotes && item.quotes.length > 1 && (
                             <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                               {item.quotes.length} suppliers compared
                             </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quotation from 1688 */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-right">
                      {currencyView === 'RMB' ? (
                        <>
                          <div className="text-xs font-mono font-semibold text-slate-800">
                            ¥{formatUnitPrice(item.price1688Rmb || 0, 'RMB')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ≈ {formatUnitPrice(unitCostUsd, 'USD')}
                          </div>
                        </>
                      ) : currencyView === 'DUAL' ? (
                        <>
                          <div className="text-xs font-mono font-semibold text-slate-900">
                            ¥{formatUnitPrice(item.price1688Rmb || 0, 'RMB')}
                          </div>
                          <div className="text-[10px] text-indigo-600 font-mono font-semibold">
                            {formatUnitPrice(unitCostUsd, 'USD')}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-mono font-semibold text-slate-800">
                            {formatUnitPrice(unitCostUsd, 'USD')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ≈ ¥{formatUnitPrice(item.price1688Rmb || 0, 'RMB')}
                          </div>
                        </>
                      )}
                    </td>

                    {/* Add Margin & Net Take-Home */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-right">
                      <div className="text-xs text-green-600 font-bold">
                        +{item.marginPercent}%
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {currencyView === 'RMB' ? (
                          <>Gross: +¥{formatCurrency(profitUsd * usdToRmbRate, 'RMB')} <span className="text-slate-400 font-normal">({formatCurrency(profitUsd, 'USD')})</span></>
                        ) : currencyView === 'DUAL' ? (
                          <>Gross: +{formatCurrency(profitUsd, 'USD')} <span className="text-emerald-700 font-semibold">(¥{formatCurrency(profitUsd * usdToRmbRate, 'RMB')})</span></>
                        ) : (
                          <>Gross: +{formatCurrency(profitUsd, 'USD')} <span className="text-slate-400 font-normal">(¥{formatCurrency(profitUsd * usdToRmbRate, 'RMB')})</span></>
                        )}
                      </div>
                      {helpersCommissionUsd > 0 && (
                        <div className="mt-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                            title={`${helperCount} collaborators payout: -$${helpersCommissionUsd.toFixed(2)} (-¥${(helpersCommissionUsd * usdToRmbRate).toFixed(2)})`}
                          >
                            <Users className="w-2.5 h-2.5" />
                            <span>{helperCount} helper{helperCount > 1 ? 's' : ''} (-{currencyView === 'RMB' ? `¥${formatCurrency(helpersCommissionUsd * usdToRmbRate, 'RMB')}` : formatCurrency(helpersCommissionUsd, 'USD')})</span>
                          </span>
                          <div className="text-[10px] font-bold text-emerald-700 font-mono">
                            {currencyView === 'RMB'
                              ? `Net: +¥${formatCurrency(netProfitUsd * usdToRmbRate, 'RMB')} (${formatCurrency(netProfitUsd, 'USD')})`
                              : `Net: +${formatCurrency(netProfitUsd, 'USD')} (¥${formatCurrency(netProfitUsd * usdToRmbRate, 'RMB')})`}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Client Quote ($ / ¥) */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-right">
                      {currencyView === 'RMB' ? (
                        <>
                          <div className="text-xs font-bold font-mono text-slate-900">
                            ¥{formatCurrency((item.totalQuotationUsd || 0) * usdToRmbRate, 'RMB')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ¥{formatUnitPrice((item.clientUnitPriceUsd || 0) * usdToRmbRate, 'RMB')}/pc
                            <span className="text-slate-400 block">
                              ({formatCurrency(item.totalQuotationUsd || 0, 'USD')})
                            </span>
                          </div>
                        </>
                      ) : currencyView === 'DUAL' ? (
                        <>
                          <div className="text-xs font-bold font-mono text-slate-900">
                            {formatCurrency(item.totalQuotationUsd || 0, 'USD')}
                          </div>
                          <div className="text-[10px] text-indigo-700 font-mono font-bold">
                            ¥{formatCurrency((item.totalQuotationUsd || 0) * usdToRmbRate, 'RMB')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {formatUnitPrice(item.clientUnitPriceUsd || 0, 'USD')}/pc (¥{formatUnitPrice((item.clientUnitPriceUsd || 0) * usdToRmbRate, 'RMB')})
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-bold font-mono text-slate-900">
                            {formatCurrency(item.totalQuotationUsd || 0, 'USD')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {formatUnitPrice(item.clientUnitPriceUsd || 0, 'USD')}/pc
                            <span className="text-slate-400 block">
                              (¥{formatUnitPrice((item.clientUnitPriceUsd || 0) * usdToRmbRate, 'RMB')})
                            </span>
                          </div>
                        </>
                      )}
                    </td>

                    {/* Order Status (Inline Selector) */}
                    <td className="py-2.5 px-4 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <select
                          id={`inquiry-status-select-${item.id}`}
                          value={item.orderStatus}
                          onChange={(e) => onStatusChange(item, e.target.value as OrderStatus)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border appearance-none pr-5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getStatusBadgeStyle(
                            item.orderStatus
                          )}`}
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-800 normal-case font-normal text-xs">
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1.5 text-slate-500 pointer-events-none" />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-0.5">
                        {/* View Full Info */}
                        <button
                          id={`inquiry-view-btn-${item.id}`}
                          onClick={() => onView(item)}
                          title="View Full Inquiry Details & Pricing Breakdown"
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy / Share Quote */}
                        <button
                          id={`inquiry-quote-share-btn-${item.id}`}
                          onClick={() => onQuickShare(item)}
                          title="Generate Client Quote Card (WhatsApp/Email)"
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Full Details */}
                        <button
                          id={`inquiry-edit-btn-${item.id}`}
                          onClick={() => onEdit(item)}
                          title="Edit Inquiry Details"
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate Inquiry */}
                        <button
                          id={`inquiry-duplicate-btn-${item.id}`}
                          onClick={() => onDuplicate(item)}
                          title="Duplicate this Inquiry (Clone specs with new INQ #)"
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete with Confirmation */}
                        <button
                          id={`inquiry-delete-btn-${item.id}`}
                          onClick={() => onDeleteRequest(item)}
                          title="Delete Inquiry"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>


      {/* Mobile Card Layout */}
      <div className="block lg:hidden divide-y divide-slate-200 border-t border-slate-200">
        {sorted.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No sourcing inquiries found</p>
            </div>
          </div>
        ) : (
          sorted.map((item) => {
            const unitCostUsd = (item.price1688Rmb || 0) / (usdToRmbRate || 7.25);
            const profitUsd = item.estimatedProfitUsd || 0;
            const helpersCommissionUsd = calculateTotalHelperCommissions(
              item.helperCommissions,
              profitUsd,
              item.quantity || 1
            );
            const netProfitUsd = Number((profitUsd - helpersCommissionUsd).toFixed(2));
            const helperCount = item.helperCommissions?.length || 0;

            return (
              <div key={item.id} className="p-4 bg-white flex flex-col gap-3">
                {/* Header: Inquiry + Status */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-indigo-600 text-sm">
                      {item.inquiryNumber}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.date}</div>
                  </div>
                  <div className="relative inline-block">
                    <select
                      value={item.orderStatus}
                      onChange={(e) => onStatusChange(item, e.target.value as OrderStatus)}
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border appearance-none pr-5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${getStatusBadgeStyle(item.orderStatus)}`}
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-slate-800 normal-case font-normal text-xs">
                          {st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Customer & Country */}
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{item.customerName}</div>
                    {item.wechatId && (
                      <div className="text-xs text-emerald-600 font-medium">WeChat: {item.wechatId}</div>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {item.country || 'Global'}
                  </span>
                </div>

                {/* Product Info */}
                <div className="flex items-start gap-3 border-b border-slate-100 pb-2">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="Product" className="w-14 h-14 rounded border border-slate-200 object-cover shrink-0 bg-white" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-14 h-14 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">{item.product}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">{Number(item.quantity || 1).toLocaleString()}</span> pcs
                    </div>
                    {item.productUrl1688 && (() => {
                      const plat = detectB2BPlatform(item.productUrl1688);
                      return (
                        <a
                          href={item.productUrl1688}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${plat.badgeBg} ${plat.badgeText} ${plat.badgeBorder} mt-1`}
                          title={`Open ${plat.name}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${plat.dotColor}`} />
                          <span>{plat.shortName} Link</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      );
                    })()}
                  </div>
                </div>

                {/* Pricing summary */}
                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Supplier Cost</div>
                    <div className="font-mono font-semibold text-slate-800">
                      ¥{formatUnitPrice(item.price1688Rmb || 0, 'RMB')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ≈ {formatUnitPrice(unitCostUsd, 'USD')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Total Quote</div>
                    <div className="font-bold font-mono text-slate-900">
                      {formatCurrency(item.totalQuotationUsd || 0, 'USD')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ¥{formatCurrency((item.totalQuotationUsd || 0) * usdToRmbRate, 'RMB')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Gross Margin</div>
                    <div className="text-emerald-600 font-bold font-mono text-xs">
                      +{item.marginPercent}% (+{formatCurrency(profitUsd, 'USD')})
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      +¥{formatCurrency(profitUsd * usdToRmbRate, 'RMB')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      {helpersCommissionUsd > 0 ? 'Your Net Profit' : 'Est. Profit'}
                    </div>
                    <div className="text-emerald-700 font-bold font-mono text-xs">
                      +{formatCurrency(helpersCommissionUsd > 0 ? netProfitUsd : profitUsd, 'USD')}
                    </div>
                    <div className="text-[10px] text-emerald-600/80 font-mono">
                      +¥{formatCurrency((helpersCommissionUsd > 0 ? netProfitUsd : profitUsd) * usdToRmbRate, 'RMB')}
                    </div>
                    {helpersCommissionUsd > 0 && (
                      <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                        👥 {helperCount} helper{helperCount > 1 ? 's' : ''} (-{formatCurrency(helpersCommissionUsd, 'USD')})
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    id={`mobile-inquiry-view-btn-${item.id}`}
                    onClick={() => onView(item)}
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded border border-slate-200 transition flex items-center gap-1 text-xs font-medium"
                    title="View details"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button
                    id={`mobile-inquiry-share-btn-${item.id}`}
                    onClick={() => onQuickShare(item)}
                    className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded border border-slate-200 transition flex items-center gap-1 text-xs font-medium"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button
                    id={`mobile-inquiry-edit-btn-${item.id}`}
                    onClick={() => onEdit(item)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded border border-slate-200 transition flex items-center gap-1 text-xs font-medium"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    id={`mobile-inquiry-duplicate-btn-${item.id}`}
                    onClick={() => onDuplicate(item)}
                    title="Duplicate inquiry"
                    className="p-2 text-slate-600 hover:text-amber-600 hover:bg-slate-100 rounded border border-slate-200 transition flex items-center gap-1 text-xs font-medium"
                  >
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button
                    id={`mobile-inquiry-delete-btn-${item.id}`}
                    onClick={() => onDeleteRequest(item)}
                    className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded border border-slate-200 transition flex items-center gap-1 text-xs font-medium"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table Footer */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
        <div>
          Showing <span className="font-semibold text-slate-800">{sorted.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{inquiries.length}</span> inquiries
        </div>
        <div className="flex items-center space-x-4">
          <span>
            Total Gross Margin:{' '}
            <strong className="text-emerald-600 font-mono">
              {formatCurrency(
                sorted.reduce((acc, curr) => acc + (curr.estimatedProfitUsd || 0), 0),
                'USD'
              )}
            </strong>{' '}
            <span className="text-slate-400 font-mono">
              (¥{formatCurrency(
                sorted.reduce((acc, curr) => acc + (curr.estimatedProfitUsd || 0), 0) * usdToRmbRate,
                'RMB'
              )})
            </span>
          </span>
          <span>
            Total Net Take-Home:{' '}
            <strong className="text-indigo-600 font-mono">
              {formatCurrency(
                sorted.reduce((acc, curr) => {
                  const gross = curr.estimatedProfitUsd || 0;
                  const helpers = calculateTotalHelperCommissions(
                    curr.helperCommissions,
                    gross,
                    curr.quantity || 1
                  );
                  return acc + (gross - helpers);
                }, 0),
                'USD'
              )}
            </strong>{' '}
            <span className="text-slate-400 font-mono">
              (¥{formatCurrency(
                sorted.reduce((acc, curr) => {
                  const gross = curr.estimatedProfitUsd || 0;
                  const helpers = calculateTotalHelperCommissions(
                    curr.helperCommissions,
                    gross,
                    curr.quantity || 1
                  );
                  return acc + (gross - helpers);
                }, 0) * usdToRmbRate,
                'RMB'
              )})
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

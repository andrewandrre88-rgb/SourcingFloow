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
  Receipt,
  GripVertical,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { InquiryItem, OrderStatus, CurrencyViewMode, Customer, ExchangeRates } from '../types';
import {
  formatCurrency,
  formatUnitPrice,
  formatDualUnitPrice,
  formatDualTotal,
  formatAmountByViewMode,
  formatUnitAmountByViewMode,
  calculateTotalHelperCommissions,
  calculateTotalInquiryExpenses,
} from '../lib/currency';
import { detectB2BPlatform } from '../lib/b2bPlatforms';
import {
  getCountryFlag,
  cleanPhoneNumber,
  extractClientPhone,
  getWhatsAppMessengerUrl,
  openWhatsAppMessenger,
} from '../lib/countryFlags';

/**
 * Official WhatsApp SVG Icon with standard dimensions & currentColor fill
 */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24m4.57 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.88.85-.88 2.08s.9 2.41 1.02 2.58c.13.17 1.76 2.68 4.26 3.76.59.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.3z" />
  </svg>
);

interface InquiryTableProps {
  inquiries: InquiryItem[];
  customers?: Customer[];
  exchangeRates?: ExchangeRates;
  usdToRmbRate: number;
  currencyView?: CurrencyViewMode;
  onView: (item: InquiryItem) => void;
  onEdit: (item: InquiryItem) => void;
  onDeleteRequest: (item: InquiryItem) => void;
  onStatusChange: (item: InquiryItem, newStatus: OrderStatus) => void;
  onQuickShare: (item: InquiryItem) => void;
  onDuplicate: (item: InquiryItem) => void;
  onReorder?: (newInquiries: InquiryItem[]) => void;
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
  customers = [],
  usdToRmbRate,
  currencyView = 'USD',
  onView,
  onEdit,
  onDeleteRequest,
  onStatusChange,
  onQuickShare,
  onDuplicate,
  onReorder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof InquiryItem | 'custom'>('custom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // Reorder inquiries: Move chosen inquiry directly to the top (Priority #1)
  const handleMoveToTop = (id: string) => {
    const currentList = [...inquiries];
    const idx = currentList.findIndex((i) => i.id === id);
    if (idx <= 0) return;
    const [moved] = currentList.splice(idx, 1);
    currentList.unshift(moved);
    setSortField('custom');
    if (onReorder) {
      onReorder(currentList);
    }
  };

  // Move inquiry up or down by relative delta (-1 for up, +1 for down)
  const handleMoveByOffset = (id: string, delta: number) => {
    const currentList = [...inquiries];
    const idx = currentList.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const targetIdx = idx + delta;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;
    const [moved] = currentList.splice(idx, 1);
    currentList.splice(targetIdx, 0, moved);
    setSortField('custom');
    if (onReorder) {
      onReorder(currentList);
    }
  };

  // Reorder inquiries on drag & drop
  const handleReorder = (fromId: string, toId: string, position: 'before' | 'after') => {
    if (fromId === toId) return;
    const currentList = [...inquiries];
    const fromIdx = currentList.findIndex((i) => i.id === fromId);
    const toIdx = currentList.findIndex((i) => i.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = currentList.splice(fromIdx, 1);
    let insertIdx = currentList.findIndex((i) => i.id === toId);
    if (position === 'after') {
      insertIdx += 1;
    }
    currentList.splice(insertIdx, 0, moved);
    setSortField('custom');
    if (onReorder) {
      onReorder(currentList);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOverRow = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedId || draggedId === id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position: 'before' | 'after' = e.clientY < midY ? 'before' : 'after';
    if (!dropTarget || dropTarget.id !== id || dropTarget.position !== position) {
      setDropTarget({ id, position });
    }
  };

  const handleDropOnRow = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDropTarget(null);
      return;
    }

    handleReorder(draggedId, targetId, dropTarget?.position || 'before');
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  // Resolves WhatsApp contact and preformatted inquiry quote message
  const getInquiryWhatsAppDetails = (item: InquiryItem) => {
    let phone = '';

    // 1. Direct inquiry phone/whatsapp fields
    const directContact = item.whatsapp || item.clientPhone || (item as any).phone || (item as any).contact;
    if (directContact) {
      phone = extractClientPhone(directContact, item.country);
    }

    // 2. Fallback to inquiry customerContact (e.g. "+1 (555) 234-8901 / aero@gmail.com" or "0501234567")
    if (!phone && item.customerContact) {
      phone = extractClientPhone(item.customerContact, item.country);
    }

    // 3. Fallback: match client in customer directory
    if (!phone && customers && customers.length > 0) {
      const match = customers.find(
        (c) =>
          c.name.toLowerCase() === item.customerName.toLowerCase() ||
          (c.company && c.company.toLowerCase() === item.customerName.toLowerCase())
      );
      if (match?.whatsapp) {
        phone = extractClientPhone(match.whatsapp, item.country || match.country);
      } else if (match?.contactPhone) {
        phone = extractClientPhone(match.contactPhone, item.country || match.country);
      }
    }

    const msg = `Hello ${item.customerName}, regarding your inquiry ${item.inquiryNumber} for ${item.product}:
• Qty: ${Number(item.quantity).toLocaleString()} ${item.quantityUnit || 'pcs'}
• Quoted Unit Price: $${Number(item.clientUnitPriceUsd || 0).toFixed(2)}
• Total Quotation: $${Number(item.totalQuotationUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• Destination: ${item.country || 'Global'}
• Status: ${item.orderStatus}

Please let us know if you need any adjustments or would like to proceed with a sample!`;

    const messengerUrl = phone ? getWhatsAppMessengerUrl(phone, msg) : '';

    return { phone, msg, messengerUrl };
  };

  const handleOpenWhatsApp = (e: React.MouseEvent, item: InquiryItem) => {
    e.preventDefault();
    const details = getInquiryWhatsAppDetails(item);
    let phone = details.phone;
    const msg = details.msg;

    if (!phone) {
      const entered = window.prompt(
        `Enter WhatsApp number (including country code, e.g. +966... or +1... or +86...) for ${item.customerName}:`,
        ''
      );
      if (!entered) return;
      phone = extractClientPhone(entered, item.country);
      if (!phone) return;
    }

    // Directly trigger the WhatsApp App (via whatsapp:// deep link or Android com.whatsapp intent)
    openWhatsAppMessenger(phone, msg);
  };

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
    if (sortField === 'custom') {
      const idxA = inquiries.findIndex((i) => i.id === a.id);
      const idxB = inquiries.findIndex((i) => i.id === b.id);
      return idxA - idxB;
    }

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

  const handleSort = (field: keyof InquiryItem | 'custom') => {
    if (field === 'custom') {
      setSortField('custom');
      return;
    }
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
      <div className="px-3.5 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
        {/* Search input */}
        <div className="relative flex-1 w-full sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <Search className="absolute left-3 top-3 sm:top-2.5 w-4 h-4 sm:w-3.5 sm:h-3.5 text-slate-400" />
          <input
            id="inquiry-search-input"
            type="text"
            placeholder="Search inquiries, clients, products, suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 sm:py-1.5 bg-white border border-slate-300 rounded-lg sm:rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-xs"
          />
        </div>

        {/* Status Filter Tabs & Reorder Priority indicator */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-between sm:justify-end">
          {sortField === 'custom' ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold select-none"
              title="Custom priority ordering is active. Drag rows to reorder or click 'Move to Top'."
            >
              <GripVertical className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Priority Order (Drag to Top)</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSortField('custom')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
              title="Click to restore your custom drag-and-drop priority order"
            >
              <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Reset to Priority Order</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter:</span>
            </span>
            <select
              id="inquiry-status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none bg-white border border-slate-300 text-xs text-slate-700 rounded-lg sm:rounded px-3 py-2.5 sm:py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs font-semibold"
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
      </div>

      {/* Responsive Line-by-Line Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-200">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold select-none border-b border-slate-200">
            <tr>
              <th
                className="py-2.5 px-3 sm:px-4 cursor-pointer hover:text-slate-900 transition whitespace-nowrap"
                onClick={() => {
                  if (sortField === 'custom') {
                    handleSort('inquiryNumber');
                  } else {
                    setSortField('custom');
                  }
                }}
                title={sortField === 'custom' ? 'Priority order active. Click to sort alphabetically by Inquiry #.' : 'Click to activate Custom Drag Priority Order.'}
              >
                <div className="flex items-center gap-1.5">
                  <GripVertical className="w-3.5 h-3.5 text-indigo-500" />
                  <span># Priority / Inquiry</span>
                  {sortField === 'custom' ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-700 normal-case tracking-normal ml-0.5">
                      Drag Active
                    </span>
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
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
              sorted.map((item, index) => {
                const unitCostUsd = (item.price1688Rmb || 0) / (usdToRmbRate || 7.25);
                const profitUsd = item.estimatedProfitUsd || 0;
                const helpersCommissionUsd = calculateTotalHelperCommissions(
                  item.helperCommissions,
                  profitUsd,
                  item.quantity || 1
                );
                const expensesUsd = item.totalExpensesUsd !== undefined
                  ? item.totalExpensesUsd
                  : calculateTotalInquiryExpenses(item.inquiryExpenses, usdToRmbRate).totalUsd;
                const expenseCount = item.inquiryExpenses?.length || 0;
                const netProfitUsd = Number((profitUsd - helpersCommissionUsd - expensesUsd).toFixed(2));
                const helperCount = item.helperCommissions?.length || 0;
                const waDetails = getInquiryWhatsAppDetails(item);
                const isBeingDragged = draggedId === item.id;
                const isDropTarget = dropTarget?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    id={`inquiry-row-${item.id}`}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={(e) => handleDragOverRow(e, item.id)}
                    onDrop={(e) => handleDropOnRow(e, item.id)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-150 group ${
                      isBeingDragged
                        ? 'opacity-40 bg-indigo-50/70 ring-2 ring-indigo-400 ring-dashed'
                        : isDropTarget
                        ? dropTarget.position === 'before'
                          ? 'border-t-4 border-t-indigo-600 bg-indigo-50/60 shadow-sm'
                          : 'border-b-4 border-b-indigo-600 bg-indigo-50/60 shadow-sm'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    {/* Drag Handle, Priority Rank, Move to Top, Inquiry Number & Date */}
                    <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {/* Drag Handle */}
                        <div
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 group-hover:text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors shrink-0"
                          title="Click and drag row to adjust order — drop at top to make #1 priority"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>

                        {/* Priority Rank Badge */}
                        <span
                          className={`inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-[10px] font-bold shrink-0 ${
                            index === 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-2xs'
                              : index === 1
                              ? 'bg-slate-200 text-slate-800'
                              : index === 2
                              ? 'bg-orange-100 text-orange-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                          title={index === 0 ? 'Top Priority (#1)' : `Priority #${index + 1}`}
                        >
                          #{index + 1}
                        </span>

                        {/* 1-Click Move to Top button */}
                        {index > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveToTop(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer shrink-0"
                            title="Move directly to top (#1 Priority)"
                          >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="w-5 shrink-0" />
                        )}

                        {/* Inquiry Number & Date */}
                        <div className="flex flex-col min-w-0">
                          <button
                            type="button"
                            onClick={() => onView(item)}
                            className="font-mono font-semibold text-indigo-600 hover:text-indigo-800 text-xs text-left hover:underline transition cursor-pointer truncate"
                            title="Click to view full inquiry details"
                          >
                            {item.inquiryNumber}
                          </button>
                          <div className="text-[10px] text-slate-400">{item.date}</div>
                        </div>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.customerName}</div>
                      {waDetails.phone ? (
                        <button
                          type="button"
                          onClick={(e) => handleOpenWhatsApp(e, item)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-medium truncate max-w-[170px] mt-0.5 text-left cursor-pointer"
                          title={`Open +${waDetails.phone} directly in WhatsApp App`}
                        >
                          <WhatsAppIcon className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">+{waDetails.phone}</span>
                        </button>
                      ) : item.customerContact ? (
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={item.customerContact}>
                          {item.customerContact}
                        </div>
                      ) : null}
                      {item.wechatId && (
                        <div className="text-[11px] text-emerald-600 truncate max-w-[150px] font-medium" title={item.wechatId}>
                          WeChat: {item.wechatId}
                        </div>
                      )}
                    </td>

                    {/* Country */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <span className="text-sm leading-none">{getCountryFlag(item.country)}</span>
                        <span>{item.country || 'Global'}</span>
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
                      <div className={`text-xs font-bold ${
                        item.marginMode === 'deal_usd' || item.marginMode === 'deal_rmb'
                          ? 'text-amber-600'
                          : item.marginFixedUsd && item.marginFixedUsd > 0 && !item.marginPercent
                          ? 'text-indigo-600'
                          : 'text-green-600'
                      }`}>
                        {item.marginMode === 'deal_usd'
                          ? `+${formatCurrency(item.marginDealTotal ?? profitUsd, 'USD')} Deal`
                          : item.marginMode === 'deal_rmb'
                          ? `+¥${formatCurrency(item.marginDealTotal ?? (profitUsd * usdToRmbRate), 'RMB')} Deal`
                          : item.marginFixedUsd && item.marginFixedUsd > 0 && !item.marginPercent
                          ? `+${formatUnitPrice(item.marginFixedUsd, 'USD')}/pc`
                          : `+${item.marginPercent || 0}%`}
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
                        </div>
                      )}
                      {expensesUsd > 0 && (
                        <div className="mt-0.5">
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200"
                            title={`${expenseCount} inquiry expenses: -$${expensesUsd.toFixed(2)} (-¥${(expensesUsd * usdToRmbRate).toFixed(2)})`}
                          >
                            <Receipt className="w-2.5 h-2.5" />
                            <span>{expenseCount} exp (-{currencyView === 'RMB' ? `¥${formatCurrency(expensesUsd * usdToRmbRate, 'RMB')}` : formatCurrency(expensesUsd, 'USD')})</span>
                          </span>
                        </div>
                      )}
                      {(helpersCommissionUsd > 0 || expensesUsd > 0) && (
                        <div className="text-[10px] font-bold text-emerald-700 font-mono mt-0.5">
                          {currencyView === 'RMB'
                            ? `Net: +¥${formatCurrency(netProfitUsd * usdToRmbRate, 'RMB')} (${formatCurrency(netProfitUsd, 'USD')})`
                            : `Net: +${formatCurrency(netProfitUsd, 'USD')} (¥${formatCurrency(netProfitUsd * usdToRmbRate, 'RMB')})`}
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
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStatusChange(item, e.target.value as OrderStatus)}
                          className={`text-[10px] font-bold uppercase pl-2.5 pr-6 py-1 rounded-full border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 hover:brightness-95 transition-all shadow-2xs ${getStatusBadgeStyle(
                            item.orderStatus
                          )}`}
                          title="Change inquiry status"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-slate-800 normal-case font-normal text-xs">
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-0.5">
                        {/* Move to Top */}
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveToTop(item.id);
                            }}
                            title="Move directly to top (#1 Priority)"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                          >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Open directly in WhatsApp App */}
                        <a
                          id={`inquiry-whatsapp-btn-${item.id}`}
                          href={waDetails.messengerUrl || '#'}
                          onClick={(e) => handleOpenWhatsApp(e, item)}
                          title={
                            waDetails.phone
                              ? `Open directly in WhatsApp App: ${item.customerName} (+${waDetails.phone})`
                              : `Open directly in WhatsApp App for ${item.customerName}`
                          }
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer inline-flex items-center justify-center"
                          aria-label={`Open directly in WhatsApp App for ${item.customerName}`}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </a>

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
      <div className="block lg:hidden p-3 space-y-3.5 bg-slate-100/70 border-t border-slate-200">
        {sorted.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex flex-col items-center justify-center space-y-2">
              <FileText className="w-9 h-9 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No sourcing inquiries found</p>
              <p className="text-xs text-slate-400">Try changing your search term or status filter</p>
            </div>
          </div>
        ) : (
          sorted.map((item, index) => {
            const unitCostUsd = (item.price1688Rmb || 0) / (usdToRmbRate || 7.25);
            const profitUsd = item.estimatedProfitUsd || 0;
            const helpersCommissionUsd = calculateTotalHelperCommissions(
              item.helperCommissions,
              profitUsd,
              item.quantity || 1
            );
            const expensesUsd = item.totalExpensesUsd !== undefined
              ? item.totalExpensesUsd
              : calculateTotalInquiryExpenses(item.inquiryExpenses, usdToRmbRate).totalUsd;
            const expenseCount = item.inquiryExpenses?.length || 0;
            const netProfitUsd = Number((profitUsd - helpersCommissionUsd - expensesUsd).toFixed(2));
            const helperCount = item.helperCommissions?.length || 0;
            const waDetails = getInquiryWhatsAppDetails(item);

            return (
              <div
                key={item.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-200 transition flex flex-col gap-3"
              >
                {/* Header: Priority # + Inquiry + Move to Top + Status */}
                <div className="flex justify-between items-start gap-2">
                  <div
                    onClick={() => onView(item)}
                    className="cursor-pointer group flex-1 min-w-0"
                    title="Click to view full inquiry details"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                          index === 0
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold shadow-2xs'
                            : index === 1
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                        title={`Priority #${index + 1}`}
                      >
                        #{index + 1}
                      </span>
                      <span className="font-mono font-bold text-indigo-600 text-sm group-hover:underline">
                        {item.inquiryNumber}
                      </span>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveToTop(item.id);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition cursor-pointer"
                          title="Move directly to top (#1 Priority)"
                        >
                          <ArrowUpToLine className="w-3 h-3" />
                          <span>To Top</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.date}</div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative inline-block shrink-0">
                    <select
                      id={`mobile-inquiry-status-select-${item.id}`}
                      value={item.orderStatus}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onStatusChange(item, e.target.value as OrderStatus)}
                      className={`text-[11px] font-bold uppercase pl-3 pr-7 py-1.5 rounded-full border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/40 hover:brightness-95 transition-all shadow-2xs ${getStatusBadgeStyle(item.orderStatus)}`}
                      title="Change inquiry status"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st} className="bg-white text-slate-800 normal-case font-normal text-xs">
                          {st}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                  </div>
                </div>

                {/* Customer & Country */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-slate-900 text-sm truncate">{item.customerName}</div>
                    {item.wechatId && (
                      <div className="text-xs text-emerald-600 font-medium truncate mt-0.5">
                        WeChat: {item.wechatId}
                      </div>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    <span className="text-sm leading-none">{getCountryFlag(item.country)}</span>
                    <span className="truncate max-w-[110px]">{item.country || 'Global'}</span>
                  </span>
                </div>

                {/* Product Info (tap to view) */}
                <div
                  onClick={() => onView(item)}
                  className="flex items-start gap-3 border-b border-slate-100 pb-2.5 cursor-pointer group"
                  title="Click to view full inquiry details"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt="Product"
                      className="w-14 h-14 rounded-lg border border-slate-200 object-cover shrink-0 bg-white"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-200 transition">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition truncate">
                      {item.product}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">
                        {Number(item.quantity || 1).toLocaleString()}
                      </span>
                      <span>{item.quantityUnit || 'pcs'}</span>
                      {item.supplierName && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 truncate">{item.supplierName}</span>
                        </>
                      )}
                    </div>
                    {item.productUrl1688 && (() => {
                      const plat = detectB2BPlatform(item.productUrl1688);
                      return (
                        <a
                          href={item.productUrl1688}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${plat.badgeBg} ${plat.badgeText} ${plat.badgeBorder} mt-1.5 shadow-2xs hover:brightness-95`}
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

                {/* Pricing Summary 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Supplier Cost</div>
                    <div className="font-mono font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                      ¥{formatUnitPrice(item.price1688Rmb || 0, 'RMB')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      ≈ {formatUnitPrice(unitCostUsd, 'USD')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Quote</div>
                    <div className="font-bold font-mono text-indigo-700 text-xs sm:text-sm mt-0.5">
                      {formatCurrency(item.totalQuotationUsd || 0, 'USD')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      ¥{formatCurrency((item.totalQuotationUsd || 0) * usdToRmbRate, 'RMB')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gross Margin</div>
                    <div className="text-emerald-700 font-bold font-mono text-xs mt-0.5">
                      +{item.marginPercent}% (+{formatCurrency(profitUsd, 'USD')})
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      +¥{formatCurrency(profitUsd * usdToRmbRate, 'RMB')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {helpersCommissionUsd > 0 || expensesUsd > 0 ? 'Net Profit' : 'Est. Profit'}
                    </div>
                    <div className="text-emerald-700 font-bold font-mono text-xs mt-0.5">
                      +{formatCurrency(helpersCommissionUsd > 0 || expensesUsd > 0 ? netProfitUsd : profitUsd, 'USD')}
                    </div>
                    <div className="text-[10px] text-emerald-600/80 font-mono mt-0.5">
                      +¥{formatCurrency((helpersCommissionUsd > 0 || expensesUsd > 0 ? netProfitUsd : profitUsd) * usdToRmbRate, 'RMB')}
                    </div>
                    {helpersCommissionUsd > 0 && (
                      <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                        👥 {helperCount} helper{helperCount > 1 ? 's' : ''} (-{formatCurrency(helpersCommissionUsd, 'USD')})
                      </div>
                    )}
                    {expensesUsd > 0 && (
                      <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                        🧾 {expenseCount} exp (-{formatCurrency(expensesUsd, 'USD')})
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons Bar */}
                <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                  {/* Row 1: Primary View Details, WhatsApp & Share Quote */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`mobile-inquiry-view-btn-${item.id}`}
                      onClick={() => onView(item)}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      title="View full inquiry details and breakdown"
                    >
                      <Eye className="w-4 h-4 shrink-0 text-white stroke-[2.2]" />
                      <span className="truncate">View</span>
                    </button>

                    <a
                      id={`mobile-inquiry-whatsapp-btn-${item.id}`}
                      href={waDetails.messengerUrl || '#'}
                      onClick={(e) => handleOpenWhatsApp(e, item)}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      title={waDetails.phone ? `Open in WhatsApp App (+${waDetails.phone})` : 'Open in WhatsApp App'}
                    >
                      <WhatsAppIcon className="w-4 h-4 shrink-0 text-white" />
                      <span className="truncate">WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      id={`mobile-inquiry-share-btn-${item.id}`}
                      onClick={() => onQuickShare(item)}
                      className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer"
                      title="Generate shareable quotation card"
                    >
                      <Share2 className="w-4 h-4 shrink-0 text-emerald-600 stroke-[2.2]" />
                      <span className="truncate">Share</span>
                    </button>
                  </div>

                  {/* Row 2: Secondary Quick Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      id={`mobile-inquiry-edit-btn-${item.id}`}
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 text-xs font-medium transition cursor-pointer"
                      title="Edit inquiry parameters"
                    >
                      <Edit2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      id={`mobile-inquiry-duplicate-btn-${item.id}`}
                      onClick={() => onDuplicate(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 active:scale-[0.98] text-slate-700 hover:text-amber-700 rounded-lg border border-slate-200 text-xs font-medium transition cursor-pointer"
                      title="Duplicate inquiry"
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      id={`mobile-inquiry-delete-btn-${item.id}`}
                      onClick={() => onDeleteRequest(item)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 rounded-lg border border-rose-200 text-xs font-medium transition cursor-pointer"
                      title="Delete inquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Row 3: Priority Reordering (Mobile) */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Order Rank: <strong className="text-slate-800">#{index + 1}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveToTop(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition cursor-pointer"
                          title="Move directly to top (#1 Priority)"
                        >
                          <ArrowUpToLine className="w-3 h-3" />
                          <span>To Top</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveByOffset(item.id, -1)}
                        className={`p-1 rounded border text-xs transition ${
                          index === 0
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50'
                            : 'text-slate-600 border-slate-300 hover:bg-slate-100 cursor-pointer'
                        }`}
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sorted.length - 1}
                        onClick={() => handleMoveByOffset(item.id, 1)}
                        className={`p-1 rounded border text-xs transition ${
                          index === sorted.length - 1
                            ? 'text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50'
                            : 'text-slate-600 border-slate-300 hover:bg-slate-100 cursor-pointer'
                        }`}
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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

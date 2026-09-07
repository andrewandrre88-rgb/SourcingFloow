import React from 'react';
import {
  TrendingUp,
  PackageSearch,
  Truck,
  CheckCircle,
  FileCheck2,
  DollarSign,
  PieChart,
} from 'lucide-react';
import { InquiryItem, CurrencyViewMode } from '../types';
import { formatCurrency, formatAmountByViewMode } from '../lib/currency';

interface StatsBarProps {
  inquiries: InquiryItem[];
  currencyView?: CurrencyViewMode;
  usdToRmbRate?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  inquiries,
  currencyView = 'USD' as CurrencyViewMode,
  usdToRmbRate = 7.25,
}) => {
  const totalCount = inquiries.length;

  const sourcingCount = inquiries.filter((i) =>
    ['New Inquiry', '1688 Sourcing', 'Quoted to Client', 'Sample Ordered'].includes(i.orderStatus)
  ).length;

  const productionCount = inquiries.filter((i) =>
    ['Order Placed', 'In Production', 'QC & Inspection'].includes(i.orderStatus)
  ).length;

  const shippedCount = inquiries.filter((i) =>
    ['Shipped', 'Completed'].includes(i.orderStatus)
  ).length;

  const totalQuotedValueUsd = inquiries
    .filter((i) => i.orderStatus !== 'Cancelled')
    .reduce((acc, curr) => acc + (curr.totalQuotationUsd || 0), 0);

  const totalEstimatedProfitUsd = inquiries
    .filter((i) => i.orderStatus !== 'Cancelled')
    .reduce((acc, curr) => acc + (curr.estimatedProfitUsd || 0), 0);

  const avgMargin =
    inquiries.length > 0
      ? (
          inquiries.reduce((acc, curr) => acc + (curr.marginPercent || 0), 0) /
          inquiries.length
        ).toFixed(1)
      : '0';

  const pipelineDisplay = formatAmountByViewMode(totalQuotedValueUsd, usdToRmbRate, currencyView);
  const profitDisplay = formatAmountByViewMode(totalEstimatedProfitUsd, usdToRmbRate, currencyView);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {/* Total Inquiries */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inquiries</span>
          <div className="p-1 rounded bg-slate-100 text-slate-600">
            <PackageSearch className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold text-slate-900">{totalCount}</span>
          <span className="text-[11px] text-slate-500">{sourcingCount} in quoting</span>
        </div>
      </div>

      {/* In Production */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Production</span>
          <div className="p-1 rounded bg-amber-50 text-amber-600">
            <FileCheck2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold text-amber-600">{productionCount}</span>
          <span className="text-[11px] text-slate-500">{shippedCount} done/shipped</span>
        </div>
      </div>

      {/* Total Quoted Value */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pipeline</span>
          <div className="p-1 rounded bg-indigo-50 text-indigo-600">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="text-lg font-bold text-indigo-700 font-mono leading-tight truncate">
            {pipelineDisplay.primary}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {currencyView === 'DUAL'
              ? `≈ ${pipelineDisplay.secondary}`
              : currencyView === 'RMB'
              ? `≈ ${formatCurrency(totalQuotedValueUsd, 'USD')}`
              : `≈ ${formatCurrency(totalQuotedValueUsd * usdToRmbRate, 'RMB')}`}
          </div>
        </div>
      </div>

      {/* Total Margin / Profit */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Margins</span>
          <div className="p-1 rounded bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="text-lg font-bold text-emerald-600 font-mono leading-tight truncate">
            {profitDisplay.primary}
          </div>
          <div className="text-[10px] text-emerald-700/80 font-mono mt-0.5">
            {currencyView === 'DUAL'
              ? `≈ ${profitDisplay.secondary}`
              : currencyView === 'RMB'
              ? `≈ ${formatCurrency(totalEstimatedProfitUsd, 'USD')}`
              : `≈ ${formatCurrency(totalEstimatedProfitUsd * usdToRmbRate, 'RMB')}`}
          </div>
        </div>
      </div>

      {/* Avg Agent Margin */}
      <div className="col-span-2 lg:col-span-1 bg-white border border-slate-200 rounded-lg p-3 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Margin</span>
          <div className="p-1 rounded bg-slate-100 text-slate-600">
            <PieChart className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl font-bold text-slate-800">+{avgMargin}%</span>
          <span className="text-[11px] text-slate-500">per order</span>
        </div>
      </div>
    </div>
  );
};

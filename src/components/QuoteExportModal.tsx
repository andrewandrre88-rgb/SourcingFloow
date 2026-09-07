import React, { useState } from 'react';
import { X, Copy, Check, Share2, Box, Scale, Ruler, Package, FileText } from 'lucide-react';
import { InquiryItem } from '../types';
import {
  formatCurrency,
  formatUnitPrice,
  calculatePackagingDetails,
} from '../lib/currency';

interface QuoteExportModalProps {
  isOpen: boolean;
  item: InquiryItem | null;
  onClose: () => void;
}

export const QuoteExportModal: React.FC<QuoteExportModalProps> = ({ isOpen, item, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const packaging = calculatePackagingDetails({
    quantity: item.quantity || 1,
    pcsPerBox: item.pcsPerBox,
    boxLengthCm: item.boxLengthCm,
    boxWidthCm: item.boxWidthCm,
    boxHeightCm: item.boxHeightCm,
    grossWeightKg: item.grossWeightKg,
    netWeightKg: item.netWeightKg,
  });

  const unitLabel = item.quantityUnit || 'pcs';
  const unitPriceFormatted = formatUnitPrice(item.clientUnitPriceUsd || 0, 'USD');
  const totalQuotationFormatted = formatCurrency(item.totalQuotationUsd || 0, 'USD');

  const quoteText = `📋 *SOURCING QUOTATION SUMMARY*
----------------------------------------
*Inquiry Ref:* ${item.inquiryNumber}
*Date:* ${item.date}
*Client:* ${item.customerName}
${item.customerContact ? `*Contact:* ${item.customerContact}\n` : ''}${item.wechatId ? `*WeChat ID:* ${item.wechatId}\n` : ''}*Destination:* ${item.country}

*Product:* ${item.product}
${item.material ? `*Material:* ${item.material}\n` : ''}${item.colorVariant ? `*Color / Finish:* ${item.colorVariant}\n` : ''}${item.packagingType ? `*Packaging:* ${item.packagingType}\n` : ''}${item.hsCode ? `*HS Code:* ${item.hsCode}\n` : ''}*Order Quantity:* ${Number(item.quantity).toLocaleString()} ${unitLabel}
${item.moq ? `*Supplier MOQ:* ${item.moq.toLocaleString()} ${unitLabel}\n` : ''}${item.sampleQuantity ? `*Sample Quantity:* ${item.sampleQuantity} ${unitLabel}\n` : ''}${item.quantityTolerancePercent ? `*Quantity Tolerance:* ±${item.quantityTolerancePercent}%\n` : ''}${item.deliveryLeadTimeDays ? `*Production Lead Time:* ${item.deliveryLeadTimeDays} days\n` : ''}*Unit Price:* ${unitPriceFormatted} / ${unitLabel}
*Total Order Amount:* ${totalQuotationFormatted}
*Status:* ${item.orderStatus}

${
  item.boxLengthCm || item.pcsPerBox || item.grossWeightKg
    ? `*PACKAGING & LOGISTICS:*\n` +
      (item.boxLengthCm && item.boxWidthCm && item.boxHeightCm
        ? `• Master Carton: ${item.boxLengthCm} × ${item.boxWidthCm} × ${item.boxHeightCm} cm\n`
        : '') +
      (item.pcsPerBox ? `• Pcs/Carton: ${item.pcsPerBox} pcs (${packaging.totalCartons} cartons total)\n` : '') +
      (packaging.totalCbm > 0 ? `• Total Volume: ${packaging.totalCbm} CBM\n` : '') +
      (packaging.totalGrossWeightKg > 0 ? `• Total Est. Weight: ${packaging.totalGrossWeightKg} kg GW\n` : '') +
      '\n'
    : ''
}${item.notes ? `*Special Notes / Terms:*\n${item.notes}\n` : ''}----------------------------------------
*Includes:* Factory direct sourcing, standard quality inspection & export handling.
Let us know if you would like to proceed with a sample or place the bulk order!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(quoteText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-indigo-50 text-indigo-600">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Client Quotation Summary</h3>
              <p className="text-[11px] text-slate-500">Ready to send via WhatsApp, WeChat, or Email</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formatted Quotation Preview Box */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3.5 font-sans text-xs text-slate-800 space-y-2.5">
          <div className="flex justify-between items-start border-b border-slate-200 pb-2">
            <div>
              <span className="font-mono text-indigo-700 font-bold text-xs">
                {item.inquiryNumber}
              </span>
              <div className="text-slate-600 text-[11px]">{item.customerName} ({item.country})</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-900 font-mono">
                {formatCurrency(item.totalQuotationUsd, 'USD')}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">{formatUnitPrice(item.clientUnitPriceUsd, 'USD')}/pc</div>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-slate-500 font-bold uppercase text-[10px]">Product & Quantity</div>
            <div className="text-slate-900 font-medium text-xs">{item.product}</div>
            <div className="text-indigo-600 font-bold text-xs">
              {Number(item.quantity).toLocaleString()} {unitLabel}
              {item.moq && <span className="text-slate-400 font-normal ml-1">(MOQ: {item.moq.toLocaleString()})</span>}
              {item.deliveryLeadTimeDays && <span className="text-slate-500 font-medium ml-2">• {item.deliveryLeadTimeDays}d Lead Time</span>}
            </div>
          </div>

          {(item.material || item.colorVariant || item.packagingType || item.boxLengthCm) && (
            <div className="bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-700 space-y-1">
              <strong className="text-slate-500 block text-[10px] uppercase font-bold">Specifications & Packaging:</strong>
              {item.material && <div>• Material: <span className="font-medium text-slate-900">{item.material}</span></div>}
              {item.colorVariant && <div>• Color/Finish: <span className="font-medium text-slate-900">{item.colorVariant}</span></div>}
              {item.packagingType && <div>• Packaging: <span className="font-medium text-slate-900">{item.packagingType}</span></div>}
              {item.boxLengthCm && item.boxWidthCm && item.boxHeightCm && (
                <div>• Carton Size: <span className="font-mono text-slate-900">{item.boxLengthCm}×{item.boxWidthCm}×{item.boxHeightCm} cm</span> ({item.pcsPerBox || 1} pcs/box)</div>
              )}
              {packaging.totalCbm > 0 && <div>• Total Volume: <span className="font-mono text-indigo-700 font-bold">{packaging.totalCbm} CBM</span> ({packaging.totalCartons} cartons)</div>}
            </div>
          )}

          {item.notes && (
            <div className="bg-white p-2 rounded border border-slate-200 text-[11px] text-slate-700">
              <strong className="text-slate-500 block mb-0.5 text-[10px] uppercase font-bold">Sourcing Specifications:</strong>
              {item.notes}
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex justify-between">
            <span>Sourcing & QC included</span>
            <span>Date: {item.date}</span>
          </div>
        </div>

        {/* WhatsApp raw text format */}
        <div className="mt-3">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
            Plain Text Message (Copy for WhatsApp / WeChat)
          </label>
          <textarea
            readOnly
            rows={4}
            value={quoteText}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-[11px] font-mono text-slate-800 focus:outline-none select-all"
          />
        </div>

        {/* Modal Actions */}
        <div className="mt-4 flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium"
          >
            Close
          </button>
          <button
            id="quote-copy-btn"
            onClick={handleCopy}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Quote Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

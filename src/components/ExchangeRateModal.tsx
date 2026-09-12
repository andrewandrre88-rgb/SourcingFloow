import React, { useState } from 'react';
import { X, DollarSign, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ExchangeRates } from '../types';

interface ExchangeRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: ExchangeRates;
  onSaveRates: (newRates: ExchangeRates) => void;
}

export const ExchangeRateModal: React.FC<ExchangeRateModalProps> = ({
  isOpen,
  onClose,
  rates,
  onSaveRates,
}) => {
  const [usdRate, setUsdRate] = useState<number>(rates.USD_TO_RMB);
  const [eurRate, setEurRate] = useState<number>(rates.EUR_TO_RMB);
  const [gbpRate, setGbpRate] = useState<number>(rates.GBP_TO_RMB);

  if (!isOpen) return null;

  const sanitizeRate = (valStr: string): number => {
    const cleaned = valStr.replace(/[$¥€£\s]/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return !isNaN(num) && isFinite(num) && num > 0 ? num : 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRates({
      USD_TO_RMB: usdRate > 0 ? usdRate : 7.25,
      EUR_TO_RMB: eurRate > 0 ? eurRate : 7.85,
      GBP_TO_RMB: gbpRate > 0 ? gbpRate : 9.15,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded bg-amber-50 text-amber-600">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Exchange Rates</h3>
              <p className="text-[11px] text-slate-500">For 1688 RMB (¥) to Foreign Currency conversions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-3 space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              1 USD ($) to Chinese Yuan (¥ RMB)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">¥</span>
              <input
                id="rate-usd-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={usdRate}
                onChange={(e) => setUsdRate(sanitizeRate(e.target.value))}
                className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Standard benchmark: 7.25</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              1 EUR (€) to Chinese Yuan (¥ RMB)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">¥</span>
              <input
                id="rate-eur-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={eurRate}
                onChange={(e) => setEurRate(sanitizeRate(e.target.value))}
                className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              1 GBP (£) to Chinese Yuan (¥ RMB)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">¥</span>
              <input
                id="rate-gbp-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={gbpRate}
                onChange={(e) => setGbpRate(sanitizeRate(e.target.value))}
                className="w-full pl-6 pr-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              id="rate-save-btn"
              type="submit"
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Rates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { ExchangeRates, HelperCommission, CurrencyViewMode, InquiryExpense } from '../types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD_TO_RMB: 7.25,
  EUR_TO_RMB: 7.85,
  GBP_TO_RMB: 9.15,
};

export const STORAGE_KEY_RATES = 'sourcing_agent_exchange_rates';
export const STORAGE_KEY_LOCAL_INQUIRIES = 'sourcing_agent_local_inquiries';

export function getSavedExchangeRates(): ExchangeRates {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_RATES);
    if (saved) {
      return { ...DEFAULT_EXCHANGE_RATES, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to parse saved exchange rates:', e);
  }
  return DEFAULT_EXCHANGE_RATES;
}

export function saveExchangeRates(rates: ExchangeRates) {
  try {
    localStorage.setItem(STORAGE_KEY_RATES, JSON.stringify(rates));
  } catch (e) {
    console.error('Failed to save exchange rates:', e);
  }
}

/**
 * Calculates pricing, client unit price, and estimated profit with high precision for micro-prices (e.g. $0.0495)
 */
export function calculateInquiryPricing(params: {
  quantity: number;
  price1688Rmb: number;
  domesticShippingRmb?: number;
  marginPercent: number;
  marginFixedUsd?: number;
  marginTotalDealUsd?: number;
  usdToRmbRate: number;
}): {
  unitCostRmb: number;
  unitCostUsd: number;
  clientUnitPriceUsd: number;
  clientUnitPriceRmb: number;
  profitPerUnitUsd: number;
  profitPerUnitRmb: number;
  totalCostUsd: number;
  totalCostRmb: number;
  totalQuotationUsd: number;
  totalQuotationRmb: number;
  estimatedProfitUsd: number;
  estimatedProfitRmb: number;
} {
  const qty = Math.max(1, !isNaN(Number(params.quantity)) && isFinite(Number(params.quantity)) ? Number(params.quantity) : 1);
  const p1688 = Math.max(0, !isNaN(Number(params.price1688Rmb)) && isFinite(Number(params.price1688Rmb)) ? Number(params.price1688Rmb) : 0);
  const domShip = Math.max(0, !isNaN(Number(params.domesticShippingRmb)) && isFinite(Number(params.domesticShippingRmb)) ? Number(params.domesticShippingRmb) : 0);
  const rate = params.usdToRmbRate > 0 && !isNaN(params.usdToRmbRate) ? params.usdToRmbRate : 7.25;
  const marginPct = !isNaN(Number(params.marginPercent)) ? Number(params.marginPercent) : 0;

  // Total sourcing cost in RMB per unit (product price + allocated domestic shipping)
  const unitCostRmb = p1688 + domShip / qty;
  const unitCostUsd = unitCostRmb / rate;

  let clientUnitPriceUsd: number;
  let clientUnitPriceRmb: number;
  let profitPerUnitUsd: number;
  let profitPerUnitRmb: number;
  const totalCostUsd = Math.round(unitCostUsd * qty * 100) / 100;
  const totalCostRmb = Math.round(unitCostRmb * qty * 100) / 100;
  let totalQuotationUsd: number;
  let totalQuotationRmb: number;
  let estimatedProfitUsd: number;
  let estimatedProfitRmb: number;

  if (params.marginTotalDealUsd !== undefined && params.marginTotalDealUsd !== null && !isNaN(Number(params.marginTotalDealUsd)) && Number(params.marginTotalDealUsd) > 0) {
    // Exact whole-deal lump sum profit
    const dealUsd = Number(params.marginTotalDealUsd);
    estimatedProfitUsd = dealUsd;
    estimatedProfitRmb = Math.round(dealUsd * rate * 100) / 100;

    profitPerUnitUsd = Math.round((dealUsd / qty) * 1000000) / 1000000;
    profitPerUnitRmb = Math.round(profitPerUnitUsd * rate * 1000000) / 1000000;

    const rawClientUnitPriceUsd = unitCostUsd + (dealUsd / qty);
    clientUnitPriceUsd = Math.round(rawClientUnitPriceUsd * 1000000) / 1000000;
    clientUnitPriceRmb = Math.round(clientUnitPriceUsd * rate * 1000000) / 1000000;

    totalQuotationUsd = Math.round((totalCostUsd + dealUsd) * 100) / 100;
    totalQuotationRmb = Math.round(totalQuotationUsd * rate * 100) / 100;
  } else {
    const marginFixed = !isNaN(Number(params.marginFixedUsd)) ? Number(params.marginFixedUsd) : 0;
    // Client Unit Price calculation without premature 2-decimal truncation
    // Preserve micro-cents for unit pricing (e.g., $0.0495 or $0.00125)
    const rawClientUnitPriceUsd = unitCostUsd * (1 + marginPct / 100) + marginFixed;
    
    // Clean rounding to 6 decimals to support micro-values while eliminating JS float drift
    clientUnitPriceUsd = Math.round(rawClientUnitPriceUsd * 1000000) / 1000000;
    clientUnitPriceRmb = Math.round(clientUnitPriceUsd * rate * 1000000) / 1000000;

    profitPerUnitUsd = Math.round((clientUnitPriceUsd - unitCostUsd) * 1000000) / 1000000;
    profitPerUnitRmb = Math.round(profitPerUnitUsd * rate * 1000000) / 1000000;

    totalQuotationUsd = Math.round(clientUnitPriceUsd * qty * 100) / 100;
    totalQuotationRmb = Math.round(totalQuotationUsd * rate * 100) / 100;

    estimatedProfitUsd = Math.round((totalQuotationUsd - totalCostUsd) * 100) / 100;
    estimatedProfitRmb = Math.round(estimatedProfitUsd * rate * 100) / 100;
  }

  return {
    unitCostRmb: Math.round(unitCostRmb * 1000000) / 1000000,
    unitCostUsd: Math.round(unitCostUsd * 1000000) / 1000000,
    clientUnitPriceUsd,
    clientUnitPriceRmb,
    profitPerUnitUsd,
    profitPerUnitRmb,
    totalCostUsd,
    totalCostRmb,
    totalQuotationUsd,
    totalQuotationRmb,
    estimatedProfitUsd,
    estimatedProfitRmb,
  };
}

/**
 * Formats a unit price with high precision support for micro-cents (e.g. $0.0495, $0.0085, ¥0.358, $2.50)
 */
export function formatUnitPrice(
  amount: number,
  currency: 'USD' | 'RMB' | 'EUR' | 'GBP' = 'USD',
  explicitDecimals?: number
): string {
  const symbols = {
    USD: '$',
    RMB: '¥',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || '$';
  const num = !isNaN(Number(amount)) && isFinite(Number(amount)) ? Number(amount) : 0;

  if (explicitDecimals !== undefined) {
    return `${symbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: explicitDecimals,
      maximumFractionDigits: explicitDecimals,
    })}`;
  }

  if (num === 0) {
    return `${symbol}0.00`;
  }

  const absNum = Math.abs(num);
  let minDec = 2;
  let maxDec = 2;

  if (absNum < 0.001) {
    minDec = 4;
    maxDec = 6;
  } else if (absNum < 0.01) {
    minDec = 3;
    maxDec = 5;
  } else if (absNum < 0.1) {
    minDec = 2;
    maxDec = 4;
  } else if (absNum < 1) {
    minDec = 2;
    maxDec = 4;
  } else {
    // Check if there are meaningful extra decimal digits beyond 2 decimals (e.g. 1.0495)
    const hasExtraDecimals = Math.abs(num * 100 - Math.round(num * 100)) > 0.0001;
    if (hasExtraDecimals) {
      minDec = 2;
      maxDec = 4;
    }
  }

  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec,
  })}`;
}

/**
 * Formats total amount with standard 2 decimals
 */
export function formatCurrency(
  amount: number,
  currency: 'USD' | 'RMB' | 'EUR' | 'GBP' = 'USD'
): string {
  const symbols = {
    USD: '$',
    RMB: '¥',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] || '$';
  const num = !isNaN(Number(amount)) && isFinite(Number(amount)) ? Number(amount) : 0;
  const absNum = Math.abs(num);

  let minDec = 2;
  let maxDec = 2;
  if (absNum > 0 && absNum < 0.01) {
    minDec = 3;
    maxDec = 4;
  }

  return `${symbol}${num.toLocaleString('en-US', {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec,
  })}`;
}

/**
 * Formats dual currency unit price (USD + RMB)
 * e.g. "$0.047 (¥0.341)" or "¥0.35 ($0.048)"
 */
export function formatDualUnitPrice(
  amountUsd: number,
  rateUsdToRmb: number = 7.25,
  primaryCurrency: 'USD' | 'RMB' = 'USD'
): { primary: string; secondary: string; combined: string } {
  const rate = rateUsdToRmb > 0 ? rateUsdToRmb : 7.25;
  const numUsd = Number(amountUsd) || 0;
  const numRmb = numUsd * rate;

  const strUsd = formatUnitPrice(numUsd, 'USD');
  const strRmb = formatUnitPrice(numRmb, 'RMB');

  if (primaryCurrency === 'RMB') {
    return {
      primary: strRmb,
      secondary: strUsd,
      combined: `${strRmb} (${strUsd})`,
    };
  }

  return {
    primary: strUsd,
    secondary: strRmb,
    combined: `${strUsd} (${strRmb})`,
  };
}

/**
 * Formats dual currency total amount (USD + RMB)
 * e.g. "$4,700.00 (¥34,075.00)"
 */
export function formatDualTotal(
  amountUsd: number,
  rateUsdToRmb: number = 7.25,
  primaryCurrency: 'USD' | 'RMB' = 'USD'
): { primary: string; secondary: string; combined: string } {
  const rate = rateUsdToRmb > 0 ? rateUsdToRmb : 7.25;
  const numUsd = Number(amountUsd) || 0;
  const numRmb = numUsd * rate;

  const strUsd = formatCurrency(numUsd, 'USD');
  const strRmb = formatCurrency(numRmb, 'RMB');

  if (primaryCurrency === 'RMB') {
    return {
      primary: strRmb,
      secondary: strUsd,
      combined: `${strRmb} (${strUsd})`,
    };
  }

  return {
    primary: strUsd,
    secondary: strRmb,
    combined: `${strUsd} (${strRmb})`,
  };
}

export const STORAGE_KEY_CURRENCY_VIEW = 'sourcing_agent_currency_view';

/**
 * Currency conversion utilities
 */
export function convertRmbToUsd(rmbAmount: number, usdToRmbRate: number = 7.25): number {
  const rate = usdToRmbRate > 0 ? usdToRmbRate : 7.25;
  const val = Number(rmbAmount) || 0;
  return Math.round((val / rate) * 10000) / 10000;
}

export function convertUsdToRmb(usdAmount: number, usdToRmbRate: number = 7.25): number {
  const rate = usdToRmbRate > 0 ? usdToRmbRate : 7.25;
  const val = Number(usdAmount) || 0;
  return Math.round((val * rate) * 10000) / 10000;
}

/**
 * Formats an amount based on the selected CurrencyViewMode ('USD' | 'RMB' | 'DUAL')
 */
export function formatAmountByViewMode(
  amountUsd: number,
  usdToRmbRate: number = 7.25,
  viewMode: CurrencyViewMode = 'USD'
): { primary: string; secondary?: string; compact: string } {
  const rate = usdToRmbRate > 0 ? usdToRmbRate : 7.25;
  const numUsd = Number(amountUsd) || 0;
  const numRmb = numUsd * rate;

  const strUsd = formatCurrency(numUsd, 'USD');
  const strRmb = formatCurrency(numRmb, 'RMB');

  if (viewMode === 'RMB') {
    return {
      primary: strRmb,
      secondary: strUsd,
      compact: strRmb,
    };
  }

  if (viewMode === 'DUAL') {
    return {
      primary: strUsd,
      secondary: strRmb,
      compact: `${strUsd} (${strRmb})`,
    };
  }

  return {
    primary: strUsd,
    secondary: strRmb,
    compact: strUsd,
  };
}

/**
 * Formats a unit price based on the selected CurrencyViewMode ('USD' | 'RMB' | 'DUAL')
 */
export function formatUnitAmountByViewMode(
  amountUsd: number,
  usdToRmbRate: number = 7.25,
  viewMode: CurrencyViewMode = 'USD'
): { primary: string; secondary?: string; compact: string } {
  const rate = usdToRmbRate > 0 ? usdToRmbRate : 7.25;
  const numUsd = Number(amountUsd) || 0;
  const numRmb = numUsd * rate;

  const strUsd = formatUnitPrice(numUsd, 'USD');
  const strRmb = formatUnitPrice(numRmb, 'RMB');

  if (viewMode === 'RMB') {
    return {
      primary: strRmb,
      secondary: strUsd,
      compact: strRmb,
    };
  }

  if (viewMode === 'DUAL') {
    return {
      primary: strUsd,
      secondary: strRmb,
      compact: `${strUsd} (${strRmb})`,
    };
  }

  return {
    primary: strUsd,
    secondary: strRmb,
    compact: strUsd,
  };
}

/**
 * Calculates a single helper's commission payout in USD
 */
export function calculateHelperCommissionAmount(
  helper: HelperCommission,
  grossProfitUsd: number,
  quantity: number,
  usdToRmbRate: number = 7.25
): number {
  const val = Number(helper.value) || 0;
  const qty = Math.max(1, Number(quantity) || 1);
  const profit = Math.max(0, Number(grossProfitUsd) || 0);
  const rate = usdToRmbRate > 0 ? usdToRmbRate : 7.25;
  const isRmb = helper.currency === 'RMB';

  if (helper.type === 'percentage_profit') {
    return Math.round(((val / 100) * profit) * 100) / 100;
  }
  if (helper.type === 'fixed_per_unit') {
    const unitAmountUsd = isRmb ? val / rate : val;
    return Math.round((unitAmountUsd * qty) * 100) / 100;
  }
  // 'fixed_total'
  const totalAmountUsd = isRmb ? val / rate : val;
  return Math.round(totalAmountUsd * 100) / 100;
}

/**
 * Calculates total commission payouts for all helpers on an order
 */
export function calculateTotalHelperCommissions(
  helpers: HelperCommission[] | undefined,
  grossProfitUsd: number,
  quantity: number,
  usdToRmbRate: number = 7.25
): number {
  if (!helpers || helpers.length === 0) return 0;
  const total = helpers.reduce(
    (sum, h) => sum + calculateHelperCommissionAmount(h, grossProfitUsd, quantity, usdToRmbRate),
    0
  );
  return Math.round(total * 100) / 100;
}

/**
 * Calculates packaging metrics (total cartons, CBM per carton, total CBM, total weight)
 */
export function calculatePackagingDetails(params: {
  quantity: number;
  pcsPerBox?: number;
  boxLengthCm?: number;
  boxWidthCm?: number;
  boxHeightCm?: number;
  grossWeightKg?: number;
  netWeightKg?: number;
}) {
  const qty = Math.max(1, Number(params.quantity) || 1);
  const pcsPerBox = Number(params.pcsPerBox) > 0 ? Number(params.pcsPerBox) : 0;
  const totalCartons = pcsPerBox > 0 ? Math.ceil(qty / pcsPerBox) : 0;

  const l = Number(params.boxLengthCm) || 0;
  const w = Number(params.boxWidthCm) || 0;
  const h = Number(params.boxHeightCm) || 0;

  // CBM = (L * W * H in cm) / 1,000,000
  const cbmPerCarton = l > 0 && w > 0 && h > 0 ? (l * w * h) / 1000000 : 0;
  const totalCbm = totalCartons > 0 && cbmPerCarton > 0 ? cbmPerCarton * totalCartons : cbmPerCarton;

  const gw = Number(params.grossWeightKg) || 0;
  const nw = Number(params.netWeightKg) || 0;
  const totalGrossWeightKg = totalCartons > 0 ? gw * totalCartons : gw;
  const totalNetWeightKg = totalCartons > 0 ? nw * totalCartons : nw;

  return {
    totalCartons,
    cbmPerCarton: Number(cbmPerCarton.toFixed(4)),
    totalCbm: Number(totalCbm.toFixed(3)),
    totalGrossWeightKg: Number(totalGrossWeightKg.toFixed(2)),
    totalNetWeightKg: Number(totalNetWeightKg.toFixed(2)),
  };
}

/**
 * Calculates total out-of-pocket expenses for a specific inquiry in USD and RMB
 */
export function calculateTotalInquiryExpenses(
  expenses: InquiryExpense[] | undefined,
  usdToRmbRate: number = 7.25
): { totalUsd: number; totalRmb: number } {
  if (!expenses || expenses.length === 0) {
    return { totalUsd: 0, totalRmb: 0 };
  }
  const rate = usdToRmbRate > 0 ? usdToRmbRate : 7.25;
  let totalUsd = 0;
  let totalRmb = 0;

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    if (amt <= 0) continue;

    if (exp.currency === 'RMB') {
      totalRmb += amt;
      totalUsd += amt / rate;
    } else {
      totalUsd += amt;
      totalRmb += amt * rate;
    }
  }

  return {
    totalUsd: Math.round(totalUsd * 100) / 100,
    totalRmb: Math.round(totalRmb * 100) / 100,
  };
}

/**
 * Calculates net take-home profit for an inquiry after helper commissions AND operational expenses
 */
export function calculateInquiryNetProfit(params: {
  estimatedProfitUsd: number;
  totalHelperCommissionsUsd: number;
  totalExpensesUsd: number;
}): number {
  const net = (params.estimatedProfitUsd || 0) - (params.totalHelperCommissionsUsd || 0) - (params.totalExpensesUsd || 0);
  return Math.round(net * 100) / 100;
}


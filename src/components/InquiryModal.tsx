import React, { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Building2,
  Globe2,
  Package,
  Link,
  DollarSign,
  Percent,
  CheckCircle,
  TrendingUp,
  FileText,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  AlertCircle,
  ExternalLink,
  Users,
  UserPlus,
  UserCheck,
  Coins,
  ChevronDown,
  Box,
  Scale,
  Ruler,
  Boxes,
  Target,
  Layers,
  Check,
  Clock,
  Zap,
} from 'lucide-react';
import {
  InquiryItem,
  OrderStatus,
  ExchangeRates,
  SupplierQuote,
  HelperCommission,
  HelperCommissionType,
  CurrencyUnit,
  MarginMode,
} from '../types';
import {
  calculateInquiryPricing,
  formatCurrency,
  formatUnitPrice,
  formatDualUnitPrice,
  formatDualTotal,
  calculateHelperCommissionAmount,
  calculateTotalHelperCommissions,
  calculatePackagingDetails,
  convertRmbToUsd,
  convertUsdToRmb,
} from '../lib/currency';
import { compressImageFile } from '../lib/imageUtils';
import { detectB2BPlatform, CHINESE_B2B_PLATFORMS } from '../lib/b2bPlatforms';
import { COUNTRIES } from '../lib/countryFlags';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InquiryItem) => void;
  inquiryToEdit: InquiryItem | null;
  exchangeRates: ExchangeRates;
  existingCount: number;
}

const COMMON_COUNTRIES = COUNTRIES.map((c) => c.name);

const HELPER_ROLES = [
  'Sourcing Assistant',
  'QC & Inspection',
  'Translator / Negotiator',
  'Finder / Referral',
  'Logistics Coordinator',
  'Partner (Co-Sourcing)',
  'Other',
];

export const InquiryModal: React.FC<InquiryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  inquiryToEdit,
  exchangeRates,
  existingCount,
}) => {
  const [formData, setFormData] = useState<Partial<InquiryItem>>({
    inquiryNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    customerContact: '',
    country: 'United States',
    product: '',
    productUrl1688: '',
    supplierName: '',
    quantity: 500,
    price1688Rmb: 0,
    domesticShippingRmb: 0,
    marginPercent: 20,
    marginFixedUsd: 0,
    clientUnitPriceUsd: 0,
    totalQuotationUsd: 0,
    estimatedProfitUsd: 0,
    orderStatus: 'New Inquiry',
    notes: '',
  });

  // Currency input preferences & toggles
  const [activeCurrencyMode, setActiveCurrencyMode] = useState<CurrencyUnit>('RMB');
  const [targetPriceCurrency, setTargetPriceCurrency] = useState<CurrencyUnit>('USD');
  const [quoteCurrencies, setQuoteCurrencies] = useState<
    Record<string, { price: CurrencyUnit; shipping: CurrencyUnit }>
  >({});
  const [quoteInputsRaw, setQuoteInputsRaw] = useState<
    Record<string, { price?: string; shipping?: string }>
  >({});
  const [targetPriceRaw, setTargetPriceRaw] = useState<string | null>(null);
  const [marginMode, setMarginMode] = useState<MarginMode>('percent');
  const [marginInputRaw, setMarginInputRaw] = useState<string>('25');
  const [fixedMarginRmb, setFixedMarginRmb] = useState<number>(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingImage(true);
      try {
        const compressedBase64 = await compressImageFile(file, 320, 0.7);
        setFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (err) {
        console.error('Failed to compress image:', err);
      } finally {
        setIsCompressingImage(false);
      }
    }
  };

  // Load existing data if editing, or initialize defaults for new inquiry
  useEffect(() => {
    setQuoteInputsRaw({});
    setTargetPriceRaw(null);
    if (inquiryToEdit) {
      // Migrate legacy single-quote to quotes array if missing
      const initialQuotes = inquiryToEdit.quotes?.length
        ? inquiryToEdit.quotes
        : inquiryToEdit.productUrl1688 || inquiryToEdit.supplierName || inquiryToEdit.price1688Rmb
        ? [
            {
              id: 'quote_1',
              supplierName: inquiryToEdit.supplierName || '',
              productUrl1688: inquiryToEdit.productUrl1688 || '',
              price1688Rmb: inquiryToEdit.price1688Rmb || 0,
              domesticShippingRmb: inquiryToEdit.domesticShippingRmb || 0,
            },
          ]
        : [];
        
      setFormData({
        ...inquiryToEdit,
        material: inquiryToEdit.material || '',
        colorVariant: inquiryToEdit.colorVariant || '',
        packagingType: inquiryToEdit.packagingType || '',
        hsCode: inquiryToEdit.hsCode || '',
        boxLengthCm: inquiryToEdit.boxLengthCm !== undefined ? Number(inquiryToEdit.boxLengthCm) : undefined,
        boxWidthCm: inquiryToEdit.boxWidthCm !== undefined ? Number(inquiryToEdit.boxWidthCm) : undefined,
        boxHeightCm: inquiryToEdit.boxHeightCm !== undefined ? Number(inquiryToEdit.boxHeightCm) : undefined,
        pcsPerBox: inquiryToEdit.pcsPerBox !== undefined ? Number(inquiryToEdit.pcsPerBox) : undefined,
        unitWeightG: inquiryToEdit.unitWeightG !== undefined ? Number(inquiryToEdit.unitWeightG) : undefined,
        grossWeightKg: inquiryToEdit.grossWeightKg !== undefined ? Number(inquiryToEdit.grossWeightKg) : undefined,
        netWeightKg: inquiryToEdit.netWeightKg !== undefined ? Number(inquiryToEdit.netWeightKg) : undefined,
        quantity: inquiryToEdit.quantity || 500,
        quantityUnit: inquiryToEdit.quantityUnit || 'pcs',
        targetPriceUsd: inquiryToEdit.targetPriceUsd !== undefined ? Number(inquiryToEdit.targetPriceUsd) : undefined,
        targetPriceRmb: inquiryToEdit.targetPriceRmb !== undefined ? Number(inquiryToEdit.targetPriceRmb) : undefined,
        moq: inquiryToEdit.moq !== undefined ? Number(inquiryToEdit.moq) : undefined,
        sampleQuantity: inquiryToEdit.sampleQuantity !== undefined ? Number(inquiryToEdit.sampleQuantity) : undefined,
        quantityTolerancePercent: inquiryToEdit.quantityTolerancePercent !== undefined ? Number(inquiryToEdit.quantityTolerancePercent) : 5,
        annualEstimatedQuantity: inquiryToEdit.annualEstimatedQuantity !== undefined ? Number(inquiryToEdit.annualEstimatedQuantity) : undefined,
        deliveryLeadTimeDays: inquiryToEdit.deliveryLeadTimeDays !== undefined ? Number(inquiryToEdit.deliveryLeadTimeDays) : undefined,
        quotes: initialQuotes,
        selectedQuoteId: inquiryToEdit.selectedQuoteId || (initialQuotes.length > 0 ? initialQuotes[0].id : ''),
        helperCommissions: inquiryToEdit.helperCommissions || [],
      });
      if (inquiryToEdit.targetPriceRmb && !inquiryToEdit.targetPriceUsd) {
        setTargetPriceCurrency('RMB');
      } else {
        setTargetPriceCurrency('USD');
      }

      const initialMode: MarginMode = inquiryToEdit.marginMode || (
        inquiryToEdit.marginDealTotal && inquiryToEdit.marginDealTotal > 0
          ? 'deal_usd'
          : inquiryToEdit.marginFixedUsd && inquiryToEdit.marginFixedUsd > 0 && !inquiryToEdit.marginPercent
          ? 'fixed_usd'
          : 'percent'
      );
      setMarginMode(initialMode);
      if (initialMode === 'deal_usd') {
        setMarginInputRaw(inquiryToEdit.marginDealTotal !== undefined ? String(inquiryToEdit.marginDealTotal) : '');
      } else if (initialMode === 'deal_rmb') {
        setMarginInputRaw(inquiryToEdit.marginDealTotal !== undefined ? String(inquiryToEdit.marginDealTotal) : '');
      } else if (initialMode === 'fixed_usd') {
        setMarginInputRaw(inquiryToEdit.marginFixedUsd !== undefined ? String(inquiryToEdit.marginFixedUsd) : '');
      } else if (initialMode === 'fixed_rmb') {
        const rmbVal = inquiryToEdit.marginFixedUsd ? (inquiryToEdit.marginFixedUsd * exchangeRates.USD_TO_RMB) : 0;
        setFixedMarginRmb(rmbVal);
        setMarginInputRaw(rmbVal ? String(parseFloat(rmbVal.toFixed(4))) : '');
      } else {
        setMarginInputRaw(inquiryToEdit.marginPercent !== undefined ? String(inquiryToEdit.marginPercent) : '25');
      }
    } else {
      const nextNum = `INQ-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`;
      const defaultQuoteId = 'quote_' + Date.now();
      setFormData({
        id: `inq_${Date.now()}`,
        inquiryNumber: nextNum,
        date: new Date().toISOString().split('T')[0],
        customerName: '',
        customerContact: '',
        wechatId: '',
        country: 'United States',
        product: '',
        imageUrl: '',
        material: '',
        colorVariant: '',
        packagingType: '',
        hsCode: '',
        boxLengthCm: undefined,
        boxWidthCm: undefined,
        boxHeightCm: undefined,
        pcsPerBox: undefined,
        unitWeightG: undefined,
        grossWeightKg: undefined,
        netWeightKg: undefined,
        quantity: 500,
        quantityUnit: 'pcs',
        targetPriceUsd: undefined,
        targetPriceRmb: undefined,
        moq: 500,
        sampleQuantity: 2,
        quantityTolerancePercent: 5,
        annualEstimatedQuantity: undefined,
        deliveryLeadTimeDays: undefined,
        quotes: [
          {
            id: defaultQuoteId,
            supplierName: '',
            productUrl1688: '',
            price1688Rmb: 25,
            domesticShippingRmb: 50,
          }
        ],
        selectedQuoteId: defaultQuoteId,
        marginPercent: 25,
        marginFixedUsd: 0,
        marginDealTotal: undefined,
        helperCommissions: [],
        orderStatus: 'New Inquiry',
        notes: '',
        updatedAt: new Date().toISOString(),
      });
      setMarginMode('percent');
      setMarginInputRaw('25');
      setFixedMarginRmb(0);
    }
  }, [inquiryToEdit, existingCount, isOpen]);

  // Recalculate prices based on SELECTED quote
  const selectedQuote = formData.quotes?.find((q) => q.id === formData.selectedQuoteId) || formData.quotes?.[0];
  const activePrice1688 = !isNaN(Number(selectedQuote?.price1688Rmb)) ? Math.max(0, Number(selectedQuote?.price1688Rmb)) : 0;
  const activeShipping = !isNaN(Number(selectedQuote?.domesticShippingRmb)) ? Math.max(0, Number(selectedQuote?.domesticShippingRmb)) : 0;

  const activeDealProfitUsd = (marginMode === 'deal_usd' || marginMode === 'deal_rmb') && formData.marginDealTotal !== undefined && !isNaN(Number(formData.marginDealTotal))
    ? (marginMode === 'deal_usd' ? Number(formData.marginDealTotal) : Number(formData.marginDealTotal) / (exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25))
    : undefined;

  const pricing = calculateInquiryPricing({
    quantity: Number(formData.quantity) || 1,
    price1688Rmb: activePrice1688,
    domesticShippingRmb: activeShipping,
    marginPercent: Number(formData.marginPercent) || 0,
    marginFixedUsd: Number(formData.marginFixedUsd) || 0,
    marginTotalDealUsd: activeDealProfitUsd,
    usdToRmbRate: exchangeRates.USD_TO_RMB,
  });

  const packagingMetrics = calculatePackagingDetails({
    quantity: Number(formData.quantity) || 1,
    pcsPerBox: formData.pcsPerBox,
    boxLengthCm: formData.boxLengthCm,
    boxWidthCm: formData.boxWidthCm,
    boxHeightCm: formData.boxHeightCm,
    grossWeightKg: formData.grossWeightKg,
    netWeightKg: formData.netWeightKg,
  });

  const totalHelperCommission = calculateTotalHelperCommissions(
    formData.helperCommissions,
    pricing.estimatedProfitUsd,
    Number(formData.quantity) || 1,
    exchangeRates.USD_TO_RMB
  );
  const netAgentProfit = Number((pricing.estimatedProfitUsd - totalHelperCommission).toFixed(2));

  // Helper to sanitize numeric inputs entered with symbols like $, ¥, €, commas, or spaces
  const cleanCurrencyInput = (raw: string): string => {
    if (!raw) return '';
    let cleaned = raw.replace(/[$¥€£\s]/g, '').replace(',', '.');
    cleaned = cleaned.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Currency helper handlers
  const handleTargetPriceChange = (valStr: string, currency: CurrencyUnit) => {
    const cleaned = cleanCurrencyInput(valStr);
    setTargetPriceRaw(cleaned);
    if (cleaned === '' || cleaned === '.') {
      setFormData((prev) => ({ ...prev, targetPriceUsd: undefined, targetPriceRmb: undefined }));
      return;
    }
    const val = parseFloat(cleaned);
    if (isNaN(val) || !isFinite(val)) {
      return;
    }
    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
    if (currency === 'USD') {
      const rmb = Number((val * rate).toFixed(6));
      setFormData((prev) => ({ ...prev, targetPriceUsd: val, targetPriceRmb: rmb }));
    } else {
      const usd = Number((val / rate).toFixed(6));
      setFormData((prev) => ({ ...prev, targetPriceRmb: val, targetPriceUsd: usd }));
    }
  };

  // Margin and Profit Mode Handlers
  const handleMarginModeSwitch = (newMode: MarginMode) => {
    setMarginMode(newMode);
    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
    const qty = Math.max(1, Number(formData.quantity) || 1);

    if (newMode === 'percent') {
      const defaultPct = formData.marginPercent > 0 ? formData.marginPercent : 20;
      setMarginInputRaw(String(defaultPct));
      setFormData((prev) => ({
        ...prev,
        marginPercent: defaultPct,
        marginFixedUsd: 0,
        marginDealTotal: undefined,
      }));
    } else if (newMode === 'fixed_usd') {
      const defaultVal = formData.marginFixedUsd && formData.marginFixedUsd > 0 ? formData.marginFixedUsd : 0.5;
      setMarginInputRaw(String(defaultVal));
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginFixedUsd: defaultVal,
        marginDealTotal: undefined,
      }));
    } else if (newMode === 'fixed_rmb') {
      const rmbVal = formData.marginFixedUsd && formData.marginFixedUsd > 0
        ? parseFloat((formData.marginFixedUsd * rate).toFixed(4))
        : 2.0;
      setFixedMarginRmb(rmbVal);
      setMarginInputRaw(String(rmbVal));
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginFixedUsd: rmbVal / rate,
        marginDealTotal: undefined,
      }));
    } else if (newMode === 'deal_usd') {
      let dealUsd = 500;
      if (formData.marginDealTotal && formData.marginDealTotal > 0) {
        dealUsd = formData.marginDealTotal;
      } else if (pricing.estimatedProfitUsd > 0) {
        dealUsd = parseFloat(pricing.estimatedProfitUsd.toFixed(2));
      }
      setMarginInputRaw(String(dealUsd));
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginDealTotal: dealUsd,
        marginFixedUsd: dealUsd / qty,
      }));
    } else if (newMode === 'deal_rmb') {
      let dealRmb = 3500;
      if (formData.marginDealTotal && formData.marginDealTotal > 0) {
        dealRmb = formData.marginDealTotal;
      } else if (pricing.estimatedProfitRmb > 0) {
        dealRmb = parseFloat(pricing.estimatedProfitRmb.toFixed(2));
      }
      setMarginInputRaw(String(dealRmb));
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginDealTotal: dealRmb,
        marginFixedUsd: (dealRmb / rate) / qty,
      }));
    }
  };

  const handleMarginInputChange = (valStr: string) => {
    const cleaned = cleanCurrencyInput(valStr);
    setMarginInputRaw(cleaned);

    if (cleaned === '' || cleaned === '.') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: marginMode === 'percent' ? 0 : prev.marginPercent,
        marginFixedUsd: marginMode !== 'percent' ? 0 : prev.marginFixedUsd,
        marginDealTotal: marginMode === 'deal_usd' || marginMode === 'deal_rmb' ? 0 : undefined,
      }));
      return;
    }

    const num = parseFloat(cleaned);
    if (isNaN(num)) return;

    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
    const qty = Math.max(1, Number(formData.quantity) || 1);

    if (marginMode === 'percent') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: num,
        marginFixedUsd: 0,
        marginDealTotal: undefined,
      }));
    } else if (marginMode === 'fixed_usd') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginFixedUsd: num,
        marginDealTotal: undefined,
      }));
    } else if (marginMode === 'fixed_rmb') {
      setFixedMarginRmb(num);
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginFixedUsd: num / rate,
        marginDealTotal: undefined,
      }));
    } else if (marginMode === 'deal_usd') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginDealTotal: num,
        marginFixedUsd: num / qty,
      }));
    } else if (marginMode === 'deal_rmb') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginDealTotal: num,
        marginFixedUsd: (num / rate) / qty,
      }));
    }
  };

  const applyMarginPreset = (val: number) => {
    setMarginInputRaw(String(val));
    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
    const qty = Math.max(1, Number(formData.quantity) || 1);

    if (marginMode === 'percent') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: val,
        marginFixedUsd: 0,
        marginDealTotal: undefined,
      }));
    } else if (marginMode === 'fixed_usd') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginFixedUsd: val,
        marginDealTotal: undefined,
      }));
    } else if (marginMode === 'fixed_rmb') {
      setFixedMarginRmb(val);
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginFixedUsd: val / rate,
        marginDealTotal: undefined,
      }));
    } else if (marginMode === 'deal_usd') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginDealTotal: val,
        marginFixedUsd: val / qty,
      }));
    } else if (marginMode === 'deal_rmb') {
      setFormData((prev) => ({
        ...prev,
        marginPercent: 0,
        marginDealTotal: val,
        marginFixedUsd: (val / rate) / qty,
      }));
    }
  };

  const handleQuantityChange = (newQtyStr: string) => {
    const qty = Math.max(0, parseFloat(newQtyStr) || 0);
    const effectiveQty = Math.max(1, qty);
    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;

    setFormData((prev) => {
      const updated = { ...prev, quantity: newQtyStr as any };
      if (marginMode === 'deal_usd' && prev.marginDealTotal) {
        updated.marginFixedUsd = prev.marginDealTotal / effectiveQty;
      } else if (marginMode === 'deal_rmb' && prev.marginDealTotal) {
        updated.marginFixedUsd = (prev.marginDealTotal / rate) / effectiveQty;
      }
      return updated;
    });
  };

  const getQuotePriceCurrency = (quoteId: string): CurrencyUnit => {
    return quoteCurrencies[quoteId]?.price || activeCurrencyMode;
  };

  const getQuoteShippingCurrency = (quoteId: string): CurrencyUnit => {
    return quoteCurrencies[quoteId]?.shipping || activeCurrencyMode;
  };

  const setQuotePriceCurrency = (quoteId: string, curr: CurrencyUnit) => {
    const quote = formData.quotes?.find((q) => q.id === quoteId);
    setQuoteCurrencies((prev) => ({
      ...prev,
      [quoteId]: {
        price: curr,
        shipping: prev[quoteId]?.shipping || activeCurrencyMode,
      },
    }));
    if (quote) {
      const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
      const rmb = Number(quote.price1688Rmb) || 0;
      if (curr === 'USD') {
        const usdVal = rmb > 0 ? String(Math.round((rmb / rate) * 1000000) / 1000000) : '';
        setQuoteInputsRaw((prev) => ({
          ...prev,
          [quoteId]: { ...prev[quoteId], price: usdVal },
        }));
      } else {
        const rmbVal = rmb > 0 ? String(rmb) : '';
        setQuoteInputsRaw((prev) => ({
          ...prev,
          [quoteId]: { ...prev[quoteId], price: rmbVal },
        }));
      }
    }
  };

  const setQuoteShippingCurrency = (quoteId: string, curr: CurrencyUnit) => {
    const quote = formData.quotes?.find((q) => q.id === quoteId);
    setQuoteCurrencies((prev) => ({
      ...prev,
      [quoteId]: {
        price: prev[quoteId]?.price || activeCurrencyMode,
        shipping: curr,
      },
    }));
    if (quote) {
      const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
      const rmb = Number(quote.domesticShippingRmb) || 0;
      if (curr === 'USD') {
        const usdVal = rmb > 0 ? String(Math.round((rmb / rate) * 1000000) / 1000000) : '';
        setQuoteInputsRaw((prev) => ({
          ...prev,
          [quoteId]: { ...prev[quoteId], shipping: usdVal },
        }));
      } else {
        const rmbVal = rmb > 0 ? String(rmb) : '';
        setQuoteInputsRaw((prev) => ({
          ...prev,
          [quoteId]: { ...prev[quoteId], shipping: rmbVal },
        }));
      }
    }
  };

  const switchAllQuoteCurrencies = (curr: CurrencyUnit) => {
    setActiveCurrencyMode(curr);
    const updated: Record<string, { price: CurrencyUnit; shipping: CurrencyUnit }> = {};
    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
    const rawUpdated: Record<string, { price?: string; shipping?: string }> = {};

    formData.quotes?.forEach((q) => {
      updated[q.id] = { price: curr, shipping: curr };
      const pRmb = Number(q.price1688Rmb) || 0;
      const sRmb = Number(q.domesticShippingRmb) || 0;
      if (curr === 'USD') {
        rawUpdated[q.id] = {
          price: pRmb > 0 ? String(Math.round((pRmb / rate) * 1000000) / 1000000) : '',
          shipping: sRmb > 0 ? String(Math.round((sRmb / rate) * 1000000) / 1000000) : '',
        };
      } else {
        rawUpdated[q.id] = {
          price: pRmb > 0 ? String(pRmb) : '',
          shipping: sRmb > 0 ? String(sRmb) : '',
        };
      }
    });
    setQuoteCurrencies(updated);
    setQuoteInputsRaw((prev) => ({ ...prev, ...rawUpdated }));
  };

  const handleQuotePriceChange = (quoteIndex: number, valStr: string, currency: CurrencyUnit) => {
    const cleaned = cleanCurrencyInput(valStr);
    const newQuotes = [...(formData.quotes || [])];
    const q = newQuotes[quoteIndex];
    if (!q) return;

    setQuoteInputsRaw((prev) => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        price: cleaned,
      },
    }));

    if (cleaned === '' || cleaned === '.') {
      q.price1688Rmb = 0;
    } else {
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && isFinite(parsed)) {
        const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
        if (currency === 'USD') {
          q.price1688Rmb = Math.round(parsed * rate * 1000000) / 1000000;
        } else {
          q.price1688Rmb = parsed;
        }
      } else {
        q.price1688Rmb = 0;
      }
    }
    setFormData((prev) => ({ ...prev, quotes: newQuotes }));
  };

  const handleQuoteShippingChange = (quoteIndex: number, valStr: string, currency: CurrencyUnit) => {
    const cleaned = cleanCurrencyInput(valStr);
    const newQuotes = [...(formData.quotes || [])];
    const q = newQuotes[quoteIndex];
    if (!q) return;

    setQuoteInputsRaw((prev) => ({
      ...prev,
      [q.id]: {
        ...prev[q.id],
        shipping: cleaned,
      },
    }));

    if (cleaned === '' || cleaned === '.') {
      q.domesticShippingRmb = 0;
    } else {
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && isFinite(parsed)) {
        const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
        if (currency === 'USD') {
          q.domesticShippingRmb = Math.round(parsed * rate * 1000000) / 1000000;
        } else {
          q.domesticShippingRmb = parsed;
        }
      } else {
        q.domesticShippingRmb = 0;
      }
    }
    setFormData((prev) => ({ ...prev, quotes: newQuotes }));
  };

  const handleAddHelper = () => {
    const newHelper: HelperCommission = {
      id: 'helper_' + Date.now(),
      name: '',
      role: 'Sourcing Assistant',
      type: 'percentage_profit',
      currency: 'USD',
      value: 10,
      contact: '',
      notes: '',
    };
    setFormData((prev) => ({
      ...prev,
      helperCommissions: [...(prev.helperCommissions || []), newHelper],
    }));
  };

  const handleUpdateHelper = (index: number, updates: Partial<HelperCommission>) => {
    const updated = [...(formData.helperCommissions || [])];
    updated[index] = { ...updated[index], ...updates };
    setFormData((prev) => ({ ...prev, helperCommissions: updated }));
  };

  const handleRemoveHelper = (index: number) => {
    const updated = [...(formData.helperCommissions || [])];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, helperCommissions: updated }));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName?.trim() || !formData.product?.trim()) {
      alert('Please enter at least Customer Name and Product');
      return;
    }

    const finalItem: InquiryItem = {
      id: formData.id || `inq_${Date.now()}`,
      inquiryNumber:
        formData.inquiryNumber?.trim() ||
        `INQ-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`,
      date: formData.date || new Date().toISOString().split('T')[0],
      customerName: formData.customerName.trim(),
      customerContact: formData.customerContact?.trim() || '',
      wechatId: formData.wechatId?.trim() || undefined,
      country: formData.country?.trim() || 'Global',
      product: formData.product.trim(),
      imageUrl: formData.imageUrl?.trim() || '',
      material: formData.material?.trim() || '',
      colorVariant: formData.colorVariant?.trim() || '',
      packagingType: formData.packagingType?.trim() || '',
      hsCode: formData.hsCode?.trim() || '',
      boxLengthCm:
        formData.boxLengthCm !== undefined && formData.boxLengthCm !== null && String(formData.boxLengthCm).trim() !== '' && !isNaN(Number(formData.boxLengthCm))
          ? Number(formData.boxLengthCm)
          : undefined,
      boxWidthCm:
        formData.boxWidthCm !== undefined && formData.boxWidthCm !== null && String(formData.boxWidthCm).trim() !== '' && !isNaN(Number(formData.boxWidthCm))
          ? Number(formData.boxWidthCm)
          : undefined,
      boxHeightCm:
        formData.boxHeightCm !== undefined && formData.boxHeightCm !== null && String(formData.boxHeightCm).trim() !== '' && !isNaN(Number(formData.boxHeightCm))
          ? Number(formData.boxHeightCm)
          : undefined,
      pcsPerBox:
        formData.pcsPerBox !== undefined && formData.pcsPerBox !== null && String(formData.pcsPerBox).trim() !== '' && !isNaN(Number(formData.pcsPerBox))
          ? Number(formData.pcsPerBox)
          : undefined,
      unitWeightG:
        formData.unitWeightG !== undefined && formData.unitWeightG !== null && String(formData.unitWeightG).trim() !== '' && !isNaN(Number(formData.unitWeightG))
          ? Number(formData.unitWeightG)
          : undefined,
      grossWeightKg:
        formData.grossWeightKg !== undefined && formData.grossWeightKg !== null && String(formData.grossWeightKg).trim() !== '' && !isNaN(Number(formData.grossWeightKg))
          ? Number(formData.grossWeightKg)
          : undefined,
      netWeightKg:
        formData.netWeightKg !== undefined && formData.netWeightKg !== null && String(formData.netWeightKg).trim() !== '' && !isNaN(Number(formData.netWeightKg))
          ? Number(formData.netWeightKg)
          : undefined,
      productUrl1688: selectedQuote?.productUrl1688 || '',
      supplierName: selectedQuote?.supplierName || '',
      quantity: Number(formData.quantity) || 1,
      quantityUnit: formData.quantityUnit || 'pcs',
      targetPriceUsd:
        formData.targetPriceUsd !== undefined && formData.targetPriceUsd !== null && String(formData.targetPriceUsd).trim() !== '' && !isNaN(Number(formData.targetPriceUsd))
          ? Number(formData.targetPriceUsd)
          : undefined,
      targetPriceRmb:
        formData.targetPriceRmb !== undefined && formData.targetPriceRmb !== null && String(formData.targetPriceRmb).trim() !== '' && !isNaN(Number(formData.targetPriceRmb))
          ? Number(formData.targetPriceRmb)
          : undefined,
      moq:
        formData.moq !== undefined && formData.moq !== null && String(formData.moq).trim() !== '' && !isNaN(Number(formData.moq))
          ? Number(formData.moq)
          : undefined,
      sampleQuantity:
        formData.sampleQuantity !== undefined && formData.sampleQuantity !== null && String(formData.sampleQuantity).trim() !== '' && !isNaN(Number(formData.sampleQuantity))
          ? Number(formData.sampleQuantity)
          : undefined,
      quantityTolerancePercent:
        formData.quantityTolerancePercent !== undefined && formData.quantityTolerancePercent !== null && !isNaN(Number(formData.quantityTolerancePercent))
          ? Number(formData.quantityTolerancePercent)
          : undefined,
      annualEstimatedQuantity:
        formData.annualEstimatedQuantity !== undefined && formData.annualEstimatedQuantity !== null && String(formData.annualEstimatedQuantity).trim() !== '' && !isNaN(Number(formData.annualEstimatedQuantity))
          ? Number(formData.annualEstimatedQuantity)
          : undefined,
      deliveryLeadTimeDays:
        formData.deliveryLeadTimeDays !== undefined && formData.deliveryLeadTimeDays !== null && String(formData.deliveryLeadTimeDays).trim() !== '' && !isNaN(Number(formData.deliveryLeadTimeDays))
          ? Number(formData.deliveryLeadTimeDays)
          : undefined,
      price1688Rmb: !isNaN(Number(activePrice1688)) ? Math.max(0, Number(activePrice1688)) : 0,
      domesticShippingRmb: !isNaN(Number(activeShipping)) ? Math.max(0, Number(activeShipping)) : 0,
      quotes: (formData.quotes || []).map((q) => ({
        id: q.id || `quote_${Date.now()}`,
        supplierName: q.supplierName || '',
        productUrl1688: q.productUrl1688 || '',
        price1688Rmb: !isNaN(Number(q.price1688Rmb)) ? Math.max(0, Number(q.price1688Rmb)) : 0,
        domesticShippingRmb: !isNaN(Number(q.domesticShippingRmb)) ? Math.max(0, Number(q.domesticShippingRmb)) : 0,
        wechatId: q.wechatId || '',
        whatsapp: q.whatsapp || '',
      })),
      selectedQuoteId: formData.selectedQuoteId || '',
      marginPercent: !isNaN(Number(formData.marginPercent)) ? Number(formData.marginPercent) : 0,
      marginFixedUsd: !isNaN(Number(formData.marginFixedUsd)) ? Number(formData.marginFixedUsd) : 0,
      marginMode: marginMode,
      marginDealTotal: (marginMode === 'deal_usd' || marginMode === 'deal_rmb') && formData.marginDealTotal !== undefined && !isNaN(Number(formData.marginDealTotal))
        ? Number(formData.marginDealTotal)
        : undefined,
      clientUnitPriceUsd: !isNaN(Number(pricing.clientUnitPriceUsd)) ? pricing.clientUnitPriceUsd : 0,
      totalQuotationUsd: !isNaN(Number(pricing.totalQuotationUsd)) ? pricing.totalQuotationUsd : 0,
      estimatedProfitUsd: !isNaN(Number(pricing.estimatedProfitUsd)) ? pricing.estimatedProfitUsd : 0,
      helperCommissions: formData.helperCommissions || [],
      totalHelperCommissionUsd: totalHelperCommission,
      netAgentProfitUsd: netAgentProfit,
      orderStatus: (formData.orderStatus as OrderStatus) || 'New Inquiry',
      notes: formData.notes?.trim() || '',
      updatedAt: new Date().toISOString(),
    };

    onSave(finalItem);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full shadow-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-indigo-50 text-indigo-600">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {inquiryToEdit ? 'Edit Sourcing Inquiry' : 'New Sourcing Inquiry & Chinese B2B Quotation'}
              </h2>
              <p className="text-[11px] text-slate-500">
                1688, Made-in-China, Yiwugo & Direct Factory Sourcing Formulation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currency Quick-Switch Bar */}
        <div className="px-5 py-2 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-indigo-600" />
              <span>Input Currency:</span>
            </span>
            <div className="inline-flex rounded-md bg-white p-0.5 border border-indigo-200 shadow-2xs">
              <button
                type="button"
                id="modal-currency-rmb-btn"
                onClick={() => switchAllQuoteCurrencies('RMB')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                  activeCurrencyMode === 'RMB'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Input supplier costs in Chinese Yuan (¥ RMB)"
              >
                <span>¥ RMB</span>
                <span className="text-[9px] opacity-80 font-normal">(1688 / Factory)</span>
              </button>
              <button
                type="button"
                id="modal-currency-usd-btn"
                onClick={() => switchAllQuoteCurrencies('USD')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 ${
                  activeCurrencyMode === 'USD'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Input supplier costs in US Dollars ($ USD)"
              >
                <span>$ USD</span>
                <span className="text-[9px] opacity-80 font-normal">(Direct USD)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-indigo-800 font-medium">
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">
              1 USD = ¥{exchangeRates.USD_TO_RMB.toFixed(2)} RMB
            </span>
            <span className="text-[10px] text-indigo-600/80 hidden sm:inline">
              (Live auto-conversion active)
            </span>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Top Row: Inquiry #, Date, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Inquiry Number
              </label>
              <input
                id="modal-inquiry-number-input"
                type="text"
                value={formData.inquiryNumber || ''}
                onChange={(e) => setFormData({ ...formData, inquiryNumber: e.target.value })}
                placeholder="e.g. INQ-2026-001"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-mono font-semibold focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Date</label>
              <input
                id="modal-date-input"
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Order Status
              </label>
              <select
                id="modal-status-select"
                value={formData.orderStatus || 'New Inquiry'}
                onChange={(e) =>
                  setFormData({ ...formData, orderStatus: e.target.value as OrderStatus })
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs font-medium"
              >
                <option value="New Inquiry">New Inquiry</option>
                <option value="1688 Sourcing">1688 Sourcing</option>
                <option value="Quoted to Client">Quoted to Client</option>
                <option value="Sample Ordered">Sample Ordered</option>
                <option value="Sample Approved">Sample Approved</option>
                <option value="Order Placed">Order Placed</option>
                <option value="In Production">In Production</option>
                <option value="QC & Inspection">QC & Inspection</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Section 1: Customer Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5">
            <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-600 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Customer Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Customer / Company <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-customer-name-input"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Contact (WhatsApp / Email)
                </label>
                <input
                  id="modal-customer-contact-input"
                  type="text"
                  placeholder="e.g. +1 555 123 4567 / info@..."
                  value={formData.customerContact || ''}
                  onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  WeChat ID
                </label>
                <input
                  id="modal-wechat-id-input"
                  type="text"
                  placeholder="e.g. wxid_123..."
                  value={formData.wechatId || ''}
                  onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Country</label>
                <input
                  id="modal-country-input"
                  type="text"
                  list="country-suggestions"
                  placeholder="e.g. United States"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
                <datalist id="country-suggestions">
                  {COMMON_COUNTRIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Section 2: Product Specifications & Packaging Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <span>Product Specifications & Details</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                Packaging specs, master carton dimensions & CBM
              </span>
            </div>

            {/* Product Name & Image Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
              <div className="sm:col-span-3 space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Product Name / Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="modal-product-name-input"
                    type="text"
                    required
                    placeholder="e.g. Double-Wall Glass Coffee Mugs (350ml)"
                    value={formData.product || ''}
                    onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Material / Composition
                    </label>
                    <input
                      id="modal-material-input"
                      type="text"
                      placeholder="e.g. High Borosilicate Glass, Silicone"
                      value={formData.material || ''}
                      onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Color / Finish / Variants
                    </label>
                    <input
                      id="modal-color-variant-input"
                      type="text"
                      placeholder="e.g. Matte Black / Amber / Custom Logo"
                      value={formData.colorVariant || ''}
                      onChange={(e) => setFormData({ ...formData, colorVariant: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Tile */}
              <div className="sm:col-span-1 flex flex-col">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Product Image
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer rounded-lg p-2 h-28 transition-colors relative overflow-hidden group shadow-xs"
                >
                  <input 
                    id="modal-image-file-input"
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                  {isCompressingImage ? (
                    <div className="text-center text-indigo-600 flex flex-col items-center justify-center">
                      <RefreshCw className="w-5 h-5 mb-1 animate-spin" />
                      <span className="text-[10px] font-medium">Compressing...</span>
                    </div>
                  ) : formData.imageUrl ? (
                    <>
                      <img
                        src={formData.imageUrl}
                        alt="Product Preview"
                        className="w-full h-full object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <RefreshCw className="w-4 h-4 text-white mb-1" />
                        <span className="text-[10px] text-white font-semibold">Change Photo</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, imageUrl: '' });
                          }}
                          className="mt-1 text-[9px] text-rose-300 hover:text-rose-100 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-400 flex flex-col items-center justify-center group-hover:text-indigo-600 transition-colors">
                      <ImageIcon className="w-6 h-6 mb-1 text-slate-400 group-hover:text-indigo-600" />
                      <span className="text-[11px] font-medium text-slate-600 group-hover:text-indigo-600">Upload Photo</span>
                      <span className="text-[9px] text-slate-400">Click or drag</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Standard Specs: Packaging Type, HS Code, Unit Weight */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Packaging Method
                </label>
                <input
                  id="modal-packaging-type-input"
                  type="text"
                  list="packaging-type-list"
                  placeholder="e.g. Individual Color Box + Master Carton"
                  value={formData.packagingType || ''}
                  onChange={(e) => setFormData({ ...formData, packagingType: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
                <datalist id="packaging-type-list">
                  <option value="Individual Color Box + Master Carton" />
                  <option value="Brown Mailer Box (E-Commerce Ready)" />
                  <option value="Custom Gift Box + EVA Foam Insert" />
                  <option value="OPP Bag + Header Card" />
                  <option value="Blister Pack + Backing Card" />
                  <option value="Polybag + 5-Ply Master Carton" />
                  <option value="Bulk Packed with Cardboard Dividers" />
                  <option value="White Box + Bubble Wrap" />
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Customs HS Code
                </label>
                <input
                  id="modal-hs-code-input"
                  type="text"
                  placeholder="e.g. 7013.37.0000"
                  value={formData.hsCode || ''}
                  onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Unit Weight (g / piece)
                </label>
                <div className="relative">
                  <input
                    id="modal-unit-weight-input"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 250 or 0.5"
                    value={formData.unitWeightG ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unitWeightG: e.target.value === '' ? undefined : e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs pr-7"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs font-medium">g</span>
                </div>
              </div>
            </div>

            {/* Order Quantity & Sourcing Requirements Sub-Card */}
            <div className="bg-white border-2 border-indigo-100 rounded-lg p-3.5 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Quantity Needed & Sourcing Requirements
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-medium">Presets:</span>
                  {[100, 500, 1000, 2500, 5000, 10000, 20000].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setFormData({ ...formData, quantity: qty })}
                      className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition ${
                        formData.quantity === qty
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {qty >= 1000 ? `${qty / 1000}k` : qty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* 1. Quantity Needed */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <span>Quantity Needed</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Target order volume</span>
                  </div>
                  <div className="flex rounded-md shadow-xs">
                    <input
                      id="modal-quantity-needed-input"
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="e.g. 1000"
                      value={formData.quantity || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantity: e.target.value !== '' ? e.target.value as any : 1,
                        })
                      }
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-l text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                    <select
                      id="modal-quantity-unit-select"
                      value={formData.quantityUnit || 'pcs'}
                      onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                      className="px-2 py-1.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="pcs">pcs (Pieces)</option>
                      <option value="sets">sets (Sets)</option>
                      <option value="pairs">pairs (Pairs)</option>
                      <option value="packs">packs (Packs)</option>
                      <option value="rolls">rolls (Rolls)</option>
                      <option value="boxes">boxes (Boxes)</option>
                      <option value="ctns">ctns (Cartons)</option>
                      <option value="meters">meters (m)</option>
                      <option value="kg">kg (Kilograms)</option>
                      <option value="units">units (Units)</option>
                    </select>
                  </div>
                </div>

                {/* 2. Supplier MOQ */}
                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Supplier MOQ
                    </label>
                    <span className="text-[9px] text-slate-400">Min. batch</span>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-moq-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 500"
                      value={formData.moq ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          moq: e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 pr-9"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-medium">
                      {formData.quantityUnit || 'pcs'}
                    </span>
                  </div>
                </div>

                {/* 3. Sample Quantity Needed */}
                <div className="sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Sample Units
                    </label>
                    <span className="text-[9px] text-slate-400">Pre-prod sample</span>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-sample-quantity-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 2"
                      value={formData.sampleQuantity ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sampleQuantity:
                            e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 pr-9"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-medium">
                      {formData.quantityUnit || 'pcs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Target Price, Tolerance %, Annual Volume, Lead Time */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                {/* Target Budget / Unit Price */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                      <span>Client Target Price</span>
                    </label>
                    <div className="inline-flex rounded bg-slate-200 p-0.5 text-[9px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetPriceCurrency('USD');
                          if (formData.targetPriceUsd !== undefined) {
                            setTargetPriceRaw(String(formData.targetPriceUsd));
                          } else if (formData.targetPriceRmb !== undefined) {
                            const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
                            setTargetPriceRaw(String(Number((formData.targetPriceRmb / rate).toFixed(6))));
                          } else {
                            setTargetPriceRaw('');
                          }
                        }}
                        className={`px-1.5 py-0.2 rounded transition ${
                          targetPriceCurrency === 'USD'
                            ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        $ USD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetPriceCurrency('RMB');
                          if (formData.targetPriceRmb !== undefined) {
                            setTargetPriceRaw(String(formData.targetPriceRmb));
                          } else if (formData.targetPriceUsd !== undefined) {
                            const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
                            setTargetPriceRaw(String(Number((formData.targetPriceUsd * rate).toFixed(6))));
                          } else {
                            setTargetPriceRaw('');
                          }
                        }}
                        className={`px-1.5 py-0.2 rounded transition ${
                          targetPriceCurrency === 'RMB'
                            ? 'bg-white text-emerald-600 shadow-2xs font-bold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        ¥ RMB
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[11px] text-slate-400 font-bold">
                      {targetPriceCurrency === 'USD' ? '$' : '¥'}
                    </span>
                    <input
                      id="modal-target-price-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={targetPriceCurrency === 'USD' ? 'e.g. 0.0495' : 'e.g. 0.358'}
                      value={
                        targetPriceRaw !== null
                          ? targetPriceRaw
                          : targetPriceCurrency === 'USD'
                          ? formData.targetPriceUsd ?? ''
                          : formData.targetPriceRmb ?? ''
                      }
                      onChange={(e) => handleTargetPriceChange(e.target.value, targetPriceCurrency)}
                      className="w-full pl-6 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-mono font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                    {targetPriceCurrency === 'USD' ? (
                      formData.targetPriceUsd ? (
                        <span>≈ {formatUnitPrice(formData.targetPriceUsd * exchangeRates.USD_TO_RMB, 'RMB')}</span>
                      ) : (
                        <span>Budget per unit ($ USD)</span>
                      )
                    ) : formData.targetPriceRmb ? (
                      <span>≈ {formatUnitPrice(formData.targetPriceRmb / exchangeRates.USD_TO_RMB, 'USD')}</span>
                    ) : (
                      <span>Budget per unit (¥ RMB)</span>
                    )}
                  </div>
                </div>

                {/* Production Quantity Tolerance (+/- %) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Quantity Tolerance
                    </label>
                    <span className="text-[9px] text-slate-400">Over/under run</span>
                  </div>
                  <select
                    id="modal-quantity-tolerance-select"
                    value={formData.quantityTolerancePercent ?? 5}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantityTolerancePercent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="0">±0% (Exact Count Only)</option>
                    <option value="3">±3% Standard Factory</option>
                    <option value="5">±5% Standard Manufacturing</option>
                    <option value="10">±10% High-Volume Bulk</option>
                  </select>
                </div>

                {/* Annual / Re-order Volume */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Est. Annual Volume
                    </label>
                    <span className="text-[9px] text-slate-400">Negotiation</span>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-annual-quantity-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 20000"
                      value={formData.annualEstimatedQuantity ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          annualEstimatedQuantity:
                            e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-2 top-1.5 text-[9px] text-slate-400 font-medium">
                      /year
                    </span>
                  </div>
                </div>

                {/* Requested Production Lead Time */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">
                      Lead Time Needed
                    </label>
                    <span className="text-[9px] text-slate-400">Production</span>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-lead-time-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 25"
                      value={formData.deliveryLeadTimeDays ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryLeadTimeDays:
                            e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 pr-10"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-medium">
                      days
                    </span>
                  </div>
                </div>
              </div>

              {/* Smart Quantity Status Badges & Analysis */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* MOQ status */}
                {formData.moq ? (
                  formData.quantity >= formData.moq ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Meets Supplier MOQ ({Number(formData.quantity || 0).toLocaleString()} ≥ {Number(formData.moq || 0).toLocaleString()} {formData.quantityUnit || 'pcs'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Below MOQ: {(Number(formData.moq || 0) - Number(formData.quantity || 0)).toLocaleString()} {formData.quantityUnit || 'pcs'} deficit (May require MOQ surcharge)
                    </span>
                  )
                ) : null}

                {/* Target price comparison */}
                {formData.targetPriceUsd && pricing.clientUnitPriceUsd > 0 && (
                  pricing.clientUnitPriceUsd <= formData.targetPriceUsd ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      <Target className="w-3 h-3 text-emerald-600" />
                      Target Met! (${pricing.clientUnitPriceUsd.toFixed(2)} ≤ ${formData.targetPriceUsd.toFixed(2)} target budget)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      <Target className="w-3 h-3 text-rose-600" />
                      +${(pricing.clientUnitPriceUsd - formData.targetPriceUsd).toFixed(2)} over client target budget
                    </span>
                  )
                )}

                {/* Quantity Tolerance acceptable range */}
                {formData.quantityTolerancePercent && formData.quantityTolerancePercent > 0 && formData.quantity > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    <span>Tolerance (±{formData.quantityTolerancePercent}%):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {Math.round(Number(formData.quantity || 0) * (1 - formData.quantityTolerancePercent / 100)).toLocaleString()} – {Math.round(Number(formData.quantity || 0) * (1 + formData.quantityTolerancePercent / 100)).toLocaleString()} {formData.quantityUnit || 'pcs'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Master Carton & Box Dimensions Sub-Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Master Carton / Box Dimensions & Logistics</span>
                </div>
                {packagingMetrics.totalCartons > 0 && (
                  <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                    {packagingMetrics.totalCartons} Master Cartons
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {/* Length */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Length (L)
                  </label>
                  <div className="relative">
                    <input
                      id="modal-box-length-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 50"
                      value={formData.boxLengthCm ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          boxLengthCm: e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 pr-7"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-medium">cm</span>
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Width (W)
                  </label>
                  <div className="relative">
                    <input
                      id="modal-box-width-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 40"
                      value={formData.boxWidthCm ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          boxWidthCm: e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 pr-7"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-medium">cm</span>
                  </div>
                </div>

                {/* Height */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Height (H)
                  </label>
                  <div className="relative">
                    <input
                      id="modal-box-height-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 30"
                      value={formData.boxHeightCm ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          boxHeightCm: e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 pr-7"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-medium">cm</span>
                  </div>
                </div>

                {/* Pcs per Box */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Pcs / Carton (Box)
                  </label>
                  <div className="relative">
                    <input
                      id="modal-pcs-per-box-input"
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 50"
                      value={formData.pcsPerBox ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pcsPerBox: e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 pr-7"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-medium">pcs</span>
                  </div>
                </div>

                {/* Gross Weight per Box */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    GW / Carton (kg)
                  </label>
                  <div className="relative">
                    <input
                      id="modal-gross-weight-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 15.0"
                      value={formData.grossWeightKg ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          grossWeightKg: e.target.value === '' ? undefined : e.target.value as any,
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 pr-7"
                    />
                    <span className="absolute right-2 top-1 text-[10px] text-slate-400 font-medium">kg</span>
                  </div>
                </div>
              </div>

              {/* Calculated CBM & Logistics Banner */}
              {(packagingMetrics.cbmPerCarton > 0 || packagingMetrics.totalCartons > 0 || formData.boxLengthCm) && (
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Per Box CBM</div>
                    <div className="font-bold font-mono text-slate-800 text-[11px] mt-0.5">
                      {packagingMetrics.cbmPerCarton > 0 ? `${packagingMetrics.cbmPerCarton} m³` : '-'}
                    </div>
                  </div>

                  <div className="p-1.5 bg-indigo-50/60 rounded border border-indigo-100">
                    <div className="text-[9px] font-bold text-indigo-700 uppercase">Total Volume (CBM)</div>
                    <div className="font-bold font-mono text-indigo-900 text-[11px] mt-0.5">
                      {packagingMetrics.totalCbm > 0 ? `${packagingMetrics.totalCbm} CBM` : '-'}
                    </div>
                  </div>

                  <div className="p-1.5 bg-slate-50 rounded border border-slate-200">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">Master Cartons</div>
                    <div className="font-bold font-mono text-slate-800 text-[11px] mt-0.5">
                      {packagingMetrics.totalCartons > 0 ? `${packagingMetrics.totalCartons} Cartons` : '1 Box / Custom'}
                    </div>
                  </div>

                  <div className="p-1.5 bg-emerald-50/60 rounded border border-emerald-100">
                    <div className="text-[9px] font-bold text-emerald-700 uppercase">Total Est. Weight</div>
                    <div className="font-bold font-mono text-emerald-900 text-[11px] mt-0.5">
                      {packagingMetrics.totalGrossWeightKg > 0 ? `${packagingMetrics.totalGrossWeightKg} kg GW` : '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Supplier Quotes (Multiple Chinese B2B Platforms) */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Chinese B2B Supplier Quotations</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    1688, Made-in-China, Yiwugo, Alibaba, Taobao, Global Sources & Direct Factory links
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    quotes: [...(prev.quotes || []), { id: 'quote_' + Date.now(), supplierName: '', productUrl1688: '', price1688Rmb: 0, domesticShippingRmb: 0 }],
                    selectedQuoteId: prev.quotes?.length ? prev.selectedQuoteId : ('quote_' + Date.now())
                  }))}
                  className="flex items-center gap-1 text-[10px] bg-white border border-slate-300 px-2.5 py-1 rounded text-slate-700 hover:bg-slate-50 font-medium shadow-xs transition self-start sm:self-auto"
                >
                  <Plus className="w-3 h-3 text-indigo-600" />
                  <span>Add Another Quote</span>
                </button>
             </div>

             <div className="space-y-3">
               {formData.quotes?.map((quote, idx) => {
                 const detectedPlat = detectB2BPlatform(quote.productUrl1688);
                 return (
                 <div key={quote.id} className={`border rounded-lg p-3 relative transition ${formData.selectedQuoteId === quote.id ? 'border-indigo-500 bg-indigo-50/40 shadow-sm' : 'border-slate-200 bg-white'}`}>
                   {/* Remove button */}
                   {formData.quotes!.length > 1 && (
                     <button
                       type="button"
                       onClick={() => {
                         const newQuotes = formData.quotes!.filter(q => q.id !== quote.id);
                         setFormData(prev => ({ ...prev, quotes: newQuotes, selectedQuoteId: prev.selectedQuoteId === quote.id ? newQuotes[0].id : prev.selectedQuoteId }));
                       }}
                       className="absolute top-2 right-2 p-1 text-slate-400 hover:text-rose-500 transition"
                       title="Remove this supplier quote"
                     >
                       <Trash2 className="w-3.5 h-3.5" />
                     </button>
                   )}

                   <div className="flex items-center gap-2 mb-2.5 pr-8">
                     <input
                       type="radio"
                       id={`quote-radio-${quote.id}`}
                       name="selectedQuote"
                       checked={formData.selectedQuoteId === quote.id}
                       onChange={() => setFormData(prev => ({ ...prev, selectedQuoteId: quote.id }))}
                       className="w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                     />
                     <label htmlFor={`quote-radio-${quote.id}`} className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                       Quote #{idx + 1}
                       {formData.selectedQuoteId === quote.id && <span className="text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold">Winning Option</span>}
                     </label>
                   </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            B2B Sourcing / Product Link
                          </label>
                          {quote.productUrl1688 && (
                            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${detectedPlat.badgeBg} ${detectedPlat.badgeText} ${detectedPlat.badgeBorder}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${detectedPlat.dotColor}`} />
                              {detectedPlat.shortName}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            id={`quote-url-input-${idx}`}
                            type="url"
                            placeholder="e.g. 1688.com, made-in-china.com, yiwugo.com, alibaba.com URL..."
                            value={quote.productUrl1688}
                            onChange={e => {
                               const newQuotes = [...formData.quotes!];
                               newQuotes[idx].productUrl1688 = e.target.value;
                               setFormData(prev => ({...prev, quotes: newQuotes}));
                            }}
                            className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                          />
                          {quote.productUrl1688 ? (
                            <a
                              href={quote.productUrl1688.startsWith('http') ? quote.productUrl1688 : `https://${quote.productUrl1688}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded flex items-center justify-center transition shadow-2xs group shrink-0"
                              title={`Open ${detectedPlat.shortName} link in new tab`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-2 py-1 bg-slate-100 text-slate-300 border border-slate-200 rounded flex items-center justify-center cursor-not-allowed shrink-0"
                              title="Enter URL to open link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 text-[9px] text-slate-400">
                          <span>Supports:</span>
                          <span className="text-slate-500 font-medium">1688</span> •
                          <span className="text-slate-500 font-medium">Made-in-China</span> •
                          <span className="text-slate-500 font-medium">Yiwugo</span> •
                          <span className="text-slate-500 font-medium">Alibaba</span> •
                          <span className="text-slate-500 font-medium">Taobao</span> •
                          <span className="text-slate-500 font-medium">Direct Factory</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Supplier / Factory Name
                        </label>
                        <input
                          id={`quote-supplier-input-${idx}`}
                          type="text"
                          placeholder="e.g. Chaozhou Jinghua Porcelain Factory"
                          value={quote.supplierName}
                          onChange={e => {
                              const newQuotes = [...formData.quotes!];
                              newQuotes[idx].supplierName = e.target.value;
                              setFormData(prev => ({...prev, quotes: newQuotes}));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        {(() => {
                          const pCurr = getQuotePriceCurrency(quote.id);
                          const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
                          const pRmb = Number(quote.price1688Rmb) || 0;
                          const usdEquivalent = pRmb / rate;
                          const rawPrice = quoteInputsRaw[quote.id]?.price;
                          let displayPrice: string;
                          if (rawPrice !== undefined) {
                            displayPrice = rawPrice;
                          } else if (pCurr === 'USD') {
                            displayPrice = pRmb > 0 ? String(Math.round(usdEquivalent * 1000000) / 1000000) : '';
                          } else {
                            displayPrice = pRmb > 0 ? String(pRmb) : '';
                          }

                          return (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                  <span>Unit Price</span>
                                </label>
                                <div className="inline-flex rounded bg-slate-200 p-0.5 text-[9px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setQuotePriceCurrency(quote.id, 'RMB')}
                                    className={`px-1.5 py-0.2 rounded transition ${
                                      pCurr === 'RMB'
                                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Input in Chinese Yuan (¥ RMB)"
                                  >
                                    ¥ RMB
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuotePriceCurrency(quote.id, 'USD')}
                                    className={`px-1.5 py-0.2 rounded transition ${
                                      pCurr === 'USD'
                                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Input in US Dollars ($ USD)"
                                  >
                                    $ USD
                                  </button>
                                </div>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1 text-slate-400 text-xs font-bold">
                                  {pCurr === 'RMB' ? '¥' : '$'}
                                </span>
                                <input
                                  id={`quote-price-input-${idx}`}
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  placeholder={pCurr === 'USD' ? '0.0490' : '0.3500'}
                                  value={displayPrice}
                                  onChange={(e) => handleQuotePriceChange(idx, e.target.value, pCurr)}
                                  className="w-full pl-5 pr-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="text-[9px] font-mono mt-0.5 text-slate-500">
                                {pCurr === 'RMB' ? (
                                  pRmb > 0 ? (
                                    <span className="text-emerald-700 font-semibold">
                                      ≈ {formatUnitPrice(usdEquivalent, 'USD')}
                                    </span>
                                  ) : (
                                    <span>Enter in ¥ RMB</span>
                                  )
                                ) : pRmb > 0 ? (
                                  <span className="text-emerald-700 font-semibold">
                                    ≈ {formatUnitPrice(pRmb, 'RMB')}
                                  </span>
                                ) : (
                                  <span>Enter in $ USD</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        {(() => {
                          const sCurr = getQuoteShippingCurrency(quote.id);
                          const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
                          const sRmb = Number(quote.domesticShippingRmb) || 0;
                          const usdEquivalent = sRmb / rate;
                          const rawShipping = quoteInputsRaw[quote.id]?.shipping;
                          let displayShipping: string;
                          if (rawShipping !== undefined) {
                            displayShipping = rawShipping;
                          } else if (sCurr === 'USD') {
                            displayShipping = sRmb > 0 ? String(Math.round(usdEquivalent * 1000000) / 1000000) : '';
                          } else {
                            displayShipping = sRmb > 0 ? String(sRmb) : '';
                          }

                          return (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                                  <span>Domestic Freight</span>
                                </label>
                                <div className="inline-flex rounded bg-slate-200 p-0.5 text-[9px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => setQuoteShippingCurrency(quote.id, 'RMB')}
                                    className={`px-1.5 py-0.2 rounded transition ${
                                      sCurr === 'RMB'
                                        ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Input in Chinese Yuan (¥ RMB)"
                                  >
                                    ¥ RMB
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setQuoteShippingCurrency(quote.id, 'USD')}
                                    className={`px-1.5 py-0.2 rounded transition ${
                                      sCurr === 'USD'
                                        ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                                        : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                    title="Input in US Dollars ($ USD)"
                                  >
                                    $ USD
                                  </button>
                                </div>
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1 text-slate-400 text-xs font-bold">
                                  {sCurr === 'RMB' ? '¥' : '$'}
                                </span>
                                <input
                                  id={`quote-shipping-input-${idx}`}
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  placeholder="0.00"
                                  value={displayShipping}
                                  onChange={(e) => handleQuoteShippingChange(idx, e.target.value, sCurr)}
                                  className="w-full pl-5 pr-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="text-[9px] font-mono mt-0.5 text-slate-500">
                                {sCurr === 'RMB' ? (
                                  sRmb > 0 ? (
                                    <span>≈ {formatUnitPrice(usdEquivalent, 'USD')}</span>
                                  ) : (
                                    <span>Enter in ¥ RMB</span>
                                  )
                                ) : sRmb > 0 ? (
                                  <span>≈ {formatUnitPrice(sRmb, 'RMB')}</span>
                                ) : (
                                  <span>Enter in $ USD</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">WeChat ID</label>
                        <input
                          id={`quote-wechat-input-${idx}`}
                          type="text"
                          placeholder="e.g. wx_supplier123"
                          value={quote.wechatId || ''}
                          onChange={e => {
                             const newQuotes = [...formData.quotes!];
                             newQuotes[idx].wechatId = e.target.value;
                             setFormData(prev => ({...prev, quotes: newQuotes}));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-1">WhatsApp</label>
                        <input
                          id={`quote-whatsapp-input-${idx}`}
                          type="text"
                          placeholder="e.g. +86..."
                          value={quote.whatsapp || ''}
                          onChange={e => {
                             const newQuotes = [...formData.quotes!];
                             newQuotes[idx].whatsapp = e.target.value;
                             setFormData(prev => ({...prev, quotes: newQuotes}));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                   </div>
                 </div>
               );
             })}
             </div>
          </div>

          {/* Section 4: Costing & Margin Engine */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quantity & Margin Engine</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  1 USD = ¥{exchangeRates.USD_TO_RMB.toFixed(2)} RMB
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-slate-600">
                    Order Quantity ({formData.quantityUnit || 'pcs'})
                  </label>
                  {formData.moq && (
                    <span className="text-[10px] text-slate-400">
                      MOQ: {Number(formData.moq || 0).toLocaleString()} {formData.quantityUnit || 'pcs'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="modal-quantity-input"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.quantity || ''}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 shadow-xs pr-12"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-medium">
                    {formData.quantityUnit || 'pcs'}
                  </span>
                </div>
              </div>

              {/* Agent Margin Mode & Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[11px] font-bold text-green-600">
                      Agent Profit & Margin
                    </label>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      marginMode === 'deal_usd' || marginMode === 'deal_rmb'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-green-100 text-green-800 border border-green-300'
                    }`}>
                      {marginMode === 'deal_usd' || marginMode === 'deal_rmb' ? '★ Whole Deal Profit' : 'Per-Piece Margin'}
                    </span>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="inline-flex rounded bg-slate-200 p-0.5 text-[9px] font-bold">
                    <button
                      id="modal-margin-mode-percent"
                      type="button"
                      onClick={() => handleMarginModeSwitch('percent')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        marginMode === 'percent'
                          ? 'bg-white text-green-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Percentage markup on supplier unit cost"
                    >
                      % Margin
                    </button>
                    <button
                      id="modal-margin-mode-fixed-usd"
                      type="button"
                      onClick={() => handleMarginModeSwitch('fixed_usd')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        marginMode === 'fixed_usd'
                          ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Add fixed USD profit per piece (e.g. $0.005/pc)"
                    >
                      $ / pc
                    </button>
                    <button
                      id="modal-margin-mode-fixed-rmb"
                      type="button"
                      onClick={() => handleMarginModeSwitch('fixed_rmb')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        marginMode === 'fixed_rmb'
                          ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Add fixed RMB profit per piece (e.g. ¥0.05/pc)"
                    >
                      ¥ / pc
                    </button>
                    <button
                      id="modal-margin-mode-deal-usd"
                      type="button"
                      onClick={() => handleMarginModeSwitch('deal_usd')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        marginMode === 'deal_usd'
                          ? 'bg-white text-amber-800 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Total lump sum profit on the entire deal in USD (e.g. $500 or $0.005)"
                    >
                      $ Whole Deal
                    </button>
                    <button
                      id="modal-margin-mode-deal-rmb"
                      type="button"
                      onClick={() => handleMarginModeSwitch('deal_rmb')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        marginMode === 'deal_rmb'
                          ? 'bg-white text-orange-800 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Total lump sum profit on the entire deal in RMB (e.g. ¥3500)"
                    >
                      ¥ Whole Deal
                    </button>
                  </div>
                </div>

                {/* Input Fields by Mode */}
                {marginMode === 'percent' && (
                  <div className="relative">
                    <input
                      id="modal-margin-percent-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 20, 2.5, or 0.005"
                      required
                      value={marginInputRaw}
                      onChange={(e) => handleMarginInputChange(e.target.value)}
                      className="w-full pr-7 pl-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-green-700 font-bold focus:outline-none focus:border-green-500 shadow-xs"
                    />
                    <span className="absolute right-2.5 top-1.5 text-slate-400 text-xs font-bold">%</span>
                  </div>
                )}

                {marginMode === 'fixed_usd' && (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">$</span>
                    <input
                      id="modal-margin-usd-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 0.005 or 1.50"
                      value={marginInputRaw}
                      onChange={(e) => handleMarginInputChange(e.target.value)}
                      className="w-full pl-6 pr-14 py-1.5 bg-white border border-slate-300 rounded text-xs text-indigo-700 font-bold focus:outline-none focus:border-indigo-500 shadow-xs"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">
                      / pc ($)
                    </span>
                  </div>
                )}

                {marginMode === 'fixed_rmb' && (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">¥</span>
                    <input
                      id="modal-margin-rmb-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 0.005 or 0.50"
                      value={marginInputRaw}
                      onChange={(e) => handleMarginInputChange(e.target.value)}
                      className="w-full pl-6 pr-14 py-1.5 bg-white border border-slate-300 rounded text-xs text-emerald-700 font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">
                      / pc (¥)
                    </span>
                  </div>
                )}

                {marginMode === 'deal_usd' && (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">$</span>
                    <input
                      id="modal-margin-deal-usd-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 500 or 0.005"
                      value={marginInputRaw}
                      onChange={(e) => handleMarginInputChange(e.target.value)}
                      className="w-full pl-6 pr-24 py-1.5 bg-white border border-amber-300 rounded text-xs text-amber-800 font-bold focus:outline-none focus:border-amber-500 shadow-xs ring-1 ring-amber-100"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-amber-700 font-bold tracking-tight">
                      Whole Deal ($)
                    </span>
                  </div>
                )}

                {marginMode === 'deal_rmb' && (
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs font-bold">¥</span>
                    <input
                      id="modal-margin-deal-rmb-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="e.g. 3500 or 50"
                      value={marginInputRaw}
                      onChange={(e) => handleMarginInputChange(e.target.value)}
                      className="w-full pl-6 pr-24 py-1.5 bg-white border border-orange-300 rounded text-xs text-orange-800 font-bold focus:outline-none focus:border-orange-500 shadow-xs ring-1 ring-orange-100"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-orange-700 font-bold tracking-tight">
                      Whole Deal (¥)
                    </span>
                  </div>
                )}

                {/* Helper info line explaining profit calculation */}
                <div className="mt-1 text-[10px] text-slate-500 font-mono">
                  {marginMode === 'deal_usd' && (
                    <span className="text-amber-800">
                      Total Deal Profit: +{formatCurrency(pricing.estimatedProfitUsd, 'USD')} (+¥{formatCurrency(pricing.estimatedProfitRmb, 'RMB')}) ➔ <strong>+{formatUnitPrice(pricing.profitPerUnitUsd, 'USD')}/pc</strong> across {(Number(formData.quantity) || 1).toLocaleString()} pcs
                    </span>
                  )}
                  {marginMode === 'deal_rmb' && (
                    <span className="text-orange-800">
                      Total Deal Profit: +¥{formatCurrency(pricing.estimatedProfitRmb, 'RMB')} (+{formatCurrency(pricing.estimatedProfitUsd, 'USD')}) ➔ <strong>+{formatUnitPrice(pricing.profitPerUnitUsd, 'USD')}/pc</strong> (¥{formatUnitPrice(pricing.profitPerUnitRmb, 'RMB')})
                    </span>
                  )}
                  {marginMode === 'fixed_usd' && (
                    <span className="text-indigo-700">
                      Unit Margin: +{formatUnitPrice(pricing.profitPerUnitUsd, 'USD')}/pc (¥{formatUnitPrice(pricing.profitPerUnitRmb, 'RMB')}) ➔ Total Deal Profit: <strong>+{formatCurrency(pricing.estimatedProfitUsd, 'USD')}</strong>
                    </span>
                  )}
                  {marginMode === 'fixed_rmb' && (
                    <span className="text-emerald-700">
                      Unit Margin: +¥{formatUnitPrice(pricing.profitPerUnitRmb, 'RMB')}/pc ({formatUnitPrice(pricing.profitPerUnitUsd, 'USD')}) ➔ Total Deal Profit: <strong>+{formatCurrency(pricing.estimatedProfitUsd, 'USD')}</strong>
                    </span>
                  )}
                  {marginMode === 'percent' && (
                    <span className="text-green-700">
                      +{formData.marginPercent || 0}% Markup ➔ +{formatUnitPrice(pricing.profitPerUnitUsd, 'USD')}/pc ➔ Total Deal Profit: <strong>+{formatCurrency(pricing.estimatedProfitUsd, 'USD')}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Margin Preset Buttons */}
            <div className="flex items-center space-x-1.5 pt-0.5 flex-wrap gap-y-1">
              <span className="text-[11px] text-slate-500 font-medium">Presets:</span>
              {marginMode === 'percent' &&
                [5, 10, 15, 20, 25, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyMarginPreset(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      Number(formData.marginPercent) === pct
                        ? 'bg-green-600 text-white font-bold'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              {marginMode === 'fixed_usd' &&
                [0.005, 0.01, 0.05, 0.20, 0.5, 1.0, 2.0].map((usd) => (
                  <button
                    key={usd}
                    type="button"
                    onClick={() => applyMarginPreset(usd)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      Number(formData.marginFixedUsd) === usd
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    +${usd < 0.01 ? usd : usd.toFixed(usd < 1 ? 2 : 2)}/pc
                  </button>
                ))}
              {marginMode === 'fixed_rmb' &&
                [0.01, 0.05, 0.1, 0.5, 1, 2, 5].map((rmb) => (
                  <button
                    key={rmb}
                    type="button"
                    onClick={() => applyMarginPreset(rmb)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      fixedMarginRmb === rmb
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    +¥{rmb}/pc
                  </button>
                ))}
              {marginMode === 'deal_usd' &&
                [0.005, 50, 100, 250, 500, 1000, 2500, 5000].map((deal) => (
                  <button
                    key={deal}
                    type="button"
                    onClick={() => applyMarginPreset(deal)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      Number(formData.marginDealTotal) === deal
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    +${deal < 0.01 ? deal : deal.toLocaleString()}
                  </button>
                ))}
              {marginMode === 'deal_rmb' &&
                [50, 200, 500, 1000, 2000, 3500, 5000, 10000].map((deal) => (
                  <button
                    key={deal}
                    type="button"
                    onClick={() => applyMarginPreset(deal)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      Number(formData.marginDealTotal) === deal
                        ? 'bg-orange-600 text-white font-bold'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    +¥{deal.toLocaleString()}
                  </button>
                ))}
            </div>

            {/* Live Quotation Breakdown Card (Dual USD & RMB) */}
            <div className="bg-white border border-slate-200 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center shadow-xs">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  Sourcing Cost / Unit
                </div>
                <div className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                  {formatUnitPrice(pricing.unitCostUsd, 'USD')}
                  <span className="text-[10px] text-emerald-700 block font-semibold">
                    (¥{formatUnitPrice(pricing.unitCostRmb, 'RMB')})
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-indigo-600 uppercase tracking-wider font-bold">
                  Client Unit Price
                </div>
                <div className="text-sm font-bold text-indigo-700 mt-0.5 font-mono">
                  {formatUnitPrice(pricing.clientUnitPriceUsd, 'USD')}
                  <span className="text-[10px] text-indigo-600 block font-semibold">
                    (¥{formatUnitPrice(pricing.clientUnitPriceRmb, 'RMB')})
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-700 uppercase tracking-wider font-bold">
                  Total Client Quote
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                  {formatCurrency(pricing.totalQuotationUsd, 'USD')}
                  <span className="text-[10px] text-slate-600 block font-semibold">
                    (¥{formatCurrency(pricing.totalQuotationRmb, 'RMB')})
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-green-600 uppercase tracking-wider font-bold">
                  {marginMode === 'deal_usd' || marginMode === 'deal_rmb' ? 'Whole Deal Profit' : 'Gross Margin'}
                </div>
                <div className="text-sm font-bold text-green-600 mt-0.5 font-mono">
                  +{formatCurrency(pricing.estimatedProfitUsd, 'USD')}
                  <span className="text-[10px] text-green-700 block font-semibold">
                    (+¥{formatCurrency(pricing.estimatedProfitRmb, 'RMB')}) • +{formatUnitPrice(pricing.profitPerUnitUsd, 'USD')}/pc
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Collaborator & Helper Commissions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Collaborator & Helper Commissions</span>
                </h3>
                {formData.helperCommissions && formData.helperCommissions.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    {formData.helperCommissions.length} {formData.helperCommissions.length === 1 ? 'Person' : 'People'} • {formatCurrency(totalHelperCommission, 'USD')} (¥{formatCurrency(totalHelperCommission * exchangeRates.USD_TO_RMB, 'RMB')})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Optional - Pay assistants, QC inspectors, finders)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAddHelper}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded transition flex items-center gap-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Helper Commission</span>
              </button>
            </div>

            {formData.helperCommissions && formData.helperCommissions.length > 0 ? (
              <div className="space-y-2.5">
                {formData.helperCommissions.map((helper, idx) => {
                  const helperPayout = calculateHelperCommissionAmount(
                    helper,
                    pricing.estimatedProfitUsd,
                    Number(formData.quantity) || 1,
                    exchangeRates.USD_TO_RMB
                  );

                  return (
                    <div
                      key={helper.id || idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2.5 transition hover:border-slate-300"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center border border-indigo-100">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="Helper Name (e.g. Li Wei, Sarah)"
                            value={helper.name}
                            onChange={(e) => handleUpdateHelper(idx, { name: e.target.value })}
                            className="font-semibold text-xs text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 flex-1 min-w-[140px]"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Estimated Payout</span>
                            <span className="text-xs font-bold font-mono text-emerald-700">
                              {formatCurrency(helperPayout, 'USD')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              (¥{formatCurrency(helperPayout * exchangeRates.USD_TO_RMB, 'RMB')})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveHelper(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Remove this helper"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Role */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Role / Task
                          </label>
                          <div className="relative">
                            <select
                              value={helper.role || 'Sourcing Assistant'}
                              onChange={(e) => handleUpdateHelper(idx, { role: e.target.value })}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 appearance-none pr-6 focus:outline-none focus:border-indigo-500 font-medium"
                            >
                              {HELPER_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Commission Structure Type */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Commission Structure
                          </label>
                          <div className="relative">
                            <select
                              value={helper.type}
                              onChange={(e) =>
                                handleUpdateHelper(idx, {
                                  type: e.target.value as HelperCommissionType,
                                })
                              }
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 appearance-none pr-6 focus:outline-none focus:border-indigo-500 font-medium"
                            >
                              <option value="percentage_profit">% of Sourcing Margin</option>
                              <option value="fixed_total">Fixed Total Amount</option>
                              <option value="fixed_per_unit">Fixed Amount per Piece</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* Commission Value & Currency */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              {helper.type === 'percentage_profit'
                                ? 'Rate (%)'
                                : helper.type === 'fixed_per_unit'
                                ? 'Per Piece'
                                : 'Total Fixed'}
                            </label>
                            {helper.type !== 'percentage_profit' && (
                              <div className="inline-flex rounded bg-slate-200 p-0.5 text-[8px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateHelper(idx, { currency: 'USD' })}
                                  className={`px-1 py-0.2 rounded transition ${
                                    (helper.currency || 'USD') === 'USD'
                                      ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  $ USD
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateHelper(idx, { currency: 'RMB' })}
                                  className={`px-1 py-0.2 rounded transition ${
                                    helper.currency === 'RMB'
                                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  ¥ RMB
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            {helper.type !== 'percentage_profit' && (
                              <span className="absolute left-2 top-1 text-slate-400 text-xs font-bold">
                                {helper.currency === 'RMB' ? '¥' : '$'}
                              </span>
                            )}
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder={helper.type === 'percentage_profit' ? 'e.g. 10' : '0.00'}
                              value={helper.value ?? ''}
                              onChange={(e) =>
                                handleUpdateHelper(idx, {
                                  value: e.target.value as any,
                                })
                              }
                              className={`w-full py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 ${
                                helper.type === 'percentage_profit' ? 'px-2 pr-6' : 'pl-5 pr-2'
                              }`}
                            />
                            {helper.type === 'percentage_profit' && (
                              <span className="absolute right-2 top-1 text-slate-400 text-xs">%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Optional Contact and Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                          <input
                            type="text"
                            placeholder="WeChat / WhatsApp / Email (optional)"
                            value={helper.contact || ''}
                            onChange={(e) => handleUpdateHelper(idx, { contact: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50/70 border border-slate-200 rounded text-[11px] text-slate-600 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Payout condition (e.g. Paid upon sample approval)"
                            value={helper.notes || ''}
                            onChange={(e) => handleUpdateHelper(idx, { notes: e.target.value })}
                            className="w-full px-2 py-1 bg-slate-50/70 border border-slate-200 rounded text-[11px] text-slate-600 focus:outline-none focus:border-indigo-400 placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Net Agent Take-Home Profit Breakdown */}
                <div className="bg-slate-900 text-white rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center shadow-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Gross Sourcing Margin
                    </div>
                    <div className="text-sm font-bold font-mono text-white mt-0.5">
                      +{formatCurrency(pricing.estimatedProfitUsd, 'USD')}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      (+¥{formatCurrency(pricing.estimatedProfitRmb, 'RMB')})
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                      Total Helper Payouts ({formData.helperCommissions.length})
                    </div>
                    <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                      -{formatCurrency(totalHelperCommission, 'USD')}
                    </div>
                    <div className="text-[10px] font-mono text-amber-400/80">
                      (-¥{formatCurrency(totalHelperCommission * exchangeRates.USD_TO_RMB, 'RMB')})
                    </div>
                  </div>

                  <div className="bg-slate-800/90 rounded-md p-1.5 border border-slate-700">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                      Your Net Take-Home Profit
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                      +{formatCurrency(netAgentProfit, 'USD')}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400/80">
                      (+¥{formatCurrency(netAgentProfit * exchangeRates.USD_TO_RMB, 'RMB')})
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3.5 border border-dashed border-slate-300 rounded-lg bg-white">
                <Users className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-600 font-medium">No collaborator commissions added for this inquiry</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click <span className="font-semibold text-indigo-600">+ Add Helper Commission</span> if other people helped you source, negotiate, or inspect this order.
                </p>
              </div>
            )}
          </div>

          {/* Section 6: Notes / Instructions */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Sourcing Notes & Instructions
            </label>
            <textarea
              id="modal-notes-textarea"
              rows={2}
              placeholder="e.g. Custom packaging requirements, logo placement, sample lead time, carton dimensions..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              id="modal-cancel-btn"
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              id="modal-save-inquiry-btn"
              type="submit"
              className="flex items-center space-x-1 px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{inquiryToEdit ? 'Update Inquiry' : 'Save & Sync Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

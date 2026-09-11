export type OrderStatus =
  | 'New Inquiry'
  | '1688 Sourcing'
  | 'Quoted to Client'
  | 'Sample Ordered'
  | 'Sample Approved'
  | 'Order Placed'
  | 'In Production'
  | 'QC & Inspection'
  | 'Shipped'
  | 'Completed'
  | 'Cancelled';

export type CurrencyUnit = 'USD' | 'RMB';
export type CurrencyViewMode = 'USD' | 'RMB' | 'DUAL';

export interface SupplierQuote {
  id: string;
  supplierName: string;
  productUrl1688: string;
  price1688Rmb: number;
  domesticShippingRmb: number;
  inputCurrency?: CurrencyUnit; // User input preference for this quote
  wechatId?: string;
  whatsapp?: string;
}

export type HelperCommissionType = 'percentage_profit' | 'fixed_total' | 'fixed_per_unit';

export interface HelperCommission {
  id: string;
  name: string; // e.g. "Li Wei", "Sarah (Translator)", "Alex (Finder)"
  role?: string; // e.g. "Sourcing Assistant", "Translator / Negotiator", "QC & Inspection", "Finder / Referral", "Logistics Coordinator", "Partner"
  type: HelperCommissionType; // '% of Margin/Profit', 'Fixed Total', 'Per Unit'
  currency?: CurrencyUnit; // 'USD' or 'RMB' for fixed amounts
  value: number; // e.g. 15 for 15%, 50 for $50/¥50, 0.10 for $0.10/¥0.10
  contact?: string; // WhatsApp / WeChat / Email
  notes?: string; // Optional note
}

export interface InquiryItem {
  id: string; // Unique ID (e.g. INQ-2026-001 or UUID)
  inquiryNumber: string; // e.g. INQ-1001
  date: string; // YYYY-MM-DD
  customerName: string; // Client / Company Name
  customerContact?: string; // WhatsApp / Email
  wechatId?: string; // WeChat ID
  country: string; // Country of destination
  product: string; // Product name & brief spec
  imageUrl?: string; // Product Image URL
  material?: string; // Material / Composition (e.g. Borosilicate Glass, 304 Stainless Steel)
  colorVariant?: string; // Color / Finish / Variant (e.g. Matte Black, Brushed Gold)
  packagingType?: string; // Packaging Method (e.g. Individual Color Box + Master Carton)
  hsCode?: string; // Customs HS Code (e.g. 7013.37.00)
  boxLengthCm?: number; // Carton Length in cm
  boxWidthCm?: number; // Carton Width in cm
  boxHeightCm?: number; // Carton Height in cm
  pcsPerBox?: number; // Number of pieces per master carton
  unitWeightG?: number; // Net weight of 1 unit in grams
  grossWeightKg?: number; // Gross weight per carton in kg (GW)
  netWeightKg?: number; // Net weight per carton in kg (NW)
  productUrl1688?: string; // Winning 1688 product link
  supplierName?: string; // Winning 1688 supplier name / store
  quantity: number; // Order quantity / Quantity needed
  quantityUnit?: string; // e.g. 'pcs', 'sets', 'pairs', 'packs', 'rolls', 'boxes', 'meters', 'kg'
  targetPriceUsd?: number; // Client's target budget price per unit in USD ($)
  targetPriceRmb?: number; // Client's target budget price per unit in RMB (¥)
  moq?: number; // Supplier MOQ (Minimum Order Quantity from factory)
  sampleQuantity?: number; // Sample units required for approval (e.g. 2 pcs)
  quantityTolerancePercent?: number; // Factory production quantity tolerance (e.g. ±5%)
  annualEstimatedQuantity?: number; // Client's projected annual volume / recurring reorders
  deliveryLeadTimeDays?: number; // Requested production lead time (days)
  price1688Rmb: number; // Winning 1688 Unit Price in RMB (¥)
  domesticShippingRmb?: number; // Winning 1688 Domestic shipping to warehouse (¥)
  quotes?: SupplierQuote[]; // List of all supplier quotations
  selectedQuoteId?: string; // ID of the winning quote
  marginPercent: number; // Margin % (e.g. 15, 20, 25)
  marginFixedUsd?: number; // Optional fixed margin per unit in USD ($)
  clientUnitPriceUsd: number; // Computed or manual client unit price ($)
  totalQuotationUsd: number; // Total client quotation ($)
  estimatedProfitUsd: number; // Total profit/margin for the agent ($)
  helperCommissions?: HelperCommission[]; // Commissions for people who helped with sourcing/QC/translation
  totalHelperCommissionUsd?: number; // Total payout for helpers ($)
  netAgentProfitUsd?: number; // Net profit for the agent after helper payouts ($)
  orderStatus: OrderStatus;
  notes?: string;
  updatedAt: string;
}

export interface ExchangeRates {
  USD_TO_RMB: number; // e.g. 7.25
  EUR_TO_RMB: number; // e.g. 7.85
  GBP_TO_RMB: number; // e.g. 9.15
}

export interface CloudSyncState {
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  status: 'connected' | 'syncing' | 'offline' | 'error';
  itemCount: number;
}

export interface SheetSyncState {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;
  isSheetConfigured: boolean;
}



export interface Customer {
  id: string; // Unique ID
  name: string; // Company or Contact Name
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  wechatId?: string;
  country?: string;
  type: 'Active' | 'Potential' | 'Past';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}


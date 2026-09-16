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

export type MarginMode = 'percent' | 'fixed_usd' | 'fixed_rmb' | 'deal_usd' | 'deal_rmb';

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
  marginMode?: MarginMode; // Profit mode ('percent', 'fixed_usd', 'fixed_rmb', 'deal_usd', 'deal_rmb')
  marginDealTotal?: number; // Total profit for the entire deal (in USD or RMB)
  clientUnitPriceUsd: number; // Computed or manual client unit price ($)
  totalQuotationUsd: number; // Total client quotation ($)
  estimatedProfitUsd: number; // Total profit/margin for the agent ($)
  helperCommissions?: HelperCommission[]; // Commissions for people who helped with sourcing/QC/translation
  totalHelperCommissionUsd?: number; // Total payout for helpers ($)
  netAgentProfitUsd?: number; // Net profit for the agent after helper payouts ($)
  inquiryExpenses?: InquiryExpense[]; // Itemized out-of-pocket expenses for this specific inquiry
  totalExpensesUsd?: number; // Total expenses for this inquiry in USD
  totalExpensesRmb?: number; // Total expenses for this inquiry in RMB
  netProfitAfterExpensesUsd?: number; // Net take-home profit after helper commissions & expenses ($)
  orderStatus: OrderStatus;
  notes?: string;
  updatedAt: string;
}

export type InquiryExpenseCategory =
  | 'Sample Purchase'
  | 'Sample Express / Courier'
  | 'Factory Travel & Transit'
  | 'QC & Inspection'
  | 'Prototyping & Packaging'
  | 'Other / Miscellaneous';

export interface InquiryExpense {
  id: string; // Unique ID
  category?: string; // Optional category tag
  title: string; // Custom description of what the expense is about
  amount: number; // Raw numeric value
  currency: CurrencyUnit; // 'USD' | 'RMB'
  amountUsd: number; // Normalized in USD ($)
  amountRmb: number; // Normalized in RMB (¥)
  date?: string; // YYYY-MM-DD
  supplierOrPayee?: string; // Factory, Courier, Driver, Inspector name
  paymentMethod?: ExpensePaymentMethod;
  hasFapiao?: boolean; // Has Chinese VAT Fapiao (发票)
  notes?: string;
  receiptUrl?: string;
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
  name: string; // Contact or Company Name
  company?: string; // Company / Business Name
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string; // WhatsApp number
  wechatId?: string;
  country?: string; // Country Name
  type: 'Active' | 'Potential' | 'VIP' | 'Past';
  preferredCurrency?: 'USD' | 'EUR' | 'GBP' | 'RMB';
  destinationPort?: string; // Port of discharge e.g., Los Angeles, Hamburg, Jebel Ali
  shippingAddress?: string;
  website?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ServiceCategory =
  | 'Medical & Clinic Assistance'
  | 'Company Registration'
  | 'Factory Audit & Verification'
  | 'Translation & Business Escort'
  | 'Legal & Contract Review'
  | 'Visa & Travel Support'
  | 'Warehousing & Logistics'
  | 'Trademark & IP'
  | 'Sample Lab Testing'
  | 'Concierge & Personal Request'
  | 'Other Service';

export type ServiceStatus =
  | 'New Request'
  | 'In Progress'
  | 'Waiting for Client'
  | 'Waiting for China Partner'
  | 'Completed'
  | 'Cancelled';

export type ServicePriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ServicePaymentStatus = 'Unpaid' | 'Deposit Received' | 'Fully Paid' | 'Refunded';

export interface ServiceRequest {
  id: string; // Unique ID (e.g. SRV-2026-001)
  serviceNumber: string; // e.g. SRV-2026-001
  date: string; // YYYY-MM-DD
  clientName: string; // Client Name
  clientContact?: string; // WhatsApp / Phone / Email
  wechatId?: string;
  country?: string;
  category: ServiceCategory;
  title: string; // e.g. "Find Top Orthopedic Clinic in Guangzhou for Uncle"
  description: string; // Scope of service, specific client requirements
  cityLocation?: string; // e.g. Guangzhou, Shenzhen, Yiwu, Shanghai, Beijing
  status: ServiceStatus;
  priority: ServicePriority;

  // Financials
  quoteCurrency: CurrencyUnit; // 'USD' or 'RMB'
  clientFee: number; // Total fee billed to client
  estimatedCost: number; // Cost paid to China hospital / clinic / registry / partner
  estimatedProfitUsd: number; // Calculated profit in USD
  estimatedProfitRmb: number; // Calculated profit in RMB
  paymentStatus: ServicePaymentStatus;

  // Partner / Local contact in China
  assignedPartner?: string; // e.g. "Dr. Lin Medical Concierge", "Shenzhen Yida Legal"
  partnerContact?: string; // Phone / WeChat
  partnerCommission?: number; // Commission or payout for partner

  // Target timeline
  targetDate?: string; // Target completion or appointment date
  notes?: string;

  // On-ground travel & factory relocation expenses for this service
  travelExpenses?: {
    transportCost: number; // Train, Didi, Flights, Car
    hotelCost: number; // Hotel & accommodation
    foodCost: number; // Meals, Client dinners, Food
    otherCost: number; // Tolls, SIM, Factory entry
    currency: CurrencyUnit;
    notes?: string;
  };
  totalTravelCostUsd?: number;
  totalTravelCostRmb?: number;
  netProfitAfterExpensesUsd?: number;
  netProfitAfterExpensesRmb?: number;

  createdAt: string;
  updatedAt: string;
}

// ----------------- EXPENSES TRACKER TYPES -----------------
export type ExpenseCategory =
  | 'Transport'
  | 'Hotel & Accommodation'
  | 'Food & Meals'
  | 'Factory Escort & Driver'
  | 'SIM, VPN & Supplies'
  | 'Other / Miscellaneous';

export type ExpensePaymentMethod =
  | 'WeChat Pay'
  | 'Alipay'
  | 'Credit Card'
  | 'Cash (RMB)'
  | 'Bank Transfer';

export interface ExpenseItem {
  id: string; // Unique ID (e.g. EXP-001)
  expenseNumber: string; // e.g. EXP-2026-001
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  subType?: string; // e.g. "Gaotie / High-Speed Train", "Didi / Taxi", "Flight", "Hotel", "Business Meal"
  title: string; // e.g. "Gaotie: Guangzhou South -> Yiwu"
  amount: number; // Numerical amount spent
  currency: CurrencyUnit; // RMB or USD
  amountRmb: number; // Normalized in RMB
  amountUsd: number; // Normalized in USD
  city: string; // e.g. Guangzhou, Shenzhen, Yiwu, Dongguan, Foshan, Ningbo, Shanghai
  destinationRoute?: string; // e.g. "Shenzhen -> Dongguan Plastic Factory"
  factoryOrPartner?: string; // Visited factory or supplier name
  factoryOrSupplier?: string; // Visited factory or supplier name (alias)
  hasFapiao?: boolean; // Has Chinese VAT Fapiao (发票)
  paymentMethod?: ExpensePaymentMethod;
  linkedServiceId?: string; // Associated Service Request ID
  linkedInquiryId?: string; // Associated Sourcing Inquiry ID
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}



import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  Building2,
  ShieldCheck,
  Languages,
  Scale,
  Plane,
  Boxes,
  Award,
  FlaskConical,
  Sparkles,
  HelpCircle,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Phone,
  MessageCircle,
  FileText,
  AlertCircle,
  Train,
  Hotel,
  Utensils,
  Car,
  Receipt,
} from 'lucide-react';
import {
  ServiceRequest,
  ServiceCategory,
  ServiceStatus,
  ServicePriority,
  ServicePaymentStatus,
  CurrencyUnit,
  Customer,
  ExchangeRates,
  ExpenseItem,
} from '../types';
import { formatCurrency } from '../lib/currency';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: ServiceRequest) => void;
  onSaveExpense?: (expense: ExpenseItem) => void;
  serviceToEdit: ServiceRequest | null;
  customers: Customer[];
  exchangeRates: ExchangeRates;
  existingServices?: ServiceRequest[];
}

const CATEGORIES: { label: ServiceCategory; icon: React.FC<{ className?: string }>; description: string }[] = [
  {
    label: 'Medical & Clinic Assistance',
    icon: Stethoscope,
    description: 'Specialist doctor booking, hospital visits, medical interpreter, health checkups',
  },
  {
    label: 'Company Registration',
    icon: Building2,
    description: 'WFOE setup, representative office, business license, bank accounts, tax registration',
  },
  {
    label: 'Factory Audit & Verification',
    icon: ShieldCheck,
    description: 'On-site factory inspection, business license check, legitimacy verification',
  },
  {
    label: 'Translation & Business Escort',
    icon: Languages,
    description: 'Bilingual market guides, meeting interpreters, business negotiation support',
  },
  {
    label: 'Legal & Contract Review',
    icon: Scale,
    description: 'Chinese supplier contracts, NNN/NDA agreements, dispute resolution',
  },
  {
    label: 'Visa & Travel Support',
    icon: Plane,
    description: 'Business invitation letters (M-Visa), airport transfers, China hotel bookings',
  },
  {
    label: 'Warehousing & Logistics',
    icon: Boxes,
    description: 'Consolidation warehouse, repacking, quality checks, domestic China transport',
  },
  {
    label: 'Trademark & IP',
    icon: Award,
    description: 'China trademark registration, copyright filings, patent search',
  },
  {
    label: 'Sample Lab Testing',
    icon: FlaskConical,
    description: 'Product safety, RoHS, CE, FDA, food-grade laboratory certifications in China',
  },
  {
    label: 'Concierge & Personal Request',
    icon: Sparkles,
    description: 'Personal errands, family assistance, gift sourcing, special China requests',
  },
  {
    label: 'Other Service',
    icon: HelpCircle,
    description: 'Custom on-ground assistance and consulting in China',
  },
];

const POPULAR_CITIES = [
  'Guangzhou',
  'Shenzhen',
  'Yiwu',
  'Shanghai',
  'Ningbo',
  'Beijing',
  'Hangzhou',
  'Foshan',
  'Dongguan',
  'Xiamen',
  'Qingdao',
  'Hong Kong',
];

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveExpense,
  serviceToEdit,
  customers,
  exchangeRates,
  existingServices = [],
}) => {
  const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;

  const [formData, setFormData] = useState<Partial<ServiceRequest>>({
    serviceNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientContact: '',
    wechatId: '',
    country: '',
    category: 'Medical & Clinic Assistance',
    title: '',
    description: '',
    cityLocation: 'Guangzhou',
    status: 'New Request',
    priority: 'Medium',
    quoteCurrency: 'USD',
    clientFee: 500,
    estimatedCost: 200,
    estimatedProfitUsd: 300,
    estimatedProfitRmb: 300 * rate,
    paymentStatus: 'Unpaid',
    assignedPartner: '',
    partnerContact: '',
    partnerCommission: 0,
    targetDate: '',
    notes: '',
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [travelExpenses, setTravelExpenses] = useState<{
    transportCost: number;
    hotelCost: number;
    foodCost: number;
    otherCost: number;
    currency: CurrencyUnit;
    notes: string;
  }>({
    transportCost: 0,
    hotelCost: 0,
    foodCost: 0,
    otherCost: 0,
    currency: 'RMB',
    notes: '',
  });

  const [alsoLogToExpenses, setAlsoLogToExpenses] = useState<boolean>(true);

  useEffect(() => {
    if (serviceToEdit) {
      setFormData(serviceToEdit);
      if (serviceToEdit.travelExpenses) {
        setTravelExpenses({
          transportCost: serviceToEdit.travelExpenses.transportCost || 0,
          hotelCost: serviceToEdit.travelExpenses.hotelCost || 0,
          foodCost: serviceToEdit.travelExpenses.foodCost || 0,
          otherCost: serviceToEdit.travelExpenses.otherCost || 0,
          currency: serviceToEdit.travelExpenses.currency || 'RMB',
          notes: serviceToEdit.travelExpenses.notes || '',
        });
      } else {
        setTravelExpenses({
          transportCost: 0,
          hotelCost: 0,
          foodCost: 0,
          otherCost: 0,
          currency: 'RMB',
          notes: '',
        });
      }
      const match = customers.find(
        (c) => c.name.toLowerCase() === (serviceToEdit.clientName || '').toLowerCase()
      );
      if (match) setSelectedCustomerId(match.id);
    } else {
      // Generate next sequence number
      const year = new Date().getFullYear();
      const prefix = `SRV-${year}-`;
      let maxNum = 0;
      existingServices.forEach((s) => {
        if (s.serviceNumber && s.serviceNumber.startsWith(prefix)) {
          const num = parseInt(s.serviceNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const nextNum = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

      setFormData({
        id: `srv_${Date.now()}`,
        serviceNumber: nextNum,
        date: new Date().toISOString().split('T')[0],
        clientName: '',
        clientContact: '',
        wechatId: '',
        country: '',
        category: 'Medical & Clinic Assistance',
        title: '',
        description: '',
        cityLocation: 'Guangzhou',
        status: 'New Request',
        priority: 'Medium',
        quoteCurrency: 'USD',
        clientFee: 500,
        estimatedCost: 200,
        estimatedProfitUsd: 300,
        estimatedProfitRmb: 300 * rate,
        paymentStatus: 'Unpaid',
        assignedPartner: '',
        partnerContact: '',
        partnerCommission: 0,
        targetDate: '',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setTravelExpenses({
        transportCost: 0,
        hotelCost: 0,
        foodCost: 0,
        otherCost: 0,
        currency: 'RMB',
        notes: '',
      });
      setSelectedCustomerId('');
    }
  }, [serviceToEdit, isOpen, rate, existingServices, customers]);

  // Recalculate profit whenever fee, cost, currency, rate, or travel expenses change
  const updateFinancials = (
    fee: number,
    cost: number,
    currency: CurrencyUnit,
    travel = travelExpenses
  ) => {
    const rawNet = Math.max(0, fee - cost);
    let baseProfitUsd = rawNet;
    let baseProfitRmb = rawNet * rate;

    if (currency === 'RMB') {
      baseProfitRmb = rawNet;
      baseProfitUsd = rawNet / rate;
    }

    // Travel expenses calculations
    const travelSum =
      (Number(travel.transportCost) || 0) +
      (Number(travel.hotelCost) || 0) +
      (Number(travel.foodCost) || 0) +
      (Number(travel.otherCost) || 0);

    let travelCostRmb = travelSum;
    let travelCostUsd = travelSum / rate;
    if (travel.currency === 'USD') {
      travelCostUsd = travelSum;
      travelCostRmb = travelSum * rate;
    }

    // Convert travel to quote currency to deduct from net profit
    const travelCostInQuoteCurrency = currency === 'RMB' ? travelCostRmb : travelCostUsd;
    const netAfter = Math.max(0, rawNet - travelCostInQuoteCurrency);

    let netProfitAfterUsd = netAfter;
    let netProfitAfterRmb = netAfter * rate;
    if (currency === 'RMB') {
      netProfitAfterRmb = netAfter;
      netProfitAfterUsd = netAfter / rate;
    }

    setFormData((prev) => ({
      ...prev,
      clientFee: fee,
      estimatedCost: cost,
      quoteCurrency: currency,
      estimatedProfitUsd: baseProfitUsd,
      estimatedProfitRmb: baseProfitRmb,
      totalTravelCostUsd: Number(travelCostUsd.toFixed(2)),
      totalTravelCostRmb: Number(travelCostRmb.toFixed(2)),
      netProfitAfterExpensesUsd: Number(netProfitAfterUsd.toFixed(2)),
      netProfitAfterExpensesRmb: Number(netProfitAfterRmb.toFixed(2)),
    }));
  };

  const handleTravelExpenseChange = (
    field: 'transportCost' | 'hotelCost' | 'foodCost' | 'otherCost' | 'currency' | 'notes',
    value: any
  ) => {
    const updated = {
      ...travelExpenses,
      [field]: value,
    };
    setTravelExpenses(updated);
    updateFinancials(
      Number(formData.clientFee) || 0,
      Number(formData.estimatedCost) || 0,
      formData.quoteCurrency || 'USD',
      updated
    );
  };

  const applyTravelPreset = (preset: {
    transport: number;
    hotel: number;
    food: number;
    other: number;
    label: string;
  }) => {
    const updated = {
      ...travelExpenses,
      transportCost: preset.transport,
      hotelCost: preset.hotel,
      foodCost: preset.food,
      otherCost: preset.other,
      currency: 'RMB' as CurrencyUnit,
      notes: preset.label ? `${preset.label}. ${travelExpenses.notes || ''}`.trim() : travelExpenses.notes,
    };
    setTravelExpenses(updated);
    updateFinancials(
      Number(formData.clientFee) || 0,
      Number(formData.estimatedCost) || 0,
      formData.quoteCurrency || 'USD',
      updated
    );
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientName: found.name,
        clientContact: found.whatsapp || found.contactPhone || found.contactEmail || '',
        wechatId: found.wechatId || '',
        country: found.country || '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.title) return;

    const travelSum =
      (Number(travelExpenses.transportCost) || 0) +
      (Number(travelExpenses.hotelCost) || 0) +
      (Number(travelExpenses.foodCost) || 0) +
      (Number(travelExpenses.otherCost) || 0);

    let travelCostRmb = travelSum;
    let travelCostUsd = travelSum / rate;
    if (travelExpenses.currency === 'USD') {
      travelCostUsd = travelSum;
      travelCostRmb = travelSum * rate;
    }

    const fee = Number(formData.clientFee) || 0;
    const cost = Number(formData.estimatedCost) || 0;
    const rawNet = Math.max(0, fee - cost);
    const curr = formData.quoteCurrency || 'USD';
    const travelInQuote = curr === 'USD' ? travelCostUsd : travelCostRmb;
    const netAfter = Math.max(0, rawNet - travelInQuote);

    const payload: ServiceRequest = {
      id: formData.id || `srv_${Date.now()}`,
      serviceNumber: formData.serviceNumber || `SRV-${new Date().getFullYear()}-001`,
      date: formData.date || new Date().toISOString().split('T')[0],
      clientName: formData.clientName.trim(),
      clientContact: formData.clientContact || '',
      wechatId: formData.wechatId || '',
      country: formData.country || '',
      category: formData.category || 'Other Service',
      title: formData.title.trim(),
      description: formData.description || '',
      cityLocation: formData.cityLocation || '',
      status: formData.status || 'New Request',
      priority: formData.priority || 'Medium',
      quoteCurrency: curr,
      clientFee: fee,
      estimatedCost: cost,
      estimatedProfitUsd: Number(formData.estimatedProfitUsd) || 0,
      estimatedProfitRmb: Number(formData.estimatedProfitRmb) || 0,
      paymentStatus: formData.paymentStatus || 'Unpaid',
      assignedPartner: formData.assignedPartner || '',
      partnerContact: formData.partnerContact || '',
      partnerCommission: Number(formData.partnerCommission) || 0,
      targetDate: formData.targetDate || '',
      notes: formData.notes || '',
      travelExpenses: travelSum > 0 ? travelExpenses : undefined,
      totalTravelCostUsd: travelSum > 0 ? Number(travelCostUsd.toFixed(2)) : 0,
      totalTravelCostRmb: travelSum > 0 ? Number(travelCostRmb.toFixed(2)) : 0,
      netProfitAfterExpensesUsd: Number((curr === 'USD' ? netAfter : netAfter / rate).toFixed(2)),
      netProfitAfterExpensesRmb: Number((curr === 'RMB' ? netAfter : netAfter * rate).toFixed(2)),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);

    // Auto-log to China Business Expenses if checked and has travel costs
    if (alsoLogToExpenses && travelSum > 0 && onSaveExpense) {
      const expTitle = `Relocation & Factory Audit: ${payload.title} (${payload.clientName})`;
      const expenseItem: ExpenseItem = {
        id: `exp_${Date.now()}`,
        expenseNumber: `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
        date: payload.date || new Date().toISOString().split('T')[0],
        category: 'Transport',
        subType: 'Factory Relocation Travel',
        title: expTitle,
        amount: travelSum,
        currency: travelExpenses.currency,
        amountRmb: Number(travelCostRmb.toFixed(2)),
        amountUsd: Number(travelCostUsd.toFixed(2)),
        city: payload.cityLocation || 'Guangzhou',
        destinationRoute: `Travel across China for ${payload.serviceNumber}`,
        factoryOrPartner: payload.assignedPartner || payload.title,
        hasFapiao: true,
        paymentMethod: 'WeChat Pay',
        linkedServiceId: payload.id,
        notes: `Auto-recorded from Service Request ${payload.serviceNumber}. Transport: ¥${travelExpenses.transportCost}, Hotel: ¥${travelExpenses.hotelCost}, Food: ¥${travelExpenses.foodCost}, Other: ¥${travelExpenses.otherCost}. ${travelExpenses.notes || ''}`.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveExpense(expenseItem);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 rounded-t-xl shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {serviceToEdit ? `Edit Service Request: ${serviceToEdit.serviceNumber}` : 'New China Service Request'}
              </h2>
              <p className="text-xs text-slate-500">
                Manage non-sourcing requests (clinics, hospital assistance, company formation, translation, audits)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Category Quick Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Service Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.label;
                return (
                  <button
                    key={cat.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.label })}
                    className={`flex items-start p-2.5 rounded-lg border text-left transition ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500 text-indigo-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 mr-2 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
                        {cat.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Title & ID */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Title / Objective <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Find orthopedic clinic in Guangzhou for uncle, Register WFOE company in Shenzhen"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service #</label>
              <input
                type="text"
                value={formData.serviceNumber || ''}
                onChange={(e) => setFormData({ ...formData, serviceNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Client Selection & Details */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Client Information
              </span>
              {customers.length > 0 && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] text-slate-500 shrink-0">Auto-fill:</span>
                  <select
                    id="service-modal-client-autofill-select"
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="text-xs py-1 px-2 border border-slate-300 rounded bg-white font-medium min-w-0 truncate max-w-[220px]"
                  >
                    <option value="">-- Choose Existing Client --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Al-Mansoor"
                  value={formData.clientName || ''}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">WhatsApp / Phone</label>
                <input
                  type="text"
                  placeholder="+966 50 123 4567"
                  value={formData.clientContact || ''}
                  onChange={(e) => setFormData({ ...formData, clientContact: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">WeChat ID</label>
                <input
                  type="text"
                  placeholder="client_wechat"
                  value={formData.wechatId || ''}
                  onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client Country</label>
                <input
                  type="text"
                  placeholder="e.g. Saudi Arabia, USA"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City / Location in China
              </label>
              <div className="flex items-center gap-1.5 w-full min-w-0">
                <input
                  type="text"
                  placeholder="e.g. Guangzhou, Shenzhen"
                  value={formData.cityLocation || ''}
                  onChange={(e) => setFormData({ ...formData, cityLocation: e.target.value })}
                  className="min-w-0 flex-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
                />
                <select
                  id="service-city-quick-select"
                  aria-label="Quick pick China city"
                  onChange={(e) => {
                    if (e.target.value) setFormData({ ...formData, cityLocation: e.target.value });
                  }}
                  className="shrink-0 w-24 sm:w-28 px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium cursor-pointer transition focus:outline-none focus:border-indigo-500 truncate"
                  value=""
                >
                  <option value="" disabled>
                    + City
                  </option>
                  {POPULAR_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Request Date</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full min-w-0 max-w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-slate-800"
              />
            </div>
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Date / Appointment
              </label>
              <input
                type="date"
                value={formData.targetDate || ''}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full min-w-0 max-w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Scope / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Scope & Specific Requirements
            </label>
            <textarea
              rows={3}
              placeholder="Detail the exact deliverables: e.g., finding the best orthopedic hospital in Guangzhou for his uncle, booking chief physician, providing medical translator, assistance with prescriptions..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {/* Financials & Agent Profit Calculator */}
          <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Service Pricing & Agent Profit (USD & RMB)
              </span>
              {/* Currency Selector */}
              <div className="inline-flex rounded bg-emerald-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() =>
                    updateFinancials(Number(formData.clientFee) || 0, Number(formData.estimatedCost) || 0, 'USD')
                  }
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    formData.quoteCurrency === 'USD'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateFinancials(Number(formData.clientFee) || 0, Number(formData.estimatedCost) || 0, 'RMB')
                  }
                  className={`px-2 py-0.5 rounded text-[11px] transition ${
                    formData.quoteCurrency === 'RMB'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  ¥ RMB
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Client Service Fee ({formData.quoteCurrency === 'USD' ? '$' : '¥'})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                    {formData.quoteCurrency === 'USD' ? '$' : '¥'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="1200"
                    value={formData.clientFee ?? ''}
                    onChange={(e) =>
                      updateFinancials(
                        parseFloat(e.target.value) || 0,
                        Number(formData.estimatedCost) || 0,
                        formData.quoteCurrency || 'USD'
                      )
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  China Local Cost / Fees ({formData.quoteCurrency === 'USD' ? '$' : '¥'})
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                    {formData.quoteCurrency === 'USD' ? '$' : '¥'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="450"
                    value={formData.estimatedCost ?? ''}
                    onChange={(e) =>
                      updateFinancials(
                        Number(formData.clientFee) || 0,
                        parseFloat(e.target.value) || 0,
                        formData.quoteCurrency || 'USD'
                      )
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={formData.paymentStatus || 'Unpaid'}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentStatus: e.target.value as ServicePaymentStatus })
                  }
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded font-medium focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Deposit Received">Deposit Received</option>
                  <option value="Fully Paid">Fully Paid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {/* Calculated Net Profit */}
              <div className="bg-white p-2 rounded border border-emerald-200 text-center flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Agent Net Profit
                </span>
                <span className="text-sm font-extrabold text-emerald-700 font-mono">
                  +${(formData.estimatedProfitUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-600/80 font-mono">
                  +¥{(formData.estimatedProfitRmb || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Partner in China */}
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Assigned China Partner / Service Provider
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2 md:col-span-1 min-w-0">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Partner / Clinic / Agency Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Lin Medical Concierge, Shenzhen Yida"
                  value={formData.assignedPartner || ''}
                  onChange={(e) => setFormData({ ...formData, assignedPartner: e.target.value })}
                  className="w-full min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Partner Phone / WeChat
                </label>
                <input
                  type="text"
                  placeholder="+86 138 0020 8899 / wechat: gz_med"
                  value={formData.partnerContact || ''}
                  onChange={(e) => setFormData({ ...formData, partnerContact: e.target.value })}
                  className="w-full min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="min-w-0">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Partner Commission / Fee ({formData.quoteCurrency === 'USD' ? '$' : '¥'})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="300"
                  value={formData.partnerCommission ?? ''}
                  onChange={(e) => setFormData({ ...formData, partnerCommission: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* On-Ground Travel & Factory Relocation Expenses (China) */}
          <div className="p-3.5 sm:p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 text-amber-700 rounded-lg">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    Travel & Factory Relocation Expenses (China)
                  </span>
                  <p className="text-[11px] text-amber-800/80">
                    Calculate transport, hotel, food & relocation costs across China for this service
                  </p>
                </div>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-amber-200 shrink-0 self-start sm:self-auto">
                <span className="text-[10px] font-bold text-amber-800 px-2">Expense Currency:</span>
                <button
                  type="button"
                  onClick={() => handleTravelExpenseChange('currency', 'RMB')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    travelExpenses.currency === 'RMB'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ¥ RMB
                </button>
                <button
                  type="button"
                  onClick={() => handleTravelExpenseChange('currency', 'USD')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    travelExpenses.currency === 'USD'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  $ USD
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => applyTravelPreset({ transport: 0, hotel: 0, food: 0, other: 0, label: '' })}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-amber-200 hover:bg-amber-100/50 text-slate-700 transition"
              >
                No Travel (¥0)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTravelPreset({
                    transport: 150,
                    hotel: 0,
                    food: 100,
                    other: 0,
                    label: '1-Day Local Factory Audit (Didi + Lunch)',
                  })
                }
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-amber-200 hover:bg-amber-100/50 text-slate-700 transition"
              >
                1-Day Audit (¥250)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTravelPreset({
                    transport: 400,
                    hotel: 350,
                    food: 150,
                    other: 0,
                    label: '2-Day Intercity Audit (Gaotie + Hotel + Meals)',
                  })
                }
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-amber-200 hover:bg-amber-100/50 text-slate-700 transition"
              >
                2-Day Stay (¥900)
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTravelPreset({
                    transport: 1100,
                    hotel: 700,
                    food: 350,
                    other: 100,
                    label: '3-Day Multi-City Trip (High-Speed Train, 2 Nights Hotel, Per Diem)',
                  })
                }
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-amber-200 hover:bg-amber-100/50 text-slate-700 transition"
              >
                3-Day Multi-City (¥2,250)
              </button>
            </div>

            {/* Expense Inputs Grid: Transport, Hotel, Food, Other */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Transport */}
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Train className="w-3.5 h-3.5 text-blue-600" />
                  Transport / Gaotie / Didi
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                    {travelExpenses.currency === 'RMB' ? '¥' : '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={travelExpenses.transportCost || ''}
                    onChange={(e) =>
                      handleTravelExpenseChange('transportCost', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  High-speed train, flights, taxis
                </span>
              </div>

              {/* Hotel */}
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-indigo-600" />
                  Hotel & Lodging
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                    {travelExpenses.currency === 'RMB' ? '¥' : '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={travelExpenses.hotelCost || ''}
                    onChange={(e) =>
                      handleTravelExpenseChange('hotelCost', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Hotel nights near factory zone
                </span>
              </div>

              {/* Food */}
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  Food & Daily Meals
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                    {travelExpenses.currency === 'RMB' ? '¥' : '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={travelExpenses.foodCost || ''}
                    onChange={(e) =>
                      handleTravelExpenseChange('foodCost', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Per diem, dinners with suppliers
                </span>
              </div>

              {/* Other */}
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-emerald-600" />
                  Other Relocation / Misc
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                    {travelExpenses.currency === 'RMB' ? '¥' : '$'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={travelExpenses.otherCost || ''}
                    onChange={(e) =>
                      handleTravelExpenseChange('otherCost', parseFloat(e.target.value) || 0)
                    }
                    className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-amber-500 bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Tolls, sample baggage, driver hire
                </span>
              </div>
            </div>

            {/* Travel Notes & Auto-log checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Relocation notes, route details (e.g. Shenzhen North -> Dongguan Tangxia 2 days)"
                  value={travelExpenses.notes || ''}
                  onChange={(e) => handleTravelExpenseChange('notes', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 px-2 bg-white rounded border border-amber-200">
                <input
                  type="checkbox"
                  id="also-log-to-expenses-chk"
                  checked={alsoLogToExpenses}
                  onChange={(e) => setAlsoLogToExpenses(e.target.checked)}
                  className="w-3.5 h-3.5 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label
                  htmlFor="also-log-to-expenses-chk"
                  className="text-[11px] font-semibold text-slate-700 cursor-pointer select-none truncate"
                  title="Also auto-log into China Business Expenses section upon saving"
                >
                  Sync to China Expenses section
                </label>
              </div>
            </div>

            {/* Live Financial Impact Display */}
            {((Number(travelExpenses.transportCost) || 0) +
              (Number(travelExpenses.hotelCost) || 0) +
              (Number(travelExpenses.foodCost) || 0) +
              (Number(travelExpenses.otherCost) || 0)) > 0 && (
              <div className="p-2.5 bg-amber-100/70 rounded-lg border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950">Total Travel Expenses:</span>
                  <span className="font-mono font-extrabold text-amber-900">
                    ¥{formData.totalTravelCostRmb?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-amber-800 font-mono text-[11px]">
                    (${formData.totalTravelCostUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900">Adjusted Net Profit:</span>
                  <span className="font-mono font-extrabold text-emerald-800">
                    +${(formData.netProfitAfterExpensesUsd ?? formData.estimatedProfitUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-emerald-700 font-mono text-[11px]">
                    (+¥{(formData.netProfitAfterExpensesRmb ?? formData.estimatedProfitRmb ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Request Status</label>
              <select
                value={formData.status || 'New Request'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceStatus })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="New Request">New Request</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Client">Waiting for Client</option>
                <option value="Waiting for China Partner">Waiting for China Partner</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority || 'Medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ServicePriority })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Patient sent MRI reports, Lawyer needs original passport scan, etc."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              {serviceToEdit ? 'Update Service Request' : 'Save Service Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

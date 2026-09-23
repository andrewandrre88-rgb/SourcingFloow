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
  Plus,
  Trash2,
  Coins,
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
  InquiryExpense,
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

  const [serviceExpenses, setServiceExpenses] = useState<InquiryExpense[]>([]);
  const [alsoLogToExpenses, setAlsoLogToExpenses] = useState<boolean>(true);

  // Compute total expenses in USD and RMB
  const totalExpenses = serviceExpenses.reduce(
    (acc, exp) => {
      const amt = Number(exp.amount) || 0;
      if (exp.currency === 'USD') {
        acc.usd += amt;
        acc.rmb += amt * rate;
      } else {
        acc.rmb += amt;
        acc.usd += amt / rate;
      }
      return acc;
    },
    { usd: 0, rmb: 0 }
  );

  useEffect(() => {
    if (serviceToEdit) {
      setFormData(serviceToEdit);
      if (serviceToEdit.serviceExpenses && serviceToEdit.serviceExpenses.length > 0) {
        setServiceExpenses(serviceToEdit.serviceExpenses);
      } else if (serviceToEdit.travelExpenses) {
        // Convert legacy travelExpenses fields to serviceExpenses if they exist
        const legacy: InquiryExpense[] = [];
        const curr = serviceToEdit.travelExpenses.currency || 'RMB';
        if (serviceToEdit.travelExpenses.transportCost) {
          legacy.push({
            id: `leg_trans_${Date.now()}_1`,
            title: 'Transport / Gaotie / Didi',
            amount: serviceToEdit.travelExpenses.transportCost,
            currency: curr,
            amountRmb: curr === 'RMB' ? serviceToEdit.travelExpenses.transportCost : serviceToEdit.travelExpenses.transportCost * rate,
            amountUsd: curr === 'USD' ? serviceToEdit.travelExpenses.transportCost : serviceToEdit.travelExpenses.transportCost / rate,
            date: serviceToEdit.date,
            supplierOrPayee: 'China Transport',
            paymentMethod: 'WeChat Pay',
            hasFapiao: true,
          });
        }
        if (serviceToEdit.travelExpenses.hotelCost) {
          legacy.push({
            id: `leg_hotel_${Date.now()}_2`,
            title: 'Hotel & Lodging',
            amount: serviceToEdit.travelExpenses.hotelCost,
            currency: curr,
            amountRmb: curr === 'RMB' ? serviceToEdit.travelExpenses.hotelCost : serviceToEdit.travelExpenses.hotelCost * rate,
            amountUsd: curr === 'USD' ? serviceToEdit.travelExpenses.hotelCost : serviceToEdit.travelExpenses.hotelCost / rate,
            date: serviceToEdit.date,
            supplierOrPayee: 'Hotel',
            paymentMethod: 'WeChat Pay',
            hasFapiao: true,
          });
        }
        if (serviceToEdit.travelExpenses.foodCost) {
          legacy.push({
            id: `leg_food_${Date.now()}_3`,
            title: 'Food & Daily Meals',
            amount: serviceToEdit.travelExpenses.foodCost,
            currency: curr,
            amountRmb: curr === 'RMB' ? serviceToEdit.travelExpenses.foodCost : serviceToEdit.travelExpenses.foodCost * rate,
            amountUsd: curr === 'USD' ? serviceToEdit.travelExpenses.foodCost : serviceToEdit.travelExpenses.foodCost / rate,
            date: serviceToEdit.date,
            paymentMethod: 'WeChat Pay',
            hasFapiao: false,
          });
        }
        if (serviceToEdit.travelExpenses.otherCost) {
          legacy.push({
            id: `leg_other_${Date.now()}_4`,
            title: serviceToEdit.travelExpenses.notes || 'Other Relocation / Misc',
            amount: serviceToEdit.travelExpenses.otherCost,
            currency: curr,
            amountRmb: curr === 'RMB' ? serviceToEdit.travelExpenses.otherCost : serviceToEdit.travelExpenses.otherCost * rate,
            amountUsd: curr === 'USD' ? serviceToEdit.travelExpenses.otherCost : serviceToEdit.travelExpenses.otherCost / rate,
            date: serviceToEdit.date,
            notes: serviceToEdit.travelExpenses.notes,
            paymentMethod: 'WeChat Pay',
            hasFapiao: true,
          });
        }
        setServiceExpenses(legacy);
      } else {
        setServiceExpenses([]);
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
      setServiceExpenses([]);
      setSelectedCustomerId('');
    }
  }, [serviceToEdit, isOpen, rate, existingServices, customers]);

  // Recalculate profit whenever fee, cost, currency, rate, or expenses change
  const updateFinancials = (
    fee: number,
    cost: number,
    currency: CurrencyUnit,
    expensesList = serviceExpenses
  ) => {
    const rawNet = Math.max(0, fee - cost);
    let baseProfitUsd = rawNet;
    let baseProfitRmb = rawNet * rate;

    if (currency === 'RMB') {
      baseProfitRmb = rawNet;
      baseProfitUsd = rawNet / rate;
    }

    // Sum service expenses
    let totalExpUsd = 0;
    let totalExpRmb = 0;
    expensesList.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (e.currency === 'USD') {
        totalExpUsd += amt;
        totalExpRmb += amt * rate;
      } else {
        totalExpRmb += amt;
        totalExpUsd += amt / rate;
      }
    });

    // Convert expenses to quote currency to deduct from net profit
    const expenseInQuoteCurrency = currency === 'RMB' ? totalExpRmb : totalExpExpUsdFallback(totalExpUsd);
    function totalExpExpUsdFallback(val: number) {
      return val;
    }
    const netAfter = Math.max(0, rawNet - expenseInQuoteCurrency);

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
      estimatedProfitUsd: Number(baseProfitUsd.toFixed(2)),
      estimatedProfitRmb: Number(baseProfitRmb.toFixed(2)),
      totalTravelCostUsd: Number(totalExpUsd.toFixed(2)),
      totalTravelCostRmb: Number(totalExpRmb.toFixed(2)),
      netProfitAfterExpensesUsd: Number(netProfitAfterUsd.toFixed(2)),
      netProfitAfterExpensesRmb: Number(netProfitAfterRmb.toFixed(2)),
      serviceExpenses: expensesList,
      travelExpenses: {
        transportCost: Number(totalExpRmb.toFixed(2)),
        hotelCost: 0,
        foodCost: 0,
        otherCost: 0,
        currency: 'RMB',
        notes: expensesList.map((e) => e.title).filter(Boolean).join(', '),
      },
    }));
  };

  const handleAddExpense = (preset?: Partial<InquiryExpense>) => {
    const newExp: InquiryExpense = {
      id: `srv_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: preset?.title || '',
      amount: preset?.amount || 0,
      currency: preset?.currency || 'RMB',
      amountRmb: 0,
      amountUsd: 0,
      date: preset?.date || new Date().toISOString().split('T')[0],
      supplierOrPayee: preset?.supplierOrPayee || '',
      paymentMethod: preset?.paymentMethod || 'WeChat Pay',
      hasFapiao: preset?.hasFapiao ?? true,
      notes: preset?.notes || '',
    };
    const updated = [...serviceExpenses, newExp];
    setServiceExpenses(updated);
    updateFinancials(
      Number(formData.clientFee) || 0,
      Number(formData.estimatedCost) || 0,
      formData.quoteCurrency || 'USD',
      updated
    );
  };

  const handleUpdateExpense = (index: number, patch: Partial<InquiryExpense>) => {
    const updated = [...serviceExpenses];
    updated[index] = { ...updated[index], ...patch };
    setServiceExpenses(updated);
    updateFinancials(
      Number(formData.clientFee) || 0,
      Number(formData.estimatedCost) || 0,
      formData.quoteCurrency || 'USD',
      updated
    );
  };

  const handleRemoveExpense = (index: number) => {
    const updated = serviceExpenses.filter((_, i) => i !== index);
    setServiceExpenses(updated);
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

    const fee = Number(formData.clientFee) || 0;
    const cost = Number(formData.estimatedCost) || 0;
    const rawNet = Math.max(0, fee - cost);
    const curr = formData.quoteCurrency || 'USD';
    const expenseInQuote = curr === 'USD' ? totalExpenses.usd : totalExpenses.rmb;
    const netAfter = Math.max(0, rawNet - expenseInQuote);

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
      serviceExpenses: serviceExpenses,
      travelExpenses: {
        transportCost: Number(totalExpenses.rmb.toFixed(2)),
        hotelCost: 0,
        foodCost: 0,
        otherCost: 0,
        currency: 'RMB',
        notes: serviceExpenses.map((e) => e.title).filter(Boolean).join(', '),
      },
      totalTravelCostUsd: Number(totalExpenses.usd.toFixed(2)),
      totalTravelCostRmb: Number(totalExpenses.rmb.toFixed(2)),
      netProfitAfterExpensesUsd: Number((curr === 'USD' ? netAfter : netAfter / rate).toFixed(2)),
      netProfitAfterExpensesRmb: Number((curr === 'RMB' ? netAfter : netAfter * rate).toFixed(2)),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(payload);

    // Auto-log to China Business Expenses if checked and has expenses
    if (alsoLogToExpenses && serviceExpenses.length > 0 && onSaveExpense) {
      serviceExpenses.forEach((exp, idx) => {
        const amt = Number(exp.amount) || 0;
        if (amt <= 0) return;
        const amtUsd = exp.currency === 'USD' ? amt : amt / rate;
        const amtRmb = exp.currency === 'RMB' ? amt : amt * rate;
        const expenseItem: ExpenseItem = {
          id: `exp_${Date.now()}_${idx}`,
          expenseNumber: `EXP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${idx}`,
          date: exp.date || payload.date || new Date().toISOString().split('T')[0],
          category: 'Transport',
          subType: 'Service Out-of-Pocket Cost',
          title: `${exp.title || 'Service Cost'} (${payload.serviceNumber}: ${payload.clientName || payload.title})`,
          amount: amt,
          currency: exp.currency,
          amountRmb: Number(amtRmb.toFixed(2)),
          amountUsd: Number(amtUsd.toFixed(2)),
          city: payload.cityLocation || 'Guangzhou',
          destinationRoute: `Service out-of-pocket for ${payload.serviceNumber}`,
          factoryOrPartner: exp.supplierOrPayee || payload.assignedPartner || payload.title,
          hasFapiao: exp.hasFapiao ?? true,
          paymentMethod: exp.paymentMethod || 'WeChat Pay',
          linkedServiceId: payload.id,
          notes: `Auto-recorded from Service Request ${payload.serviceNumber}. ${exp.notes || ''}`.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onSaveExpense(expenseItem);
      });
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

          {/* Section 8: Service Out-of-Pocket Expenses & Travel Costs */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[11px] uppercase font-bold tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Service Out-of-Pocket Expenses & Direct Costs</span>
                </h3>
                {serviceExpenses && serviceExpenses.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-mono">
                    <Coins className="w-3 h-3 text-emerald-600" />
                    {serviceExpenses.length} {serviceExpenses.length === 1 ? 'Cost' : 'Costs'} • {formatCurrency(totalExpenses.usd, 'USD')} (¥{formatCurrency(totalExpenses.rmb, 'RMB')})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Travel, Gaotie train, hotel nights, Didi, per diem meals, official fees)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  id="service-add-custom-expense-btn"
                  onClick={() => handleAddExpense()}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md transition flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Add Expense</span>
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider shrink-0">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() =>
                  handleAddExpense({
                    title: 'High-Speed Rail Gaotie Ticket',
                    amount: 260,
                    currency: 'RMB',
                    supplierOrPayee: 'China Railway (12306)',
                    paymentMethod: 'Alipay',
                    hasFapiao: true,
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
              >
                + Gaotie Train (¥260)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddExpense({
                    title: 'Didi Taxi / City Ride',
                    amount: 80,
                    currency: 'RMB',
                    supplierOrPayee: 'Didi Chuxing (滴滴出行)',
                    paymentMethod: 'WeChat Pay',
                    hasFapiao: true,
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
              >
                + Didi Taxi (¥80)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddExpense({
                    title: 'Hotel & Lodging Night',
                    amount: 350,
                    currency: 'RMB',
                    supplierOrPayee: 'Hotel',
                    paymentMethod: 'WeChat Pay',
                    hasFapiao: true,
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
              >
                + Hotel Night (¥350)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddExpense({
                    title: 'Daily Per Diem Meals & Food',
                    amount: 120,
                    currency: 'RMB',
                    supplierOrPayee: 'Restaurant / Per Diem',
                    paymentMethod: 'WeChat Pay',
                    hasFapiao: false,
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
              >
                + Meals / Food (¥120)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAddExpense({
                    title: 'Official / Notary / Government Fee',
                    amount: 500,
                    currency: 'RMB',
                    supplierOrPayee: 'Administration Bureau / Notary',
                    paymentMethod: 'Bank Transfer',
                    hasFapiao: true,
                  })
                }
                className="px-2.5 py-1 rounded text-[11px] font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
              >
                + Official Fee (¥500)
              </button>
            </div>

            {/* Expenses List */}
            {serviceExpenses && serviceExpenses.length > 0 ? (
              <div className="space-y-2.5">
                {serviceExpenses.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    {/* Top Row: Description & Amount */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {/* Custom Title Input */}
                      <input
                        type="text"
                        placeholder="What is this expense for? (e.g. Gaotie to Dongguan, Hotel night, Didi ride...)"
                        value={exp.title || ''}
                        onChange={(e) => handleUpdateExpense(idx, { title: e.target.value })}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-emerald-500 font-medium"
                      />

                      {/* Currency & Amount Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateExpense(idx, { currency: 'RMB' })}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                              exp.currency === 'RMB'
                                ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            ¥ RMB
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateExpense(idx, { currency: 'USD' })}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                              exp.currency === 'USD'
                                ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            $ USD
                          </button>
                        </div>

                        <div className="relative w-28 sm:w-32">
                          <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">
                            {exp.currency === 'USD' ? '$' : '¥'}
                          </span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0.00"
                            value={exp.amount || ''}
                            onChange={(e) =>
                              handleUpdateExpense(idx, { amount: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full pl-6 pr-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-none focus:border-emerald-500 text-right bg-white"
                          />
                        </div>

                        {/* Live Conversion indicator */}
                        <div className="hidden sm:block text-[11px] font-mono text-slate-400 min-w-[70px] text-right">
                          {exp.currency === 'RMB'
                            ? `≈ $${((Number(exp.amount) || 0) / rate).toFixed(2)}`
                            : `≈ ¥${((Number(exp.amount) || 0) * rate).toFixed(2)}`}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          title="Remove this expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-row: Payee, Date, Method, Fapiao */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div className="sm:col-span-4 min-w-0">
                        <input
                          type="text"
                          placeholder="Payee / Supplier (e.g. 12306, Hotel, Didi)"
                          value={exp.supplierOrPayee || ''}
                          onChange={(e) => handleUpdateExpense(idx, { supplierOrPayee: e.target.value })}
                          className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-3 min-w-0">
                        <input
                          type="date"
                          value={exp.date || ''}
                          onChange={(e) => handleUpdateExpense(idx, { date: e.target.value })}
                          className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3 min-w-0">
                        <select
                          value={exp.paymentMethod || 'WeChat Pay'}
                          onChange={(e) => handleUpdateExpense(idx, { paymentMethod: e.target.value as any })}
                          className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-none focus:border-emerald-500 text-slate-700"
                        >
                          <option value="WeChat Pay">WeChat Pay (微信)</option>
                          <option value="Alipay">Alipay (支付宝)</option>
                          <option value="Bank Transfer">Bank Transfer (对公/个人转账)</option>
                          <option value="Cash">Cash (现金)</option>
                          <option value="Credit Card">Credit Card (信用卡)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-start sm:justify-end">
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={exp.hasFapiao ?? true}
                            onChange={(e) => handleUpdateExpense(idx, { hasFapiao: e.target.checked })}
                            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span>发票 Fapiao</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center space-y-1.5">
                <Receipt className="w-6 h-6 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">
                  No service-specific expenses recorded yet
                </div>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Track Gaotie tickets, hotel nights, Didi rides, per diem meals, or official fees directly inside this service request.
                </p>
              </div>
            )}

            {/* Auto-log to China Business Expenses checkbox */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
              <label htmlFor="service-sync-expenses-chk" className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="service-sync-expenses-chk"
                  checked={alsoLogToExpenses}
                  onChange={(e) => setAlsoLogToExpenses(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="font-semibold text-slate-700">Auto-sync recorded expenses to China Business Expenses table</span>
              </label>
              <span className="text-[11px] text-slate-400 hidden sm:inline">Keeps company P&L and expense books in sync</span>
            </div>

            {/* Consolidated Net Profit Summary Card */}
            <div className="bg-slate-900 text-white rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center shadow-xs">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Client Billed Fee
                </div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">
                  {formData.quoteCurrency === 'USD' ? '$' : '¥'}{Number(formData.clientFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  ({formData.quoteCurrency === 'USD' ? `¥${(Number(formData.clientFee || 0) * rate).toFixed(2)}` : `$${(Number(formData.clientFee || 0) / rate).toFixed(2)}`})
                </div>
              </div>

              <div>
                <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                  Service Partner Cost
                </div>
                <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
                  -{formData.quoteCurrency === 'USD' ? '$' : '¥'}{Number(formData.estimatedCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-amber-400/80">
                  (-{formData.quoteCurrency === 'USD' ? `¥${(Number(formData.estimatedCost || 0) * rate).toFixed(2)}` : `$${(Number(formData.estimatedCost || 0) / rate).toFixed(2)}`})
                </div>
              </div>

              <div>
                <div className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">
                  Service Expenses ({serviceExpenses.length})
                </div>
                <div className="text-sm font-bold font-mono text-rose-300 mt-0.5">
                  -{formatCurrency(totalExpenses.usd, 'USD')}
                </div>
                <div className="text-[10px] font-mono text-rose-300/80">
                  (-¥{formatCurrency(totalExpenses.rmb, 'RMB')})
                </div>
              </div>

              <div className="bg-slate-800/90 rounded-md p-1.5 border border-slate-700">
                <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                  Adjusted Net Profit
                </div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  +${Number(formData.netProfitAfterExpensesUsd ?? formData.estimatedProfitUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-emerald-400/80">
                  (+¥{Number(formData.netProfitAfterExpensesRmb ?? formData.estimatedProfitRmb ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </div>
              </div>
            </div>
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

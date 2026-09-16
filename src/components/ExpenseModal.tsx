import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  MapPin,
  Calendar,
  Building2,
  Train,
  Hotel,
  Utensils,
  Car,
  Wifi,
  MoreHorizontal,
  FileCheck,
  CreditCard,
} from 'lucide-react';
import {
  ExpenseItem,
  ExpenseCategory,
  ExpensePaymentMethod,
  ExchangeRates,
  CurrencyUnit,
  ServiceRequest,
} from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpenseItem) => void;
  expenseToEdit?: ExpenseItem | null;
  exchangeRates: ExchangeRates;
  services?: ServiceRequest[];
  existingExpenses?: ExpenseItem[];
}

const CATEGORIES: {
  category: ExpenseCategory;
  icon: React.FC<{ className?: string }>;
  defaultSubtypes: string[];
}[] = [
  {
    category: 'Transport',
    icon: Train,
    defaultSubtypes: [
      'Gaotie / High-Speed Train',
      'Didi / Taxi',
      'Domestic Flight',
      'Intercity Bus',
      'Metro / Subway',
      'Expressway Toll (ETC)',
    ],
  },
  {
    category: 'Hotel & Accommodation',
    icon: Hotel,
    defaultSubtypes: [
      'Business Hotel',
      'Factory Zone Hotel',
      'Airport Hotel',
      'Apartment / Airbnb',
    ],
  },
  {
    category: 'Food & Meals',
    icon: Utensils,
    defaultSubtypes: [
      'Factory Lunch with Boss',
      'Client / Supplier Dinner',
      'Daily Meal Allowance',
      'Coffee & Refreshments',
    ],
  },
  {
    category: 'Factory Escort & Driver',
    icon: Car,
    defaultSubtypes: [
      'Private Driver Day Hire',
      'Factory Inspection Escort',
      'Cargo Van / Loading',
    ],
  },
  {
    category: 'SIM, VPN & Supplies',
    icon: Wifi,
    defaultSubtypes: [
      'China Mobile / Unicom 5G SIM',
      'VPN & Data Roaming',
      'Factory PPE & Safety Gear',
      'Office & Inspection Tools',
    ],
  },
  {
    category: 'Other / Miscellaneous',
    icon: MoreHorizontal,
    defaultSubtypes: [
      'SF Express (顺丰) Courier',
      'Sample Freight',
      'Notary & Printing Fees',
      'Emergency Errand',
    ],
  },
];

const POPULAR_CHINA_CITIES = [
  'Guangzhou',
  'Shenzhen',
  'Yiwu',
  'Dongguan',
  'Foshan',
  'Ningbo',
  'Hangzhou',
  'Shanghai',
  'Zhongshan',
  'Huizhou',
  'Xiamen',
  'Qingdao',
  'Beijing',
  'Wenzhou',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  exchangeRates,
  services = [],
  existingExpenses = [],
}) => {
  const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;

  const [formData, setFormData] = useState<Partial<ExpenseItem>>({
    expenseNumber: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Transport',
    subType: 'Gaotie / High-Speed Train',
    title: '',
    amount: 100,
    currency: 'RMB',
    amountRmb: 100,
    amountUsd: 100 / rate,
    city: 'Guangzhou',
    destinationRoute: '',
    factoryOrPartner: '',
    hasFapiao: true,
    paymentMethod: 'WeChat Pay',
    linkedServiceId: '',
    notes: '',
  });

  useEffect(() => {
    if (expenseToEdit) {
      setFormData(expenseToEdit);
    } else {
      const year = new Date().getFullYear();
      const prefix = `EXP-${year}-`;
      let maxNum = 0;
      existingExpenses.forEach((exp) => {
        if (exp.expenseNumber && exp.expenseNumber.startsWith(prefix)) {
          const num = parseInt(exp.expenseNumber.replace(prefix, ''), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      const nextNum = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

      setFormData({
        id: `exp_${Date.now()}`,
        expenseNumber: nextNum,
        date: new Date().toISOString().split('T')[0],
        category: 'Transport',
        subType: 'Gaotie / High-Speed Train',
        title: '',
        amount: 200,
        currency: 'RMB',
        amountRmb: 200,
        amountUsd: Number((200 / rate).toFixed(2)),
        city: 'Guangzhou',
        destinationRoute: '',
        factoryOrPartner: '',
        hasFapiao: true,
        paymentMethod: 'WeChat Pay',
        linkedServiceId: '',
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [expenseToEdit, isOpen, rate, existingExpenses]);

  if (!isOpen) return null;

  const handleAmountChange = (val: number, curr: CurrencyUnit) => {
    const amt = Math.max(0, val);
    let amtRmb = amt;
    let amtUsd = Number((amt / rate).toFixed(2));
    if (curr === 'USD') {
      amtUsd = amt;
      amtRmb = Number((amt * rate).toFixed(2));
    }
    setFormData((prev) => ({
      ...prev,
      amount: amt,
      currency: curr,
      amountRmb: amtRmb,
      amountUsd: amtUsd,
    }));
  };

  const handleCategorySelect = (cat: ExpenseCategory) => {
    const config = CATEGORIES.find((c) => c.category === cat);
    const defaultSub = config?.defaultSubtypes[0] || '';
    setFormData((prev) => ({
      ...prev,
      category: cat,
      subType: defaultSub,
    }));
  };

  const currentCategoryConfig = CATEGORIES.find((c) => c.category === formData.category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Please enter an expense title or brief description');
      return;
    }
    const finalAmount = Number(formData.amount) || 0;
    const curr = formData.currency || 'RMB';
    let amtRmb = curr === 'RMB' ? finalAmount : Number((finalAmount * rate).toFixed(2));
    let amtUsd = curr === 'USD' ? finalAmount : Number((finalAmount / rate).toFixed(2));

    const finalExpense: ExpenseItem = {
      id: formData.id || `exp_${Date.now()}`,
      expenseNumber: formData.expenseNumber || `EXP-${Date.now().toString().slice(-4)}`,
      date: formData.date || new Date().toISOString().split('T')[0],
      category: formData.category || 'Transport',
      subType: formData.subType || '',
      title: formData.title.trim(),
      amount: finalAmount,
      currency: curr,
      amountRmb: amtRmb,
      amountUsd: amtUsd,
      city: formData.city || 'Guangzhou',
      destinationRoute: formData.destinationRoute || '',
      factoryOrPartner: formData.factoryOrPartner || '',
      hasFapiao: Boolean(formData.hasFapiao),
      paymentMethod: (formData.paymentMethod as ExpensePaymentMethod) || 'WeChat Pay',
      linkedServiceId: formData.linkedServiceId || '',
      notes: formData.notes || '',
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(finalExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                {expenseToEdit ? 'Edit China Business Expense' : 'Log Factory & Travel Expense'}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">
                Transport, hotels, meals & relocation costs across China
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Category Selector Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.category;
                return (
                  <button
                    key={cat.category}
                    type="button"
                    onClick={() => handleCategorySelect(cat.category)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-600' : 'text-slate-500'}`} />
                    <span className="truncate">{cat.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtype quick picker */}
          {currentCategoryConfig && currentCategoryConfig.defaultSubtypes.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Specific Type:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {currentCategoryConfig.defaultSubtypes.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFormData({ ...formData, subType: st })}
                    className={`px-2 py-1 text-[11px] rounded-full border transition font-medium ${
                      formData.subType === st
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expense Description / Purpose <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. High-speed train Guangzhou South to Yiwu (overnight sourcing)"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white font-medium"
            />
          </div>

          {/* Amount & Currency with Live Conversion */}
          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                Expense Amount & Payment
              </span>
              <div className="flex items-center gap-1 text-[11px] text-amber-800">
                <span>Rate: $1 = ¥{rate.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Amount input */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Amount Spent
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-500">
                      {formData.currency === 'RMB' ? '¥' : '$'}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={formData.amount ?? ''}
                      onChange={(e) =>
                        handleAmountChange(parseFloat(e.target.value) || 0, formData.currency || 'RMB')
                      }
                      className="w-full pl-6 pr-3 py-1.5 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Currency Switcher */}
                  <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleAmountChange(Number(formData.amount) || 0, 'RMB')
                      }
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                        formData.currency === 'RMB'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ¥ RMB
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAmountChange(Number(formData.amount) || 0, 'USD')
                      }
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                        formData.currency === 'USD'
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      $ USD
                    </button>
                  </div>
                </div>
              </div>

              {/* Normalized live conversion badge */}
              <div className="bg-white p-2.5 rounded-lg border border-amber-200 flex flex-col justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                  Converted Equivalent
                </span>
                <span className="text-sm font-bold font-mono text-slate-800">
                  {formData.currency === 'RMB'
                    ? `$${(formData.amountUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `¥${(formData.amountRmb || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className="text-[10px] text-slate-500">
                  {formData.currency === 'RMB' ? 'in US Dollars' : 'in Chinese Yuan'}
                </span>
              </div>
            </div>

            {/* Payment Method & Fapiao */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-100">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod || 'WeChat Pay'}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value as ExpensePaymentMethod })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:border-amber-500"
                >
                  <option value="WeChat Pay">WeChat Pay (微信支付)</option>
                  <option value="Alipay">Alipay (支付宝)</option>
                  <option value="Credit Card">Credit Card / Visa / MC</option>
                  <option value="Cash (RMB)">Cash RMB (现金)</option>
                  <option value="Bank Transfer">Bank Transfer (对公/网银)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-5">
                <input
                  type="checkbox"
                  id="has-fapiao-checkbox"
                  checked={formData.hasFapiao ?? true}
                  onChange={(e) => setFormData({ ...formData, hasFapiao: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="has-fapiao-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Have Fapiao / Official VAT Invoice (发票)
                </label>
              </div>
            </div>
          </div>

          {/* Location, Route & Factory Information */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              Location & Factory Travel Route in China
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* City with Quick Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  City in China
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Dongguan, Yiwu, Foshan"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="flex-1 min-w-0 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium"
                  />
                  <select
                    aria-label="Quick China city select"
                    onChange={(e) => {
                      if (e.target.value) setFormData({ ...formData, city: e.target.value });
                    }}
                    className="shrink-0 max-w-[95px] px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Quick City
                    </option>
                    {POPULAR_CHINA_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  Expense Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium text-slate-800"
                />
              </div>

              {/* Route */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Route / Travel Trajectory
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shenzhen North -> Dongguan Tangxia Factory"
                  value={formData.destinationRoute || ''}
                  onChange={(e) => setFormData({ ...formData, destinationRoute: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium"
                />
              </div>

              {/* Factory / Supplier visited */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-500" />
                  Factory / Supplier Visited
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dongguan Precision Plastic Mold Co."
                  value={formData.factoryOrPartner || ''}
                  onChange={(e) => setFormData({ ...formData, factoryOrPartner: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-medium"
                />
              </div>
            </div>

            {/* Optional link to Service */}
            {services.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Link to Client Service Request (Optional):
                </label>
                <select
                  value={formData.linkedServiceId || ''}
                  onChange={(e) => setFormData({ ...formData, linkedServiceId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                >
                  <option value="">-- No specific linked service --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceNumber}: {s.title} ({s.clientName} - {s.cityLocation || 'China'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes & Trip Details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Toll receipts included in Didi. Checked 3 mold samples during lunch."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition active:scale-95"
            >
              {expenseToEdit ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  MessageCircle,
  ExternalLink,
  Phone,
  Mail,
  Building2,
  Globe,
  MapPin,
  Anchor,
  DollarSign,
  Send,
  PhoneCall,
  Sparkles,
  Info,
} from 'lucide-react';
import { Customer } from '../types';
import {
  COUNTRIES,
  findCountry,
  getCountryFlag,
  cleanPhoneNumber,
  getWhatsAppWebUrl,
  getWhatsAppMessengerUrl,
  openWhatsAppMessenger,
  getWhatsAppUniversalUrl,
} from '../lib/countryFlags';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customerToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    company: '',
    type: 'Active',
    contactEmail: '',
    contactPhone: '',
    whatsapp: '',
    wechatId: '',
    country: 'United States',
    preferredCurrency: 'USD',
    destinationPort: '',
    shippingAddress: '',
    website: '',
    notes: '',
  });

  const [testMessage, setTestMessage] = useState('Hello, this is regarding your sourcing inquiry.');
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  useEffect(() => {
    if (customerToEdit) {
      setFormData({
        ...customerToEdit,
        country: customerToEdit.country || 'United States',
      });
    } else {
      setFormData({
        name: '',
        company: '',
        type: 'Active',
        contactEmail: '',
        contactPhone: '',
        whatsapp: '',
        wechatId: '',
        country: 'United States',
        preferredCurrency: 'USD',
        destinationPort: '',
        shippingAddress: '',
        website: '',
        notes: '',
      });
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const currentCountry = findCountry(formData.country);
  const countryFlag = getCountryFlag(formData.country);

  const handleCountrySelect = (countryName: string) => {
    const matched = findCountry(countryName);
    setFormData((prev) => {
      let updatedWhatsapp = prev.whatsapp || '';
      // If whatsapp is empty or just starting, suggest dialing code
      if (!updatedWhatsapp && matched?.dialCode) {
        updatedWhatsapp = `${matched.dialCode} `;
      }
      return {
        ...prev,
        country: countryName,
        whatsapp: updatedWhatsapp,
      };
    });
  };

  const handleOpenWhatsAppMessenger = () => {
    if (!formData.whatsapp) return;
    openWhatsAppMessenger(formData.whatsapp, testMessage);
  };

  const handleOpenWhatsAppWeb = () => {
    if (!formData.whatsapp) return;
    const url = getWhatsAppWebUrl(formData.whatsapp, testMessage);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const customer: Customer = {
      id: customerToEdit?.id || `cust_${Date.now()}`,
      name: formData.name.trim(),
      company: formData.company?.trim() || '',
      type: (formData.type as 'Active' | 'Potential' | 'VIP' | 'Past') || 'Active',
      contactEmail: formData.contactEmail?.trim() || '',
      contactPhone: formData.contactPhone?.trim() || '',
      whatsapp: formData.whatsapp?.trim() || '',
      wechatId: formData.wechatId?.trim() || '',
      country: formData.country?.trim() || 'United States',
      preferredCurrency: (formData.preferredCurrency as any) || 'USD',
      destinationPort: formData.destinationPort?.trim() || '',
      shippingAddress: formData.shippingAddress?.trim() || '',
      website: formData.website?.trim() || '',
      notes: formData.notes?.trim() || '',
      createdAt: customerToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(customer);
    onClose();
  };

  const cleanDigits = cleanPhoneNumber(formData.whatsapp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xl" title={formData.country || 'Country Flag'}>
              {countryFlag}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {customerToEdit ? 'Edit Client Profile' : 'Add New Client'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage contact channels, WhatsApp Web calling, and destination port
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Section 1: Basic Client Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Client / Contact Name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. John Doe, Sarah Connor"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Company / Brand Name
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Apex Trading LLC, Nordic Imports"
                  value={formData.company || ''}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Client Status
              </label>
              <select
                value={formData.type || 'Active'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium shadow-2xs cursor-pointer"
              >
                <option value="Active">🟢 Active Client</option>
                <option value="VIP">⭐ VIP / Key Account</option>
                <option value="Potential">🟡 Potential / Prospect</option>
                <option value="Past">⚪ Past Client</option>
              </select>
            </div>

            {/* Country with Flag Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Destination Country</span>
                <span className="text-[11px] font-normal text-slate-500 flex items-center gap-1">
                  <span>{countryFlag}</span>
                  <span>{currentCountry?.dialCode || ''}</span>
                </span>
              </label>
              <div className="relative">
                <select
                  id="client-country-select"
                  value={formData.country || 'United States'}
                  onChange={(e) => handleCountrySelect(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium shadow-2xs cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Direct WhatsApp Messenger & Web Redirect Banner */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Messenger Integration (Direct Chat & Call)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                Direct to Messenger
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                  WhatsApp Number (with country code)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">
                    {countryFlag}
                  </span>
                  <input
                    type="text"
                    placeholder={`e.g. ${currentCountry?.dialCode || '+1'} 555 123 4567`}
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-emerald-300 rounded-md text-xs text-slate-800 font-mono focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Digits detected: <strong className="font-mono">{cleanDigits || 'None yet'}</strong>
                </p>
              </div>

              <div className="flex flex-col justify-end gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenWhatsAppMessenger}
                    disabled={!cleanDigits}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Open directly in WhatsApp Messenger (com.whatsapp) - NOT WhatsApp Business"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Messenger</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWhatsAppWeb}
                    disabled={!cleanDigits}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 rounded-md text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Or open in WhatsApp Web browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Web</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium text-left underline underline-offset-2"
                >
                  {showWhatsAppPreview ? '▲ Hide Quick Greeting Note' : '▼ Pre-fill Greeting Message'}
                </button>
              </div>
            </div>

            {showWhatsAppPreview && (
              <div className="pt-2 border-t border-emerald-200/80">
                <label className="block text-[10px] font-semibold text-emerald-900 mb-1">
                  Pre-filled Message for WhatsApp Web:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-white border border-emerald-300 rounded text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Type custom note or inquiry greeting..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setTestMessage(
                        `Hello ${formData.name || 'Client'}, regarding your recent sourcing inquiry on our platform:`
                      )
                    }
                    className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-semibold transition"
                  >
                    Auto-fill Name
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Other Communication Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="client@company.com"
                  value={formData.contactEmail || ''}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Office / Mobile Phone"
                  value={formData.contactPhone || ''}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                WeChat ID
              </label>
              <input
                type="text"
                placeholder="WeChat username"
                value={formData.wechatId || ''}
                onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Section 4: Trade & Logistics Preferences */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-indigo-500" />
              <span>Trade, Logistics & Port Preferences</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Destination Port (POD)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Port of Long Beach, Hamburg"
                  value={formData.destinationPort || ''}
                  onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Preferred Currency
                </label>
                <select
                  value={formData.preferredCurrency || 'USD'}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredCurrency: e.target.value as any })
                  }
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="RMB">RMB (¥) - Chinese Yuan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Website / Store
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://brand.com"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full pl-7 pr-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                Full Shipping Address / Delivery Warehouse
              </label>
              <input
                type="text"
                placeholder="Street address, city, state/province, postal code"
                value={formData.shippingAddress || ''}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Section 5: Notes & Client Sourcing Requirements */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Internal Client Notes & Quality Requirements
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="e.g. Strict QC on packaging, prefers sea freight DDP, payment term: 30% deposit / 70% before shipping..."
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          {/* Modal Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              {cleanDigits && (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                  <MessageCircle className="w-3 h-3" /> WhatsApp ready ({cleanDigits})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-300 hover:bg-slate-50 transition shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition shadow-2xs flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Client</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

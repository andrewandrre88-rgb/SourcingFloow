import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Building2,
  MapPin,
  Globe,
  Anchor,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  Users,
  Star,
  PhoneCall,
  SlidersHorizontal,
  Package,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Customer, InquiryItem } from '../types';
import {
  getCountryFlag,
  cleanPhoneNumber,
  getWhatsAppWebUrl,
  getWhatsAppUniversalUrl,
} from '../lib/countryFlags';
import { formatCurrency } from '../lib/currency';

interface CustomersPageProps {
  customers: Customer[];
  inquiries?: InquiryItem[];
  onAdd: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCreateInquiryForCustomer?: (customer: Customer) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  customers,
  inquiries = [],
  onAdd,
  onEdit,
  onDelete,
  onCreateInquiryForCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Derive unique countries for filtering in alphabetical order
  const uniqueCountries = (
    Array.from(new Set(customers.map((c) => c.country?.trim()).filter(Boolean))) as string[]
  ).sort((a, b) => a.localeCompare(b));

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      searchTerm === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contactEmail && c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.whatsapp && c.whatsapp.includes(searchTerm)) ||
      (c.contactPhone && c.contactPhone.includes(searchTerm)) ||
      (c.wechatId && c.wechatId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.country && c.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.destinationPort && c.destinationPort.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    const matchesCountry = countryFilter === 'All' || c.country === countryFilter;

    return matchesSearch && matchesType && matchesCountry;
  });

  // Calculate client analytics
  const totalClients = customers.length;
  const activeClients = customers.filter((c) => c.type === 'Active').length;
  const vipClients = customers.filter((c) => c.type === 'VIP').length;
  const whatsappClients = customers.filter((c) => Boolean(cleanPhoneNumber(c.whatsapp))).length;

  const handleCopyContact = (customer: Customer) => {
    const text = `Client: ${customer.name}${customer.company ? ` (${customer.company})` : ''}
Country: ${customer.country || 'N/A'}
WhatsApp: ${customer.whatsapp || 'N/A'}
Email: ${customer.contactEmail || 'N/A'}
Phone: ${customer.contactPhone || 'N/A'}
WeChat: ${customer.wechatId || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(customer.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (customers.length === 0) return;
    const headers = [
      'Name',
      'Company',
      'Status',
      'Country',
      'WhatsApp',
      'Email',
      'Phone',
      'WeChat',
      'Destination Port',
      'Shipping Address',
      'Currency',
      'Website',
      'Notes',
    ];

    const rows = customers.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      c.type,
      `"${(c.country || '').replace(/"/g, '""')}"`,
      `"${(c.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(c.contactEmail || '').replace(/"/g, '""')}"`,
      `"${(c.contactPhone || '').replace(/"/g, '""')}"`,
      `"${(c.wechatId || '').replace(/"/g, '""')}"`,
      `"${(c.destinationPort || '').replace(/"/g, '""')}"`,
      `"${(c.shippingAddress || '').replace(/"/g, '""')}"`,
      c.preferredCurrency || 'USD',
      `"${(c.website || '').replace(/"/g, '""')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sourcing_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getClientInquiries = (customerName: string) => {
    if (!customerName || inquiries.length === 0) return [];
    return inquiries.filter(
      (i) => i.customerName?.trim().toLowerCase() === customerName.trim().toLowerCase()
    );
  };

  const getTypeBadge = (type: Customer['type']) => {
    switch (type) {
      case 'VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Star className="w-2.5 h-2.5 fill-purple-600 text-purple-600" />
            VIP Client
          </span>
        );
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        );
      case 'Potential':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Potential
          </span>
        );
      case 'Past':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Past
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Client KPI Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Clients</div>
            <div className="text-lg font-bold text-slate-900">{totalClients}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-base font-bold">🟢</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Clients</div>
            <div className="text-lg font-bold text-slate-900">{activeClients}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-purple-500 text-purple-500" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">VIP Accounts</div>
            <div className="text-lg font-bold text-slate-900">{vipClients}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">WhatsApp Ready</div>
            <div className="text-lg font-bold text-emerald-700">{whatsappClients}</div>
          </div>
        </div>
      </div>

      {/* Main Database Table & Control Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>Client Database & WhatsApp Hub</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] py-0.5 px-2 rounded-full font-bold">
                {filteredCustomers.length} shown
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Direct 1-click WhatsApp Web calling, country flags, and quotation history
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="client-search-input"
                type="text"
                placeholder="Search name, WhatsApp, country, port..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-2xs"
              />
            </div>

            {/* Type Filter */}
            <select
              id="client-status-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs text-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Active">Active</option>
              <option value="VIP">VIP</option>
              <option value="Potential">Potential</option>
              <option value="Past">Past</option>
            </select>

            {/* Country Filter */}
            {uniqueCountries.length > 0 && (
              <select
                id="client-country-filter"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="bg-white border border-slate-300 text-xs text-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-2xs font-medium cursor-pointer max-w-[140px]"
              >
                <option value="All">All Countries</option>
                {uniqueCountries.map((country) => (
                  <option key={country} value={country}>
                    {getCountryFlag(country)} {country}
                  </option>
                ))}
              </select>
            )}

            {/* View Mode Toggle */}
            <div className="flex border border-slate-300 rounded-md overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1.5 text-xs font-semibold ${
                  viewMode === 'table'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table view"
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1.5 text-xs font-semibold ${
                  viewMode === 'cards'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards view"
              >
                Cards
              </button>
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={customers.length === 0}
              className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded-md text-xs font-semibold transition disabled:opacity-40 shadow-2xs"
              title="Export all clients to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>

            {/* Add Client Button */}
            <button
              id="add-customer-top-btn"
              onClick={onAdd}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-semibold transition active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Comprehensive Table */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-2.5">Client & Company</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Country & Port</th>
                  <th className="px-4 py-2.5">Direct WhatsApp Web</th>
                  <th className="px-4 py-2.5">Other Contacts</th>
                  <th className="px-4 py-2.5 text-center">Inquiries</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const flag = getCountryFlag(customer.country);
                    const cleanPhone = cleanPhoneNumber(customer.whatsapp);
                    const webUrl = getWhatsAppWebUrl(
                      customer.whatsapp || '',
                      `Hello ${customer.name}, this is regarding your sourcing inquiry.`
                    );
                    const universalUrl = getWhatsAppUniversalUrl(customer.whatsapp || '');
                    const clientInquiries = getClientInquiries(customer.name);
                    const totalClientVolume = clientInquiries.reduce(
                      (sum, i) => sum + (i.totalQuotationUsd || 0),
                      0
                    );

                    return (
                      <tr
                        key={customer.id}
                        id={`client-row-${customer.id}`}
                        className="hover:bg-slate-50 transition"
                      >
                        {/* Name & Company */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                            <span>{customer.name}</span>
                            {customer.type === 'VIP' && (
                              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            )}
                          </div>
                          {customer.company && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{customer.company}</span>
                            </div>
                          )}
                          {customer.website && (
                            <a
                              href={
                                customer.website.startsWith('http')
                                  ? customer.website
                                  : `https://${customer.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                            >
                              <Globe className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[150px]">
                                {customer.website.replace(/^https?:\/\//, '')}
                              </span>
                            </a>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">{getTypeBadge(customer.type)}</td>

                        {/* Country with Flag & Port */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            <span className="text-base leading-none" title={customer.country}>
                              {flag}
                            </span>
                            <span>{customer.country || 'Global'}</span>
                          </div>
                          {customer.destinationPort && (
                            <div
                              className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"
                              title={`Destination Port: ${customer.destinationPort}`}
                            >
                              <Anchor className="w-2.5 h-2.5 text-indigo-500" />
                              <span>POD: {customer.destinationPort}</span>
                            </div>
                          )}
                        </td>

                        {/* WhatsApp Web Direct Launcher */}
                        <td className="px-4 py-3">
                          {cleanPhone ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-[11px] shadow-2xs transition active:scale-95 group"
                                title={`Open WhatsApp Web directly to chat/call: ${customer.whatsapp}`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Web</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-70 group-hover:opacity-100" />
                              </a>

                              <a
                                href={universalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-emerald-700 hover:bg-emerald-100/60 rounded border border-emerald-300 transition"
                                title="Open in WhatsApp Mobile / Desktop App (wa.me)"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </a>

                              <span className="text-[10px] font-mono text-slate-500 ml-1">
                                {customer.whatsapp}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No WhatsApp</span>
                          )}
                        </td>

                        {/* Other Contacts (Email, Phone, WeChat) */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {customer.contactEmail && (
                              <a
                                href={`mailto:${customer.contactEmail}`}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title={`Email: ${customer.contactEmail}`}
                              >
                                <Mail className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {customer.contactPhone && (
                              <a
                                href={`tel:${customer.contactPhone}`}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title={`Call: ${customer.contactPhone}`}
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {customer.wechatId && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(customer.wechatId || '');
                                  alert(`Copied WeChat ID: ${customer.wechatId}`);
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium hover:bg-emerald-100 transition"
                                title={`Click to copy WeChat ID: ${customer.wechatId}`}
                              >
                                WeChat: {customer.wechatId}
                              </button>
                            )}
                            {!customer.contactEmail &&
                              !customer.contactPhone &&
                              !customer.wechatId && (
                                <span className="text-slate-400 text-[11px]">-</span>
                              )}
                          </div>
                        </td>

                        {/* Linked Inquiries */}
                        <td className="px-4 py-3 text-center">
                          {clientInquiries.length > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {clientInquiries.length} order{clientInquiries.length > 1 ? 's' : ''}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500 font-semibold mt-0.5">
                                {formatCurrency(totalClientVolume, 'USD')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">No orders</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-1">
                            {/* Copy full contact info */}
                            <button
                              type="button"
                              onClick={() => handleCopyContact(customer)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                              title="Copy contact card to clipboard"
                            >
                              {copiedId === customer.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* New Inquiry for this client */}
                            {onCreateInquiryForCustomer && (
                              <button
                                type="button"
                                onClick={() => onCreateInquiryForCustomer(customer)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"
                                title="Create new sourcing quotation for this client"
                              >
                                <Package className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => onEdit(customer)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                              title="Edit Client details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => onDelete(customer)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              title="Delete Client"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-700">No clients match your filter</p>
                        <p className="text-xs text-slate-400">
                          {searchTerm
                            ? 'Try clearing your search query or status filter.'
                            : 'Click "+ Add Client" to create your first client profile.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* View Mode 2: Responsive Card Grid */
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => {
                const flag = getCountryFlag(customer.country);
                const cleanPhone = cleanPhoneNumber(customer.whatsapp);
                const webUrl = getWhatsAppWebUrl(
                  customer.whatsapp || '',
                  `Hello ${customer.name}, this is regarding your sourcing inquiry.`
                );
                const universalUrl = getWhatsAppUniversalUrl(customer.whatsapp || '');
                const clientInquiries = getClientInquiries(customer.name);

                return (
                  <div
                    key={customer.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between gap-3"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl" title={customer.country}>
                              {flag}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{customer.name}</span>
                          </div>
                          {customer.company && (
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span>{customer.company}</span>
                            </div>
                          )}
                        </div>
                        {getTypeBadge(customer.type)}
                      </div>

                      {/* Details & Destination */}
                      <div className="mt-3 text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Country:</span>
                          <span className="font-medium">
                            {flag} {customer.country || 'Global'}
                          </span>
                        </div>
                        {customer.destinationPort && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Port of Discharge:</span>
                            <span className="font-medium">{customer.destinationPort}</span>
                          </div>
                        )}
                        {customer.contactEmail && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Email:</span>
                            <a
                              href={`mailto:${customer.contactEmail}`}
                              className="text-indigo-600 hover:underline truncate max-w-[160px]"
                            >
                              {customer.contactEmail}
                            </a>
                          </div>
                        )}
                        {clientInquiries.length > 0 && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-400 text-[11px]">Sourcing Inquiries:</span>
                            <span className="font-bold text-indigo-700">
                              {clientInquiries.length} order{clientInquiries.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {customer.notes && (
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic">
                          "{customer.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {cleanPhone ? (
                        <div className="flex items-center gap-1.5">
                          <a
                            href={webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-2xs transition"
                            title="Open WhatsApp Web to chat or call"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp Web</span>
                          </a>
                          <a
                            href={universalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-emerald-800 hover:bg-emerald-50 border border-emerald-300 rounded-md transition"
                            title="Call via mobile/desktop app"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No WhatsApp</span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyContact(customer)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition"
                          title="Copy details"
                        >
                          {copiedId === customer.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(customer)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                          title="Edit client"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(customer)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-slate-500">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No clients match your search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

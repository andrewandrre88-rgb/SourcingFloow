import React, { useState } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Phone,
  MessageCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Sparkles,
  Stethoscope,
  Building2,
  ShieldCheck,
  Languages,
  Scale,
  Plane,
  Boxes,
  Award,
  FlaskConical,
  HelpCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  Download,
  DollarSign,
  Layers,
  ArrowUpDown,
  User,
  AlertCircle,
} from 'lucide-react';
import {
  ServiceRequest,
  ServiceCategory,
  ServiceStatus,
  ExchangeRates,
  CurrencyViewMode,
} from '../types';
import { formatCurrency } from '../lib/currency';
import { cleanPhoneNumber, openWhatsAppMessenger } from '../lib/countryFlags';

interface ServicesPageProps {
  services: ServiceRequest[];
  exchangeRates: ExchangeRates;
  currencyView: CurrencyViewMode;
  onAdd: () => void;
  onEdit: (service: ServiceRequest) => void;
  onView: (service: ServiceRequest) => void;
  onDelete: (service: ServiceRequest) => void;
  onStatusChange: (service: ServiceRequest, status: ServiceStatus) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  services,
  exchangeRates,
  currencyView,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [cityFilter, setCityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'cards' : 'table'
  );
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRequest | null>(null);

  const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Medical & Clinic Assistance':
        return Stethoscope;
      case 'Company Registration':
        return Building2;
      case 'Factory Audit & Verification':
        return ShieldCheck;
      case 'Translation & Business Escort':
        return Languages;
      case 'Legal & Contract Review':
        return Scale;
      case 'Visa & Travel Support':
        return Plane;
      case 'Warehousing & Logistics':
        return Boxes;
      case 'Trademark & IP':
        return Award;
      case 'Sample Lab Testing':
        return FlaskConical;
      default:
        return Sparkles;
    }
  };

  // Derive unique cities
  const uniqueCities = Array.from(
    new Set(services.map((s) => s.cityLocation?.trim()).filter(Boolean))
  ) as string[];

  // Filter services
  const filteredServices = services.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.serviceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cityLocation && s.cityLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.assignedPartner && s.assignedPartner.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesCity = cityFilter === 'All' || s.cityLocation === cityFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesCity;
  });

  // Calculate Metrics
  const totalRequests = services.length;
  const inProgressRequests = services.filter((s) => s.status === 'In Progress').length;
  const completedRequests = services.filter((s) => s.status === 'Completed').length;
  const totalProfitUsd = services.reduce((sum, s) => sum + (s.estimatedProfitUsd || 0), 0);
  const totalProfitRmb = totalProfitUsd * rate;
  const totalClientFeesUsd = services.reduce(
    (sum, s) => sum + (s.quoteCurrency === 'RMB' ? s.clientFee / rate : s.clientFee),
    0
  );

  const handleExportCsv = () => {
    const headers = [
      'Service Number',
      'Date',
      'Client Name',
      'Country',
      'Category',
      'Title',
      'City',
      'Status',
      'Client Fee',
      'China Cost',
      'Net Profit (USD)',
      'Net Profit (RMB)',
      'Payment Status',
      'Assigned Partner',
    ];

    const rows = filteredServices.map((s) => [
      `"${s.serviceNumber}"`,
      `"${s.date}"`,
      `"${s.clientName.replace(/"/g, '""')}"`,
      `"${s.country || ''}"`,
      `"${s.category}"`,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.cityLocation || ''}"`,
      `"${s.status}"`,
      s.clientFee,
      s.estimatedCost,
      (s.estimatedProfitUsd || 0).toFixed(2),
      (s.estimatedProfitRmb || 0).toFixed(2),
      `"${s.paymentStatus}"`,
      `"${(s.assignedPartner || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `China_Services_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Total Services */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Services</span>
            <div className="p-1 sm:p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mt-1 font-mono">{totalRequests}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">China concierge & tasks</div>
        </div>

        {/* In Progress */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">In Progress</span>
            <div className="p-1 sm:p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold text-blue-700 mt-1 font-mono">{inProgressRequests}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Active on-ground tasks</div>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Completed</span>
            <div className="p-1 sm:p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-bold text-emerald-700 mt-1 font-mono">{completedRequests}</div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">Fulfilled requests</div>
        </div>

        {/* Total Service Profit */}
        <div className="bg-white border border-emerald-200 rounded-xl p-2.5 sm:p-3 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-700">Total Profit</span>
            <div className="p-1 sm:p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
              <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg lg:text-xl font-extrabold text-emerald-700 mt-1 font-mono">
            +${totalProfitUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-mono font-medium mt-0.5 truncate">
            +¥{totalProfitRmb.toLocaleString(undefined, { maximumFractionDigits: 0 })} net take-home
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, New Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search services, clients, clinics, company registration, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-7 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 sm:top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Cards
              </button>
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              title="Export filtered services to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* New Service Request */}
            <button
              type="button"
              id="services-add-new-btn"
              onClick={onAdd}
              className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Service</span>
            </button>
          </div>
        </div>

        {/* Filter Pills / Dropdowns */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px] sm:text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-slate-200 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500 max-w-[160px] sm:max-w-none truncate"
          >
            <option value="All">All Categories ({services.length})</option>
            <option value="Medical & Clinic Assistance">Medical & Clinic Assistance</option>
            <option value="Company Registration">Company Registration</option>
            <option value="Factory Audit & Verification">Factory Audit & Verification</option>
            <option value="Translation & Business Escort">Translation & Business Escort</option>
            <option value="Legal & Contract Review">Legal & Contract Review</option>
            <option value="Visa & Travel Support">Visa & Travel Support</option>
            <option value="Warehousing & Logistics">Warehousing & Logistics</option>
            <option value="Sample Lab Testing">Sample Lab Testing</option>
            <option value="Concierge & Personal Request">Concierge & Personal</option>
            <option value="Other Service">Other Service</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-slate-200 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="New Request">New Request</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Client">Waiting for Client</option>
            <option value="Waiting for China Partner">Waiting for China Partner</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* City Filter */}
          {uniqueCities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-slate-200 rounded-md bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}

          {(categoryFilter !== 'All' || statusFilter !== 'All' || cityFilter !== 'All' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('All');
                setStatusFilter('All');
                setCityFilter('All');
                setSearchTerm('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline ml-auto py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Table or Cards */}
      {filteredServices.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No services found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
            Record client service requests in China: finding a clinic or hospital appointment for an uncle, company registration in Shenzhen, full-time translators in Yiwu, or factory audits.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Service Request</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-3.5 whitespace-nowrap">Ref # / Date</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Category</th>
                  <th className="py-3 px-3.5">Service Title & Scope</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Client</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Location</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-right">Fee / Cost</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-right">Net Profit</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service) => {
                  const Icon = getCategoryIcon(service.category);
                  const cleanPhone = cleanPhoneNumber(service.clientContact);

                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-slate-50/70 transition cursor-pointer group"
                      onClick={() => onView(service)}
                    >
                      {/* Ref & Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {service.serviceNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{service.date}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                          <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[130px]">{service.category}</span>
                        </div>
                      </td>

                      {/* Title & Scope */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 line-clamp-1 max-w-sm sm:max-w-md">
                          {service.title}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-sm sm:max-w-md mt-0.5">
                          {service.description}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="font-semibold text-slate-900">{service.clientName}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                          {service.country && <span className="text-slate-500">{service.country}</span>}
                          {cleanPhone && (
                            <button
                              type="button"
                              onClick={() => openWhatsAppMessenger(cleanPhone, `Hello ${service.clientName}, regarding your service ${service.serviceNumber}...`)}
                              className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 font-medium"
                              title="Open WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>{service.cityLocation || 'Guangzhou'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={service.status}
                          onChange={(e) => onStatusChange(service, e.target.value as ServiceStatus)}
                          className={`text-[11px] font-bold py-1 px-2 rounded-full border focus:outline-none ${
                            service.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : service.status === 'In Progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : service.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <option value="New Request">New Request</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Waiting for Client">Waiting Client</option>
                          <option value="Waiting for China Partner">Waiting Partner</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Fee / Cost */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono">
                        <div className="font-bold text-slate-900">
                          {service.quoteCurrency === 'USD' ? '$' : '¥'}{service.clientFee.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cost: {service.quoteCurrency === 'USD' ? '$' : '¥'}{service.estimatedCost.toLocaleString()}
                        </div>
                      </td>

                      {/* Net Profit */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono">
                        <div className="font-bold text-emerald-700">
                          +${(service.netProfitAfterExpensesUsd ?? service.estimatedProfitUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-600/80">
                          +¥{(service.netProfitAfterExpensesRmb ?? service.estimatedProfitRmb ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        {Boolean(service.totalTravelCostRmb && service.totalTravelCostRmb > 0) && (
                          <div className="text-[9px] font-sans font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 mt-0.5 inline-block">
                            Travel: ¥{service.totalTravelCostRmb.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onView(service)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(service)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id={`service-table-delete-btn-${service.id}`}
                            aria-label={`Delete service ${service.serviceNumber}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setServiceToDelete(service);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-md transition duration-150 active:scale-95 cursor-pointer group/del"
                            title="Delete Service Request"
                          >
                            <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredServices.map((service) => {
            const Icon = getCategoryIcon(service.category);
            const cleanPhone = cleanPhoneNumber(service.clientContact);

            return (
              <div
                key={service.id}
                onClick={() => onView(service)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-indigo-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  {/* Top row: Number, Category, Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {service.serviceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        service.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : service.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : service.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1.5">
                    {service.title}
                  </h4>

                  {/* Scope / Description */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {service.description}
                  </p>

                  {/* Client & City pills */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{service.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500 shrink-0">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span>{service.cityLocation || 'China'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Financials & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70 -mx-4 -mb-4 p-3 rounded-b-xl" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-emerald-700">
                      {service.totalTravelCostRmb ? 'Net Profit (After Travel)' : 'Net Profit'}
                    </div>
                    <div className="text-sm font-extrabold text-emerald-700 font-mono">
                      +${(service.netProfitAfterExpensesUsd ?? service.estimatedProfitUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {Boolean(service.totalTravelCostRmb && service.totalTravelCostRmb > 0) && (
                      <div className="text-[10px] font-mono text-amber-800">
                        Travel: ¥{service.totalTravelCostRmb.toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {cleanPhone && (
                      <button
                        type="button"
                        onClick={() => openWhatsAppMessenger(cleanPhone, `Hello ${service.clientName}...`)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(service)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      id={`service-card-delete-btn-${service.id}`}
                      aria-label={`Delete service ${service.serviceNumber}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setServiceToDelete(service);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition duration-150 active:scale-95 cursor-pointer group/del"
                      title="Delete Service Request"
                    >
                      <Trash2 className="w-4 h-4 transition-transform group-hover/del:scale-110" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal (Reliable in all browser/iframe contexts) */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Service Request?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to delete <span className="font-mono font-bold text-slate-900">{serviceToDelete.serviceNumber}</span> (
              <span className="font-semibold text-slate-800">{serviceToDelete.title}</span>) for client{' '}
              <span className="font-medium text-slate-900">{serviceToDelete.clientName}</span>?
            </p>
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg mt-3 text-[11px] text-rose-700 flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>This record and linked profit metrics will be permanently deleted.</span>
            </div>
            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                type="button"
                id="cancel-service-delete-btn"
                onClick={() => setServiceToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-service-delete-btn"
                onClick={() => {
                  const toDelete = serviceToDelete;
                  setServiceToDelete(null);
                  onDelete(toDelete);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-xs transition cursor-pointer"
              >
                Yes, Delete Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

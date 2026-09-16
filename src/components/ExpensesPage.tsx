import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Train,
  Hotel,
  Utensils,
  Car,
  Wifi,
  MoreHorizontal,
  MapPin,
  Calendar,
  Building2,
  FileCheck,
  Download,
  Filter,
  Trash2,
  Edit2,
  LayoutGrid,
  Table as TableIcon,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import {
  ExpenseItem,
  ExpenseCategory,
  ExchangeRates,
  CurrencyViewMode,
  ServiceRequest,
} from '../types';

interface ExpensesPageProps {
  expenses: ExpenseItem[];
  exchangeRates: ExchangeRates;
  currencyView: CurrencyViewMode;
  services?: ServiceRequest[];
  onAdd: () => void;
  onEdit: (expense: ExpenseItem) => void;
  onDelete: (expenseId: string) => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({
  expenses,
  exchangeRates,
  currencyView,
  services = [],
  onAdd,
  onEdit,
  onDelete,
}) => {
  const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [fapiaoFilter, setFapiaoFilter] = useState<'All' | 'With Fapiao' | 'No Fapiao'>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);

  // Format amount according to currency preference
  const formatAmount = (amtUsd: number, amtRmb: number) => {
    if (currencyView === 'RMB') {
      return `¥${(amtRmb || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currencyView === 'USD') {
      return `$${(amtUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // DUAL
    return `$${(amtUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ¥${(amtRmb || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Extract unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.city) set.add(e.city);
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (selectedCity !== 'All' && e.city !== selectedCity) return false;
      if (fapiaoFilter === 'With Fapiao' && !e.hasFapiao) return false;
      if (fapiaoFilter === 'No Fapiao' && e.hasFapiao) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesCity = e.city?.toLowerCase().includes(q);
        const matchesRoute = e.destinationRoute?.toLowerCase().includes(q);
        const matchesFactory = (e.factoryOrPartner || e.factoryOrSupplier)?.toLowerCase().includes(q);
        const matchesNotes = e.notes?.toLowerCase().includes(q);
        const matchesSub = e.subType?.toLowerCase().includes(q);
        const matchesNum = e.expenseNumber?.toLowerCase().includes(q);
        return (
          matchesTitle ||
          matchesCity ||
          matchesRoute ||
          matchesFactory ||
          matchesNotes ||
          matchesSub ||
          matchesNum
        );
      }
      return true;
    });
  }, [expenses, selectedCategory, selectedCity, fapiaoFilter, searchQuery]);

  // Financial KPI totals
  const stats = useMemo(() => {
    let totalUsd = 0;
    let totalRmb = 0;
    let transportUsd = 0;
    let transportRmb = 0;
    let hotelUsd = 0;
    let hotelRmb = 0;
    let foodUsd = 0;
    let foodRmb = 0;
    let fapiaoCount = 0;
    const citiesSet = new Set<string>();

    expenses.forEach((e) => {
      const u = e.amountUsd || 0;
      const r = e.amountRmb || 0;
      totalUsd += u;
      totalRmb += r;

      if (e.city) citiesSet.add(e.city);
      if (e.hasFapiao) fapiaoCount++;

      if (e.category === 'Transport') {
        transportUsd += u;
        transportRmb += r;
      } else if (e.category === 'Hotel & Accommodation') {
        hotelUsd += u;
        hotelRmb += r;
      } else if (e.category === 'Food & Meals') {
        foodUsd += u;
        foodRmb += r;
      }
    });

    return {
      totalUsd,
      totalRmb,
      transportUsd,
      transportRmb,
      hotelUsd,
      hotelRmb,
      foodUsd,
      foodRmb,
      citiesCount: citiesSet.size,
      fapiaoCount,
      fapiaoRate: expenses.length > 0 ? Math.round((fapiaoCount / expenses.length) * 100) : 0,
    };
  }, [expenses]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      return;
    }

    const headers = [
      'Expense #',
      'Date',
      'Category',
      'Type',
      'Title / Description',
      'Amount',
      'Currency',
      'Amount RMB',
      'Amount USD',
      'City',
      'Route',
      'Factory / Supplier',
      'Has Fapiao',
      'Payment Method',
      'Notes',
    ];

    const rows = filteredExpenses.map((e) => [
      `"${e.expenseNumber || ''}"`,
      `"${e.date || ''}"`,
      `"${e.category || ''}"`,
      `"${e.subType || ''}"`,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      e.amount || 0,
      `"${e.currency || 'RMB'}"`,
      e.amountRmb || 0,
      e.amountUsd || 0,
      `"${e.city || ''}"`,
      `"${(e.destinationRoute || '').replace(/"/g, '""')}"`,
      `"${(e.factoryOrPartner || '').replace(/"/g, '""')}"`,
      e.hasFapiao ? 'Yes' : 'No',
      `"${e.paymentMethod || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `china_factory_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (category: ExpenseCategory) => {
    switch (category) {
      case 'Transport':
        return <Train className="w-4 h-4 text-blue-600" />;
      case 'Hotel & Accommodation':
        return <Hotel className="w-4 h-4 text-indigo-600" />;
      case 'Food & Meals':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'Factory Escort & Driver':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'SIM, VPN & Supplies':
        return <Wifi className="w-4 h-4 text-purple-600" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-slate-500" />;
    }
  };

  const getCategoryBadgeClass = (category: ExpenseCategory) => {
    switch (category) {
      case 'Transport':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Hotel & Accommodation':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Food & Meals':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Factory Escort & Driver':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SIM, VPN & Supplies':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Expenses */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Travel & Trips
            </span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-2xl font-black text-slate-900 font-mono">
              {formatAmount(stats.totalUsd, stats.totalRmb)}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
              <span>{expenses.length} expense logs</span>
              <span className="text-emerald-700 font-semibold">{stats.citiesCount} cities</span>
            </div>
          </div>
        </div>

        {/* Transport */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              High-Speed Train & Taxis
            </span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <Train className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-blue-900 font-mono">
              {formatAmount(stats.transportUsd, stats.transportRmb)}
            </div>
            <div className="text-[11px] text-blue-700/80 mt-1">
              Gaotie, Didi, flights & highway tolls
            </div>
          </div>
        </div>

        {/* Hotel */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Hotels & Lodging
            </span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-indigo-900 font-mono">
              {formatAmount(stats.hotelUsd, stats.hotelRmb)}
            </div>
            <div className="text-[11px] text-indigo-700/80 mt-1">
              Industrial park & city center stays
            </div>
          </div>
        </div>

        {/* Food & Fapiao */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Food & Invoicing (发票)
            </span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
              {formatAmount(stats.foodUsd, stats.foodRmb)}
            </div>
            <div className="text-[11px] text-slate-600 flex items-center justify-between mt-1">
              <span>Meals & client hospitality</span>
              <span className="text-emerald-700 font-bold">{stats.fapiaoRate}% Fapiao</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar: Search, Filters, View Modes & Add Expense */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by factory, route (e.g. Guangzhou to Yiwu), city, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
            />
          </div>

          {/* Action Buttons: Export & Log Expense */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Card View"
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg transition active:scale-95"
              title="Download expense accounting spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              type="button"
              id="log-new-expense-btn"
              onClick={onAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-semibold mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Categories ({expenses.length})</option>
            <option value="Transport">Transport (Gaotie/Taxi/Flights)</option>
            <option value="Hotel & Accommodation">Hotel & Accommodation</option>
            <option value="Food & Meals">Food & Meals</option>
            <option value="Factory Escort & Driver">Factory Escort & Driver</option>
            <option value="SIM, VPN & Supplies">SIM, VPN & Supplies</option>
            <option value="Other / Miscellaneous">Other / Misc</option>
          </select>

          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Cities in China</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Fapiao filter */}
          <select
            value={fapiaoFilter}
            onChange={(e) => setFapiaoFilter(e.target.value as any)}
            className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Invoices</option>
            <option value="With Fapiao">Has Fapiao (发票)</option>
            <option value="No Fapiao">No Fapiao</option>
          </select>

          {(selectedCategory !== 'All' || selectedCity !== 'All' || fapiaoFilter !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedCity('All');
                setFapiaoFilter('All');
                setSearchQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 transition"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredExpenses.length}</strong> of {expenses.length} items
          </div>
        </div>
      </div>

      {/* Main Expense Content (Table or Cards) */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No factory relocation expenses found</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'All' || selectedCity !== 'All'
              ? 'No expenses matched your search criteria. Try resetting the filters.'
              : 'Keep track of how much you spend in Gaotie trains, Didi taxis, hotels, and factory meals across China.'}
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Log First Expense
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Desktop-First Responsive Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Date & #</th>
                  <th className="py-3 px-3 sm:px-4">Category & Type</th>
                  <th className="py-3 px-3 sm:px-4">Description & Route</th>
                  <th className="py-3 px-3 sm:px-4">Factory / Partner</th>
                  <th className="py-3 px-3 sm:px-4">City</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Amount Spent</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Fapiao</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  return (
                    <tr
                      key={exp.id}
                      className="hover:bg-amber-50/30 transition group"
                    >
                      {/* Date & Expense Number */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{exp.date}</div>
                        <div className="text-[10px] text-slate-600 font-mono">{exp.expenseNumber}</div>
                      </td>

                      {/* Category & Badge */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(exp.category)}
                          <span className="font-semibold text-slate-800 truncate">{exp.category}</span>
                        </div>
                        {exp.subType && (
                          <span
                            className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded border font-medium ${getCategoryBadgeClass(
                              exp.category
                            )}`}
                          >
                            {exp.subType}
                          </span>
                        )}
                      </td>

                      {/* Description & Route */}
                      <td className="py-3 px-3 sm:px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 line-clamp-1">{exp.title}</div>
                        {exp.destinationRoute && (
                          <div className="text-[11px] text-indigo-700 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{exp.destinationRoute}</span>
                          </div>
                        )}
                        {exp.notes && (
                          <div className="text-[10px] text-slate-600 line-clamp-1 italic mt-0.5">
                            {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Factory / Supplier */}
                      <td className="py-3 px-3 sm:px-4">
                        {exp.factoryOrPartner ? (
                          <div className="flex items-center gap-1 text-slate-700 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{exp.factoryOrPartner}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">-</span>
                        )}
                      </td>

                      {/* City */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {exp.city || 'China'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="font-bold font-mono text-slate-900 text-sm">
                          {formatAmount(exp.amountUsd, exp.amountRmb)}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          {exp.currency === 'RMB' ? 'Paid in RMB' : 'Paid in USD'} • {exp.paymentMethod || 'WeChat'}
                        </div>
                      </td>

                      {/* Fapiao Badge */}
                      <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                        {exp.hasFapiao ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            发票
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600">No</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(exp)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        /* Mobile Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredExpenses.map((exp) => {
            return (
              <div
                key={exp.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {getCategoryIcon(exp.category)}
                      <span className="text-xs font-bold text-slate-800">{exp.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {exp.hasFapiao && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          发票
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {exp.city}
                      </span>
                    </div>
                  </div>

                  {/* Title & Route */}
                  <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-2">
                    {exp.title}
                  </h4>

                  {exp.destinationRoute && (
                    <div className="text-xs text-indigo-700 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{exp.destinationRoute}</span>
                    </div>
                  )}

                  {exp.factoryOrPartner && (
                    <div className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{exp.factoryOrPartner}</span>
                    </div>
                  )}

                  {exp.notes && (
                    <p className="text-[11px] text-slate-500 mt-2 bg-slate-50 p-2 rounded border border-slate-100 line-clamp-2">
                      {exp.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Section */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-mono">{exp.date}</div>
                    <div className="text-base font-extrabold font-mono text-slate-900">
                      {formatAmount(exp.amountUsd, exp.amountRmb)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(exp)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Expense Record?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{expenseToDelete.title}</div>
              <div className="text-slate-600 font-mono">
                {expenseToDelete.date} • {formatAmount(expenseToDelete.amountUsd, expenseToDelete.amountRmb)} ({expenseToDelete.city})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (expenseToDelete) {
                    onDelete(expenseToDelete.id);
                    setExpenseToDelete(null);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

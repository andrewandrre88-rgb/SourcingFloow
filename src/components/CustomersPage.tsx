import React, { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Mail, Phone, MessageCircle } from 'lucide-react';
import { Customer } from '../types';

interface CustomersPageProps {
  customers: Customer[];
  onAdd: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ customers, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50">
        <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          Customer Database
          <span className="bg-indigo-100 text-indigo-700 text-[10px] py-0.5 px-2 rounded-full font-bold">
            {customers.length}
          </span>
        </h2>
        <div className="flex w-full sm:w-auto items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Country</th>
              <th className="px-4 py-2.5">Contact Info</th>
              <th className="px-4 py-2.5">Notes</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900">{customer.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      customer.type === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      customer.type === 'Potential' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {customer.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{customer.country || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center text-slate-500">
                      {customer.contactEmail && <Mail className="w-3.5 h-3.5 text-slate-400" title={customer.contactEmail} />}
                      {customer.contactPhone && <Phone className="w-3.5 h-3.5 text-slate-400" title={customer.contactPhone} />}
                      {customer.whatsapp && <MessageCircle className="w-3.5 h-3.5 text-green-500" title={`WhatsApp: ${customer.whatsapp}`} />}
                      {customer.wechatId && <MessageCircle className="w-3.5 h-3.5 text-emerald-500" title={`WeChat: ${customer.wechatId}`} />}
                      {!customer.contactEmail && !customer.contactPhone && !customer.whatsapp && !customer.wechatId && '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{customer.notes || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                        title="Edit Customer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(customer)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <p className="font-medium">No customers found</p>
                    <p className="text-[11px]">Add your first customer to build your database.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

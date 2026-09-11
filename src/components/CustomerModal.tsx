import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Customer } from '../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customerToEdit: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    type: 'Active',
    contactEmail: '',
    contactPhone: '',
    whatsapp: '',
    wechatId: '',
    country: '',
    notes: ''
  });

  useEffect(() => {
    if (customerToEdit) {
      setFormData(customerToEdit);
    } else {
      setFormData({
        name: '',
        type: 'Active',
        contactEmail: '',
        contactPhone: '',
        whatsapp: '',
        wechatId: '',
        country: '',
        notes: ''
      });
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const customer: Customer = {
      id: customerToEdit?.id || 'cust_' + Date.now().toString(),
      name: formData.name,
      type: formData.type as 'Active' | 'Potential' | 'Past',
      contactEmail: formData.contactEmail || '',
      contactPhone: formData.contactPhone || '',
      whatsapp: formData.whatsapp || '',
      wechatId: formData.wechatId || '',
      country: formData.country || '',
      notes: formData.notes || '',
      createdAt: customerToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    onSave(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-bold text-slate-800">
            {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Company / Contact Name *</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Customer Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Potential">Potential</option>
                <option value="Past">Past</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">WeChat ID</label>
              <input
                type="text"
                value={formData.wechatId}
                onChange={e => setFormData({ ...formData, wechatId: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white text-slate-700 text-xs font-semibold rounded border border-slate-300 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-700 transition flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import fs from 'fs';
let content = fs.readFileSync('src/components/InquiryModal.tsx', 'utf8');

// revert input and label
const targetStr = `              <div className="sm:col-span-1">
                <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mb-1">
                  Customer / Company <span className="text-rose-500">*</span>
                  <div className="group relative cursor-help">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-8 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition">Autocompletes from CRM</span>
                  </div>
                </label>
                <input
                  id="modal-customer-name-input"
                  list="customer-list"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.customerName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const selectedCustomer = customers.find(c => c.name === val);
                    if (selectedCustomer) {
                      setFormData({
                        ...formData,
                        customerName: val,
                        customerContact: selectedCustomer.contactEmail || selectedCustomer.contactPhone || selectedCustomer.whatsapp || '',
                        wechatId: selectedCustomer.wechatId || '',
                        country: selectedCustomer.country || formData.country,
                      });
                    } else {
                      setFormData({ ...formData, customerName: val });
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
                <datalist id="customer-list">
                  {customers.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>`;

const revertedStr = `              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Customer / Company <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-customer-name-input"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />
              </div>`;

content = content.replace(targetStr, revertedStr);

// revert props interface
content = content.replace(
  /existingCount: number;\n  customers: Customer\[\];\n\}/,
  `existingCount: number;\n}`
);

// revert destructured props
content = content.replace(
  /  existingCount,\n  customers,\n\}\) => \{/,
  `  existingCount,\n}) => {`
);

fs.writeFileSync('src/components/InquiryModal.tsx', content);

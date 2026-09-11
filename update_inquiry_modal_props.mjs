import fs from 'fs';
let content = fs.readFileSync('src/components/InquiryModal.tsx', 'utf8');

// add Customer to imports if not there
if (!content.includes('Customer')) {
  content = content.replace(
    /import \{\n  InquiryItem,/,
    `import { Customer } from '../types';\nimport {\n  InquiryItem,`
  );
}

// update InquiryModalProps
if (!content.includes('customers: Customer[];')) {
  content = content.replace(
    /existingCount: number;\n\}/,
    `existingCount: number;\n  customers: Customer[];\n}`
  );
}

// update function signature
content = content.replace(
  /  existingCount,\n\}\) => \{/,
  `  existingCount,\n  customers,\n}) => {`
);

// update input
const oldInput = `<input
                  id="modal-customer-name-input"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.customerName || ''}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                />`;

const newInput = `<input
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
                </datalist>`;

content = content.replace(oldInput, newInput);
fs.writeFileSync('src/components/InquiryModal.tsx', content);

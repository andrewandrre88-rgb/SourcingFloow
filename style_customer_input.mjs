import fs from 'fs';
let content = fs.readFileSync('src/components/InquiryModal.tsx', 'utf8');

const targetStr = `              <div className="sm:col-span-1">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Customer / Company <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-customer-name-input"
                  list="customer-list"`;

const newStr = `              <div className="sm:col-span-1">
                <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 mb-1">
                  Customer / Company <span className="text-rose-500">*</span>
                  <div className="group relative cursor-help">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-8 w-max px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition">Autocompletes from CRM</span>
                  </div>
                </label>
                <input
                  id="modal-customer-name-input"
                  list="customer-list"`;

content = content.replace(targetStr, newStr);

fs.writeFileSync('src/components/InquiryModal.tsx', content);

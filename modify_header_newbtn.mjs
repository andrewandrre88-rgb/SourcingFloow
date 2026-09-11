import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

content = content.replace(
  /<button\n              id="header-new-inquiry-btn"\n              onClick=\{onOpenNewModal\}[\s\S]*?<span className="hidden sm:inline">New Inquiry<\/span>\n            <\/button>/,
  `<button
              id="header-new-inquiry-btn"
              onClick={onOpenNewModal}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentView === 'inquiries' ? 'New Inquiry' : 'New Customer'}</span>
            </button>`
);

// We need to make sure onOpenNewModal actually opens new customer when on customer view. This logic is handled in App.tsx. Wait, App.tsx passes onOpenNewModal={() => { setInquiryToEdit(null); setIsInquiryModalOpen(true); }}
fs.writeFileSync('src/components/Header.tsx', content);

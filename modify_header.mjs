import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// Update props
content = content.replace(
  /onSync: \(\) => void;/,
  `onSync: () => void;
  currentView: 'inquiries' | 'customers';
  onViewChange: (view: 'inquiries' | 'customers') => void;`
);

content = content.replace(
  /onOpenRatesModal,\n  isLoggingIn\n}\)/,
  `onOpenRatesModal,
  isLoggingIn,
  currentView,
  onViewChange
})`
);

// Add the view switcher next to "Sourcing Agent Pro" logo
content = content.replace(
  /<div className="flex items-center gap-2">[\s\S]*?<\/h1>\n        <\/div>/,
  `<div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-xs">
              <PackageOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold tracking-tight text-slate-800 hidden sm:block">
              Sourcing Agent Pro
            </h1>
          </div>
          
          {user && (
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => onViewChange('inquiries')}
                className={\`px-3 py-1.5 rounded-md text-xs font-semibold transition \${
                  currentView === 'inquiries'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                Inquiries
              </button>
              <button
                onClick={() => onViewChange('customers')}
                className={\`px-3 py-1.5 rounded-md text-xs font-semibold transition \${
                  currentView === 'customers'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                Customers
              </button>
            </div>
          )}
        </div>`
);

fs.writeFileSync('src/components/Header.tsx', content);

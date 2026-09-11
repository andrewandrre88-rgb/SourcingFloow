import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const brandString = `          {/* Brand / Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-xs">
              SF
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  SourcingFlow
                  <span className="text-xs font-normal text-slate-400 hidden sm:inline">
                    Agent Dashboard
                  </span>
                </h1>
              </div>
            </div>
          </div>`;

const newBrandString = `          {/* Brand / Title & View Switcher */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-xs">
                SF
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  SourcingFlow
                </h1>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
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
          </div>`;

content = content.replace(brandString, newBrandString);
fs.writeFileSync('src/components/Header.tsx', content);

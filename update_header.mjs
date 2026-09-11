import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

// The new imports
if (!content.includes('Menu')) {
  content = content.replace(
    /import \{\n  DollarSign,/,
    `import {\n  Menu,\n  DollarSign,`
  );
}

// Update props
content = content.replace(
  /currentView: 'inquiries' \| 'customers';\n  onViewChange: \(view: 'inquiries' \| 'customers'\) => void;/,
  `currentView: string;\n  onSidebarToggle: () => void;`
);

// Update destructuring
content = content.replace(
  /  isLoggingIn,\n  currentView,\n  onViewChange,\n\}\) => \{/,
  `  isLoggingIn,\n  currentView,\n  onSidebarToggle,\n}) => {`
);

// Replace brand and switcher with hamburger menu
const oldBrandArea = `          {/* Brand / Title & View Switcher */}
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

const newBrandArea = `          {/* Mobile Menu Toggle & Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onSidebarToggle}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-slate-800 hidden sm:block capitalize">
              {currentView.replace('-', ' ')}
            </h2>
          </div>`;

content = content.replace(oldBrandArea, newBrandArea);

// Update "New Inquiry" button logic text
content = content.replace(
  /<span className="hidden sm:inline">\{currentView === 'inquiries' \? 'New Inquiry' : 'New Customer'\}<\/span>/g,
  `<span className="hidden sm:inline">Add New</span>`
);

// Also remove Auth / Profile Area from Header since it's in Sidebar now
const authAreaRegex = /\{\/\* Auth \/ Profile Area \*\/\}[\s\S]*?(?=<\/div>\n        <\/div>\n      <\/div>\n    <\/header>)/;
content = content.replace(authAreaRegex, '');


fs.writeFileSync('src/components/Header.tsx', content);

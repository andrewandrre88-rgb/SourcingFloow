import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The new imports
const importRegex = /import \{ Header \} from '\.\/components\/Header';/;
const newImports = `import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { SuppliersPage } from './components/SuppliersPage';
import { LogisticsCalculator } from './components/LogisticsCalculator';
import { AppView, Supplier } from './types';`;

content = content.replace(importRegex, newImports);

// Find currentView definition
const viewRegex = /const \[currentView, setCurrentView\] = useState<'inquiries' \| 'customers'>\('inquiries'\);/;
content = content.replace(viewRegex, `const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);`);

// Define render logic
const mainRenderRegex = /return \([\s\S]*?\n  \);/;
const mainRender = `return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col w-0 overflow-hidden">
        <Header 
          user={user}
          needsAuth={needsAuth}
          syncState={syncState}
          exchangeRates={exchangeRates}
          currencyView={currencyView}
          onCurrencyViewChange={setCurrencyView}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onSync={handleManualSync}
          onOpenNewModal={() => {
            if (currentView === 'customers') {
              setCustomerToEdit(null);
              setIsCustomerModalOpen(true);
            } else {
              setInquiryToEdit(null);
              setIsInquiryModalOpen(true);
            }
          }}
          onOpenRatesModal={() => setIsRatesModalOpen(true)}
          isLoggingIn={isLoggingIn}
          currentView={currentView}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <>
              <StatsBar inquiries={inquiries} exchangeRates={exchangeRates} />
              <InquiryTable 
                inquiries={inquiries}
                exchangeRates={exchangeRates}
                usdToRmbRate={exchangeRates.USD_TO_RMB}
                currencyView={currencyView}
                onView={(item) => setItemToView(item)}
                onEdit={(item) => {
                  setInquiryToEdit(item);
                  setIsInquiryModalOpen(true);
                }}
                onDeleteRequest={handleDeleteRequest}
                onStatusChange={handleStatusChange}
                onQuickShare={(item) => setItemToShare(item)}
              />
            </>
          )}
          
          {currentView === 'kanban' && (
            <KanbanBoard 
              inquiries={inquiries}
              usdToRmbRate={exchangeRates.USD_TO_RMB}
              onEdit={(item) => {
                setInquiryToEdit(item);
                setIsInquiryModalOpen(true);
              }}
              onStatusChange={handleStatusChange}
            />
          )}

          {currentView === 'customers' && (
            <CustomersPage 
              customers={customers}
              onAdd={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onEdit={(customer) => {
                setCustomerToEdit(customer);
                setIsCustomerModalOpen(true);
              }}
              onDelete={handleDeleteCustomer}
            />
          )}

          {currentView === 'suppliers' && (
            <SuppliersPage 
              suppliers={suppliers}
              onAdd={() => alert("Supplier Add flow coming soon!")}
              onEdit={(supplier) => alert("Supplier Edit flow coming soon!")}
            />
          )}

          {currentView === 'logistics' && (
            <LogisticsCalculator />
          )}

        </main>
      </div>

      {/* Modals */}
      <InquiryDetailModal
        isOpen={Boolean(itemToView)}
        inquiry={itemToView}
        usdToRmbRate={exchangeRates.USD_TO_RMB}
        onClose={() => setItemToView(null)}
        onEdit={(item) => {
          setItemToView(null);
          setInquiryToEdit(item);
          setIsInquiryModalOpen(true);
        }}
        onShare={(item) => {
          setItemToView(null);
          setItemToShare(item);
        }}
        onStatusChange={handleStatusChange}
      />
      <InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => {
          setIsInquiryModalOpen(false);
          setInquiryToEdit(null);
        }}
        onSave={handleSaveInquiry}
        inquiryToEdit={inquiryToEdit}
        exchangeRates={exchangeRates}
        existingCount={inquiries.length}
      />
      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        inquiryNumber={itemToDelete?.inquiryNumber}
      />
      <QuoteExportModal
        isOpen={Boolean(itemToShare)}
        onClose={() => setItemToShare(null)}
        inquiry={itemToShare}
        usdToRmbRate={exchangeRates.USD_TO_RMB}
      />
      <ExchangeRateModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={exchangeRates}
        onSave={handleUpdateRates}
      />
      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={\`fixed bottom-4 right-4 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/5 p-4 \${
          toastMessage.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-white text-slate-800'
        }\`}>
          <div className="flex items-start gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              </div>
            )}
            <p className="text-sm font-medium">{toastMessage.text}</p>
          </div>
        </div>
      )}
    </div>
  );`;

content = content.replace(mainRenderRegex, mainRender);
fs.writeFileSync('src/App.tsx', content);

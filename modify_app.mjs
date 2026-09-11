import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /import { InquiryItem, ExchangeRates, CurrencyViewMode, OrderStatus } from '\.\/types';/,
  `import { InquiryItem, ExchangeRates, CurrencyViewMode, OrderStatus, Customer } from './types';`
);

content = content.replace(
  /import { AuthPage } from '\.\/components\/AuthPage';/,
  `import { AuthPage } from './components/AuthPage';
import { CustomersPage } from './components/CustomersPage';
import { CustomerModal } from './components/CustomerModal';
import { subscribeToCustomers, saveCustomerToFirestore, deleteCustomerFromFirestore } from './lib/customersDb';`
);

// Add state variables
content = content.replace(
  /const \[inquiries, setInquiries\] = useState<InquiryItem\[\]>\(\[\]\);/,
  `const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentView, setCurrentView] = useState<'inquiries' | 'customers'>('inquiries');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);`
);

// Add customer subscription
content = content.replace(
  /const unsubscribeInquiries = subscribeToUserInquiries\(user\.uid, \(data\) => \{[\s\S]*?\}\);/,
  `const unsubscribeInquiries = subscribeToUserInquiries(user.uid, (data) => {
        setInquiries(data);
        setSyncState(prev => ({
          ...prev,
          lastSyncedAt: new Date().toLocaleTimeString(),
          isSyncing: false,
          error: null,
          itemCount: data.length
        }));
      });
      
      const unsubscribeCustomers = subscribeToCustomers(user.uid, (data) => {
        setCustomers(data);
      });`
);

// Cleanup subscription
content = content.replace(
  /return \(\) => \{[\s\S]*?unsubscribeInquiries\(\);\n[\s\S]*?unsubscribeRates\(\);\n[\s\S]*?\};/,
  `return () => {
        unsubscribeInquiries();
        unsubscribeCustomers();
        unsubscribeRates();
      };`
);

// Handlers for Customers
content = content.replace(
  /\/\/ Save an inquiry[\s\S]*?};/,
  `// Save an inquiry
  const handleSaveInquiry = async (item: InquiryItem) => {
    if (!user) return;
    try {
      setSyncState((prev) => ({ ...prev, isSyncing: true }));
      await saveInquiryToFirestore(user.uid, item);
      showToast(\`Saved inquiry \${item.inquiryNumber} locally\`, 'info');
    } catch (error: any) {
      console.error('Failed to save to Firestore:', error);
      showToast(\`Failed to save \${item.inquiryNumber} locally\`, 'info');
    }
  };
  
  // Save customer
  const handleSaveCustomer = async (customer: Customer) => {
    if (!user) return;
    try {
      setSyncState((prev) => ({ ...prev, isSyncing: true }));
      await saveCustomerToFirestore(user.uid, customer);
      showToast(\`Saved customer \${customer.name}\`, 'success');
    } catch (error: any) {
      console.error('Failed to save customer:', error);
      showToast(\`Failed to save customer: \${error.message}\`, 'error');
    }
  };
  
  // Delete customer
  const handleDeleteCustomer = async (customer: Customer) => {
    if (!user) {
      return;
    }
    
    // Check if customer is used in any inquiries
    // For now we just allow deletion, but could prompt
    if (window.confirm(\`Are you sure you want to delete \${customer.name}?\`)) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        await deleteCustomerFromFirestore(user.uid, customer.id);
        showToast(\`Deleted customer \${customer.name}\`, 'info');
      } catch (error: any) {
        console.error('Failed to delete customer:', error);
        showToast(\`Failed to delete: \${error.message}\`, 'error');
      }
    }
  };`
);

// Header props
content = content.replace(
  /onOpenRatesModal=\{\(\) => setIsRatesModalOpen\(true\)\}\n        isLoggingIn=\{isLoggingIn\}/,
  `onOpenRatesModal={() => setIsRatesModalOpen(true)}
        isLoggingIn={isLoggingIn}
        currentView={currentView}
        onViewChange={setCurrentView}`
);

// View switcher in main container
content = content.replace(
  /\{\/\* Sourcing Summary Metrics \*\/\}[\s\S]*?onQuickShare=\{\(item\) => setItemToShare\(item\)\}\n        \/>/,
  `{currentView === 'inquiries' ? (
          <>
            {/* Sourcing Summary Metrics */}
            <StatsBar
              inquiries={inquiries}
              currencyView={currencyView}
              usdToRmbRate={exchangeRates.USD_TO_RMB}
            />
            {/* Main "In a Line" Table */}
            <InquiryTable
              inquiries={inquiries}
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
        ) : (
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
        )}`
);

// Add customer modal and fix FAB
content = content.replace(
  /onClick=\{\(\) => \{\n            setInquiryToEdit\(null\);\n            setIsInquiryModalOpen\(true\);\n          \}\}/,
  `onClick={() => {
            if (currentView === 'inquiries') {
              setInquiryToEdit(null);
              setIsInquiryModalOpen(true);
            } else {
              setCustomerToEdit(null);
              setIsCustomerModalOpen(true);
            }
          }}`
);

content = content.replace(
  /<ExchangeRateModal[\s\S]*?\/>/,
  `<ExchangeRateModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={exchangeRates}
        onSaveRates={handleSaveRates}
      />
      
      <CustomerModal 
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />`
);

fs.writeFileSync('src/App.tsx', content);

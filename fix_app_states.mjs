import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const \[inquiries, setInquiries\] = useState<InquiryItem\[\]>\(\(\) => \{/,
  `const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentView, setCurrentView] = useState<'inquiries' | 'customers'>('inquiries');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {`
);

content = content.replace(
  /const unsubscribeInquiries = subscribeToUserInquiries\(user\.uid, \(data\) => \{/,
  `const unsubscribeCustomers = subscribeToCustomers(user.uid, (data) => {
        setCustomers(data);
      });
      const unsubscribeInquiries = subscribeToUserInquiries(user.uid, (data) => {`
);

content = content.replace(
  /unsubscribeInquiries\(\);\n[\s\S]*?unsubscribeRates\(\);/,
  `unsubscribeCustomers();
        unsubscribeInquiries();
        unsubscribeRates();`
);

// We also need the handleSaveCustomer and handleDeleteCustomer functions. Wait, were they added? Let me check.
if (!content.includes('handleSaveCustomer')) {
  content = content.replace(
    /\/\/ Save an inquiry/,
    `// Save customer
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
  };

  // Save an inquiry`
  );
}

fs.writeFileSync('src/App.tsx', content);

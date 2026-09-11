import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { Customer } from')) {
  content = content.replace(
    /import \{ InquiryItem, OrderStatus, CloudSyncState, ExchangeRates, CurrencyViewMode \} from '\.\/types';/,
    `import { InquiryItem, OrderStatus, CloudSyncState, ExchangeRates, CurrencyViewMode, Customer } from './types';`
  );
}

if (!content.includes('CustomersPage')) {
  content = content.replace(
    /import \{ AuthPage \} from '\.\/components\/AuthPage';/,
    `import { AuthPage } from './components/AuthPage';
import { CustomersPage } from './components/CustomersPage';
import { CustomerModal } from './components/CustomerModal';
import { subscribeToCustomers, saveCustomerToFirestore, deleteCustomerFromFirestore } from './lib/customersDb';`
  );
}

fs.writeFileSync('src/App.tsx', content);

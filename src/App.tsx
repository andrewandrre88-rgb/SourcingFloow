import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
} from './lib/firebase';
import {
  syncUserProfile,
  subscribeToUserInquiries,
  saveInquiryToFirestore,
  deleteInquiryFromFirestore,
  subscribeToUserExchangeRates,
  saveExchangeRatesToFirestore,
  migrateLocalDataToFirestoreIfEmpty,
  updateInquiriesOrderInFirestore,
} from './lib/firestoreDb';
import {
  getSavedExchangeRates,
  saveExchangeRates,
  STORAGE_KEY_LOCAL_INQUIRIES,
  STORAGE_KEY_CURRENCY_VIEW,
  calculateInquiryPricing,
} from './lib/currency';
import { SAMPLE_INQUIRIES } from './lib/sampleData';
import { InquiryItem, OrderStatus, CloudSyncState, ExchangeRates, CurrencyViewMode, Customer, ServiceRequest, ServiceStatus, SourcingTask, TaskPriority, TaskCategory, ExpenseItem } from './types';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { InquiryTable } from './components/InquiryTable';
import { InquiryModal } from './components/InquiryModal';
import { InquiryDetailModal } from './components/InquiryDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QuoteExportModal } from './components/QuoteExportModal';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { AuthPage } from './components/AuthPage';
import { CustomersPage } from './components/CustomersPage';
import { CustomerModal } from './components/CustomerModal';
import { ServicesPage } from './components/ServicesPage';
import { ServiceModal } from './components/ServiceModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { ExpensesPage } from './components/ExpensesPage';
import { ExpenseModal } from './components/ExpenseModal';
import { TasksPage } from './components/TasksPage';
import { TaskModal } from './components/TaskModal';
import { ProductsPage } from './components/ProductsPage';
import { ProductModal } from './components/ProductModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CatalogProduct } from './types';
import { subscribeToCustomers, saveCustomerToFirestore, deleteCustomerFromFirestore } from './lib/customersDb';
import {
  subscribeToServices,
  saveServiceToFirestore,
  deleteServiceFromFirestore,
  getLocalServices,
  saveLocalServices,
} from './lib/servicesDb';
import {
  subscribeToExpenses,
  saveExpenseToFirestore,
  deleteExpenseFromFirestore,
  getLocalExpenses,
  saveLocalExpenses,
} from './lib/expensesDb';
import {
  loadLocalTasks,
  saveLocalTasks,
  subscribeToTasks,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  migrateLocalTasksToFirestoreIfEmpty,
  batchSaveTasksToFirestore,
} from './lib/tasksDb';
import {
  loadLocalProducts,
  saveLocalProducts,
  subscribeToProducts,
  saveProductToFirestore,
  deleteProductFromFirestore,
  migrateLocalProductsToFirestoreIfEmpty,
  batchSaveProductsToFirestore,
} from './lib/productsDb';
import {
  CheckCircle2,
  AlertCircle,
  Cloud,
  Plus,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Global Currency View Preference ('USD' | 'RMB' | 'DUAL')
  const [currencyView, setCurrencyView] = useState<CurrencyViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENCY_VIEW);
      if (saved === 'USD' || saved === 'RMB' || saved === 'DUAL') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'USD';
  });

  const handleCurrencyViewChange = (mode: CurrencyViewMode) => {
    setCurrencyView(mode);
    try {
      localStorage.setItem(STORAGE_KEY_CURRENCY_VIEW, mode);
    } catch {
      // ignore
    }
  };

  // Sync state
  const [syncState, setSyncState] = useState<CloudSyncState>({
    lastSyncedAt: null,
    isSyncing: false,
    error: null,
    status: 'offline',
    itemCount: 0
  });

  // Exchange Rates state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(getSavedExchangeRates);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceRequest[]>(getLocalServices);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(getLocalExpenses);
  const [tasks, setTasks] = useState<SourcingTask[]>(loadLocalTasks);
  const [products, setProducts] = useState<CatalogProduct[]>(loadLocalProducts);
  const [currentView, setCurrentView] = useState<'inquiries' | 'products' | 'customers' | 'services' | 'tasks'>('inquiries');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceRequest | null>(null);
  const [serviceToView, setServiceToView] = useState<ServiceRequest | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<SourcingTask | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<CatalogProduct | null>(null);
  const [productToView, setProductToView] = useState<CatalogProduct | null>(null);

  // Urgent / High priority task metrics for header badge
  const urgentTaskCount = tasks.filter(
    (t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed'
  ).length;

  // Core Data State
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCAL_INQUIRIES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load local inquiries:', e);
    }
    return SAMPLE_INQUIRIES;
  });

  // Modals state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [inquiryToEdit, setInquiryToEdit] = useState<InquiryItem | null>(null);
  const [itemToView, setItemToView] = useState<InquiryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InquiryItem | null>(null);
  const [itemToShare, setItemToShare] = useState<InquiryItem | null>(null);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await googleSignIn();
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
        setLoginError(
          'Domain not authorized: Please add "sourcing-floow.vercel.app" to your Firebase Console under Authentication > Settings > Authorized domains.'
        );
      } else if (error?.code === 'auth/popup-blocked') {
        setLoginError('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        setLoginError('Sign-in cancelled. Click below to continue with Google.');
      } else {
        setLoginError(error?.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleManualSync = async () => {
    if (!user) return;
    setSyncState((prev) => ({ ...prev, isSyncing: true }));
    try {
      showToast('Syncing products, tasks & inquiries with Cloud Firestore...', 'info');
      await Promise.all([
        batchSaveTasksToFirestore(user.uid, tasks),
        batchSaveProductsToFirestore(user.uid, products),
      ]);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
      }));
      showToast('All products, tasks & inquiries synchronized across all devices!', 'success');
    } catch (err: any) {
      console.error(err);
      setSyncState((prev) => ({ ...prev, isSyncing: false, error: 'Sync failed' }));
      showToast('Sync issue: ' + (err?.message || 'Check connection'), 'error');
    }
  };

  const handleDeleteRequest = (item: InquiryItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const idToDelete = itemToDelete.id;
    const numToDelete = itemToDelete.inquiryNumber;
    setInquiries(prev => prev.filter(i => i.id !== idToDelete));
    setItemToDelete(null);
    showToast(`Deleted inquiry ${numToDelete}`, 'success');
    if (user && user.uid) {
      try {
        setSyncState(prev => ({ ...prev, isSyncing: true }));
        await deleteInquiryFromFirestore(user.uid, idToDelete);
        setSyncState(prev => ({ ...prev, isSyncing: false }));
      } catch (e) {
        console.error('Failed to delete inquiry from Firestore:', e);
      }
    }
  };

  const handleStatusChange = async (target: InquiryItem | string, status: OrderStatus) => {
    const targetId = typeof target === 'string' ? target : target.id;
    setInquiries(prev => prev.map(i => {
      if (i.id === targetId) {
        const updated = { ...i, orderStatus: status, updatedAt: new Date().toISOString() };
        if (user && user.uid) {
          saveInquiryToFirestore(user.uid, updated).catch(console.error);
        }
        return updated;
      }
      return i;
    }));

    setItemToView(prev => (prev && prev.id === targetId ? { ...prev, orderStatus: status } : prev));
    showToast(`Order status updated to "${status}"`, 'success');
  };

  const handleDuplicateInquiry = async (original: InquiryItem) => {
    const year = new Date().getFullYear();
    const prefix = `INQ-${year}-`;
    let maxSeq = 0;
    inquiries.forEach((item) => {
      if (item.inquiryNumber && item.inquiryNumber.startsWith(prefix)) {
        const numPart = parseInt(item.inquiryNumber.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    });
    const nextInquiryNumber = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
    const newId = `inq_${Date.now()}`;

    // Deep clone quotes with unique IDs
    const clonedQuotes = (original.quotes || []).map((q, idx) => ({
      ...q,
      id: `quote_${Date.now()}_${idx}`,
    }));
    const newSelectedQuoteId = clonedQuotes.length > 0 ? clonedQuotes[0].id : '';

    // Deep clone helper commissions if any
    const clonedCommissions = (original.helperCommissions || []).map((c, idx) => ({
      ...c,
      id: `comm_${Date.now()}_${idx}`,
    }));

    const duplicatedItem: InquiryItem = {
      ...original,
      id: newId,
      inquiryNumber: nextInquiryNumber,
      date: new Date().toISOString().split('T')[0],
      orderStatus: 'New Inquiry',
      quotes: clonedQuotes,
      selectedQuoteId: newSelectedQuoteId,
      helperCommissions: clonedCommissions,
      updatedAt: new Date().toISOString(),
    };

    setInquiries((prev) => [duplicatedItem, ...prev]);
    showToast(`Duplicated ${original.inquiryNumber} as ${nextInquiryNumber}`, 'success');

    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        await saveInquiryToFirestore(user.uid, duplicatedItem);
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        console.error('Failed to save duplicated inquiry to Firestore:', error);
      }
    }
  };

  const handleSplitInquiry = async (item: InquiryItem) => {
    if (!item.products || item.products.length <= 1) return;

    const rate = exchangeRates.USD_TO_RMB > 0 ? exchangeRates.USD_TO_RMB : 7.25;
    const year = new Date().getFullYear();
    const prefix = `INQ-${year}-`;

    let maxSeq = 0;
    inquiries.forEach((it) => {
      if (it.inquiryNumber && it.inquiryNumber.startsWith(prefix)) {
        const numPart = parseInt(it.inquiryNumber.slice(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    });

    const usedNumbers = new Set(inquiries.map((it) => it.inquiryNumber));
    const assignedNumbers: string[] = [item.inquiryNumber];
    usedNumbers.add(item.inquiryNumber);

    let nextSeq = maxSeq + 1;
    for (let i = 1; i < item.products.length; i++) {
      let candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      while (usedNumbers.has(candidate)) {
        nextSeq++;
        candidate = `${prefix}${String(nextSeq).padStart(3, '0')}`;
      }
      assignedNumbers.push(candidate);
      usedNumbers.add(candidate);
      nextSeq++;
    }

    const separateItems: InquiryItem[] = item.products.map((prod, idx) => {
      const prodName = prod.productName?.trim() || item.product;
      const prodQty = Math.max(1, Number(prod.quantity) || 1);
      const prodPrice1688 =
        prod.price1688Rmb !== undefined && !isNaN(Number(prod.price1688Rmb))
          ? Number(prod.price1688Rmb)
          : item.price1688Rmb || 0;

      const prodPricing = calculateInquiryPricing({
        quantity: prodQty,
        price1688Rmb: prodPrice1688,
        domesticShippingRmb: item.domesticShippingRmb || 0,
        marginPercent: item.marginPercent || 0,
        marginFixedUsd: item.marginFixedUsd || 0,
        usdToRmbRate: rate,
      });

      return {
        ...item,
        id: idx === 0 ? item.id : `inq_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        inquiryNumber: assignedNumbers[idx],
        product: prodName,
        products: [
          {
            ...prod,
            id: prod.id || `prod_${Date.now()}_${idx}`,
            productName: prodName,
            clientUnitPriceUsd: prodPricing.clientUnitPriceUsd,
          },
        ],
        colorVariant: prod.colorVariant || '',
        quantity: prodQty,
        material: prod.material || item.material || '',
        imageUrl: prod.imageUrl || item.imageUrl || '',
        price1688Rmb: prodPrice1688,
        clientUnitPriceUsd: prodPricing.clientUnitPriceUsd,
        totalQuotationUsd: prodPricing.totalQuotationUsd,
        estimatedProfitUsd: prodPricing.estimatedProfitUsd,
        notes: prod.notes || item.notes || '',
        updatedAt: new Date().toISOString(),
      };
    });

    // Replace the combined item with separate items in state
    setInquiries((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const next = [...separateItems, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY_LOCAL_INQUIRIES, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save split inquiries to localStorage:', e);
      }
      return next;
    });

    setItemToView(null);
    showToast(`Successfully split into ${separateItems.length} separate inquiries!`, 'success');

    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        for (const sep of separateItems) {
          await saveInquiryToFirestore(user.uid, sep);
        }
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      } catch (e) {
        console.error('Failed to sync split inquiries to Firestore:', e);
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      }
    }
  };

  const handleReorderInquiries = async (reorderedItems: InquiryItem[]) => {
    // 1. Assign sequential orderIndex so priority order is strictly maintained
    const withOrder = reorderedItems.map((item, idx) => ({
      ...item,
      orderIndex: idx,
    }));

    setInquiries(withOrder);

    // 2. Persist to localStorage immediately for instant offline/reload access
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_INQUIRIES, JSON.stringify(withOrder));
    } catch (e) {
      console.error('Failed to save reordered inquiries to localStorage:', e);
    }

    // 3. Persist to Firestore if user is authenticated
    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        await updateInquiriesOrderInFirestore(user.uid, withOrder.map((i) => i.id));
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        console.error('Failed to sync reordered inquiries with Firestore:', error);
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      }
    }
  };

  const handleSaveInquiry = async (savedInput: InquiryItem | InquiryItem[]) => {
    const itemsToSave = Array.isArray(savedInput) ? savedInput : [savedInput];

    setInquiries((prev) => {
      let next = [...prev];
      for (const item of itemsToSave) {
        const idx = next.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          next[idx] = item;
        } else {
          next = [item, ...next];
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY_LOCAL_INQUIRIES, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to persist inquiries to localStorage:', e);
      }
      return next;
    });

    setIsInquiryModalOpen(false);
    setInquiryToEdit(null);

    if (itemsToSave.length === 1) {
      showToast(`Saved inquiry ${itemsToSave[0].inquiryNumber}`, 'success');
    } else {
      showToast(`Saved ${itemsToSave.length} separate inquiries for ${itemsToSave[0].customerName}`, 'success');
    }

    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        for (const item of itemsToSave) {
          await saveInquiryToFirestore(user.uid, item);
        }
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        console.error('Failed to save inquiries to Firestore:', error);
        setSyncState((prev) => ({ ...prev, isSyncing: false }));
      }
    }
  };

  const handleSaveCustomer = async (savedCustomer: Customer) => {
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === savedCustomer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedCustomer;
        return next;
      }
      return [savedCustomer, ...prev];
    });
    setIsCustomerModalOpen(false);
    setCustomerToEdit(null);

    if (user && user.uid) {
      try {
        await saveCustomerToFirestore(user.uid, savedCustomer);
        showToast(`Saved customer ${savedCustomer.name}`, 'success');
      } catch (error: any) {
        console.error('Failed to save customer to Firestore:', error);
      }
    }
  };

  const handleDeleteCustomer = async (customerOrId: Customer | string) => {
    const id = typeof customerOrId === 'object' && customerOrId !== null ? customerOrId.id : customerOrId;
    if (!id) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (user && user.uid) {
      try {
        await deleteCustomerFromFirestore(user.uid, id);
        showToast('Deleted customer', 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Save local services backup
  useEffect(() => {
    saveLocalServices(services);
  }, [services]);

  const handleSaveService = async (savedService: ServiceRequest) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === savedService.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedService;
        return next;
      }
      return [savedService, ...prev];
    });
    setIsServiceModalOpen(false);
    setServiceToEdit(null);
    if (serviceToView && serviceToView.id === savedService.id) {
      setServiceToView(savedService);
    }
    showToast(`Saved service ${savedService.serviceNumber}`, 'success');

    if (user && user.uid) {
      try {
        await saveServiceToFirestore(user.uid, savedService);
      } catch (error: any) {
        console.error('Failed to save service to Firestore:', error);
      }
    }
  };

  const handleDeleteService = async (serviceOrId: ServiceRequest | string) => {
    const id = typeof serviceOrId === 'object' && serviceOrId !== null ? serviceOrId.id : serviceOrId;
    if (!id) return;
    setServices((prev) => prev.filter((s) => s.id !== id));
    if (serviceToView && serviceToView.id === id) {
      setServiceToView(null);
    }
    showToast('Deleted service request', 'success');

    if (user && user.uid) {
      try {
        await deleteServiceFromFirestore(user.uid, id);
      } catch (e) {
        console.error('Failed to delete service from Firestore:', e);
      }
    }
  };

  const handleServiceStatusChange = async (service: ServiceRequest, status: ServiceStatus) => {
    const updated: ServiceRequest = {
      ...service,
      status,
      updatedAt: new Date().toISOString(),
    };
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? updated : s))
    );
    if (serviceToView && serviceToView.id === service.id) {
      setServiceToView(updated);
    }
    showToast(`Service status updated to "${status}"`, 'success');

    if (user && user.uid) {
      try {
        await saveServiceToFirestore(user.uid, updated);
      } catch (e) {
        console.error('Failed to update service status in Firestore:', e);
      }
    }
  };

  const handleSaveExpense = async (savedExpense: ExpenseItem) => {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === savedExpense.id);
      let next: ExpenseItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = savedExpense;
      } else {
        next = [savedExpense, ...prev];
      }
      saveLocalExpenses(next);
      return next;
    });
    setIsExpenseModalOpen(false);
    setExpenseToEdit(null);
    showToast(`Saved expense ${savedExpense.expenseNumber}`, 'success');

    if (user && user.uid) {
      try {
        await saveExpenseToFirestore(user.uid, savedExpense);
      } catch (error: any) {
        console.error('Failed to save expense to Firestore:', error);
      }
    }
  };

  const handleDeleteExpense = async (expenseOrId: ExpenseItem | string) => {
    const id = typeof expenseOrId === 'object' && expenseOrId !== null ? expenseOrId.id : expenseOrId;
    if (!id) return;
    setExpenses((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocalExpenses(next);
      return next;
    });
    showToast('Deleted business expense record', 'success');

    if (user && user.uid) {
      try {
        await deleteExpenseFromFirestore(user.uid, id);
      } catch (e) {
        console.error('Failed to delete expense from Firestore:', e);
      }
    }
  };

  const handleUpdateRates = async (newRates: ExchangeRates) => {
    setExchangeRates(newRates);
    setIsRatesModalOpen(false);
    saveExchangeRates(newRates);
    if (user && user.uid) {
      try {
        await saveExchangeRatesToFirestore(user.uid, newRates);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ----------------- TO-DO / TASK HANDLERS -----------------
  const handleSaveTask = async (task: SourcingTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      let next: SourcingTask[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = task;
      } else {
        next = [task, ...prev];
      }
      saveLocalTasks(next);
      return next;
    });
    setIsTaskModalOpen(false);
    setTaskToEdit(null);
    showToast(`Saved task "${task.title}"`, 'success');

    if (user && user.uid) {
      try {
        await saveTaskToFirestore(user.uid, task);
      } catch (error: any) {
        console.error('Failed to save task to Firestore:', error);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== taskId);
      saveLocalTasks(next);
      return next;
    });
    showToast('Task removed', 'info');

    if (user && user.uid) {
      try {
        await deleteTaskFromFirestore(user.uid, taskId);
      } catch (e) {
        console.error('Failed to delete task from Firestore:', e);
      }
    }
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const isCompleted = target.status === 'completed';
    const nextStatus = isCompleted ? 'todo' : 'completed';
    const updated: SourcingTask = {
      ...target,
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? updated : t));
      saveLocalTasks(next);
      return next;
    });
    showToast(isCompleted ? 'Marked task as pending' : 'Task completed! Great job.', 'success');

    if (user && user.uid) {
      try {
        await saveTaskToFirestore(user.uid, updated);
      } catch (e) {
        console.error('Failed to update task status in Firestore:', e);
      }
    }
  };

  const handleChangeTaskPriority = async (taskId: string, priority: TaskPriority) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated: SourcingTask = {
      ...target,
      priority,
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? updated : t));
      saveLocalTasks(next);
      return next;
    });
    showToast(`Priority changed to ${priority}`, 'info');

    if (user && user.uid) {
      try {
        await saveTaskToFirestore(user.uid, updated);
      } catch (e) {
        console.error('Failed to update task priority in Firestore:', e);
      }
    }
  };

  const handleQuickAddTask = async (
    title: string,
    priority: TaskPriority,
    category: TaskCategory,
    dueDate?: string
  ) => {
    const newTask: SourcingTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      priority,
      category,
      status: 'todo',
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => {
      const next = [newTask, ...prev];
      saveLocalTasks(next);
      return next;
    });
    showToast(`Added priority task "${title}"`, 'success');

    if (user && user.uid) {
      try {
        await saveTaskToFirestore(user.uid, newTask);
      } catch (e) {
        console.error('Failed to save new task to Firestore:', e);
      }
    }
  };

  // ----------------- MASTER PRODUCT HANDLERS -----------------
  const handleSaveProduct = async (savedProduct: CatalogProduct) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === savedProduct.id);
      let next: CatalogProduct[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = savedProduct;
      } else {
        next = [savedProduct, ...prev];
      }
      saveLocalProducts(next);
      return next;
    });
    setIsProductModalOpen(false);
    setProductToEdit(null);
    showToast(`Saved product specifications for "${savedProduct.name}"`, 'success');

    if (user && user.uid) {
      try {
        await saveProductToFirestore(user.uid, savedProduct);
      } catch (error: any) {
        console.error('Failed to save product to Firestore:', error);
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== productId);
      saveLocalProducts(next);
      return next;
    });
    if (productToView && productToView.id === productId) {
      setProductToView(null);
    }
    showToast('Product removed from catalog', 'info');

    if (user && user.uid) {
      try {
        await deleteProductFromFirestore(user.uid, productId);
      } catch (e) {
        console.error('Failed to delete product from Firestore:', e);
      }
    }
  };

  const handleDuplicateProduct = async (product: CatalogProduct) => {
    const duplicated: CatalogProduct = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${product.name} (Copy)`,
      itemCode: product.itemCode ? `${product.itemCode}-COPY` : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => {
      const next = [duplicated, ...prev];
      saveLocalProducts(next);
      return next;
    });
    showToast(`Duplicated "${product.name}"`, 'success');

    if (user && user.uid) {
      try {
        await saveProductToFirestore(user.uid, duplicated);
      } catch (e) {
        console.error('Failed to duplicate product to Firestore:', e);
      }
    }
  };

  const handleCreateInquiryFromProduct = (product: CatalogProduct) => {
    const usdRate = exchangeRates.USD_TO_RMB || 7.25;
    const priceRmb = product.exwCurrency === 'RMB' ? product.exwPrice : Number((product.exwPrice * usdRate).toFixed(2));
    const targetUsd = product.targetPriceUsd || (product.fobCurrency === 'USD' ? product.fobPrice : Number((product.fobPrice / usdRate).toFixed(2)));

    setInquiryToEdit({
      id: '',
      inquiryNumber: '',
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      customerContact: '',
      wechatId: product.supplierContact || '',
      country: 'United States',
      product: product.name,
      material: product.material,
      colorVariant: product.colorVariants || '',
      packagingType: product.packagingType || '',
      hsCode: product.hsCode || '',
      boxLengthCm: product.cartonLengthCm,
      boxWidthCm: product.cartonWidthCm,
      boxHeightCm: product.cartonHeightCm,
      pcsPerBox: product.unitsPerCarton,
      grossWeightKg: product.grossWeightKg,
      netWeightKg: product.netWeightKg,
      productUrl1688: product.supplierUrl || '',
      supplierName: product.supplierName || '',
      quantity: product.quantity,
      quantityUnit: product.quantityUnit || 'pcs',
      price1688Rmb: priceRmb,
      marginPercent: 25,
      clientUnitPriceUsd: targetUsd || 0,
      totalQuotationUsd: Number(((targetUsd || 0) * product.quantity).toFixed(2)),
      estimatedProfitUsd: Number((((targetUsd || 0) * 0.25) * product.quantity).toFixed(2)),
      imageUrl: product.imageUrl || '',
      orderStatus: 'New Inquiry',
      notes: product.notes || '',
      updatedAt: new Date().toISOString(),
      products: [
        {
          id: `p_${Date.now()}`,
          productName: product.name,
          colorVariant: product.colorVariants || '',
          quantity: product.quantity,
          quantityUnit: product.quantityUnit || 'pcs',
          material: product.material,
          targetPriceUsd: targetUsd,
          targetPriceRmb: Number((targetUsd * usdRate).toFixed(2)),
          price1688Rmb: priceRmb,
          clientUnitPriceUsd: targetUsd,
          imageUrl: product.imageUrl || '',
          supplierUrl: product.supplierUrl || '',
          hsCode: product.hsCode || '',
          notes: product.notes || '',
        },
      ],
    });
    setIsInquiryModalOpen(true);
    showToast(`Created new inquiry pre-filled with ${product.name}`, 'info');
  };

  // Setup Firestore Subscriptions
  useEffect(() => {
    if (!user) return;
    
    const unsubInquiries = subscribeToUserInquiries(
      user.uid,
      (data) => {
        setInquiries(data);
        setSyncState((prev) => ({
          ...prev,
          status: 'connected',
          itemCount: data.length,
          lastSyncedAt: new Date().toISOString(),
        }));
      },
      (error) => {
        console.warn('[Firestore] Inquiries listener warning (offline or retrying):', error.message);
        setSyncState((prev) => ({
          ...prev,
          status: 'offline',
        }));
      }
    );

    const unsubRates = subscribeToUserExchangeRates(
      user.uid,
      (rates) => {
        if (rates) {
          setExchangeRates(rates);
          saveExchangeRates(rates);
        }
      },
      (error) => {
        console.warn('[Firestore] Exchange rates listener warning:', error.message);
      }
    );
    
    const unsubCustomers = subscribeToCustomers(
      user.uid,
      (data) => {
        setCustomers(data);
      },
      (error) => {
        console.warn('[Firestore] Customers listener warning:', error.message);
      }
    );

    const unsubServices = subscribeToServices(
      user.uid,
      (data) => {
        if (data && data.length > 0) {
          setServices(data);
        }
      },
      (error) => {
        console.warn('[Firestore] Services listener warning:', error.message);
      }
    );

    const unsubExpenses = subscribeToExpenses(
      user.uid,
      (data) => {
        if (data && data.length > 0) {
          setExpenses(data);
          saveLocalExpenses(data);
        }
      },
      (error) => {
        console.warn('[Firestore] Expenses listener warning:', error.message);
      }
    );

    const unsubTasks = subscribeToTasks(
      user.uid,
      (data) => {
        setTasks(data);
        saveLocalTasks(data);
      },
      (error) => {
        console.warn('[Firestore] Tasks listener warning:', error.message);
      }
    );

    const unsubProducts = subscribeToProducts(
      user.uid,
      (data) => {
        setProducts(data);
        saveLocalProducts(data);
      },
      (error) => {
        console.warn('[Firestore] Products listener warning:', error.message);
      }
    );

    migrateLocalDataToFirestoreIfEmpty(user.uid, inquiries, exchangeRates)
      .then((result) => {
        if (result.migrated && result.count > 0) {
          showToast(`Migrated ${result.count} local inquiries to Cloud Firestore`, 'success');
        }
      })
      .catch((err) => {
        console.warn('[Firestore] Migration check warning:', err);
      });

    migrateLocalTasksToFirestoreIfEmpty(user.uid, tasks)
      .then((res) => {
        if (res.migrated && res.count > 0) {
          showToast(`Synced ${res.count} tasks across devices via Cloud Firestore`, 'success');
        }
      })
      .catch((err) => {
        console.warn('[Firestore] Tasks migration warning:', err);
      });

    migrateLocalProductsToFirestoreIfEmpty(user.uid, products)
      .then((res) => {
        if (res.migrated && res.count > 0) {
          showToast(`Synced ${res.count} products across devices via Cloud Firestore`, 'success');
        }
      })
      .catch((err) => {
        console.warn('[Firestore] Products migration warning:', err);
      });

    syncUserProfile(user).catch((err) => {
      console.warn('[Firestore] User profile sync warning:', err);
    });

    return () => {
      unsubInquiries();
      unsubRates();
      unsubCustomers();
      unsubServices();
      unsubExpenses();
      unsubTasks();
      unsubProducts();
    };
  }, [user]);

  // Auth state listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
        setNeedsAuth(false);
        setIsLoadingAuth(false);
        if (typeof window !== 'undefined') {
          (window as any).__FIREBASE_USER__ = authenticatedUser;
          (window as any).__FIREBASE_UID__ = authenticatedUser.uid;
        }
        console.log('[SourcingFlow] Authenticated User UID:', authenticatedUser.uid, 'Email:', authenticatedUser.email);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setIsLoadingAuth(false);
        if (typeof window !== 'undefined') {
          (window as any).__FIREBASE_USER__ = null;
          (window as any).__FIREBASE_UID__ = null;
        }
      }
    );

    return () => unsubscribe();
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-indigo-600">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || needsAuth) {
    return <AuthPage onLogin={handleLogin} isLoggingIn={isLoggingIn} loginError={loginError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header 
        user={user}
        needsAuth={needsAuth}
        syncState={syncState}
        exchangeRates={exchangeRates}
        currencyView={currencyView}
        onCurrencyViewChange={handleCurrencyViewChange}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSync={handleManualSync}
        onOpenNewModal={() => {
          if (currentView === 'inquiries') {
            setInquiryToEdit(null);
            setIsInquiryModalOpen(true);
          } else if (currentView === 'products') {
            setProductToEdit(null);
            setIsProductModalOpen(true);
          } else if (currentView === 'customers') {
            setCustomerToEdit(null);
            setIsCustomerModalOpen(true);
          } else if (currentView === 'services') {
            setServiceToEdit(null);
            setIsServiceModalOpen(true);
          } else {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }
        }}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        isLoggingIn={isLoggingIn}
        currentView={currentView}
        onViewChange={setCurrentView}
        urgentTaskCount={urgentTaskCount}
      />
      
      <main className="flex-1 w-full max-w-none mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-3.5 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-8">
        {currentView === 'inquiries' ? (
          <>
            <StatsBar inquiries={inquiries} exchangeRates={exchangeRates} currencyView={currencyView} />
            <InquiryTable 
              inquiries={inquiries}
              customers={customers}
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
              onDuplicate={handleDuplicateInquiry}
              onReorder={handleReorderInquiries}
            />
          </>
        ) : currentView === 'products' ? (
          <ProductsPage
            products={products}
            exchangeRates={exchangeRates}
            currencyView={currencyView}
            user={user}
            syncState={syncState}
            onSync={handleManualSync}
            onAddProduct={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(prod) => {
              setProductToEdit(prod);
              setIsProductModalOpen(true);
            }}
            onViewProduct={(prod) => setProductToView(prod)}
            onDeleteProduct={handleDeleteProduct}
            onDuplicateProduct={handleDuplicateProduct}
            onCreateInquiryFromProduct={handleCreateInquiryFromProduct}
          />
        ) : currentView === 'customers' ? (
          <CustomersPage 
            customers={customers}
            inquiries={inquiries}
            onAdd={() => {
              setCustomerToEdit(null);
              setIsCustomerModalOpen(true);
            }}
            onEdit={(customer) => {
              setCustomerToEdit(customer);
              setIsCustomerModalOpen(true);
            }}
            onDelete={handleDeleteCustomer}
            onCreateInquiryForCustomer={(customer) => {
              setInquiryToEdit({
                id: '',
                inquiryNumber: '',
                date: new Date().toISOString().split('T')[0],
                customerName: customer.name,
                customerContact: customer.whatsapp || customer.contactEmail || customer.contactPhone || '',
                wechatId: customer.wechatId || '',
                country: customer.country || 'United States',
                product: '',
                quantity: 500,
                price1688Rmb: 0,
                marginPercent: 25,
                clientUnitPriceUsd: 0,
                totalQuotationUsd: 0,
                estimatedProfitUsd: 0,
                orderStatus: 'New Inquiry',
                updatedAt: new Date().toISOString(),
              });
              setIsInquiryModalOpen(true);
            }}
          />
        ) : currentView === 'services' ? (
          <ServicesPage
            services={services}
            exchangeRates={exchangeRates}
            currencyView={currencyView}
            onAdd={() => {
              setServiceToEdit(null);
              setIsServiceModalOpen(true);
            }}
            onEdit={(service) => {
              setServiceToEdit(service);
              setIsServiceModalOpen(true);
            }}
            onView={(service) => setServiceToView(service)}
            onDelete={handleDeleteService}
            onStatusChange={handleServiceStatusChange}
          />
        ) : (
          <TasksPage
            tasks={tasks}
            inquiries={inquiries}
            customers={customers}
            user={user}
            syncState={syncState}
            onSync={handleManualSync}
            onAddTask={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onChangeTaskPriority={handleChangeTaskPriority}
            onQuickAddTask={handleQuickAddTask}
            onViewInquiry={(inquiry) => {
              setItemToView(inquiry);
            }}
          />
        )}
      </main>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <button
          id="mobile-add-inquiry-fab"
          onClick={() => {
            if (currentView === 'inquiries') {
              setInquiryToEdit(null);
              setIsInquiryModalOpen(true);
            } else if (currentView === 'products') {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            } else if (currentView === 'customers') {
              setCustomerToEdit(null);
              setIsCustomerModalOpen(true);
            } else if (currentView === 'services') {
              setServiceToEdit(null);
              setIsServiceModalOpen(true);
            } else {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }
          }}
          className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition active:scale-90"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Modals */}
      <InquiryDetailModal
        isOpen={Boolean(itemToView)}
        item={itemToView}
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
        onDuplicate={(item) => {
          setItemToView(null);
          handleDuplicateInquiry(item);
        }}
        onDeleteRequest={(item) => {
          setItemToView(null);
          handleDeleteRequest(item);
        }}
        onStatusChange={handleStatusChange}
        onSplitInquiry={handleSplitInquiry}
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
        allInquiries={inquiries}
      />
      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        item={itemToDelete}
        inquiryNumber={itemToDelete?.inquiryNumber}
        onClose={() => setItemToDelete(null)}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
      <QuoteExportModal
        isOpen={Boolean(itemToShare)}
        item={itemToShare}
        inquiry={itemToShare}
        onClose={() => setItemToShare(null)}
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
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceToEdit(null);
        }}
        onSave={handleSaveService}
        onSaveExpense={handleSaveExpense}
        serviceToEdit={serviceToEdit}
        customers={customers}
        exchangeRates={exchangeRates}
        existingServices={services}
      />
      <ServiceDetailModal
        isOpen={Boolean(serviceToView)}
        onClose={() => setServiceToView(null)}
        service={serviceToView}
        exchangeRates={exchangeRates}
        onEdit={(service) => {
          setServiceToView(null);
          setServiceToEdit(service);
          setIsServiceModalOpen(true);
        }}
        onDelete={handleDeleteService}
        onStatusChange={handleServiceStatusChange}
      />
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        exchangeRates={exchangeRates}
        existingExpenses={expenses}
      />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        inquiries={inquiries}
        customers={customers}
      />
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleSaveProduct}
        productToEdit={productToEdit}
        exchangeRates={exchangeRates}
      />
      <ProductDetailModal
        isOpen={Boolean(productToView)}
        onClose={() => setProductToView(null)}
        product={productToView}
        exchangeRates={exchangeRates}
        currencyView={currencyView}
        onEdit={(prod) => {
          setProductToView(null);
          setProductToEdit(prod);
          setIsProductModalOpen(true);
        }}
        onDelete={(id) => {
          handleDeleteProduct(id);
          setProductToView(null);
        }}
        onDuplicate={(prod) => {
          setProductToView(null);
          handleDuplicateProduct(prod);
        }}
        onCreateInquiry={(prod) => {
          setProductToView(null);
          handleCreateInquiryFromProduct(prod);
        }}
      />
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 max-w-sm w-full shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/5 p-4 ${
          toastMessage.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-white text-slate-800'
        }`}>
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
  );
}

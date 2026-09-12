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
} from './lib/firestoreDb';
import {
  getSavedExchangeRates,
  saveExchangeRates,
  STORAGE_KEY_LOCAL_INQUIRIES,
  STORAGE_KEY_CURRENCY_VIEW,
  calculateInquiryPricing,
} from './lib/currency';
import { SAMPLE_INQUIRIES } from './lib/sampleData';
import { InquiryItem, OrderStatus, CloudSyncState, ExchangeRates, CurrencyViewMode, Customer } from './types';
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
import { subscribeToCustomers, saveCustomerToFirestore, deleteCustomerFromFirestore } from './lib/customersDb';
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
  const [currentView, setCurrentView] = useState<'inquiries' | 'customers'>('inquiries');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

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
    setSyncState(prev => ({ ...prev, isSyncing: true }));
    try {
      showToast('Syncing with Cloud Firestore...', 'info');
      setTimeout(() => {
        setSyncState(prev => ({ ...prev, isSyncing: false, lastSyncedAt: new Date().toISOString() }));
      }, 1000);
    } catch (err) {
      console.error(err);
      setSyncState(prev => ({ ...prev, isSyncing: false, error: 'Sync failed' }));
    }
  };

  const handleDeleteRequest = (item: InquiryItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const idToDelete = itemToDelete.id;
    setInquiries(prev => prev.filter(i => i.id !== idToDelete));
    setItemToDelete(null);
    if (user && user.uid) {
      try {
        await deleteInquiryFromFirestore(user.uid, idToDelete);
        showToast(`Deleted inquiry ${itemToDelete.inquiryNumber}`, 'success');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setInquiries(prev => prev.map(i => {
      if (i.id === id) {
        const updated = { ...i, orderStatus: status, updatedAt: new Date().toISOString() };
        if (user && user.uid) {
          saveInquiryToFirestore(user.uid, updated).catch(console.error);
        }
        return updated;
      }
      return i;
    }));
  };

  const handleSaveInquiry = async (savedItem: InquiryItem) => {
    setInquiries(prev => {
      const idx = prev.findIndex(i => i.id === savedItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedItem;
        return next;
      }
      return [savedItem, ...prev];
    });
    setIsInquiryModalOpen(false);
    setInquiryToEdit(null);
    
    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        await saveInquiryToFirestore(user.uid, savedItem);
        showToast(`Saved inquiry ${savedItem.inquiryNumber}`, 'success');
        setSyncState(prev => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        console.error('Failed to save inquiry to Firestore:', error);
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

  // Setup Firestore Subscriptions
  useEffect(() => {
    if (!user) return;
    
    const unsubInquiries = subscribeToUserInquiries(user.uid, (data) => {
      setInquiries(data);
      setSyncState(prev => ({ 
        ...prev, 
        status: 'connected', 
        itemCount: data.length,
        lastSyncedAt: new Date().toISOString()
      }));
    });

    const unsubRates = subscribeToUserExchangeRates(user.uid, (rates) => {
      if (rates) {
        setExchangeRates(rates);
        saveExchangeRates(rates);
      }
    });
    
    const unsubCustomers = subscribeToCustomers(user.uid, (data) => {
      setCustomers(data);
    });

    migrateLocalDataToFirestoreIfEmpty(user.uid, inquiries, exchangeRates).then((result) => {
      if (result.migrated && result.count > 0) {
        showToast(`Migrated ${result.count} local inquiries to Cloud Firestore`, 'success');
      }
    }).catch(console.error);

    syncUserProfile(user).catch(console.error);

    return () => {
      unsubInquiries();
      unsubRates();
      unsubCustomers();
    };
  }, [user]);

  // Auth state listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authenticatedUser) => {
        setUser(authenticatedUser);
        setNeedsAuth(false);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setIsLoadingAuth(false);
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
          } else {
            setCustomerToEdit(null);
            setIsCustomerModalOpen(true);
          }
        }}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        isLoggingIn={isLoggingIn}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {currentView === 'inquiries' ? (
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
            } else {
              setCustomerToEdit(null);
              setIsCustomerModalOpen(true);
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

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
import { InquiryItem, OrderStatus, CloudSyncState, ExchangeRates, CurrencyViewMode } from './types';
import { Header } from './components/Header';
import { StatsBar } from './components/StatsBar';
import { InquiryTable } from './components/InquiryTable';
import { InquiryModal } from './components/InquiryModal';
import { InquiryDetailModal } from './components/InquiryDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { QuoteExportModal } from './components/QuoteExportModal';
import { ExchangeRateModal } from './components/ExchangeRateModal';
import { AuthPage } from './components/AuthPage';
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

  // Firestore Real-Time Sync state
  const [syncState, setSyncState] = useState<CloudSyncState>({
    lastSyncedAt: null,
    isSyncing: true,
    error: null,
    status: 'syncing',
    itemCount: 0,
  });

  // Exchange Rates
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(getSavedExchangeRates);

  // Inquiries State (Firestore is the single source of truth)
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_LOCAL_INQUIRIES);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to load local inquiries cache:', e);
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

  // Cache locally only as an offline cache backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCAL_INQUIRIES, JSON.stringify(inquiries));
    } catch (e) {
      console.error('Failed to cache to local storage:', e);
    }
  }, [inquiries]);

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

  // Firestore Real-Time Sync Subscriptions when user is logged in
  useEffect(() => {
    if (!user || !user.uid) return;

    setSyncState((prev) => ({ ...prev, isSyncing: true, status: 'syncing' }));

    // 1. Sync User Profile
    syncUserProfile(user);

    // 2. Perform safe migration of existing local session data if cloud database is empty
    const localData = inquiries.length > 0 ? inquiries : SAMPLE_INQUIRIES;
    migrateLocalDataToFirestoreIfEmpty(user.uid, localData, exchangeRates).then((result) => {
      if (result.migrated && result.count > 0) {
        showToast(`Migrated ${result.count} existing records to your cloud database`, 'success');
      }
    });

    // 3. Real-time Inquiries Subscription (users/{uid}/inquiries)
    const unsubscribeInquiries = subscribeToUserInquiries(
      user.uid,
      (remoteItems) => {
        setInquiries(remoteItems);
        setSyncState({
          isSyncing: false,
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: null,
          status: 'connected',
          itemCount: remoteItems.length,
        });
      },
      (error) => {
        console.error('Firestore sync error:', error);
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error.message || 'Firestore connection error',
          status: 'error',
        }));
      }
    );

    // 4. Real-time Exchange Rates Subscription (users/{uid}/settings/rates)
    const unsubscribeRates = subscribeToUserExchangeRates(user.uid, (remoteRates) => {
      setExchangeRates(remoteRates);
      saveExchangeRates(remoteRates);
    });

    return () => {
      unsubscribeInquiries();
      unsubscribeRates();
    };
  }, [user]);

  // Login handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const loggedInUser = await googleSignIn();
      if (loggedInUser) {
        setUser(loggedInUser);
        setNeedsAuth(false);
        setLoginError(null);
        showToast(`Signed in as ${loggedInUser.email}`, 'success');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errMsg = err?.code === 'auth/network-request-failed'
        ? 'Third-party storage is blocked in this embedded preview. Please open the app in a new window.'
        : err?.message || 'Sign in failed. Please try again.';
      setLoginError(errMsg);
      showToast(errMsg, 'error');
      
      if (err?.code === 'auth/network-request-failed') {
         setTimeout(() => {
             // Attempt to open automatically if blocked
             window.open(window.location.href, '_blank');
         }, 1500);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNeedsAuth(true);
    setSyncState({
      lastSyncedAt: null,
      isSyncing: false,
      error: null,
      status: 'offline',
      itemCount: 0,
    });
    showToast('Signed out of Google Account', 'info');
  };

  // Manual trigger to force re-check status
  const handleManualSync = () => {
    if (!user) {
      handleLogin();
      return;
    }
    showToast('Real-time Cloud Firestore sync is active across all your devices', 'info');
  };

  // Save (Create or Update) an Inquiry directly in Firestore and optimistic state
  const handleSaveInquiry = async (savedItem: InquiryItem) => {
    // 1. Optimistically update local state immediately so UI updates with all fields
    setInquiries((prev) => {
      const idx = prev.findIndex((item) => item.id === savedItem.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedItem;
        return next;
      }
      return [savedItem, ...prev];
    });

    setIsInquiryModalOpen(false);
    setInquiryToEdit(null);

    // 2. Persist to Firestore if user is authenticated
    if (user && user.uid) {
      try {
        setSyncState((prev) => ({ ...prev, isSyncing: true }));
        await saveInquiryToFirestore(user.uid, savedItem);
        showToast(`Saved inquiry ${savedItem.inquiryNumber} to Cloud Firestore`, 'success');
      } catch (error: any) {
        console.error('Failed to save inquiry to Firestore:', error);
        showToast(`Failed to save to cloud: ${error.message}`, 'error');
        setSyncState((prev) => ({ ...prev, isSyncing: false, error: error.message }));
      }
    } else {
      showToast(`Saved inquiry ${savedItem.inquiryNumber} locally`, 'info');
    }
  };

  // Inline Status Change handler
  const handleStatusChange = async (item: InquiryItem, newStatus: OrderStatus) => {
    if (!user) return;

    try {
      const updatedItem: InquiryItem = {
        ...item,
        orderStatus: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await saveInquiryToFirestore(user.uid, updatedItem);
      showToast(`${item.inquiryNumber} status updated to "${newStatus}"`, 'info');
    } catch (error: any) {
      console.error('Failed to update status in Firestore:', error);
      showToast(`Failed to update status: ${error.message}`, 'error');
    }
  };

  // Delete Request -> Opens confirmation dialog
  const handleDeleteRequest = (item: InquiryItem) => {
    setItemToDelete(item);
  };

  // Confirmed Delete execution directly in Firestore
  const handleConfirmDelete = async () => {
    if (!itemToDelete || !user) return;
    const targetId = itemToDelete.id;
    const inqNum = itemToDelete.inquiryNumber;

    try {
      setSyncState((prev) => ({ ...prev, isSyncing: true }));
      // Delete document from Firestore: users/{uid}/inquiries/{id}
      await deleteInquiryFromFirestore(user.uid, targetId);
      setItemToDelete(null);
      showToast(`Deleted inquiry ${inqNum} from Cloud Firestore`, 'info');
    } catch (error: any) {
      console.error('Failed to delete inquiry from Firestore:', error);
      showToast(`Failed to delete: ${error.message}`, 'error');
      setSyncState((prev) => ({ ...prev, isSyncing: false, error: error.message }));
    }
  };

  // Exchange rate update in Firestore
  const handleSaveRates = async (newRates: ExchangeRates) => {
    setExchangeRates(newRates);
    saveExchangeRates(newRates);

    if (user) {
      try {
        await saveExchangeRatesToFirestore(user.uid, newRates);
        showToast(`Saved exchange rate: 1 USD = ¥${newRates.USD_TO_RMB} RMB to Cloud`, 'success');
      } catch (error: any) {
        console.error('Failed to save exchange rates to Firestore:', error);
      }
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm font-medium text-slate-500">Connecting to Cloud Firestore...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} isLoggingIn={isLoggingIn} loginError={loginError} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
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
          setInquiryToEdit(null);
          setIsInquiryModalOpen(true);
        }}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col space-y-4">
        {/* Real-time Cloud Sync Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
              Connected: {user.email}
            </span>
            {syncState.lastSyncedAt && (
              <span className="flex items-center gap-1 text-slate-500">
                <Cloud className="w-3 h-3 text-slate-400" />
                Live Firestore Sync active (Last updated {syncState.lastSyncedAt})
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Single Source of Truth: Cloud Firestore (Multi-device sync)</span>
          </div>
        </div>

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
      </main>

      {/* Floating Action / Add Inquiry on mobile */}
      <div className="fixed bottom-4 right-4 sm:hidden z-20">
        <button
          id="mobile-add-inquiry-fab"
          onClick={() => {
            setInquiryToEdit(null);
            setIsInquiryModalOpen(true);
          }}
          className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition active:scale-90"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Modals */}
      <InquiryDetailModal
        isOpen={Boolean(itemToView)}
        item={inquiries.find((i) => i.id === itemToView?.id) || itemToView}
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
        item={itemToDelete}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

      <QuoteExportModal
        isOpen={Boolean(itemToShare)}
        item={itemToShare}
        onClose={() => setItemToShare(null)}
      />

      <ExchangeRateModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={exchangeRates}
        onSaveRates={handleSaveRates}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 rounded-md shadow-lg text-xs font-medium border flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Plus,
  DollarSign,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Database,
  Copy,
  Check,
} from 'lucide-react';
import { CloudSyncState, ExchangeRates, CurrencyViewMode } from '../types';

interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  syncState: CloudSyncState;
  exchangeRates: ExchangeRates;
  currencyView: CurrencyViewMode;
  onCurrencyViewChange: (mode: CurrencyViewMode) => void;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
  onOpenNewModal: () => void;
  onOpenRatesModal: () => void;
  isLoggingIn: boolean;
  currentView: 'inquiries' | 'customers';
  onViewChange: (view: 'inquiries' | 'customers') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  needsAuth,
  syncState,
  exchangeRates,
  currencyView,
  onCurrencyViewChange,
  onLogin,
  onLogout,
  onSync,
  onOpenNewModal,
  onOpenRatesModal,
  isLoggingIn,
  currentView,
  onViewChange,
}) => {
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCopyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="w-full max-w-none mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full flex flex-col justify-center py-2 sm:py-0 sm:h-14">
          {/* Mobile Header Layout (< 640px) */}
          <div className="flex sm:hidden flex-col gap-2">
            {/* Top Row: Brand & Quick Action Controls */}
            <div className="flex items-center justify-between gap-2">
              {/* Brand SF + SourcingFlow */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                  SF
                </div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                  SourcingFlow
                </h1>
              </div>

              {/* Right: Exchange Rate, Sync, New Button, Profile */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Exchange Rate Quick View */}
                <button
                  type="button"
                  id="header-mobile-exchange-rate-btn"
                  onClick={onOpenRatesModal}
                  title="Click to adjust exchange rate"
                  className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 text-[11px] text-slate-700 border border-slate-200 transition font-semibold active:scale-95"
                >
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  <span>¥{exchangeRates.USD_TO_RMB.toFixed(2)}</span>
                </button>

                {/* Cloud Firestore Sync Indicator */}
                {user && (
                  <div className="flex items-center">
                    {needsAuth ? (
                      <button
                        type="button"
                        id="header-mobile-reconnect-btn"
                        onClick={onLogin}
                        disabled={isLoggingIn}
                        className="flex items-center space-x-1 px-2 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-[11px] text-amber-800 font-semibold transition shadow-2xs"
                        title="Session expired. Click to reconnect"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>Auth</span>
                      </button>
                    ) : syncState.isSyncing ? (
                      <div className="p-1 bg-indigo-50 rounded-full border border-indigo-200" title="Syncing...">
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      </div>
                    ) : syncState.error ? (
                      <div className="p-1 bg-rose-50 rounded-full border border-rose-200 text-rose-700" title={syncState.error}>
                        <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs"
                        title={`Real-time Cloud Firestore active (${syncState.itemCount} items synchronized)`}
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <Cloud className="w-3 h-3 text-emerald-600" />
                      </div>
                    )}
                  </div>
                )}

                {/* New Action */}
                <button
                  type="button"
                  id="header-mobile-new-inquiry-btn"
                  onClick={onOpenNewModal}
                  className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New</span>
                </button>

                {/* Auth / Profile Area */}
                {user ? (
                  <div className="flex items-center space-x-1.5 pl-1.5 border-l border-slate-200">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google User'}
                        className="w-6 h-6 rounded-full ring-1 ring-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <button
                      type="button"
                      id="header-mobile-logout-btn"
                      onClick={onLogout}
                      title="Sign out of Google Account"
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="header-mobile-google-signin-btn"
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-xs transition disabled:opacity-50"
                  >
                    <span>Sign in</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: View Switcher (Inquiries / Customers) & Currency Toggle */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              {/* View Switcher */}
              {user ? (
                <div className="flex-1 grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    id="header-mobile-view-inquiries-btn"
                    onClick={() => onViewChange('inquiries')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition text-center ${
                      currentView === 'inquiries'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inquiries
                  </button>
                  <button
                    type="button"
                    id="header-mobile-view-customers-btn"
                    onClick={() => onViewChange('customers')}
                    className={`py-1.5 px-2 rounded-md text-xs font-semibold transition text-center ${
                      currentView === 'customers'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Customers
                  </button>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              {/* Currency View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs shrink-0 shadow-2xs">
                <button
                  type="button"
                  id="header-mobile-currency-usd-btn"
                  onClick={() => onCurrencyViewChange('USD')}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition ${
                    currencyView === 'USD'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Display in US Dollars ($)"
                >
                  $
                </button>
                <button
                  type="button"
                  id="header-mobile-currency-rmb-btn"
                  onClick={() => onCurrencyViewChange('RMB')}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition ${
                    currencyView === 'RMB'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Display in Chinese Yuan (¥)"
                >
                  ¥
                </button>
                <button
                  type="button"
                  id="header-mobile-currency-dual-btn"
                  onClick={() => onCurrencyViewChange('DUAL')}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition ${
                    currencyView === 'DUAL'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Display both USD & RMB side-by-side"
                >
                  Dual
                </button>
              </div>
            </div>
          </div>

          {/* Tablet & Desktop Header Layout (>= 640px) */}
          <div className="hidden sm:flex items-center justify-between h-14 gap-2">
            {/* Brand / Title & View Switcher */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  SF
                </div>
                <div>
                  <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    SourcingFlow
                  </h1>
                </div>
              </div>

              {user && (
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    id="header-view-inquiries-btn"
                    onClick={() => onViewChange('inquiries')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-semibold transition ${
                      currentView === 'inquiries'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inquiries
                  </button>
                  <button
                    type="button"
                    id="header-view-customers-btn"
                    onClick={() => onViewChange('customers')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-semibold transition ${
                      currentView === 'customers'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Customers
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2.5 lg:space-x-3 shrink-0">
              {/* Currency View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs shadow-2xs">
                <button
                  type="button"
                  id="header-currency-usd-btn"
                  onClick={() => onCurrencyViewChange('USD')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    currencyView === 'USD'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Display in US Dollars ($)"
                >
                  <span className="hidden lg:inline">$ USD</span>
                  <span className="lg:hidden">$</span>
                </button>
                <button
                  type="button"
                  id="header-currency-rmb-btn"
                  onClick={() => onCurrencyViewChange('RMB')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    currencyView === 'RMB'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Display in Chinese Yuan (¥)"
                >
                  <span className="hidden lg:inline">¥ RMB</span>
                  <span className="lg:hidden">¥</span>
                </button>
                <button
                  type="button"
                  id="header-currency-dual-btn"
                  onClick={() => onCurrencyViewChange('DUAL')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                    currencyView === 'DUAL'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Display both USD & RMB side-by-side"
                >
                  <span className="hidden lg:inline">Both ($/¥)</span>
                  <span className="lg:hidden">Dual</span>
                </button>
              </div>

              {/* Exchange Rate Quick View */}
              <button
                type="button"
                id="header-exchange-rate-btn"
                onClick={onOpenRatesModal}
                title="Click to adjust exchange rate"
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 border border-slate-200 transition font-semibold"
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline text-slate-500">1 USD =</span>
                <span>¥{exchangeRates.USD_TO_RMB.toFixed(2)}</span>
              </button>

              {/* Cloud Firestore Sync Indicator */}
              {user && (
                <div className="flex items-center space-x-1.5">
                  {needsAuth ? (
                    <button
                      type="button"
                      id="header-reconnect-btn"
                      onClick={onLogin}
                      disabled={isLoggingIn}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs text-amber-800 font-medium transition shadow-xs"
                      title="Session expired. Click to sign in again"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      <span>{isLoggingIn ? '...' : 'Reconnect'}</span>
                    </button>
                  ) : syncState.isSyncing ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                      <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                      <span className="text-xs font-medium text-indigo-700 hidden md:inline">
                        Syncing...
                      </span>
                    </div>
                  ) : syncState.error ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 rounded-full border border-rose-200 text-rose-700 text-xs font-medium" title={syncState.error}>
                      <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                      <span className="hidden md:inline">Offline</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-800 text-xs font-medium shadow-2xs" title={`Real-time Cloud Firestore active (${syncState.itemCount} items synchronized)`}>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden md:inline">Synced</span>
                    </div>
                  )}
                </div>
              )}

              {/* New Action */}
              <button
                type="button"
                id="header-new-inquiry-btn"
                onClick={onOpenNewModal}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{currentView === 'inquiries' ? 'New Inquiry' : 'New Customer'}</span>
                <span className="md:hidden">New</span>
              </button>

              {/* Auth / Profile Area */}
              {user ? (
                <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-7 h-7 rounded-full ring-1 ring-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden xl:block text-right">
                    <p className="text-xs font-semibold leading-tight text-slate-800 truncate max-w-[130px]">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      <p className="text-[10px] text-slate-500 leading-none truncate max-w-[110px]" title={user.email || ''}>
                        {user.email}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyUid}
                        title={`Click to copy Firebase User UID: ${user.uid}`}
                        className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                      >
                        {copiedUid ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                        <span className="ml-0.5 font-mono">{copiedUid ? 'Copied' : 'UID'}</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    id="header-logout-btn"
                    onClick={onLogout}
                    title="Sign out of Google Account"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="header-google-signin-btn"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span className="hidden sm:inline">{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
                  <span className="sm:hidden">{isLoggingIn ? '...' : 'Sign in'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

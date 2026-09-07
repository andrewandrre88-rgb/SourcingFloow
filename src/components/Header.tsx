import React from 'react';
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
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand / Title */}
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
          </div>

          {/* Controls & User Account */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Currency Mode Switcher: USD ($) | RMB (¥) | Dual */}
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
                $ USD
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
                ¥ RMB
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
                Both ($ / ¥)
              </button>
            </div>

            {/* Exchange Rate Quick View */}
            <button
              id="header-exchange-rate-btn"
              onClick={onOpenRatesModal}
              title="Click to adjust exchange rate"
              className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 border border-slate-200 transition font-medium"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
              <span>1 USD = ¥{exchangeRates.USD_TO_RMB.toFixed(2)}</span>
            </button>

            {/* Cloud Firestore Sync Indicator */}
            {user && (
              <div className="flex items-center space-x-1.5">
                {needsAuth ? (
                  <button
                    id="header-reconnect-btn"
                    onClick={onLogin}
                    disabled={isLoggingIn}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs text-amber-800 font-medium transition shadow-xs"
                    title="Session expired. Click to sign in again"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>{isLoggingIn ? 'Connecting...' : 'Reconnect'}</span>
                  </button>
                ) : syncState.isSyncing ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 rounded-full border border-indigo-200">
                    <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                    <span className="text-xs font-medium text-indigo-700 hidden sm:inline">
                      Syncing...
                    </span>
                  </div>
                ) : syncState.error ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 rounded-full border border-rose-200 text-rose-700 text-xs font-medium" title={syncState.error}>
                    <CloudOff className="w-3.5 h-3.5 text-rose-500" />
                    <span className="hidden sm:inline">Offline</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-800 text-xs font-medium shadow-2xs" title={`Real-time Cloud Firestore active (${syncState.itemCount} items synchronized)`}>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Cloud Synced</span>
                  </div>
                )}
              </div>
            )}

            {/* New Inquiry Action */}
            <button
              id="header-new-inquiry-btn"
              onClick={onOpenNewModal}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-xs transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Inquiry</span>
            </button>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
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
                  <p className="text-[10px] text-slate-500 leading-none truncate max-w-[130px]">
                    {user.email}
                  </p>
                </div>
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  title="Sign out of Google Account"
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-google-signin-btn"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-xs transition disabled:opacity-50"
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
                <span className="hidden sm:inline">{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span><span className="sm:hidden">{isLoggingIn ? '...' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


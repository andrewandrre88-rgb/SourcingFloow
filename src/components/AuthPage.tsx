import React from 'react';
import { PackageOpen, AlertCircle, ExternalLink } from 'lucide-react';

interface AuthPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  loginError?: string | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, isLoggingIn, loginError }) => {
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="p-8 pb-6 flex flex-col items-center border-b border-slate-100 bg-indigo-600">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm mb-4">
            <PackageOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
            Sourcing Agent Pro
          </h1>
          <p className="text-indigo-100 text-sm font-medium text-center">
            Sign in to access your inquiries with real-time multi-device cloud sync
          </p>
        </div>
        
        <div className="p-8 flex flex-col items-center">
          {loginError && (
            <div className="w-full mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Sign in Notice</p>
                <p className="text-rose-700 leading-relaxed">{loginError}</p>
                {isIframe && (
                  <p className="pt-1 text-slate-700">
                    Tip: If your browser blocks popups in the preview window, open the app in a new tab to sign in.
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            className="w-full relative flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none disabled:active:scale-100 shadow-xs"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 absolute left-6" viewBox="0 0 48 48">
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
                Continue with Google
              </>
            )}
          </button>

          {isIframe && (
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full py-2.5 px-4 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium flex items-center justify-center gap-1.5 transition text-center"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Open in New Window</span>
            </a>
          )}
          
          <div className="mt-8 text-center text-xs text-slate-500 max-w-sm">
            <p className="mb-2">
              <span className="font-semibold text-slate-700">Cloud Synchronized</span><br />
              All your inquiries, 1688 quotes, and profit margins automatically sync across your computer, iPad, and phone in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    syncUserProfile(user).catch(console.error);

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

  return (`;

const replacement = `    syncUserProfile(user).catch(console.error);

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

  return (`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);

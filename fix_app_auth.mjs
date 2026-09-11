import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /  return \([\s\S]*?<div className="min-h-screen bg-slate-50 flex flex-col font-sans">/;

const newReturn = `  if (isLoadingAuth) {
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">`;

content = content.replace(regex, newReturn);
fs.writeFileSync('src/App.tsx', content);

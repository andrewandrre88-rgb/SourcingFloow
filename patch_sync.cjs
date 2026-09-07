const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Update loadFromGoogle signature and body
code = code.replace(
  'const loadFromGoogle = useCallback(\n    async (currentToken: string) => {',
  'const loadFromGoogle = useCallback(\n    async (currentToken: string, silent: boolean = false) => {'
);

code = code.replace(
  'setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));',
  'if (!silent) setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));'
);

code = code.replace(
  'if (remoteItems && remoteItems.length > 0) {\n          setInquiries(remoteItems);\n          showToast(`Synced ${remoteItems.length} inquiries from your Google Sheet`, \'success\');\n        } else if (inquiries.length > 0) {',
  `if (remoteItems && remoteItems.length > 0) {
          setInquiries((prev) => {
            const isChanged = JSON.stringify(prev) !== JSON.stringify(remoteItems);
            if (isChanged && !silent) {
              showToast(\`Synced \${remoteItems.length} inquiries from your Google Sheet\`, 'success');
            }
            return isChanged ? remoteItems : prev;
          });
        } else if (inquiries.length > 0 && !silent) {`
);

code = code.replace(
  'isSyncing: false,',
  'isSyncing: false,'
); // just a no-op replace to make sure it exists


// Add the polling useEffect right after the existing useEffect that calls loadFromGoogle(token);
const existingEffect = `  useEffect(() => {
    if (token) {
      loadFromGoogle(token);
    }
  }, [token]);`;

const newEffect = `  useEffect(() => {
    if (token) {
      loadFromGoogle(token);
    }
  }, [token]);

  // Auto-sync polling and window focus
  useEffect(() => {
    if (!token) return;

    // Poll every 30 seconds silently
    const interval = setInterval(() => {
      loadFromGoogle(token, true);
    }, 30000);

    // Sync when user returns to the tab
    const handleFocus = () => {
      loadFromGoogle(token, true);
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, loadFromGoogle]);`;

code = code.replace(existingEffect, newEffect);

fs.writeFileSync('src/App.tsx', code);

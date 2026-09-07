import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const errMsg = err\?\.code === 'auth\/network-request-failed'[\s\S]*?showToast\(errMsg, 'error'\);/,
  `const errMsg = err?.code === 'auth/network-request-failed'
        ? 'Third-party storage is blocked in this embedded preview. Please open the app in a new window.'
        : err?.message || 'Sign in failed. Please try again.';
      setLoginError(errMsg);
      showToast(errMsg, 'error');
      
      if (err?.code === 'auth/network-request-failed') {
         setTimeout(() => {
             // Attempt to open automatically if blocked
             window.open(window.location.href, '_blank');
         }, 1500);
      }`
);

fs.writeFileSync('src/App.tsx', content);

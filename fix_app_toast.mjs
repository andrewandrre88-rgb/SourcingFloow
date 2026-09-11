import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const firstShowToast = `  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };\n`;

// Only keep one showToast (the second one which was the original)
content = content.replace(firstShowToast, '');
fs.writeFileSync('src/App.tsx', content);

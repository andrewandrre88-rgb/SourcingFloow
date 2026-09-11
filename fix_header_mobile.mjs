import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

content = content.replace(
  /<div className="hidden md:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">/,
  '<div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-lg border border-slate-200">'
);

fs.writeFileSync('src/components/Header.tsx', content);

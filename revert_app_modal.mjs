import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /existingCount=\{inquiries\.length\}\n        customers=\{customers\}\n      \/>/,
  `existingCount={inquiries.length}\n      />`
);

fs.writeFileSync('src/App.tsx', content);

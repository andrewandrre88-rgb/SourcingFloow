import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

content = content.replace(
  /  onOpenRatesModal,\n  isLoggingIn\n\}\) => \{/,
  `  onOpenRatesModal,
  isLoggingIn,
  currentView,
  onViewChange
}) => {`
);

// also remove duplicate interface props
content = content.replace(
  /  currentView: 'inquiries' \| 'customers';\n  onViewChange: \(view: 'inquiries' \| 'customers'\) => void;\n  currentView: 'inquiries' \| 'customers';\n  onViewChange: \(view: 'inquiries' \| 'customers'\) => void;/,
  `  currentView: 'inquiries' | 'customers';
  onViewChange: (view: 'inquiries' | 'customers') => void;`
);

fs.writeFileSync('src/components/Header.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

if (!content.includes('Menu,')) {
  content = content.replace(/import \{\n  Cloud,/, `import {\n  Menu,\n  Cloud,`);
}

content = content.replace(
  /currentView: string;\n  onSidebarToggle: \(\) => void;/,
  `currentView: string;\n  onSidebarToggle: () => void;\n}`
);

content = content.replace(
  /  isLoggingIn,\n  currentView,\n  onSidebarToggle,\n\}\) => \{/,
  `  isLoggingIn,\n  currentView,\n  onSidebarToggle,\n}) => {`
);

fs.writeFileSync('src/components/Header.tsx', content);

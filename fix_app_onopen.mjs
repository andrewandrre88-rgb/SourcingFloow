import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /onOpenNewModal=\{\(\) => \{\n          setInquiryToEdit\(null\);\n          setIsInquiryModalOpen\(true\);\n        \}\}/,
  `onOpenNewModal={() => {
          if (currentView === 'inquiries') {
            setInquiryToEdit(null);
            setIsInquiryModalOpen(true);
          } else {
            setCustomerToEdit(null);
            setIsCustomerModalOpen(true);
          }
        }}`
);

fs.writeFileSync('src/App.tsx', content);

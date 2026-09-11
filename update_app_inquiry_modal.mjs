import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<InquiryModal\n        isOpen=\{isInquiryModalOpen\}\n        onClose=\{\(\) => \{\n          setIsInquiryModalOpen\(false\);\n          setInquiryToEdit\(null\);\n        \}\}\n        onSave=\{handleSaveInquiry\}\n        inquiryToEdit=\{inquiryToEdit\}\n        exchangeRates=\{exchangeRates\}\n        existingCount=\{inquiries.length\}\n      \/>/,
  `<InquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => {
          setIsInquiryModalOpen(false);
          setInquiryToEdit(null);
        }}
        onSave={handleSaveInquiry}
        inquiryToEdit={inquiryToEdit}
        exchangeRates={exchangeRates}
        existingCount={inquiries.length}
        customers={customers}
      />`
);

fs.writeFileSync('src/App.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('src/components/InquiryModal.tsx', 'utf8');

// Find the import line for InquiryItem and append Customer
content = content.replace(
  /InquiryItem,\n  OrderStatus,/,
  `InquiryItem,\n  OrderStatus,\n  Customer,`
);

fs.writeFileSync('src/components/InquiryModal.tsx', content);

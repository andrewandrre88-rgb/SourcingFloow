import fs from 'fs';
let content = fs.readFileSync('src/components/InquiryModal.tsx', 'utf8');

content = content.replace(
  /InquiryItem,\n  OrderStatus,\n  Customer,/,
  `InquiryItem,\n  OrderStatus,`
);

fs.writeFileSync('src/components/InquiryModal.tsx', content);

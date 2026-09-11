const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('export interface Customer')) {
  content += `

export interface Customer {
  id: string; // Unique ID
  name: string; // Company or Contact Name
  contactEmail?: string;
  contactPhone?: string;
  whatsapp?: string;
  wechatId?: string;
  country?: string;
  type: 'Active' | 'Potential' | 'Past';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
`;
  fs.writeFileSync('src/types.ts', content);
}

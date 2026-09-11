import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

const newTypes = `
export type AppView = 'dashboard' | 'kanban' | 'customers' | 'suppliers' | 'logistics';

export interface Supplier {
  id: string;
  name: string;
  productCategory: string;
  contactName?: string;
  wechatId?: string;
  phone?: string;
  url1688?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogisticsCalculation {
  cartons: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  grossWeightKgPerCarton: number;
  totalCbm: number;
  totalVolumetricWeightKg: number;
  totalGrossWeightKg: number;
  chargeableWeightKg: number;
}
`;

content = content + newTypes;

fs.writeFileSync('src/types.ts', content);

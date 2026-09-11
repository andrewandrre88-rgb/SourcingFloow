import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/export type AppView = 'dashboard' \| 'kanban' \| 'customers' \| 'suppliers' \| 'logistics';\n\nexport interface Supplier \{[\s\S]*?\}\n\nexport interface LogisticsCalculation \{[\s\S]*?\}\n/, '');

fs.writeFileSync('src/types.ts', content);

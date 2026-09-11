import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/export default App;\s*$/, '');

fs.writeFileSync('src/App.tsx', content);

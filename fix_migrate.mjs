import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    migrateLocalDataToFirestoreIfEmpty(user.uid).then((migratedCount) => {
      if (migratedCount > 0) {
        showToast(\\\`Migrated \\\${migratedCount} local inquiries to Cloud Firestore\\\`, 'success');
      }
    }).catch(console.error);`;

const replacement = `    migrateLocalDataToFirestoreIfEmpty(user.uid, inquiries, exchangeRates).then((result) => {
      if (result.migrated && result.count > 0) {
        showToast(\\\`Migrated \\\${result.count} local inquiries to Cloud Firestore\\\`, 'success');
      }
    }).catch(console.error);`;

content = content.replace(/    migrateLocalDataToFirestoreIfEmpty\(user\.uid\)\.then\(\(migratedCount\) => \{\n      if \(migratedCount > 0\) \{\n        showToast\(`Migrated \${migratedCount} local inquiries to Cloud Firestore`, 'success'\);\n      \}\n    \}\)\.catch\(console\.error\);/,
`    migrateLocalDataToFirestoreIfEmpty(user.uid, inquiries, exchangeRates).then((result) => {
      if (result.migrated && result.count > 0) {
        showToast(\`Migrated \${result.count} local inquiries to Cloud Firestore\`, 'success');
      }
    }).catch(console.error);`);

fs.writeFileSync('src/App.tsx', content);

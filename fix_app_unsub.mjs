import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const unsubscribeInquiries = subscribeToUserInquiries\(/,
  `const unsubscribeCustomers = subscribeToCustomers(user.uid, (data) => {
      setCustomers(data);
    });
    
    const unsubscribeInquiries = subscribeToUserInquiries(`
);

fs.writeFileSync('src/App.tsx', content);

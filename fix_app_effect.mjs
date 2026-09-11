import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const badReturnStr = `    );

    return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">`;

const fixedReturnStr = `    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">`;

content = content.replace(badReturnStr, fixedReturnStr);

fs.writeFileSync('src/App.tsx', content);

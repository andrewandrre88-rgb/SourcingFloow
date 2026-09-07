const fs = require('fs');
const file = 'src/components/InquiryModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace parseFloat(e.target.value) || 0  with  e.target.value as any
content = content.replace(/parseFloat\(e\.target\.value\)\s*\|\|\s*0/g, 'e.target.value as any');

// Replace parseFloat(e.target.value) || 1  with  e.target.value as any
content = content.replace(/parseFloat\(e\.target\.value\)\s*\|\|\s*1/g, 'e.target.value as any');

// Replace e.target.value !== '' ? parseFloat(e.target.value) : undefined  with  e.target.value === '' ? undefined : e.target.value as any
content = content.replace(/e\.target\.value !== '' \? parseFloat\(e\.target\.value\) : undefined/g, "e.target.value === '' ? undefined : e.target.value as any");

// Also fix .toLocaleString() which will crash on string
content = content.replace(/formData\.quantity\.toLocaleString\(\)/g, "Number(formData.quantity || 0).toLocaleString()");
content = content.replace(/formData\.moq - formData\.quantity\)\.toLocaleString\(\)/g, "Number(formData.moq || 0) - Number(formData.quantity || 0)).toLocaleString()");
content = content.replace(/formData\.moq\.toLocaleString\(\)/g, "Number(formData.moq || 0).toLocaleString()");

content = content.replace(/Math\.round\(formData\.quantity \*/g, "Math.round(Number(formData.quantity || 0) *");

fs.writeFileSync(file, content);

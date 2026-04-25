const fs = require('fs');
const files = [
  './src/pages/DeepFunnelPublic.tsx',
  './src/pages/Index.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace rounded-sm with rounded-full
  content = content.replace(/rounded-sm/g, 'rounded-full');
  
  // Replace rounded-md with rounded-2xl for a bit more organic feel on cards
  content = content.replace(/rounded-md/g, 'rounded-2xl');
  
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});

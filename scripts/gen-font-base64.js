// scripts/gen-font-base64.js
const fs = require('fs');
const font   = fs.readFileSync('public/fonts/THSarabunNew Bold.ttf').toString('base64');
const output = `/* generated */\nexport default \`${font}\`;`;
fs.writeFileSync('app/fonts/THSarabunNew Bold.base64.ts', output);
console.log('✅ Wrote app/fonts/THSarabunNew Bold.base64.ts');

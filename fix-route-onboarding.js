const fs = require('fs');
const filePath = 'src/app/api/onboarding/route.ts';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/single_choice/g, 'multiple_choice');
fs.writeFileSync(filePath, content);

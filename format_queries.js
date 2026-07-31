const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\report_uc_data_correction.md';
let content = fs.readFileSync(path, 'utf8');
const regex = /^\d+\.\s+([^:\n]+):\s*\n```sql\n([\s\S]*?)\n```/gm;
const newContent = content.replace(regex, (match, title, query) => {
    const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);
    return `**${formattedTitle}:**\n${query.trim()}\n`;
});
fs.writeFileSync(path, newContent, 'utf8');
console.log('Done');

const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\mermaid_diagrams.md';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove config blocks
content = content.replace(/---\r?\nconfig:.*?\r?\n---\r?\n?/g, '');

// 2. Fix actor and participant aliases (remove colon)
content = content.replace(/(actor|participant)\s+(.*?)\s+as\s+:\s+(.*)/g, '  as ');

// 3. Fix alt and else conditions (remove brackets)
content = content.replace(/alt\s+\[(.*?)\]/g, 'alt ');
content = content.replace(/else\s+\[(.*?)\]/g, 'else ');

// 4. Remove all activate / deactivate
content = content.replace(/^\s*activate\s+[A-Za-z0-9_]+\s*\r?\n/gm, '');
content = content.replace(/^\s*deactivate\s+[A-Za-z0-9_]+\s*\r?\n/gm, '');

fs.writeFileSync(path, content, 'utf8');

console.log('Done rewriting mermaid diagrams.');

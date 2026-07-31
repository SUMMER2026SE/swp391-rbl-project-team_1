const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\mermaid_diagrams.md';

let content = fs.readFileSync(path, 'utf8');

// First, remove all + and - from arrows
content = content.replace(/->>\+/g, '->>');
content = content.replace(/-->>-/g, '-->>');

// We need to inject activate and deactivate.
// This is complex. Let's just do it cleanly for each known pattern.
// Since the structure of each UC is predictable, we can write a function to fix it.
// Actually, mermaid CAN handle lifelines if we just use explicit activate/deactivate AFTER the message.
// Let's replace:
// Source->>Target: message
// with:
// Source->>Target: message
// activate Target
//
// And for return:
// Source-->>Target: message
// deactivate Source
//
// BUT wait, we must NOT deactivate inside an lt if it was activated outside!
// So we just won't deactivate inside lt.
// Let's strip all existing activate/deactivate first.
content = content.replace(/^\s*activate\s+[A-Za-z0-9_]+\r?\n/gm, '');
content = content.replace(/^\s*deactivate\s+[A-Za-z0-9_]+\r?\n/gm, '');

// A robust approach: Just define the explicit sequences for each UC manually in a JS template to be perfect.

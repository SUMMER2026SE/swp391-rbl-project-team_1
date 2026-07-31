const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\mermaid_diagrams.md';

let content = fs.readFileSync(path, 'utf8');

// 1. Strip all existing lifelines
content = content.replace(/->>\+/g, '->>');
content = content.replace(/-->>-/g, '-->>');
content = content.replace(/^\s*activate\s+[A-Za-z0-9_]+\r?\n/gm, '');
content = content.replace(/^\s*deactivate\s+[A-Za-z0-9_]+\r?\n/gm, '');

let inSequence = false;
let lines = content.split(/\r?\n/);

let activeLifelines = new Set();
let inAlt = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.trim() === 'sequenceDiagram') {
        inSequence = true;
        activeLifelines.clear();
        inAlt = false;
        continue;
    }
    if (inSequence && line.trim() === '\\\') {
        inSequence = false;
        // If there are any active lifelines left, deactivate them (safely)
        let deactivates = [];
        for (let l of activeLifelines) {
            deactivates.push('    deactivate ' + l);
        }
        if (deactivates.length > 0) {
            lines.splice(i, 0, ...deactivates);
            i += deactivates.length;
        }
        activeLifelines.clear();
        continue;
    }

    if (inSequence) {
        if (line.trim().startsWith('alt ') || line.trim().startsWith('loop ') || line.trim().startsWith('opt ')) {
            inAlt = true;
        }
        if (line.trim() === 'end') {
            inAlt = false;
        }

        let match = line.match(/^(\s*)([A-Za-z0-9_]+)(->>|-->>)([A-Za-z0-9_]+):\s*(.*)$/);
        if (match) {
            let indent = match[1];
            let source = match[2];
            let arrow = match[3];
            let target = match[4];
            let msg = match[5];

            let noActivate = ['Guest', 'User', 'Patient', 'Doctor', 'Admin', 'Browser'];
            
            if (source !== target) {
                if (arrow === '->>') {
                    if (!noActivate.includes(target) && !activeLifelines.has(target)) {
                        // Activate target after this line
                        lines.splice(i + 1, 0, indent + 'activate ' + target);
                        activeLifelines.add(target);
                        i++;
                    }
                } else if (arrow === '-->>') {
                    if (!noActivate.includes(source) && activeLifelines.has(source)) {
                        // If we are in an alt block, delay deactivation until the end of the diagram
                        // to prevent mermaid parse errors from unmatched scopes.
                        // ONLY deactivate immediately if NOT in an alt block.
                        if (!inAlt) {
                            lines.splice(i + 1, 0, indent + 'deactivate ' + source);
                            activeLifelines.delete(source);
                            i++;
                        }
                    }
                }
            }
        }
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Successfully added explicit robust activation boxes to Mermaid diagrams.');

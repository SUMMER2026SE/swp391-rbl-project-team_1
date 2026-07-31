const fs = require('fs');
const path = 'C:\\Users\\Heota\\.gemini\\antigravity-ide\\brain\\21ca6da9-1afe-4819-b27a-1cb3c4d8338f\\mermaid_diagrams.md';

let content = fs.readFileSync(path, 'utf8');

// We only want to process sequenceDiagram blocks
let inSequence = false;
let lines = content.split(/\r?\n/);

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.trim() === 'sequenceDiagram') {
        inSequence = true;
        continue;
    }
    if (inSequence && line.trim() === '\\\') {
        inSequence = false;
        continue;
    }

    if (inSequence) {
        // Match a message line: Source->>Target: Message or Source-->>Target: Message
        let match = line.match(/^(\s*)([A-Za-z0-9_]+)(->>|-->>)([A-Za-z0-9_]+):\s*(.*)$/);
        if (match) {
            let indent = match[1];
            let source = match[2];
            let arrow = match[3];
            let target = match[4];
            let msg = match[5];

            // Don't modify self-calls
            if (source !== target) {
                // If it's a forward call, activate the target
                if (arrow === '->>') {
                    // Only activate backend components (Servlet, Model, DAO, DB, etc.)
                    // Exclude Guest, User, Patient, Doctor, Admin, Browser from being activated
                    let noActivate = ['Guest', 'User', 'Patient', 'Doctor', 'Admin', 'Browser'];
                    if (!noActivate.includes(target)) {
                        arrow = '->>+';
                    }
                }
                // If it's a return call, deactivate the source
                else if (arrow === '-->>') {
                    let noDeactivate = ['Guest', 'User', 'Patient', 'Doctor', 'Admin', 'Browser'];
                    if (!noDeactivate.includes(source)) {
                        arrow = '-->>-';
                    }
                }
            }
            
            lines[i] = ${indent}: ;
        }
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Successfully added activation boxes to Mermaid diagrams.');

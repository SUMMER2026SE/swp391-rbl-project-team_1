const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function extractText() {
    const docPath = path.resolve(__dirname, '../../BacSi.docx');
    try {
        const result = await mammoth.extractRawText({ path: docPath });
        fs.writeFileSync(path.resolve(__dirname, 'bacsi.txt'), result.value);
        console.log('Saved to bacsi.txt');
    } catch (err) {
        console.error(err);
    }
}
extractText();

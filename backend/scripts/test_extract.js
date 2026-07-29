const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "../BacSi.docx"})
    .then(function(result) {
        fs.writeFileSync("scripts/bacsi_raw.txt", result.value);
        console.log("Extracted");
    })
    .catch(console.error);

const mammoth = require("mammoth");
const fs = require("fs");

mammoth.extractRawText({path: "BacSi.docx"})
    .then(function(result){
        const text = result.value; // The raw text
        const messages = result.messages;
        fs.writeFileSync("bacsi.txt", text);
        console.log("Successfully extracted docx.");
    })
    .catch(function(error) {
        console.error(error);
    });

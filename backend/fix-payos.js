const fs = require('fs');

let content = fs.readFileSync('src/controllers/payment.controller.ts', 'utf8');

const oldInit = `        const payos = new PayOS(
            process.env.PAYOS_CLIENT_ID || "",
            process.env.PAYOS_API_KEY || "",
            process.env.PAYOS_CHECKSUM_KEY || ""
        );`;

const newInit = `        const payos = new PayOS({
            clientId: process.env.PAYOS_CLIENT_ID || "",
            apiKey: process.env.PAYOS_API_KEY || "",
            checksumKey: process.env.PAYOS_CHECKSUM_KEY || ""
        });`;

content = content.replaceAll(oldInit, newInit);

content = content.replace('const paymentLink = await payos.createPaymentLink(requestData);', 'const paymentLink = await payos.paymentRequests.create(requestData);');
content = content.replace('const webhookData = payos.verifyPaymentWebhookData(req.body);', 'const webhookData = payos.webhooks.verify(req.body);');

fs.writeFileSync('src/controllers/payment.controller.ts', content);
console.log("Updated payment controller");

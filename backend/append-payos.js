const fs = require('fs');
let codeToAppend = `
const { PayOS } = require("@payos/node");
import { sendBookingStatusUpdateEmail } from "../utils/emailService";

/**
 * POST /api/payment/payos
 * Creates a PayOS payment link
 */
export async function createPayOSPaymentUrlHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const payos = new PayOS({
            clientId: process.env.PAYOS_CLIENT_ID || "",
            apiKey: process.env.PAYOS_API_KEY || "",
            checksumKey: process.env.PAYOS_CHECKSUM_KEY || ""
        });

        const userId = (req as any).user?.userId;
        const { appointmentId } = req.body;
        if (!appointmentId) {
            res.status(400).json({ error: "Mã lịch hẹn (appointmentId) là bắt buộc" });
            return;
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
        });

        if (!appointment) {
            res.status(404).json({ error: "Lịch hẹn không tồn tại" });
            return;
        }

        if (appointment.status !== "PENDING_PAYMENT") {
            res.status(400).json({ error: "Lịch hẹn không ở trạng thái chờ thanh toán" });
            return;
        }

        const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(Math.random() * 1000)));
        const amount = appointment.amount || 50000;
        const description = \`MEDBOOKING \${appointment.transactionCode}\`.substring(0, 25);
        
        const returnUrl = process.env.FRONTEND_PAYMENT_REDIRECT_URL || "http://localhost:3000/my-appointments";
        const cancelUrl = process.env.FRONTEND_PAYMENT_REDIRECT_URL || "http://localhost:3000/my-appointments";

        const requestData = {
            orderCode,
            amount,
            description,
            cancelUrl,
            returnUrl
        };

        const paymentLink = await payos.paymentRequests.create(requestData);

        res.status(200).json({
            message: "Tạo link thanh toán PayOS thành công",
            checkoutUrl: paymentLink.checkoutUrl,
            qrCode: paymentLink.qrCode,
            accountNumber: paymentLink.accountNumber,
            accountName: paymentLink.accountName,
            bin: paymentLink.bin,
            amount: paymentLink.amount,
            description: paymentLink.description,
            orderCode: paymentLink.orderCode,
        });
    } catch (error) {
        console.error("PayOS Create Error:", error);
        next(error);
    }
}

/**
 * POST /api/payment/payos-webhook
 * PayOS Webhook Handler
 */
export async function payosWebhookHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const payos = new PayOS({
            clientId: process.env.PAYOS_CLIENT_ID || "",
            apiKey: process.env.PAYOS_API_KEY || "",
            checksumKey: process.env.PAYOS_CHECKSUM_KEY || ""
        });

        const webhookData = payos.webhooks.verify(req.body);
        
        const description = webhookData.description;
        const amount = webhookData.amount;
        const transactionId = webhookData.reference;

        if (!description || !amount) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const match = description.match(/MEDBOOKING[\\s-][A-Z0-9]+/i);
        if (!match) {
            res.status(200).json({ message: "Ignored: No matching transaction code" });
            return;
        }

        const transactionCode = match[0].toUpperCase().replace("MEDBOOKING-", "").replace("MEDBOOKING ", "");

        const appointment = await prisma.appointment.findFirst({
            where: { transactionCode },
            include: { user: true, doctor: true, medicalPackage: true }
        });

        if (!appointment) {
            res.status(404).json({ error: "Appointment not found" });
            return;
        }

        if (appointment.status !== "PENDING_PAYMENT" && appointment.status !== "PENDING") {
            res.status(200).json({ message: "Appointment already processed" });
            return;
        }

        if (amount < (appointment.amount || 0)) {
            res.status(400).json({ error: "Insufficient amount paid" });
            return;
        }

        const updated = await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
                status: "CONFIRMED",
                paymentAt: new Date(),
            },
            include: {
                user: true,
                doctor: { include: { specialty: true, clinic: true } },
                medicalPackage: true
            }
        });

        await prisma.payment.upsert({
            where: { appointmentId: appointment.id },
            create: {
                appointmentId: appointment.id,
                amount: appointment.amount || amount,
                status: "PAID",
                method: "MOCK", 
                transactionId: transactionId || "PAYOS-" + Date.now(),
                paymentGateway: "PAYOS",
                payDate: new Date(),
            },
            update: {
                status: "PAID",
                transactionId: transactionId || "PAYOS-" + Date.now(),
                paymentGateway: "PAYOS",
                payDate: new Date(),
            }
        });

        if (updated.user?.email) {
            sendBookingStatusUpdateEmail(updated.user.email, {
                patientName: updated.user.fullName || updated.user.email,
                doctorName: updated.doctor?.name || "Hệ thống",
                specialtyName: updated.doctor?.specialty?.name || "",
                clinicName: updated.doctor?.clinic?.name || updated.medicalPackage?.hospital || "Phòng khám",
                appointmentDate: updated.appointmentDate,
                status: "CONFIRMED",
            }).catch(console.error);
        }

        res.status(200).json({ message: "Automated payment confirmed successfully" });
    } catch (error) {
        console.error("PayOS Webhook Error:", error);
        next(error);
    }
}
`;

fs.appendFileSync('src/controllers/payment.controller.ts', codeToAppend);
console.log("Appended");

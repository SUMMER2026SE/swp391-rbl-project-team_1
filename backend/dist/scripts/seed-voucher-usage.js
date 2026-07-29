"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Appointment IDs từ query trước (20 appointments không có voucher)
const appointmentPool = [
    { id: "0390be29-dacd-428c-9e29-0dd422c3daed", amount: 200000 },
    { id: "11ca83d3-0458-4d65-90e8-ba73dc08096b", amount: 200000 },
    { id: "2d0c04f7-beef-473b-bde4-aa5549439c25", amount: 200000 },
    { id: "2e06491c-2c2a-4efd-922d-a59b75d87ec9", amount: 200000 },
    { id: "48c246cd-6191-4d24-8bd8-f93270ffcd1d", amount: 200000 },
    { id: "4de9d0a9-2087-4e86-b9a4-bd9a3455a983", amount: 200000 },
    { id: "51a06b5b-f715-46ea-ba58-0b4ba362853e", amount: 200000 },
    { id: "5c9b9ad5-bd1c-4dca-b709-fe661654f5c8", amount: 250000 },
    { id: "61cabd10-d2f3-4f7a-984e-4a5f5812e449", amount: 250000 },
    { id: "7310f4d8-abf4-40b7-a8e7-f6bf03b219e8", amount: 200000 },
    { id: "8cd35a64-ee5f-461d-afb9-f20df4a60b1d", amount: 200000 },
    { id: "a09874a3-0fb9-428b-9aeb-b8ed7129a880", amount: 200000 },
    { id: "a26f9d24-c73a-448f-b2e4-52610a0efbcf", amount: 250000 },
    { id: "a56792f1-8c5d-4753-82d1-979125c38a23", amount: 200000 },
    { id: "a7c0c434-87be-4756-92c2-98ebe8855633", amount: 200000 },
    { id: "afc8cc23-2adb-4881-bb44-2d2933416795", amount: 200000 },
    { id: "b3001a14-fa1c-4c02-a11c-a57ebdde9abe", amount: 200000 },
    { id: "be0abdbd-bbe3-467c-a888-5adc4baaa11c", amount: 200000 },
    { id: "be345355-5483-413b-aea2-9793b8241c0a", amount: 200000 },
    { id: "d18ad139-2e1d-41f9-ac9f-e88ac79656c6", amount: 250000 },
];
async function main() {
    // Get real voucher & appointment/user data to link correctly
    const vouchers = await prisma.voucher.findMany({
        select: { id: true, code: true, type: true, discountValue: true }
    });
    if (vouchers.length === 0) {
        console.error('No vouchers found!');
        return;
    }
    // Get appointments with their userId
    const appointments = await prisma.appointment.findMany({
        where: { id: { in: appointmentPool.map(a => a.id) } },
        select: { id: true, userId: true, amount: true }
    });
    // Filter only ones without existing voucherUsage
    const existingUsages = await prisma.voucherUsage.findMany({
        where: { appointmentId: { in: appointments.map(a => a.id) } },
        select: { appointmentId: true }
    });
    const usedApptIds = new Set(existingUsages.map(u => u.appointmentId));
    const available = appointments.filter(a => !usedApptIds.has(a.id));
    console.log(`Available appointments for seeding: ${available.length}`);
    if (available.length === 0) {
        console.log('All appointments already have voucher usages. Nothing to do.');
        await prisma.$disconnect();
        return;
    }
    // Spread usedAt over the past 30 days so charts show nice data
    const now = new Date();
    let created = 0;
    for (let i = 0; i < available.length; i++) {
        const appt = available[i];
        const voucher = vouchers[i % vouchers.length];
        // Spread dates: from 30 days ago to today
        const daysAgo = Math.floor((available.length - i - 1) * 30 / available.length);
        const usedAt = new Date(now);
        usedAt.setDate(now.getDate() - daysAgo);
        usedAt.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
        // Calculate discount
        const originalDeposit = appt.amount;
        let discountAmount;
        if (voucher.type === 'PERCENT') {
            discountAmount = Math.floor(originalDeposit * voucher.discountValue / 100);
        }
        else {
            discountAmount = Math.min(voucher.discountValue, originalDeposit);
        }
        const finalDeposit = originalDeposit - discountAmount;
        try {
            await prisma.voucherUsage.create({
                data: {
                    voucherId: voucher.id,
                    userId: appt.userId,
                    appointmentId: appt.id,
                    originalDeposit,
                    discountAmount,
                    finalDeposit,
                    usedAt,
                }
            });
            // Update usedCount on voucher
            await prisma.voucher.update({
                where: { id: voucher.id },
                data: { usedCount: { increment: 1 } }
            });
            console.log(`✓ [${usedAt.toLocaleDateString('vi-VN')}] Voucher ${voucher.code} → -${discountAmount.toLocaleString()}đ (appt ${appt.id.slice(0, 8)})`);
            created++;
        }
        catch (err) {
            console.error(`✗ Failed for ${appt.id}:`, err.message);
        }
    }
    console.log(`\n✅ Done! Created ${created} VoucherUsage records.`);
    await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Script chạy SQL migration thủ công:
 * Chỉ thêm 2 columns mới vào bảng Payment (orderCode, expiredAt)
 * Không đụng đến bất kỳ bảng nào khác.
 */
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Running manual migration: add orderCode and expiredAt to Payment...");
    await prisma.$executeRawUnsafe(`
    ALTER TABLE "Payment"
    ADD COLUMN IF NOT EXISTS "orderCode" BIGINT,
    ADD COLUMN IF NOT EXISTS "expiredAt" TIMESTAMP(3);
  `);
    console.log("✅ Migration done: Payment.orderCode and Payment.expiredAt added successfully.");
}
main()
    .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());

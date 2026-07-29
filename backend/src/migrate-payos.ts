/**
 * Script chạy SQL migration thủ công:
 * Chỉ thêm 2 columns mới vào bảng Payment (orderCode, expiredAt)
 * Không đụng đến bất kỳ bảng nào khác.
 */
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

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

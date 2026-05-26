-- AlterTable
ALTER TABLE "User"
ADD COLUMN "email" TEXT,
ADD COLUMN "otpCode" TEXT,
ADD COLUMN "otpExpiresAt" TIMESTAMP(3);

-- AlterTable - make phone nullable
ALTER TABLE "User"
ALTER COLUMN "phone"
DROP NOT NULL,
ALTER COLUMN "password"
DROP NOT NULL;

-- CreateIndex - add unique constraint on email
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");
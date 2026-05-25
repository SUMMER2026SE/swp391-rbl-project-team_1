-- Migration: add_role_enum_and_user_doctor_link
-- Converts User.role from TEXT to proper PostgreSQL enum
-- Adds User.doctorId for User <-> Doctor account linking
-- Adds User.updatedAt timestamp

-- Step 1: Create the Role enum type
CREATE TYPE "Role" AS ENUM ('USER', 'DOCTOR', 'ADMIN');

-- Step 2: Add new columns before dropping old role column
ALTER TABLE "User"
    ADD COLUMN "doctorId" TEXT,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Step 3: Create a new role column with enum type using existing data
-- First add new column
ALTER TABLE "User" ADD COLUMN "role_new" "Role" NOT NULL DEFAULT 'USER';

-- Step 4: Migrate existing TEXT role values to the enum
UPDATE "User" SET "role_new" = CASE
    WHEN "role" = 'DOCTOR' THEN 'DOCTOR'::"Role"
    WHEN "role" = 'ADMIN' THEN 'ADMIN'::"Role"
    ELSE 'USER'::"Role"
END;

-- Step 5: Drop the old TEXT role column
ALTER TABLE "User" DROP COLUMN "role";

-- Step 6: Rename the new enum column to "role"
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- Step 7: Add unique index on doctorId (one user per doctor)
CREATE UNIQUE INDEX "User_doctorId_key" ON "User"("doctorId");

-- Step 8: Add foreign key constraint User.doctorId -> Doctor.id
ALTER TABLE "User"
    ADD CONSTRAINT "User_doctorId_fkey"
    FOREIGN KEY ("doctorId")
    REFERENCES "Doctor"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

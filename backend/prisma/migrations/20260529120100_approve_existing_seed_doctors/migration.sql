-- Approve existing doctors so public listing works (seed/demo data)
UPDATE "Doctor"
SET "status" = 'APPROVED', "isLocked" = false
WHERE "status" = 'PENDING' AND "isLocked" = false;

ALTER TABLE "labour_advances" ADD COLUMN "isDeducted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "labour_advances" ADD COLUMN "deductedAt" DATETIME;
ALTER TABLE "labour_advances" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT '2026-01-01 00:00:00';

CREATE INDEX "labour_advances_isDeducted_idx" ON "labour_advances"("isDeducted");

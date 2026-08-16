ALTER TABLE "chart_of_accounts" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;

-- Update existing accounts: root accounts (no parentId) stay at 1
-- This covers up to 4 levels via multiple UPDATE passes
UPDATE "chart_of_accounts" SET "level" = 2 WHERE "parentId" IN (SELECT id FROM "chart_of_accounts" WHERE "parentId" IS NULL);
UPDATE "chart_of_accounts" SET "level" = 3 WHERE "parentId" IN (SELECT id FROM "chart_of_accounts" WHERE "parentId" IN (SELECT id FROM "chart_of_accounts" WHERE "parentId" IS NULL));
UPDATE "chart_of_accounts" SET "level" = 4 WHERE "parentId" IN (SELECT id FROM "chart_of_accounts" WHERE "parentId" IN (SELECT id FROM "chart_of_accounts" WHERE "parentId" IN (SELECT id FROM "chart_of_accounts" WHERE "parentId" IS NULL)));

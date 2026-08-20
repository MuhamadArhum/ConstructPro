ALTER TABLE "salary_payments" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Paid';
ALTER TABLE "salary_payments" ADD COLUMN "paidDate" DATETIME;
UPDATE "salary_payments" SET "paidDate" = "paidAt";

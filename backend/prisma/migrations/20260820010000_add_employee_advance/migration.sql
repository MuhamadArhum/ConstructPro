CREATE TABLE "employee_advances" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "date" DATETIME NOT NULL,
  "reason" TEXT,
  "isDeducted" BOOLEAN NOT NULL DEFAULT false,
  "deductedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_advances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "employee_advances_employeeId_idx" ON "employee_advances"("employeeId");
CREATE INDEX "employee_advances_isDeducted_idx" ON "employee_advances"("isDeducted");

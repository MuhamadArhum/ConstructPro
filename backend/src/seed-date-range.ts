import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ── Helpers ───────────────────────────────────────────────────────────────────
const rand  = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick  = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const money = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const uuid  = () => crypto.randomUUID();

// Date range 01-Jan-2026 → 31-Jul-2026
const START       = new Date('2026-01-01');
const END         = new Date('2026-07-31');
const PER_DAY     = 5;

function dateRange(): Date[] {
  const dates: Date[] = [];
  const cur = new Date(START);
  while (cur <= END) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// ── Reference data arrays ─────────────────────────────────────────────────────
const INCOME_CATEGORIES  = ['CustomerPayment','ProjectIncome','OtherIncome'] as const;
const EXPENSE_CATEGORIES = ['LabourExpenses','Salaries','MachineryMaintenance','VehicleExpenses','Fuel','PlantExpenses','CarpentryExpenses','ElectricalExpenses','SuppliesMaterialPurchase','OfficeExpenses','Miscellaneous'] as const;
const MAINTENANCE_TYPES  = ['Preventive','Corrective','Inspection'] as const;
const STOCK_TYPES        = ['In','Out','Adjustment'] as const;
const TAX_TYPES          = ['VAT','GST','Income','Withholding','Other'] as const;
const NOTIF_TYPES        = ['System','Alert','Info','Warning'] as const;
const NOTIF_TITLES       = ['Low Stock Alert','Maintenance Due','Payment Received','Budget Alert','Vehicle Inspection','Labour Update','Supplier Payment','Tax Reminder','Site Report','System Update'];
const INCOME_DESC        = ['Advance received','Milestone payment','Progress billing','Retention released','Variation order','Mobilization advance','Final payment','Client payment'];
const EXPENSE_DESC       = ['Cement purchase','Steel rebar','Labour wages','Fuel for site','Equipment rental','Office supplies','Repair cost','Material delivery','Safety gear','Electrical work'];
const MAINT_DESC         = ['Routine service','Oil change','Filter replacement','Brake inspection','Engine check','Hydraulic service','Tyre replacement','Battery replacement','Coolant flush','General overhaul'];

async function main() {
  const DATES = dateRange();
  const TOTAL = DATES.length * PER_DAY;
  console.log(`\n📅 Seeding date range: ${START.toDateString()} → ${END.toDateString()} (${DATES.length} days × ${PER_DAY} = ${TOTAL} entries per table)\n`);

  // Expand: each date appears PER_DAY times
  const EXPANDED = DATES.flatMap(d => Array.from({ length: PER_DAY }, () => d));

  const admin = await prisma.user.findFirst({ where: { email: 'admin@constructpro.com' } });
  const adminId = admin?.id ?? null;

  // ── Load existing reference IDs ───────────────────────────────────────────
  const [employees, labours, machineries, vehicles, inventoryItems, customers, suppliers, accounts] = await Promise.all([
    prisma.employee.findMany({ select: { id: true } }),
    prisma.labour.findMany({ select: { id: true } }),
    prisma.machinery.findMany({ select: { id: true } }),
    prisma.vehicle.findMany({ select: { id: true } }),
    prisma.inventoryItem.findMany({ select: { id: true } }),
    prisma.customer.findMany({ select: { id: true } }),
    prisma.supplier.findMany({ select: { id: true } }),
    prisma.chartOfAccount.findMany({ select: { id: true, accountType: true } }),
  ]);

  console.log(`Loaded: ${employees.length} employees, ${labours.length} labours, ${machineries.length} machinery, ${vehicles.length} vehicles`);
  console.log(`        ${inventoryItems.length} inventory, ${customers.length} customers, ${suppliers.length} suppliers, ${accounts.length} accounts\n`);

  const empIds  = employees.map(e => e.id);
  const labIds  = labours.map(l => l.id);
  const macIds  = machineries.map(m => m.id);
  const vehIds  = vehicles.map(v => v.id);
  const invIds  = inventoryItems.map(i => i.id);
  const cusIds  = customers.map(c => c.id);
  const supIds  = suppliers.map(s => s.id);
  const debitAccIds  = accounts.filter(a => ['Asset','Expense'].includes(a.accountType)).map(a => a.id);
  const creditAccIds = accounts.filter(a => ['Revenue','Liability','Equity'].includes(a.accountType)).map(a => a.id);

  // ── 1. INCOMES ────────────────────────────────────────────────────────────
  console.log(`[1] Inserting ${TOTAL} income records...`);
  await prisma.income.createMany({
    data: EXPANDED.map(date => ({
      id: uuid(),
      category: pick([...INCOME_CATEGORIES]),
      amount: money(50000, 500000),
      date,
      description: pick(INCOME_DESC),
      customerName: `Client ${rand(1, 100)}`,
      projectName: `Project ${rand(1, 20)}`,
      isPaid: Math.random() > 0.2,
      createdAt: date,
      createdById: adminId,
    })),
    skipDuplicates: true,
  });

  // ── 2. EXPENSES ───────────────────────────────────────────────────────────
  console.log(`[2] Inserting ${TOTAL} expense records...`);
  await prisma.expense.createMany({
    data: EXPANDED.map(date => ({
      id: uuid(),
      category: pick([...EXPENSE_CATEGORIES]),
      amount: money(5000, 200000),
      date,
      description: pick(EXPENSE_DESC),
      vendor: `Vendor ${rand(1, 50)}`,
      createdAt: date,
      createdById: adminId,
    })),
    skipDuplicates: true,
  });

  // ── 3. LABOUR ATTENDANCES ─────────────────────────────────────────────────
  if (labIds.length > 0) {
    console.log(`[3] Inserting labour attendances (${DATES.length} days × up to 5 labours × ${PER_DAY})...`);
    const labourSample = labIds.slice(0, Math.min(5 * PER_DAY, labIds.length));
    const attendanceData: any[] = [];
    for (const date of DATES) {
      for (const labourId of labourSample) {
        attendanceData.push({
          id: uuid(),
          labourId,
          date,
          isPresent: Math.random() > 0.1,
          overtimeHours: Math.random() > 0.7 ? money(1, 4) : 0,
        });
      }
    }
    // Insert in batches to avoid duplicates on unique constraint (labourId, date)
    for (let i = 0; i < attendanceData.length; i += 500) {
      await prisma.labourAttendance.createMany({
        data: attendanceData.slice(i, i + 500),
        skipDuplicates: true,
      });
    }
  }

  // ── 4. LABOUR ADVANCES ────────────────────────────────────────────────────
  if (labIds.length > 0) {
    console.log(`[4] Inserting ${TOTAL} labour advance records...`);
    await prisma.labourAdvance.createMany({
      data: EXPANDED.map(date => ({
        id: uuid(),
        labourId: pick(labIds),
        amount: money(1000, 15000),
        date,
        reason: pick(['Medical emergency','Festival advance','House rent','Personal need','Family need']),
      })),
      skipDuplicates: true,
    });
  }

  // ── 5. SALARY PAYMENTS (monthly — one per employee per month) ────────────
  if (empIds.length > 0) {
    console.log(`[5] Inserting salary payments (monthly)...`);
    const months = [
      { month: 1, year: 2026 }, { month: 2, year: 2026 }, { month: 3, year: 2026 },
      { month: 4, year: 2026 }, { month: 5, year: 2026 }, { month: 6, year: 2026 },
      { month: 7, year: 2026 },
    ];
    const empSample = empIds.slice(0, Math.min(20, empIds.length));
    const salaryData: any[] = [];
    for (const emp of empSample) {
      const emp_ = await prisma.employee.findUnique({ where: { id: emp }, select: { basicSalary: true } });
      const basic = Number(emp_?.basicSalary ?? 50000);
      for (const { month, year } of months) {
        const daysPresent = rand(20, 30);
        const bonus = Math.random() > 0.7 ? money(5000, 20000) : 0;
        const deductions = Math.random() > 0.5 ? money(500, 5000) : 0;
        const netSalary = parseFloat(((basic / 30) * daysPresent + bonus - deductions).toFixed(2));
        salaryData.push({
          id: uuid(),
          employeeId: emp,
          month, year, basicSalary: basic, bonus, deductions, netSalary,
          daysPresent, totalDays: 30,
          paidAt: new Date(`2026-${String(month).padStart(2,'0')}-28`),
          remarks: 'Monthly salary',
          createdAt: new Date(`2026-${String(month).padStart(2,'0')}-28`),
        });
      }
    }
    await prisma.salaryPayment.createMany({ data: salaryData, skipDuplicates: true });
  }

  // ── 6. MACHINERY MAINTENANCES ─────────────────────────────────────────────
  if (macIds.length > 0) {
    console.log(`[6] Inserting ${TOTAL} machinery maintenance records...`);
    await prisma.machineryMaintenance.createMany({
      data: EXPANDED.map(date => ({
        id: uuid(),
        machineryId: pick(macIds),
        maintenanceDate: date,
        type: pick([...MAINTENANCE_TYPES]),
        description: pick(MAINT_DESC),
        cost: money(2000, 50000),
        serviceProvider: `Service Co. ${rand(1, 20)}`,
        createdAt: date,
      })),
      skipDuplicates: true,
    });
  }

  // ── 7. VEHICLE MAINTENANCES ───────────────────────────────────────────────
  if (vehIds.length > 0) {
    console.log(`[7] Inserting ${TOTAL} vehicle maintenance records...`);
    await prisma.vehicleMaintenance.createMany({
      data: EXPANDED.map(date => ({
        id: uuid(),
        vehicleId: pick(vehIds),
        maintenanceDate: date,
        description: pick(MAINT_DESC),
        cost: money(1000, 30000),
        serviceProvider: `Auto Workshop ${rand(1, 15)}`,
        mileageAtService: money(10000, 150000),
        createdAt: date,
      })),
      skipDuplicates: true,
    });
  }

  // ── 8. STOCK TRANSACTIONS ─────────────────────────────────────────────────
  if (invIds.length > 0) {
    console.log(`[8] Inserting ${TOTAL} stock transaction records...`);
    await prisma.stockTransaction.createMany({
      data: EXPANDED.map(date => ({
        id: uuid(),
        inventoryItemId: pick(invIds),
        type: pick([...STOCK_TYPES]),
        quantity: money(10, 500),
        unitPrice: money(100, 5000),
        date,
        reference: `REF-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`,
        projectName: `Project ${rand(1, 20)}`,
        createdAt: date,
        createdById: adminId,
      })),
      skipDuplicates: true,
    });
  }

  // ── 9. TAX RECORDS (monthly) ──────────────────────────────────────────────
  console.log(`[9] Inserting tax records (monthly)...`);
  const taxMonths = [1,2,3,4,5,6,7];
  await prisma.taxRecord.createMany({
    data: taxMonths.map(m => ({
      id: uuid(),
      taxType: pick([...TAX_TYPES]),
      amount: money(50000, 500000),
      periodStart: new Date(`2026-${String(m).padStart(2,'0')}-01`),
      periodEnd:   new Date(`2026-${String(m).padStart(2,'0')}-${m === 2 ? 28 : [4,6,9,11].includes(m) ? 30 : 31}`),
      dueDate:     new Date(`2026-${String(m+1 > 12 ? 1 : m+1).padStart(2,'0')}-15`),
      isPaid: m < 6,
      paidDate: m < 6 ? new Date(`2026-${String(m+1).padStart(2,'0')}-10`) : null,
      description: `Tax filing for ${['Jan','Feb','Mar','Apr','May','Jun','Jul'][m-1]} 2026`,
      createdAt: new Date(`2026-${String(m).padStart(2,'0')}-05`),
      createdById: adminId,
    })),
    skipDuplicates: true,
  });

  // ── 10. JOURNAL ENTRIES ───────────────────────────────────────────────────
  if (debitAccIds.length > 0 && creditAccIds.length > 0) {
    console.log(`[10] Inserting ${TOTAL} journal entries...`);
    for (let i = 0; i < EXPANDED.length; i += 50) {
      const batch = EXPANDED.slice(i, i + 50);
      for (const date of batch) {
        const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
        const entryNum = `JE-${dateStr}-${rand(100,999)}-${uuid().slice(0,6)}`;
        const amount = money(10000, 300000);
        await prisma.journalEntry.create({
          data: {
            id: uuid(),
            entryNumber: entryNum,
            date,
            description: `Daily journal entry ${dateStr}`,
            totalDebit: amount,
            totalCredit: amount,
            isPosted: true,
            createdAt: date,
            createdById: adminId,
            lines: {
              create: [
                { id: uuid(), accountId: pick(debitAccIds),  debit: amount, credit: 0, description: 'Debit entry' },
                { id: uuid(), accountId: pick(creditAccIds), debit: 0, credit: amount, description: 'Credit entry' },
              ],
            },
          },
        });
      }
      process.stdout.write(`  ${Math.min(i + 50, DATES.length)}/${DATES.length}\r`);
    }
    console.log('');
  }

  // ── 11. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log(`[11] Inserting ${TOTAL} notifications...`);
  await prisma.notification.createMany({
    data: EXPANDED.map(date => ({
      id: uuid(),
      type: pick([...NOTIF_TYPES]),
      title: pick(NOTIF_TITLES),
      message: `Daily site update for ${date.toDateString()}`,
      isRead: Math.random() > 0.4,
      userId: adminId,
      createdAt: date,
    })),
    skipDuplicates: true,
  });

  // ── 12. CUSTOMER TRANSACTIONS ─────────────────────────────────────────────
  if (cusIds.length > 0) {
    console.log(`[12] Inserting ${TOTAL} customer transactions...`);
    await prisma.customerTransaction.createMany({
      data: EXPANDED.map(date => ({
        id: uuid(),
        customerId: pick(cusIds),
        type: Math.random() > 0.4 ? 'INVOICE' : 'PAYMENT',
        amount: money(20000, 1000000),
        date,
        description: pick(['Invoice raised','Payment received','Advance adjustment','Retention release','Final settlement']),
        reference: `INV-${date.getFullYear()}-${rand(1000,9999)}`,
        createdAt: date,
      })),
      skipDuplicates: true,
    });
  }

  // ── 13. SUPPLIER TRANSACTIONS ─────────────────────────────────────────────
  if (supIds.length > 0) {
    console.log(`[13] Inserting ${TOTAL} supplier transactions...`);
    await prisma.supplierTransaction.createMany({
      data: EXPANDED.map(date => ({
        id: uuid(),
        supplierId: pick(supIds),
        type: Math.random() > 0.4 ? 'PURCHASE' : 'PAYMENT',
        amount: money(10000, 500000),
        date,
        description: pick(['Material purchase','Payment made','Advance payment','Order settlement','Partial payment']),
        reference: `PO-${date.getFullYear()}-${rand(1000,9999)}`,
        createdAt: date,
      })),
      skipDuplicates: true,
    });
  }

  // ── 14. AUDIT LOGS ────────────────────────────────────────────────────────
  console.log(`[14] Inserting ${TOTAL} audit log entries...`);
  const ENTITIES = ['Income','Expense','Labour','Employee','Machinery','Vehicle','Customer','Supplier','Inventory'];
  const ACTIONS  = ['CREATE','UPDATE','DELETE'];
  await prisma.auditLog.createMany({
    data: EXPANDED.map(date => ({
      id: uuid(),
      userId: adminId,
      userEmail: 'admin@constructpro.com',
      action: pick(ACTIONS),
      entityType: pick(ENTITIES),
      entityId: uuid(),
      succeeded: true,
      createdAt: date,
    })),
    skipDuplicates: true,
  });

  console.log('\n✅ Date-range seeding complete!\n');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());

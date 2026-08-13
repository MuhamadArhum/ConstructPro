import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbUrl = process.env.DATABASE_URL ?? 'file:./constructpro.db';
const dbPath = dbUrl.replace(/^file:/, '');
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
const prisma = new PrismaClient({ adapter } as any);

const COUNT = 10000;
const CHUNK = 500;

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randDecimal = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const pastDate = (daysAgo: number) => new Date(Date.now() - rand(0, daysAgo) * 86400000);
const futureDate = (daysAhead: number) => new Date(Date.now() + rand(1, daysAhead) * 86400000);
const uuid = () => crypto.randomUUID();
const code = (prefix: string, offset: number, i: number) => `${prefix}-${String(offset + i + 1).padStart(4, '0')}`;

async function insertChunked<T>(model: any, data: T[]) {
  for (let i = 0; i < data.length; i += CHUNK) {
    await model.createMany({ data: data.slice(i, i + CHUNK) });
    process.stdout.write(`\r  ${Math.min(i + CHUNK, data.length)}/${data.length}`);
  }
  process.stdout.write('\n');
}

const FIRST_NAMES = ['Ali','Ahmed','Muhammad','Hassan','Usman','Bilal','Faisal','Tariq','Zain','Imran','Asad','Kamran','Waqar','Sajid','Nasir','Rizwan','Hamid','Adnan','Shahid','Junaid','Fatima','Ayesha','Zainab','Sana','Hina','Nadia','Rabia','Sobia','Amna','Mehwish','Omar','Saad','Raza','Taha','Daniyal','Hamza','Fahad','Umer','Waleed','Talha'];
const LAST_NAMES = ['Khan','Ahmed','Ali','Hussain','Malik','Raza','Sheikh','Butt','Chaudhry','Akhtar','Siddiqui','Qureshi','Mirza','Baig','Ansari','Hashmi','Abbasi','Farooqi','Gillani','Zaidi'];
const CITIES = ['Lahore','Karachi','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Gujranwala','Sialkot'];
const DESIGNATIONS = ['Site Engineer','Project Manager','Civil Engineer','Electrical Engineer','Accountant','Supervisor','Safety Officer','Quantity Surveyor','Architect','HR Manager'];
const DEPARTMENTS = ['Engineering','Finance','HR','Operations','Safety','Procurement','Administration'];
const TRADES = ['Mason','Carpenter','Electrician','Plumber','Welder','Painter','Steel Fixer','Tile Layer','General Labor','Driver'];
const MACHINERY_NAMES = ['Excavator','Bulldozer','Crane','Concrete Mixer','Compactor','Loader','Grader','Backhoe','Paver','Pump'];
const MACHINERY_MODELS = ['CAT 320','JCB 3CX','Komatsu PC200','Volvo EC220','Liebherr LTM','Hitachi ZX200','Doosan DX300','Case CX130','Kubota KX080','Hyundai R220'];
const VEHICLE_MAKES = ['Toyota','Suzuki','Honda','Isuzu','Hino','Ford','Mitsubishi','Hyundai','Daihatsu','Nissan'];
const VEHICLE_MODELS_LIST = ['Hilux','Ravi','Civic','D-Max','500','Ranger','L200','Porter','Hiace','Frontier'];
const PLANT_NAMES = ['Batching Plant','Generator Set','Water Pump','Air Compressor','Welding Machine','Tower Light','Dumper','Concrete Vibrator','Bar Bending Machine','Scaffolding Set'];
const PLANT_TYPES = ['Concrete','Electrical','Mechanical','Hydraulic','Pneumatic'];
const INVENTORY_NAMES = ['Cement (50kg)','Steel Rebar 12mm','Brick (Standard)','Sand (Cubic Ft)','Aggregate 3/4"','PVC Pipe 4"','GI Wire','Plywood Sheet','Paint (White)','Tiles 12x12','Concrete Block','Steel Pipe 2"','Electrical Cable','Switch Board','Marble Slab','Wood Plank','Binding Wire','Shuttering Plate','Waterproofing Chemical','Curing Compound'];
const INVENTORY_CATEGORIES = ['Concrete & Masonry','Steel & Metal','Electrical','Plumbing','Finishes','Timber','Chemicals'];
const COMPANY_NAMES = ['Al-Fareed Builders','Pak Construction Ltd','Superior Group','DHA Builders','City Developers','Metro Contractors','National Engineers','Lahore Works','Punjab Infrastructure','Sindh Builders'];
const PROJECT_NAMES = ['DHA Phase 8','Gulberg Residencia','Bahria Town','Model Town Extension','Johar Town Plaza','Allama Iqbal Town','Raiwind Road Project','Ring Road Expansion','LDA Avenue','Canal Road Flyover'];
const INCOME_DESCRIPTIONS = ['Advance payment received','Milestone payment','Final payment','Retention released','Equipment rental income','Variation order payment','Mobilization advance','Progress billing payment'];
const EXPENSE_DESCRIPTIONS = ['Cement purchase','Steel purchase','Labour wages','Equipment rental','Fuel expense','Office supplies','Machinery repair','Vehicle maintenance','Site utilities','Safety equipment'];
const SUPPLIERS_NAMES = ['Allied Materials','National Steel','Pak Cement','Karachi Hardware','Lahore Suppliers','Punjab Traders','Sindh Materials','Rawalpindi Hardware','Multan Steel','Faisalabad Cement'];
const INCOME_CATEGORIES = ['CustomerPayment','ProjectIncome','OtherIncome'] as const;
const EXPENSE_CATEGORIES = ['LabourExpenses','Salaries','MachineryMaintenance','VehicleExpenses','Fuel','PlantExpenses','CarpentryExpenses','ElectricalExpenses','SuppliesMaterialPurchase','OfficeExpenses','Miscellaneous'] as const;
const TAX_TYPES = ['VAT','GST','Income','Withholding','Other'] as const;
const MACHINERY_STATUSES = ['Active','Active','Active','Inactive','Maintenance','Retired'] as const;
const VEHICLE_STATUSES = ['Active','Active','Active','Inactive','Maintenance'] as const;
const PLANT_STATUSES = ['Active','Active','Active','Inactive','Maintenance','Retired'] as const;
const MAINTENANCE_TYPES = ['Preventive','Corrective','Inspection'] as const;
const STOCK_TYPES = ['In','Out','Adjustment'] as const;
const NOTIF_TYPES = ['System','Alert','Info','Warning'] as const;
const NOTIF_TITLES = ['Low Stock Alert','Maintenance Due','Payment Received','New Employee Added','Vehicle Inspection','Salary Processed','Tax Due Soon','System Update','Labour Attendance','Budget Alert'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const SUPPLIER_CATEGORIES = ['Cement','Steel','Electrical','Plumbing','Hardware','Aggregates','Timber','Paint','Glass','General'];
const UNITS = ['Bags','Kg','Nos','Cft','Sqft','Meter','Roll','Litre','Sheet','Ton'];
const ACTIONS = ['Create Income','Create Expense','Update Labour','Delete Customer','Create Employee','Update Machinery','Create Vehicle','Update Inventory','Create Tax Record','Update Settings'];
const ENTITIES = ['Employee','Labour','Machinery','Vehicle','Income','Expense','Customer','Supplier','Inventory','TaxRecord'];

const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const phone = () => `03${rand(0,4)}${rand(10000000,99999999)}`;
const cnicNum = () => `3${rand(1000,9999)}-${rand(1000000,9999999)}-${rand(1,9)}`;
const addressStr = () => `House ${rand(1,500)}, Street ${rand(1,50)}, ${pick(CITIES)}`;

async function getOffset(model: any): Promise<number> {
  return await model.count();
}

async function main() {
  console.log(`\n Seeding ${COUNT.toLocaleString()} records per table (batch size: ${CHUNK})...\n`);

  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@constructpro.com' } });
  const adminId = adminUser?.id ?? null;

  // ── 1. EMPLOYEES ─────────────────────────────────────────────────────────────
  console.log(`[1/14] Employees...`);
  const empOffset = await getOffset(prisma.employee);
  const employeeData = Array.from({ length: COUNT }, (_, i) => ({
    id: uuid(),
    code: code('EMP', empOffset, i),
    fullName: fullName(),
    designation: pick(DESIGNATIONS),
    department: pick(DEPARTMENTS),
    phoneNumber: phone(),
    cnic: cnicNum(),
    address: addressStr(),
    basicSalary: randDecimal(25000, 150000),
    joinDate: pastDate(1095),
    isActive: Math.random() > 0.1,
  }));
  await insertChunked(prisma.employee, employeeData);
  const employeeIds = employeeData.map(e => e.id);

  // ── 2. SALARY PAYMENTS ───────────────────────────────────────────────────────
  console.log(`[2/14] Salary Payments...`);
  const salOffset = await getOffset(prisma.salaryPayment);
  const salaryData = Array.from({ length: COUNT }, (_, i) => {
    const basic = randDecimal(25000, 150000);
    const bonus = randDecimal(0, 10000);
    const deductions = randDecimal(0, 5000);
    const daysPresent = rand(20, 30);
    const netSalary = parseFloat(((basic / 30) * daysPresent + bonus - deductions).toFixed(2));
    return {
      code: code('SAL', salOffset, i),
      employeeId: pick(employeeIds),
      month: rand(1, 12),
      year: rand(2023, 2025),
      basicSalary: basic,
      bonus,
      deductions,
      netSalary,
      daysPresent,
      totalDays: 30,
      paidAt: pastDate(365),
      remarks: Math.random() > 0.5 ? `Payment for ${pick(MONTHS)}` : null,
    };
  });
  await insertChunked(prisma.salaryPayment, salaryData);

  // ── 3. LABOURS ───────────────────────────────────────────────────────────────
  console.log(`[3/14] Labours...`);
  const labOffset = await getOffset(prisma.labour);
  const labourData = Array.from({ length: COUNT }, (_, i) => ({
    id: uuid(),
    code: code('LAB', labOffset, i),
    name: fullName(),
    phoneNumber: phone(),
    cnic: cnicNum(),
    address: addressStr(),
    trade: pick(TRADES),
    dailyWage: randDecimal(800, 3000),
    overtimeRatePerHour: randDecimal(100, 400),
    joinDate: pastDate(730),
    isActive: Math.random() > 0.1,
  }));
  await insertChunked(prisma.labour, labourData);
  const labourIds = labourData.map(l => l.id);

  console.log(`  Labour Attendances...`);
  const attendancePairs = new Set<string>();
  const attendanceData: any[] = [];
  while (attendanceData.length < COUNT) {
    const labourId = pick(labourIds);
    const daysAgo = rand(0, 179);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    const key = `${labourId}_${date.toISOString().split('T')[0]}`;
    if (attendancePairs.has(key)) continue;
    attendancePairs.add(key);
    attendanceData.push({ labourId, date, isPresent: Math.random() > 0.15, overtimeHours: Math.random() > 0.6 ? randDecimal(0, 4) : 0, notes: null });
  }
  await insertChunked(prisma.labourAttendance, attendanceData);

  console.log(`  Labour Advances...`);
  const advanceData = Array.from({ length: COUNT }, () => ({
    labourId: pick(labourIds),
    amount: randDecimal(1000, 15000),
    date: pastDate(180),
    reason: Math.random() > 0.3 ? pick(['Medical emergency','Eid advance','Family function','Travel expense','Personal need']) : null,
  }));
  await insertChunked(prisma.labourAdvance, advanceData);

  // ── 4. CUSTOMERS ─────────────────────────────────────────────────────────────
  console.log(`[4/14] Customers...`);
  const custOffset = await getOffset(prisma.customer);
  const customerData = Array.from({ length: COUNT }, (_, i) => {
    const totalBilled = randDecimal(500000, 10000000);
    return {
      id: uuid(),
      code: code('CUST', custOffset, i),
      name: fullName(),
      companyName: Math.random() > 0.4 ? pick(COMPANY_NAMES) : null,
      phone: phone(),
      email: `customer_${Date.now()}_${i}@email.com`,
      address: addressStr(),
      ntn: Math.random() > 0.5 ? `${rand(1000000,9999999)}-${rand(0,9)}` : null,
      cnic: Math.random() > 0.5 ? cnicNum() : null,
      projectName: pick(PROJECT_NAMES),
      totalBilled,
      totalPaid: randDecimal(0, totalBilled),
      isActive: Math.random() > 0.05,
      notes: Math.random() > 0.6 ? 'Good client, prompt payments' : null,
    };
  });
  await insertChunked(prisma.customer, customerData);
  const customerIds = customerData.map(c => c.id);

  // ── 5. SUPPLIERS ─────────────────────────────────────────────────────────────
  console.log(`[5/14] Suppliers...`);
  const supOffset = await getOffset(prisma.supplier);
  const supplierData = Array.from({ length: COUNT }, (_, i) => {
    const totalPurchased = randDecimal(100000, 5000000);
    return {
      id: uuid(),
      code: code('SUPL', supOffset, i),
      name: fullName(),
      companyName: pick(SUPPLIERS_NAMES),
      phone: phone(),
      email: `supplier_${Date.now()}_${i}@email.com`,
      address: addressStr(),
      ntn: Math.random() > 0.5 ? `${rand(1000000,9999999)}-${rand(0,9)}` : null,
      category: pick(SUPPLIER_CATEGORIES),
      totalPurchased,
      totalPaid: randDecimal(0, totalPurchased),
      isActive: Math.random() > 0.05,
      notes: Math.random() > 0.6 ? 'Reliable supplier' : null,
    };
  });
  await insertChunked(prisma.supplier, supplierData);
  const supplierIds = supplierData.map(s => s.id);

  // ── 6. MACHINERY ─────────────────────────────────────────────────────────────
  console.log(`[6/14] Machinery...`);
  const mchOffset = await getOffset(prisma.machinery);
  const machineryData = Array.from({ length: COUNT }, (_, i) => ({
    id: uuid(),
    code: code('MCH', mchOffset, i),
    name: pick(MACHINERY_NAMES),
    model: pick(MACHINERY_MODELS),
    serialNumber: `SN-${rand(10000,99999)}-${uuid().slice(0,6)}`,
    purchaseDate: pastDate(1825),
    purchasePrice: randDecimal(500000, 10000000),
    status: pick(MACHINERY_STATUSES),
    totalRunningHours: randDecimal(0, 5000),
    nextMaintenanceDate: Math.random() > 0.3 ? futureDate(90) : null,
    notes: Math.random() > 0.6 ? 'Regular maintenance required' : null,
  }));
  await insertChunked(prisma.machinery, machineryData);
  const machineryIds = machineryData.map(m => m.id);

  console.log(`  Machinery Maintenance...`);
  const machMaintenanceData = Array.from({ length: COUNT }, () => ({
    machineryId: pick(machineryIds),
    maintenanceDate: pastDate(365),
    type: pick(MAINTENANCE_TYPES),
    description: pick(['Oil change','Filter replacement','Engine overhaul','Hydraulic service','Tyre change','Battery replacement','Belt replacement','Full service']),
    cost: randDecimal(5000, 200000),
    runningHoursAtService: randDecimal(100, 5000),
    nextMaintenanceDate: futureDate(180),
    serviceProvider: `${pick(FIRST_NAMES)} Auto Workshop`,
  }));
  await insertChunked(prisma.machineryMaintenance, machMaintenanceData);

  // ── 7. VEHICLES ──────────────────────────────────────────────────────────────
  console.log(`[7/14] Vehicles...`);
  const vehOffset = await getOffset(prisma.vehicle);
  const usedPlates = new Set<string>();
  const vehicleData = Array.from({ length: COUNT }, (_, i) => {
    let plate: string;
    do { plate = `${pick(['LHR','KHI','ISB','RWP','FSD','MUL','PES','QTA'])}-${rand(1000,9999)}-${uuid().slice(0,4)}`; }
    while (usedPlates.has(plate));
    usedPlates.add(plate);
    return {
      id: uuid(),
      code: code('VEH', vehOffset, i),
      registrationNumber: plate,
      make: pick(VEHICLE_MAKES),
      model: pick(VEHICLE_MODELS_LIST),
      year: rand(2010, 2024),
      driverName: fullName(),
      driverContact: phone(),
      purchasePrice: randDecimal(1000000, 8000000),
      purchaseDate: pastDate(1825),
      status: pick(VEHICLE_STATUSES),
      totalMileage: randDecimal(0, 150000),
      nextMaintenanceDate: Math.random() > 0.3 ? futureDate(90) : null,
      notes: Math.random() > 0.6 ? 'Good condition' : null,
    };
  });
  await insertChunked(prisma.vehicle, vehicleData);
  const vehicleIds = vehicleData.map(v => v.id);

  console.log(`  Vehicle Maintenance...`);
  const vehMaintenanceData = Array.from({ length: COUNT }, () => ({
    vehicleId: pick(vehicleIds),
    maintenanceDate: pastDate(365),
    description: pick(['Oil change','Tyre rotation','Brake service','Engine tune-up','AC service','Radiator flush','Full service','Gear service']),
    cost: randDecimal(2000, 80000),
    serviceProvider: `${pick(FIRST_NAMES)} Auto Works`,
    nextDueDate: futureDate(180),
    mileageAtService: randDecimal(5000, 150000),
    notes: Math.random() > 0.6 ? 'Completed on time' : null,
  }));
  await insertChunked(prisma.vehicleMaintenance, vehMaintenanceData);

  // ── 8. PLANTS ────────────────────────────────────────────────────────────────
  console.log(`[8/14] Plants...`);
  const pltOffset = await getOffset(prisma.plant);
  const plantData = Array.from({ length: COUNT }, (_, i) => ({
    code: code('PLT', pltOffset, i),
    name: pick(PLANT_NAMES),
    type: pick(PLANT_TYPES),
    manufacturer: pick(['Siemens','ABB','Atlas Copco','Ingersoll Rand','Cummins','Perkins','Kirloskar','Caterpillar']),
    serialNumber: `PL-${rand(10000,99999)}-${uuid().slice(0,6)}`,
    purchaseDate: pastDate(1825),
    purchasePrice: randDecimal(100000, 3000000),
    currentValue: randDecimal(50000, 2500000),
    status: pick(PLANT_STATUSES),
    location: `${pick(PROJECT_NAMES)} Site`,
    lastMaintenanceDate: pastDate(180),
    nextMaintenanceDate: futureDate(90),
    notes: Math.random() > 0.6 ? 'Operational' : null,
  }));
  await insertChunked(prisma.plant, plantData);

  // ── 9. INVENTORY ─────────────────────────────────────────────────────────────
  console.log(`[9/14] Inventory Items...`);
  const stkOffset = await getOffset(prisma.inventoryItem);
  const inventoryData = Array.from({ length: COUNT }, (_, i) => ({
    id: uuid(),
    code: code('STK', stkOffset, i),
    name: `${pick(INVENTORY_NAMES)} ${uuid().slice(0,4)}`,
    category: pick(INVENTORY_CATEGORIES),
    unit: pick(UNITS),
    currentStock: randDecimal(0, 500),
    lowStockThreshold: randDecimal(10, 50),
    unitPrice: randDecimal(50, 5000),
    supplierName: pick(SUPPLIERS_NAMES),
    location: `Warehouse ${pick(['A','B','C','D'])}`,
    notes: Math.random() > 0.6 ? 'Check expiry dates' : null,
  }));
  await insertChunked(prisma.inventoryItem, inventoryData);
  const inventoryIds = inventoryData.map(i => i.id);

  console.log(`  Stock Transactions...`);
  const stockData = Array.from({ length: COUNT }, () => ({
    inventoryItemId: pick(inventoryIds),
    type: pick(STOCK_TYPES),
    quantity: randDecimal(1, 100),
    unitPrice: randDecimal(50, 5000),
    date: pastDate(180),
    reference: `PO-${rand(1000,9999)}`,
    projectName: pick(PROJECT_NAMES),
    notes: Math.random() > 0.6 ? 'Verified by supervisor' : null,
    createdById: adminId,
  }));
  await insertChunked(prisma.stockTransaction, stockData);

  // ── 10. INCOME ───────────────────────────────────────────────────────────────
  console.log(`[10/14] Income...`);
  const incOffset = await getOffset(prisma.income);
  const incomeData = Array.from({ length: COUNT }, (_, i) => ({
    code: code('INC', incOffset, i),
    category: pick(INCOME_CATEGORIES),
    amount: randDecimal(50000, 2000000),
    date: pastDate(365),
    description: pick(INCOME_DESCRIPTIONS),
    customerName: fullName(),
    projectName: pick(PROJECT_NAMES),
    isPaid: Math.random() > 0.2,
    createdById: adminId,
  }));
  await insertChunked(prisma.income, incomeData);

  // ── 11. EXPENSE ──────────────────────────────────────────────────────────────
  console.log(`[11/14] Expenses...`);
  const expOffset = await getOffset(prisma.expense);
  const expenseData = Array.from({ length: COUNT }, (_, i) => ({
    code: code('EXP', expOffset, i),
    category: pick(EXPENSE_CATEGORIES),
    amount: randDecimal(5000, 500000),
    date: pastDate(365),
    description: pick(EXPENSE_DESCRIPTIONS),
    vendor: pick(SUPPLIERS_NAMES),
    createdById: adminId,
  }));
  await insertChunked(prisma.expense, expenseData);

  // ── 12. TAX RECORDS ──────────────────────────────────────────────────────────
  console.log(`[12/14] Tax Records...`);
  const taxOffset = await getOffset(prisma.taxRecord);
  const taxData = Array.from({ length: COUNT }, (_, i) => {
    const periodStart = pastDate(730);
    const periodEnd = new Date(periodStart.getTime() + 90 * 86400000);
    const dueDate = new Date(periodEnd.getTime() + 30 * 86400000);
    const isPaid = Math.random() > 0.35;
    return {
      code: code('TAX', taxOffset, i),
      taxType: pick(TAX_TYPES),
      amount: randDecimal(10000, 500000),
      periodStart,
      periodEnd,
      dueDate,
      paidDate: isPaid ? pastDate(60) : null,
      isPaid,
      reference: `TAX-${rand(1000,9999)}-${rand(100,999)}`,
      description: `Tax filing for ${rand(2023, 2025)}`,
      notes: Math.random() > 0.6 ? 'Filed with FBR' : null,
      createdById: adminId,
    };
  });
  await insertChunked(prisma.taxRecord, taxData);

  // ── 13. NOTIFICATIONS ────────────────────────────────────────────────────────
  console.log(`[13/14] Notifications...`);
  const notifData = Array.from({ length: COUNT }, () => {
    const isRead = Math.random() > 0.4;
    const createdAt = pastDate(60);
    return {
      type: pick(NOTIF_TYPES),
      title: pick(NOTIF_TITLES),
      message: `Action required for ${pick(PROJECT_NAMES)}.`,
      isRead,
      userId: adminId,
      createdAt,
      readAt: isRead ? new Date(createdAt.getTime() + rand(1,24) * 3600000) : null,
    };
  });
  await insertChunked(prisma.notification, notifData);

  // ── 14. AUDIT LOGS ───────────────────────────────────────────────────────────
  console.log(`[14/14] Audit Logs...`);
  const auditData = Array.from({ length: COUNT }, () => ({
    userId: adminId,
    userEmail: 'admin@constructpro.com',
    action: pick(ACTIONS),
    entityType: pick(ENTITIES),
    entityId: uuid(),
    ipAddress: `192.168.${rand(1,10)}.${rand(1,254)}`,
    succeeded: Math.random() > 0.05,
    createdAt: pastDate(90),
  }));
  await insertChunked(prisma.auditLog, auditData);

  const total = COUNT * 14;
  console.log(`\n Done! ${COUNT.toLocaleString()} records per table`);
  console.log(`   Total ~${total.toLocaleString()} records inserted`);
  console.log(`\n   Employees, Salary Payments, Labours, Attendances, Advances`);
  console.log(`   Customers, Suppliers, Machinery, Vehicles, Plants`);
  console.log(`   Inventory Items, Stock Transactions`);
  console.log(`   Income, Expense, Tax Records, Notifications, Audit Logs`);
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randDecimal = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const pastDate = (daysAgo: number) => new Date(Date.now() - rand(0, daysAgo) * 86400000);
const futureDate = (daysAhead: number) => new Date(Date.now() + rand(1, daysAhead) * 86400000);

const FIRST_NAMES = ['Ali', 'Ahmed', 'Muhammad', 'Hassan', 'Usman', 'Bilal', 'Faisal', 'Tariq', 'Zain', 'Imran', 'Asad', 'Kamran', 'Waqar', 'Sajid', 'Nasir', 'Rizwan', 'Hamid', 'Adnan', 'Shahid', 'Junaid', 'Fatima', 'Ayesha', 'Zainab', 'Sana', 'Hina', 'Nadia', 'Rabia', 'Sobia', 'Amna', 'Mehwish'];
const LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Hussain', 'Malik', 'Raza', 'Sheikh', 'Butt', 'Chaudhry', 'Akhtar', 'Siddiqui', 'Qureshi', 'Mirza', 'Baig', 'Ansari', 'Hashmi', 'Abbasi', 'Farooqi', 'Gillani', 'Zaidi'];
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot'];
const DESIGNATIONS = ['Site Engineer', 'Project Manager', 'Civil Engineer', 'Electrical Engineer', 'Accountant', 'Supervisor', 'Safety Officer', 'Quantity Surveyor', 'Architect', 'HR Manager'];
const DEPARTMENTS = ['Engineering', 'Finance', 'HR', 'Operations', 'Safety', 'Procurement', 'Administration'];
const TRADES = ['Mason', 'Carpenter', 'Electrician', 'Plumber', 'Welder', 'Painter', 'Steel Fixer', 'Tile Layer', 'General Labor', 'Driver'];
const MACHINERY_NAMES = ['Excavator', 'Bulldozer', 'Crane', 'Concrete Mixer', 'Compactor', 'Loader', 'Grader', 'Backhoe', 'Paver', 'Pump'];
const MACHINERY_MODELS = ['CAT 320', 'JCB 3CX', 'Komatsu PC200', 'Volvo EC220', 'Liebherr LTM', 'Hitachi ZX200', 'Doosan DX300', 'Case CX130', 'Kubota KX080', 'Hyundai R220'];
const VEHICLE_MAKES = ['Toyota', 'Suzuki', 'Honda', 'Isuzu', 'Hino', 'Ford', 'Mitsubishi', 'Hyundai', 'Daihatsu', 'Nissan'];
const VEHICLE_MODELS = ['Hilux', 'Ravi', 'Civic', 'D-Max', '500', 'Ranger', 'L200', 'Porter', 'Hiace', 'Frontier'];
const PLANT_NAMES = ['Batching Plant', 'Generator Set', 'Water Pump', 'Air Compressor', 'Welding Machine', 'Tower Light', 'Dumper', 'Concrete Vibrator', 'Bar Bending Machine', 'Scaffolding Set'];
const PLANT_TYPES = ['Concrete', 'Electrical', 'Mechanical', 'Hydraulic', 'Pneumatic'];
const INVENTORY_NAMES = ['Cement (50kg)', 'Steel Rebar 12mm', 'Brick (Standard)', 'Sand (Cubic Ft)', 'Aggregate 3/4"', 'PVC Pipe 4"', 'GI Wire', 'Plywood Sheet', 'Paint (White)', 'Tiles 12x12', 'Concrete Block', 'Steel Pipe 2"', 'Electrical Cable', 'Switch Board', 'Marble Slab', 'Wood Plank', 'Binding Wire', 'Shuttering Plate', 'Waterproofing Chemical', 'Curing Compound'];
const INVENTORY_CATEGORIES = ['Concrete & Masonry', 'Steel & Metal', 'Electrical', 'Plumbing', 'Finishes', 'Timber', 'Chemicals'];
const COMPANY_NAMES = ['Al-Fareed Builders', 'Pak Construction Ltd', 'Superior Group', 'DHA Builders', 'City Developers', 'Metro Contractors', 'National Engineers', 'Lahore Works', 'Punjab Infrastructure', 'Sindh Builders'];
const PROJECT_NAMES = ['DHA Phase 8', 'Gulberg Residencia', 'Bahria Town', 'Model Town Extension', 'Johar Town Plaza', 'Allama Iqbal Town', 'Raiwind Road Project', 'Ring Road Expansion', 'LDA Avenue', 'Canal Road Flyover'];
const INCOME_DESCRIPTIONS = ['Advance payment received', 'Milestone payment', 'Final payment', 'Retention released', 'Equipment rental income', 'Variation order payment', 'Mobilization advance', 'Progress billing payment'];
const EXPENSE_DESCRIPTIONS = ['Cement purchase', 'Steel purchase', 'Labour wages', 'Equipment rental', 'Fuel expense', 'Office supplies', 'Machinery repair', 'Vehicle maintenance', 'Site utilities', 'Safety equipment'];
const SUPPLIERS_NAMES = ['Allied Materials', 'National Steel', 'Pak Cement', 'Karachi Hardware', 'Lahore Suppliers', 'Punjab Traders', 'Sindh Materials', 'Rawalpindi Hardware', 'Multan Steel', 'Faisalabad Cement'];

const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const phone = () => `03${rand(0, 4)}${rand(10000000, 99999999)}`;
const cnic = () => `3${rand(1000, 9999)}-${rand(1000000, 9999999)}-${rand(1, 9)}`;
const address = () => `House ${rand(1, 500)}, Street ${rand(1, 50)}, ${pick(CITIES)}`;

async function main() {
  console.log('🌱 Starting test data seed...\n');

  // ── Get admin user id ────────────────────────────────────────────────────────
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@constructpro.com' } });
  const adminId = adminUser?.id ?? null;

  // ── 1. EMPLOYEES (100) ───────────────────────────────────────────────────────
  console.log('[1/14] Creating 100 employees...');
  const employeeIds: string[] = [];
  for (let i = 0; i < 100; i++) {
    const emp = await prisma.employee.create({
      data: {
        fullName: fullName(),
        designation: pick(DESIGNATIONS),
        department: pick(DEPARTMENTS),
        phoneNumber: phone(),
        cnic: cnic(),
        address: address(),
        basicSalary: randDecimal(25000, 150000),
        joinDate: pastDate(1095),
        isActive: Math.random() > 0.1,
      },
    });
    employeeIds.push(emp.id);
  }

  // ── 2. SALARY PAYMENTS (100) ─────────────────────────────────────────────────
  console.log('[2/14] Creating 100 salary payments...');
  for (let i = 0; i < 100; i++) {
    const empId = pick(employeeIds);
    const emp = await prisma.employee.findUnique({ where: { id: empId } });
    const basic = Number(emp!.basicSalary);
    const bonus = randDecimal(0, 10000);
    const deductions = randDecimal(0, 5000);
    const daysPresent = rand(20, 30);
    const totalDays = 30;
    const netSalary = (basic / totalDays) * daysPresent + bonus - deductions;
    await prisma.salaryPayment.create({
      data: {
        employeeId: empId,
        month: rand(1, 12),
        year: rand(2023, 2025),
        basicSalary: basic,
        bonus,
        deductions,
        netSalary: parseFloat(netSalary.toFixed(2)),
        daysPresent,
        totalDays,
        paidAt: pastDate(365),
        remarks: Math.random() > 0.5 ? `Payment for ${pick(['January','February','March','April','May','June','July','August','September','October','November','December'])}` : null,
      },
    });
  }

  // ── 3. LABOURS (100) ─────────────────────────────────────────────────────────
  console.log('[3/14] Creating 100 labours...');
  const labourIds: string[] = [];
  for (let i = 0; i < 100; i++) {
    const lab = await prisma.labour.create({
      data: {
        name: fullName(),
        phoneNumber: phone(),
        cnic: cnic(),
        address: address(),
        trade: pick(TRADES),
        dailyWage: randDecimal(800, 3000),
        overtimeRatePerHour: randDecimal(100, 400),
        joinDate: pastDate(730),
        isActive: Math.random() > 0.1,
      },
    });
    labourIds.push(lab.id);
  }

  // ── Labour Attendances (100) ─────────────────────────────────────────────────
  console.log('    Creating labour attendances...');
  const usedAttendancePairs = new Set<string>();
  let attendanceCount = 0;
  while (attendanceCount < 100) {
    const labourId = pick(labourIds);
    const daysAgo = rand(0, 89);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);
    const key = `${labourId}_${date.toISOString().split('T')[0]}`;
    if (usedAttendancePairs.has(key)) continue;
    usedAttendancePairs.add(key);
    await prisma.labourAttendance.create({
      data: {
        labourId,
        date,
        isPresent: Math.random() > 0.15,
        overtimeHours: Math.random() > 0.6 ? randDecimal(0, 4) : 0,
        notes: Math.random() > 0.7 ? 'On time' : null,
      },
    });
    attendanceCount++;
  }

  // ── Labour Advances (100) ────────────────────────────────────────────────────
  console.log('    Creating labour advances...');
  for (let i = 0; i < 100; i++) {
    await prisma.labourAdvance.create({
      data: {
        labourId: pick(labourIds),
        amount: randDecimal(1000, 15000),
        date: pastDate(180),
        reason: pick(['Medical emergency', 'Eid advance', 'Family function', 'Travel expense', 'Personal need', null!]),
      },
    });
  }

  // ── 4. CUSTOMERS (100) ───────────────────────────────────────────────────────
  console.log('[4/14] Creating 100 customers...');
  const customerIds: string[] = [];
  for (let i = 0; i < 100; i++) {
    const totalBilled = randDecimal(500000, 10000000);
    const totalPaid = randDecimal(0, totalBilled);
    const cust = await prisma.customer.create({
      data: {
        name: fullName(),
        companyName: Math.random() > 0.4 ? pick(COMPANY_NAMES) : null,
        phone: phone(),
        email: `customer${i + 1}@email.com`,
        address: address(),
        ntn: Math.random() > 0.5 ? `${rand(1000000, 9999999)}-${rand(0, 9)}` : null,
        cnic: Math.random() > 0.5 ? cnic() : null,
        projectName: pick(PROJECT_NAMES),
        totalBilled,
        totalPaid,
        isActive: Math.random() > 0.05,
        notes: Math.random() > 0.6 ? 'Good client, prompt payments' : null,
      },
    });
    customerIds.push(cust.id);
  }

  // ── 5. SUPPLIERS (100) ───────────────────────────────────────────────────────
  console.log('[5/14] Creating 100 suppliers...');
  const supplierIds: string[] = [];
  const SUPPLIER_CATEGORIES = ['Cement', 'Steel', 'Electrical', 'Plumbing', 'Hardware', 'Aggregates', 'Timber', 'Paint', 'Glass', 'General'];
  for (let i = 0; i < 100; i++) {
    const totalPurchased = randDecimal(100000, 5000000);
    const totalPaid = randDecimal(0, totalPurchased);
    const sup = await prisma.supplier.create({
      data: {
        name: fullName(),
        companyName: pick(SUPPLIERS_NAMES),
        phone: phone(),
        email: `supplier${i + 1}@email.com`,
        address: address(),
        ntn: Math.random() > 0.5 ? `${rand(1000000, 9999999)}-${rand(0, 9)}` : null,
        category: pick(SUPPLIER_CATEGORIES),
        totalPurchased,
        totalPaid,
        isActive: Math.random() > 0.05,
        notes: Math.random() > 0.6 ? 'Reliable supplier' : null,
      },
    });
    supplierIds.push(sup.id);
  }

  // ── 6. MACHINERY (100) ───────────────────────────────────────────────────────
  console.log('[6/14] Creating 100 machinery...');
  const machineryIds: string[] = [];
  const MACHINERY_STATUSES = ['Active', 'Active', 'Active', 'Inactive', 'Maintenance', 'Retired'] as const;
  for (let i = 0; i < 100; i++) {
    const mach = await prisma.machinery.create({
      data: {
        name: pick(MACHINERY_NAMES),
        model: pick(MACHINERY_MODELS),
        serialNumber: `SN-${rand(10000, 99999)}`,
        purchaseDate: pastDate(1825),
        purchasePrice: randDecimal(500000, 10000000),
        status: pick(MACHINERY_STATUSES),
        totalRunningHours: randDecimal(0, 5000),
        nextMaintenanceDate: Math.random() > 0.3 ? futureDate(90) : null,
        notes: Math.random() > 0.6 ? 'Regular maintenance required' : null,
      },
    });
    machineryIds.push(mach.id);
  }

  // ── Machinery Maintenance (100) ──────────────────────────────────────────────
  console.log('    Creating machinery maintenance records...');
  const MAINTENANCE_TYPES = ['Preventive', 'Corrective', 'Inspection'] as const;
  for (let i = 0; i < 100; i++) {
    await prisma.machineryMaintenance.create({
      data: {
        machineryId: pick(machineryIds),
        maintenanceDate: pastDate(365),
        type: pick(MAINTENANCE_TYPES),
        description: pick(['Oil change', 'Filter replacement', 'Engine overhaul', 'Hydraulic service', 'Tyre change', 'Battery replacement', 'Belt replacement', 'Full service']),
        cost: randDecimal(5000, 200000),
        runningHoursAtService: randDecimal(100, 5000),
        nextMaintenanceDate: futureDate(180),
        serviceProvider: `${pick(FIRST_NAMES)} Auto Workshop`,
      },
    });
  }

  // ── 7. VEHICLES (100) ────────────────────────────────────────────────────────
  console.log('[7/14] Creating 100 vehicles...');
  const vehicleIds: string[] = [];
  const VEHICLE_STATUSES = ['Active', 'Active', 'Active', 'Inactive', 'Maintenance'] as const;
  const usedPlates = new Set<string>();
  for (let i = 0; i < 100; i++) {
    let plate: string;
    do {
      plate = `${pick(['LHR', 'KHI', 'ISB', 'RWP', 'FSD', 'MUL'])}-${rand(1000, 9999)}`;
    } while (usedPlates.has(plate));
    usedPlates.add(plate);

    const veh = await prisma.vehicle.create({
      data: {
        registrationNumber: plate,
        make: pick(VEHICLE_MAKES),
        model: pick(VEHICLE_MODELS),
        year: rand(2010, 2024),
        driverName: fullName(),
        driverContact: phone(),
        purchasePrice: randDecimal(1000000, 8000000),
        purchaseDate: pastDate(1825),
        status: pick(VEHICLE_STATUSES),
        totalMileage: randDecimal(0, 150000),
        nextMaintenanceDate: Math.random() > 0.3 ? futureDate(90) : null,
        notes: Math.random() > 0.6 ? 'Good condition' : null,
      },
    });
    vehicleIds.push(veh.id);
  }

  // ── Vehicle Maintenance (100) ────────────────────────────────────────────────
  console.log('    Creating vehicle maintenance records...');
  for (let i = 0; i < 100; i++) {
    await prisma.vehicleMaintenance.create({
      data: {
        vehicleId: pick(vehicleIds),
        maintenanceDate: pastDate(365),
        description: pick(['Oil change', 'Tyre rotation', 'Brake service', 'Engine tune-up', 'AC service', 'Radiator flush', 'Full service', 'Gear service']),
        cost: randDecimal(2000, 80000),
        serviceProvider: `${pick(FIRST_NAMES)} Auto Works`,
        nextDueDate: futureDate(180),
        mileageAtService: randDecimal(5000, 150000),
        notes: Math.random() > 0.6 ? 'Completed on time' : null,
      },
    });
  }

  // ── 8. PLANTS (100) ──────────────────────────────────────────────────────────
  console.log('[8/14] Creating 100 plants...');
  const PLANT_STATUSES = ['Active', 'Active', 'Active', 'Inactive', 'Maintenance', 'Retired'] as const;
  for (let i = 0; i < 100; i++) {
    await prisma.plant.create({
      data: {
        name: pick(PLANT_NAMES),
        type: pick(PLANT_TYPES),
        manufacturer: pick(['Siemens', 'ABB', 'Atlas Copco', 'Ingersoll Rand', 'Cummins', 'Perkins', 'Kirloskar', 'Caterpillar']),
        serialNumber: `PL-${rand(10000, 99999)}`,
        purchaseDate: pastDate(1825),
        purchasePrice: randDecimal(100000, 3000000),
        currentValue: randDecimal(50000, 2500000),
        status: pick(PLANT_STATUSES),
        location: `${pick(PROJECT_NAMES)} Site`,
        lastMaintenanceDate: pastDate(180),
        nextMaintenanceDate: futureDate(90),
        notes: Math.random() > 0.6 ? 'Operational' : null,
      },
    });
  }

  // ── 9. INVENTORY ITEMS (100) ─────────────────────────────────────────────────
  console.log('[9/14] Creating 100 inventory items...');
  const inventoryIds: string[] = [];
  const UNITS = ['Bags', 'Kg', 'Nos', 'Cft', 'Sqft', 'Meter', 'Roll', 'Litre', 'Sheet', 'Ton'];
  for (let i = 0; i < 100; i++) {
    const currentStock = randDecimal(0, 500);
    const lowStockThreshold = randDecimal(10, 50);
    const inv = await prisma.inventoryItem.create({
      data: {
        name: `${pick(INVENTORY_NAMES)} ${rand(1, 5)}`,
        category: pick(INVENTORY_CATEGORIES),
        unit: pick(UNITS),
        currentStock,
        lowStockThreshold,
        unitPrice: randDecimal(50, 5000),
        supplierName: pick(SUPPLIERS_NAMES),
        location: `Warehouse ${pick(['A', 'B', 'C', 'D'])}`,
        notes: Math.random() > 0.6 ? 'Check expiry dates' : null,
      },
    });
    inventoryIds.push(inv.id);
  }

  // ── Stock Transactions (100) ─────────────────────────────────────────────────
  console.log('    Creating stock transactions...');
  const STOCK_TYPES = ['In', 'Out', 'Adjustment'] as const;
  for (let i = 0; i < 100; i++) {
    await prisma.stockTransaction.create({
      data: {
        inventoryItemId: pick(inventoryIds),
        type: pick(STOCK_TYPES),
        quantity: randDecimal(1, 100),
        unitPrice: randDecimal(50, 5000),
        date: pastDate(180),
        reference: `PO-${rand(1000, 9999)}`,
        projectName: pick(PROJECT_NAMES),
        notes: Math.random() > 0.6 ? 'Verified by supervisor' : null,
        createdById: adminId,
      },
    });
  }

  // ── 10. INCOME (100) ─────────────────────────────────────────────────────────
  console.log('[10/14] Creating 100 income records...');
  const INCOME_CATEGORIES = ['CustomerPayment', 'ProjectIncome', 'OtherIncome'] as const;
  for (let i = 0; i < 100; i++) {
    await prisma.income.create({
      data: {
        category: pick(INCOME_CATEGORIES),
        amount: randDecimal(50000, 2000000),
        date: pastDate(365),
        description: pick(INCOME_DESCRIPTIONS),
        customerName: fullName(),
        projectName: pick(PROJECT_NAMES),
        isPaid: Math.random() > 0.2,
        createdById: adminId,
      },
    });
  }

  // ── 11. EXPENSE (100) ────────────────────────────────────────────────────────
  console.log('[11/14] Creating 100 expense records...');
  const EXPENSE_CATEGORIES = ['LabourExpenses', 'Salaries', 'MachineryMaintenance', 'VehicleExpenses', 'Fuel', 'PlantExpenses', 'CarpentryExpenses', 'ElectricalExpenses', 'SuppliesMaterialPurchase', 'OfficeExpenses', 'Miscellaneous'] as const;
  for (let i = 0; i < 100; i++) {
    await prisma.expense.create({
      data: {
        category: pick(EXPENSE_CATEGORIES),
        amount: randDecimal(5000, 500000),
        date: pastDate(365),
        description: pick(EXPENSE_DESCRIPTIONS),
        vendor: pick(SUPPLIERS_NAMES),
        createdById: adminId,
      },
    });
  }

  // ── 12. TAX RECORDS (100) ────────────────────────────────────────────────────
  console.log('[12/14] Creating 100 tax records...');
  const TAX_TYPES = ['VAT', 'GST', 'Income', 'Withholding', 'Other'] as const;
  for (let i = 0; i < 100; i++) {
    const periodStart = pastDate(730);
    const periodEnd = new Date(periodStart.getTime() + 90 * 86400000);
    const dueDate = new Date(periodEnd.getTime() + 30 * 86400000);
    const isPaid = Math.random() > 0.35;
    await prisma.taxRecord.create({
      data: {
        taxType: pick(TAX_TYPES),
        amount: randDecimal(10000, 500000),
        periodStart,
        periodEnd,
        dueDate,
        paidDate: isPaid ? pastDate(60) : null,
        isPaid,
        reference: `TAX-${rand(1000, 9999)}`,
        description: `Tax filing for ${rand(2023, 2025)}`,
        notes: Math.random() > 0.6 ? 'Filed with FBR' : null,
        createdById: adminId,
      },
    });
  }

  // ── 13. NOTIFICATIONS (100) ──────────────────────────────────────────────────
  console.log('[13/14] Creating 100 notifications...');
  const NOTIF_TYPES = ['System', 'Alert', 'Info', 'Warning'] as const;
  const NOTIF_TITLES = ['Low Stock Alert', 'Maintenance Due', 'Payment Received', 'New Employee Added', 'Vehicle Inspection', 'Salary Processed', 'Tax Due Soon', 'System Update', 'Labour Attendance', 'Budget Alert'];
  for (let i = 0; i < 100; i++) {
    const isRead = Math.random() > 0.4;
    const createdAt = pastDate(60);
    await prisma.notification.create({
      data: {
        type: pick(NOTIF_TYPES),
        title: pick(NOTIF_TITLES),
        message: `Notification ${i + 1}: Action required for ${pick(PROJECT_NAMES)}.`,
        isRead,
        userId: adminId,
        createdAt,
        readAt: isRead ? new Date(createdAt.getTime() + rand(1, 24) * 3600000) : null,
      },
    });
  }

  // ── 14. AUDIT LOGS (100) ─────────────────────────────────────────────────────
  console.log('[14/14] Creating 100 audit logs...');
  const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT'];
  const ENTITIES = ['Employee', 'Labour', 'Machinery', 'Vehicle', 'Income', 'Expense', 'Customer', 'Supplier', 'Inventory', 'TaxRecord'];
  for (let i = 0; i < 100; i++) {
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        userEmail: 'admin@constructpro.com',
        action: pick(ACTIONS),
        entityType: pick(ENTITIES),
        entityId: crypto.randomUUID(),
        ipAddress: `192.168.${rand(1, 10)}.${rand(1, 254)}`,
        succeeded: Math.random() > 0.05,
        createdAt: pastDate(90),
      },
    });
  }

  console.log('\n✅ Test data seed complete!');
  console.log('   • 100 Employees + 100 Salary Payments');
  console.log('   • 100 Labours + 100 Attendances + 100 Advances');
  console.log('   • 100 Customers');
  console.log('   • 100 Suppliers');
  console.log('   • 100 Machinery + 100 Maintenance Records');
  console.log('   • 100 Vehicles + 100 Maintenance Records');
  console.log('   • 100 Plants');
  console.log('   • 100 Inventory Items + 100 Stock Transactions');
  console.log('   • 100 Income Records');
  console.log('   • 100 Expense Records');
  console.log('   • 100 Tax Records');
  console.log('   • 100 Notifications');
  console.log('   • 100 Audit Logs');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

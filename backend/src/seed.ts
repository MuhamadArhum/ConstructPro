import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as bcrypt from 'bcrypt';
import path from 'path';

const dbUrl = process.env.DATABASE_URL ?? 'file:./constructpro.db';
const dbPath = dbUrl.replace(/^file:/, '');
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
const prisma = new PrismaClient({ adapter } as any);

// ─── Permission definitions ────────────────────────────────────────
const PERMISSIONS: { module: string; action: string; code: string }[] = [
  { module: 'Dashboard', action: 'View', code: 'Dashboard.View' },

  { module: 'Users', action: 'View', code: 'Users.View' },
  { module: 'Users', action: 'Create', code: 'Users.Create' },
  { module: 'Users', action: 'Edit', code: 'Users.Edit' },
  { module: 'Users', action: 'Delete', code: 'Users.Delete' },

  { module: 'Roles', action: 'View', code: 'Roles.View' },
  { module: 'Roles', action: 'Create', code: 'Roles.Create' },
  { module: 'Roles', action: 'Edit', code: 'Roles.Edit' },
  { module: 'Roles', action: 'Delete', code: 'Roles.Delete' },

  { module: 'AuditLogs', action: 'View', code: 'AuditLogs.View' },

  { module: 'Profile', action: 'View', code: 'Profile.View' },
  { module: 'Profile', action: 'Edit', code: 'Profile.Edit' },

  { module: 'Income', action: 'View', code: 'Income.View' },
  { module: 'Income', action: 'Create', code: 'Income.Create' },
  { module: 'Income', action: 'Edit', code: 'Income.Edit' },
  { module: 'Income', action: 'Delete', code: 'Income.Delete' },

  { module: 'Expense', action: 'View', code: 'Expense.View' },
  { module: 'Expense', action: 'Create', code: 'Expense.Create' },
  { module: 'Expense', action: 'Edit', code: 'Expense.Edit' },
  { module: 'Expense', action: 'Delete', code: 'Expense.Delete' },

  { module: 'Labour', action: 'View', code: 'Labour.View' },
  { module: 'Labour', action: 'Create', code: 'Labour.Create' },
  { module: 'Labour', action: 'Edit', code: 'Labour.Edit' },
  { module: 'Labour', action: 'Delete', code: 'Labour.Delete' },

  { module: 'Employees', action: 'View', code: 'Employees.View' },
  { module: 'Employees', action: 'Create', code: 'Employees.Create' },
  { module: 'Employees', action: 'Edit', code: 'Employees.Edit' },
  { module: 'Employees', action: 'Delete', code: 'Employees.Delete' },

  { module: 'Machinery', action: 'View', code: 'Machinery.View' },
  { module: 'Machinery', action: 'Create', code: 'Machinery.Create' },
  { module: 'Machinery', action: 'Edit', code: 'Machinery.Edit' },
  { module: 'Machinery', action: 'Delete', code: 'Machinery.Delete' },

  { module: 'Vehicles', action: 'View', code: 'Vehicles.View' },
  { module: 'Vehicles', action: 'Create', code: 'Vehicles.Create' },
  { module: 'Vehicles', action: 'Edit', code: 'Vehicles.Edit' },
  { module: 'Vehicles', action: 'Delete', code: 'Vehicles.Delete' },

  { module: 'Plants', action: 'View', code: 'Plants.View' },
  { module: 'Plants', action: 'Create', code: 'Plants.Create' },
  { module: 'Plants', action: 'Edit', code: 'Plants.Edit' },
  { module: 'Plants', action: 'Delete', code: 'Plants.Delete' },

  { module: 'Customers', action: 'View', code: 'Customers.View' },
  { module: 'Customers', action: 'Create', code: 'Customers.Create' },
  { module: 'Customers', action: 'Edit', code: 'Customers.Edit' },
  { module: 'Customers', action: 'Delete', code: 'Customers.Delete' },

  { module: 'Suppliers', action: 'View', code: 'Suppliers.View' },
  { module: 'Suppliers', action: 'Create', code: 'Suppliers.Create' },
  { module: 'Suppliers', action: 'Edit', code: 'Suppliers.Edit' },
  { module: 'Suppliers', action: 'Delete', code: 'Suppliers.Delete' },

  { module: 'Inventory', action: 'View', code: 'Inventory.View' },
  { module: 'Inventory', action: 'Create', code: 'Inventory.Create' },
  { module: 'Inventory', action: 'Edit', code: 'Inventory.Edit' },
  { module: 'Inventory', action: 'Delete', code: 'Inventory.Delete' },

  { module: 'Tax', action: 'View', code: 'Tax.View' },
  { module: 'Tax', action: 'Create', code: 'Tax.Create' },
  { module: 'Tax', action: 'Edit', code: 'Tax.Edit' },
  { module: 'Tax', action: 'Delete', code: 'Tax.Delete' },

  { module: 'Accounts', action: 'View', code: 'Accounts.View' },
  { module: 'Accounts', action: 'Create', code: 'Accounts.Create' },
  { module: 'Accounts', action: 'Edit', code: 'Accounts.Edit' },
  { module: 'Accounts', action: 'Delete', code: 'Accounts.Delete' },

  { module: 'Reports', action: 'View', code: 'Reports.View' },

  { module: 'Notifications', action: 'View', code: 'Notifications.View' },

  { module: 'Settings', action: 'View', code: 'Settings.View' },
  { module: 'Settings', action: 'Edit', code: 'Settings.Edit' },

  { module: 'Project', action: 'View', code: 'Project.View' },
  { module: 'Project', action: 'Manage', code: 'Project.Manage' },

  { module: 'Invoice', action: 'View', code: 'Invoice.View' },
  { module: 'Invoice', action: 'Manage', code: 'Invoice.Manage' },

  { module: 'PurchaseOrder', action: 'View', code: 'PurchaseOrder.View' },
  { module: 'PurchaseOrder', action: 'Manage', code: 'PurchaseOrder.Manage' },
];

// ─── Role names ───────────────────────────────────────────────────
const ROLE_NAMES = ['Admin', 'Accountant', 'Manager', 'DataEntryOperator'];

async function main() {
  console.log('Starting database seed...');

  // 1. Create default roles
  console.log('\n[1/6] Creating roles...');
  const roleMap: Record<string, string> = {};
  for (const name of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roleMap[name] = role.id;
    console.log(`  Role: ${name} (${role.id})`);
  }

  // 2. Create all 63 permissions
  console.log('\n[2/6] Creating permissions...');
  const permissionIds: string[] = [];
  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        module: perm.module,
        action: perm.action,
        code: perm.code,
        description: `${perm.action} access for ${perm.module}`,
      },
    });
    permissionIds.push(permission.id);
  }
  console.log(`  Created/verified ${permissionIds.length} permissions`);

  // 3. Assign ALL permissions to Admin role
  console.log('\n[3/6] Assigning all permissions to Admin role...');
  const adminRoleId = roleMap['Admin'];
  for (const permissionId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRoleId,
          permissionId,
        },
      },
      update: {},
      create: {
        roleId: adminRoleId,
        permissionId,
      },
    });
  }
  console.log(`  Assigned ${permissionIds.length} permissions to Admin role`);

  // 4. Create admin user
  console.log('\n[4/6] Creating admin user...');
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@constructpro.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUserId: string;

  if (existingUser) {
    console.log(`  Admin user already exists: ${adminEmail} — skipping`);
    adminUserId = existingUser.id;
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const adminUser = await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: adminEmail,
        passwordHash,
        isActive: true,
      },
    });
    adminUserId = adminUser.id;
    console.log(`  Admin user created: ${adminEmail} (${adminUserId})`);
  }

  // 5. Assign Admin role to admin user
  console.log('\n[5/6] Assigning Admin role to admin user...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUserId,
        roleId: adminRoleId,
      },
    },
    update: {},
    create: {
      userId: adminUserId,
      roleId: adminRoleId,
    },
  });
  console.log(`  Admin role assigned to ${adminEmail}`);

  // 6. Create default CompanySettings if none exists
  console.log('\n[6/6] Creating default CompanySettings...');
  const settingsCount = await prisma.companySettings.count();
  if (settingsCount === 0) {
    await prisma.companySettings.create({
      data: {
        companyName: 'ConstructPro',
        currency: 'PKR',
      },
    });
    console.log('  Default CompanySettings created');
  } else {
    console.log('  CompanySettings already exists — skipping');
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

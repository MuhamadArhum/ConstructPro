import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { ProfileModule } from './profile/profile.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { EmployeesModule } from './employees/employees.module';
import { LabourModule } from './labour/labour.module';
import { MachineryModule } from './machinery/machinery.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PlantsModule } from './plants/plants.module';
import { InventoryModule } from './inventory/inventory.module';
import { IncomeModule } from './income/income.module';
import { ExpenseModule } from './expense/expense.module';
import { AccountsModule } from './accounts/accounts.module';
import { TaxModule } from './tax/tax.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    ProfileModule,
    CustomersModule,
    SuppliersModule,
    EmployeesModule,
    LabourModule,
    MachineryModule,
    VehiclesModule,
    PlantsModule,
    InventoryModule,
    IncomeModule,
    ExpenseModule,
    AccountsModule,
    TaxModule,
    ReportsModule,
    DashboardModule,
    ProjectsModule,
    InvoicesModule,
    PurchaseOrdersModule,
    NotificationsModule,
    SettingsModule,
    AuditLogsModule,
  ],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}

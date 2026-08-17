import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'Create',
  PUT: 'Update',
  PATCH: 'Update',
  DELETE: 'Delete',
};

const URL_ENTITY_MAP: Array<{ pattern: RegExp; entity: string }> = [
  { pattern: /\/api\/auth\/login/, entity: 'Auth' },
  { pattern: /\/api\/income/, entity: 'Income' },
  { pattern: /\/api\/expense/, entity: 'Expense' },
  { pattern: /\/api\/labour/, entity: 'Labour' },
  { pattern: /\/api\/employees/, entity: 'Employee' },
  { pattern: /\/api\/machinery/, entity: 'Machinery' },
  { pattern: /\/api\/vehicle/, entity: 'Vehicle' },
  { pattern: /\/api\/plant/, entity: 'Plant' },
  { pattern: /\/api\/inventory/, entity: 'Inventory' },
  { pattern: /\/api\/customer/, entity: 'Customer' },
  { pattern: /\/api\/supplier/, entity: 'Supplier' },
  { pattern: /\/api\/accounts/, entity: 'Accounts' },
  { pattern: /\/api\/tax/, entity: 'Tax' },
  { pattern: /\/api\/projects/, entity: 'Project' },
  { pattern: /\/api\/invoices/, entity: 'Invoice' },
  { pattern: /\/api\/purchase-orders/, entity: 'PurchaseOrder' },
  { pattern: /\/api\/reports/, entity: 'Report' },
  { pattern: /\/api\/dashboard/, entity: 'Dashboard' },
  { pattern: /\/api\/users/, entity: 'User' },
  { pattern: /\/api\/roles/, entity: 'Role' },
  { pattern: /\/api\/settings/, entity: 'Settings' },
  { pattern: /\/api\/notifications/, entity: 'Notification' },
  { pattern: /\/api\/profile/, entity: 'Profile' },
];

function getEntityType(url: string): string {
  for (const entry of URL_ENTITY_MAP) {
    if (entry.pattern.test(url)) return entry.entity;
  }
  return 'System';
}

function getEntityId(url: string, body?: any): string | undefined {
  const match = url.match(/\/([a-f0-9-]{36})/);
  return match?.[1] ?? body?.id ?? undefined;
}

function safeJson(value: any): any {
  if (!value) return undefined;
  try {
    return JSON.parse(JSON.stringify(value, (_key, val) => {
      if (val && typeof val === 'object' && val.constructor?.name === 'Decimal') return val.toString();
      if (val instanceof Date) return val.toISOString();
      return val;
    }));
  } catch {
    return undefined;
  }
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip } = req;

    const action = METHOD_ACTION_MAP[method];
    if (!action) return next.handle();

    const entityType = getEntityType(url);
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? ip;

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId = getEntityId(url, responseBody);
        const newValues = method !== 'DELETE' ? safeJson({ id: responseBody?.id, message: responseBody?.message }) : undefined;

        this.auditLogsService.createLog({
          userId: user?.id ?? undefined,
          userEmail: user?.email ?? undefined,
          action: `${action} ${entityType}`,
          entityType,
          entityId,
          newValues,
          ipAddress,
          succeeded: true,
        }).catch((err) => this.logger.error(`Audit log failed: ${err?.message}`));
      }),
      catchError((err) => {
        const entityId = getEntityId(url);

        this.auditLogsService.createLog({
          userId: user?.id ?? undefined,
          userEmail: user?.email ?? undefined,
          action: `${action} ${entityType}`,
          entityType,
          entityId,
          ipAddress,
          succeeded: false,
          errorMessage: err?.message ?? 'Unknown error',
        }).catch((e) => this.logger.error(`Audit log failed: ${e?.message}`));

        return throwError(() => err);
      }),
    );
  }
}

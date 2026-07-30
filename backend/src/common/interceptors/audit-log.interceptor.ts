import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
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

function getEntityId(url: string): string | undefined {
  const match = url.match(/\/([a-f0-9-]{36})/);
  return match?.[1];
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip } = req;

    const action = METHOD_ACTION_MAP[method];
    if (!action) return next.handle();

    const entityType = getEntityType(url);
    const entityId = getEntityId(url);
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? ip;

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const resolvedEntityId = entityId ?? responseBody?.id ?? undefined;
          this.auditLogsService.createLog({
            userId: user?.id ?? undefined,
            userEmail: user?.email ?? undefined,
            action: `${action} ${entityType}`,
            entityType,
            entityId: resolvedEntityId,
            newValues: method !== 'DELETE' ? responseBody : undefined,
            ipAddress,
            succeeded: true,
          });
        },
        error: (err) => {
          this.auditLogsService.createLog({
            userId: user?.id ?? undefined,
            userEmail: user?.email ?? undefined,
            action: `${action} ${entityType}`,
            entityType,
            entityId,
            ipAddress,
            succeeded: false,
            errorMessage: err?.message ?? 'Unknown error',
          });
        },
      }),
    );
  }
}

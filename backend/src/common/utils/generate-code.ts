import { PrismaService } from '../../prisma/prisma.service';

const PREFIXES = {
  employee:      'EMP',
  labour:        'LAB',
  customer:      'CUST',
  supplier:      'SUPL',
  machinery:     'MCH',
  vehicle:       'VEH',
  plant:         'PLT',
  inventoryItem: 'STK',
  income:        'INC',
  expense:       'EXP',
  salaryPayment: 'SAL',
  taxRecord:     'TAX',
  project:       'PRJ',
} as const;

type EntityKey = keyof typeof PREFIXES;

export async function generateCode(
  prisma: PrismaService,
  entity: EntityKey,
): Promise<string> {
  const prefix = PREFIXES[entity];
  const model = prisma[entity] as any;

  const last = await model.findFirst({
    where: { code: { startsWith: prefix + '-' } },
    orderBy: { code: 'desc' },
    select: { code: true },
  });

  let next = 1;
  if (last?.code) {
    const parts = last.code.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num)) next = num + 1;
  }

  return `${prefix}-${String(next).padStart(4, '0')}`;
}

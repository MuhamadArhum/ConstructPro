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

  // Load all codes with this prefix and find the max numeric value
  // (lexicographic desc sort fails for padded numbers like INC-0009 > INC-0010)
  const existing = await model.findMany({
    where: { code: { startsWith: prefix + '-' } },
    select: { code: true },
  });

  let maxNum = 0;
  for (const record of existing) {
    const parts = (record.code as string).split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  let next = maxNum + 1;
  let candidate = `${prefix}-${String(next).padStart(4, '0')}`;

  // Safety: verify uniqueness in case of race condition
  const conflict = await model.findUnique({ where: { code: candidate } });
  if (conflict) {
    next++;
    candidate = `${prefix}-${String(next).padStart(4, '0')}`;
  }

  return candidate;
}

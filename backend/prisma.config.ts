import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

function resolveDbPath(dbUrl: string): string {
  const dbPath = dbUrl.replace(/^file:/, '');
  return path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
}

const dbUrl = process.env.DATABASE_URL ?? 'file:./constructpro.db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: dbUrl,
    adapter: () => new PrismaBetterSqlite3({ url: resolveDbPath(dbUrl) }),
  },
});

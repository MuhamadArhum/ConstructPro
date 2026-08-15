/**
 * SQLite schema migration script.
 * Runs before the backend starts to ensure the user's database matches the current schema.
 * Uses the fresh bundled DB as source of truth — no Prisma CLI needed.
 */
const path = require('path');
const fs = require('fs');

const userDbPath = process.argv[2];
const templateDbPath = process.argv[3];

if (!userDbPath || !templateDbPath) {
  console.error('[migrate] Usage: node db-migrate.js <userDb> <templateDb>');
  process.exit(1);
}

if (!fs.existsSync(templateDbPath)) {
  console.error('[migrate] Template DB not found:', templateDbPath);
  process.exit(0); // non-fatal
}

// Resolve better-sqlite3 from the backend node_modules next to this script's resources
const nmDirs = [
  path.join(path.dirname(templateDbPath), 'node_modules'),
  path.join(__dirname, '..', 'backend-bundle', 'node_modules'),
  path.join(__dirname, '..', 'backend', 'node_modules'),
];

let Database;
for (const dir of nmDirs) {
  const candidate = path.join(dir, 'better-sqlite3');
  if (fs.existsSync(candidate)) {
    try { Database = require(candidate); break; } catch {}
  }
}

if (!Database) {
  console.error('[migrate] better-sqlite3 not found, skipping migration');
  process.exit(0);
}

try {
  const userDb = new Database(userDbPath);
  const templateDb = new Database(templateDbPath, { readonly: true });

  userDb.pragma('journal_mode = WAL');
  userDb.pragma('foreign_keys = OFF');

  // ── 1. Create missing tables ──────────────────────────────────────────────
  const templateTables = templateDb
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY rowid")
    .all();

  for (const { name, sql } of templateTables) {
    if (!sql) continue;
    const createSql = sql.replace(/^CREATE TABLE\s+/i, 'CREATE TABLE IF NOT EXISTS ');
    try {
      userDb.exec(createSql);
    } catch (e) {
      console.error(`[migrate] Error creating table ${name}:`, e.message);
    }
  }

  // ── 2. Add missing columns ────────────────────────────────────────────────
  for (const { name } of templateTables) {
    try {
      const templateCols = templateDb.prepare(`PRAGMA table_info("${name}")`).all();
      const userColNames = new Set(
        userDb.prepare(`PRAGMA table_info("${name}")`).all().map(c => c.name)
      );

      for (const col of templateCols) {
        if (userColNames.has(col.name)) continue;

        let defaultClause = '';
        if (col.dflt_value !== null) {
          defaultClause = ` DEFAULT ${col.dflt_value}`;
        } else if (col.notnull) {
          // SQLite requires a default for NOT NULL columns added via ALTER TABLE
          defaultClause = col.type.toUpperCase().includes('INT') ? ' DEFAULT 0'
            : col.type.toUpperCase().includes('REAL') ? ' DEFAULT 0'
            : col.type.toUpperCase().includes('NUM') ? ' DEFAULT 0'
            : ' DEFAULT ""';
        }

        const notNull = col.notnull ? ' NOT NULL' : '';
        try {
          userDb.exec(`ALTER TABLE "${name}" ADD COLUMN "${col.name}" ${col.type}${notNull}${defaultClause}`);
          console.log(`[migrate] Added column ${name}.${col.name}`);
        } catch (e) {
          console.error(`[migrate] Could not add ${name}.${col.name}:`, e.message);
        }
      }
    } catch (e) {
      console.error(`[migrate] Column check failed for ${name}:`, e.message);
    }
  }

  // ── 3. Ensure seed data exists (attach template, copy if missing) ─────────
  try {
    userDb.exec(`ATTACH DATABASE '${templateDbPath.replace(/'/g, "''")}' AS tmpl`);

    // Admin user
    const adminExists = userDb.prepare("SELECT 1 FROM users WHERE email = 'admin@constructpro.com'").get();
    if (!adminExists) {
      console.log('[migrate] Admin user missing — copying seed data from template...');

      // Copy roles
      userDb.exec(`INSERT OR IGNORE INTO roles SELECT * FROM tmpl.roles`);
      // Copy permissions
      userDb.exec(`INSERT OR IGNORE INTO permissions SELECT * FROM tmpl.permissions`);
      // Copy admin user
      userDb.exec(`INSERT OR IGNORE INTO users SELECT * FROM tmpl.users WHERE email = 'admin@constructpro.com'`);
      // Copy user_roles for admin
      userDb.exec(`
        INSERT OR IGNORE INTO user_roles
        SELECT ur.* FROM tmpl.user_roles ur
        JOIN tmpl.users u ON u.id = ur.userId
        WHERE u.email = 'admin@constructpro.com'
      `);
      // Copy role_permissions
      userDb.exec(`INSERT OR IGNORE INTO role_permissions SELECT * FROM tmpl.role_permissions`);
      // Copy company settings
      userDb.exec(`INSERT OR IGNORE INTO company_settings SELECT * FROM tmpl.company_settings`);

      console.log('[migrate] Seed data restored');
    }

    userDb.exec(`DETACH DATABASE tmpl`);
  } catch (e) {
    console.error('[migrate] Seed check failed:', e.message);
    try { userDb.exec(`DETACH DATABASE tmpl`); } catch {}
  }

  userDb.pragma('foreign_keys = ON');
  userDb.close();
  templateDb.close();

  console.log('[migrate] Migration complete');
} catch (e) {
  console.error('[migrate] Fatal error:', e.message);
  process.exit(0); // non-fatal — let backend attempt to start
}

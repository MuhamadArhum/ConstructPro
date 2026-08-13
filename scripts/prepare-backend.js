/**
 * Prepares a clean production backend bundle for Electron packaging.
 * Copies dist, public, prisma, db, then runs npm install --omit=dev.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BACKEND_SRC = path.join(ROOT, 'backend');
const STAGE = path.join(ROOT, 'backend-bundle');

function copyDir(src, dest, exclude = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (exclude.includes(entry)) continue;
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean staging dir (use Windows rmdir which handles locked .node files better)
if (fs.existsSync(STAGE)) {
  try {
    execSync(`rmdir /s /q "${STAGE}"`, { shell: 'cmd.exe', stdio: 'ignore' });
  } catch {
    // fallback: Node rmSync (may fail if file is locked by AV)
    try { fs.rmSync(STAGE, { recursive: true, force: true }); } catch {}
  }
}
fs.mkdirSync(STAGE, { recursive: true });

console.log('[prepare-backend] Copying dist...');
copyDir(path.join(BACKEND_SRC, 'dist'), path.join(STAGE, 'dist'));

console.log('[prepare-backend] Copying public...');
copyDir(path.join(BACKEND_SRC, 'public'), path.join(STAGE, 'public'));

console.log('[prepare-backend] Copying prisma...');
copyDir(path.join(BACKEND_SRC, 'prisma'), path.join(STAGE, 'prisma'));

console.log('[prepare-backend] Copying package.json...');
fs.copyFileSync(path.join(BACKEND_SRC, 'package.json'), path.join(STAGE, 'package.json'));

console.log('[prepare-backend] Copying prisma.config.ts...');
fs.copyFileSync(path.join(BACKEND_SRC, 'prisma.config.ts'), path.join(STAGE, 'prisma.config.ts'));

// Do NOT copy the dev database — always generate a fresh one with only the admin seed.

console.log('[prepare-backend] Installing production dependencies...');
execSync('npm install --omit=dev --no-audit --no-fund', {
  cwd: STAGE,
  stdio: 'inherit',
});

// @prisma/adapter-better-sqlite3 requires better-sqlite3@^12 which gets nested (ABI 137).
// better-sqlite3 v13 uses N-API prebuilts (ABI-stable, works on Electron 43).
// Remove the nested v12 so Node resolves to the hoisted v13 N-API prebuilt instead.
const nestedSqlite = path.join(STAGE, 'node_modules', '@prisma', 'adapter-better-sqlite3', 'node_modules', 'better-sqlite3');
if (fs.existsSync(nestedSqlite)) {
  fs.rmSync(nestedSqlite, { recursive: true, force: true });
  console.log('[prepare-backend] Removed nested better-sqlite3 v12 — will use outer v13 N-API prebuilt');
}

console.log('[prepare-backend] Generating Prisma client...');
execSync('npx prisma generate', {
  cwd: STAGE,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: 'file:./constructpro.db' },
});

console.log('[prepare-backend] Creating fresh database schema...');
execSync('npx prisma db push', {
  cwd: STAGE,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: 'file:./constructpro.db' },
});

console.log('[prepare-backend] Seeding admin user...');
const stageDbAbsolute = path.resolve(STAGE, 'constructpro.db');
execSync('npx ts-node --transpile-only src/seed.ts', {
  cwd: BACKEND_SRC,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: `file:${stageDbAbsolute}`, NODE_ENV: 'production' },
});

console.log('[prepare-backend] Backend bundle ready at:', STAGE);

/**
 * Prepares a clean production backend bundle for Electron packaging.
 * Uses esbuild to bundle NestJS into a single file.
 * Only installs native packages + Prisma (not all 100+ production deps).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BACKEND_SRC = path.join(ROOT, 'backend');
const STAGE = path.join(ROOT, 'backend-bundle');
const SRC_NM = path.join(BACKEND_SRC, 'node_modules');
const STAGE_NM = path.join(STAGE, 'node_modules');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.lstatSync(srcPath);
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(srcPath);
      try { fs.unlinkSync(destPath); } catch {}
      fs.symlinkSync(target, destPath);
    } else if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── Clean staging dir ────────────────────────────────────────────────────────
if (fs.existsSync(STAGE)) {
  try {
    execSync(`rmdir /s /q "${STAGE}"`, { shell: 'cmd.exe', stdio: 'ignore' });
  } catch {
    try { fs.rmSync(STAGE, { recursive: true, force: true }); } catch {}
  }
}
fs.mkdirSync(STAGE, { recursive: true });

// ─── Copy prisma schema and public ───────────────────────────────────────────
console.log('[prepare-backend] Copying prisma schema...');
copyDir(path.join(BACKEND_SRC, 'prisma'), path.join(STAGE, 'prisma'));

if (fs.existsSync(path.join(BACKEND_SRC, 'public'))) {
  console.log('[prepare-backend] Copying public...');
  copyDir(path.join(BACKEND_SRC, 'public'), path.join(STAGE, 'public'));
}

// ─── Minimal package.json for npm install ────────────────────────────────────
// Only list packages that cannot be bundled (native + Prisma client)
const minimalPkg = {
  name: 'constructpro-backend',
  version: '1.0.0',
  private: true,
  dependencies: {
    'bcrypt': '*',
    'better-sqlite3': '*',
    '@prisma/client': '*',
    '@prisma/adapter-better-sqlite3': '*',
    '@prisma/driver-adapter-utils': '*',
    '@prisma/client-runtime-utils': '*',
    '@prisma/debug': '*',
  },
};

// Use exact versions from backend package.json to stay in sync
try {
  const backendPkg = JSON.parse(fs.readFileSync(path.join(BACKEND_SRC, 'package.json'), 'utf8'));
  const allDeps = { ...backendPkg.dependencies, ...backendPkg.devDependencies };
  for (const key of Object.keys(minimalPkg.dependencies)) {
    if (allDeps[key]) minimalPkg.dependencies[key] = allDeps[key];
  }
} catch {}

fs.writeFileSync(path.join(STAGE, 'package.json'), JSON.stringify(minimalPkg, null, 2));

// ─── Install only the minimal packages ───────────────────────────────────────
console.log('[prepare-backend] Installing minimal packages (native + Prisma only)...');
execSync('npm install --no-audit --no-fund --legacy-peer-deps', {
  cwd: STAGE,
  stdio: 'inherit',
});

// Remove nested better-sqlite3 v12 inside adapter (ABI conflict with Electron 43)
const nestedSqlite = path.join(STAGE_NM, '@prisma', 'adapter-better-sqlite3', 'node_modules', 'better-sqlite3');
if (fs.existsSync(nestedSqlite)) {
  fs.rmSync(nestedSqlite, { recursive: true, force: true });
  console.log('[prepare-backend] Removed nested better-sqlite3 (ABI conflict)');
}

// ─── Generate Prisma client ───────────────────────────────────────────────────
console.log('[prepare-backend] Generating Prisma client...');
execSync('npx prisma generate', {
  cwd: BACKEND_SRC,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: `file:${path.resolve(STAGE, 'constructpro.db')}` },
});

// Copy generated .prisma/client into stage node_modules
const generatedClient = path.join(SRC_NM, '.prisma');
if (fs.existsSync(generatedClient)) {
  console.log('[prepare-backend] Copying generated .prisma client...');
  copyDir(generatedClient, path.join(STAGE_NM, '.prisma'));
}

// ─── Create fresh database ────────────────────────────────────────────────────
console.log('[prepare-backend] Creating fresh database schema...');
execSync('npx prisma db push', {
  cwd: BACKEND_SRC,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: `file:${path.resolve(STAGE, 'constructpro.db')}` },
});

console.log('[prepare-backend] Seeding admin user...');
execSync('npx ts-node --transpile-only src/seed.ts', {
  cwd: BACKEND_SRC,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: `file:${path.resolve(STAGE, 'constructpro.db')}`,
    NODE_ENV: 'production',
  },
});

// ─── Copy migration script ────────────────────────────────────────────────────
const migrateScript = path.join(__dirname, 'db-migrate.js');
if (fs.existsSync(migrateScript)) {
  fs.copyFileSync(migrateScript, path.join(STAGE, 'db-migrate.js'));
  console.log('[prepare-backend] Copied db-migrate.js');
}

// ─── esbuild bundle ───────────────────────────────────────────────────────────
console.log('[prepare-backend] Bundling backend with esbuild...');
execSync('node scripts/bundle-backend.js', {
  cwd: ROOT,
  stdio: 'inherit',
});

// ─── Prune non-Windows prebuilds ──────────────────────────────────────────────
const prebuildsDir = path.join(STAGE_NM, 'better-sqlite3', 'prebuilds');
if (fs.existsSync(prebuildsDir)) {
  for (const file of fs.readdirSync(prebuildsDir)) {
    if (!file.startsWith('win32')) {
      fs.rmSync(path.join(prebuildsDir, file), { force: true });
    }
  }
}

// Prune non-SQLite WASM files from @prisma/client runtime
const runtimeDir = path.join(STAGE_NM, '@prisma', 'client', 'runtime');
if (fs.existsSync(runtimeDir)) {
  const nonSqlite = /query_compiler.*(?:postgresql|mysql|sqlserver|cockroachdb).*wasm-base64\.(js|mjs)$/;
  for (const file of fs.readdirSync(runtimeDir)) {
    if (nonSqlite.test(file) || file.endsWith('.map')) {
      fs.rmSync(path.join(runtimeDir, file), { force: true });
    }
  }
}

console.log('[prepare-backend] Bundle ready at:', STAGE);

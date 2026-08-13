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

// ─── Prune unnecessary production files (~200MB savings) ─────────────────────
console.log('[prepare-backend] Pruning unnecessary production packages...');

const nm = path.join(STAGE, 'node_modules');

// Packages that are dev/tool-only and not needed at runtime
const pruneDirs = [
  // Prisma tooling (not needed at runtime)
  path.join(nm, '@prisma', 'studio-core'),   // Prisma Studio GUI         ~43MB
  path.join(nm, '@prisma', 'dev'),            // Dev utilities             ~19MB
  path.join(nm, 'prisma'),                    // Prisma CLI                ~42MB
  // Orphan deps of studio-core / @prisma/dev (remain after parent is deleted)
  path.join(nm, 'elkjs'),                     // Graph layout (Studio)     ~8MB
  path.join(nm, 'react-dom'),                 // React UI (Studio)         ~7MB
  path.join(nm, 'react'),                     // React (Studio)            ~3MB
  path.join(nm, 'remeda'),                    // FP utils (@prisma/dev)    ~4MB
  path.join(nm, '@visx'),                     // Data viz (Studio)         ~3MB
  // Compiler / type tooling (not needed for compiled JS)
  path.join(nm, 'typescript'),                // TS compiler               ~23MB
  path.join(nm, '@types'),                    // Type defs (TS only)       ~6MB
  // Optional runtime deps we don't use
  path.join(nm, 'libphonenumber-js'),         // Phone validator (unused)  ~12MB
];

for (const dir of pruneDirs) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`[prepare-backend] Pruned: ${path.relative(nm, dir)}`);
  }
}

// schema-engine binary — used for db push/migrate (already done above), not needed at runtime
const schemaEng = path.join(nm, '@prisma', 'engines', 'schema-engine-windows.exe');
if (fs.existsSync(schemaEng)) {
  fs.rmSync(schemaEng, { force: true });
  console.log('[prepare-backend] Pruned: schema-engine-windows.exe (~20MB)');
}

// Non-SQLite WASM query compiler files — we only use SQLite; remove postgres/mysql/etc
const runtimeDir = path.join(nm, '@prisma', 'client', 'runtime');
if (fs.existsSync(runtimeDir)) {
  const nonSqliteWasm = /query_compiler.*(?:postgresql|mysql|sqlserver|cockroachdb).*wasm-base64\.(js|mjs)$/;
  for (const file of fs.readdirSync(runtimeDir)) {
    if (nonSqliteWasm.test(file)) {
      fs.rmSync(path.join(runtimeDir, file), { force: true });
      console.log(`[prepare-backend] Pruned WASM: ${file}`);
    }
    // Also remove source maps (not useful in production)
    if (file.endsWith('.map')) {
      fs.rmSync(path.join(runtimeDir, file), { force: true });
    }
  }
}

console.log('[prepare-backend] Pruning complete — bundle ready at:', STAGE);

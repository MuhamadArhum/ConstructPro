/**
 * Bundles the compiled NestJS backend into a single JS file using esbuild.
 * Native modules and Prisma client are kept external.
 */
const esbuild = require('esbuild');
const path = require('path');

const BACKEND_DIST = path.join(__dirname, '..', 'backend', 'dist');
const BUNDLE_OUT = path.join(__dirname, '..', 'backend-bundle', 'bundle.js');

async function bundle() {
  await esbuild.build({
    entryPoints: [path.join(BACKEND_DIST, 'main.js')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: BUNDLE_OUT,
    keepNames: true, // Required for NestJS dependency injection (class name reflection)
    external: [
      // Native addons - cannot be bundled
      'better-sqlite3',
      'bcrypt',
      // Prisma - kept external because it uses __dirname for engine resolution
      '@prisma/client',
      '@prisma/adapter-better-sqlite3',
      '@prisma/driver-adapter-utils',
      '@prisma/client-runtime-utils',
      '@prisma/debug',
      // NestJS optional peer deps (not installed, lazily required at runtime)
      '@nestjs/microservices',
      '@nestjs/websockets',
      'cache-manager',
      'class-transformer/storage',
      '@nestjs/devtools-integration',
      // Fastify platform deps (we use Express, not Fastify)
      '@fastify/static',
      '@fastify/view',
      'fastify',
      'fastify-plugin',
    ],
    logLevel: 'info',
  });

  console.log('[bundle-backend] Done:', BUNDLE_OUT);
}

bundle().catch((err) => {
  console.error('[bundle-backend] Failed:', err);
  process.exit(1);
});

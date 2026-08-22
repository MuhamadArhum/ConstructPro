import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as express from 'express';
import { join } from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import helmet from 'helmet';

async function runMigrations() {
  try {
    console.log('[startup] Running database sync...');
    const dbUrl = process.env.DATABASE_URL ?? 'file:./constructpro.db';
    const dbPath = dbUrl.replace(/^file:/, '');
    const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
    const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
    const prisma = new PrismaClient({ adapter } as any);
    await prisma.$connect();
    await prisma.$disconnect();
    console.log('[startup] Database connection verified');
  } catch (err) {
    console.error('[startup] Database sync failed:', err);
  }
}

async function bootstrap() {
  await runMigrations();

  const app = await NestFactory.create(AppModule);

  // ─── Security headers ─────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
    }),
  );

  // ─── CORS ─────────────────────────────────────────────────────────
  const rawOrigins = process.env.CORS_ORIGINS;
  const origins: string | string[] = rawOrigins
    ? rawOrigins.split(',').map((o) => o.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // ─── Global pipes ─────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ─── Global filters & interceptors ────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ─── Global prefix ────────────────────────────────────────────────
  app.setGlobalPrefix('api', { exclude: ['/uploads/(.*)'] });

  // ─── Serve uploads folder as static files ─────────────────────────
  const uploadsPath = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // ─── Swagger ──────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('ConstructPro API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // ─── Listen ───────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('[fatal] Bootstrap failed:', err);
  process.exit(1);
});

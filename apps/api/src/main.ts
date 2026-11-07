import './instrument';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';
import { createValidationPipe } from './core/pipes/create-validation-pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      // apps/web (:3001) → API (:4000) cross-origin fetch; same-origin CORP blocks browser reads
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  const corsOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const allowVercelPreviews =
    (process.env.CORS_ALLOW_VERCEL ?? '').toLowerCase() === 'true';

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Same-origin / server-to-server / mobile without Origin
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Soft launch: Vercel preview/production *.vercel.app before custom domain
      if (allowVercelPreviews && /\.vercel\.app$/i.test(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    exposedHeaders: ['Set-Cookie'],
  });

  const enableSwagger =
    process.env.ENABLE_SWAGGER === 'true' ||
    process.env.NODE_ENV !== 'production';
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('turta API')
      .setDescription('turta platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 4000);
  // Railway/public proxies need 0.0.0.0 — default bind can yield 502
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`API running on http://0.0.0.0:${port}`);
  if (enableSwagger) {
    logger.log(`Swagger UI: http://0.0.0.0:${port}/api/docs`);
  }
}

void bootstrap();

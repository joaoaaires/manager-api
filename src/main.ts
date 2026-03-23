import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import type { Application, Request, Response } from 'express';
import * as promClient from 'prom-client';

import { applyCorrelationMiddleware } from '@common/middleware/correlation.middleware';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // security headers
  app.use(helmet());

  applyCorrelationMiddleware(app);

  // CORS configuration
  const configService = app.get(ConfigService);
  const corsOrigins = configService.getOrThrow<string>('corsOrigins');
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // enable graceful shutdown hooks
  app.enableShutdownHooks();

  // setup validation params
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (configService.get<boolean>('metricsEnabled') === true) {
    promClient.collectDefaultMetrics();
    const server = app.getHttpAdapter().getInstance() as Application;
    server.get('/metrics', async (_req: Request, res: Response) => {
      res.setHeader('Content-Type', promClient.register.contentType);
      res.send(await promClient.register.metrics());
    });
  }

  // setup swagger (disabled in production)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Manager API')
      .setDescription(
        'API documentation for authentication and user management.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'bearer',
      )
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // setup port with .env
  const port = configService.getOrThrow<number>('port');
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server listening on port ${port}`);
}
void bootstrap();

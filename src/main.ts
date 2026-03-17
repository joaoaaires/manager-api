import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // security headers
  app.use(helmet());

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
  console.log(`Server start on ${port} port.`);
}
void bootstrap();

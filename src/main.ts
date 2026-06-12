import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

import { WebsocketAdapter } from './modules/websocket/websocket.adapter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // close database connections on SIGTERM/SIGINT and app.close()
  app.enableShutdownHooks();

  // setup security headers and cors
  app.use(helmet());
  app.enableCors({
    origin: configService.getOrThrow<string>('corsOrigin'),
  });
  app.useWebSocketAdapter(
    new WebsocketAdapter(app, configService.getOrThrow<string>('corsOrigin')),
  );

  // setup validation params
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // setup swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Manager API')
    .setDescription('API documentation for authentication and user management.')
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

  // setup port with .env
  const port = configService.getOrThrow<number>('port');
  await app.listen(port);
  logger.log(`Server start on ${port} port.`);
}
void bootstrap();

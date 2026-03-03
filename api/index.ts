import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import serverless from 'serverless-http';

const server = express.default();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  await app.init();
}

void bootstrap();

export default serverless(server);

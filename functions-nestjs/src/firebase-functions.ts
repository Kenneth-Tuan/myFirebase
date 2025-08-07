import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { AppModule } from './app.module';

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  // Enable CORS for webhook calls
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'x-line-signature'],
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  await app.init();
}

bootstrap();

// Export Firebase Functions
export const api = onRequest(
  {
    region: 'asia-east1', // Change to your preferred region
  },
  server,
);

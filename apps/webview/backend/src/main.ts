import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { FRONTEND_URL, IN_DEVELOPMENT, IN_PRODUCTION, PORT } from './utils/env';
import { loadSwagger } from './dev-utils/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: IN_PRODUCTION ? ['log', 'error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  app.setGlobalPrefix('api');

  // Enable CORS for frontend integration
  app.enableCors({
    origin: FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // In development mode, start Swagger
  if (IN_DEVELOPMENT) {
    loadSwagger(app);
  }

  //Global pipes and filters
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await await app.listen(PORT);

  Logger.log(`Application listening on port ${PORT}`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { FRONTEND_URL, IN_PRODUCTION, PORT } from './utils/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: IN_PRODUCTION ? ['log', 'error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS for frontend integration
  app.enableCors({
    origin: FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Use WebSocket adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  app.setGlobalPrefix('api');

  await await app.listen(PORT);
  
  console.log(`🚀 WireGuard VNC Proxy Backend listening on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   Health: http://0.0.0.0:${PORT}/api/health`);
  console.log(`   Auth: http://0.0.0.0:${PORT}/api/auth`);
  console.log(`   VNC: http://0.0.0.0:${PORT}/api/vnc`);
  console.log(`   noVNC: http://0.0.0.0:${PORT}/novnc`);
}

bootstrap();
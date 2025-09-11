import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { VncModule } from './vnc/vnc.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';
import { configValidation } from './config/config.validation';
import { join } from 'path';
import { JWT_SECRET } from './utils/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidation,
      envFilePath: '.development.env',
    }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: JWT_SECRET,
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
      global: true,
    }),
    // Simple static file serving
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'novnc'),
      serveRoot: '/novnc',
      serveStaticOptions: {
        setHeaders: (res, path) => {
          res.setHeader('Cache-Control', 'no-cache');
        },
      },
    }),
    // Frontend static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'frontend'),
      serveRoot: '/',
      exclude: ['/api/{*path}', '/novnc/{*path}'],
      serveStaticOptions: {
        index: 'index.html',
        fallthrough: false,
      },
    }),
    AuthModule,
    VncModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
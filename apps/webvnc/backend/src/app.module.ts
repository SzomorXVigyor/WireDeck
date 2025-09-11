import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { NoVncModule } from './novnc/novnc.module';
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
    // API modules first
    AuthModule,
    VncModule,
    UsersModule,
    NoVncModule,
    // Frontend static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'frontend'),
      serveRoot: '/',
      exclude: ['/api/{*path}', '/novnc/{*path}'],
      serveStaticOptions: {
        index: true,
        fallthrough: true,
      },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}
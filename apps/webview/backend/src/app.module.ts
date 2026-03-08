import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigurationModule } from './config/config.module';
import { ViewsModule } from './views/views.module';
import { DevicesModule } from './devices/devices.module';
import { RegistersModule } from './registers/registers.module';
import { HealthController } from './health/health.controller';
import { configValidation } from './config/config.validation';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidation,
      envFilePath: '.development.env',
    }),
    // API modules first
    AuthModule,
    UsersModule,
    ConfigurationModule,
    ViewsModule,
    DevicesModule,
    RegistersModule,
    // Frontend static files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'frontend'),
      serveRoot: '/',
      exclude: ['/api/{*path}'],
      serveStaticOptions: {
        index: 'index.html',
        fallthrough: true,
      },
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}

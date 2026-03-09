import { HttpStatus, Module } from '@nestjs/common';
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
import { PrismaModule, providePrismaClientExceptionFilter } from 'nestjs-prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DATABASE_URL } from './utils/env';
import { SERVICE_NAME } from './utils/env';
import { join } from 'path';

const pgSchema = SERVICE_NAME || 'public';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: configValidation,
      envFilePath: '.development.env',
    }),
    // API modules first
    PrismaModule.forRootAsync({
      isGlobal: true,
      useFactory: () => {
        const pool = new Pool({ connectionString: DATABASE_URL });
        pool.on('connect', (client) => {
          client.query(`SET search_path TO "${pgSchema}"`).catch((err: unknown) => {
            console.error('Failed to set search_path:', err);
          });
        });
        return {
          prismaOptions: {
            adapter: new PrismaPg(pool),
          },
        };
      },
    }),
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
  providers: [
    providePrismaClientExceptionFilter({
      // Prisma Error Code: HTTP Status Response
      P2000: HttpStatus.BAD_REQUEST,
      P2002: HttpStatus.CONFLICT,
      P2025: HttpStatus.NOT_FOUND,
    }),
  ],
})
export class AppModule {}

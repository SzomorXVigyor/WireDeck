import { HttpStatus, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER } from '@nestjs/core';
import { PrismaFallbackExceptionFilter } from './utils/prisma-exception.filter';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigurationModule } from './config/config.module';
import { HealthController } from './health/health.controller';
import { configValidation } from './config/config.validation';
import { PrismaModule, providePrismaClientExceptionFilter } from 'nestjs-prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { DATABASE_URL, SERVICE_NAME } from './utils/env';
import { join } from 'path';
import { InstancesModule } from './instances/instances.module';
import { ModulesModule } from './modules/modules.module';

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
        return {
          prismaOptions: {
            adapter: new PrismaPg(pool, { schema: SERVICE_NAME }),
          },
        };
      },
    }),
    AuthModule,
    UsersModule,
    ConfigurationModule,
    ScheduleModule.forRoot(),
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
    InstancesModule,
    ModulesModule,
  ],
  controllers: [HealthController],
  providers: [
    providePrismaClientExceptionFilter({
      // Prisma Error Code: HTTP Status Response
      P2000: HttpStatus.BAD_REQUEST,
      P2002: HttpStatus.CONFLICT,
      P2003: HttpStatus.CONFLICT,
      P2025: HttpStatus.NOT_FOUND,
    }),
    { provide: APP_FILTER, useClass: PrismaFallbackExceptionFilter },
  ],
})
export class AppModule {}

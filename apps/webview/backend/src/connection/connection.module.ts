import { Module } from '@nestjs/common';
import { RegisterCacheService } from './register-cache.service';
import { ConnectionManagerService } from './connection-manager.service';
import { DataCollectorService } from './data-collector.service';

/**
 * ConnectionModule
 *
 * Provides the three core connection-layer services:
 *
 *  - RegisterCacheService      - in-memory register-value cache
 *  - ConnectionManagerService  - device connections, register tracking,
 *                                 write operations, custom writer overrides
 *  - DataCollectorService      - scheduled Modbus polling (writes to cache)
 *
 * Both RegisterCacheService and ConnectionManagerService are exported so
 * that DevicesModule, RegistersModule, and ViewsModule can inject them.
 *
 * ScheduleModule.forRoot() must be imported in the root AppModule for the
 * @Cron decorator inside DataCollectorService to be activated.
 */
@Module({
  providers: [RegisterCacheService, ConnectionManagerService, DataCollectorService],
  exports: [RegisterCacheService, ConnectionManagerService],
})
export class ConnectionModule {}

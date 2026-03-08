import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { RegistersService } from './registers.service';
import { RegistersController } from './registers.controller';

@Module({
  imports: [DevicesModule],
  providers: [RegistersService],
  controllers: [RegistersController],
  exports: [RegistersService],
})
export class RegistersModule {}

import { Module } from '@nestjs/common';
import { ContainerManagerService } from './container-manager.service';
import { ContainerManagerController } from './container-manager.controller';

@Module({
  controllers: [ContainerManagerController],
  providers: [ContainerManagerService],
  exports: [ContainerManagerService],
})
export class ContainerManagerModule {}

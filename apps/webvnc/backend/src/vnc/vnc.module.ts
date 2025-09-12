import { Module } from '@nestjs/common';
import { VncController } from './vnc.controller';
import { VncService } from './vnc.service';
import { VncGateway } from './vnc.gateway';

@Module({
  controllers: [VncController],
  providers: [VncService, VncGateway],
})
export class VncModule {}

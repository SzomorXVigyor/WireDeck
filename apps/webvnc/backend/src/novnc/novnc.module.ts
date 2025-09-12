import { Module } from '@nestjs/common';
import { NoVNCController } from './novnc.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NoVNCController],
})
export class NoVncModule {}

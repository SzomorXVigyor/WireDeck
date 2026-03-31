import { Module } from '@nestjs/common';
import { CertificateManagerService } from './certificate-manager.service';

@Module({
  providers: [CertificateManagerService],
  exports: [CertificateManagerService],
})
export class CertificateManagerModule {}
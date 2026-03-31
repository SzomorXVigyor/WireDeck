import { Module } from '@nestjs/common';
import { CertificateManagerService } from './certificate-manager.service';
import { CertbotQueueService } from './certbot-queue.service';

@Module({
  providers: [CertificateManagerService, CertbotQueueService],
  exports: [CertificateManagerService, CertbotQueueService],
})
export class CertificateManagerModule {}

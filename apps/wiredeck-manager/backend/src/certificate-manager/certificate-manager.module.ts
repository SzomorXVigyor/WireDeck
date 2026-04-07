import { Module } from '@nestjs/common';
import { CertificateManagerService } from './certificate-manager.service';
import { CertbotQueueService } from './certbot-queue.service';
import { CertbotCreator } from './certbot.creator';
import { ContainerManagerModule } from '../container-manager/container-manager.module';

@Module({
  imports: [ContainerManagerModule],
  providers: [CertificateManagerService, CertbotQueueService, CertbotCreator],
  exports: [CertificateManagerService],
})
export class CertificateManagerModule {}

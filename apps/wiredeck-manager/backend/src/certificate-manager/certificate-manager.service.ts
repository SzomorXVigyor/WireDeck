import { Injectable, Logger } from '@nestjs/common';
import { CertbotQueueService } from './certbot-queue.service';
import { CertbotMode } from './dto/create-container-certbot.dto';

@Injectable()
export class CertificateManagerService {
  private readonly logger = new Logger(CertificateManagerService.name);

  constructor(private readonly certbotQueue: CertbotQueueService) {}

  /**
   * Enqueue a certbot "obtain" job for the given domain.
   * Returns immediately — the actual container run is serialized through the queue.
   */
  obtainCertificate(domain: string): void {
    this.logger.log(`Enqueuing certificate obtain for ${domain}`);
    this.certbotQueue.enqueue({ domain, mode: CertbotMode.OBTAIN });
  }

  /**
   * Enqueue a certbot "renew" job for the given domain.
   * Returns immediately — the actual container run is serialized through the queue.
   */
  renewCertificate(domain: string): void {
    this.logger.log(`Enqueuing certificate renew for ${domain}`);
    this.certbotQueue.enqueue({ domain, mode: CertbotMode.RENEW });
  }
}

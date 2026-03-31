import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CertbotCreator } from '../container-manager/container-creators/certbot.creator';
import { ContainerManagerService } from '../container-manager/container-manager.service';
import { CreateContainerCertbotDto } from './dto/create-container-certbot.dto';

@Injectable()
export class CertbotQueueService implements OnModuleInit {
  private readonly logger = new Logger(CertbotQueueService.name);

  /** Serial queue — jobs run one at a time to avoid port 80 conflicts. */
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly certbotCreator: CertbotCreator,
    private readonly containerManager: ContainerManagerService
  ) {}

  onModuleInit() {
    this.logger.log('CertbotQueueService ready');
  }

  /**
   * Enqueues a certbot job. Returns immediately — the job runs when the queue
   * drains to it. Rejects if the container run itself throws.
   */
  enqueue(job: CreateContainerCertbotDto): void {
    this.queue = this.queue
      .then(() => this.runJob(job))
      .catch((err) => {
        this.logger.error(`Certbot job failed [${job.mode}] ${job.domain}`, err);
      });
  }

  private async runJob(job: CreateContainerCertbotDto): Promise<void> {
    this.logger.log(`[certbot] Starting ${job.mode} for ${job.domain}`);
    const spec = this.certbotCreator.create(job);
    await this.containerManager.runEphemeralContainer(spec);
    this.logger.log(`[certbot] Finished ${job.mode} for ${job.domain}`);
  }
}

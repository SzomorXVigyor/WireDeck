import { Module } from '@nestjs/common';
import { ContainerManagerService } from './container-manager.service';
import { ContainerManagerController } from './container-manager.controller';
import { ContainerFactoryService } from './container-factory.service';
import { WireguardCreator } from './container-creators/wireguard.creator';
import { WebvncCreator } from './container-creators/webvnc.creator';
import { WebviewCreator } from './container-creators/webview.creator';
import { CertbotCreator } from './container-creators/certbot.creator';
import { CertbotQueueService } from '../certificate-manager/certbot-queue.service';

@Module({
  controllers: [ContainerManagerController],
  providers: [
    ContainerManagerService,
    ContainerFactoryService,
    WireguardCreator,
    WebvncCreator,
    WebviewCreator,
    CertbotCreator,
    CertbotQueueService,
  ],
  exports: [ContainerManagerService, ContainerFactoryService],
})
export class ContainerManagerModule {}

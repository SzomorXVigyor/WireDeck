import { Module } from '@nestjs/common';
import { ContainerManagerService } from './container-manager.service';
import { ContainerManagerController } from './container-manager.controller';
import { ContainerFactoryService } from './container-factory.service';
import { WireguardCreator } from './container-creators/wireguard.creator';
import { WebvncCreator } from './container-creators/webvnc.creator';
import { WebviewCreator } from './container-creators/webview.creator';

@Module({
  controllers: [ContainerManagerController],
  providers: [ContainerManagerService, ContainerFactoryService, WireguardCreator, WebvncCreator, WebviewCreator],
  exports: [ContainerManagerService, ContainerFactoryService],
})
export class ContainerManagerModule {}

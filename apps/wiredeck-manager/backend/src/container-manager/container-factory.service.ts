import { Injectable } from '@nestjs/common';
import { ContainerManagerService } from './container-manager.service';
import { WireguardCreator } from './container-creators/wireguard.creator';
import { WebvncCreator } from './container-creators/webvnc.creator';
import { WebviewCreator } from './container-creators/webview.creator';
import { CreateContainerInstanceDto } from 'src/instances/dto/create-container-instance.dto';
import { CreateContainerWebvncDto } from 'src/modules/dto/create-container-webvnc.dto';
import { CreateContainerWebviewDto } from 'src/modules/dto/create-container-webview.dto';

@Injectable()
export class ContainerFactoryService {
  constructor(
    private readonly containerManager: ContainerManagerService,
    private readonly wireguardCreator: WireguardCreator,
    private readonly webvncCreator: WebvncCreator,
    private readonly webviewCreator: WebviewCreator
  ) {}

  /** Create and start a WireGuard instance container. Returns the Docker container id. */
  async createWireguard(dto: CreateContainerInstanceDto): Promise<string> {
    await this.containerManager.ensureVolume(`wg-${dto.name}`);
    const spec = this.wireguardCreator.create(dto);
    return this.containerManager.createContainer(spec);
  }

  /** Create and start a WebVNC module container. Returns the Docker container id. */
  async createWebvnc(dto: CreateContainerWebvncDto): Promise<string> {
    const spec = this.webvncCreator.create(dto);
    return this.containerManager.createContainer(spec);
  }

  /** Create and start a WebView module container. Returns the Docker container id. */
  async createWebview(dto: CreateContainerWebviewDto): Promise<string> {
    const spec = this.webviewCreator.create(dto);
    return this.containerManager.createContainer(spec);
  }
}

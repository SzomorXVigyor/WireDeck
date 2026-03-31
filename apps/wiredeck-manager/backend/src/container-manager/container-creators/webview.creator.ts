import { Injectable } from '@nestjs/common';
import { ContainerCreateOptions } from 'dockerode';
import { CreateContainerWebviewDto } from 'src/modules/dto/create-container-webview.dto';
import { sanitizeServiceName } from 'src/utils/common';

const WEBVIEW_IMAGE = 'ghcr.io/wiredeck/webview:latest';

@Injectable()
export class WebviewCreator {
  create(dto: CreateContainerWebviewDto): ContainerCreateOptions {
    const containerName = sanitizeServiceName(dto.subdomain);

    return {
      name: containerName,
      Image: WEBVIEW_IMAGE,
      Env: [
        `WG_CONFIG=${dto.wireguardConfig}`,
        `TARGET_IP=${dto.ipv4}`,
        `SUBDOMAIN=${dto.subdomain}`,
        `VERSION=${dto.version}`,
      ],
      HostConfig: {
        Binds: [`webview-${name}-data:/data`],
        RestartPolicy: { Name: 'unless-stopped' },
      },
      Labels: {
        'wiredeck.type': 'webview',
        'wiredeck.subdomain': dto.subdomain,
      },
    };
  }
}

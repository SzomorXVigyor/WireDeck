import { Injectable } from '@nestjs/common';
import { ContainerCreateOptions } from 'dockerode';
import { CreateContainerWebvncDto } from 'src/modules/dto/create-container-webvnc.dto';
import { sanitizeServiceName } from 'src/utils/common';

const WEBVNC_IMAGE = 'ghcr.io/novnc/novnc:latest';

@Injectable()
export class WebvncCreator {
  create(dto: CreateContainerWebvncDto): ContainerCreateOptions {
    const containerName = sanitizeServiceName(dto.subdomain);

    const vncTargets = dto.vncDevices.map((d) => `${d.ip}:${d.port}`).join(',');

    return {
      name: containerName,
      Image: WEBVNC_IMAGE,
      Env: [
        `WG_CONFIG=${dto.wireguardConfig}`,
        `VNC_TARGETS=${vncTargets}`,
        `SUBDOMAIN=${dto.subdomain}`,
        `VERSION=${dto.version}`,
      ],
      HostConfig: {
        Binds: [`webvnc-${name}-data:/data`],
        RestartPolicy: { Name: 'unless-stopped' },
      },
      Labels: {
        'wiredeck.type': 'webvnc',
        'wiredeck.subdomain': dto.subdomain,
      },
    };
  }
}

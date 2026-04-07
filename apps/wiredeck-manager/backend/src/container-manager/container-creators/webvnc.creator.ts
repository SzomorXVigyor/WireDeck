import { Injectable } from '@nestjs/common';
import { ContainerCreateOptions } from 'dockerode';
import { CreateContainerWebvncDto } from 'src/modules/dto/create-container-webvnc.dto';
import { sanitizeServiceName } from 'src/utils/common';
import { JWT_SECRET, ROOT_DOMAIN } from 'src/utils/env';

const WEBVNC_IMAGE = 'webvnc:latest';

@Injectable()
export class WebvncCreator {
  create(dto: CreateContainerWebvncDto): ContainerCreateOptions {
    const containerName = sanitizeServiceName(dto.subdomain);

    return {
      name: containerName,
      Image: WEBVNC_IMAGE,
      NetworkingConfig: {
        EndpointsConfig: {
          wgnet: {
            IPAMConfig: {
              IPv4Address: dto.ipv4,
            },
          },
        },
      },
      HostConfig: {
        Binds: ['/lib/modules:/lib/modules:ro'],
        CapAdd: ['NET_ADMIN', 'SYS_MODULE'],
        RestartPolicy: { Name: 'unless-stopped' },
        Sysctls: {
          'net.ipv6.conf.all.disable_ipv6': '1',
          'net.ipv6.conf.default.disable_ipv6': '1',
          'net.ipv6.conf.lo.disable_ipv6': '1',
        },
        Dns: ['1.1.1.1', '8.8.8.8'],
      },
      Env: [
        'WIREDECK_SLAVE=true',
        `PASS_CHANGE_URL=http://${ROOT_DOMAIN}/webvnc-passchangerequest.html`,
        `SERVICE_NAME=${containerName}`,
        `USERS=${JSON.stringify(dto.loginUsers)}`,
        `VNC_TARGETS=${JSON.stringify(dto.vncDevices)}`,
        `WIREGUARD_CONF_STR=${dto.wireguardConfig}`,
        `JWT_SECRET=${JWT_SECRET}`,
        `PORT=8080`,
        `FRONTEND_URL=${dto.subdomain}`,
      ],
      Labels: {
        'module.version': dto.version,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { ContainerCreateOptions } from 'dockerode';
import { CreateContainerWebviewDto } from 'src/modules/dto/create-container-webview.dto';
import { sanitizeServiceName } from 'src/utils/common';
import { JWT_SECRET, ROOT_DOMAIN } from 'src/utils/env';

const WEBVIEW_IMAGE = 'webview:latest';

@Injectable()
export class WebviewCreator {
  create(dto: CreateContainerWebviewDto): ContainerCreateOptions {
    const containerName = sanitizeServiceName(dto.subdomain);

    return {
      name: containerName,
      Image: WEBVIEW_IMAGE,
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
          `PASS_CHANGE_URL=http://${ROOT_DOMAIN}/webview-passchangerequest.html`,
          `SERVICE_NAME=${containerName}`,
          `USERS=${JSON.stringify(dto.loginUsers)}`,
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

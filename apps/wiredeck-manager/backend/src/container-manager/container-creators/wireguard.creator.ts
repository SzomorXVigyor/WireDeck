import { Injectable } from '@nestjs/common';
import { ContainerCreateOptions } from 'dockerode';
import { CreateContainerInstanceDto } from 'src/instances/dto/create-container-instance.dto';
import { ipv4ToIpv6Cidr } from 'src/utils/common';
import { ROOT_DOMAIN } from 'src/utils/env';

const WIREGUARD_IMAGE = 'lscr.io/linuxserver/wireguard:latest';

@Injectable()
export class WireguardCreator {
  create(dto: CreateContainerInstanceDto): ContainerCreateOptions {
    const containerName = `wg-${dto.name}`;
    const portWithSuffix = dto.publicPort.toString() + '/udp';

    return {
      name: containerName,
      Image: WIREGUARD_IMAGE,
      NetworkingConfig: {
        EndpointsConfig: {
          wgnet: {
            IPAMConfig: {
              IPv4Address: dto.ipv4,
            },
          },
        },
      },
      ExposedPorts: {
        [portWithSuffix]: {},
      },
      HostConfig: {
        PortBindings: {
          [portWithSuffix]: [{ HostPort: dto.publicPort.toString() }],
        },
        Binds: ['/lib/modules:/lib/modules:ro', `${containerName}:/etc/wireguard`],
        CapAdd: ['NET_ADMIN', 'SYS_MODULE'],
        RestartPolicy: { Name: 'unless-stopped' },
      },
      Env: [
        'INIT_ENABLED=true',
        `INIT_USERNAME=${dto.username}`,
        `INIT_PASSWORD=${dto.password}`,
        `INIT_HOST=${ROOT_DOMAIN}`,
        `INIT_PORT=${dto.publicPort.toString()}`,
        'INIT_DNS=1.1.1.1,8.8.8.8',
        `INIT_IPV4_CIDR=${dto.internal_ipv4Cidr}`,
        `INIT_IPV6_CIDR=${ipv4ToIpv6Cidr(dto.internal_ipv4Cidr)}`,
        `INIT_ALLOWED_IPS=${dto.internal_ipv4Cidr}`,
        'DISABLE_IPV6=true',
        'PORT=8080',
        'HOST=0.0.0.0',
        'INSECURE=false',
      ],
    };
  }
}

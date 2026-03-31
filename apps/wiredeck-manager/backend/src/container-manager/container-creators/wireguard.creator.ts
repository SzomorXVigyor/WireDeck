import { Injectable } from '@nestjs/common';
import { ContainerCreateOptions } from 'dockerode';
import { CreateContainerInstanceDto } from 'src/instances/dto/create-container-instance.dto';

const WIREGUARD_IMAGE = 'lscr.io/linuxserver/wireguard:latest';

@Injectable()
export class WireguardCreator {
  create(dto: CreateContainerInstanceDto): ContainerCreateOptions {
    const name = `wg-${dto.name}`;

    return {
      name,
      Image: WIREGUARD_IMAGE,
      Env: [
        `PUID=1000`,
        `PGID=1000`,
        `TZ=Etc/UTC`,
        `SERVERURL=${dto.subdomain}`,
        `SERVERPORT=${dto.publicPort}`,
        `PEERS=1`,
        `INTERNAL_SUBNET=${dto.internal_ipv4Cidr}`,
      ],
      HostConfig: {
        CapAdd: ['NET_ADMIN', 'SYS_MODULE'],
        Sysctls: {
          'net.ipv4.ip_forward': '1',
          'net.ipv4.conf.all.src_valid_mark': '1',
        },
        PortBindings: {
          [`${dto.publicPort}/udp`]: [{ HostPort: `${dto.publicPort}` }],
        },
        Binds: [`/etc/localtime:/etc/localtime:ro`, `wg-${dto.name}-config:/config`, `/lib/modules:/lib/modules:ro`],
        RestartPolicy: { Name: 'unless-stopped' },
      },
    };
  }
}

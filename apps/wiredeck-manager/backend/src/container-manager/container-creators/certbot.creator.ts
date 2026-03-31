import { Injectable } from '@nestjs/common';
import { CERTBOT_EMAIL } from 'src/utils/env';
import { ContainerCreateOptions } from 'dockerode';
import { sanitizeServiceName } from 'src/utils/common';
import { CreateContainerCertbotDto } from 'src/certificate-manager/dto/create-container-certbot.dto';

const CERTBOT_IMAGE = 'certbot/certbot:latest';

@Injectable()
export class CertbotCreator {
  create(dto: CreateContainerCertbotDto): ContainerCreateOptions {
    const name = sanitizeServiceName(`certbot-${dto.domain}-${dto.mode}`);

    const cmd =
      dto.mode === 'obtain'
        ? ['certonly', '--standalone', '--non-interactive', '--agree-tos', '--email', CERTBOT_EMAIL, '-d', dto.domain]
        : ['renew', '--non-interactive'];

    return {
      name,
      Image: CERTBOT_IMAGE,
      Cmd: cmd,
      HostConfig: {
        Binds: [`certbot-letsencrypt:/etc/letsencrypt`, `certbot-www:/var/www/certbot`],
        NetworkMode: 'host',
        AutoRemove: true,
      },
    };
  }
}

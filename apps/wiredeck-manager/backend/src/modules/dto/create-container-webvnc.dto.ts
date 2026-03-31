import { PickType } from '@nestjs/swagger';
import { ModuleVNCEntity } from '../entities/module-webvnc.entity';

export class CreateContainerWebvncDto extends PickType(ModuleVNCEntity, [
  'ipv4',
  'wireguardConfig',
  'subdomain',
  'version',
  'loginUsers',
  'vncDevices',
]) {}

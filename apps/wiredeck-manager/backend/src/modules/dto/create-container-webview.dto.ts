import { PickType } from '@nestjs/swagger';
import { ModuleWebViewEntity } from '../entities/module-webview.entity';

export class CreateContainerWebviewDto extends PickType(ModuleWebViewEntity, [
  'ipv4',
  'wireguardConfig',
  'subdomain',
  'version',
  'loginUsers',
]) {}

import { PickType } from '@nestjs/swagger';
import { ModuleWebViewEntity } from '../entities/module-webview.entity';

export class CreateWebViewModuleDto extends PickType(ModuleWebViewEntity, ['wireguardConfig', 'loginUsers']) {}

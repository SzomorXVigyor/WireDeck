import { PickType } from '@nestjs/swagger';
import { ModuleWebViewEntity } from '../entities/module-webview.entity';

export class CreateModuleWebviewDto extends PickType(ModuleWebViewEntity, ['wireguardConfig', 'loginUsers']) {}

import { PickType } from '@nestjs/swagger';
import { CreateWebViewModuleDto } from './create-webview-module.dto';

export class UpdateWebViewModuleDto extends PickType(CreateWebViewModuleDto, ['loginUsers']) {}

import { PickType } from '@nestjs/swagger';
import { CreateModuleWebviewDto } from './create-module-webview.dto';

export class UpdateModuleWebviewDto extends PickType(CreateModuleWebviewDto, ['loginUsers']) {}

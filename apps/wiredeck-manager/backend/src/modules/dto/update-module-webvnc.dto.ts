import { PickType } from '@nestjs/swagger';
import { CreateModuleWebvncDto } from './create-module-webvnc.dto';

export class UpdateModuleWebvncDto extends PickType(CreateModuleWebvncDto, ['loginUsers', 'vncDevices']) {}

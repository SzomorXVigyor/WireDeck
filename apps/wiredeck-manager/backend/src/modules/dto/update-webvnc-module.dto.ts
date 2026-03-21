import { PickType } from '@nestjs/swagger';
import { CreateWebVNCModuleDto } from './create-webvnc-module.dto';

export class UpdateWebVNCModuleDto extends PickType(CreateWebVNCModuleDto, ['loginUsers', 'vncDevices']) {}

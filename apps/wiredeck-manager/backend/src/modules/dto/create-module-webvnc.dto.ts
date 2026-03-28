import { PickType } from '@nestjs/swagger';
import { ModuleVNCEntity } from '../entities/module-webvnc.entity';

export class CreateModuleWebvncDto extends PickType(ModuleVNCEntity, ['wireguardConfig', 'loginUsers', 'vncDevices']) {}

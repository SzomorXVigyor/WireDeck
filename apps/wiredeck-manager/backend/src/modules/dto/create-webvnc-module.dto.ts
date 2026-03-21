import { PickType } from '@nestjs/swagger';
import { ModuleVNCEntity } from '../entities/module-webvnc.entity';

export class CreateWebVNCModuleDto extends PickType(ModuleVNCEntity, ['wireguardConfig', 'loginUsers', 'vncDevices']) {}

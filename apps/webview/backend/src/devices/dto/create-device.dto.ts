import { OmitType } from '@nestjs/swagger';
import { DeviceEntity } from '../entities/device.entity';

export class CreateDeviceDto extends OmitType(DeviceEntity, ['id'] as const) {}

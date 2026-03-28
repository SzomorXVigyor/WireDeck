import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { VNCServerEntity, ModuleVNCEntity } from '../entities/module-webvnc.entity';
import { ResponseModuleUserDto } from './response-module-user.dto';

/**
 * VNC device response DTO — omits password.
 */
export class ResponseVncDeviceDto extends OmitType(VNCServerEntity, ['password']) {}

/**
 * WebVNC module response DTO.
 * Omitted from base entity: wireguardConfig
 * loginUsers items: password and changeToken omitted (via ResponseModuleUserDto)
 * vncDevices items: password omitted (via ResponseVncDeviceDto)
 */
export class ResponseModuleWebvncDto extends OmitType(ModuleVNCEntity, [
  'wireguardConfig',
  'status',
  'loginUsers',
  'vncDevices',
]) {
  @ApiProperty({ type: [ResponseModuleUserDto] })
  @ValidateNested({ each: true })
  @Type(() => ResponseModuleUserDto)
  loginUsers: ResponseModuleUserDto[];

  @ApiProperty({ type: [ResponseVncDeviceDto] })
  @ValidateNested({ each: true })
  @Type(() => ResponseVncDeviceDto)
  vncDevices: ResponseVncDeviceDto[];
}

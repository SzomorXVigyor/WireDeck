import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { ModuleWebViewEntity } from '../entities/module-webview.entity';
import { ResponseModuleUserDto } from './response-module-user.dto';

/**
 * WebView module response DTO.
 * Omitted from base entity: wireguardConfig
 * loginUsers items: password and changeToken are omitted (via ResponseModuleUserDto)
 */
export class ResponseModuleWebviewDto extends OmitType(ModuleWebViewEntity, [
  'wireguardConfig',
  'status',
  'loginUsers',
]) {
  @ApiProperty({ type: [ResponseModuleUserDto] })
  @ValidateNested({ each: true })
  @Type(() => ResponseModuleUserDto)
  loginUsers: ResponseModuleUserDto[];
}

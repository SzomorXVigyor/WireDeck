import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { InstanceEntity } from '../entities/instance.entity';
import { ResponseModuleWebviewDto } from 'src/modules/dto/response-module-webview.dto';
import { ResponseModuleWebvncDto } from 'src/modules/dto/response-module-webvnc.dto';

export class ResponseInstanceModulesDto {
  @ApiProperty({ type: ResponseModuleWebvncDto, required: false, nullable: true })
  @ValidateNested()
  @Type(() => ResponseModuleWebvncDto)
  webVNC?: ResponseModuleWebvncDto | null;

  @ApiProperty({ type: ResponseModuleWebviewDto, required: false, nullable: true })
  @ValidateNested()
  @Type(() => ResponseModuleWebviewDto)
  webView?: ResponseModuleWebviewDto | null;
}

/**
 * Instance response DTO.
 * Omitted: username, password, modules (redefined with typed module response DTOs)
 */
export class ResponseInstanceDto extends OmitType(InstanceEntity, ['username', 'password', 'status', 'modules']) {
  @ApiProperty({ type: ResponseInstanceModulesDto })
  @ValidateNested()
  @Type(() => ResponseInstanceModulesDto)
  modules: ResponseInstanceModulesDto;
}

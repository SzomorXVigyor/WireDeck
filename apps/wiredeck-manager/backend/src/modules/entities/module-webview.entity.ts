import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { ModuleBaseEntity } from './module-base.entity';
import { ModuleUserEntity } from './module-user.entity';

export class ModuleWebViewEntity extends ModuleBaseEntity {
  @ApiProperty({ type: [ModuleUserEntity] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ModuleUserEntity)
  loginUsers: ModuleUserEntity[];
}

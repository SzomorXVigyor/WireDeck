import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIP, IsNotEmpty, IsOptional, IsPort, IsString, ValidateNested } from 'class-validator';
import { ModuleBaseEntity } from './module-base.entity';
import { ModuleUserEntity } from './module-user.entity';

export class VNCServerEntity {
  @ApiProperty({ example: 'server1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '10.0.0.10' })
  @IsIP()
  @IsNotEmpty()
  ip: string;

  @ApiProperty({ example: 5900 })
  @IsPort()
  @IsNotEmpty()
  port: number;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsOptional()
  password?: string;
}

export class ModuleVNCEntity extends ModuleBaseEntity {
  @ApiProperty({ type: [ModuleUserEntity] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ModuleUserEntity)
  loginUsers: ModuleUserEntity[];

  @ApiProperty({ type: [VNCServerEntity] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VNCServerEntity)
  vncDevices: VNCServerEntity[];
}

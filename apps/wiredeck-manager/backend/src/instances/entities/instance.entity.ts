import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIP, IsNotEmpty, IsOptional, IsPort, IsString, MinLength, ValidateNested } from 'class-validator';
import { ModuleVNCEntity } from 'src/modules/entities/module-webvnc.entity';
import { ModuleWebViewEntity } from 'src/modules/entities/module-webview.entity';
import { IsIPv4Cidr } from 'src/utils/is-ipv4-cidr.decorator';

export class InstanceModulesEntity {
  @ApiProperty({ type: ModuleVNCEntity })
  @ValidateNested({ each: true })
  @Type(() => ModuleVNCEntity)
  webVNC: ModuleVNCEntity;

  @ApiProperty({ type: ModuleWebViewEntity })
  @ValidateNested({ each: true })
  @Type(() => ModuleWebViewEntity)
  webView: ModuleWebViewEntity;
}

export class InstanceEntity {
  @ApiProperty({ example: '0' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: '0-name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '93.12.33.1' })
  @IsIP()
  @IsNotEmpty()
  ipv4: string;

  @ApiProperty({ example: 51820 })
  @IsPort()
  @IsNotEmpty()
  publicPort: number;

  @ApiProperty({ example: '10.0.0.1/24' })
  @IsIPv4Cidr()
  @IsOptional()
  internal_ipv4Cidr?: string;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  password: string;

  @ApiProperty({ example: 'running' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'wg0.wiredeck.local' })
  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @ApiProperty({ type: InstanceModulesEntity })
  @ValidateNested({ each: true })
  @Type(() => InstanceModulesEntity)
  modules: InstanceModulesEntity;
}

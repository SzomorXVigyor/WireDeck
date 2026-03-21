import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsIP, IsNotEmpty, IsString } from 'class-validator';

export class ModuleBaseEntity {
  @ApiProperty({ example: '10.0.0.1' })
  @IsIP()
  @IsNotEmpty()
  ipv4: string;

  @ApiProperty({ example: '[Interface]\\n...' })
  @IsString()
  @IsNotEmpty()
  wireguardConfig: string;

  @ApiProperty({ example: 'running' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ example: 'example.com' })
  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;

  @ApiProperty({ example: '2022-01-01T00:00:00.000Z' })
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}

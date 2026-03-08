import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsIP, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export enum DeviceProtocol {
  MODBUS_TCP = 'ModbusTCP',
}

export class DeviceEntity {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'PLC-1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '192.168.1.10' })
  @IsIP()
  ip: string;

  @ApiProperty({ example: 502 })
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ enum: DeviceProtocol, enumName: 'DeviceProtocol' })
  @IsEnum(DeviceProtocol)
  protocol: DeviceProtocol;
}

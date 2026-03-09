import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { BaseProtocolAttributesEntity } from './base-protocol-attributes.entity';

export enum RegisterType {
  COIL = 'coil',
  DISCRETE_INPUT = 'discrete-input',
  HOLDING_REGISTER = 'holding-register',
  INPUT_REGISTER = 'input-register',
}

export enum RegisterOperation {
  R = 'R',
  W = 'W',
  RW = 'RW',
}

/** Protocol attributes for Modbus TCP (Ethernet) devices. */
export class ModbusTcpProtocolAttributesEntity extends BaseProtocolAttributesEntity {
  @ApiProperty({ enum: RegisterType, enumName: 'RegisterType' })
  @IsEnum(RegisterType)
  registerType: RegisterType;

  @ApiProperty({ example: 100 })
  @IsInt()
  registerAddress: number;

  @ApiProperty({ enum: RegisterOperation, enumName: 'RegisterOperation' })
  @IsEnum(RegisterOperation)
  operation: RegisterOperation;

  @ApiProperty({ example: 1, description: 'Modbus TCP unit identifier (0-255)', default: 1 })
  @IsInt()
  @Min(0)
  @Max(255)
  slaveAddress: number;
}

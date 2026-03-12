import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseProtocolAttributesEntity } from './protocol-attributes/base-protocol-attributes.entity';

/**
 * Full register dictionary entry entity (all fields).
 * DTOs are derived from this class using NestJS mapped-types.
 */
export class RegisterDictEntryEntity {
  @ApiProperty({ example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'Main Switch Command' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1, description: 'ID of the device this register belongs to' })
  @IsInt()
  deviceId: number;

  @ApiProperty({
    type: BaseProtocolAttributesEntity,
    description: 'Protocol-specific attributes - validated against the device protocol at runtime',
  })
  @ValidateNested()
  @Type(() => BaseProtocolAttributesEntity)
  protocolAttributes: BaseProtocolAttributesEntity;
}

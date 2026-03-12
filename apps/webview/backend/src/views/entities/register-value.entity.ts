import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber } from 'class-validator';

export class RegisterValueEntity {
  @ApiProperty({ example: 1 })
  @IsInt()
  register: number;

  @ApiProperty({ example: 14.72 })
  @IsNumber()
  value: number;
}

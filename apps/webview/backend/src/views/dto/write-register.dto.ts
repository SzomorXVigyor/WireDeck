import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber } from 'class-validator';

export class WriteRegisterDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  register: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  value: number;
}

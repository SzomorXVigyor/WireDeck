import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';

export class QueryRegistersDto {
  @ApiProperty({
    description: 'List of register IDs to query values for',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  registers: number[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CardEntity } from './card.entity';

export class ViewLayoutEntity {
  @ApiProperty({ example: 'fill' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 5, description: 'Polling interval in seconds (0 = no polling)' })
  @IsNumber()
  updateInterval: number;
}

export class ViewEntity {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Power Control' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ type: ViewLayoutEntity })
  @ValidateNested()
  @Type(() => ViewLayoutEntity)
  layout: ViewLayoutEntity;

  @ApiProperty({ type: [CardEntity] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CardEntity)
  components: CardEntity[];
}

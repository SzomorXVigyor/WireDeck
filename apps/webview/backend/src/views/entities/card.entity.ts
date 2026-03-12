import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CardType } from '@prisma/client';

export { CardType };
export class CardStyleEntity {
  @ApiProperty({ example: 'primary', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 'md', required: false })
  @IsString()
  @IsOptional()
  size?: string;
}

export class CardEntity {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsOptional()
  id?: number;

  @ApiProperty({ example: 'Main Switch' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: CardType, enumName: 'CardType' })
  @IsEnum(CardType)
  type: CardType;

  @ApiProperty({ example: 1 })
  @IsInt()
  order: number;

  @ApiProperty({ example: 1, description: 'RegisterDictEntry id' })
  @IsInt()
  register: number;

  @ApiProperty({ type: CardStyleEntity, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardStyleEntity)
  style?: CardStyleEntity;

  @ApiProperty({ example: { label: 'Toggle Power', confirmAction: true }, required: false })
  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

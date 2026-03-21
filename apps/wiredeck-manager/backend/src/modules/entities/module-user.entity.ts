import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ModuleUserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export class ModuleUserEntity {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'admin' })
  @IsEnum(ModuleUserRole)
  @IsOptional()
  role?: ModuleUserRole;
}

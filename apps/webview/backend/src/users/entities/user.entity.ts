import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export class UserEntity {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', default: UserRole.USER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  changeToken?: string;
}

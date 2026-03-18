import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
}

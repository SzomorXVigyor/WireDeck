import { ApiProperty } from '@nestjs/swagger';

/** Response body for POST /api/auth/logout */
export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

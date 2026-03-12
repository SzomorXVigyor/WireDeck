import { ApiProperty } from '@nestjs/swagger';

/** Response body for POST /api/auth/changepassword */
export class ChangePasswordResponseDto {
  @ApiProperty({
    example: 'https://master.example.com/changepassword?instance=my-service&username=admin&changeToken=abc',
  })
  redirectUrl: string;
}

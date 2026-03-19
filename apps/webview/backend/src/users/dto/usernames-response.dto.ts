import { ApiProperty } from '@nestjs/swagger';

export class UsernameListDto {
  @ApiProperty()
  usernames: string[];
}

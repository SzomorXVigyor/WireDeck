import { UserResponseDto } from '../../users/dto/user-response.dto';

export class LoginResponseDto {
  access_token: string;
  user: UserResponseDto;
}

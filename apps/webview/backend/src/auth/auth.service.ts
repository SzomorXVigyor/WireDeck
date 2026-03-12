import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  /** Returns the public user (no password/changeToken) on success, or null on failure. */
  async validateUser(username: string, password: string): Promise<UserResponseDto | null> {
    const isValid = await this.usersService.validateUser(username, password);
    if (!isValid) {
      this.logger.log(`Failed login attempt for user "${username}"`);
      return null;
    }
    const { password: _, changeToken: __, ...user } = await this.usersService.findOne(username);
    return user;
  }

  async login(user: UserEntity): Promise<LoginResponseDto> {
    this.logger.log(`User "${user.username}" logged in (role: ${user.role})`);
    const payload = { username: user.username, role: user.role, sub: user.username };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}

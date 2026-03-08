import { Controller, Request, Post, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponseDto } from './dto/login-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { UsersService } from '../users/users.service';
import { WIREDECK_SLAVE, PASS_CHANGE_URL, SERVICE_NAME } from '../utils/env';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  /**
   * LocalAuthGuard → LocalStrategy → AuthService.validateUser.
   * On success req.user holds PublicUser (no password/changeToken).
   * @Body LoginDto is here for Swagger schema + ValidationPipe only.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('logout')
  async logout(): Promise<LogoutResponseDto> {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: UserResponseDto): Promise<{ user: UserResponseDto }> {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('changepassword')
  async changePassword(@Request() req): Promise<ChangePasswordResponseDto> {
    if (!WIREDECK_SLAVE || !PASS_CHANGE_URL || !SERVICE_NAME) {
      throw new UnauthorizedException('Password change is not enabled or not properly configured');
    }

    const user = await this.usersService.findOne(req.user.username);
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.changeToken) throw new UnauthorizedException('User does not have a change token');

    const changeUrl = new URL(PASS_CHANGE_URL);
    changeUrl.searchParams.set('instance', SERVICE_NAME);
    changeUrl.searchParams.set('username', user.username);
    changeUrl.searchParams.set('changeToken', user.changeToken);

    return { redirectUrl: changeUrl.toString() };
  }
}

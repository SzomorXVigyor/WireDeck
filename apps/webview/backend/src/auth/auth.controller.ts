import { Controller, Request, Post, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { ChangePasswordResponseDto } from './dto/change-password-response.dto';
import { UsersService } from '../users/users.service';
import { WIREDECK_SLAVE, PASS_CHANGE_URL, SERVICE_NAME } from '../utils/env';

@ApiTags('auth')
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
  @ApiOperation({ summary: 'Authenticate with username and password, returns a JWT bearer token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful - returns JWT and user profile', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout (stateless - clears client-side token)' })
  @ApiResponse({ status: 201, description: 'Logout acknowledged', type: LogoutResponseDto })
  async logout(): Promise<LogoutResponseDto> {
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile', type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - valid JWT required' })
  async getProfile(@CurrentUser() user: UserResponseDto): Promise<{ user: UserResponseDto }> {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('changepassword')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request a password-change redirect URL (WIREDECK_SLAVE mode only)' })
  @ApiResponse({ status: 201, description: 'Redirect URL generated', type: ChangePasswordResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized or password change not enabled / configured' })
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

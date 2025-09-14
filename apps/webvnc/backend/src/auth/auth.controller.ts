import { Controller, Request, Post, UseGuards, Get, Body, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { WIREDECK_SLAVE, PASS_CHANGE_URL, SERVICE_NAME } from '../utils/env';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    console.log(`🔐 User ${req.user.username} logged in`);
    return this.authService.login(req.user);
  }

  @Post('logout')
  async logout() {
    // In a stateless JWT setup, logout is handled on the frontend
    // by removing the token. You could implement token blacklisting here.
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return { user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('changepassword')
  async changePassword(@Request() req, @Res() res: Response) {
    if (!WIREDECK_SLAVE || !PASS_CHANGE_URL || !SERVICE_NAME) {
      throw new UnauthorizedException('Password change is not enabled or not properly configured');
    }

    const user = await this.usersService.findOne(req.user.username);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.changeToken) {
      throw new UnauthorizedException('User does not have change token');
    }

    const changeUrl = new URL(PASS_CHANGE_URL);
    changeUrl.searchParams.set('instance', SERVICE_NAME);
    changeUrl.searchParams.set('username', user.username);
    changeUrl.searchParams.set('changeToken', user.changeToken);

    return res.json({
      redirectUrl: changeUrl.toString(),
    });
  }
}

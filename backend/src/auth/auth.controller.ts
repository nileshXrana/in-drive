import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  async signup(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.signup(dto);
    const token = await this.authService.generateToken(user);
    response.cookie('access_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { user, token } = await this.authService.login(dto);
    response.cookie('access_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return { user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      path: '/',
    });
    return { success: true };
  }
}

import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';
import { AuthService } from './auth.service';
import { AuthError } from './error/auth.error';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    try {
      return await this.authService.signup(signupDto);
    } catch (error) {
      if (error instanceof AuthError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() authDto: AuthDto) {
    try {
      return await this.authService.login(authDto);
    } catch (error) {
      if (error instanceof AuthError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Body() authDto: AuthDto) {
    return this.authService.logout(authDto);
  }
}

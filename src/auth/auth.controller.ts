import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor() {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return 'signup';
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() authDto: AuthDto) {
    return 'login';
  }
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Body() authDto: AuthDto) {
    return 'logout';
  }
}

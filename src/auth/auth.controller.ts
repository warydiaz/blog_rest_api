import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthDto, SignupDto } from './dto';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { JwtGuard, JwtRefreshGuard } from './guard';
import { GetUser } from './decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
  ) {}

  @Post('signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto);
  }

  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@GetUser() user: User) {
    return this.tokenService.signTokens(user.id, user.email, user.role);
  }

  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@GetUser() user: User) {
    return this.authService.logout(user);
  }
}

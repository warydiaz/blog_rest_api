import { Injectable } from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';

@Injectable()
export class AuthService {
  constructor() {}

  public signup(signupDto: SignupDto) {
    return 'signup';
  }

  
  public login(authDto: AuthDto) {
    return 'login';
  }

  public logout(authDto: AuthDto) {
    return 'logout';
  }
}

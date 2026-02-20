import { Injectable } from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  signup(signupDto: SignupDto) {
    const { email } = signupDto;

    //const user = await
  }

  public login(authDto: AuthDto) {
    return 'login';
  }

  public logout(authDto: AuthDto) {
    return 'logout';
  }
}

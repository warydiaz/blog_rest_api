import { Injectable } from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { AuthError } from './error/auth.error';
import { Role, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(
    signupDto: SignupDto,
  ): Promise<Omit<User, 'hash' | 'refreshToken'>> {
    const isTaken = await this.isEmailOrUsernameTaken(signupDto);

    if (isTaken) {
      throw AuthError.AlreadyTaken();
    }

    const {
      email,
      username,
      password,
      firstName,
      lastName,
      bio,
      avatarUrl,
      role,
    } = signupDto;

    const hash = await argon.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        hash,
        firstName,
        lastName,
        bio,
        avatarUrl,
        role,
      },
      omit: {
        hash: true,
        refreshToken: true,
      },
    });

    return user;
  }

  private async isEmailOrUsernameTaken(dto: SignupDto): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    return !!user;
  }

  public async login(authDto: AuthDto): Promise<{ access_token: string }> {
    const { email, password } = authDto;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw AuthError.InvalidCredentials();
    }

    const passwordMatches = await argon.verify(user.hash, password);

    if (!passwordMatches) {
      throw AuthError.InvalidCredentials();
    }
    return await this.sgnToken(user.id, user.email, user.role);
  }

  private async sgnToken(userId: number, email: string, role: Role) {
    const payload = {
      sub: userId,
      email,
      role,
    };

    const secret = this.configService.get('JWT_SECRET');

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return { access_token: token };
  }

  public logout(authDto: AuthDto) {
    return 'logout';
  }
}

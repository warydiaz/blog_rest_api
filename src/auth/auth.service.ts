import { Injectable } from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import * as argon from 'argon2';
import { AuthError } from './error/auth.error';
import { User } from '@prisma/client';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
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

  private async findUserByEmailOrThrow(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw AuthError.InvalidCredentials();
    }

    return user;
  }

  public async login(authDto: AuthDto) {
    const { email, password } = authDto;

    const user = await this.findUserByEmailOrThrow(email);

    const passwordMatches = await argon.verify(user.hash, password);

    if (!passwordMatches) {
      throw AuthError.InvalidCredentials();
    }

    return this.tokenService.signTokens(user.id, user.email, user.role);
  }

  public logout(user: User) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
  }
}

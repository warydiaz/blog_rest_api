import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon from 'argon2';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async signTokens(
    userId: number,
    email: string,
    role: Role,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const payload = { sub: userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: this.configService.getOrThrow('JWT_SECRET'),
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      }),
    ]);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: await argon.hash(refresh_token) },
    });

    return { access_token, refresh_token };
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as argon from 'argon2';
import type { IUserRepository } from '../user/repository/user.repository.interface';
import { USER_REPOSITORY } from '../user/repository/user.repository.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
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

    await this.userRepository.updateRefreshToken(
      userId,
      await argon.hash(refresh_token),
    );

    return { access_token, refresh_token };
  }
}

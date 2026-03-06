import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthError } from '../error/auth.error';
import * as argon from 'argon2';
import { IncomingMessage } from 'http';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    req: IncomingMessage,
    payload: { sub: number; email: string },
  ) {
    const rawRefreshToken = (req.headers['authorization'] ?? '').replace(
      'Bearer ',
      '',
    );

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      omit: {
        hash: true,
      },
    });

    if (!user?.refreshToken) {
      throw AuthError.InvalidCredentials();
    }

    const isValidRefreshToken = await argon.verify(
      user.refreshToken,
      rawRefreshToken,
    );

    if (!isValidRefreshToken) {
      throw AuthError.InvalidCredentials();
    }

    return user;
  }
}

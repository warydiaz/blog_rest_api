import { Inject, Injectable } from '@nestjs/common';
import { AuthDto, SignupDto } from './dto';
import * as argon from 'argon2';
import { AuthError } from './error/auth.error';
import { User } from '@prisma/client';
import { TokenService } from './token.service';
import type { IUserRepository } from '../user/repository/user.repository.interface';
import { USER_REPOSITORY } from '../user/repository/user.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
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

    return this.userRepository.create({
      email,
      username,
      hash,
      firstName,
      lastName,
      bio,
      avatarUrl,
      role,
    });
  }

  private async isEmailOrUsernameTaken(dto: SignupDto): Promise<boolean> {
    const user = await this.userRepository.findByEmailOrUsername(
      dto.email,
      dto.username,
    );
    return !!user;
  }

  private async findUserByEmailOrThrow(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);

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

  public async logout(user: User): Promise<void> {
    await this.userRepository.updateRefreshToken(user.id, null);
  }
}

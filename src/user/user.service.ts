import { Inject, Injectable } from '@nestjs/common';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { User } from '@prisma/client';
import type { IUserRepository } from './repository/user.repository.interface';
import { USER_REPOSITORY } from './repository/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
  ) {}

  async editUser(
    userId: number,
    dto: EditUserDto,
  ): Promise<Omit<User, 'hash' | 'refreshToken'>> {
    const emailTaken = await this.isEmailTaken(dto);

    if (emailTaken) {
      throw UserError.EmailAlreadyTaken();
    }

    return this.userRepository.update(userId, dto);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.userRepository.delete(userId);
  }

  private async isEmailTaken(dto: EditUserDto): Promise<boolean> {
    if (!dto.email) return false;

    const user = await this.userRepository.findByEmail(dto.email);

    return !!user;
  }
}

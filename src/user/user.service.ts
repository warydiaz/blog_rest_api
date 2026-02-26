import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async editUser(
    userId: number,
    dto: EditUserDto,
  ): Promise<Omit<User, 'hash' | 'refreshToken'>> {
    const isEmailAvailable = await this.isEmailTaken(dto);

    if (isEmailAvailable) {
      throw UserError.EmailAlreadyTaken();
    }
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...dto,
      },
      omit: {
        hash: true,
        refreshToken: true,
      },
    });
  }

  private async isEmailTaken(dto: EditUserDto): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    return !!user;
  }

  async deleteUser(userId: number): Promise<void> {
    const deletedUser = await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });

    if (!deletedUser) {
      throw UserError.UserNotFound();
    }
  }
}

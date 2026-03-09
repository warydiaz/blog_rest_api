import { Injectable } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from '../../user/repository/user.repository.interface';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
  }

  create(data: CreateUserData): Promise<Omit<User, 'hash' | 'refreshToken'>> {
    return this.prisma.user.create({
      data: { ...data, role: data.role ?? Role.READER },
      omit: { hash: true, refreshToken: true },
    });
  }

  update(
    id: number,
    data: UpdateUserData,
  ): Promise<Omit<User, 'hash' | 'refreshToken'>> {
    return this.prisma.user.update({
      where: { id },
      data,
      omit: { hash: true, refreshToken: true },
    });
  }

  async updateRefreshToken(id: number, token: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}

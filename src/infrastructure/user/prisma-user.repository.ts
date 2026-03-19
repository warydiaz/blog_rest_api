import { Injectable } from '@nestjs/common';
import { User, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  IUserRepository,
  CreateUserData,
  UpdateUserData,
} from '../../user/repository/user.repository.interface';
import { PublicProfileDto } from 'src/user/dto/public-profile.dto';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
  }

  create(data: CreateUserData): Promise<Omit<User, 'hash' | 'refreshToken'>> {
    return this.prisma.user.create({
      data: {
        ...data,
        firstName: data.firstName!,
        lastName: data.lastName!,
        role: data.role ?? Role.READER,
      },
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

  async findPublicProfileByUsername(
    username: string,
  ): Promise<PublicProfileDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    if (!user) return null;
    return {
      ...user,
      bio: user.bio ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
    };
  }

  async followUser(
    currentUserId: number,
    userIdToFollow: number,
  ): Promise<void> {
    await this.prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: userIdToFollow,
      },
    });
  }

  async unfollowUser(
    currentUserId: number,
    userIdToUnfollow: number,
  ): Promise<void> {
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userIdToUnfollow,
        },
      },
    });
  }

  async getFollowers(userId: number): Promise<PublicProfileDto[]> {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return followers.map((f) => ({
      ...f.follower,
      bio: f.follower.bio ?? undefined,
      avatarUrl: f.follower.avatarUrl ?? undefined,
    }));
  }

  async getFollowing(userId: number): Promise<PublicProfileDto[]> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return following.map((f) => ({
      ...f.following,
      bio: f.following.bio ?? undefined,
      avatarUrl: f.following.avatarUrl ?? undefined,
    }));
  }
}

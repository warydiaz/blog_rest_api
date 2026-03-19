import { User, Role } from '@prisma/client';
import { PublicProfileDto } from '../dto/public-profile.dto';

export const USER_REPOSITORY = 'IUserRepository';

export interface CreateUserData {
  email: string;
  username: string;
  hash: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  role?: Role;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;
  create(data: CreateUserData): Promise<Omit<User, 'hash' | 'refreshToken'>>;
  update(
    id: number,
    data: UpdateUserData,
  ): Promise<Omit<User, 'hash' | 'refreshToken'>>;
  updateRefreshToken(id: number, token: string | null): Promise<void>;
  delete(id: number): Promise<void>;
  findPublicProfileByUsername(
    username: string,
  ): Promise<PublicProfileDto | null>;
  followUser(currentUserId: number, userIdToFollow: number): Promise<void>;
  unfollowUser(currentUserId: number, userIdToUnfollow: number): Promise<void>;
  getFollowers(userId: number): Promise<PublicProfileDto[]>;
  getFollowing(userId: number): Promise<PublicProfileDto[]>;
}

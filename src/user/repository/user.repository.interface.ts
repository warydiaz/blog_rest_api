import { User, Role } from '@prisma/client';

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
}

import { Inject, Injectable } from '@nestjs/common';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { User } from '@prisma/client';
import type { IUserRepository } from './repository/user.repository.interface';
import { USER_REPOSITORY } from './repository/user.repository.interface';
import type { IStorageService } from '../uploads/storage.service.interface';
import { STORAGE_SERVICE } from '../uploads/storage.service.interface';
import { PublicProfileDto } from './dto/public-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    @Inject(STORAGE_SERVICE) private storageService: IStorageService,
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

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    const avatarUrl = await this.storageService.upload(file);

    const user = await this.userRepository.update(userId, { avatarUrl });

    return { avatarUrl: user.avatarUrl! };
  }

  async getPublicProfile(username: string): Promise<PublicProfileDto> {
    const user =
      await this.userRepository.findPublicProfileByUsername(username);
    if (!user) throw UserError.UserNotFound();
    return user;
  }

  private async isEmailTaken(dto: EditUserDto): Promise<boolean> {
    if (!dto.email) return false;

    const user = await this.userRepository.findByEmail(dto.email);

    return !!user;
  }

  async followUser(currentUserId: number, username: string): Promise<void> {
    const userToFollow =
      await this.userRepository.findPublicProfileByUsername(username);

    if (!userToFollow) throw UserError.UserNotFound();
    if (currentUserId === userToFollow.id)
      throw UserError.CannotFollowYourself();
    await this.userRepository.followUser(currentUserId, userToFollow.id);
  }

  async unfollowUser(currentUserId: number, username: string): Promise<void> {
    const userToUnfollow =
      await this.userRepository.findPublicProfileByUsername(username);
    if (!userToUnfollow) throw UserError.UserNotFound();
    await this.userRepository.unfollowUser(currentUserId, userToUnfollow.id);
  }

  async getFollowers(username: string): Promise<PublicProfileDto[]> {
    const user =
      await this.userRepository.findPublicProfileByUsername(username);
    if (!user) throw UserError.UserNotFound();
    return await this.userRepository.getFollowers(user.id);
  }

  async getFollowing(username: string): Promise<PublicProfileDto[]> {
    const user =
      await this.userRepository.findPublicProfileByUsername(username);
    if (!user) throw UserError.UserNotFound();
    return await this.userRepository.getFollowing(user.id);
  }
}

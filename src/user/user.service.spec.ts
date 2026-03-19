import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { USER_REPOSITORY } from './repository/user.repository.interface';
import { STORAGE_SERVICE } from '../uploads/storage.service.interface';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { Role } from '@prisma/client';
import { PublicProfileDto } from './dto/public-profile.dto';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findPublicProfileByUsername: jest.fn(),
    followUser: jest.fn(),
    unfollowUser: jest.fn(),
    getFollowers: jest.fn(),
    getFollowing: jest.fn(),
  };

  const mockStorageService = {
    upload: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: STORAGE_SERVICE, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── editUser ─────────────────────────────────────────────────────────────

  describe('editUser', () => {
    const userId = 1;

    const dto: EditUserDto = {
      email: 'new@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const updatedUser = {
      id: userId,
      email: dto.email!,
      username: 'johndoe',
      firstName: dto.firstName!,
      lastName: dto.lastName!,
      bio: undefined,
      avatarUrl: undefined,
      role: Role.READER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update and return the user when email is not taken', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.editUser(userId, dto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw UserError.EmailAlreadyTaken when the email is already in use', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(updatedUser);

      await expect(service.editUser(userId, dto)).rejects.toThrow(
        UserError.EmailAlreadyTaken().message,
      );

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  // ─── updateAvatar ─────────────────────────────────────────────────────────

  describe('updateAvatar', () => {
    const userId = 1;
    const avatarUrl = 'http://localhost:3000/uploads/avatar.png';
    const file = { originalname: 'avatar.png', buffer: Buffer.from('') } as Express.Multer.File;

    it('should upload the file and return the avatarUrl', async () => {
      mockStorageService.upload.mockResolvedValue(avatarUrl);
      mockUserRepository.update.mockResolvedValue({ avatarUrl });

      const result = await service.updateAvatar(userId, file);

      expect(mockStorageService.upload).toHaveBeenCalledWith(file);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { avatarUrl });
      expect(result).toEqual({ avatarUrl });
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    const userId = 1;

    it('should call userRepository.delete with the correct userId', async () => {
      mockUserRepository.delete.mockResolvedValue(undefined);

      await service.deleteUser(userId);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.delete).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error when user is deleted', async () => {
      mockUserRepository.delete.mockResolvedValue(undefined);

      await expect(service.deleteUser(userId)).resolves.toBeUndefined();
    });
  });

  // ─── followUser ───────────────────────────────────────────────────────────

  describe('followUser', () => {
    const currentUserId = 1;
    const username = 'janedoe';
    const userToFollow: PublicProfileDto = {
      id: 2,
      username,
      firstName: 'Jane',
      lastName: 'Doe',
      bio: undefined,
      avatarUrl: undefined,
    };

    it('should follow user when target exists and is not self', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(userToFollow);
      mockUserRepository.followUser.mockResolvedValue(undefined);

      await service.followUser(currentUserId, username);

      expect(mockUserRepository.findPublicProfileByUsername).toHaveBeenCalledWith(username);
      expect(mockUserRepository.followUser).toHaveBeenCalledWith(currentUserId, userToFollow.id);
    });

    it('should throw UserError.UserNotFound when target does not exist', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(null);

      await expect(service.followUser(currentUserId, username)).rejects.toThrow(
        UserError.UserNotFound().message,
      );

      expect(mockUserRepository.followUser).not.toHaveBeenCalled();
    });

    it('should throw UserError.CannotFollowYourself when following self', async () => {
      const selfProfile: PublicProfileDto = { ...userToFollow, id: currentUserId };
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(selfProfile);

      await expect(service.followUser(currentUserId, username)).rejects.toThrow(
        UserError.CannotFollowYourself().message,
      );

      expect(mockUserRepository.followUser).not.toHaveBeenCalled();
    });
  });

  // ─── unfollowUser ─────────────────────────────────────────────────────────

  describe('unfollowUser', () => {
    const currentUserId = 1;
    const username = 'janedoe';
    const userToUnfollow: PublicProfileDto = {
      id: 2,
      username,
      firstName: 'Jane',
      lastName: 'Doe',
      bio: undefined,
      avatarUrl: undefined,
    };

    it('should unfollow user when target exists', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(userToUnfollow);
      mockUserRepository.unfollowUser.mockResolvedValue(undefined);

      await service.unfollowUser(currentUserId, username);

      expect(mockUserRepository.findPublicProfileByUsername).toHaveBeenCalledWith(username);
      expect(mockUserRepository.unfollowUser).toHaveBeenCalledWith(currentUserId, userToUnfollow.id);
    });

    it('should throw UserError.UserNotFound when target does not exist', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(null);

      await expect(service.unfollowUser(currentUserId, username)).rejects.toThrow(
        UserError.UserNotFound().message,
      );

      expect(mockUserRepository.unfollowUser).not.toHaveBeenCalled();
    });
  });

  // ─── getFollowers ─────────────────────────────────────────────────────────

  describe('getFollowers', () => {
    const username = 'johndoe';
    const user: PublicProfileDto = {
      id: 1,
      username,
      firstName: 'John',
      lastName: 'Doe',
      bio: undefined,
      avatarUrl: undefined,
    };
    const followers: PublicProfileDto[] = [
      { id: 2, username: 'alice', firstName: 'Alice', lastName: 'Smith', bio: undefined, avatarUrl: undefined },
      { id: 3, username: 'bob', firstName: 'Bob', lastName: 'Jones', bio: undefined, avatarUrl: undefined },
    ];

    it('should return followers when user exists', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(user);
      mockUserRepository.getFollowers.mockResolvedValue(followers);

      const result = await service.getFollowers(username);

      expect(mockUserRepository.findPublicProfileByUsername).toHaveBeenCalledWith(username);
      expect(mockUserRepository.getFollowers).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(followers);
    });

    it('should throw UserError.UserNotFound when user does not exist', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(null);

      await expect(service.getFollowers(username)).rejects.toThrow(
        UserError.UserNotFound().message,
      );

      expect(mockUserRepository.getFollowers).not.toHaveBeenCalled();
    });
  });

  // ─── getFollowing ─────────────────────────────────────────────────────────

  describe('getFollowing', () => {
    const username = 'johndoe';
    const user: PublicProfileDto = {
      id: 1,
      username,
      firstName: 'John',
      lastName: 'Doe',
      bio: undefined,
      avatarUrl: undefined,
    };
    const following: PublicProfileDto[] = [
      { id: 4, username: 'carol', firstName: 'Carol', lastName: 'White', bio: undefined, avatarUrl: undefined },
    ];

    it('should return following when user exists', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(user);
      mockUserRepository.getFollowing.mockResolvedValue(following);

      const result = await service.getFollowing(username);

      expect(mockUserRepository.findPublicProfileByUsername).toHaveBeenCalledWith(username);
      expect(mockUserRepository.getFollowing).toHaveBeenCalledWith(user.id);
      expect(result).toEqual(following);
    });

    it('should throw UserError.UserNotFound when user does not exist', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(null);

      await expect(service.getFollowing(username)).rejects.toThrow(
        UserError.UserNotFound().message,
      );

      expect(mockUserRepository.getFollowing).not.toHaveBeenCalled();
    });
  });

  // ─── getPublicProfile ─────────────────────────────────────────────────────

  describe('getPublicProfile', () => {
    const username = 'johndoe';
    const profile: PublicProfileDto = {
      id: 1,
      username,
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Hello world',
      avatarUrl: 'http://localhost:3000/uploads/avatar.png',
    };

    it('should return the profile when user exists', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(profile);

      const result = await service.getPublicProfile(username);

      expect(mockUserRepository.findPublicProfileByUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual(profile);
    });

    it('should throw UserError.UserNotFound when username does not exist', async () => {
      mockUserRepository.findPublicProfileByUsername.mockResolvedValue(null);

      await expect(service.getPublicProfile(username)).rejects.toThrow(
        UserError.UserNotFound().message,
      );
    });
  });
});

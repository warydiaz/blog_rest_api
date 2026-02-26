import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { Role } from '@prisma/client';
import type { User } from 'generated/prisma/client';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const mockUserService: jest.Mocked<Partial<UserService>> = {
    editUser: jest.fn(),
    deleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── getMe ────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    const user = {
      id: 1,
      email: 'john@example.com',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      bio: null,
      avatarUrl: null,
      role: Role.READER,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User;

    it('should return the user from the decorator', () => {
      const result = controller.getMe(user);

      expect(result).toBe(user);
    });
  });

  // ─── editUser ─────────────────────────────────────────────────────────────

  describe('editUser', () => {
    const userId = 1;

    const dto: EditUserDto = {
      email: 'updated@example.com',
      firstName: 'Jane',
    };

    const updatedUser = {
      id: userId,
      email: dto.email!,
      username: 'johndoe',
      firstName: dto.firstName!,
      lastName: 'Doe',
      bio: null,
      avatarUrl: null,
      role: Role.READER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should call userService.editUser with dto and userId', async () => {
      userService.editUser.mockResolvedValue(updatedUser);

      await controller.editUser(dto, userId);

      expect(userService.editUser).toHaveBeenCalledWith(userId, dto);
      expect(userService.editUser).toHaveBeenCalledTimes(1);
    });

    it('should return the updated user returned by the service', async () => {
      userService.editUser.mockResolvedValue(updatedUser);

      const result = await controller.editUser(dto, userId);

      expect(result).toEqual(updatedUser);
    });

    it('should propagate UserError.EmailAlreadyTaken when email is taken', async () => {
      userService.editUser.mockRejectedValue(UserError.EmailAlreadyTaken());

      await expect(controller.editUser(dto, userId)).rejects.toThrow(
        UserError.EmailAlreadyTaken().message,
      );
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    const userId = 1;

    it('should call userService.deleteUser with the userId', async () => {
      userService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser(userId);

      expect(userService.deleteUser).toHaveBeenCalledWith(userId);
      expect(userService.deleteUser).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error when user is deleted', async () => {
      userService.deleteUser.mockResolvedValue(undefined);

      await expect(controller.deleteUser(userId)).resolves.toBeUndefined();
    });

    it('should propagate UserError.UserNotFound when user does not exist', async () => {
      userService.deleteUser.mockRejectedValue(UserError.UserNotFound());

      await expect(controller.deleteUser(userId)).rejects.toThrow(
        UserError.UserNotFound().message,
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { Role } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      bio: null,
      avatarUrl: null,
      role: Role.READER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update and return the user when email is not taken', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.editUser(userId, dto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { ...dto },
        omit: { hash: true, refreshToken: true },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw UserError.EmailAlreadyTaken when the email is already in use', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(updatedUser);

      await expect(service.editUser(userId, dto)).rejects.toThrow(
        UserError.EmailAlreadyTaken().message,
      );

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  // ─── deleteUser ───────────────────────────────────────────────────────────

  describe('deleteUser', () => {
    const userId = 1;

    const deletedUser = {
      id: userId,
      email: 'john@example.com',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      bio: null,
      avatarUrl: null,
      role: Role.READER,
      hash: 'hashed_password',
      refreshToken: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should call prisma.user.delete with the correct userId', async () => {
      mockPrismaService.user.delete.mockResolvedValue(deletedUser);

      await service.deleteUser(userId);

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockPrismaService.user.delete).toHaveBeenCalledTimes(1);
    });

    it('should resolve without error when user is deleted', async () => {
      mockPrismaService.user.delete.mockResolvedValue(deletedUser);

      await expect(service.deleteUser(userId)).resolves.toBeUndefined();
    });
  });
});

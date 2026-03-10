import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { USER_REPOSITORY } from './repository/user.repository.interface';
import { STORAGE_SERVICE } from '../uploads/storage.service.interface';
import { EditUserDto } from './dto';
import { UserError } from './error/user.error';
import { Role } from '@prisma/client';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
      bio: null,
      avatarUrl: null,
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
});

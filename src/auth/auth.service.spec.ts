import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { USER_REPOSITORY } from '../user/repository/user.repository.interface';
import { TokenService } from './token.service';
import { AuthDto } from './dto';
import { AuthError } from './error/auth.error';
import { Role, User } from '@prisma/client';
import * as argon from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let tokenService: jest.Mocked<TokenService>;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findByEmailOrUsername: jest.fn(),
    create: jest.fn(),
    updateRefreshToken: jest.fn(),
  };

  const mockTokenService = {
    signTokens: jest.fn(),
  };

  const mockUser: User = {
    id: 1,
    email: 'john@example.com',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    bio: null,
    avatarUrl: null,
    role: Role.READER,
    hash: 'hashedpassword',
    refreshToken: 'hashedrefreshtoken',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const authDto: AuthDto = {
      email: 'john@example.com',
      password: 'secret123',
    };

    const tokenResponse = {
      access_token: 'access.token.here',
      refresh_token: 'refresh.token.here',
    };

    it('should return tokens when credentials are valid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (argon.verify as jest.Mock).mockResolvedValue(true);
      tokenService.signTokens.mockResolvedValue(tokenResponse);

      const result = await service.login(authDto);

      expect(result).toEqual(tokenResponse);
      expect(tokenService.signTokens).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
      );
    });

    it('should throw InvalidCredentials when user is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(authDto)).rejects.toThrow(
        AuthError.InvalidCredentials().message,
      );
    });

    it('should throw InvalidCredentials when password does not match', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(authDto)).rejects.toThrow(
        AuthError.InvalidCredentials().message,
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear refreshToken in DB', async () => {
      mockUserRepository.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(mockUser);

      expect(mockUserRepository.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
    });

    it('should resolve without returning a value', async () => {
      mockUserRepository.updateRefreshToken.mockResolvedValue(undefined);

      await expect(service.logout(mockUser)).resolves.toBeUndefined();
    });
  });
});

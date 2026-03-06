import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
import { AuthDto, SignupDto } from './dto';
import { AuthError } from './error/auth.error';
import { Role, User } from '@prisma/client';
import * as argon from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
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
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
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
      prisma.user.findUnique.mockResolvedValue(mockUser);
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
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(authDto)).rejects.toThrow(
        AuthError.InvalidCredentials().message,
      );
    });

    it('should throw InvalidCredentials when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(authDto)).rejects.toThrow(
        AuthError.InvalidCredentials().message,
      );
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear refreshToken in DB', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, refreshToken: null });

      await service.logout(mockUser);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { refreshToken: null },
      });
    });

    it('should return the updated user', async () => {
      const updatedUser = { ...mockUser, refreshToken: null };
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.logout(mockUser);

      expect(result).toEqual(updatedUser);
    });
  });
});

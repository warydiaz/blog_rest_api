import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon from 'argon2';

jest.mock('argon2');

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockJwtService = { signAsync: jest.fn() };

  const mockConfigService = {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
    }),
  };

  const mockPrismaService = {
    user: { update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── signTokens ───────────────────────────────────────────────────────────

  describe('signTokens', () => {
    const userId = 1;
    const email = 'john@example.com';
    const role = Role.READER;
    const accessToken = 'access.token.here';
    const refreshToken = 'refresh.token.here';
    const hashedRefreshToken = 'hashed.refresh.token';

    beforeEach(() => {
      mockJwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);
      (argon.hash as jest.Mock).mockResolvedValue(hashedRefreshToken);
      mockPrismaService.user.update.mockResolvedValue({});
    });

    it('should sign access token with JWT_SECRET and 15m expiry', async () => {
      await service.signTokens(userId, email, role);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId, email, role },
        { expiresIn: '15m', secret: 'test-secret' },
      );
    });

    it('should sign refresh token with JWT_REFRESH_SECRET and 7d expiry', async () => {
      await service.signTokens(userId, email, role);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: userId, email, role },
        { expiresIn: '7d', secret: 'test-refresh-secret' },
      );
    });

    it('should save hashed refresh token to DB', async () => {
      await service.signTokens(userId, email, role);

      expect(argon.hash).toHaveBeenCalledWith(refreshToken);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: hashedRefreshToken },
      });
    });

    it('should return access_token and refresh_token', async () => {
      const result = await service.signTokens(userId, email, role);

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    });
  });
});

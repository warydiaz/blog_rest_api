import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { USER_REPOSITORY } from '../user/repository/user.repository.interface';
import { Role } from '@prisma/client';
import * as argon from 'argon2';

jest.mock('argon2');

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;

  const mockJwtService = { signAsync: jest.fn() };

  const mockConfigService = {
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
    }),
  };

  const mockUserRepository = {
    updateRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
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
      mockUserRepository.updateRefreshToken.mockResolvedValue(undefined);
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
      expect(mockUserRepository.updateRefreshToken).toHaveBeenCalledWith(
        userId,
        hashedRefreshToken,
      );
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

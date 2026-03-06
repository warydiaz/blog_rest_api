import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { AuthDto, SignupDto } from './dto';
import { AuthError } from './error/auth.error';
import { Role, User } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockAuthService: jest.Mocked<Partial<AuthService>> = {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  const mockTokenService: jest.Mocked<Partial<TokenService>> = {
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
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    tokenService = module.get(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─── signup ───────────────────────────────────────────────────────────────

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'john@example.com',
      username: 'johndoe',
      password: 'secret123',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.READER,
    };

    const createdUser = {
      id: 1,
      email: signupDto.email,
      username: signupDto.username,
      firstName: signupDto.firstName,
      lastName: signupDto.lastName,
      bio: null,
      avatarUrl: null,
      role: Role.READER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should call authService.signup with the provided dto', async () => {
      authService.signup.mockResolvedValue(createdUser);

      await controller.signup(signupDto);

      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(authService.signup).toHaveBeenCalledTimes(1);
    });

    it('should return the user returned by the service', async () => {
      authService.signup.mockResolvedValue(createdUser);

      const result = await controller.signup(signupDto);

      expect(result).toEqual(createdUser);
    });

    it('should propagate AuthError.AlreadyTaken when email/username is taken', async () => {
      authService.signup.mockRejectedValue(AuthError.AlreadyTaken());

      await expect(controller.signup(signupDto)).rejects.toThrow(
        AuthError.AlreadyTaken().message,
      );
    });
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

    it('should call authService.login with the provided dto', async () => {
      authService.login.mockResolvedValue(tokenResponse);

      await controller.login(authDto);

      expect(authService.login).toHaveBeenCalledWith(authDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should return both tokens returned by the service', async () => {
      authService.login.mockResolvedValue(tokenResponse);

      const result = await controller.login(authDto);

      expect(result).toEqual(tokenResponse);
    });

    it('should propagate AuthError.InvalidCredentials when credentials are wrong', async () => {
      authService.login.mockRejectedValue(AuthError.InvalidCredentials());

      await expect(controller.login(authDto)).rejects.toThrow(
        AuthError.InvalidCredentials().message,
      );
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const tokenResponse = {
      access_token: 'new.access.token.here',
      refresh_token: 'new.refresh.token.here',
    };

    it('should call tokenService.signTokens with user data', async () => {
      tokenService.signTokens.mockResolvedValue(tokenResponse);

      await controller.refresh(mockUser);

      expect(tokenService.signTokens).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
      );
      expect(tokenService.signTokens).toHaveBeenCalledTimes(1);
    });

    it('should return both new tokens', async () => {
      tokenService.signTokens.mockResolvedValue(tokenResponse);

      const result = await controller.refresh(mockUser);

      expect(result).toEqual(tokenResponse);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should call authService.logout with the authenticated user', async () => {
      authService.logout.mockResolvedValue(mockUser);

      await controller.logout(mockUser);

      expect(authService.logout).toHaveBeenCalledWith(mockUser);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should return the value returned by the service', async () => {
      authService.logout.mockResolvedValue(mockUser);

      const result = await controller.logout(mockUser);

      expect(result).toEqual(mockUser);
    });
  });
});

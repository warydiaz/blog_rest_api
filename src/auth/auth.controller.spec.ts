import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto, SignupDto } from './dto';
import { AuthError } from './error/auth.error';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService: jest.Mocked<Partial<AuthService>> = {
    signup: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
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

    const tokenResponse = { access_token: 'jwt.token.here' };

    it('should call authService.login with the provided dto', async () => {
      authService.login.mockResolvedValue(tokenResponse);

      await controller.login(authDto);

      expect(authService.login).toHaveBeenCalledWith(authDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should return the access token returned by the service', async () => {
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

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    const authDto: AuthDto = {
      email: 'john@example.com',
      password: 'secret123',
    };

    it('should call authService.logout with the provided dto', () => {
      authService.logout.mockReturnValue('logout');

      controller.logout(authDto);

      expect(authService.logout).toHaveBeenCalledWith(authDto);
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should return the value returned by the service', () => {
      authService.logout.mockReturnValue('logout');

      const result = controller.logout(authDto);

      expect(result).toBe('logout');
    });
  });
});

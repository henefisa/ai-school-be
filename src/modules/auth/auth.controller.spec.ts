import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserRole } from 'src/typeorm/entities/user.entity';
import { RequestWithUser } from 'src/shared/interfaces/request-with-user.interface';

describe('AuthController', () => {
  let authController: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);

    // Reset the mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      const expectedResult: Partial<User> = {
        id: 'test-id',
        ...registerDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      // Act
      const result = await authController.register(registerDto);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('login', () => {
    it('should login a user and return access token and user object', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedUser: Partial<User> = {
        id: 'test-id',
        email: loginDto.email,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult = {
        accessToken: 'jwt_token',
        user: expectedUser,
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      // Act
      const result = await authController.login(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const userId = 'test-id';
      // Create a partial mock that satisfies the type checker
      const requestMock = {
        user: {
          id: userId,
        },
      } as unknown as RequestWithUser;

      const expectedUser: Partial<User> = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthService.getProfile.mockResolvedValue(expectedUser);

      // Act
      const result = await authController.getProfile(requestMock);

      // Assert
      expect(mockAuthService.getProfile).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedUser);
    });
  });
});

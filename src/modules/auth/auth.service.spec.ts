import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../../typeorm/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let authService: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);

    // Reset the mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      const createdUser = {
        id: 'test-id',
        ...registerDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...expectedUser } = createdUser;

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      // Act
      const result = await authService.register(registerDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(registerDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toEqual(expectedUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      const existingUser = {
        id: 'existing-id',
        ...registerDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user and return access token and user object', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'test-id',
        email: loginDto.email,
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      const token = 'jwt_token';

      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await authService.login(loginDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(user.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });

      // Check specific properties instead of deep equality
      expect(result.accessToken).toEqual(token);
      expect(result.user).toHaveProperty('id', userWithoutPassword.id);
      expect(result.user).toHaveProperty('email', userWithoutPassword.email);
      expect(result.user).toHaveProperty(
        'firstName',
        userWithoutPassword.firstName,
      );
      expect(result.user).toHaveProperty(
        'lastName',
        userWithoutPassword.lastName,
      );
      expect(result.user).toHaveProperty('role', userWithoutPassword.role);
      expect(result.user).toHaveProperty(
        'isActive',
        userWithoutPassword.isActive,
      );
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong_password',
      };

      const user = {
        id: 'test-id',
        email: loginDto.email,
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        validatePassword: jest.fn().mockResolvedValue(false),
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(user.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      const user = {
        id: 'inactive-id',
        email: loginDto.email,
        password: 'hashed_password',
        firstName: 'Inactive',
        lastName: 'User',
        role: UserRole.STUDENT,
        isActive: false, // User is inactive
        createdAt: new Date(),
        updatedAt: new Date(),
        validatePassword: jest.fn().mockResolvedValue(true),
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      // Act & Assert
      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(user.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      // Arrange
      const userId = 'test-id';
      const user = {
        id: userId,
        email: 'test@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await authService.getProfile(userId);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });

      // Check specific properties instead of deep equality
      expect(result).toHaveProperty('id', userWithoutPassword.id);
      expect(result).toHaveProperty('email', userWithoutPassword.email);
      expect(result).toHaveProperty('firstName', userWithoutPassword.firstName);
      expect(result).toHaveProperty('lastName', userWithoutPassword.lastName);
      expect(result).toHaveProperty('role', userWithoutPassword.role);
      expect(result).toHaveProperty('isActive', userWithoutPassword.isActive);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const userId = 'nonexistent-id';
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile(userId)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});

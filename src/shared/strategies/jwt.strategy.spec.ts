import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../typeorm/entities/user.entity';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }
      return null;
    }),
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }
      throw new Error(`Config key ${key} not found`);
    }),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);

    // Reset the mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object when token is valid', async () => {
      // Arrange
      const payload = {
        sub: 'test-id',
        email: 'test@example.com',
      };

      const user = {
        id: payload.sub,
        email: payload.email,
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      };

      mockUserRepository.findOne.mockResolvedValue(user);

      // Act
      const result = await jwtStrategy.validate(payload);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      // Arrange
      const payload = {
        sub: 'nonexistent-id',
        email: 'nonexistent@example.com',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const payload = {
        sub: 'inactive-id',
        email: 'inactive@example.com',
      };

      const inactiveUser = {
        id: payload.sub,
        email: payload.email,
        firstName: 'Inactive',
        lastName: 'User',
        isActive: false, // User is inactive
      };

      mockUserRepository.findOne.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(jwtStrategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });
    });
  });
});

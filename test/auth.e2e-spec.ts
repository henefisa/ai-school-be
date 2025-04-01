import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/typeorm/entities/user.entity';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: any;
  let jwtToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    userRepository = moduleFixture.get(getRepositoryToken(User));

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await userRepository.delete({ email: 'e2e-test@example.com' });
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'e2e-test@example.com',
        password: 'password123',
        firstName: 'E2E',
        lastName: 'Test',
        role: UserRole.STUDENT,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(registerDto.email);
      expect(response.body.firstName).toBe(registerDto.firstName);
      expect(response.body.lastName).toBe(registerDto.lastName);
      expect(response.body.role).toBe(registerDto.role);
      expect(response.body).toHaveProperty('isActive', true);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).not.toHaveProperty('password');

      testUserId = response.body.id;
    });

    it('should return 409 Conflict when email already exists', async () => {
      const registerDto = {
        email: 'e2e-test@example.com', // Same email as previous test
        password: 'password123',
        firstName: 'Duplicate',
        lastName: 'User',
        role: UserRole.STUDENT,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body).toHaveProperty('message', 'Email already exists');
    });

    it('should return 400 Bad Request with validation errors', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: '123', // Too short
        // Missing firstName and lastName
        role: 'invalid-role',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user and return access token', async () => {
      const loginDto = {
        email: 'e2e-test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user).not.toHaveProperty('password');

      jwtToken = response.body.accessToken;
    });

    it('should return 401 Unauthorized with invalid credentials', async () => {
      const invalidLoginDto = {
        email: 'e2e-test@example.com',
        password: 'wrong-password',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidLoginDto)
        .expect(401);
    });

    it('should return 401 Unauthorized with non-existent user', async () => {
      const nonExistentUserDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(nonExistentUserDto)
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('email', 'e2e-test@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 Unauthorized with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 Unauthorized with missing token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });
  });
});

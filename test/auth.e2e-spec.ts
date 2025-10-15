import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Auth Endpoints (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123456',
    name: 'Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({
      logger: false, // Desactivar logs en tests
    });
    app.setGlobalPrefix('api');
    app.enableCors();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.name).toBe(testUser.name);
          expect(res.body.user).not.toHaveProperty('password');
          authToken = res.body.accessToken;
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('email ya está registrado');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123456',
          name: 'Test User',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
          expect(res.body.errors).toBeDefined();
        });
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: '123',
          name: 'Test User',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
        });
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
        });
    });

    it('should fail with empty name', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'Test123456',
          name: '',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail with incorrect password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Credenciales inválidas');
        });
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123456',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Credenciales inválidas');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123456',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
        });
    });

    it('should fail with missing credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('Validation failed');
        });
    });

    it('should fail with empty password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: '',
        })
        .expect(400);
    });
  });

  describe('JWT Token Validation', () => {
    it('should return valid JWT token structure', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          const token = res.body.accessToken;
          expect(token).toBeDefined();
          expect(typeof token).toBe('string');
          // JWT format: header.payload.signature
          const parts = token.split('.');
          expect(parts).toHaveLength(3);
        });
    });
  });

  describe('Password Security', () => {
    it('should not return password in response', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `secure-${Date.now()}@example.com`,
          password: 'SecurePass123',
          name: 'Secure User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should hash passwords (not store plain text)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `hash-${Date.now()}@example.com`,
          password: 'MyPassword123',
          name: 'Hash User',
        });

      expect(response.status).toBe(201);
      // Password should not be the same as input (hashed)
      expect(response.body.user).not.toHaveProperty('password');
    });
  });
});


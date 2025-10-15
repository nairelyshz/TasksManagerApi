import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Users Endpoints (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  const testUser = {
    email: `user-test-${Date.now()}@example.com`,
    password: 'UserTest123',
    name: 'User Test',
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

    // Register and login to get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/users/profile (GET)', () => {
    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should fail with malformed token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', 'Bearer')
        .expect(401);
    });

    it('should fail without Bearer prefix', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', authToken)
        .expect(401);
    });
  });

  describe('/api/users/me (GET)', () => {
    it('should get current user info with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', userId);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without authentication token', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .expect(401);
    });

    it('should fail with expired token', () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should return consistent data between /profile and /me', async () => {
      const profileResponse = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const meResponse = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileResponse.body.id).toBe(meResponse.body.id);
      expect(profileResponse.body.email).toBe(meResponse.body.email);
      expect(profileResponse.body.name).toBe(meResponse.body.name);
    });
  });

  describe('Authentication Security', () => {
    it('should not allow access to other users data', async () => {
      // Create another user
      const otherUser = {
        email: `other-${Date.now()}@example.com`,
        password: 'OtherPass123',
        name: 'Other User',
      };

      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(otherUser);

      const otherToken = otherUserResponse.body.accessToken;
      const otherUserId = otherUserResponse.body.user.id;

      // Each user should only see their own data
      const response = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(response.body.id).toBe(otherUserId);
      expect(response.body.id).not.toBe(userId);
      expect(response.body.email).toBe(otherUser.email);
      expect(response.body.email).not.toBe(testUser.email);
    });
  });

  describe('Token Validation', () => {
    it('should reject request with tampered token', () => {
      // Modify the token slightly
      const tamperedToken = authToken.slice(0, -5) + 'XXXXX';

      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });

    it('should handle missing Authorization header gracefully', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('statusCode', 401);
        });
    });
  });

  describe('User Data Integrity', () => {
    it('should always exclude password from responses', () => {
      return request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('password');
          expect(Object.keys(res.body)).not.toContain('password');
        });
    });

    it('should return valid date formats', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.createdAt).toBeDefined();
          expect(res.body.updatedAt).toBeDefined();
          // Validate ISO 8601 format
          expect(new Date(res.body.createdAt).toISOString()).toBe(
            res.body.createdAt,
          );
          expect(new Date(res.body.updatedAt).toISOString()).toBe(
            res.body.updatedAt,
          );
        });
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return access token for valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'secret' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
          expect(typeof res.body.access_token).toBe('string');
        });
    });

    it('should return access token for regular user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'user', password: 'secret' })
        .expect(201)
        .expect((res) => {
          expect(res.body.access_token).toBeDefined();
        });
    });

    it('should return 401 for wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'wrong' })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'nobody', password: 'secret' })
        .expect(401);
    });

    it('should return 400 for missing username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'secret' })
        .expect(400);
    });

    it('should return 400 for missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin' })
        .expect(400);
    });

    it('should return 400 for empty fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: '', password: '' })
        .expect(400);
    });
  });
});

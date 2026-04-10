import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { MockRabbitmqModule } from './mocks/rabbitmq.mock';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;

  const adminId = 'a65d4b98-80c6-4b59-b59f-c15a983e831a';
  const userId = '60784d36-51ef-43ee-81b1-34b3a9e89590';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(RabbitmqModule)
      .useModule(MockRabbitmqModule)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
  });

  beforeEach(async () => {
    await userRepo.query('TRUNCATE tb_user CASCADE');
    const hashedPassword = await bcrypt.hash('secret', 10);
    await userRepo.save(
      userRepo.create({
        pk_user: adminId,
        tx_username: 'admin',
        tx_password: hashedPassword,
      }),
    );
    await userRepo.save(
      userRepo.create({
        pk_user: userId,
        tx_username: 'user',
        tx_password: hashedPassword,
      }),
    );
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

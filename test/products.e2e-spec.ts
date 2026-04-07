import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/products/entities/product.entity';
import { Repository } from 'typeorm';

describe('Products (e2e)', () => {
  let app: INestApplication;
  let productRepo: Repository<Product>;
  let authToken: string;

  const adminId = 'a65d4b98-80c6-4b59-b59f-c15a983e831a';
  const fakeUuid = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ subscriber: adminId, username: 'admin' });
  });

  beforeEach(async () => {
    await productRepo.query(
      'TRUNCATE tb_order_item, tb_order, tb_product CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /products', () => {
    it('should create a product when authenticated', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'iPhone 14',
          description: 'iPhone 14 Pro, 128GB',
          image_url: 'https://example.com/iphone14.jpg',
          price: 99900,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.name).toBe('iPhone 14');
          expect(res.body.price).toBe(99900);
          expect(res.body.id).toBeDefined();
          expect(res.body.created_at).toBeDefined();
          expect(res.body.updated_at).toBeDefined();
        });
    });

    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .post('/products')
        .send({ name: 'Test', price: 100 })
        .expect(401);
    });

    it('should return 400 for invalid payload', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 'not-a-number' })
        .expect(400);
    });

    it('should return 400 for empty name', () => {
      return request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '', price: 100 })
        .expect(400);
    });
  });

  describe('GET /products', () => {
    it('should return all products', async () => {
      await productRepo.save(
        productRepo.create({
          tx_name: 'Product A',
          nr_price: 100,
        }),
      );
      await productRepo.save(
        productRepo.create({
          tx_name: 'Product B',
          nr_price: 200,
        }),
      );

      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].name).toBe('Product A');
          expect(res.body[1].name).toBe('Product B');
        });
    });

    it('should return empty array when no products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect([]);
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by id', async () => {
      const product = await productRepo.save(
        productRepo.create({
          tx_name: 'Test Product',
          nr_price: 500,
        }),
      );

      return request(app.getHttpServer())
        .get(`/products/${product.pk_product}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(product.pk_product);
          expect(res.body.name).toBe('Test Product');
          expect(res.body.price).toBe(500);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get(`/products/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update a product', async () => {
      const product = await productRepo.save(
        productRepo.create({
          tx_name: 'Original',
          nr_price: 100,
        }),
      );

      return request(app.getHttpServer())
        .patch(`/products/${product.pk_product}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated');
          expect(res.body.price).toBe(100);
        });
    });

    it('should return 404 when updating non-existent product', () => {
      return request(app.getHttpServer())
        .patch(`/products/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Nope' })
        .expect(404);
    });
  });

  describe('DELETE /products/:id', () => {
    it('should soft delete a product', async () => {
      const product = await productRepo.save(
        productRepo.create({
          tx_name: 'To Delete',
          nr_price: 50,
        }),
      );

      await request(app.getHttpServer())
        .delete(`/products/${product.pk_product}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deleted = await productRepo.findOne({
        where: { pk_product: product.pk_product },
      });
      expect(deleted).not.toBeNull();
      expect(deleted!.ts_deleted_at).not.toBeNull();
    });

    it('should not return soft-deleted products in list', async () => {
      const product = await productRepo.save(
        productRepo.create({
          tx_name: 'Will be deleted',
          nr_price: 50,
        }),
      );

      product.ts_deleted_at = new Date();
      await productRepo.save(product);

      return request(app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect([]);
    });

    it('should return 404 when getting a soft-deleted product', async () => {
      const product = await productRepo.save(
        productRepo.create({
          tx_name: 'Will be deleted',
          nr_price: 50,
        }),
      );

      product.ts_deleted_at = new Date();
      await productRepo.save(product);

      return request(app.getHttpServer())
        .get(`/products/${product.pk_product}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent product', () => {
      return request(app.getHttpServer())
        .delete(`/products/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

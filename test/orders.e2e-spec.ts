import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../src/products/entities/product.entity';
import { Order, OrderStatus } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import { Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { MockRabbitmqModule } from './mocks/rabbitmq.mock';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let productRepo: Repository<Product>;
  let orderRepo: Repository<Order>;
  let orderItemRepo: Repository<OrderItem>;
  let authToken: string;

  const adminId = 'a65d4b98-80c6-4b59-b59f-c15a983e831a';
  const fakeUuid = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideModule(RabbitmqModule)
      .useModule(MockRabbitmqModule)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    orderRepo = moduleFixture.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepo = moduleFixture.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ subscriber: adminId, username: 'admin' });
  });

  beforeEach(async () => {
    await orderItemRepo.query(
      'TRUNCATE tb_order_item, tb_order, tb_product CASCADE',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  async function createProducts(count: number) {
    const products: Product[] = [];
    for (let i = 0; i < count; i++) {
      products.push(
        await productRepo.save(
          productRepo.create({
            tx_name: `Product ${i + 1}`,
            nr_price: (i + 1) * 100,
          }),
        ),
      );
    }
    return products;
  }

  describe('POST /orders', () => {
    it('should create an order with calculated total', async () => {
      const [pA, pB] = await createProducts(2);

      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { product_id: pA.pk_product, quantity: 2 },
            { product_id: pB.pk_product, quantity: 1 },
          ],
          payment_token: 'payment-token',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.total).toBe(400);
          expect(res.body.status).toBe('PENDING');
          expect(res.body.client_id).toBe(adminId);
          expect(res.body.items).toHaveLength(2);
          expect(res.body.id).toBeDefined();
        });
    });

    it('should reject unauthenticated requests', async () => {
      const [pA] = await createProducts(1);

      return request(app.getHttpServer())
        .post('/orders')
        .send({
          items: [{ product_id: pA.pk_product, quantity: 1 }],
        })
        .expect(401);
    });

    it('should return 404 for non-existent product IDs', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: fakeUuid, quantity: 1 }],
          payment_token: 'payment-token',
        })
        .expect(404);
    });

    it('should create an order with empty items (zero total)', () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [], payment_token: 'payment-token' })
        .expect(201)
        .expect((res) => {
          expect(res.body.total).toBe(0);
          expect(res.body.items).toHaveLength(0);
        });
    });
  });

  describe('GET /orders', () => {
    it('should return all orders for the authenticated user', async () => {
      await orderRepo.save(
        orderRepo.create({
          fk_client: adminId,
          nr_total: 100,
          tx_status: OrderStatus.PENDING,
        }),
      );
      await orderRepo.save(
        orderRepo.create({
          fk_client: adminId,
          nr_total: 200,
          tx_status: OrderStatus.COMPLETED,
        }),
      );

      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].total).toBe(200);
          expect(res.body[1].total).toBe(100);
        });
    });

    it('should return empty array when no orders', () => {
      return request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect([]);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return an order with items', async () => {
      const [pA] = await createProducts(1);

      const order = await orderRepo.save(
        orderRepo.create({
          fk_client: adminId,
          nr_total: 300,
          tx_status: OrderStatus.PENDING,
        }),
      );

      await orderItemRepo.save(
        orderItemRepo.create({
          order,
          product: pA,
          nr_quantity: 2,
          nr_price: 100,
        }),
      );

      return request(app.getHttpServer())
        .get(`/orders/${order.pk_order}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(order.pk_order);
          expect(res.body.total).toBe(300);
          expect(res.body.status).toBe('PENDING');
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].quantity).toBe(2);
          expect(res.body.items[0].price).toBe(100);
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get(`/orders/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for order belonging to another user', async () => {
      const order = await orderRepo.save(
        orderRepo.create({
          fk_client: 'other-user-id',
          nr_total: 100,
          tx_status: OrderStatus.PENDING,
        }),
      );

      return request(app.getHttpServer())
        .get(`/orders/${order.pk_order}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /orders/:id', () => {
    it('should update order status', async () => {
      const order = await orderRepo.save(
        orderRepo.create({
          fk_client: adminId,
          nr_total: 100,
          tx_status: OrderStatus.PENDING,
        }),
      );

      return request(app.getHttpServer())
        .patch(`/orders/${order.pk_order}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('COMPLETED');
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .patch(`/orders/${fakeUuid}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'COMPLETED' })
        .expect(404);
    });

    it('should accept any non-empty status string', async () => {
      const order = await orderRepo.save(
        orderRepo.create({
          fk_client: adminId,
          nr_total: 100,
          tx_status: OrderStatus.PENDING,
        }),
      );

      return request(app.getHttpServer())
        .patch(`/orders/${order.pk_order}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'CUSTOM' })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('CUSTOM');
        });
    });
  });
});

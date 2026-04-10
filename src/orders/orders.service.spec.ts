import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';

const mockOrderRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};
const mockOrderItemRepo = {
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};
const mockProductRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
};
const mockProductsService = { validateIds: jest.fn() };

const mockAmqpConnection = {
  publish: jest.fn(),
};

function makeService(): OrdersService {
  return new OrdersService(
    mockOrderRepo as any,
    mockOrderItemRepo as any,
    mockProductRepo as any,
    mockProductsService as any,
    mockAmqpConnection as any,
  );
}

describe('OrdersService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create order with auto-calculated total from product prices', async () => {
      const dto = {
        client_id: 'client-1',
        payment_token: 'payment-token',
        items: [
          { product_id: 'p1', quantity: 2 },
          { product_id: 'p2', quantity: 1 },
        ],
      };

      const products = [
        { pk_product: 'p1', nr_price: 100 },
        { pk_product: 'p2', nr_price: 250 },
      ];
      mockProductsService.validateIds.mockResolvedValue(undefined);
      mockProductRepo.find.mockResolvedValue(products);

      const savedOrder = { pk_order: 'order-1' };
      mockOrderRepo.create.mockReturnValue({ pk_order: 'order-1' });
      mockOrderRepo.save.mockImplementation(async (o) => ({
        ...o,
        pk_order: 'order-1',
      }));
      mockOrderItemRepo.create.mockImplementation((data) => data);
      mockOrderItemRepo.save.mockResolvedValue(undefined);
      mockOrderRepo.findOne.mockResolvedValue({
        pk_order: 'order-1',
        fk_client: 'client-1',
        nr_total: 450,
        tx_status: 'PENDING',
        order_items: [
          { product: products[0], nr_quantity: 2, nr_price: 100 },
          { product: products[1], nr_quantity: 1, nr_price: 250 },
        ],
      });

      const result = await makeService().create(dto);

      expect(mockProductsService.validateIds).toHaveBeenCalledWith([
        'p1',
        'p2',
      ]);
      expect(mockOrderRepo.create).toHaveBeenCalledWith({
        fk_client: 'client-1',
        nr_total: 450,
        tx_status: 'PENDING',
      });
      expect(result!.nr_total).toBe(450);
      expect(result!.tx_status).toBe('PENDING');
    });

    it('should throw when products do not exist', async () => {
      const dto = {
        client_id: 'client-1',
        payment_token: 'payment-token',
        items: [{ product_id: 'nonexistent', quantity: 1 }],
      };

      mockProductsService.validateIds.mockRejectedValue(
        new BadRequestException('Products not found: nonexistent'),
      );

      await expect(makeService().create(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockOrderRepo.create).not.toHaveBeenCalled();
      expect(mockOrderRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all orders with relations', async () => {
      const orders = [{ pk_order: 'order-1' }];
      mockOrderRepo.find.mockResolvedValue(orders);

      const result = await makeService().findAll('client-1');

      expect(mockOrderRepo.find).toHaveBeenCalledWith({
        where: { fk_client: 'client-1' },
        order: { ts_created_at: 'DESC' },
        relations: ['order_items', 'order_items.product'],
      });
      expect(result).toEqual(orders);
    });
  });

  describe('findOne', () => {
    it('should return an order when it exists', async () => {
      const order = { pk_order: 'order-1' };
      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await makeService().findOne('order-1', 'client-1');

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
        where: { pk_order: 'order-1', fk_client: 'client-1' },
        order: { ts_created_at: 'DESC' },
        relations: ['order_items', 'order_items.product'],
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        makeService().findOne('nonexistent', 'client-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    const existing = {
      pk_order: 'order-1',
      tx_status: 'PENDING',
      ts_updated_at: new Date('2025-01-01'),
    };

    beforeEach(() => {
      mockOrderRepo.findOne.mockResolvedValue({ ...existing });
      mockOrderRepo.save.mockImplementation((e: any) => Promise.resolve(e));
    });

    it('should update status', async () => {
      const result = await makeService().updateStatus(
        'order-1',
        {
          status: 'COMPLETED',
        },
        'client-1',
      );

      expect(result.tx_status).toBe('COMPLETED');
    });

    it('should throw NotFoundException for unknown order', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);
      await expect(
        makeService().updateStatus(
          'nonexistent',
          { status: 'COMPLETED' },
          'client-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

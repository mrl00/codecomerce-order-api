import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

const mockOrderRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
};
const mockOrderItemRepo = { create: jest.fn(), save: jest.fn(), delete: jest.fn() };
const mockProductRepo = { create: jest.fn(), save: jest.fn(), find: jest.fn(), findOneBy: jest.fn() };

function makeService(): OrdersService {
  return new OrdersService(mockOrderRepo as any, mockOrderItemRepo as any, mockProductRepo as any);
}

describe('OrdersService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return all orders with relations', async () => {
      const orders = [{ pk_order: 'order-1' }];
      mockOrderRepo.find.mockResolvedValue(orders);

      const result = await makeService().findAll();

      expect(mockOrderRepo.find).toHaveBeenCalledWith({
        relations: ['order_items', 'order_items.product'],
      });
      expect(result).toEqual(orders);
    });
  });

  describe('findOne', () => {
    it('should return an order when it exists', async () => {
      const order = { pk_order: 'order-1' };
      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await makeService().findOne('order-1');

      expect(mockOrderRepo.findOne).toHaveBeenCalledWith({
        where: { pk_order: 'order-1' },
        relations: ['order_items', 'order_items.product'],
      });
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(makeService().findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
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
      const result = await makeService().updateStatus('order-1', {
        status: 'COMPLETED',
      });

      expect(result.tx_status).toBe('COMPLETED');
    });

    it('should throw NotFoundException for unknown order', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);
      await expect(
        makeService().updateStatus('nonexistent', { status: 'COMPLETED' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

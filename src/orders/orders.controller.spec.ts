import { OrdersController } from './orders.controller';

const mockOrdersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
};

function makeController(): OrdersController {
  return new OrdersController(mockOrdersService as any);
}

describe('OrdersController', () => {
  it('should be defined', () => {
    expect(makeController()).toBeDefined();
  });
});

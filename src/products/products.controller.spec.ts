import { ProductsController } from './products.controller';

const mockProductsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  validateIds: jest.fn(),
};

function makeController(): ProductsController {
  return new ProductsController(mockProductsService as any);
}

describe('ProductsController', () => {
  it('should be defined', () => {
    expect(makeController()).toBeDefined();
  });
});

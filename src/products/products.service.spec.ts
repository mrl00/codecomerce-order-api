import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findBy: jest.fn(),
  findOneBy: jest.fn(),
  remove: jest.fn(),
};

function makeService(): ProductsService {
  return new ProductsService(mockRepo as any);
}

describe('ProductsService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateProductDto = {
      name: 'Widget',
      description: 'A fine widget',
      image_url: 'https://example.com/widget.jpg',
      price: 2500,
    };

    it('should map DTO fields to entity columns and save', async () => {
      const entity = { pk_product: 'uuid-1', tx_name: dto.name };
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue({ ...entity, nr_price: dto.price });

      const result = await makeService().create(dto);

      expect(mockRepo.create).toHaveBeenCalledWith({
        tx_name: dto.name,
        tx_description: dto.description,
        tx_image_url: dto.image_url,
        nr_price: dto.price,
      });
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [
        { pk_product: 'id-1', tx_name: 'A' },
        { pk_product: 'id-2', tx_name: 'B' },
      ];
      mockRepo.find.mockResolvedValue(products);

      const result = await makeService().findAll();

      expect(mockRepo.find).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return a product when it exists', async () => {
      const product = { pk_product: 'id-1', tx_name: 'Widget' };
      mockRepo.findOneBy.mockResolvedValue(product);

      const result = await makeService().findOne('id-1');

      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ pk_product: 'id-1' });
      expect(result).toEqual(product);
    });

    it('should throw NotFoundException when product does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(makeService().findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existing = {
      pk_product: 'id-1',
      tx_name: 'Old Name',
      tx_description: 'Old desc',
      tx_image_url: null as string | null,
      nr_price: 1000,
    };

    beforeEach(() => {
      mockRepo.findOneBy.mockResolvedValue({ ...existing });
      mockRepo.save.mockImplementation((e: any) => Promise.resolve(e));
    });

    it('should update product name', async () => {
      const result = await makeService().update('id-1', { name: 'New Name' });
      expect(result.tx_name).toBe('New Name');
    });

    it('should update price', async () => {
      const result = await makeService().update('id-1', { price: 5000 });
      expect(result.nr_price).toBe(5000);
    });

    it('should only change fields provided in DTO', async () => {
      const result = await makeService().update('id-1', {
        description: 'Updated desc',
      });
      expect(result.tx_description).toBe('Updated desc');
      expect(result.tx_name).toBe(existing.tx_name);
    });

    it('should throw NotFoundException for unknown product', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(
        makeService().update('nonexistent', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove an existing product', async () => {
      mockRepo.findOneBy.mockResolvedValue({ pk_product: 'id-1' });
      mockRepo.remove.mockResolvedValue(undefined);

      await makeService().remove('id-1');

      expect(mockRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException for unknown product', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(makeService().remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateIds', () => {
    it('should pass when all product IDs exist', async () => {
      mockRepo.find.mockResolvedValue([
        { pk_product: 'id-1' },
        { pk_product: 'id-2' },
      ]);

      await expect(
        makeService().validateIds(['id-1', 'id-2']),
      ).resolves.toBeUndefined();
    });

    it('should throw NotFoundException listing missing IDs', async () => {
      mockRepo.find.mockResolvedValue([{ pk_product: 'id-1' }]);

      await expect(
        makeService().validateIds(['id-1', 'id-2', 'id-3']),
      ).rejects.toThrow('Products not found: id-2, id-3');
    });

    it('should do nothing for empty ID list', async () => {
      await expect(makeService().validateIds([])).resolves.toBeUndefined();
      expect(mockRepo.find).not.toHaveBeenCalled();
    });
  });
});

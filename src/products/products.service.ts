import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  IsNull,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  create(dto: CreateProductDto) {
    const product = this.repo.create({
      tx_name: dto.name,
      tx_description: dto.description,
      tx_image_url: dto.image_url,
      nr_price: dto.price,
    });
    return this.repo.save(product);
  }

  findAll(query?: GetProductsQueryDto) {
    const where: FindOptionsWhere<Product> = { ts_deleted_at: IsNull() };

    if (query?.name) {
      (where as any).tx_name = Like(`%${query.name}%`);
    }
    if (query?.minPrice !== undefined && query?.maxPrice !== undefined) {
      (where as any).nr_price = Between(query.minPrice, query.maxPrice);
    } else if (query?.minPrice !== undefined) {
      (where as any).nr_price = MoreThanOrEqual(query.minPrice);
    } else if (query?.maxPrice !== undefined) {
      (where as any).nr_price = LessThanOrEqual(query.maxPrice);
    }

    return this.repo.find({ where });
  }

  async findOne(id: string) {
    const product = await this.repo.findOneBy({
      pk_product: id,
      ts_deleted_at: IsNull(),
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);
    if (dto.name) product.tx_name = dto.name;
    if (dto.description !== undefined) product.tx_description = dto.description;
    if (dto.image_url !== undefined) product.tx_image_url = dto.image_url;
    if (dto.price !== undefined) product.nr_price = dto.price;
    product.ts_updated_at = new Date();
    return this.repo.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    product.ts_deleted_at = new Date();
    product.ts_updated_at = new Date();
    await this.repo.save(product);
  }

  async validateIds(ids: string[]) {
    if (ids.length === 0) return;
    const found = await this.repo.find({
      select: { pk_product: true },
      where: { pk_product: In(ids), ts_deleted_at: IsNull() },
    });
    const foundIds = new Set(found.map((p) => p.pk_product));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
    }
  }
}

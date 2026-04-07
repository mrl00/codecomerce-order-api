import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const product = await this.repo.findOneBy({ pk_product: id });
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
    await this.repo.remove(product);
  }

  async validateIds(ids: string[]) {
    if (ids.length === 0) return;
    const found = await this.repo.find({
      select: { pk_product: true },
      where: { pk_product: In(ids) },
    });
    const foundIds = new Set(found.map((p) => p.pk_product));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
    }
  }
}

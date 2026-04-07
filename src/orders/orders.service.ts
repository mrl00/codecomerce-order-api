import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/create-order.dto';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) { }

  async create(dto: CreateOrderDto) {
    const productIds = dto.items.map((item) => item.product_id);
    await this.validateProductIds(productIds);

    const products = await this.productRepo.find({
      where: { pk_product: In(productIds) },
    });
    const productMap = new Map(products.map((p) => [p.pk_product, p]));

    let total = 0;
    const items: { product: Product; quantity: number }[] = [];

    for (const itemDto of dto.items) {
      const product = productMap.get(itemDto.product_id)!;
      items.push({ product, quantity: itemDto.quantity });
      total += product.nr_price * itemDto.quantity;
    }

    const order = this.orderRepo.create({
      fk_client: dto.client_id,
      nr_total: total,
      tx_status: OrderStatus.PENDING,
    });
    const saved = await this.orderRepo.save(order);

    const orderItems = items.map(({ product, quantity }) =>
      this.orderItemRepo.create({
        order: saved,
        product,
        nr_quantity: quantity,
        nr_price: product.nr_price,
      }),
    );
    await this.orderItemRepo.save(orderItems);

    return this.orderRepo.findOne({
      where: { pk_order: saved.pk_order },
      relations: ['order_items', 'order_items.product'],
    });
  }

  findAll() {
    return this.orderRepo.find({
      relations: ['order_items', 'order_items.product'],
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { pk_order: id },
      relations: ['order_items', 'order_items.product'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);
    order.tx_status = dto.status as OrderStatus;
    order.ts_updated_at = new Date();
    return this.orderRepo.save(order);
  }

  private async validateProductIds(ids: string[]) {
    if (ids.length === 0) return;
    const found = await this.productRepo.find({
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

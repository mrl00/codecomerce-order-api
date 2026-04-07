import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from 'src/products/entities/product.entity';

@Entity({ name: 'tb_order_item' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid', { name: 'pk_order_item' })
  pk_order_item: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'fk_order' })
  order: Order;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'fk_product' })
  product: Product;

  @Column({ type: 'int', name: 'nr_quantity' })
  nr_quantity: number;

  @Column({ type: 'int', name: 'nr_price' })
  nr_price: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_created_at' })
  ts_created_at: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_updated_at' })
  ts_updated_at: Date;

  toJSON() {
    return {
      product_id: this.product?.pk_product,
      quantity: this.nr_quantity,
      price: this.nr_price,
    };
  }
}

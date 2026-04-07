import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'tb_order' })
export class Order {
  @PrimaryGeneratedColumn('uuid', { name: 'pk_order' })
  pk_order: string;

  @Column({ name: 'nr_idx' })
  nr_idx: number;

  @Column({ name: 'fk_client' })
  fk_client: string;

  @Column({ type: 'int', name: 'nr_total' })
  nr_total: number;

  @Column({ name: 'tx_status' })
  tx_status: OrderStatus;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: ['insert'],
    eager: true,
  })
  order_items: OrderItem[];

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_created_at' })
  ts_created_at: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_updated_at' })
  ts_updated_at: Date;

  toJSON() {
    return {
      id: this.pk_order,
      client_id: this.fk_client,
      total: this.nr_total,
      status: this.tx_status,
      items: this.order_items?.map((item) => item.toJSON()),
      created_at: this.ts_created_at,
      updated_at: this.ts_updated_at,
    };
  }
}

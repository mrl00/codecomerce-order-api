import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tb_product' })
export class Product {
  @PrimaryGeneratedColumn('uuid', { name: 'pk_product' })
  pk_product: string;

  @Column({ type: 'varchar', name: 'tx_name' })
  tx_name: string;

  @Column({ type: 'text', name: 'tx_description', nullable: true })
  tx_description: string;

  @Column({ name: 'tx_image_url', nullable: true, })
  tx_image_url: string;

  @Column({ type: 'int', name: 'nr_price' })
  nr_price: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_created_at' })
  ts_created_at: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_updated_at' })
  ts_updated_at: Date;

  // Serialization: expose API-friendly field names
  toJSON() {
    return {
      id: this.pk_product,
      name: this.tx_name,
      description: this.tx_description,
      image_url: this.tx_image_url,
      price: this.nr_price,
      created_at: this.ts_created_at,
      updated_at: this.ts_updated_at,
    };
  }
}

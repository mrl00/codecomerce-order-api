import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tb_user' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'pk_user' })
  pk_user: string;

  @Column({ unique: true, name: 'tx_username' })
  tx_username: string;

  @Column({ name: 'tx_password' })
  tx_password: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_created_at' })
  ts_created_at: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', name: 'ts_updated_at' })
  ts_updated_at: Date;
}

# Data Model

Generate or modify TypeORM entity files following this project's conventions.

## Naming Convention

| Prefix | Meaning        | Examples                                      |
| ------ | -------------- | --------------------------------------------- |
| `tb_`  | Table          | `tb_product`, `tb_order`, `tb_order_item`     |
| `pk_`  | Primary key    | `pk_product` (UUID, `@PrimaryGeneratedColumn`) |
| `tx_`  | Text column    | `tx_name`, `tx_status`, `tx_username`         |
| `nr_`  | Numeric column | `nr_price` (INT, cents), `nr_quantity`        |
| `fk_`  | Foreign key    | `fk_client`, `fk_product`                     |
| `ts_`  | Timestamp      | `ts_created_at`, `ts_updated_at`              |
| `bl_`  | Boolean        | `bl_active`                                   |
| `dt_`  | Date           | `dt_birth`                                    |

## Entity Rules

1. **Table name**: `@Entity({ name: 'tb_<entity>' })`
2. **Primary key**: `@PrimaryGeneratedColumn('uuid', { name: 'pk_<entity>' })` — property name matches column name (e.g., `pk_product: string`)
3. **Timestamps**: `ts_created_at` and `ts_updated_at` with `default: () => 'CURRENT_TIMESTAMP'`
4. **Soft delete**: Use a nullable `ts_deleted_at` column. Filter with `IsNull()` in queries, never hard-delete.
5. **Price/money**: Store as `INT` (cents). `99900` = $999.00.
6. **`toJSON()` method**: Every entity MUST define `toJSON()` that maps internal names to API-friendly names:
   - `pk_product` → `id`
   - `tx_name` → `name`
   - `nr_price` → `price`
   - `ts_created_at` → `created_at`
   - NEVER expose password fields in `toJSON()`

## Current Entities

- `tb_product` — `pk_product`, `tx_name`, `tx_description`, `tx_image_url`, `nr_price`, `ts_created_at`, `ts_updated_at`, `ts_deleted_at`
- `tb_order` — `pk_order`, `nr_idx` (auto-increment), `fk_client`, `nr_total`, `tx_status`, `ts_created_at`, `ts_updated_at`
- `tb_order_item` — `pk_order_item`, `fk_order` (ManyToOne), `fk_product` (ManyToOne), `nr_quantity`, `nr_price`, `ts_created_at`, `ts_updated_at`
- `tb_user` — `pk_user`, `tx_username` (UNIQUE), `tx_password`, `ts_created_at`, `ts_updated_at`

## Schema Management

This project uses `synchronize: true` — TypeORM auto-generates schema from entities on startup. There are NO manual migration files. When adding/modifying entities, just update the entity class and restart the server.

Input: I will describe the new entity or changes needed. Generate the entity class following these conventions.

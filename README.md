# NestJS API

NestJS REST API for e-commerce with PostgreSQL and TypeORM.

## Setup

```bash
pnpm install
pnpm run start:dev
```

## Database

Configure connection in `src/app.module.ts`. Uses TypeORM with `synchronize: true` for auto schema generation.

## API Endpoints

### Products

| Method | Endpoint     | Description         | Body                               |
|--------|--------------|---------------------|------------------------------------|
| POST   | /products    | Create a product    | `{ name, description?, image_url?, price }` |
| GET    | /products    | List all products   |                                    |
| GET    | /products/:id| Get product by ID   |                                    |
| PATCH  | /products/:id| Update product      | Fields to update                   |
| DELETE | /products/:id| Delete product      |                                    |

### Orders

| Method | Endpoint      | Description         | Body                               |
|--------|---------------|---------------------|------------------------------------|
| POST   | /orders       | Create an order     | `{ client_id, items: [{ product_id, quantity }] }` |
| GET    | /orders       | List all orders     |                                    |
| GET    | /orders/:id   | Get order by ID     |                                    |
| PATCH  | /orders/:id   | Update order status | `{ status }` (PENDING/COMPLETED/CANCELLED) |

## Testing

### Hurl integration tests

```bash
cd tests && hurl ./*.hurl
```

## Database Naming Convention

| Prefix | Meaning             | Examples                                    |
|--------|---------------------|---------------------------------------------|
| `tb_`  | Table name          | `tb_product`, `tb_order`, `tb_order_item`  |
| `pk_`  | Primary key         | `pk_product`, `pk_order`, `pk_order_item`  |
| `tx_`  | Text column         | `tx_name`, `tx_description`, `tx_status`   |
| `nr_`  | Numeric column      | `nr_price`, `nr_quantity`, `nr_total`      |
| `fk_`  | Foreign key         | `fk_client`, `fk_product`, `fk_order`      |
| `ts_`  | Timestamp           | `ts_created_at`, `ts_updated_at`           |

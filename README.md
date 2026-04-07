# NestJS API

A REST API for an e-commerce platform with product catalog and order management, built with NestJS and PostgreSQL.

## Project Structure

```
src/
├── main.ts                      # Bootstrap + global ValidationPipe
├── app.module.ts                # TypeORM config + module imports
├── products/
│   ├── entities/
│   │   └── product.entity.ts    # Product entity (tb_product)
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   └── update-product.dto.ts
│   ├── products.service.ts      # CRUD + validateIds
│   ├── products.controller.ts   # REST endpoints
│   └── products.module.ts
└── orders/
    ├── entities/
    │   ├── order.entity.ts       # Order entity (tb_order)
    │   └── order-item.entity.ts  # OrderItem entity (tb_order_item)
    ├── dto/
    │   └── create-order.dto.ts
    ├── orders.service.ts        # CRUD + product validation
    ├── orders.controller.ts     # REST endpoints
    └── orders.module.ts
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16
- pnpm

## Getting Started

### Setup

```bash
pnpm install
pnpm run start:dev
```

### Database

Configure connection in `src/app.module.ts`. Uses TypeORM with `synchronize: true` for auto schema generation:

```ts
{
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'qwert',
  database: 'nestjs',
}
```

The server listens on port `3000` by default.

## API Endpoints

### Health

| Method | Path   | Description  |
|--------|--------|--------------|
| GET    | /      | Health check |

### Products

| Method | Endpoint      | Description           | Body                                                | Status        |
|--------|---------------|-----------------------|-----------------------------------------------------|---------------|
| POST   | /products     | Create a product      | `{ name, description?, image_url?, price }`         | 201 Created   |
| GET    | /products     | List all products     |                                                     | 200 OK        |
| GET    | /products/:id | Get product by ID     |                                                     | 200 OK        |
| PATCH  | /products/:id | Update product        | Fields to update                                    | 200 OK        |
| DELETE | /products/:id | Delete product        |                                                     | 204 No Content|

### Orders

| Method | Endpoint      | Description           | Body                                                        | Status        |
|--------|---------------|-----------------------|-------------------------------------------------------------|---------------|
| POST   | /orders       | Create an order       | `{ client_id, items: [{ product_id, quantity }] }`          | 201 Created   |
| GET    | /orders       | List all orders       |                                                             | 200 OK        |
| GET    | /orders/:id   | Get order by ID       |                                                             | 200 OK        |
| PATCH  | /orders/:id   | Update order status   | `{ status }` (PENDING/COMPLETED/CANCELLED)                   | 200 OK        |

## Validation

All DTOs use `class-validator` with global `ValidationPipe({ whitelist: true, transform: true })`:

**Products:**
- `name` — required string, non-empty
- `price` — required number (stored as int/cents)
- `description`, `image_url` — optional strings

**Orders:**
- `client_id` — required string
- `items` — required array, each item must have `product_id` (string) and `quantity` (>= 1)

If any product ID does not exist when creating an order, `404` is returned with the list of missing IDs.

## Testing

### Hurl integration tests

```bash
cd tests && hurl ./*.hurl
```

## Database Naming Convention

All tables and columns follow a shared naming convention between the Go and NestJS services:

| Prefix | Meaning             | Examples                                    |
|--------|---------------------|---------------------------------------------|
| `tb_`  | Table name          | `tb_product`, `tb_order`, `tb_order_item`  |
| `pk_`  | Primary key (UUID)  | `pk_product`, `pk_order`, `pk_order_item`  |
| `tx_`  | Text column         | `tx_name`, `tx_description`, `tx_status`   |
| `nr_`  | Numeric column      | `nr_price`, `nr_quantity`, `nr_total`      |
| `fk_`  | Foreign key         | `fk_client`, `fk_product`, `fk_order`      |
| `ts_`  | Timestamp           | `ts_created_at`, `ts_updated_at`           |

Entities use `toJSON()` to serialize database column names back to clean API-friendly names (e.g., `pk_product` → `id`).

## Run Commands

```bash
pnpm run start        # development
pnpm run start:prod   # production (node dist/main)
pnpm run build        # compile TypeScript
pnpm run test         # unit tests
pnpm run test:e2e     # e2e tests
```

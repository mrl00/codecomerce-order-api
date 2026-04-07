# CLAUDE.md - NestJS API

## Project Overview
NestJS REST API for e-commerce (codecommerce) with PostgreSQL and TypeORM.

## Tech Stack
- **NestJS** with TypeScript
- **TypeORM** → PostgreSQL
- **class-validator** + **class-transformer** for DTO validation
- **Hurl** for HTTP integration testing
- **pnpm** for package management

## Database Naming Convention
All tables use `tb_<entity>` prefix. Column naming follows a shared convention:
- Primary key: `pk_<entity>` (UUID auto-generated)
- Text columns: `tx_<name>` (e.g., `tx_name`, `tx_description`, `tx_image_url`, `tx_status`)
- Numeric columns: `nr_<name>` (e.g., `nr_price`, `nr_quantity`, `nr_total`)
- Foreign keys: `fk_<entity>` (e.g., `fk_client`, `fk_product`)
- Timestamps: `ts_<name>` (e.g., `ts_created_at`, `ts_updated_at`)
- Index/reference: `nr_idx` (numeric index, e.g., order index)
- Nested entities: `order_items` (collection name, not `tb_` prefixed)

## Architecture
```
src/
  products/          – Product CRUD (entity, service, controller, module, DTOs)
  orders/            – Order CRUD (Order + OrderItem entities, service, controller, DTOs)
  main.ts            – Global ValidationPipe (whitelist + transform)
  app.module.ts      – TypeORM config (synchronize: true, Postgres)
```
- Each entity class has `toJSON()` to serialize DB-column names back to API-friendly names (`pk_product` → `id`, etc.)

## Validation Rules
- Products: `name` required (string), `price` required (number, stored as int/cents), optional `description`/`image_url`
- Orders: `client_id` required (string), `items[]` required with `product_id` (string) + `quantity` (>= 1)
- Status update: `status` required (string: PENDING, COMPLETED, CANCELLED)

## Order Service
- `validateProductIds()` checks all product IDs in a single query before creating an order
- Total computed from `product.nr_price * quantity`
- Order status: PENDING (default), COMPLETED, CANCELLED
- No delete endpoint (order history preservation)

## Testing
- Hurl tests in `tests/` directory
- Product tests: `tests/products.hurl`
- Product endpoints: `GET/POST/PATCH/DELETE /products`
- Order endpoints: `GET/POST/PATCH /orders`

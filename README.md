# nestjs-api

[![NestJS](https://img.shields.io/badge/NestJS-11.x-ea2845)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-334155?logo=postgresql)](https://www.postgresql.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

REST API for an e-commerce platform with product catalog and order management, built with NestJS, TypeORM, and PostgreSQL.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the project](#running-the-project)
- [Seeding the database](#seeding-the-database)
- [Running tests](#running-tests)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Naming Convention](#database-naming-convention)
- [Contributing](#contributing)
- [License](#license)

## Features

- Full CRUD for products with class-validator DTOs
- Order creation with automatic total calculation from product prices
- Product existence validation before order creation (single-query check)
- Global request validation with `ValidationPipe` (whitelist + transform)
- Database column nomenclature shared across services (`tx_*`, `nr_*`, `fk_*`, `ts_*`, `pk_*`)
- Entity serialization via `toJSON()` — internal column names mapped to API-friendly response fields
- Fixture script for seeding sample data

## Tech Stack

| Category     | Technology                          |
|--------------|-------------------------------------|
| Framework    | NestJS 11                           |
| Language     | TypeScript 5                        |
| ORM          | TypeORM 0.4+                        |
| Database     | PostgreSQL 16                       |
| Validation   | class-validator, class-transformer  |
| Testing      | Jest (unit), Hurl (integration)     |
| Package mgr  | pnpm                                |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 16+
- **Hurl** (optional, for integration tests)

## Installation

```bash
# Clone the repository
git clone https://github.com/mrl00/nestjs-api.git
cd nestjs-api

# Install dependencies
pnpm install
```

## Configuration

The database connection is configured in `src/app.module.ts`. Update the connection parameters to match your local PostgreSQL instance:

| Parameter  | Description    | Default      | Example                                    |
|------------|----------------|--------------|--------------------------------------------|
| type       | Database type  | `postgres`   | `postgres`                                 |
| host       | Database host  | `localhost`  | `127.0.0.1` or `db.internal`               |
| port       | Database port  | `5432`       | `5432`                                     |
| username   | Database user  | `postgres`   | `app_user`                                 |
| password   | User password  | `qwert`      | `s3cure_p@ss`                              |
| database   | Database name  | `nestjs`     | `ecommerce_db`                             |
| synchronize| Auto-migrate   | `true`       | `true` (dev) / `false` (prod)              |

Schema is auto-generated on startup via `synchronize: true`. Set this to `false` in production and manage schema changes with migrations.

## Running the project

```bash
# Development mode with hot reload
pnpm run start:dev

# Watch mode with debugger attached
pnpm run start:debug

# Production mode (requires build first)
pnpm run build
pnpm run start:prod
```

The server starts on port `3000` by default (configurable via `PORT` env var).

## Seeding the database

A fixture script drops and recreates all tables, then seeds sample products:

```bash
pnpm run fixture
```

This is useful for local development and testing. **Do not run in production.**

## Running tests

```bash
# Unit tests
pnpm run test

# Unit tests with coverage
pnpm run test:cov

# Integration tests (requires running server + hurl installed)
cd tests && hurl ./*.hurl
```

## API Documentation

Base URL: `http://localhost:3000`

### Health

```bash
GET /
```

<details>
<summary>Response <code>200 OK</code></summary>

```json
{}
```

</details>

### Products

#### Create a product

```bash
POST /products
```

<details>
<summary>Request body</summary>

```json
{
  "name": "iPhone 14",
  "description": "iPhone 14 Pro, 128GB",
  "image_url": "https://example.com/iphone14.jpg",
  "price": 99900
}
```

</details>

<details>
<summary>Response <code>201 Created</code></summary>

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "iPhone 14",
  "description": "iPhone 14 Pro, 128GB",
  "image_url": "https://example.com/iphone14.jpg",
  "price": 99900,
  "created_at": "2025-03-15T10:00:00.000Z",
  "updated_at": "2025-03-15T10:00:00.000Z"
}
```

</details>

#### List all products

```bash
GET /products
```

<details>
<summary>Response <code>200 OK</code></summary>

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "iPhone 14",
    "description": "iPhone 14 Pro, 128GB",
    "image_url": "https://example.com/iphone14.jpg",
    "price": 99900,
    "created_at": "2025-03-15T10:00:00.000Z",
    "updated_at": "2025-03-15T10:00:00.000Z"
  }
]
```

</details>

#### Get product by ID

```bash
GET /products/:id
```

<details>
<summary>Response <code>200 OK</code></summary>

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "iPhone 14",
  "description": "iPhone 14 Pro, 128GB",
  "price": 99900,
  "created_at": "2025-03-15T10:00:00.000Z",
  "updated_at": "2025-03-15T10:00:00.000Z"
}
```

</details>

#### Update a product

```bash
PATCH /products/:id
```

<details>
<summary>Request body</summary>

```json
{
  "name": "iPhone 14 Pro Max"
}
```

</details>

<details>
<summary>Response <code>200 OK</code></summary>

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "iPhone 14 Pro Max",
  "description": "iPhone 14 Pro, 128GB",
  "price": 99900,
  "created_at": "2025-03-15T10:00:00.000Z",
  "updated_at": "2025-03-15T11:30:00.000Z"
}
```

</details>

#### Delete a product

```bash
DELETE /products/:id
```

Response: `204 No Content`

### Orders

#### Create an order

```bash
POST /orders
```

<details>
<summary>Request body</summary>

```json
{
  "client_id": "client-abc-123",
  "items": [
    { "product_id": "550e8400-e29b-41d4-a716-446655440000", "quantity": 2 },
    { "product_id": "550e8400-e29b-41d4-a716-446655440001", "quantity": 1 }
  ]
}
```

</details>

<details>
<summary>Response <code>201 Created</code></summary>

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "client_id": "client-abc-123",
  "total": 299700,
  "status": "PENDING",
  "items": [
    { "product_id": "550e8400-e29b-41d4-a716-446655440000", "quantity": 2, "price": 99900 },
    { "product_id": "550e8400-e29b-41d4-a716-446655440001", "quantity": 1, "price": 100000 }
  ],
  "created_at": "2025-03-15T12:00:00.000Z",
  "updated_at": "2025-03-15T12:00:00.000Z"
}
```

</details>

The `total` is calculated from the current product prices at creation time, not from values provided in the request. If any `product_id` does not exist, a `404` is returned with the list of missing IDs.

#### List all orders

```bash
GET /orders
```

<details>
<summary>Response <code>200 OK</code></summary>

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "client_id": "client-abc-123",
    "total": 299700,
    "status": "PENDING",
    "items": [],
    "created_at": "2025-03-15T12:00:00.000Z",
    "updated_at": "2025-03-15T12:00:00.000Z"
  }
]
```

</details>

#### Get order by ID

```bash
GET /orders/:id
```

<details>
<summary>Response <code>200 OK</code></summary>

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "client_id": "client-abc-123",
  "total": 299700,
  "status": "PENDING",
  "items": [
    { "product_id": "550e8400-e29b-41d4-a716-446655440000", "quantity": 2, "price": 99900 }
  ],
  "created_at": "2025-03-15T12:00:00.000Z",
  "updated_at": "2025-03-15T12:00:00.000Z"
}
```

</details>

#### Update order status

```bash
PATCH /orders/:id
```

<details>
<summary>Request body</summary>

```json
{
  "status": "COMPLETED"
}
```

</details>

<details>
<summary>Response <code>200 OK</code></summary>

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "client_id": "client-abc-123",
  "total": 299700,
  "status": "COMPLETED",
  "items": [],
  "created_at": "2025-03-15T12:00:00.000Z",
  "updated_at": "2025-03-15T12:05:00.000Z"
}
```

</details>

#### Validation errors

Missing or invalid fields return `400 Bad Request`:

```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "price must be a number"],
  "error": "Bad Request"
}
```

## Project Structure

```
src/
├── main.ts                      # Application bootstrap, global ValidationPipe
├── app.module.ts                # TypeORM connection + module registry
├── products/                    # Product resource
│   ├── entities/product.entity.ts  # tb_product with toJSON() serialization
│   ├── dto/                        # Create and Update DTOs with validation
│   ├── products.service.ts         # CRUD + validateIds batch check
│   ├── products.controller.ts      # REST endpoints with @Res response
│   └── products.module.ts
└── orders/                      # Order resource
    ├── entities/
    │   ├── order.entity.ts         # tb_order with status enum
    │   └── order-item.entity.ts    # tb_order_item, ManyToOne to Product
    ├── dto/create-order.dto.ts     # Validated order creation payload
    ├── orders.service.ts           # Order creation with total calculation
    ├── orders.controller.ts        # REST endpoints
    └── orders.module.ts
tests/
└── products.hurl                # Hurl integration tests for products
```

## Database Naming Convention

Tables and columns follow a semantic prefix convention shared across services:

| Prefix | Meaning             | Examples                                    |
|--------|---------------------|---------------------------------------------|
| `tb_`  | Table name          | `tb_product`, `tb_order`, `tb_order_item`  |
| `pk_`  | Primary key (UUID)  | `pk_product`, `pk_order`, `pk_order_item`  |
| `tx_`  | Text column         | `tx_name`, `tx_description`, `tx_status`   |
| `nr_`  | Numeric column      | `nr_price`, `nr_quantity`, `nr_total`      |
| `fk_`  | Foreign key         | `fk_client`, `fk_product`, `fk_order`      |
| `ts_`  | Timestamp           | `ts_created_at`, `ts_updated_at`           |

Entities expose API-friendly field names via `toJSON()` (`pk_product` → `id`, `tx_name` → `name`, etc.).

## Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit your changes (`git commit -m 'feat: add your feature'`)
3. Push to the branch (`git push origin feature/your-feature`)
4. Open a Pull Request

For bugs or feature requests, [open an issue](https://github.com/mrl00/nestjs-api/issues).

## License

[MIT](LICENSE)

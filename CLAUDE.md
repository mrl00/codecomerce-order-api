# CLAUDE.md — codecomerce-order-api

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task           | Command                  | Notes                                    |
| -------------- | ------------------------ | ---------------------------------------- |
| Install deps   | `pnpm install`           | Package manager is **pnpm**, not npm     |
| Dev server     | `pnpm run start:dev`     | Hot reload, port 3000                    |
| Build          | `pnpm run build`         | Output to `dist/`                        |
| Lint + fix     | `pnpm run lint`          | ESLint + Prettier                        |
| Type check     | `pnpm exec tsc --noEmit` | Run before committing                    |
| Unit tests     | `pnpm test`              | Jest, `*.spec.ts` colocated with source  |
| E2E tests      | `pnpm test:e2e`          | Supertest, requires running PostgreSQL   |
| Test coverage  | `pnpm test:cov`          |                                          |
| Seed data      | `pnpm run fixture`       | Drops + recreates tables. Dev only.      |

## Project Structure

```
src/
├── main.ts                 # Bootstrap, global ValidationPipe (whitelist + transform)
├── app.module.ts           # TypeORM config (DATABASE_URL env), module imports
├── app.controller.ts       # GET / health check
├── auth/                   # JWT auth (login, register, guard)
│   ├── auth.module.ts      # @Global, JwtModule from JWT_SECRET env
│   ├── auth.controller.ts  # POST /auth/login, POST /auth/register (public, no guard)
│   ├── auth.service.ts     # bcrypt.hash (cost 12) / bcrypt.compare
│   ├── auth.guard.ts       # CanActivate, Bearer token → req['user'] = payload
│   ├── dto/                # LoginDto, RegisterDto
│   └── entities/           # User (tb_user)
├── products/               # Product CRUD (global, not user-scoped)
│   ├── products.service.ts # create, findAll (filters), findOne, update, remove (soft), validateIds
│   ├── products.controller.ts
│   ├── dto/                # CreateProductDto, UpdateProductDto (PartialType), GetProductsQueryDto
│   └── entities/           # Product (tb_product, soft delete via ts_deleted_at)
└── orders/                 # Order CRUD (user-scoped via fk_client)
    ├── orders.service.ts   # create (validate IDs, auto-calc total), findAll, findOne, updateStatus
    ├── orders.controller.ts
    ├── dto/                # CreateOrderDto, CreateOrderItemDto, UpdateOrderStatusDto
    └── entities/           # Order (tb_order), OrderItem (tb_order_item)
test/                       # E2E tests (supertest, maxWorkers: 1)
├── auth.e2e-spec.ts        # 7 tests
├── products.e2e-spec.ts    # 12 tests
└── orders.e2e-spec.ts      # 13 tests
```

## Database

- **Connection**: `DATABASE_URL` env var (loaded by `@nestjs/config` from `.env`).
- **`synchronize: true`** — schema auto-generated on startup. No manual migration files.
- **Naming convention** (shared across codecommerce services):

| Prefix | Meaning        | Examples                                  |
| ------ | -------------- | ----------------------------------------- |
| `tb_`  | Table          | `tb_product`, `tb_order`, `tb_order_item` |
| `pk_`  | Primary key    | `pk_product`, `pk_order`, `pk_user`       |
| `tx_`  | Text column    | `tx_name`, `tx_status`, `tx_username`     |
| `nr_`  | Numeric column | `nr_price`, `nr_total`, `nr_quantity`     |
| `fk_`  | Foreign key    | `fk_client`, `fk_product`, `fk_order`     |
| `ts_`  | Timestamp      | `ts_created_at`, `ts_updated_at`          |

- **Price stored as `INT` (cents)** — `99900` = $999.00. No floats.

## Auth

- **JWT secret**: loaded from `JWT_SECRET` env var via `ConfigService` in `auth.module.ts`.
- **Users**: stored in `tb_user` with bcrypt-hashed passwords (cost 12). No hardcoded users.
- **JWT payload**: `{ subscriber: <user UUID>, username }`. Tokens expire in 1h.
- **Public endpoints**: `POST /auth/login`, `POST /auth/register`. Everything else requires `Authorization: Bearer <token>`.
- **Guard**: `AuthGuard` extracts the Bearer token, calls `jwtService.verify()`, and attaches the payload to `request['user']`.

## Architecture Patterns

- **`@Res()` response pattern** — All controller methods inject `@Res() res: Response` and call `res.status(HttpStatus.XXX).json(data)` explicitly. Do NOT return values directly from controller methods (causes double-send errors). This is the established pattern across all controllers.
- **`req['user'].subscriber`** — The JWT payload is on the request object. `subscriber` is the user's UUID, used to scope orders by client.
- **`toJSON()` serialization** — All entities (Product, Order, OrderItem) define `toJSON()` to map internal column names (`pk_product`, `tx_name`) to API-friendly response fields (`id`, `name`). The User entity does NOT yet have `toJSON()`.
- **Soft delete** — Products use `ts_deleted_at`. All queries filter with `IsNull()`. `remove()` sets the timestamp instead of deleting rows.
- **No DELETE endpoint for orders** — Intentional.
- **`nr_idx`** on Order — auto-incremented via `@Generated('increment')`.
- **`validateIds` consolidated** — `OrdersService` injects `ProductsService` and calls `validateIds()`.
- **`UpdateProductDto`** uses `PartialType` from `@nestjs/mapped-types`.

## Testing

- **Unit tests**: colocated `*.spec.ts` files. Mock repos/services manually (no `Test.createTestingModule` for most — direct constructor injection with `as any` casts).
- **E2E tests**: `test/*.e2e-spec.ts` using `@nestjs/testing` + supertest. Require a running PostgreSQL instance. `maxWorkers: 1` in `jest-e2e.json` to prevent parallel truncation conflicts.
- **Path alias**: `moduleNameMapper` maps `src/` → `<rootDir>/` in both Jest configs.
- **Controller specs are stubs** — `products.controller.spec.ts`, `orders.controller.spec.ts`, and `auth.controller.spec.ts` only test "should be defined". Mock setup exists but no method tests.

## Backlog

See `docs/backlog.md` for pending tasks, full project context, and implementation details. Always check it before starting new work.

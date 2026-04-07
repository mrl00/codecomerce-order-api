# NestJS API Backlog

## Completed

- [x] Product entity with TypeORM (`tb_product`, PK `pk_product`)
- [x] Product CRUD (service, controller, module, DTOs with validation)
- [x] Product hurl integration tests (`tests/products.hurl`)
- [x] Order + OrderItem entities with nomenclature (`tb_order`, `tb_order_item`)
- [x] Order CRUD with product validation (`validateProductIds`)
- [x] Order status update (PENDING → COMPLETED/CANCELLED)
- [x] `toJSON()` serialization on entities (API-friendly names)
- [x] Global ValidationPipe with whitelist + transform
- [x] Database naming convention (`tx_*`, `nr_*`, `fk_*`, `ts_*`, `pk_*`)
- [x] `@Res Response` pattern on controllers with explicit status codes
- [x] Unit tests for products service (create, findAll, findOne, update, remove, validateIds)
- [x] Unit tests for orders service (findAll, findOne, updateStatus)
- [x] Jest `moduleNameMapper` for `src/` path alias resolution
- [x] README rewrite with API docs, configuration table, naming convention
- [x] CLAUDE.md project documentation
- [x] Auth module with JWT (`POST /auth/login`, `AuthGuard`)

## Bug Fixes

- [x] Fix `AuthGuard` null header crash — `request.headers['authorization']` can be `undefined`, causing `.split()` to throw (`src/auth/auth.guard.ts:31`)
- [x] Fix order controller `findOne` — `client_id` parameter is always `undefined`, should use `@Req() req: Request` and `req['user'].subscriber` (`src/orders/orders.controller.ts:39`)

## Improvements

- [x] Move DB credentials to environment variables (currently hardcoded in `app.module.ts`)
- [x] Move JWT secret to environment variable (currently `'secret'` in `auth.module.ts`)
- [ ] Consolidate duplicated `validateProductIds` — exists in both `ProductsService` and `OrdersService`
- [ ] Add `@UsePipes` or DTO validation to `POST /auth/login` (currently accepts any body shape)
- [ ] Add password hashing (currently plaintext comparison in `auth.service.ts`)
- [ ] Populate `nr_idx` column on Order entity (defined but never set)
- [ ] Add user registration endpoint (`POST /auth/register`)
- [ ] Add user entity with TypeORM (currently hardcoded array in `auth.service.ts`)

## Testing

- [ ] Orders hurl integration tests (`tests/orders.hurl`)
- [ ] Auth hurl integration tests (`tests/auth.hurl`)
- [ ] Unit tests for `AuthService` (login success, login failure)
- [ ] Unit tests for `AuthGuard` (valid token, missing header, invalid token)
- [ ] Unit tests for order creation (total calculation, missing products)
- [ ] Enable e2e test suite (`test/jest-e2e.json` exists but unused)

## Features

- [ ] Categories module (entity, service, controller, DTOs, validation)
- [ ] Categories hurl integration tests
- [ ] Product search/filtering (by name, price range)
- [ ] Pagination for product and order list endpoints
- [ ] Order cancellation logic (prevent cancelling COMPLETED orders)
- [ ] Soft delete for products (instead of hard delete)

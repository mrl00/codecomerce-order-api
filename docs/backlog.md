# NestJS API Backlog

## Completed

- [x] Product entity with TypeORM (`tb_product`, PK `pk_product`)
- [x] Product CRUD (service, controller, module, DTOs with validation)
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
- [x] Populate `nr_idx` column on Order entity — added `@Generated('increment')` decorator for auto-increment

## Bug Fixes

- [x] Fix `AuthGuard` null header crash — `request.headers['authorization']` can be `undefined`, causing `.split()` to throw (`src/auth/auth.guard.ts:31`)
- [x] Fix order controller `findOne` — `client_id` parameter is always `undefined`, should use `@Req() req: Request` and `req['user'].subscriber` (`src/orders/orders.controller.ts:39`)
- [x] Fix AuthModule dependency injection — export `JwtModule` so `AuthGuard` can resolve `JwtService` in other modules
- [x] Fix e2e test isolation — set `maxWorkers: 1` to prevent parallel test files from truncating each other's data

## Improvements

- [x] Move DB credentials to environment variables (currently hardcoded in `app.module.ts`)
- [x] Move JWT secret to environment variable (currently `'secret'` in `auth.module.ts`)
- [x] Consolidate duplicated `validateProductIds` — `OrdersService` now injects `ProductsService` and calls `validateIds()`
- [x] Add DTO validation to `POST /auth/login` — created `LoginDto` with `@IsString()` and `@IsNotEmpty()` decorators
- [x] Add password hashing (using bcrypt in `auth.service.ts`)

## Testing

- [x] Product e2e tests (`test/products.e2e-spec.ts`) — 12 tests covering full CRUD, auth enforcement, validation errors, 404 handling
- [x] Orders e2e tests (`test/orders.e2e-spec.ts`) — 13 tests covering creation with auto-calculated total, cross-user isolation, status updates
- [x] Auth e2e tests (`test/auth.e2e-spec.ts`) — 7 tests covering login success, wrong password, missing fields
- [x] AuthGuard unit tests (`src/auth/auth.guard.spec.ts`) — 6 tests covering valid token, missing header, wrong scheme, failed verification
- [ ] Unit tests for `AuthService` (login success, login failure)
- [ ] Unit tests for order creation (total calculation, missing products)

## Features

- [ ] Add user registration endpoint (`POST /auth/register`)
- [ ] Add user entity with TypeORM (currently hardcoded array in `auth.service.ts`)
- [ ] Categories module (entity, service, controller, DTOs, validation)
- [ ] Product search/filtering (by name, price range)
- [ ] Pagination for product and order list endpoints
- [ ] Order cancellation logic (prevent cancelling COMPLETED orders)
- [ ] Soft delete for products (instead of hard delete)

# Codecommerce Order API — Backlog

## Project Context

This is `codecomerce-order-api`, one of the backend services in the **codecommerce** e-commerce platform. It is a REST API built with **NestJS 11**, **TypeScript 5**, **TypeORM**, and **PostgreSQL 16**. Package manager is **pnpm**.

The API handles:

- **Auth** — JWT-based registration and login (`POST /auth/register`, `POST /auth/login`). Passwords are hashed with bcrypt (cost 12). Tokens carry `{ subscriber: <user uuid>, username }` and expire in 1h. A global `AuthGuard` protects all product and order endpoints.
- **Products** — Full CRUD (`POST/GET/GET :id/PATCH :id/DELETE :id` on `/products`). Soft-delete via `ts_deleted_at`. Search/filter by name (LIKE), minPrice, maxPrice via query params. Products are global (not user-scoped).
- **Orders** — Create, list, get-by-id, update status (`POST/GET/GET :id/PATCH :id` on `/orders`). Orders are user-scoped via `fk_client` (set from the JWT `subscriber` claim). Order total is auto-calculated from current product prices at creation time. OrderItems reference products via FK.

### Tech Stack

| Layer       | Tech                                             |
| ----------- | ------------------------------------------------ |
| Framework   | NestJS 11 (`@nestjs/core`, `@nestjs/common`)     |
| ORM         | TypeORM 0.3 (`@nestjs/typeorm`)                  |
| Auth        | `@nestjs/jwt`, bcrypt                            |
| Validation  | `class-validator`, `class-transformer`            |
| Database    | PostgreSQL 16                                    |
| Testing     | Jest 30, supertest (e2e)                         |
| CI/CD       | GitHub Actions (ci.yml, docker-publisher.yml)     |
| Container   | Multi-stage Dockerfile (node:22-alpine, pnpm 9)  |

### Directory Structure

```
src/
├── main.ts                            # Bootstrap, global ValidationPipe (whitelist + transform)
├── app.module.ts                      # TypeORM config (DATABASE_URL env), module imports
├── app.controller.ts                  # GET / → "Hello World!" (health check)
├── app.service.ts
├── auth/
│   ├── auth.module.ts                 # @Global, JWT config from JWT_SECRET env
│   ├── auth.controller.ts            # POST /auth/login, POST /auth/register
│   ├── auth.service.ts               # login (bcrypt.compare), register (bcrypt.hash, cost 12)
│   ├── auth.guard.ts                 # CanActivate, Bearer token extraction + jwtService.verify
│   ├── dto/login.dto.ts              # { username: @IsString @IsNotEmpty, password: same }
│   ├── dto/register.dto.ts           # { username: @IsString @IsNotEmpty, password: same }
│   └── entities/user.entity.ts       # tb_user (pk_user UUID, tx_username UNIQUE, tx_password, ts_*)
├── products/
│   ├── products.module.ts            # imports TypeOrmModule.forFeature([Product]), AuthModule; exports ProductsService
│   ├── products.controller.ts        # @UseGuards(AuthGuard), CRUD with @Res() explicit status codes
│   ├── products.service.ts           # create, findAll (filters), findOne, update, remove (soft), validateIds
│   ├── dto/create-product.dto.ts     # { name, description?, image_url?, price }
│   ├── dto/update-product.dto.ts     # PartialType(CreateProductDto)
│   ├── dto/get-products.dto.ts       # { name?, minPrice?, maxPrice? } — query params with @Type(() => Number)
│   └── entities/product.entity.ts    # tb_product (pk_product UUID, tx_name, tx_description, tx_image_url, nr_price INT, ts_*, ts_deleted_at nullable)
└── orders/
    ├── orders.module.ts              # imports TypeOrmModule.forFeature([Order, OrderItem, Product]), ProductsModule, AuthModule
    ├── orders.controller.ts          # @UseGuards(AuthGuard), client_id from req['user'].subscriber
    ├── orders.service.ts             # create (validate IDs, calculate total, save order + items), findAll, findOne, updateStatus
    ├── dto/create-order.dto.ts       # CreateOrderDto { items: CreateOrderItemDto[] }, CreateOrderItemDto { product_id, quantity }, UpdateOrderStatusDto { status }
    └── entities/
        ├── order.entity.ts           # tb_order (pk_order UUID, nr_idx @Generated('increment'), fk_client, nr_total INT, tx_status, OneToMany order_items, ts_*)
        └── order-item.entity.ts      # tb_order_item (pk_order_item UUID, ManyToOne order/product, nr_quantity INT, nr_price INT, ts_*)
test/
├── jest-e2e.json                     # maxWorkers: 1 to avoid parallel truncation conflicts
├── app.e2e-spec.ts
├── auth.e2e-spec.ts                  # 7 tests: login success, wrong password, missing fields
├── products.e2e-spec.ts              # 12 tests: full CRUD, auth enforcement, soft delete
└── orders.e2e-spec.ts                # 13 tests: creation, cross-user isolation, status updates
```

### Database Naming Convention (shared across codecommerce services)

| Prefix | Meaning         | Examples                                  |
| ------ | --------------- | ----------------------------------------- |
| `tb_`  | Table           | `tb_product`, `tb_order`, `tb_order_item` |
| `pk_`  | Primary key     | `pk_product`, `pk_order`                  |
| `tx_`  | Text column     | `tx_name`, `tx_status`                    |
| `nr_`  | Numeric column  | `nr_price`, `nr_total`, `nr_quantity`     |
| `fk_`  | Foreign key     | `fk_client`, `fk_product`, `fk_order`     |
| `ts_`  | Timestamp       | `ts_created_at`, `ts_updated_at`          |

Entities expose API-friendly field names via `toJSON()` methods (e.g., `pk_product` → `id`, `tx_name` → `name`).

### Key Patterns

- **`@Res() res: Response` pattern** — All controller methods inject the raw Express `Response` and call `res.status(HttpStatus.XXX).json(data)` explicitly. This is the established pattern. Do NOT switch to NestJS's implicit return style.
- **`req['user'].subscriber`** — JWT payload is attached to the request object by `AuthGuard`. The `subscriber` field is the user's UUID. Used to scope orders by client.
- **Soft delete** — Products use `ts_deleted_at IS NULL` in all queries. `findAll` and `findOne` filter by `IsNull()`. `remove` sets `ts_deleted_at = new Date()`.
- **`toJSON()` serialization** — Entities define `toJSON()` to map internal column names to API response fields. This is how responses are shaped.
- **`synchronize: true`** — Auto-migration is enabled. No manual migration files exist. Acceptable for early-stage development.
- **Global AuthGuard** — Both `ProductsController` and `OrdersController` use `@UseGuards(AuthGuard)` at the class level. `AuthController` does NOT use the guard (login/register are public).

### Existing Tests

**Unit tests** (in `src/**/**.spec.ts`, run with `pnpm test`):
- `products.service.spec.ts` — 12 tests: create, findAll (with all filter combinations), findOne, update, remove (soft delete), validateIds
- `orders.service.spec.ts` — 6 tests: create (total calculation, missing products), findAll, findOne, updateStatus
- `auth.service.spec.ts` — 4 tests: login success, user not found, wrong password
- `auth.guard.spec.ts` — 6 tests: valid token, missing header, undefined header, wrong scheme, verification failure
- `products.controller.spec.ts` — 1 test: "should be defined" (stub only)
- `orders.controller.spec.ts` — 1 test: "should be defined" (stub only)
- `auth.controller.spec.ts` — 1 test: "should be defined" (stub only)
- `app.controller.spec.ts` — 1 test: "Hello World!"

**E2E tests** (in `test/`, run with `pnpm test:e2e`, requires PostgreSQL):
- `auth.e2e-spec.ts` — 7 tests
- `products.e2e-spec.ts` — 12 tests
- `orders.e2e-spec.ts` — 13 tests (including cross-user isolation)

---

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
- [x] Auth module with JWT (`POST /auth/login`, `AuthGuard`)
- [x] Populate `nr_idx` column on Order entity — added `@Generated('increment')` decorator for auto-increment
- [x] Add user entity with TypeORM
- [x] Add user registration endpoint (`POST /auth/register`)
- [x] Product search/filtering (by name, price range)
- [x] Soft delete for products (instead of hard delete)
- [x] Move DB credentials to environment variables (currently uses `DATABASE_URL` env var)
- [x] Move JWT secret to environment variable (uses `JWT_SECRET` env var via ConfigService)
- [x] Consolidate duplicated `validateProductIds` — `OrdersService` now injects `ProductsService` and calls `validateIds()`
- [x] Add DTO validation to `POST /auth/login` — created `LoginDto` with `@IsString()` and `@IsNotEmpty()` decorators
- [x] Add password hashing (using bcrypt in `auth.service.ts`, cost 12)

## Bug Fixes (Completed)

- [x] Fix `AuthGuard` null header crash — `request.headers['authorization']` can be `undefined`, causing `.split()` to throw
- [x] Fix order controller `findOne` — `client_id` parameter is always `undefined`, should use `@Req() req: Request` and `req['user'].subscriber`
- [x] Fix AuthModule dependency injection — export `JwtModule` so `AuthGuard` can resolve `JwtService` in other modules
- [x] Fix e2e test isolation — set `maxWorkers: 1` to prevent parallel test files from truncating each other's data

## Testing (Completed)

- [x] Product e2e tests (`test/products.e2e-spec.ts`) — 12 tests covering full CRUD, auth enforcement, validation errors, 404 handling
- [x] Orders e2e tests (`test/orders.e2e-spec.ts`) — 13 tests covering creation with auto-calculated total, cross-user isolation, status updates
- [x] Auth e2e tests (`test/auth.e2e-spec.ts`) — 7 tests covering login success, wrong password, missing fields
- [x] AuthGuard unit tests (`src/auth/auth.guard.spec.ts`) — 6 tests covering valid token, missing header, wrong scheme, failed verification
- [x] Unit tests for `AuthService` (login success, login failure)
- [x] Unit tests for order creation (total calculation, missing products)

---

## Pending Tasks

### 1. Pagination for product and order list endpoints

**Context**: Both `GET /products` and `GET /orders` currently return all records with no pagination. The sibling service (`codecommerce-catalog-api`, written in Go) already implements `LIMIT/OFFSET` pagination with a `PaginatedResult` response shape: `{ data: T[], page, limit, total, totalPages }`.

**Requirements**:
- Add `page` (default: 1) and `limit` (default: 20, max: 100) query params to `GET /products` and `GET /orders`.
- Create a shared `PaginationQueryDto` with `@IsOptional()`, `@Type(() => Number)`, `@IsInt()`, `@Min(1)` validators for `page`, and `@Min(1)`, `@Max(100)` for `limit`.
- Update `ProductsService.findAll()` to use TypeORM's `skip` and `take` options alongside the existing `where` filters. Run a `count()` query for the total.
- Update `OrdersService.findAll()` similarly (already scoped by `fk_client`).
- Return a consistent paginated response envelope: `{ data: [...], page, limit, total, totalPages }`. Either create a generic helper or shape it in the service.
- Update `GetProductsQueryDto` to extend or compose with `PaginationQueryDto`.
- Update unit tests for both services to verify `skip`, `take`, and the response shape.
- Update e2e tests to verify pagination params and the new response envelope (the existing `expect([])` and `expect(res.body).toHaveLength(2)` assertions will need adjusting).

**Files to modify**:
- `src/products/dto/get-products.dto.ts` — add/extend pagination params
- `src/orders/dto/create-order.dto.ts` — add a `GetOrdersQueryDto` or a shared pagination DTO
- `src/products/products.service.ts` — `findAll()` with `skip`/`take`/`count`
- `src/products/products.controller.ts` — pass pagination params, return envelope
- `src/orders/orders.service.ts` — `findAll()` with `skip`/`take`/`count`
- `src/orders/orders.controller.ts` — add `@Query()` for pagination, return envelope
- `src/products/products.service.spec.ts` — update mockRepo assertions
- `src/orders/orders.service.spec.ts` — update mockRepo assertions
- `test/products.e2e-spec.ts` — verify paginated response shape
- `test/orders.e2e-spec.ts` — verify paginated response shape

**Verification**: `pnpm test` and `pnpm test:e2e` must pass. Lint with `pnpm lint`.

---

### 2. Order cancellation logic (prevent cancelling COMPLETED orders)

**Context**: The `PATCH /orders/:id` endpoint currently accepts any string as a status value — including transitioning a `COMPLETED` order to `CANCELLED`. The `UpdateOrderStatusDto` only validates that `status` is a non-empty string; it doesn't validate against the `OrderStatus` enum or enforce state transition rules.

**Requirements**:
- Validate the `status` field against the `OrderStatus` enum (`PENDING`, `COMPLETED`, `CANCELLED`). Use `@IsEnum(OrderStatus)` in `UpdateOrderStatusDto`.
- Add state machine logic in `OrdersService.updateStatus()`:
  - `PENDING` → `COMPLETED` ✔
  - `PENDING` → `CANCELLED` ✔
  - `COMPLETED` → any change ✘ → throw `BadRequestException('Cannot modify a completed order')`
  - `CANCELLED` → any change ✘ → throw `BadRequestException('Cannot modify a cancelled order')`
- Update the existing unit test in `orders.service.spec.ts` to cover the new state transitions (at least 4 cases: valid transition, completed-to-cancelled blocked, cancelled-to-completed blocked, already-same-status idempotent or rejected).
- Update `test/orders.e2e-spec.ts`:
  - The test `'should accept any non-empty status string'` (which sends `{ status: 'CUSTOM' }` and expects 200) must be replaced or removed since `'CUSTOM'` will now be rejected by validation.
  - Add a test for the 400 response when trying to cancel a completed order.

**Files to modify**:
- `src/orders/dto/create-order.dto.ts` — add `@IsEnum(OrderStatus)` to `UpdateOrderStatusDto.status`, change type from `string` to `OrderStatus`
- `src/orders/orders.service.ts` — add state transition validation in `updateStatus()`
- `src/orders/orders.service.spec.ts` — add state transition test cases
- `test/orders.e2e-spec.ts` — replace the "any status" test, add blocked transition tests

**Verification**: `pnpm test` and `pnpm test:e2e` must pass.

---

### 3. Controller unit tests (stub-only specs → proper tests)

**Context**: `products.controller.spec.ts`, `orders.controller.spec.ts`, and `auth.controller.spec.ts` all contain only a single `'should be defined'` test. The mock setup is already in place (mock service objects are created), but no actual controller method behavior is tested.

**Requirements for `products.controller.spec.ts`**:
- Test each controller method: `create`, `findAll`, `findOne`, `update`, `remove`.
- For each method, mock the service's return value and verify:
  - The service method was called with the correct arguments.
  - The `res.status()` was called with the correct HTTP status code.
  - The `res.json()` was called with the service's return value (or `res.send()` for 204).
- Create a mock `Response` object with `status()` returning `{ json: jest.fn(), send: jest.fn() }`.
- Test that `create` calls `res.status(201).json(product)`.
- Test that `findAll` passes the query DTO to the service.
- Test that `remove` calls `res.status(204).send()`.

**Requirements for `orders.controller.spec.ts`**:
- Same pattern as products, but also verify that `req['user'].subscriber` is correctly passed as `client_id`.
- Test `create`, `findAll`, `findOne`, `updateStatus`.
- Create a mock `Request` object: `{ user: { subscriber: 'test-user-id' } }`.

**Requirements for `auth.controller.spec.ts`**:
- Test `login` delegates to `authService.login(dto.username, dto.password)`.
- Test `register` delegates to `authService.register(dto)`.

**Files to modify**:
- `src/products/products.controller.spec.ts`
- `src/orders/orders.controller.spec.ts`
- `src/auth/auth.controller.spec.ts`

**Verification**: `pnpm test` must pass. Check coverage with `pnpm test:cov` to confirm controller methods are covered.

---

### 4. Register endpoint e2e tests

**Context**: `test/auth.e2e-spec.ts` only tests `POST /auth/login`. The `POST /auth/register` endpoint exists and works but has no e2e test coverage.

**Requirements**:
- Add a `describe('POST /auth/register')` block in `test/auth.e2e-spec.ts`.
- Test cases:
  - Successful registration returns 201 with `{ access_token }`.
  - Duplicate username returns 409 Conflict.
  - Missing username returns 400.
  - Missing password returns 400.
  - Empty fields return 400.
  - The returned token can be used to access protected endpoints (e.g., `GET /products`).

**Files to modify**:
- `test/auth.e2e-spec.ts`

**Verification**: `pnpm test:e2e` must pass.

---

### 5. `UpdateOrderStatusDto` should be in its own file

**Context**: `src/orders/dto/create-order.dto.ts` currently exports three classes: `CreateOrderItemDto`, `CreateOrderDto`, and `UpdateOrderStatusDto`. The update DTO is unrelated to creation and should live in its own file for clarity.

**Requirements**:
- Create `src/orders/dto/update-order-status.dto.ts` with the `UpdateOrderStatusDto` class.
- Update the import in `src/orders/orders.controller.ts` to point to the new file.
- Update the import in `src/orders/orders.service.ts` to point to the new file.
- Update any test files that import `UpdateOrderStatusDto` from `create-order.dto.ts`.
- Remove the class from `create-order.dto.ts`.

**Files to modify**:
- `src/orders/dto/update-order-status.dto.ts` — **[NEW]**
- `src/orders/dto/create-order.dto.ts` — remove `UpdateOrderStatusDto`
- `src/orders/orders.controller.ts` — fix import
- `src/orders/orders.service.ts` — fix import

**Verification**: `pnpm test` and `pnpm test:e2e` must pass. `pnpm exec tsc --noEmit` must pass.

---

### 6. Health check endpoint improvement

**Context**: `GET /` returns the string `"Hello World!"`. This isn't useful for container health checks or monitoring.

**Requirements**:
- Change `AppService.getHello()` to return `{ status: 'ok', timestamp: new Date().toISOString() }`.
- Update `AppController.getHello()` return type accordingly.
- Update `app.controller.spec.ts` to match the new return shape.
- Rename the method to `health()` for clarity.

**Files to modify**:
- `src/app.service.ts`
- `src/app.controller.ts`
- `src/app.controller.spec.ts`
- `test/app.e2e-spec.ts` (if it tests the root endpoint)

**Verification**: `pnpm test` must pass.

---

### 7. Product price validation (must be positive integer)

**Context**: `CreateProductDto` validates that `price` is a number (`@IsNumber()`) but does not enforce that it must be a positive integer. The database column is `INT`, so decimals will be silently truncated. A negative price is accepted.

**Requirements**:
- Add `@IsInt()` and `@Min(1)` (or `@IsPositive()`) to `price` in `CreateProductDto`.
- Update unit tests to verify that decimal and negative prices are rejected by the DTO.
- Update e2e tests if any send floating-point prices.

**Files to modify**:
- `src/products/dto/create-product.dto.ts`

**Verification**: `pnpm test` and `pnpm test:e2e` must pass.

---

### 8. User entity `toJSON()` method

**Context**: The `User` entity (`src/auth/entities/user.entity.ts`) does NOT have a `toJSON()` method. All other entities (Product, Order, OrderItem) define `toJSON()` to control serialization. If a User entity is ever serialized in a response, the raw column names (`pk_user`, `tx_username`) and the `tx_password` hash would be exposed.

**Requirements**:
- Add a `toJSON()` method to the `User` entity that returns `{ id, username, created_at, updated_at }` — explicitly EXCLUDING `tx_password`.
- This is a safety improvement even though the current auth endpoints only return `{ access_token }`.

**Files to modify**:
- `src/auth/entities/user.entity.ts`

**Verification**: `pnpm test` must pass. Manually verify that `JSON.stringify(new User())` does not include the password.

---

## How to Work on Tasks

1. Pick a task from the Pending section above.
2. Read the "Files to modify" section carefully — it tells you exactly which files to touch.
3. Follow the established patterns described in "Key Patterns" above.
4. Run `pnpm test` (unit) and `pnpm test:e2e` (integration, requires PostgreSQL) before committing.
5. Run `pnpm exec tsc --noEmit` to verify no type errors.
6. Use conventional commits: `feat:`, `fix:`, `test:`, `refactor:`.
7. Mark the task as `[x]` in this file when complete.

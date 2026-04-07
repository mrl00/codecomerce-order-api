# AGENTS.md — codecommerce/nestjs-api

## Commands

| Task              | Command                                              |
| ----------------- | ---------------------------------------------------- |
| Install deps      | `pnpm install`                                       |
| Dev server        | `pnpm run start:dev`                                 |
| Build             | `pnpm run build`                                     |
| Lint              | `pnpm run lint`                                      |
| Unit tests        | `pnpm run test`                                      |
| Integration tests | `cd tests && hurl ./*.hurl` (server must be running) |

Package manager is **pnpm**, not npm.

## Database

- Connection configured via `DATABASE_URL` environment variable (loaded by `@nestjs/config` from `.env`). Example: `postgres://postgres:qwert@localhost:5432/nestjs`.
- `synchronize: true` — schema is auto-generated on startup. Do not add manual migrations.
- Run `pnpm run fixture` to seed sample data (drops and recreates tables).

## Auth

- JWT secret loaded from `JWT_SECRET` environment variable via `ConfigService` in `src/auth/auth.module.ts`.
- Users are hardcoded in `src/auth/auth.service.ts`: `admin`/`password` and `user`/`password`.
- JWT payload contains `{ subscriber, username }`. The `subscriber` field is the client UUID used for order scoping.
- `POST /auth/login` is the **only** unauthenticated endpoint. All product and order routes require `Authorization: Bearer <token>`.

## Architecture Gotchas

- **Controllers use `@Res()` pattern** — responses are sent manually via `res.status().json()`. Do not return values directly from controller methods; it will cause double-send errors.
- **Order controller bug** (`src/orders/orders.controller.ts:39`) — `findOne` declares `client_id: string` as a plain parameter but never receives it from `@Req()`. It is always `undefined`. Fix by adding `@Req() req: Request` and using `req['user'].subscriber`.
- **Auth guard null header** (`src/auth/auth.guard.ts:31`) — `request.headers['authorization']` can be `undefined`, causing `.split()` to throw. Add a null check.
- **`client_id` is never passed in request body for orders** — it is injected from the JWT `subscriber` claim in the controller (`src/orders/orders.controller.ts:28`).
- **No DELETE endpoint for orders** — intentional design decision.
- **`nr_idx` column** on `Order` entity is defined but never populated.
- **`validateProductIds` is consolidated** — `OrdersService` injects `ProductsService` and calls `validateIds()` (no duplication).

## Conventions

- **Price is stored as `int` (cents)** — not decimal. `99900` = $999.00.
- **DB naming**: `tb_` tables, `pk_`/`fk_`/`tx_`/`nr_`/`ts_` column prefixes. See `CLAUDE.md` for full reference.
- **Entity serialization**: all entities have `toJSON()` that maps DB column names to API-friendly names. Always call `.toJSON()` or rely on Nest's serializer when returning entities.
- **`UpdateProductDto`** uses `PartialType` from `@nestjs/mapped-types` — all fields are optional.

## Testing

- Unit tests use Jest, colocated as `*.spec.ts` next to source files.
- Integration tests use Hurl in `tests/` directory. Server must be running on port 3000.
- No e2e test suite is currently configured (`test/jest-e2e.json` exists but is unused).

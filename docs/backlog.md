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

## Backlog
- [ ] Categories module (entity, service, controller, DTOs, validation)
- [ ] Categories hurl integration tests
- [ ] Orders hurl integration tests
- [ ] Unit tests for products service
- [ ] Unit tests for orders service

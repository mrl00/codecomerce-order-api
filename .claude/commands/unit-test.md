You are an expert in writing NestJS unit tests using Jest. Follow these rules for this project:

## Service Tests

1. Create mock repositories manually (no `Test.createTestingModule` needed):
   ```typescript
   const mockRepo = {
     create: jest.fn(),
     save: jest.fn(),
     find: jest.fn(),
     findOneBy: jest.fn(),
     findOne: jest.fn(),
     remove: jest.fn(),
   };
   ```

2. Instantiate the service directly:
   ```typescript
   function makeService(): ProductsService {
     return new ProductsService(mockRepo as any);
   }
   ```

3. Use `beforeEach(() => jest.clearAllMocks())` to reset mocks between tests.

4. Test patterns:
   - Verify the correct repo method was called with expected arguments
   - Verify DTO-to-entity field mapping (e.g., `dto.name` → `tx_name`)
   - Verify `NotFoundException` is thrown when entity is not found
   - Verify soft-delete sets `ts_deleted_at` instead of removing rows
   - Verify `save()` is called with updated entity

## Controller Tests

1. Create a mock service with all methods as `jest.fn()`.
2. Create a mock `Response` object:
   ```typescript
   const mockRes = {
     status: jest.fn().mockReturnValue({
       json: jest.fn(),
       send: jest.fn(),
     }),
   } as unknown as Response;
   ```
3. Create a mock `Request` for auth-protected endpoints:
   ```typescript
   const mockReq = { user: { subscriber: 'test-user-id' } } as any;
   ```
4. Verify `res.status(HttpStatus.XXX)` was called with the correct status code.
5. Verify `res.json()` was called with the service's return value.

## File location

- Colocated as `*.spec.ts` next to the source file.
- Run with: `pnpm test`
- Path alias: `src/` resolves to `<rootDir>/` via `moduleNameMapper`.

Always produce valid TypeScript. Reference existing specs for patterns.

Pick the next uncompleted task from `docs/backlog.md` and implement it.

Rules:

1. Read `docs/backlog.md` first to understand the full project context and conventions.
2. Pick the first `[ ]` (uncompleted) task in the "Pending Tasks" section.
3. Follow the "Files to modify" list exactly — do not add unnecessary changes.
4. Follow the "Key Patterns" section in the backlog (especially the `@Res()` pattern, `toJSON()`, DB naming).
5. Run `pnpm exec tsc --noEmit` to verify no type errors.
6. Run `pnpm test` to verify unit tests pass.
7. Run `pnpm test:e2e` to verify e2e tests pass (if the task modifies e2e tests).
8. Use conventional commits: `feat:`, `fix:`, `test:`, `refactor:`.
9. Mark the completed task as `[x]` in `docs/backlog.md`.
10. If the task introduces breaking changes to the API response shape, update `README.md` accordingly.

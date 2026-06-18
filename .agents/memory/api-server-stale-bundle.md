---
name: api-server stale bundle silently strips zod fields
description: When a zod-validated field is silently dropped despite correct source + generated zod, suspect a stale api-server esbuild bundle, not a code bug.
---

# api-server stale bundle silently strips zod fields

If a request field is silently dropped server-side (e.g. PATCH persists an empty
array / missing field) even though ALL source is correct — OpenAPI spec has the
field, generated `lib/api-zod` zod schema has it, and the route maps
`parsed.data.<field>` — suspect the **running api-server bundle is stale**, not a
code defect.

**Why:** the api-server imports `@workspace/api-zod` whose `package.json` exports
points to `./src/index.ts` (source), and the server is bundled by esbuild into
`artifacts/api-server/dist/index.mjs`. A `safeParse` against an OLD compiled zod
schema (built before the field existed) silently strips unknown keys, so the route
never sees the field. The dev workflow runs `pnpm run build && pnpm run start`, so
**every workflow restart rebuilds** and fixes it.

**How to apply:**
- Verify by grepping the COMPILED bundle, not the source:
  `grep -n "<SchemaName>" artifacts/api-server/dist/index.mjs` then read the
  definition lines to confirm the field is present. (Note: `grep -o` is line-based —
  a multiline zod object will give false negatives; read the lines instead.)
- Fix = restart the `artifacts/api-server: API Server` workflow (rebuilds via
  esbuild). No source edit needed if source is already correct.
- Empirical confirmation = re-run the mutation and check the DB row persisted the
  value.

#!/bin/bash
set -e
pnpm install --frozen-lockfile

# Development-only compatibility migration must run before Drizzle push:
# it normalizes any legacy duplicate surface positions before the unique
# surface/order invariant is introduced. Production schema changes are
# applied by the Publish flow, never here.
DB_MIGRATION_ENV=development pnpm --filter @workspace/db migrate:editorial
pnpm --filter db push

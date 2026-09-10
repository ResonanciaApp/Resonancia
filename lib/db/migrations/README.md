# Editorial playlist placement migration

`0001_editorial_playlist_placements.sql` is the pre-schema compatibility
migration for the normalized editorial playlist placement table.

The development post-merge hook runs it **before** Drizzle schema push through
the guarded Node runner:

```sh
DB_MIGRATION_ENV=development pnpm --filter @workspace/db migrate:editorial
pnpm --filter @workspace/db push
```

On a fresh development database, the runner explicitly reports that it is
deferring because the parent `catalog_playlists` table does not exist yet;
Drizzle then creates the new placement table. On an existing catalog database,
the SQL runs before Drizzle push.

The SQL is idempotent. If a development database already has a placement
table with duplicate `(surface, sort_order)` values, it first normalizes each
surface by `(sort_order, id)`, then creates the unique surface/order index.
The Node runner requires `DB_MIGRATION_ENV=development`, rejects
`NODE_ENV=production`, and fails if the database client cannot run; it never
silently skips the migration because `psql` is unavailable.

The current production database has no placement table. Do **not** run this
SQL against production. Publishing the feature should create the new table
from the Drizzle schema through the normal Publish schema-diff flow. If a
future production install already contains legacy placement rows, the release
operator must arrange an approved pre-schema migration using this artifact
before applying the schema diff; this repository does not run production SQL
or claim that Publish executes this SQL file.
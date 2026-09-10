# Editorial playlist/carousel migration

`0001_editorial_playlist_placements.sql` is the pre-schema compatibility
migration for the normalized legacy placement table. `0002_editorial_playlist_carousels.sql`
adds independently publishable carousels and ordered memberships, and imports
the effective legacy placement content exactly once, including Discover's
legacy `show_on_home` fallback. `0003_editorial_playlist_home_fallback.sql`
is a one-time corrective for development databases that ran the first version
of 0002 before that fallback was included.

The development post-merge hook runs it **before** Drizzle schema push through
the guarded Node runner:

```sh
DB_MIGRATION_ENV=development pnpm --filter @workspace/db migrate:editorial
pnpm --filter @workspace/db push
```

The isolated fixture regression uses a temporary schema and verifies both a
fresh id-1 migration and the one-time corrective path:

```sh
DB_MIGRATION_ENV=development pnpm --filter @workspace/db test:migrate:editorial
```

On a fresh development database, the runner explicitly reports that it is
deferring because the parent `catalog_playlists` table does not exist yet;
Drizzle then creates the new tables and the next guarded run performs the
one-time bootstrap. On an existing catalog database, the SQL runs before
Drizzle push. If non-empty carousel tables were already pushed before this
runner, the runner marks them authoritative rather than importing compatibility
writes.

The SQL is idempotent. If a development database already has a placement
table with duplicate `(surface, sort_order)` values, it first normalizes each
surface by `(sort_order, id)`, then creates the unique surface/order index.
The carousel migration uses a marker row so rerunning it never reimports
legacy placement writes or resurrects a hidden/removed carousel. It copies
only active placement rows and effective Discover home-fallback rows pointing
at active playlists into the default `Playlists para ti` and `Selecciones para
dormir` carousels; Home fields are left untouched. The corrective marker is
separate and is never replayed after an admin removes or changes a migrated
membership.
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
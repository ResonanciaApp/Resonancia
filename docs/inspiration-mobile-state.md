# Mobile Inspiration state integration

Owner: mobile-state worker. Provider wiring belongs to parent; routes/UI belong to mobile UI worker.

Mount `InspirationProvider` from `@/context/InspirationContext` **inside AuthProvider and QueryClientProvider**. Import `useInspiration` from `@/hooks/inspiration`.

## Single screen interface

`useInspiration({ weekStart?: string, date?: string, timezone?: string } = {})`

- `week: InspirationWeek | null`, `days: InspirationDay[]`, `today: string`, `timezone: string`, `weekStart: string`. Generated public DTOs from `docs/inspiration-api-contract.md`; dates are ISO YYYY-MM-DD. `days` always has seven neutral slots even before fetching. Editorial labels are `week?.settings`.
- **Use the real DTO names:** `day.id` (not `day.content.id`), `day.status` (`available`, `future`, `unavailable`), `day.content.quote` (not `phrase`), `day.content.sessionId` (not `audioId`), and `week.settings.sectionTitle` (not `title`). Derive presentation day numbers from `day.date`; audio title/duration/Premium come from the existing session catalog, not invented content fields.
- `loading: boolean`, `error: string | null`, `isCached: boolean`, `retry(): Promise<unknown>`.
- `favorites: InspirationFavorite[]` (local normalized records, with `inspirationId`, optional `day` for public availability and `date`; **not session favorite IDs**).
- `isFavorite(inspirationId): boolean`, `setFavorite(inspirationId, saved: boolean): Promise<void>`.
- `notes: InspirationNote[]`, `listNotes(inspirationId?: string): InspirationNote[]`.
- `createNote(inspirationId, text): Promise<InspirationNote>`, `updateNote(noteId, text): Promise<void>`, `deleteNote(noteId): Promise<void>`. UI must confirm deletion and protect unsaved edits. Text 1–20000 characters.
- Notes have `id, inspirationId, text, revision, updatedAt, deletedAt`, optional `date`, `conflictOf`, `localOnly`. `localOnly` recovery copies preserve losing conflict text and must be labeled “Copia recuperada — pendiente de revisión”; editing/saving one explicitly queues it as a fresh note. No silent upload or revival of deleted UUIDs.
- `ready`, `syncStatus: "loading" | "guest" | "idle" | "syncing" | "pending" | "error"`, `pendingCount`, `syncError: string | null`, `retrySync(): Promise<void>`.
- `guestImportAvailable: boolean`, `importGuestData({confirmed:true}): Promise<void>`, `dismissGuestImport(): Promise<void>`. Ask explicitly before import. Guest originals remain local; repeated consent never duplicates IDs. Import and dismissal are per account.

All mutation promises mean **durably saved locally**, not necessarily synced. Display pending/error status and offer retry; offline changes are retained. Storage errors reject rather than falsely claiming a save. Never include notes in share images.

## Isolation and cache rules

Private AsyncStorage keys are `@resonancia:inspiration:v1:guest` / `…:user:<encoded Clerk ID>`. Auth transitions hide old state immediately, abort old network work, and never upload guest data automatically. Sync reads full owner snapshots including tombstones before writes; only exact acknowledged operation sequences are removed. New in-flight local edits survive an older acknowledgment. Remote tombstones win stale edits; text is preserved in local recovery copies. Conflict responses never blindly overwrite a newer remote revision.

Weekly cache is public, bounded, and keyed by timezone and Monday. Successful unavailable/future positions replace old public content (including matching saved metadata). Transient transport errors preserve last successful data with explicit stale/error state. Future slots contain null ID/content; device time never unlocks a cached future slot. Foreground and midnight trigger revalidation.

Withdrawal revision fences survive reload and reject late responses from the withdrawn publication revision; only a genuinely newer publication may return. A private saved-item response confirming withdrawal also invalidates its public week cache. Internal cross-zone catalog and tombstone maps are deliberately not returned by the screen hook.

Future gates also persist a confirmation fence. A response from a request started before that gate cannot restore the payload, even with a higher publication revision. A **fresh** server-authorized request can unlock the same publication revision on its arrival day: future gating does not require editorial republication. Generated `useGetInspirationWeek`/`getInspirationWeek` are retained; response identity carries request-start metadata in a WeakMap, with React Query structural sharing disabled for this small DTO.

Equal-revision active favorite snapshots cannot resurrect an acknowledged tombstone. A genuinely newer server revision may intentionally restore the favorite, as specified by the API contract.

### Required account-deletion integration (parent-owned screen)

`clearInspirationAccountData(clerkUserId)` now installs a synchronous in-memory owner revocation barrier, aborts registered sessions, hides their state, drains all queued/in-flight private writes (including unmounted providers), and **then** removes storage. Removal errors remain explicit and cleanup can be retried. Subsequent same-owner sessions/writes remain blocked for this runtime. No private text is placed in the revocation marker.

The actual server-delete path is `app/configuraciones.tsx`, in the action currently calling `deleteMyAccount` → `removeLocalAccountData` → `logout`. Parent must capture `clerkUserId` from `useAuth()` before deletion and insert `await clearInspirationAccountData(deletedOwner)` **immediately after successful `deleteMyAccount` and before broad local cleanup/logout**. Merely calling `removeLocalAccountData()` is insufficient because it cannot stop provider writers. Do not call the revocation helper on ordinary logout or on a failed server deletion. The separate “Borrar todo” local-reset path is not a confirmed server account deletion.

## Verification

Run pure focused tests: `node --experimental-strip-types --test artifacts/mobile/lib/inspiration-state.test.mjs` (34 passing).
No package changes. Native/offline network validation remains parent/device testing work.
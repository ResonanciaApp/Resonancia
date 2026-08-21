---
name: DB-only sessions in mobile
description: How catalog snapshot hydration works for bundled vs DB-only sessions, and how audio/image resolution is prioritized.
---

## Rule
`applyCatalogSnapshot` runs in two phases:

**Phase 1 — existing bundled sessions (hydrate in-place)**  
- ALL metadata fields are overwritten from DB.  
- `audioUri` / `voiceUri`: always set from `r.audioFiles` when the DB has files (no guard). Admin-uploaded audio replaces the bundle equivalent.  
- `image`: updated from `r.imageUrl` **only when the URL is not a key in `BUNDLED_SESSION_IMAGES`** (i.e., it's an objectPath, not a bundled asset filename). Bundled images remain untouched when the DB still points to the bundle key.  
- Fields with "only-if-true" semantics (skipDetail, skipMiniPlayer, isLoop): only applied when DB value is `true` (false must not clobber bundle defaults).

**Phase 2 — DB-only sessions (insert new)**  
- Full Session object is constructed and pushed to SESSIONS.  
- `image` resolution: `BUNDLED_SESSION_IMAGES[r.imageUrl]` → objectPath URI → fallback to session-2.jpg.  
- `audioUri` / `voiceUri` resolved via `resolveObjectPath`.

## Audio priority in PlayerContext
**DB audio wins over bundle**:  
`(session.audioUri ? { uri: session.audioUri } : undefined) ?? AUDIO_MAP[session.id]`

This means admin-uploaded audio for a bundled session is always used when `audioUri` is set.  
Previously the order was reversed (`AUDIO_MAP ?? audioUri`), making admin audio uploads invisible.

## Why
Admin uploads to the DB must be authoritative. AUDIO_MAP is the fallback for sessions that have no DB audio. Reversing the priority was the correct semantic: "DB is source of truth, bundle is the default."

## How to apply
- Do NOT revert the AUDIO_MAP priority order in PlayerContext.
- Do NOT add a `!local.audioUri` guard back to phase 1 — it blocked admin audio updates.
- After admin changes a session's photo or audio, the mobile app picks up the change on the next catalog re-fetch (React Query stale time). Users may need to restart the app or wait for the background refresh.

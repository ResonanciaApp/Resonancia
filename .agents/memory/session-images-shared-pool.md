---
name: session image shared pool
description: session-N.jpg files are a shared decorative pool, not owned by one session — deleting a session must not naively delete/remove them
---

# session-N.jpg is a shared decorative pool

The `assets/images/sessions/session-N.jpg` files are reused as a generic image
gallery/avatar pool across the app, NOT exclusively as a given session's cover.

**Where they're reused:** group galleries (`app/grupo/crear.tsx`, `app/grupo/[id].tsx`,
`app/grupos.tsx`), avatars in `components/QuoteOfTheDay.tsx`, and as placeholder covers
for other surviving sessions in `data/sessions.ts`.

**Why it matters:** when deleting a session, you cannot just delete its `session-N.jpg`
or remove its entry from a GALLERY array:
- Deleting the file breaks every other screen that references it.
- Groups persist `imageIdx` (an INDEX into the GALLERY array), so removing entries
  shifts indices and corrupts saved group images.

**How to apply:** repoint references to a surviving image *in place* (keep array
length/order stable), then it's safe to delete the now-unreferenced file. Always
`rg 'session-N\.jpg'` across `app components data hooks` after deleting a session to
catch shared references.

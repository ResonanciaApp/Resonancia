---
name: Chat optimistic uploads + audio preload
description: Pattern used in artifacts/mobile/app/chat/[userId].tsx for instant-feeling image/audio sends and instant audio playback.
---

Chat (DM) image and audio sends use a local `pending: PendingAttachment[]` state, NOT react-query optimistic cache mutation. The pending list is rendered inside the FlatList's `ListHeaderComponent` (FlatList is `inverted`, so the header sits at the bottom = newest position).

**Why local state instead of `queryClient.setQueryData`:** the server message shape (`DirectMessage`) requires a real numeric `id` and timestamps the client cannot fabricate cleanly, and image/audio needs a local preview URI before upload completes. Local pending state avoids polluting the server cache with synthetic rows.

**Dedup contract:** every pending entry, once upload finishes, gets `serverObjectPath` set to the GCS objectPath returned by `uploadLocalFile`. A `useEffect` watches `messagesQ.data` and removes any pending whose `serverObjectPath` matches an `attachmentUrl` already in the server list. This is the only safe way to avoid a brief duplicate bubble between `mutateAsync` resolving and the next refetch returning the real message.

**Why:** without the serverObjectPath dedup, clearing pending after `await mutateAsync` either (a) shows a gap (pending removed, server msg not refetched yet) or (b) shows a duplicate (pending still there when refetch completes). The objectPath match handles both cases — the bubble swaps cleanly only when the server row arrives.

**How to apply:** any future attachment kind (video, file, etc.) in chat should follow the same pattern — push to `pending` with a `tempId`, kick off upload+mutateAsync in a fire-and-forget IIFE, set `serverObjectPath` once upload succeeds, mark `failed: true` on error. Do NOT remove from pending manually after mutateAsync — let the dedup effect handle it.

## Audio preload on mount (AudioAttachment)

Native `Audio.Sound.createAsync({ uri }, { shouldPlay: false })` is called in `useEffect([url])` so first tap of the play button only calls `playAsync()` (instant). Without preload, first tap took 300-800ms while the file loaded.

**Trade-off:** every visible audio bubble holds a native Sound instance. FlatList virtualization (windowSize default ~21) keeps this bounded — only on-screen + nearby bubbles are mounted. The unload happens in the cleanup return. Acceptable for typical chat history; revisit if users complain about memory on long audio-heavy threads.

## Voice recording bitrate

Voice recordings use 22050 Hz mono 48 kbps AAC (not 44.1 kHz stereo 192 kbps). ~8x smaller files = ~8x faster upload, voice intelligibility unaffected. Image picker `quality: 0.7` (down from 0.85) for the same reason.

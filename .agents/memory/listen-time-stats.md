---
name: Listen-time stat accounting
description: How "minutes listened" stats are measured in the player, and why position-based elapsed must not be used
---

# Listen-time stats = wall-clock accumulator, not `elapsed`/position

StatEvents (minutes for "Mi viaje" / racha / Minutos) must count **time actually
playing**, accumulated by wall clock, gated on `isPlaying` transitions.

**The rule:** never derive stat minutes from `elapsed` or audio position.

**Why:**
- `elapsed` is position-based for real audio (set from `currentTime`, and rewritten
  by `seekTo`) → seeking forward grants unlistened minutes, seeking back erases real ones.
- The loop/simulation countdown interval increments `elapsed` even while paused →
  paused time would be counted as listened.
- Reading `elapsed` state at completion handlers is one render stale.

**How it works now (PlayerContext):**
- `listenedSecondsRef` (accumulator) + `playStartRef` (chunk-start ms, null while paused).
- `startStatTracking(session)` inits tracker, resets accumulator, leaves clock stopped.
- Clock starts at the *confirmed-play* moment: a `[isPlaying]` effect handles
  stopped→play and pause→resume; `markPlayStarted()` (idempotent) covers the
  session-switch path where `isPlaying` stays true so the effect never fires.
- `flushActiveStat()` closes the open chunk, records via `recordStat` (ignores <30s,
  `minutes = max(1, round(s/60))`), clears refs — idempotent (tracker nulled first).
- Flush points: top of each play (flush previous), stop, didJustFinish, sim/loop
  interval end, sleep-timer-zero, unmount.

**Known accepted gap:** if the OS hard-kills the app mid-session (no unmount/stop),
that tail chunk is lost. Acceptable for v1; would need an AppState background flush.

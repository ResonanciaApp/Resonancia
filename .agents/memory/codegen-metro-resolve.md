---
name: codegen clean breaks Metro resolution
description: Why Expo/Metro throws "Unable to resolve ./generated/api" right after running api-spec codegen, and the fix.
---

Running `pnpm --filter @workspace/api-spec run codegen` uses Orval with `clean: true`, which **deletes** `lib/api-client-react/src/generated/` (and api-zod) before regenerating. If the Expo Metro bundler is watching during that window, it caches an "Unable to resolve module ./generated/api" error and a cascading "Invalid hook call" in whatever screen imports `@workspace/api-client-react`.

**Why:** Metro's resolution failure is transient — the file is regenerated within the same command — but Metro does not auto-recover its module graph after the file reappears.

**How to apply:** After any codegen run, restart the `artifacts/mobile: expo` workflow (the user's "RA") to clear Metro's cache. Verify the file exists on disk (`ls lib/api-client-react/src/generated/api.ts`) before assuming a real bug. typecheck passing while Metro errors = stale Metro cache, not a code problem.

**Same symptom, other trigger:** adding a new native module (e.g. `react-native-purchases`) and wiring it into a provider can produce a phantom "Invalid hook call" in the browser console from a stale Metro bundle, even when there is only ONE react copy in the pnpm store (verify with `ls node_modules/.pnpm/react@*` + compare `readlink -f` of nested copies — all symlink to the same store entry). Don't chase duplicate-React theories first: restart expo to rebuild the bundle; the error clears if it was just stale Metro.

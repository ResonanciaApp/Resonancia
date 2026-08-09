---
name: metro.config.js clobbered
description: metro.config.js for the mobile artifact can get stripped to ~10 lines, losing all monorepo configuration and causing duplicate React instances + expo-router entry resolution failure.
---

## Rule
The full metro.config.js lives at `artifacts/mobile/metro.config.js`. A backup is kept at `metro.config.js.bak`. If the file is ever stripped, restore from the backup (or git).

**Why:** Replit agent sessions or external tools occasionally overwrite the file with a minimal stub. Without the full config, two bugs appear immediately:
1. `Cannot read property 'useContext' of null` — three React versions (19.1.0, 19.2.3, 19.2.8) in pnpm; the `resolveRequest` redirect that rewrites `react@19.2.x → react@19.1.0` is missing.
2. `Unable to resolve module ./node_modules/.pnpm/expo-router.../entry from /home/runner/workspace/.` — Metro projectRoot resolves as workspace root; without `/home/runner/workspace/node_modules` in watchFolders, HasteFS can't find the pnpm store path for expo-router/entry.

## watchFolders — do NOT filter node_modules
Do NOT add a filter that removes paths containing "node_modules" from watchFolders. The pnpm store at `/home/runner/workspace/node_modules/.pnpm` has only ~6000 directories (well under the 65536 inotify limit). Filtering it out breaks Metro's HasteFS: it can no longer resolve the expo-router entry module when Metro uses the workspace root as its effective projectRoot.

**Why the concern was wrong:** The original "inotify exhaustion" comment was overcautious. Measured: ~6000 dirs at depth 3 in the pnpm store — safe.

## Key config sections that must be present

```js
config.projectRoot = __dirname;  // MUST be explicit

// watchFolders: keep as-is (do NOT filter node_modules — see above)

config.resolver.extraNodeModules = {
  react: REACT_PATH,        // → react@19.1.0 in pnpm store
  "react-native": REACT_NATIVE_PATH,
};

// resolveRequest: redirect react@19.2.x → 19.1.0, deduplicate expo-modules-core, null-stub specs_DEPRECATED
```

## pnpm exec expo — workspace root binary hijack
`pnpm exec expo` in a pnpm workspace resolves the `expo` binary from the workspace ROOT's `node_modules/.bin/expo` (which points to `expo@57` pulled in by `react-native-audio-api`), NOT mobile's local `expo@54`. This makes Expo CLI generate manifest bundle URLs relative to the workspace root → "Unable to resolve module ./node_modules/.pnpm/expo-router@6.0.24_<hash>/entry from /home/runner/workspace/."

**Fix**: the `dev` script in `artifacts/mobile/package.json` must use `./node_modules/.bin/expo start` (explicit local path) instead of `pnpm exec expo start`.

## react-native path note
The pnpm hash for react-native@0.81.5 changed from `@babel+core@7.29.0` to `@babel+core@7.29.7`. Always verify with:
```
ls node_modules/.pnpm/ | grep "^react-native@0.81.5"
```
before restoring the backup path.

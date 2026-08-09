---
name: metro.config.js clobbered
description: metro.config.js for the mobile artifact can get stripped to ~10 lines, losing all monorepo configuration and causing duplicate React instances + expo-router entry resolution failure.
---

## Rule
The full metro.config.js lives at `artifacts/mobile/metro.config.js`. A backup is kept at `metro.config.js.bak`. If the file is ever stripped, restore from the backup (or git).

**Why:** Replit agent sessions or external tools occasionally overwrite the file with a minimal stub. Without the full config, two bugs appear immediately:
1. `Cannot read property 'useContext' of null` — three React versions (19.1.0, 19.2.3, 19.2.8) in pnpm; the `resolveRequest` redirect that rewrites `react@19.2.x → react@19.1.0` is missing.
2. `Unable to resolve module ./node_modules/.pnpm/expo-router.../entry from /home/runner/workspace/.` — `config.projectRoot = __dirname` is missing, so Metro uses process.cwd() (workspace root) as origin.

## Key config sections that must be present

```js
config.projectRoot = __dirname;  // MUST be explicit

config.watchFolders = (config.watchFolders ?? []).filter(
  (f) => !f.includes("node_modules")  // prevent inotify exhaustion
);

config.resolver.extraNodeModules = {
  react: REACT_PATH,        // → react@19.1.0 in pnpm store
  "react-native": REACT_NATIVE_PATH,
};

// resolveRequest: redirect react@19.2.x → 19.1.0, deduplicate expo-modules-core, null-stub specs_DEPRECATED
```

## react-native path note
The pnpm hash for react-native@0.81.5 changed from `@babel+core@7.29.0` to `@babel+core@7.29.7`. Always verify with:
```
ls node_modules/.pnpm/ | grep "^react-native@0.81.5"
```
before restoring the backup path.

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

// ── Force projectRoot to THIS directory ───────────────────────────────────────
// pnpm runs scripts from the workspace root; without this, Metro computes
// the Expo Router virtual entry relative to process.cwd() (the workspace root)
// and produces paths like "./node_modules/.pnpm/expo-router.../entry from /home/runner/workspace/."
config.projectRoot = __dirname;

// ── Remove unstable_workerThreads ─────────────────────────────────────────────
// @expo/metro-config@54.x sets watcher.unstable_workerThreads = false, but
// newer Metro versions (used in EAS build validation) don't recognise this key
// → "Unknown option 'watcher.unstable_workerThreads' with value false".
// Deleting it here suppresses the warning without affecting any behaviour —
// the option was already false (disabled).
if (config.watcher) {
  delete config.watcher.unstable_workerThreads;
}

// ── watchFolders ──────────────────────────────────────────────────────────────
// getDefaultConfig() adds the workspace node_modules root + all workspace
// packages to watchFolders so Metro can resolve cross-package imports.
// Measured: ~6 000 dirs in .pnpm at depth 3 — well under the 65 536 inotify
// limit. Keep all watchFolders as-is so Metro's HasteFS includes the pnpm
// store; without it Metro can't find expo-router/entry from the bundle URL.

const NULL_STUB = path.resolve(__dirname, "mocks/null-stub.js");

// Deduplicate expo-modules-core: react-native-audio-api pulls in
// expo-modules-core@57.x (new versioning scheme for RN 0.86), and pnpm's
// global fallback (.pnpm/node_modules) points at it. Expo SDK 54 modules
// (expo-blur, expo-symbols, expo-linear-gradient, ...) import
// "expo-modules-core" without having it in their own pnpm context, so they
// fall through to the 57.x copy. Its requireNativeViewManager() generates
// ViewManagerAdapter_<Module>_<hash> names whose hash doesn't match what the
// dev client (built against 3.x) registered → "View config getter callback
// must be a function (received undefined)".
// Fix: intercept every "expo-modules-core" module request and resolve it
// from inside the 3.x instance's own directory, so the whole bundle shares
// the single copy the dev client was built with. (Note: 3.x ships source —
// main: src/index.ts — while 57.x ships build/*.js, so rewriting resolved
// file paths does NOT work; the request itself must be re-resolved.)
const PNPM_DIR = path.resolve(__dirname, "../../node_modules/.pnpm");
let EMC_GOOD_PKG = null;
try {
  const emcGoodDir = fs
    .readdirSync(PNPM_DIR)
    .find((d) => d.startsWith("expo-modules-core@3."));
  if (emcGoodDir) {
    EMC_GOOD_PKG = path.join(
      PNPM_DIR,
      emcGoodDir,
      "node_modules",
      "expo-modules-core"
    );
  }
} catch (e) {
  // .pnpm dir not found — leave redirect disabled
}

// Force all modules in the bundle to use the SAME React instance.
// react-native-audio-api pulls in react-native@0.86.0 + react-worklets which
// peer-depend on react@19.2.x, creating a second React copy. The React
// Compiler runtime (react/compiler-runtime) calls resolveDispatcher() which
// reads React's internal dispatcher — if that React instance is different
// from the one used to render the component tree, the dispatcher is null →
// "Cannot read property 'useContext' of null".
const REACT_PATH = path.resolve(
  __dirname,
  "../../node_modules/.pnpm/react@19.1.0/node_modules/react"
);
const REACT_NATIVE_PATH = path.resolve(
  __dirname,
  "../../node_modules/.pnpm/react-native@0.81.5_@babel+core@7.29.7_supports-color@8.1.1__@types+react@19.1.17_react@19.1.0_supports-color@8.1.1/node_modules/react-native"
);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    react: REACT_PATH,
    "react-native": REACT_NATIVE_PATH,
  },
};

// Redirect ANY react-native version's src/private/specs_DEPRECATED or
// src/private/components/virtualview files to a null stub.
// These are codegen-only schema files incompatible with the dev client's
// bundled codegen version. Patching in-place (node_modules) is the primary
// fix; this resolver acts as a second safety net.
const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Deduplicate expo-modules-core: force EVERY import of it to resolve from
    // the 3.x instance's own context (the copy the dev client's native side
    // was built with). Fixes the whole family of
    // "ViewManagerAdapter_<Module>_<hash> must be a function" errors
    // (ExpoBlurView, SymbolModule, ExpoLinearGradient, ...) caused by the
    // 57.x copy that react-native-audio-api pulled in.
    if (
      EMC_GOOD_PKG &&
      (moduleName === "expo-modules-core" ||
        moduleName.startsWith("expo-modules-core/")) &&
      !context.originModulePath.startsWith(EMC_GOOD_PKG)
    ) {
      const redirectedContext = {
        ...context,
        originModulePath: path.join(EMC_GOOD_PKG, "index.js"),
      };
      return originalResolveRequest
        ? originalResolveRequest(redirectedContext, moduleName, platform)
        : redirectedContext.resolveRequest(
            redirectedContext,
            moduleName,
            platform
          );
    }

    let resolved;
    try {
      if (originalResolveRequest) {
        resolved = originalResolveRequest(context, moduleName, platform);
      } else {
        resolved = context.resolveRequest(context, moduleName, platform);
      }
    } catch (e) {
      throw e;
    }

    if (resolved && resolved.type === "sourceFile") {
      let fp = resolved.filePath;

      // Deduplicate React: pnpm created twin instances keyed on react@19.2.x
      // (pulled in by react-native-audio-api → react-native@0.86.0 peers).
      // lib/api-client-react's @tanstack/react-query resolves to the
      // _react@19.2.x variant whose require('react') returns a SECOND React
      // copy — its internal dispatcher is null (the renderer initialized the
      // 19.1.0 copy) → "Cannot read property 'useContext' of null".
      // Rewrite any file inside a react@19.2.x-keyed instance to its
      // react@19.1.0 twin (same package versions, only the peer differs).
      if (fp.includes("react@19.2.")) {
        const rewritten = fp.replace(/react@19\.2\.\d+/g, "react@19.1.0");
        if (fs.existsSync(rewritten)) {
          return { filePath: rewritten, type: "sourceFile" };
        }
      }

      // Intercept specs_DEPRECATED/components/ — codegen component schemas that
      // were compiled with StubComponent fallbacks incompatible with this dev client.
      // Do NOT intercept specs_DEPRECATED/modules/ (real TurboModules with getConstants etc.)
      // EXCEPTION: RCTModalHostViewNativeComponent is the native view behind
      // React Native's <Modal>; stubbing it makes every Modal render into
      // nothing silently (visible=true but no window appears). It must load
      // for real.
      if (
        /node_modules[\\/]react-native[\\/]src[\\/]private[\\/](specs_DEPRECATED[\\/]components[\\/]|components[\\/]virtualview[\\/])/.test(fp) &&
        !fp.includes("RCTModalHostViewNativeComponent") &&
        // EXCEPTION: SwitchNativeComponent (+ Android twin) is the native view
        // behind <Switch>; stubbing it makes every Switch render nothing.
        !/[\\/](Android)?SwitchNativeComponent\.js$/.test(fp)
      ) {
        return { filePath: NULL_STUB, type: "sourceFile" };
      }

    }

    return resolved;
  },
};

module.exports = config;

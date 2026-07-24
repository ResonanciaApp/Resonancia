const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const fs = require("fs");

const config = getDefaultConfig(__dirname);

const NULL_STUB = path.resolve(__dirname, "mocks/null-stub.js");
const NATIVE_LG_STUB = path.resolve(__dirname, "mocks/native-linear-gradient-stub.js");

// Force all modules in the bundle to use the SAME React instance.
// react-native-audio-api pulls in react-native@0.86.0 + react-worklets which
// peer-depend on react@19.2.8, creating a second React copy. The React
// Compiler runtime (react/compiler-runtime) calls resolveDispatcher() which
// reads React's internal dispatcher — if that React instance is different
// from the one used to render the component tree, the dispatcher is null →
// "Cannot read property 'useMemoCache' of null".
const REACT_PATH = path.resolve(
  __dirname,
  "../../node_modules/.pnpm/react@19.1.0/node_modules/react"
);
const REACT_NATIVE_PATH = path.resolve(
  __dirname,
  "../../node_modules/.pnpm/react-native@0.81.5_@babel+core@7.29.0_supports-color@8.1.1__@types+react@19.1.17_react@19.1.0_supports-color@8.1.1/node_modules/react-native"
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

      // Deduplicate React: pnpm created twin instances keyed on react@19.2.8
      // (pulled in by react-native-audio-api → react-native@0.86.0 peers).
      // lib/api-client-react's @tanstack/react-query resolves to the
      // _react@19.2.8 variant whose require('react') returns the SECOND React
      // copy — its internal dispatcher is null (the renderer initialized the
      // 19.1.0 copy) → "Cannot read property 'useContext' of null".
      // Rewrite any file inside a react@19.2.8-keyed instance to its
      // react@19.1.0 twin (same package versions, only the peer differs).
      if (fp.includes("react@19.2.8")) {
        const rewritten = fp.replace(/react@19\.2\.8/g, "react@19.1.0");
        if (fs.existsSync(rewritten)) {
          return { filePath: rewritten, type: "sourceFile" };
        }
      }

      // Intercept specs_DEPRECATED/components/ — codegen component schemas that
      // were compiled with StubComponent fallbacks incompatible with this dev client.
      // Do NOT intercept specs_DEPRECATED/modules/ (real TurboModules with getConstants etc.)
      if (
        /node_modules[\\/]react-native[\\/]src[\\/]private[\\/](specs_DEPRECATED[\\/]components[\\/]|components[\\/]virtualview[\\/])/.test(fp)
      ) {
        return { filePath: NULL_STUB, type: "sourceFile" };
      }

      // TEMPORARY: redirect expo-linear-gradient's iOS native component to a solid-color
      // fallback until the dev client is rebuilt with matching expo-modules-core version.
      // The native ExpoLinearGradient ViewManager hash doesn't match what the dev client
      // registered, causing "View config getter callback must be a function" at runtime.
      if (
        /expo-linear-gradient[\\/]build[\\/]NativeLinearGradient\.ios\.js$/.test(fp)
      ) {
        return { filePath: NATIVE_LG_STUB, type: "sourceFile" };
      }
    }

    return resolved;
  },
};

module.exports = config;

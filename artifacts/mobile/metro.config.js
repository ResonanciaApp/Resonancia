const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const NULL_STUB = path.resolve(__dirname, "mocks/null-stub.js");
const NATIVE_LG_STUB = path.resolve(__dirname, "mocks/native-linear-gradient-stub.js");

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
      const fp = resolved.filePath;

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

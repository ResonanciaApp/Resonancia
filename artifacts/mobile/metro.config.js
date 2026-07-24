const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const NULL_STUB = path.resolve(__dirname, "mocks/null-stub.js");

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

    if (
      resolved &&
      resolved.type === "sourceFile" &&
      // Only intercept specs_DEPRECATED/components/ (visual component schemas that
      // had requireNativeComponent('StubComponent') fallbacks).
      // Do NOT intercept specs_DEPRECATED/modules/ — those are real TurboModules
      // with getConstants() and other methods that must work at runtime.
      /node_modules[\\/]react-native[\\/]src[\\/]private[\\/](specs_DEPRECATED[\\/]components[\\/]|components[\\/]virtualview[\\/])/.test(
        resolved.filePath
      )
    ) {
      return { filePath: NULL_STUB, type: "sourceFile" };
    }

    return resolved;
  },
};

module.exports = config;

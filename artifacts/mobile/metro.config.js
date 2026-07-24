const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Intercept VirtualView imports from react-native@0.86.0 so they resolve to
// a safe stub instead of triggering the incompatible codegen flow.
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (
      moduleName.endsWith("VirtualViewNativeComponent") ||
      moduleName.endsWith("VirtualViewExperimentalNativeComponent")
    ) {
      return {
        filePath: path.resolve(__dirname, "mocks/VirtualViewNativeComponent.js"),
        type: "sourceFile",
      };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

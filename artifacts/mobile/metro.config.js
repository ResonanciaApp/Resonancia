const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Workaround: RN 0.81.5 VirtualViewNativeComponent (and RN 0.86 Experimental variant)
// use nested $ReadOnly<{}> / Readonly<{}> types that @react-native/codegen can't parse.
// Redirect both to a stub that uses requireNativeComponent (no codegen trigger).
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

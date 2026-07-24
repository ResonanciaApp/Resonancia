const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Workaround: RN 0.86.0 bug — VirtualViewExperimentalNativeComponent uses nested
// Readonly<{}> types that @react-native/codegen@0.81.5 can't parse → bundling fails.
// Redirect the module to a simple requireNativeComponent stub that skips codegen.
const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName.endsWith("VirtualViewExperimentalNativeComponent")) {
      return {
        filePath: path.resolve(__dirname, "mocks/VirtualViewExperimentalNativeComponent.js"),
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

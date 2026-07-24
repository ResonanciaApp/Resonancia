const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Custom Babel transformer: strips codegenNativeComponent from react-native@0.86.0
// files before Babel processes them, preventing @react-native/codegen@0.81.5 crash.
config.transformer = {
  ...config.transformer,
  babelTransformerPath: path.resolve(__dirname, "metro-babel-transformer.js"),
};

// Also intercept module resolution for VirtualView stubs
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

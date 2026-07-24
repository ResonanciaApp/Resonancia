'use strict';

/**
 * Custom Metro Babel transformer.
 *
 * react-native@0.86.0 ships component files that use Flow types incompatible
 * with @react-native/codegen@0.81.5 (ReadonlyArray, nested Readonly<{}>).
 * The codegen Babel plugin parser is already patched to handle those types,
 * but as a safety net: if any RN@0.86.0 file still triggers a codegen error,
 * we replace it with a stub that calls requireNativeComponent with a unique name
 * derived from the filename (avoids "two views with the same name" collision).
 */

const path = require('path');
const upstreamTransformer = require('@expo/metro-config/build/babel-transformer');

function uniqueNameFromFile(filename) {
  const base = path.basename(filename, '.js');
  // e.g. RCTModalHostViewNativeComponent → RCTModalHostView
  return base.replace(/NativeComponent$/, '').replace(/Experimental$/, '');
}

module.exports = {
  ...upstreamTransformer,
  transform(transformerArgs) {
    const { filename, src } = transformerArgs;

    if (
      filename.includes('react-native@0.86.0') &&
      src.includes('codegenNativeComponent')
    ) {
      const viewName = uniqueNameFromFile(filename);
      const stubSrc =
        "'use strict';\n" +
        "const { requireNativeComponent } = require('react-native');\n" +
        `module.exports = requireNativeComponent('${viewName}');\n`;
      return upstreamTransformer.transform({ ...transformerArgs, src: stubSrc });
    }

    return upstreamTransformer.transform(transformerArgs);
  },
};

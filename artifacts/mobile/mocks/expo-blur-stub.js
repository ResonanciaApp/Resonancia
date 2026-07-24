// TEMPORARY stub for expo-blur's BlurView.
// The dev client registered ViewManagerAdapter_ExpoBlurView_<hash> with a hash
// that doesn't match this expo-modules-core version → "View config getter
// callback must be a function (received undefined)".
// Fallback: semi-opaque tinted View (no real blur). Remove after the dev
// client is rebuilt with EAS.
"use strict";

const React = require("react");
const { View } = require("react-native");

const TINT_COLORS = {
  light: "rgba(255,255,255,0.85)",
  dark: "rgba(15,5,10,0.9)",
  default: "rgba(20,8,14,0.88)",
  extraLight: "rgba(255,255,255,0.92)",
  regular: "rgba(20,8,14,0.88)",
  prominent: "rgba(15,5,10,0.92)",
  systemUltraThinMaterialDark: "rgba(15,5,10,0.82)",
  systemThinMaterialDark: "rgba(15,5,10,0.86)",
  systemMaterialDark: "rgba(15,5,10,0.9)",
  systemThickMaterialDark: "rgba(15,5,10,0.94)",
  systemChromeMaterialDark: "rgba(15,5,10,0.9)",
};

class BlurView extends React.Component {
  blurViewRef = React.createRef();

  getAnimatableRef() {
    return this.blurViewRef?.current;
  }

  render() {
    const {
      tint = "default",
      intensity = 50,
      blurReductionFactor,
      experimentalBlurMethod,
      style,
      children,
      ...props
    } = this.props;
    const backgroundColor = TINT_COLORS[tint] || TINT_COLORS.default;
    return React.createElement(
      View,
      { ...props, ref: this.blurViewRef, style: [{ backgroundColor }, style] },
      children
    );
  }
}

module.exports = BlurView;
module.exports.default = BlurView;
module.exports.__esModule = true;

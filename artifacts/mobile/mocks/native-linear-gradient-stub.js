'use strict';
// Temporary fallback for NativeLinearGradient.ios.js when the native ViewManager
// (ExpoLinearGradient) is not registered in the current dev client build.
// Uses the first gradient color as a solid backgroundColor so gold/gradient
// elements still look gold instead of transparent.
// Remove this redirect from metro.config.js once the dev client is rebuilt.
const React = require('react');
const { View } = require('react-native');

function NativeLinearGradientStub({ colors, locations, startPoint, endPoint, style, children, ...rest }) {
  const bg = colors && colors.length > 0
    ? (typeof colors[0] === 'number'
        ? '#' + colors[0].toString(16).padStart(8, '0').slice(2) // processColor int → hex
        : colors[0])
    : 'transparent';
  return React.createElement(View, { style: [{ backgroundColor: bg }, style], ...rest }, children);
}

module.exports = NativeLinearGradientStub;

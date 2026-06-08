---
name: SVG gradient import clash
description: Adding react-native-svg gradients in a file that already imports expo-linear-gradient
---

When adding an SVG `LinearGradient` (from `react-native-svg`) to a file that
already imports `LinearGradient` from `expo-linear-gradient`, the names collide
(TS2300 duplicate identifier) and the wrong component resolves (expo's has no
`x1/y1/x2/y2` props → TS2769).

**Why:** Many mobile screens use `expo-linear-gradient` for backgrounds; the SVG
one is a different component with the same export name.

**How to apply:** Alias the SVG import, e.g.
`import Svg, { LinearGradient as SvgLinearGradient, Stop, Defs, Rect } from "react-native-svg"`.
Also: `React.useId()` returns ids with `:` — strip them (`.replace(/:/g,"")`)
before using as an SVG gradient id / `url(#id)` reference. Keep gradient color
arrays as stable module-level refs so `React.memo` (e.g. SacredGlyph) holds.

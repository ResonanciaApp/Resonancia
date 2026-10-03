import { isValidElement } from "react";
import { Platform, ScrollView, type ScrollViewProps } from "react-native";

/** Lower retention of momentum after release; dragging still follows the finger. */
export const APP_SCROLL_DECELERATION = { ios: 0.995, android: 0.97 } as const;

type NativeScrollClass = {
  prototype?: { isReactComponent?: unknown };
  defaultProps?: Partial<ScrollViewProps>;
};

export function installScrollDefaults(): void {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;

  // RN 0.81 exports a hook-free ref wrapper around its ScrollView class.
  // Set defaults on that class, not on the function wrapper: React 19's JSX
  // runtime does not apply function-component defaultProps.
  let target = ScrollView as unknown as NativeScrollClass;
  if (!target.prototype?.isReactComponent) {
    if (typeof ScrollView !== "function") {
      throw new Error("Unsupported native ScrollView export for global scroll defaults");
    }
    const element = (ScrollView as unknown as (props: ScrollViewProps) => unknown)({});
    if (!isValidElement(element)) {
      throw new Error("Native ScrollView wrapper did not expose its underlying class");
    }
    target = element.type as unknown as NativeScrollClass;
  }
  if (!target.prototype?.isReactComponent) {
    throw new Error("Native ScrollView implementation changed; review global scroll defaults");
  }
  target.defaultProps = {
    ...target.defaultProps,
    decelerationRate: APP_SCROLL_DECELERATION[Platform.OS],
  };
}

// Runs before Expo Router mounts screens. FlatList and animated lists share
// this underlying native ScrollView. Explicit per-control rates still win.
installScrollDefaults();
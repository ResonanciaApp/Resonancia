import type { CSSProperties } from "react";

const isHeadless =
  typeof navigator !== "undefined" &&
  /HeadlessChrome|Headless/i.test(navigator.userAgent);

export const GOLD_GRADIENT: CSSProperties = isHeadless
  ? { color: "#BE9650" }
  : {
      background: "linear-gradient(90deg, #D6AD5F, #B47344)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    };

import React, { forwardRef, memo } from "react";
import { StyleSheet, Text as NativeText, type TextProps } from "react-native";
import { CARD_TEXT_BELOW } from "@/constants/colors";
import { useCardCaptionColor } from "@/context/CardCaptionColorContext";

export type CardCaptionText = NativeText;

/** Preserve native Text, refs, fonts and layout; remap only the shared caption color. */
export const CardCaptionText = memo(forwardRef<NativeText, TextProps>(function CardCaptionText(
  { style, ...props }, ref,
) {
  const captionColor = useCardCaptionColor();
  const color = captionColor !== CARD_TEXT_BELOW ? StyleSheet.flatten(style)?.color : undefined;
  const resolvedStyle = typeof color === "string" && color.toUpperCase() === CARD_TEXT_BELOW
    ? [style, { color: captionColor }]
    : style;
  return <NativeText {...props} ref={ref} style={resolvedStyle} />;
}));

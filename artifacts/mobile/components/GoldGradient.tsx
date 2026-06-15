import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import type { ViewProps } from "react-native";

export const GOLD_GRAD = ["#D4AF37", "#E9C46A"] as const;
export const GOLD_GRAD_START = { x: 0, y: 0.5 };
export const GOLD_GRAD_END = { x: 1, y: 0.5 };

/**
 * Reemplaza un View con fondo dorado sólido.
 * Uso: <GoldGradient style={styles.dot} />
 */
export function GoldGradient({ style, children, ...rest }: ViewProps) {
  return (
    <LinearGradient
      colors={GOLD_GRAD}
      start={GOLD_GRAD_START}
      end={GOLD_GRAD_END}
      style={style}
      {...(rest as any)}
    >
      {children}
    </LinearGradient>
  );
}

/**
 * Relleno absoluto para usar DENTRO de un Pressable.
 * El padre necesita overflow: 'hidden'.
 * Uso:
 *   <Pressable style={[styles.btn, { overflow: 'hidden' }]}>
 *     <GoldGradientFill />
 *     <Text>Label</Text>
 *   </Pressable>
 */
export function GoldGradientFill() {
  return (
    <LinearGradient
      colors={GOLD_GRAD}
      start={GOLD_GRAD_START}
      end={GOLD_GRAD_END}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    />
  );
}

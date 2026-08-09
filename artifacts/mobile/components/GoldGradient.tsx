import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import type { ViewProps } from "react-native";

export const GOLD_GRAD = ["#F9F9F9", "#F9F9F9"] as const;
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
/** Degradado dorado del botón "Escuchar ahora" (detalle de sesión): vertical #F9F9F9→#F9F9F9. */
export const LISTEN_GOLD_GRAD = ["#F9F9F9", "#F9F9F9"] as const;

/** Relleno absoluto con el degradado de "Escuchar ahora". El padre necesita overflow: 'hidden'. */
export function ListenGoldFill() {
  return (
    <LinearGradient
      colors={LISTEN_GOLD_GRAD}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    />
  );
}

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

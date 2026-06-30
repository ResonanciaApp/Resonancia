/**
 * FadeSlideIn — envolvente de entrada estándar para cards y elementos de lista.
 *
 * Aplica la animación canónica del sistema de movimiento:
 *   opacity 0→1 + translateY 12→0 + scale 0.97→1
 *   Duración: DURATION.CARD (280ms), curva easeOutCubic, sin rebote.
 *
 * Se puede encadenar con `delay` para hacer stagger en listas.
 *
 * @example
 *   // Card individual
 *   <FadeSlideIn>
 *     <SessionCard session={s} />
 *   </FadeSlideIn>
 *
 *   // Stagger en lista
 *   {items.map((item, i) => (
 *     <FadeSlideIn key={item.id} delay={i * 40}>
 *       <ItemRow item={item} />
 *     </FadeSlideIn>
 *   ))}
 */
import React, { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";
import { DURATION, easeOutCubic } from "@/constants/motion";

interface FadeSlideInProps {
  children: React.ReactNode;
  /** Retraso antes de iniciar la animación (ms). Útil para stagger en listas. */
  delay?: number;
  /** Desplazamiento vertical inicial en px. Default: 12 */
  translateYFrom?: number;
  /** Escala inicial. Default: 0.97 */
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeSlideIn({
  children,
  delay = 0,
  translateYFrom = 12,
  scaleFrom = 0.97,
  style,
}: FadeSlideInProps) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(translateYFrom)).current;
  const scale      = useRef(new Animated.Value(scaleFrom)).current;

  useEffect(() => {
    const cfg = { duration: DURATION.CARD, easing: easeOutCubic, useNativeDriver: true };
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, ...cfg, delay }),
      Animated.timing(translateY, { toValue: 0, ...cfg, delay }),
      Animated.timing(scale,      { toValue: 1, ...cfg, delay }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        style,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

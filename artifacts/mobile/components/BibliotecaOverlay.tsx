import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";

import { ProfileScreenBase } from "@/components/ProfileScreenBase";
import { useDrawer } from "@/context/DrawerContext";
import { DURATION, easeOutCubic } from "@/constants/motion";

const W = Dimensions.get("window").width;

/**
 * La pantalla de Biblioteca original (ProfileScreenBase) deslizándose desde
 * la derecha SOBRE el drawer. El menú queda abierto debajo; al replegarse
 * la pantalla, el drawer sigue visible.
 */
export function BibliotecaOverlay() {
  const { libOpen, closeLib } = useDrawer();
  const [rendered, setRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(W)).current;

  useEffect(() => {
    if (libOpen) {
      setRendered(true);
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: W,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libOpen]);

  if (!rendered) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}>
      {/* ProfileScreenBase en modo "no-dedicated" = la pestaña Biblioteca original.
          Pasamos onBack para que la flecha ← cierre el overlay en vez de navegar. */}
      <ProfileScreenBase onBack={closeLib} />
    </Animated.View>
  );
}

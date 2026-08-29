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
  const { libOpen, libraryInitialTab, closeLib } = useDrawer();
  const [rendered, setRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(W)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (libOpen) {
      setRendered(true);
      slideAnim.stopAnimation();
      fadeAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: DURATION.DRAWER,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: DURATION.DRAWER,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      slideAnim.stopAnimation();
      fadeAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: W,
          duration: DURATION.DRAWER,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: DURATION.DRAWER,
          easing: easeOutCubic,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libOpen]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      {/* Usa el mismo encabezado centrado que la ruta de Biblioteca.
          onBack mantiene el comportamiento de cerrar el overlay sobre el drawer. */}
      <ProfileScreenBase asTab onBack={closeLib} initialLibraryTab={libraryInitialTab} />
    </Animated.View>
  );
}

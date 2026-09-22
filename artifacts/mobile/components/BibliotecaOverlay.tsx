import React, { useEffect, useMemo, useState } from "react";
import { Animated, BackHandler, Dimensions, StyleSheet } from "react-native";

import { ProfileScreenBase } from "@/components/ProfileScreenBase";
import { useDrawer } from "@/context/DrawerContext";
import { easeOutCubic } from "@/constants/motion";

const W = Dimensions.get("window").width;
const DRAWER_DESTINATION_DURATION = 450;

/**
 * La pantalla de Biblioteca original (ProfileScreenBase) deslizándose desde
 * la derecha SOBRE el drawer. El menú queda abierto debajo; al replegarse
 * la pantalla, el drawer sigue visible.
 */
export function BibliotecaOverlay() {
  const {
    libOpen,
    libraryInitialTab,
    closeLib,
    drawerTransitionProgress,
    libOpenedFromDrawer,
  } = useDrawer();
  const [rendered, setRendered] = useState(false);
  const normalSlideAnim = React.useRef(new Animated.Value(W)).current;
  const normalFadeAnim = React.useRef(new Animated.Value(0)).current;
  const transitionToken = React.useRef(0);
  const slideX = useMemo(
    () => drawerTransitionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [W, 0],
      extrapolate: "clamp",
    }),
    [drawerTransitionProgress],
  );

  useEffect(() => {
    const token = ++transitionToken.current;
    normalSlideAnim.stopAnimation();
    normalFadeAnim.stopAnimation();
    drawerTransitionProgress.stopAnimation();
    if (libOpen) {
      setRendered(true);
      const progress = libOpenedFromDrawer ? drawerTransitionProgress : normalSlideAnim;
      if (!rendered) progress.setValue(libOpenedFromDrawer ? 0 : W);
      if (!libOpenedFromDrawer) {
        drawerTransitionProgress.setValue(0);
        normalFadeAnim.setValue(0);
      }
      const movement = Animated.timing(progress, {
        toValue: libOpenedFromDrawer ? 1 : 0,
        duration: libOpenedFromDrawer ? DRAWER_DESTINATION_DURATION : 350,
        easing: easeOutCubic,
        useNativeDriver: true,
      });
      if (libOpenedFromDrawer) {
        movement.start();
      } else {
        Animated.parallel([
          movement,
          Animated.timing(normalFadeAnim, {
            toValue: 1,
            duration: 350,
            easing: easeOutCubic,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (rendered) {
      const progress = libOpenedFromDrawer ? drawerTransitionProgress : normalSlideAnim;
      const movement = Animated.timing(progress, {
        toValue: libOpenedFromDrawer ? 0 : W,
        duration: libOpenedFromDrawer ? DRAWER_DESTINATION_DURATION : 350,
        easing: easeOutCubic,
        useNativeDriver: true,
      });
      const animation = libOpenedFromDrawer
        ? movement
        : Animated.parallel([
            movement,
            Animated.timing(normalFadeAnim, {
              toValue: 0,
              duration: 350,
              easing: easeOutCubic,
              useNativeDriver: true,
            }),
          ]);
      animation.start(({ finished }) => {
        if (finished && token === transitionToken.current) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libOpen]);

  useEffect(() => {
    if (!rendered) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeLib();
      return true;
    });
    return () => subscription.remove();
  }, [closeLib, rendered]);

  if (!rendered) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity: libOpenedFromDrawer ? 1 : normalFadeAnim,
          transform: [{ translateX: libOpenedFromDrawer ? slideX : normalSlideAnim }],
        },
      ]}
    >
      {/* Usa el mismo encabezado centrado que la ruta de Biblioteca.
          onBack mantiene el comportamiento de cerrar el overlay sobre el drawer. */}
      <ProfileScreenBase asTab onBack={closeLib} initialLibraryTab={libraryInitialTab} />
    </Animated.View>
  );
}

import React, { useEffect, useState } from "react";
import { Animated, BackHandler, Dimensions, StyleSheet, View } from "react-native";

import { ProfileScreenBase } from "@/components/ProfileScreenBase";
import { useDrawerDestinations } from "@/context/DrawerContext";
import { easeOutCubic } from "@/constants/motion";

const W = Dimensions.get("window").width;

/**
 * Biblioteca (ProfileScreenBase). Desde fuera del drawer entra deslizandose
 * desde la derecha; desde el drawer se monta en su sitio dentro de la
 * superficie frontal que vuelve, y confirma su layout real al drawer.
 */
export function BibliotecaOverlay() {
  const {
    libOpen,
    libraryInitialTab,
    closeLib,
    libOpenedFromDrawer,
    acknowledgeDestinationReady,
    destinationRequest,
  } = useDrawerDestinations();
  const [rendered, setRendered] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const normalSlideAnim = React.useRef(new Animated.Value(W)).current;
  const normalFadeAnim = React.useRef(new Animated.Value(0)).current;
  const transitionToken = React.useRef(0);

  useEffect(() => {
    const token = ++transitionToken.current;
    normalSlideAnim.stopAnimation();
    normalFadeAnim.stopAnimation();
    if (libOpen) {
      setRendered(true);
      if (libOpenedFromDrawer) {
        normalSlideAnim.setValue(0);
        normalFadeAnim.setValue(1);
        setMountKey((key) => key + 1);
        return;
      }
      if (!rendered) normalSlideAnim.setValue(W);
      normalFadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(normalSlideAnim, { toValue: 0, duration: 350, easing: easeOutCubic, useNativeDriver: true }),
        Animated.timing(normalFadeAnim, { toValue: 1, duration: 350, easing: easeOutCubic, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(normalSlideAnim, { toValue: W, duration: 350, easing: easeOutCubic, useNativeDriver: true }),
        Animated.timing(normalFadeAnim, { toValue: 0, duration: 350, easing: easeOutCubic, useNativeDriver: true }),
      ]).start(({ finished }) => {
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
        { opacity: normalFadeAnim, transform: [{ translateX: normalSlideAnim }] },
      ]}
    >
      <View key={mountKey} style={styles.fill}>
        <ProfileScreenBase asTab onBack={closeLib} initialLibraryTab={libraryInitialTab} />
        <View
          key={destinationRequest}
          collapsable={false}
          pointerEvents="none"
          style={{ position: "absolute", width: 1, height: 1 }}
          onLayout={() => acknowledgeDestinationReady("layout", "library")}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

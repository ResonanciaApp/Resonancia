import React from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import GeometrixScreen from "@/app/(tabs)/geometrix";
import MezcladorScreen from "@/app/(tabs)/musica";
import { MiniPlayer } from "@/components/MiniPlayer";
import {
  GEOMETRIX_PANEL_W,
  useGeometrixPanel,
} from "@/context/GeometrixPanelContext";
import { useMixer } from "@/context/MixerContext";
import {
  MIXER_PANEL_W,
  useMixerPanel,
} from "@/context/MixerPanelContext";

const MINI_PLAYER_MARGIN_H = 15;

/**
 * Capa global para los dos paneles de creación. Debe vivir después del drawer
 * en RootLayoutNav: un zIndex dentro de Tabs nunca puede superar a un hermano
 * global posterior.
 */
export function CreationPanelsOverlay() {
  const { activeSounds } = useMixer();
  const {
    isMixerOpen,
    openedFromDrawer: mixerFromDrawer,
    closeMixer,
    panelAnim,
  } = useMixerPanel();
  const {
    isGeometrixOpen,
    openedFromDrawer: geometrixFromDrawer,
    hasOpenedGeometrix,
    closeGeometrix,
    panelAnim: geoPanelAnim,
  } = useGeometrixPanel();

  const panelTranslateX = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [MIXER_PANEL_W, 0],
  });
  const geoTranslateX = geoPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GEOMETRIX_PANEL_W, 0],
  });
  const backdropOpacity = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: mixerFromDrawer ? [0, 0] : [0, 0.55],
  });
  const geoBackdropOpacity = geoPanelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: geometrixFromDrawer ? [0, 0] : [0, 0.55],
  });

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents={isMixerOpen ? "box-none" : "none"}
        style={[styles.panel, { width: MIXER_PANEL_W, transform: [{ translateX: panelTranslateX }] }]}
      >
        <MezcladorScreen />
        {activeSounds.length > 0 && (
          <View style={styles.miniPlayerFloat} pointerEvents="box-none">
            <MiniPlayer forceMix />
          </View>
        )}
      </Animated.View>
      <Animated.View
        pointerEvents={isMixerOpen ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={styles.fill} onPress={closeMixer} />
      </Animated.View>

      {hasOpenedGeometrix && (
        <>
          <Animated.View
            pointerEvents={isGeometrixOpen ? "box-none" : "none"}
            style={[styles.panel, { width: GEOMETRIX_PANEL_W, transform: [{ translateX: geoTranslateX }] }]}
          >
            <GeometrixScreen />
          </Animated.View>
          <Animated.View
            pointerEvents={isGeometrixOpen ? "auto" : "none"}
            style={[styles.backdrop, { opacity: geoBackdropOpacity }]}
          >
            <Pressable style={styles.fill} onPress={closeGeometrix} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: "#1B060F",
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    zIndex: 1,
  },
  miniPlayerFloat: {
    position: "absolute",
    left: MINI_PLAYER_MARGIN_H,
    right: MINI_PLAYER_MARGIN_H,
    bottom: 29,
  },
});
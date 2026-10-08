import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getThemeStyleId, SCENE_THEMES } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { DURATION_SHEET_OPEN_BACKDROP_MS, DURATION_SHEET_OPEN_SPRING } from "@/lib/ambiental-duration-opening";

const TITLE = "¿Qué es la puntuación de atención plena?";
const DESCRIPTION = "Un monitor de atención plena es una herramienta inteligente que evalúa tu salud mental y hábitos de meditación. Mide tu resiliencia mental y emocional mediante el seguimiento de varios factores. Si meditas a diario, tus puntuaciones mejoran, pero saltarte la meditación las reduce. En esencia, recompensa la meditación consecutiva y fomenta la práctica regular, ayudándote a ser más consciente de ti mismo/a y a experimentar los beneficios de la meditación constante en tu vida diaria.";

export function CreativityPointsInfoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const maxHeight = height * 0.88;
  const sheetGradient: [string, string] = getThemeStyleId(theme.id) === "indigo2"
    ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]
    : [theme.gradient[1], theme.gradient[2]];
  const [rendered, setRendered] = useState(visible);
  const sheetY = useRef(new Animated.Value(maxHeight + 80)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const generation = useRef(0);
  const sheetHeight = useRef(0);
  const pendingOpening = useRef<(() => void) | null>(null);

  useEffect(() => {
    const token = ++generation.current;
    let frame: number | undefined;
    const cleanup = () => {
      generation.current++;
      pendingOpening.current = null;
      if (frame !== undefined) cancelAnimationFrame(frame);
      sheetY.stopAnimation();
      backdropOpacity.stopAnimation();
    };
    if (visible) {
      setRendered(true);
      sheetY.stopAnimation();
      backdropOpacity.stopAnimation();
      sheetY.setValue(maxHeight + 80);
      backdropOpacity.setValue(0);
      const open = () => {
        frame = requestAnimationFrame(() => {
          if (token !== generation.current) return;
          // Igual que el temporizador: partir justo debajo del panel, no de la pantalla.
          sheetY.setValue(sheetHeight.current + 80);
          Animated.parallel([
            Animated.spring(sheetY, { toValue: 0, ...DURATION_SHEET_OPEN_SPRING, useNativeDriver: true }),
            Animated.timing(backdropOpacity, { toValue: 0.62, duration: DURATION_SHEET_OPEN_BACKDROP_MS, useNativeDriver: true }),
          ]).start();
        });
      };
      if (sheetHeight.current > 0) open();
      else pendingOpening.current = open;
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(sheetY, { toValue: maxHeight + 80, duration: 500, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 460, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && token === generation.current) setRendered(false);
      });
    }
    return cleanup;
  }, [visible, maxHeight, sheetY, backdropOpacity]);

  if (!rendered) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose} testID="creativity-info-modal">
      <View style={styles.modalRoot}>
        <Pressable
          testID="creativity-info-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar información de puntos creatividad"
        >
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000000", opacity: backdropOpacity }]} />
        </Pressable>
        <Animated.View
          testID="creativity-info-sheet"
          onLayout={(event) => {
            sheetHeight.current = event.nativeEvent.layout.height;
            if (sheetHeight.current > 0 && pendingOpening.current) {
              const open = pendingOpening.current;
              pendingOpening.current = null;
              open();
            }
          }}
          style={[styles.sheet, { maxHeight, backgroundColor: sheetGradient[0], transform: [{ translateY: sheetY }] }]}
          accessibilityViewIsModal
        >
          <LinearGradient testID="creativity-info-background" colors={sheetGradient} style={StyleSheet.absoluteFill} />
          <View style={styles.topRow}>
            <View style={styles.handle} pointerEvents="none" />
            <Pressable
              testID="creativity-info-close"
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar información de puntos creatividad"
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color="#F9F9F9" />
            </Pressable>
          </View>
          <ScrollView
            testID="creativity-info-scroll"
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
          >
            <Text testID="creativity-info-title" style={styles.title} accessibilityRole="header">{TITLE}</Text>
            <Text testID="creativity-info-description" style={styles.description}>{DESCRIPTION}</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: "hidden" },
  topRow: { height: 50, alignItems: "center" },
  handle: { marginTop: 10, width: 42, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255,255,255,0.25)" },
  closeButton: { position: "absolute", top: 10, right: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 24, paddingTop: 6 },
  title: { fontFamily: "Manrope", fontSize: 17, lineHeight: 24, fontWeight: "700", color: "#F9F9F9", marginBottom: 24 },
  description: { fontFamily: "Manrope", fontSize: 15, lineHeight: 22, color: "#F9F9F9" },
});
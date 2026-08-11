/**
 * EscenasAnimSheet — selector de escenas animadas (geometrías en Inicio).
 * Separado de EscenasSheet (que es para audio ambiente).
 *
 * Muestra un carrusel horizontal snap de hasta 9 escenas activas.
 * Cada card tiene un mini-preview estático de la receta.
 * Tocar una escena la activa con fade de 400 ms y cierra el sheet.
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { SceneAnimation } from "@workspace/api-client-react";
import { SceneAnimationCard } from "@/components/SceneAnimationCard";

const { height: SCREEN_H } = Dimensions.get("window");
const CARD_W = 160;
const CARD_H = 220;
const CARD_GAP = 12;
const SHEET_PAD = 20;

interface Props {
  visible: boolean;
  scenes: SceneAnimation[];
  activeSceneId: number | null;
  onSelect: (scene: SceneAnimation) => void;
  onClose: () => void;
}

export function EscenasAnimSheet({ visible, scenes, activeSceneId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideY.setValue(SCREEN_H);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: SCREEN_H,
        duration: 320,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [slideY, backdropOpacity, onClose]);

  const handleSelect = useCallback(
    (scene: SceneAnimation) => {
      onSelect(scene);
      // Pequeño delay para que el usuario vea la selección antes de cerrar
      setTimeout(() => handleClose(), 80);
    },
    [onSelect, handleClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, s.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          s.sheet,
          {
            transform: [{ translateY: slideY }],
            paddingBottom: Math.max(insets.bottom + 8, 24),
          },
        ]}
      >
        {/* Fondo con degradado oscuro */}
        <LinearGradient
          colors={["#16082A", "#0A0614"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Borde sutil arriba */}
        <View style={s.topBorder} />

        {/* Handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Escenas animadas</Text>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Feather name="x" size={22} color="rgba(255,255,255,0.6)" />
          </Pressable>
        </View>

        {/* Carrusel de escenas */}
        {scenes.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>No hay escenas disponibles</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SHEET_PAD,
              gap: CARD_GAP,
              paddingBottom: 12,
              paddingTop: 4,
            }}
            decelerationRate="fast"
            snapToInterval={CARD_W + CARD_GAP}
            snapToAlignment="start"
          >
            {scenes.map((scene) => {
              const isActive = scene.id === activeSceneId;
              return (
                <View key={scene.id} style={[s.cardWrap, isActive && s.cardWrapActive]}>
                  <SceneAnimationCard
                    scene={scene}
                    size={CARD_W}
                    height={CARD_H}
                    onPress={() => handleSelect(scene)}
                  />
                  {isActive && (
                    <View style={s.activeBadge}>
                      <Feather name="check" size={11} color="#fff" />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(190,150,80,0.18)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SHEET_PAD,
    paddingVertical: 14,
  },
  title: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: "#F9F9F9",
    letterSpacing: 0.2,
  },
  cardWrap: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardWrapActive: {
    borderColor: "rgba(255,255,255,0.72)",
  },
  activeBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    height: CARD_H,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SHEET_PAD,
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});

/**
 * InvitarSheet — bottom sheet premium de invitación a Resonancia.
 * ─────────────────────────────────────────────────────────────────
 * Entrada nativa slide_from_bottom (animationType="slide") + stagger
 * interno de los elementos. Fondo = degradado del tema activo.
 * Cerrar: botón X, tap en el handle, o swipe-down (dy>60 / vy>0.5).
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSceneTheme } from "@/context/SceneThemeContext";

const INVITE_URL = "https://resonancia.app/invitar";
const INVITE_MSG =
  "Te invito a Resonancia — meditación y sueño en español. Usá mi enlace y ambos recibimos un beneficio especial.";

const GIFT_COLORS = ["#D8A84F", "#F3D58A", "#B9822F"] as const;
const SHIMMER_COLORS = [
  "transparent",
  "rgba(255,255,255,0.22)",
  "transparent",
] as const;

const { height: SCREEN_H } = Dimensions.get("window");

export interface InvitarSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function InvitarSheet({ visible, onClose }: InvitarSheetProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();

  // Content stagger (independientes del slide nativo del Modal)
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const cardTransY   = useRef(new Animated.Value(40)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textTransY   = useRef(new Animated.Value(30)).current;
  const btnsOpacity  = useRef(new Animated.Value(0)).current;
  const btnsTransY   = useRef(new Animated.Value(20)).current;

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const resetAnim = () => {
    cardOpacity.setValue(0);
    cardTransY.setValue(40);
    textOpacity.setValue(0);
    textTransY.setValue(30);
    btnsOpacity.setValue(0);
    btnsTransY.setValue(20);
  };

  useEffect(() => {
    if (visible) {
      resetAnim();

      // Gift card entra (delay para que el modal nativo haya subido primero)
      Animated.sequence([
        Animated.delay(280),
        Animated.parallel([
          Animated.timing(cardOpacity,  { toValue: 1, duration: 460, easing: Easing.out(Easing.quad),   useNativeDriver: true }),
          Animated.timing(cardTransY,   { toValue: 0, duration: 460, easing: Easing.out(Easing.cubic),  useNativeDriver: true }),
        ]),
      ]).start();

      // Título + subtítulo
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([
          Animated.timing(textOpacity,  { toValue: 1, duration: 440, easing: Easing.out(Easing.quad),   useNativeDriver: true }),
          Animated.timing(textTransY,   { toValue: 0, duration: 440, easing: Easing.out(Easing.cubic),  useNativeDriver: true }),
        ]),
      ]).start();

      // Botones + microcopy
      Animated.sequence([
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(btnsOpacity,  { toValue: 1, duration: 420, easing: Easing.out(Easing.quad),   useNativeDriver: true }),
          Animated.timing(btnsTransY,   { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic),  useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      resetAnim();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Cerrar simplemente propaga onClose; el Modal con animationType="slide"
  // se encarga del exit (desliza hacia abajo de forma nativa).
  const dismiss = () => onClose();

  // PanResponder para swipe-down
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        gs.dy > 10 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 60 || gs.vy > 0.5) dismiss();
      },
    })
  ).current;

  const handleShare = async () => {
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message: INVITE_MSG, url: INVITE_URL }
          : { message: `${INVITE_MSG}\n${INVITE_URL}` }
      );
    } catch {}
  };

  const handleCopyLink = async () => {
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message: INVITE_URL, url: INVITE_URL }
          : { message: INVITE_URL }
      );
      showToast();
    } catch {}
  };

  const showToast = () => {
    setToastVisible(true);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.sheet}>
        {/* Fondo: degradado del tema activo */}
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Handle arrastrrable + tap cierra */}
        <Pressable
          style={styles.handleArea}
          onPress={dismiss}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
        </Pressable>

        {/* Botón X */}
        <Pressable style={styles.closeBtn} onPress={dismiss} hitSlop={14}>
          <View style={styles.closeBtnInner}>
            <Feather name="x" size={20} color="rgba(255,255,255,0.75)" />
          </View>
        </Pressable>

        {/* Contenido */}
        <View
          style={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom + 8, 36) },
          ]}
        >
          {/* ── Gift card ── */}
          <Animated.View
            style={[
              styles.cardWrap,
              { opacity: cardOpacity, transform: [{ translateY: cardTransY }] },
            ]}
          >
            <View style={styles.giftCard}>
              {/* Base dorada */}
              <LinearGradient
                colors={GIFT_COLORS}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Brillo diagonal */}
              <LinearGradient
                colors={SHIMMER_COLORS}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {/* Contenido de la card */}
              <View style={styles.cardInner}>
                <Text style={styles.cardForLabel}>Para tu amigo</Text>
                <Text style={styles.cardDiscount}>20% OFF</Text>
                <Text style={styles.cardBrand}>Resonancia Premium</Text>
              </View>
              {/* Motivos decorativos */}
              <View style={styles.cardCircle1} pointerEvents="none" />
              <View style={styles.cardCircle2} pointerEvents="none" />
            </View>
          </Animated.View>

          {/* ── Título y descripción ── */}
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{ translateY: textTransY }],
            }}
          >
            <Text style={styles.title}>Regala Resonancia</Text>
            <Text style={styles.subtitle}>
              Invita a un amigo y ambos reciben un beneficio especial.
            </Text>
          </Animated.View>

          {/* ── Botones ── */}
          <Animated.View
            style={[
              styles.btnsWrap,
              {
                opacity: btnsOpacity,
                transform: [{ translateY: btnsTransY }],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.btnSecondary,
                { opacity: pressed ? 0.65 : 1 },
              ]}
              onPress={handleCopyLink}
            >
              <Feather name="copy" size={16} color="rgba(255,255,255,0.75)" />
              <Text style={styles.btnSecondaryText}>Copiar enlace</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btnPrimary,
                { opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={16} color="#1B060F" />
              <Text style={styles.btnPrimaryText}>Compartir invitación</Text>
            </Pressable>

            <Text style={styles.microcopy}>
              Tu amigo recibirá el descuento al registrarse desde tu enlace.
            </Text>
          </Animated.View>
        </View>

        {/* Toast inline */}
        {toastVisible && (
          <Animated.View
            style={[styles.toast, { opacity: toastOpacity }]}
            pointerEvents="none"
          >
            <Feather name="check-circle" size={14} color="#D4AF37" />
            <Text style={styles.toastText}>Enlace copiado</Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },

  // ── Handle / drag area ───────────────────────────────────────────────────
  handleArea: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  // ── Close button ─────────────────────────────────────────────────────────
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  closeBtnInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Content layout ───────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 0,
  },

  // ── Gift card ────────────────────────────────────────────────────────────
  cardWrap: {
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#D8A84F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  giftCard: {
    width: "100%",
    maxWidth: 340,
    height: 192,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  cardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 24,
  },
  cardForLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(90,50,0,0.72)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  cardDiscount: {
    fontSize: 58,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    lineHeight: 66,
    textShadowColor: "rgba(0,0,0,0.18)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  cardBrand: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(80,40,0,0.75)",
    letterSpacing: 0.4,
  },
  cardCircle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -40,
    left: -40,
  },
  cardCircle2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.10)",
    bottom: -30,
    right: -20,
  },

  // ── Título / descripción ─────────────────────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(242,231,228,0.70)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },

  // ── Botones ───────────────────────────────────────────────────────────────
  btnsWrap: {
    gap: 12,
    alignItems: "center",
  },
  btnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.07)",
    width: "100%",
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.80)",
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 50,
    backgroundColor: "#D4AF37",
    width: "100%",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
    letterSpacing: 0.2,
  },
  microcopy: {
    fontSize: 12,
    color: "rgba(242,231,228,0.40)",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: 12,
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(20,10,5,0.82)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
  },
  toastText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D4AF37",
  },
});

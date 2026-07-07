/**
 * InvitarSheet — bottom sheet premium de invitación a Resonancia.
 * ─────────────────────────────────────────────────────────────────
 * Entrada nativa slide_from_bottom (animationType="slide"). Después de
 * que el modal haya subido completamente (~400 ms) esperamos 2 s antes
 * de empezar el stagger de contenido:
 *   tarjeta → título → descripción → botón (350 ms c/u, 20 px translateY)
 * El botón aparece fijo en el fondo a 30 px del margen de la pantalla.
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

// Cuánto tarda el slide nativo del Modal en completarse (aprox.)
const MODAL_SLIDE_MS = 420;
// Pausa visible después de que la ventana haya subido
const POST_OPEN_DELAY = 500;
// Delay total antes del primer elemento
const BASE_DELAY = MODAL_SLIDE_MS + POST_OPEN_DELAY;
// Duración de cada fade-in + translateY (lento y zen)
const ANIM_DUR = 1600;
// Intervalo entre la aparición de cada elemento de contenido
const STAGGER = 600;
// Intervalo antes del botón (más corto)
const STAGGER_BTN = 400;

export interface InvitarSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function InvitarSheet({ visible, onClose }: InvitarSheetProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();

  // Cuatro animaciones independientes: tarjeta, título, descripción, botón
  const cardOpacity  = useRef(new Animated.Value(0)).current;
  const cardTransY   = useRef(new Animated.Value(35)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTransY  = useRef(new Animated.Value(35)).current;
  const descOpacity  = useRef(new Animated.Value(0)).current;
  const descTransY   = useRef(new Animated.Value(35)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;
  const btnTransY    = useRef(new Animated.Value(35)).current;

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const resetAnim = () => {
    cardOpacity.setValue(0);  cardTransY.setValue(35);
    titleOpacity.setValue(0); titleTransY.setValue(35);
    descOpacity.setValue(0);  descTransY.setValue(35);
    btnOpacity.setValue(0);   btnTransY.setValue(35);
  };

  const easeOut = Easing.out(Easing.cubic);

  const fadeSlide = (opacity: Animated.Value, transY: Animated.Value, delay: number) =>
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: ANIM_DUR, easing: easeOut, useNativeDriver: true }),
        Animated.timing(transY,  { toValue: 0, duration: ANIM_DUR, easing: easeOut, useNativeDriver: true }),
      ]),
    ]);

  useEffect(() => {
    if (visible) {
      resetAnim();
      // Stagger: tarjeta → título → descripción → botón
      fadeSlide(cardOpacity,  cardTransY,  BASE_DELAY).start();
      fadeSlide(titleOpacity, titleTransY, BASE_DELAY + STAGGER).start();
      fadeSlide(descOpacity,  descTransY,  BASE_DELAY + STAGGER * 2).start();
      fadeSlide(btnOpacity,   btnTransY,   BASE_DELAY + STAGGER * 2 + STAGGER_BTN).start();
    } else {
      resetAnim();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const dismiss = () => onClose();

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

  // Espacio reservado para el bloque de botón (altura aprox del bloque absoluto)
  const BTN_BLOCK_H = 80; // botón único aprox + margen
  const bottomPad = insets.bottom + 30 + BTN_BLOCK_H + 16;

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

        {/* Contenido central: tarjeta + título + descripción */}
        <View style={[styles.content, { paddingBottom: bottomPad }]}>
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
                <Text style={styles.cardDiscount}>7 · 30</Text>
                <Text style={styles.cardBrand}>Resonancia Premium</Text>
              </View>
              {/* Motivos decorativos */}
              <View style={styles.cardCircle1} pointerEvents="none" />
              <View style={styles.cardCircle2} pointerEvents="none" />
            </View>
          </Animated.View>

          {/* ── Título ── */}
          <Animated.View
            style={{ opacity: titleOpacity, transform: [{ translateY: titleTransY }] }}
          >
            <Text style={styles.title}>
              Regala un pase de invitado para 7 días · 30 días de Resonancia
            </Text>
          </Animated.View>

          {/* ── Descripción ── */}
          <Animated.View
            style={{ opacity: descOpacity, transform: [{ translateY: descTransY }] }}
          >
            <Text style={styles.subtitle}>
              Envía un pase de invitado a la persona que quieras para que tenga acceso
              gratuito a todo el contenido de Resonancia Premium durante un mes.
            </Text>
          </Animated.View>
        </View>

        {/* ── Botón — posición absoluta en el fondo ── */}
        <Animated.View
          style={[
            styles.btnAbsolute,
            {
              bottom: insets.bottom + 30,
              opacity: btnOpacity,
              transform: [{ translateY: btnTransY }],
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={16} color={theme.gradient[0]} />
            <Text style={[styles.btnPrimaryText, { color: theme.gradient[0] }]}>Compartir invitación</Text>
          </Pressable>
        </Animated.View>

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

  // ── Content layout (tarjeta + textos, centrado verticalmente) ────────────
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 0,
  },

  // ── Gift card ────────────────────────────────────────────────────────────
  cardWrap: {
    alignItems: "center",
    marginBottom: 28,
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
    fontSize: 56,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    lineHeight: 64,
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

  // ── Título ───────────────────────────────────────────────────────────────
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#F6F6F6",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: 0.1,
    lineHeight: 38,
  },

  // ── Descripción ──────────────────────────────────────────────────────────
  subtitle: {
    fontSize: 15,
    color: "#F6F6F6",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 4,
  },

  // ── Botón absoluto en el fondo ────────────────────────────────────────────
  btnAbsolute: {
    position: "absolute",
    left: 24,
    right: 24,
    gap: 12,
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
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  toast: {
    position: "absolute",
    bottom: 160,
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

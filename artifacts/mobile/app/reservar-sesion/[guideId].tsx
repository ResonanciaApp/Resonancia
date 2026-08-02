/**
 * Pantalla de reserva de sesión en vivo — expo-web-browser (compatible con Expo Go).
 *
 * Flujo:
 *  1. "idle"    — info del guiador + botón "Elegir fecha y hora"
 *  2. Se abre Cal.com en el navegador del sistema (WebBrowser.openBrowserAsync)
 *  3. Al volver: modal pregunta si la reserva se completó
 *  4. "confirm" — pantalla de éxito
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { getGuide } from "@/data/guides";

// ── Paleta ────────────────────────────────────────────────────────────────────
const WARM_BLACK = "#1B060F";
const BURGUNDY_MID = "#4A0C0C";
const PRIMARY_GOLD = "#dad4ec";
const ACCENT_GOLD = "#FBA980";
const FOREGROUND = "#FFFFFF";
const MUTED = "#F4F4F4";
const BORDER = "#3D0E16";

type Phase = "idle" | "confirm";

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function ReservarSesionScreen() {
  const { guideId, calLink, guideDisplayName } = useLocalSearchParams<{
    guideId: string;
    calLink?: string;
    guideDisplayName?: string;
  }>();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [phase, setPhase] = useState<Phase>("idle");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const guide = getGuide(guideId);
  const displayName = guideDisplayName ?? guide.name;
  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 24;

  const fadeTo = useCallback(
    (cb: () => void) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        cb();
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      });
    },
    [fadeAnim],
  );

  const handleOpenBrowser = useCallback(async () => {
    if (!calLink) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await WebBrowser.openBrowserAsync(calLink, {
      dismissButtonStyle: "close",
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      toolbarColor: WARM_BLACK,
    });
    // Al cerrar el navegador, preguntamos si completó la reserva
    setShowConfirmModal(true);
  }, [calLink]);

  const handleConfirmed = useCallback(() => {
    setShowConfirmModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fadeTo(() => setPhase("confirm"));
  }, [fadeTo]);

  const handleNotConfirmed = useCallback(() => {
    setShowConfirmModal(false);
  }, []);

  // ── Modal "¿Completaste la reserva?" ──────────────────────────────────────
  const confirmModal = (
    <Modal
      visible={showConfirmModal}
      transparent
      animationType="fade"
      onRequestClose={handleNotConfirmed}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Feather name="calendar" size={32} color={PRIMARY_GOLD} style={{ marginBottom: 12 }} />
          <Text style={styles.modalTitle}>¿Completaste la reserva?</Text>
          <Text style={styles.modalSub}>
            Si elegiste fecha y hora en Cal.com, tu sesión quedó agendada.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { marginTop: 20, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleConfirmed}
          >
            <LinearGradient
              colors={["#dad4ec", "#f3e7e9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryBtnText}>Sí, la completé</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={handleNotConfirmed}>
            <Text style={styles.secondaryBtnText}>Todavía no</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // ── Fase: confirmación ────────────────────────────────────────────────────
  if (phase === "confirm") {
    return (
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <StatusBar hidden />
        <LinearGradient
          colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={["rgba(212,175,55,0.20)", "rgba(212,175,55,0.06)"]}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="check-circle" size={38} color={PRIMARY_GOLD} />
          </View>

          <Text style={styles.confirmTitle}>¡Reserva confirmada!</Text>
          <Text style={styles.confirmSub}>
            Tu sesión con{" "}
            <Text style={{ color: ACCENT_GOLD, fontFamily: "Manrope", fontWeight: "600" }}>
              {displayName}
            </Text>{" "}
            quedó agendada.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="mail" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Recibirás un email de Cal.com con fecha, hora y enlace para unirte.
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 10 }]}>
              <Feather name="calendar" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                El botón "Entrar" aparecerá en{" "}
                <Text style={{ color: FOREGROUND }}>Mis sesiones</Text>{" "}
                15 minutos antes de comenzar.
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/mis-sesiones" as never), 200);
            }}
          >
            <LinearGradient
              colors={["#dad4ec", "#f3e7e9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryBtnText}>Ver mis sesiones</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/" as never)}>
            <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ── Fase: idle ────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient
        colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={22} color={FOREGROUND} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Reservar sesión
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.guideProfile}>
            <View style={styles.photoWrap}>
              <ExpoImage
                source={guide.photo as never}
                style={styles.photo}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            </View>
            <Text style={styles.guideName}>{displayName}</Text>
            {guide.specialty ? (
              <Text style={styles.guideSpecialty}>{guide.specialty}</Text>
            ) : null}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Elige fecha y hora directamente en Cal.com. Al completar, tu sesión quedará registrada.
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 10 }]}>
              <Feather name="clock" size={14} color={ACCENT_GOLD} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                El botón "Entrar" aparece en la app 15 minutos antes de tu sesión.
              </Text>
            </View>
          </View>

          {calLink ? (
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { marginTop: 28, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleOpenBrowser}
            >
              <LinearGradient
                colors={["#dad4ec", "#f3e7e9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="calendar" size={16} color={WARM_BLACK} style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Elegir fecha y hora</Text>
            </Pressable>
          ) : (
            <View style={[styles.infoCard, { marginTop: 24 }]}>
              <View style={styles.infoRow}>
                <Feather name="alert-circle" size={14} color={MUTED} style={styles.infoIcon} />
                <Text style={[styles.infoText, { color: MUTED }]}>
                  Este guiador aún no tiene disponibilidad configurada.
                </Text>
              </View>
            </View>
          )}

          <Pressable style={[styles.secondaryBtn, { marginTop: 16 }]} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {confirmModal}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WARM_BLACK },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    color: FOREGROUND,
    fontSize: 17,
    fontFamily: "Manrope", fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },

  guideProfile: { alignItems: "center", paddingVertical: 28 },
  photoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.35)",
    overflow: "hidden",
    marginBottom: 14,
  },
  photo: { width: "100%", height: "100%" },
  guideName: {
    color: FOREGROUND,
    fontSize: 22,
    fontFamily: "Manrope", fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
  },
  guideSpecialty: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Manrope",
    textAlign: "center",
  },

  infoCard: {
    backgroundColor: "rgba(74,12,12,0.25)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  infoRow: { flexDirection: "row", alignItems: "flex-start" },
  infoIcon: { marginRight: 10, marginTop: 1 },
  infoText: {
    flex: 1,
    color: MUTED,
    fontSize: 13,
    fontFamily: "Manrope",
    lineHeight: 19,
  },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: WARM_BLACK, fontSize: 16, fontFamily: "Manrope", fontWeight: "600" },
  secondaryBtn: { alignItems: "center", padding: 12 },
  secondaryBtnText: { color: MUTED, fontSize: 14, fontFamily: "Manrope" },

  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
    overflow: "hidden",
    marginBottom: 8,
  },
  confirmTitle: {
    color: FOREGROUND,
    fontSize: 24,
    fontFamily: "Manrope", fontWeight: "800",
    textAlign: "center",
  },
  confirmSub: {
    color: MUTED,
    fontSize: 15,
    fontFamily: "Manrope",
    textAlign: "center",
    lineHeight: 22,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalCard: {
    backgroundColor: "#27070E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    alignItems: "center",
  },
  modalTitle: {
    color: FOREGROUND,
    fontSize: 20,
    fontFamily: "Manrope", fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSub: {
    color: MUTED,
    fontSize: 14,
    fontFamily: "Manrope",
    textAlign: "center",
    lineHeight: 20,
  },
});

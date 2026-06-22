/**
 * Pantalla de reserva de sesión en vivo con un guiador.
 *
 * Flujo:
 *  1. "idle"    — info del guiador + botón "Elegir fecha y hora"
 *  2. "browser" — abre Cal.com con expo-web-browser (SFSafariViewController / Chrome Custom Tab)
 *  3. "ask"     — al cerrar el browser: pregunta explícita "¿Completaste tu reserva?"
 *                  → "Sí" → phase "confirm"  |  "No" → phase "idle"
 *  4. "confirm" — pantalla de éxito confirmada por el usuario
 *
 * Nota técnica: react-native-webview requiere rebuild de dev client; la
 * alternativa nativa equivalente es SFSafariViewController (iOS) / Chrome
 * Custom Tab (Android), que es exactamente lo que expo-web-browser entrega.
 * La confirmación es siempre explícita (el usuario debe confirmar que completó
 * la reserva), nunca automática.
 */
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
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
const PRIMARY_GOLD = "#D4AF37";
const ACCENT_GOLD = "#E9C46A";
const FOREGROUND = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.55)";
const BORDER = "#3D0E16";

type Phase = "idle" | "browser" | "ask" | "confirm";

// ── Pantalla ─────────────────────────────────────────────────────────────────
export default function ReservarSesionScreen() {
  const { guideId, calLink, guideDisplayName } = useLocalSearchParams<{
    guideId: string;
    calLink?: string;
    guideDisplayName?: string;
  }>();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>("idle");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const guide = getGuide(guideId);
  const displayName = guideDisplayName ?? guide.name;

  const handleOpenBrowser = useCallback(async () => {
    if (!calLink) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("browser");
    try {
      await WebBrowser.openBrowserAsync(calLink, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: WARM_BLACK,
        controlsColor: PRIMARY_GOLD,
        showTitle: false,
        enableDefaultShareMenuItem: false,
      });
    } catch {
      // El usuario cerró el browser sin error
    }
    // Browser cerrado — preguntar explícitamente si completó la reserva
    setPhase("ask");
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [calLink, fadeAnim]);

  const handleConfirmYes = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    fadeAnim.setValue(0);
    setPhase("confirm");
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleConfirmNo = useCallback(() => {
    fadeAnim.setValue(0);
    setPhase("idle");
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 24;

  // ── Fase: preguntar si completó la reserva ───────────────────────────────
  if (phase === "ask") {
    return (
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
          {/* Ícono pregunta */}
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={["rgba(212,175,55,0.20)", "rgba(212,175,55,0.06)"]}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="help-circle" size={36} color={PRIMARY_GOLD} />
          </View>

          <Text style={styles.askTitle}>¿Completaste tu reserva?</Text>
          <Text style={styles.askSub}>
            Si terminaste el proceso en Cal.com, confirma aquí para registrar tu sesión.
          </Text>

          {/* Botón Sí */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
            onPress={handleConfirmYes}
          >
            <LinearGradient
              colors={["#D6AD5F", "#B47344"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="check" size={16} color={WARM_BLACK} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Sí, la completé</Text>
          </Pressable>

          {/* Botón No */}
          <Pressable style={styles.secondaryBtn} onPress={handleConfirmNo}>
            <Text style={styles.secondaryBtnText}>No, volver a intentarlo</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ── Fase: confirmación exitosa ────────────────────────────────────────────
  if (phase === "confirm") {
    return (
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
          {/* Ícono check */}
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={["rgba(212,175,55,0.20)", "rgba(212,175,55,0.06)"]}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="check" size={36} color={PRIMARY_GOLD} />
          </View>

          <Text style={styles.confirmTitle}>¡Reserva confirmada!</Text>
          <Text style={styles.confirmSub}>
            Tu sesión con{" "}
            <Text style={{ color: ACCENT_GOLD }}>{displayName}</Text>{" "}
            quedó registrada.
          </Text>

          {/* Tarjeta informativa */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="mail" size={14} color={ACCENT_GOLD} style={{ marginRight: 10, marginTop: 1 }} />
              <Text style={styles.infoText}>
                Recibirás un email de Cal.com con la fecha, hora y enlace para unirte.
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 10 }]}>
              <Feather name="calendar" size={14} color={ACCENT_GOLD} style={{ marginRight: 10, marginTop: 1 }} />
              <Text style={styles.infoText}>
                El botón "Entrar" aparecerá en{" "}
                <Text style={{ color: FOREGROUND }}>Mis sesiones</Text>{" "}
                15 minutos antes de que comience.
              </Text>
            </View>
          </View>

          {/* Ver mis sesiones */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              router.back();
              setTimeout(() => router.push("/mis-sesiones" as never), 200);
            }}
          >
            <LinearGradient
              colors={["#D6AD5F", "#B47344"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.primaryBtnText}>Ver mis sesiones</Text>
          </Pressable>

          {/* Volver al inicio */}
          <Pressable style={styles.secondaryBtn} onPress={() => router.replace("/" as never)}>
            <Text style={styles.secondaryBtnText}>Volver al inicio</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ── Fase idle / browser ───────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
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
          {/* Foto + nombre del guiador */}
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
            {guide.specialty && (
              <Text style={styles.guideSpecialty}>{guide.specialty}</Text>
            )}
          </View>

          {/* Tarjeta informativa */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="calendar" size={14} color={ACCENT_GOLD} style={{ marginRight: 10, marginTop: 1 }} />
              <Text style={styles.infoText}>
                Elige fecha y hora en Cal.com. Recibirás confirmación y enlace por email.
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 10 }]}>
              <Feather name="clock" size={14} color={ACCENT_GOLD} style={{ marginRight: 10, marginTop: 1 }} />
              <Text style={styles.infoText}>
                El botón "Entrar" aparecerá en la app 15 minutos antes de tu sesión.
              </Text>
            </View>
          </View>

          {/* Botón reservar */}
          {calLink ? (
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                { marginTop: 28, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={handleOpenBrowser}
              disabled={phase === "browser"}
            >
              <LinearGradient
                colors={["#D6AD5F", "#B47344"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Feather
                name="calendar"
                size={16}
                color={WARM_BLACK}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryBtnText}>Elegir fecha y hora</Text>
            </Pressable>
          ) : (
            <View style={[styles.infoCard, { marginTop: 24 }]}>
              <View style={styles.infoRow}>
                <Feather name="alert-circle" size={14} color={MUTED} style={{ marginRight: 10 }} />
                <Text style={[styles.infoText, { color: MUTED }]}>
                  Este guiador aún no tiene disponibilidad configurada. Contáctalo directamente.
                </Text>
              </View>
            </View>
          )}

          <Pressable style={[styles.secondaryBtn, { marginTop: 16 }]} onPress={() => router.back()}>
            <Text style={styles.secondaryBtnText}>Cancelar</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  guideSpecialty: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
  infoText: {
    flex: 1,
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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
  primaryBtnText: {
    color: WARM_BLACK,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  secondaryBtn: { alignItems: "center", padding: 12 },
  secondaryBtnText: {
    color: MUTED,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },

  // Pantallas centradas (ask + confirm)
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
  askTitle: {
    color: FOREGROUND,
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  askSub: {
    color: MUTED,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 21,
  },
  confirmTitle: {
    color: FOREGROUND,
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  confirmSub: {
    color: MUTED,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});

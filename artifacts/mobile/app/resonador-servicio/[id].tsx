import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { getResonadorById } from "@/data/resonadores";
import { useSceneTheme } from "@/context/SceneThemeContext";

const H_PAD = 20;
const GOLD = "#BE9650";

const MODALITY_LABEL: Record<string, string> = {
  online: "Online",
  presencial: "Presencial",
  ambas: "Online y presencial",
};

export default function ResonadorServicioScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme: activeTheme } = useSceneTheme();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const resonador = getResonadorById(id ?? "");

  if (!resonador) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <LinearGradient colors={activeTheme.gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingTop: topPad + 8, paddingHorizontal: H_PAD }]}>
          <GhostPill noBorder style={{ backgroundColor: "rgba(255,255,255,0.045)" }}>
            <BackPill onPress={() => router.back()} size={27} iconOffsetX={-2} />
          </GhostPill>
        </View>
        <View style={styles.centered}>
          <Feather name="calendar" size={40} color="rgba(255,255,255,0.3)" />
          <Text style={styles.notFoundText}>Servicio no encontrado</Text>
        </View>
      </View>
    );
  }

  const modalityLabel = resonador.bookingModality
    ? MODALITY_LABEL[resonador.bookingModality]
    : null;

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={activeTheme.gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[styles.headerRow, { paddingTop: topPad + 8, paddingHorizontal: H_PAD }]}>
        <GhostPill noBorder style={{ backgroundColor: "rgba(255,255,255,0.045)", marginTop: -2, transform: [{ translateY: 2 }] }}>
          <BackPill onPress={() => router.back()} size={27} iconOffsetX={-2} />
        </GhostPill>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Servicio</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 48 }]}
      >
        {/* ── Hero: foto + nombre ── */}
        <View style={[styles.hero, { paddingTop: topPad + 72 }]}>
          <Image
            source={resonador.photo}
            style={styles.heroAvatar}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
          <Text style={styles.heroName}>{resonador.name}</Text>
          <Text style={styles.heroSubtipo}>{resonador.subtipo}</Text>
        </View>

        {/* ── Divisor ── */}
        <View style={styles.divider} />

        {/* ── Contenido del servicio ── */}
        <View style={[styles.body, { paddingHorizontal: H_PAD }]}>
          <Text style={styles.sectionTitle}>Mis servicios</Text>

          {/* Pills: modalidad + precio */}
          {(modalityLabel || resonador.bookingPrice) ? (
            <View style={styles.pillsRow}>
              {modalityLabel ? (
                <View style={styles.modalityPill}>
                  <Feather
                    name={resonador.bookingModality === "presencial" ? "map-pin" : "video"}
                    size={11}
                    color="rgba(249,249,249,0.75)"
                  />
                  <Text style={styles.modalityText}>{modalityLabel}</Text>
                </View>
              ) : null}
              {resonador.bookingPrice ? (
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>{resonador.bookingPrice}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Descripción completa */}
          {resonador.servicesDescription ? (
            <Text style={styles.description}>{resonador.servicesDescription}</Text>
          ) : null}

          {/* Tagline */}
          {resonador.bookingTagline ? (
            <View style={styles.taglineWrap}>
              <Feather name="clock" size={13} color={GOLD} />
              <Text style={styles.taglineText}>{resonador.bookingTagline}</Text>
            </View>
          ) : null}
        </View>

        {/* ── CTA Agendar ── */}
        {resonador.bookingUrl ? (
          <View style={[styles.ctaWrap, { paddingHorizontal: H_PAD }]}>
            <Pressable
              onPress={() => Linking.openURL(resonador.bookingUrl!)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <LinearGradient
                colors={["#D4A843", "#BE9650"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaBtn}
              >
                <Feather name="calendar" size={18} color="#060A0F" />
                <Text style={styles.ctaBtnText}>Agendar hora</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.ctaNote}>
              Serás redirigido al sistema de reservas del resonador
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontFamily: "Manrope", fontSize: 16, color: "rgba(249,249,249,0.5)" },

  scroll: { gap: 0 },

  /* ── Hero ── */
  hero: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 32,
    gap: 10,
  },
  heroAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: "rgba(190,150,80,0.5)",
  },
  heroName: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    color: "#F9F9F9",
    textAlign: "center",
  },
  heroSubtipo: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(249,249,249,0.55)",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: H_PAD,
    marginBottom: 28,
  },

  /* ── Body ── */
  body: { gap: 18 },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#F9F9F9",
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  modalityPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalityText: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(249,249,249,0.8)",
  },
  pricePill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.4)",
    backgroundColor: "rgba(190,150,80,0.1)",
  },
  priceText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    color: "#BE9650",
  },
  description: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 25,
    color: "rgba(249,249,249,0.75)",
  },
  taglineWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingTop: 4,
  },
  taglineText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(249,249,249,0.5)",
    flex: 1,
  },

  /* ── CTA ── */
  ctaWrap: { marginTop: 40, gap: 14 },
  ctaBtn: {
    borderRadius: 28,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ctaBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#060A0F",
  },
  ctaNote: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(249,249,249,0.35)",
    textAlign: "center",
  },
});

import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { GoldGradientFill } from "@/components/GoldGradient";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

const SEEN_KEY = "cdc_intencion_onboarding_seen";

const TIPS = [
  "Te alinean con tu propósito",
  "Son específicas y claras",
  "Utilizan un lenguaje positivo",
  "Son realistas y alcanzables",
];

export default function IntencionOnboardingScreen() {
  const colors = useColors();
  const { theme: activeTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleEntendido() {
    await AsyncStorage.setItem(SEEN_KEY, "true");
    router.replace("/intencion");
  }

  return (
    <LinearGradient
      style={styles.root}
      colors={activeTheme.gradient as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar hidden />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad + 32, paddingHorizontal: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
          <Feather name="target" size={28} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.foreground }]}>Intenciona tu día</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Deja una intención clara que guíe tu atención y tus acciones el día de hoy.
        </Text>

        {/* Tips card */}
        <View style={[styles.tipsCard, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
          <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Las mejores intenciones...</Text>
          <View style={styles.tipsList}>
            {TIPS.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={[styles.checkCircle, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
                  <Feather name="check" size={12} color={colors.primary} />
                </View>
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Example */}
        <View style={[styles.exampleCard, { backgroundColor: "rgba(255,255,255,0.07)" }]}>
          <Text style={[styles.exampleLabel, { color: colors.primary }]}>EJEMPLO</Text>
          <Text style={[styles.exampleHoy, { color: colors.mutedForeground }]}>Hoy voy a...</Text>
          <Text style={[styles.exampleText, { color: colors.foreground }]}>
            "Escucharme con más atención y actuar desde la calma"
          </Text>
        </View>
      </ScrollView>

      {/* CTA fixed at bottom */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 16 }]}>
        <Pressable
          onPress={handleEntendido}
          style={({ pressed }) => [styles.btn, { overflow: "hidden", opacity: pressed ? 0.85 : 1 }]}
        >
          <GoldGradientFill />
          <Text style={styles.btnText}>¡Entendido!</Text>
          <Feather name="arrow-right" size={18} color="#070E09" />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 28,
  },

  title: {
    fontFamily: "Manrope",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 32,
  },

  tipsCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },
  tipsTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  tipsList: { gap: 14 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tipText: { fontFamily: "Manrope", fontSize: 14, lineHeight: 20, flex: 1 },

  exampleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  exampleLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  exampleHoy: { fontFamily: "Manrope", fontSize: 12, marginBottom: 4 },
  exampleText: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", fontStyle: "italic", lineHeight: 22 },

  footer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    backgroundColor: "transparent",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  btnText: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", color: "#070E09" },
});

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const BENEFITS = [
  { icon: "headphones", text: "Acceso ilimitado a todas las sesiones" },
  { icon: "moon", text: "Sección Descanso completa con historias y binaurales" },
  { icon: "mic", text: "Voz Interior — grabaciones ilimitadas" },
  { icon: "users", text: "Acceso a la comunidad y grupos espirituales" },
  { icon: "download", text: "Descarga para escuchar sin conexión" },
  { icon: "zap", text: "Nuevas sesiones cada semana" },
  { icon: "star", text: "Contenido exclusivo para miembros" },
];

export default function MembresiaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [selected, setSelected] = useState<"anual" | "mensual">("anual");

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={[styles.back, { marginLeft: 20 }]} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <LinearGradient colors={["#C69B4F22", "#C69B4F00"]} style={StyleSheet.absoluteFill} />
          <Text style={[styles.heroLabel, { color: colors.primary }]}>CASA DEL CUENCO</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Membresía{"\n"}Resonancia
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Accede a toda la experiencia sonora
          </Text>
        </View>

        {/* Plan selector */}
        <View style={[styles.planRow, { paddingHorizontal: 20 }]}>
          {/* Anual */}
          <Pressable
            onPress={() => setSelected("anual")}
            style={({ pressed }) => [
              styles.planCard,
              { borderColor: selected === "anual" ? colors.primary : colors.border,
                backgroundColor: selected === "anual" ? colors.primary + "14" : colors.card,
                opacity: pressed ? 0.9 : 1 },
            ]}
          >
            {selected === "anual" && (
              <LinearGradient colors={["#C69B4F", "#D6A85B"]} style={styles.bestBadge}>
                <Text style={styles.bestText}>RECOMENDADO</Text>
              </LinearGradient>
            )}
            <Text style={[styles.planName, { color: colors.foreground }]}>Anual</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: colors.primary }]}>$</Text>
              <Text style={[styles.price, { color: colors.primary }]}>89</Text>
              <Text style={[styles.pricePer, { color: colors.mutedForeground }]}>/año</Text>
            </View>
            <Text style={[styles.planSub, { color: colors.accent }]}>≈ $7.40/mes</Text>
            <View style={[styles.saveBadge, { backgroundColor: "#2A5A1A" }]}>
              <Text style={[styles.saveText, { color: "#7ED65A" }]}>Ahorrás 40%</Text>
            </View>
          </Pressable>

          {/* Mensual */}
          <Pressable
            onPress={() => setSelected("mensual")}
            style={({ pressed }) => [
              styles.planCard,
              { borderColor: selected === "mensual" ? colors.primary : colors.border,
                backgroundColor: selected === "mensual" ? colors.primary + "14" : colors.card,
                opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Text style={[styles.planName, { color: colors.foreground }]}>Mensual</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: colors.primary }]}>$</Text>
              <Text style={[styles.price, { color: colors.primary }]}>12</Text>
              <Text style={[styles.pricePer, { color: colors.mutedForeground }]}>/mes</Text>
            </View>
            <Text style={[styles.planSub, { color: colors.mutedForeground }]}>Cancelá cuando quieras</Text>
          </Pressable>
        </View>

        {/* Benefits */}
        <View style={[styles.benefitsBlock, { paddingHorizontal: 20 }]}>
          <Text style={[styles.benefitsTitle, { color: colors.foreground }]}>Todo incluido</Text>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name={b.icon as any} size={14} color={colors.primary} />
              </View>
              <Text style={[styles.benefitText, { color: colors.foreground }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <LinearGradient colors={["#D6A85B", "#C69B4F"]} style={styles.ctaGrad}>
              <Text style={styles.ctaText}>
                {selected === "anual" ? "Comenzar con plan anual · $89" : "Comenzar con plan mensual · $12"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Text style={[styles.legal, { color: colors.mutedForeground }]}>
            Pago seguro · Se renueva automáticamente · Cancelá en cualquier momento
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 8, width: 40, height: 40, justifyContent: "center" },
  hero: { paddingHorizontal: 24, paddingVertical: 28, alignItems: "center", overflow: "hidden", marginBottom: 8 },
  heroLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 3, marginBottom: 12 },
  heroTitle: { fontSize: 34, fontWeight: "700", textAlign: "center", lineHeight: 42, marginBottom: 10 },
  heroSub: { fontSize: 14, textAlign: "center" },
  planRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  planCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    gap: 6,
    overflow: "hidden",
  },
  bestBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  bestText: { color: "#1A0E06", fontSize: 9, fontWeight: "700", letterSpacing: 1 },
  planName: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 1 },
  currency: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  price: { fontSize: 36, fontWeight: "700", lineHeight: 40 },
  pricePer: { fontSize: 13, marginBottom: 6 },
  planSub: { fontSize: 11, fontWeight: "500" },
  saveBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4 },
  saveText: { fontSize: 11, fontWeight: "700" },
  benefitsBlock: { marginBottom: 28 },
  benefitsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  benefitIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  benefitText: { flex: 1, fontSize: 14, lineHeight: 20 },
  ctaBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 14 },
  ctaGrad: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#1A0E06", fontWeight: "700", fontSize: 16 },
  legal: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});

import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
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

const P = {
  bg0:        "#06150F",
  bg1:        "#0D261D",
  bg2:        "#17352A",
  glow:       "#234236",
  cardBg:     "#0F2A20",
  cardSelBg:  "#173A2B",
  gold:       "#D6A14D",
  goldSoft:   "#C89544",
  goldHi:     "#F0C36A",
  textMain:   "#EDE7DA",
  textMuted:  "#D5C8B2",
  border:     "rgba(169,122,52,0.35)",
  borderSel:  "#D6A14D",
  saveBg:     "#1F4A2E",
  saveText:   "#A8E07A",
};

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
    <View style={[styles.root, { backgroundColor: "#241710" }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />
      <LinearGradient
        colors={["rgba(214,161,77,0.10)", "rgba(35,66,54,0.08)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={[styles.back, { marginLeft: 20 }]} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={P.textMain} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require("../assets/images/estrella-premium.png")}
            style={styles.heroStar}
            contentFit="contain"
          />
          <Text style={[styles.heroTitle, { color: P.textMain }]}>
            Membresía{"\n"}Resonancia
          </Text>
          {/* Divider dorado tipo banner premium */}
          <LinearGradient
            colors={["transparent", P.goldSoft, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />
          <Text style={[styles.heroSub, { color: P.textMuted }]}>
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
              {
                borderColor: selected === "anual" ? P.borderSel : P.border,
                backgroundColor: selected === "anual" ? P.cardSelBg : P.cardBg,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            {selected === "anual" && (
              <LinearGradient
                colors={[P.goldHi, P.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bestBadge}
              >
                <Text style={styles.bestText}>RECOMENDADO</Text>
              </LinearGradient>
            )}
            <Text style={[styles.planName, { color: P.textMain }]}>Anual</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: P.gold }]}>$</Text>
              <Text style={[styles.price, { color: P.gold }]}>89</Text>
              <Text style={[styles.pricePer, { color: P.textMuted }]}>/año</Text>
            </View>
            <Text style={[styles.planSub, { color: P.goldSoft }]}>≈ $7.40/mes</Text>
            <View style={[styles.saveBadge, { backgroundColor: P.saveBg }]}>
              <Text style={[styles.saveText, { color: P.saveText }]}>Ahorrás 40%</Text>
            </View>
          </Pressable>

          {/* Mensual */}
          <Pressable
            onPress={() => setSelected("mensual")}
            style={({ pressed }) => [
              styles.planCard,
              {
                borderColor: selected === "mensual" ? P.borderSel : P.border,
                backgroundColor: selected === "mensual" ? P.cardSelBg : P.cardBg,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Text style={[styles.planName, { color: P.textMain }]}>Mensual</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: P.gold }]}>$</Text>
              <Text style={[styles.price, { color: P.gold }]}>12</Text>
              <Text style={[styles.pricePer, { color: P.textMuted }]}>/mes</Text>
            </View>
            <Text style={[styles.planSub, { color: P.textMuted }]}>Cancelá cuando quieras</Text>
          </Pressable>
        </View>

        {/* Benefits */}
        <View style={[styles.benefitsBlock, { paddingHorizontal: 20 }]}>
          <Text style={[styles.benefitsTitle, { color: P.textMain }]}>Todo incluido</Text>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <View style={[styles.benefitIcon, { backgroundColor: P.cardSelBg, borderColor: P.border }]}>
                <Feather name={b.icon as any} size={14} color={P.gold} />
              </View>
              <Text style={[styles.benefitText, { color: P.textMain }]}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}>
            <LinearGradient
              colors={[P.goldHi, P.gold, P.goldSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGrad}
            >
              <Text style={styles.ctaText}>
                {selected === "anual" ? "Comenzar con plan anual · $89" : "Comenzar con plan mensual · $12"}
              </Text>
            </LinearGradient>
          </Pressable>
          <Text style={[styles.legal, { color: P.textMuted }]}>
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
  hero: { paddingHorizontal: 24, paddingVertical: 24, alignItems: "center", marginBottom: 12 },
  heroStar: { width: 44, height: 44, marginBottom: 14 },
  heroTitle: { fontSize: 34, fontWeight: "700", textAlign: "center", lineHeight: 42, marginBottom: 14 },
  divider: { width: 160, height: 1, marginBottom: 14 },
  heroSub: { fontSize: 14, textAlign: "center" },
  planRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  planCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
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
  bestText: { color: "#08150F", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
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
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1, fontSize: 14, lineHeight: 20 },
  ctaBtn: { borderRadius: 50, overflow: "hidden", marginBottom: 14 },
  ctaGrad: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#08150F", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  legal: { fontSize: 11, textAlign: "center", lineHeight: 16 },
});

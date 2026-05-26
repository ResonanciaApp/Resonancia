import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const ACCENT = "#D4709A";
const GRADIENT: [string, string] = ["#5C1A3A", "#3A0D22"];

const HOW_IT_WORKS = [
  {
    icon: "edit-3" as const,
    title: "Escribe desde el corazón",
    body: "Comparte lo que sientes, piensas o quieres soltar. Sin nombre, sin juicio.",
  },
  {
    icon: "globe" as const,
    title: "La comunidad lo recibe",
    body: "Tu mensaje aparece en el feed de quienes abrieron Diario hoy. Podés dar ❤️ a los que te resuenen.",
  },
  {
    icon: "clock" as const,
    title: "Se va solo a las 24 horas",
    body: "Cada mensaje tiene 24 horas de vida. Después desaparece para siempre. Sin rastro, sin historial.",
  },
];

const WHY_ITEMS = [
  {
    icon: "heart" as const,
    text: "Porque a veces necesitamos soltar algo sin que nadie lo sepa, pero sintiendo que alguien lo recibe.",
  },
  {
    icon: "users" as const,
    text: "Porque la soledad se disuelve cuando descubrís que otros sienten lo mismo que vos.",
  },
  {
    icon: "wind" as const,
    text: "Porque lo que escribimos y luego soltamos nos libera más que lo que guardamos.",
  },
];

export default function MensajesDelAlmaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 60 + bottomPad,
          paddingTop: topPad + 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { marginHorizontal: 20 }]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        {/* Hero */}
        <LinearGradient
          colors={GRADIENT}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroIconRing}>
            <Feather name="users" size={28} color="#FFD6EB" />
          </View>
          <Text style={styles.heroTitle}>Mensajes del Alma</Text>
          <Text style={styles.heroSub}>
            Un espacio anónimo para soltar, compartir y conectar con la comunidad. Cada mensaje vive 24 horas y luego desaparece.
          </Text>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Feather name="eye-off" size={11} color="#FFD6EB" />
              <Text style={styles.heroBadgeText}>Anónimo</Text>
            </View>
            <View style={styles.heroBadge}>
              <Feather name="clock" size={11} color="#FFD6EB" />
              <Text style={styles.heroBadgeText}>24 horas</Text>
            </View>
            <View style={styles.heroBadge}>
              <Feather name="trash-2" size={11} color="#FFD6EB" />
              <Text style={styles.heroBadgeText}>Sin rastro</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Cómo funciona */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            ¿Cómo funciona?
          </Text>
          <View style={styles.stepsList}>
            {HOW_IT_WORKS.map((step, i) => (
              <View
                key={i}
                style={[styles.stepCard, { backgroundColor: colors.card, borderColor: "rgba(212,112,154,0.18)" }]}
              >
                <View style={[styles.stepIconBg, { backgroundColor: `${ACCENT}22` }]}>
                  <Feather name={step.icon} size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                    {step.title}
                  </Text>
                  <Text style={[styles.stepBody, { color: colors.mutedForeground }]}>
                    {step.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Por qué existe */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            ¿Por qué existe?
          </Text>
          <Text style={[styles.introParagraph, { color: colors.mutedForeground }]}>
            Casa del Cuenco cree en el poder del sonido y también en el del lenguaje. Los Mensajes del Alma nacieron de una pregunta simple:
          </Text>
          <View style={[styles.quoteBlock, { borderLeftColor: ACCENT, backgroundColor: colors.card }]}>
            <Text style={[styles.quoteText, { color: colors.foreground }]}>
              "¿Qué pasaría si pudieras soltar algo hoy, sin que nadie sepa que fuiste vos, pero sintiendo que alguien lo recibió?"
            </Text>
          </View>
          <View style={styles.whyList}>
            {WHY_ITEMS.map((item, i) => (
              <View key={i} style={styles.whyRow}>
                <View style={[styles.whyIconBg, { backgroundColor: `${ACCENT}18`, borderColor: `${ACCENT}30` }]}>
                  <Feather name={item.icon} size={14} color={ACCENT} />
                </View>
                <Text style={[styles.whyText, { color: colors.mutedForeground }]}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Normas */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: "rgba(198,155,79,0.15)" }]}>
            <View style={styles.rulesHeader}>
              <Feather name="shield" size={16} color={colors.accent} />
              <Text style={[styles.rulesTitle, { color: colors.foreground }]}>
                Espacio seguro
              </Text>
            </View>
            <Text style={[styles.rulesBody, { color: colors.mutedForeground }]}>
              Este es un espacio de respeto y cuidado. Los mensajes que contengan violencia, discriminación o contenido dañino serán eliminados. Comparte desde la vulnerabilidad, no desde el ataque.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  hero: {
    marginHorizontal: 20,
    borderRadius: 22,
    padding: 24,
    marginBottom: 32,
    alignItems: "center",
  },
  heroIconRing: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    color: "#FFD6EB",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  heroSub: {
    color: "rgba(255,214,235,0.8)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
  },
  heroBadges: {
    flexDirection: "row",
    gap: 8,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: "#FFD6EB",
    fontSize: 11,
    fontWeight: "600",
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 16,
  },

  stepsList: { gap: 12 },
  stepCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  stepIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  stepBody: { fontSize: 13, lineHeight: 20 },

  introParagraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    paddingLeft: 16,
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  whyList: { gap: 12 },
  whyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  whyIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  whyText: { fontSize: 13, lineHeight: 21, flex: 1 },

  rulesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  rulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  rulesTitle: { fontSize: 15, fontWeight: "700" },
  rulesBody: { fontSize: 13, lineHeight: 21 },
});

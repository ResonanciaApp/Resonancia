import { Feather } from "@expo/vector-icons";
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

const FAQS = [
  {
    q: "¿Cómo funciona la membresía?",
    a: "La membresía te da acceso ilimitado a todas las sesiones, grupos y funciones premium. Puedes elegir el plan mensual o el anual con 40% de descuento.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí. Puedes cancelar tu membresía desde la sección Membresía en el menú. Si cancelas, conservas el acceso hasta el final del período pagado.",
  },
  {
    q: "¿Las sesiones funcionan sin internet?",
    a: "Con membresía activa puedes descargar sesiones para escucharlas sin conexión. Ve a Biblioteca, busca la sesión y toca el ícono de descarga.",
  },
  {
    q: "¿Qué son los Mensajes del Alma?",
    a: "Son mensajes anónimos que los usuarios comparten con la comunidad. Puedes leerlos y enviar los tuyos desde la pantalla principal.",
  },
  {
    q: "¿Cómo uso el Diario Expansivo?",
    a: "Desde la pestaña Diario puedes escribir reflexiones, registrar sueños, anotar ideas brillantes y guardar notas de voz. Todo queda privado en tu dispositivo.",
  },
  {
    q: "¿Los grupos son moderados?",
    a: "Sí. Cada grupo tiene uno o más moderadores responsables de mantener el espacio seguro y constructivo.",
  },
];

const TOPICS = [
  { icon: "credit-card" as const, label: "Pagos y facturación", color: "#E8C87A" },
  { icon: "headphones" as const, label: "Problemas de audio", color: "#8AAAD4" },
  { icon: "user" as const, label: "Cuenta y perfil", color: "#C8B4E0" },
  { icon: "shield" as const, label: "Privacidad y datos", color: "#A8C4A8" },
];

export default function AyudaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Ayuda</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          ¿En qué podemos ayudarte?
        </Text>

        {/* Topics */}
        <View style={styles.topicGrid}>
          {TOPICS.map((t) => (
            <Pressable
              key={t.label}
              style={({ pressed }) => [styles.topicCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.topicIcon, { backgroundColor: t.color + "22" }]}>
                <Feather name={t.icon} size={18} color={t.color} />
              </View>
              <Text style={[styles.topicLabel, { color: colors.foreground }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* FAQ */}
        <Text style={[styles.faqTitle, { color: colors.foreground }]}>Preguntas frecuentes</Text>
        <View style={styles.faqList}>
          {FAQS.map((faq, i) => (
            <Pressable
              key={i}
              onPress={() => setOpenIndex(openIndex === i ? null : i)}
              style={[styles.faqItem, { backgroundColor: colors.card, borderColor: openIndex === i ? colors.primary + "66" : colors.border }]}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{faq.q}</Text>
                <Feather
                  name={openIndex === i ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={colors.accent}
                />
              </View>
              {openIndex === i && (
                <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{faq.a}</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Contact */}
        <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="message-square" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactTitle, { color: colors.foreground }]}>¿No encontraste lo que buscabas?</Text>
            <Text style={[styles.contactSub, { color: colors.mutedForeground }]}>Escríbenos y te respondemos a la brevedad</Text>
          </View>
          <Pressable style={[styles.contactBtn, { borderColor: colors.primary }]}>
            <Text style={[styles.contactBtnText, { color: colors.primary }]}>Escribir</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 32 },
  topicCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  topicIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  topicLabel: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  faqTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  faqList: { gap: 10, marginBottom: 28 },
  faqItem: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 0 },
  faqHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  faqQ: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  faqA: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  contactTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  contactSub: { fontSize: 12, lineHeight: 17 },
  contactBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  contactBtnText: { fontSize: 13, fontWeight: "600" },
});

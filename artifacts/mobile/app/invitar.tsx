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

const SHARE_OPTIONS = [
  { icon: "message-circle" as const, label: "WhatsApp", color: "#25D366" },
  { icon: "mail" as const, label: "Email", color: "#C69B4F" },
  { icon: "instagram" as const, label: "Instagram", color: "#E4405F" },
  { icon: "share-2" as const, label: "Más opciones", color: "#8AAAD4" },
];

export default function InvitarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="share-2" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Invitar a un amigo</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Comparte Resonancia con quienes quieres que descansen y mediten
          </Text>
        </View>

        {/* Invite card */}
        <View style={[styles.inviteCard, { borderColor: colors.primary + "44" }]}>
          <LinearGradient colors={["#2A1A08", "#1A0E06"]} style={StyleSheet.absoluteFill} />
          <View style={styles.inviteTop}>
            <Feather name="gift" size={20} color={colors.primary} />
            <Text style={[styles.inviteLabel, { color: colors.primary }]}>7 días gratis para tu amigo</Text>
          </View>
          <Text style={[styles.inviteCode, { color: colors.foreground }]}>RESONANCIA-XK9P</Text>
          <Pressable style={({ pressed }) => [styles.copyBtn, { backgroundColor: colors.primary + "22", opacity: pressed ? 0.7 : 1 }]}>
            <Feather name="copy" size={14} color={colors.primary} />
            <Text style={[styles.copyText, { color: colors.primary }]}>Copiar código</Text>
          </Pressable>
        </View>

        {/* How it works */}
        <View style={[styles.howBlock, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.howTitle, { color: colors.foreground }]}>¿Cómo funciona?</Text>
          {[
            { n: "1", text: "Tu amigo descarga la app y usa tu código" },
            { n: "2", text: "Ellos obtienen 7 días de membresía gratis" },
            { n: "3", text: "Cuando se suscriben, tú obtienes 1 mes gratis" },
          ].map((s) => (
            <View key={s.n} style={styles.howRow}>
              <View style={[styles.howNum, { backgroundColor: colors.primary + "25" }]}>
                <Text style={[styles.howNumText, { color: colors.primary }]}>{s.n}</Text>
              </View>
              <Text style={[styles.howText, { color: colors.foreground }]}>{s.text}</Text>
            </View>
          ))}
        </View>

        {/* Share buttons */}
        <Text style={[styles.shareLabel, { color: colors.mutedForeground }]}>Compartir por</Text>
        <View style={styles.shareRow}>
          {SHARE_OPTIONS.map((opt) => (
            <Pressable
              key={opt.label}
              style={({ pressed }) => [styles.shareBtn, { backgroundColor: opt.color + "18", opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name={opt.icon} size={22} color={opt.color} />
              <Text style={[styles.shareBtnLabel, { color: opt.color }]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 20, width: 40, height: 40, justifyContent: "center" },
  hero: { alignItems: "center", marginBottom: 32 },
  heroIcon: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  inviteCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 24,
    gap: 12,
  },
  inviteTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  inviteLabel: { fontSize: 13, fontWeight: "600" },
  inviteCode: { fontSize: 26, fontWeight: "700", letterSpacing: 3 },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  copyText: { fontSize: 13, fontWeight: "600" },
  howBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    marginBottom: 28,
  },
  howTitle: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  howNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  howNumText: { fontSize: 13, fontWeight: "700" },
  howText: { flex: 1, fontSize: 14, lineHeight: 20 },
  shareLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 },
  shareRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  shareBtn: {
    flex: 1,
    minWidth: 70,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareBtnLabel: { fontSize: 11, fontWeight: "600" },
});

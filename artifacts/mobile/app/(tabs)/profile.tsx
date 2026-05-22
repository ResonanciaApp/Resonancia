import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const SETTINGS: { icon: FeatherIconName; label: string; sub: string }[] = [
  { icon: "bell", label: "Recordatorios Diarios", sub: "Define tu horario de práctica" },
  { icon: "moon", label: "Temporizador de Sueño", sub: "Detener al finalizar la sesión" },
  { icon: "download", label: "Biblioteca Sin Conexión", sub: "Descarga para escuchar offline" },
  { icon: "volume-2", label: "Calidad de Audio", sub: "Alta fidelidad · Sin pérdidas" },
  { icon: "globe", label: "Idioma", sub: "Español" },
  { icon: "shield", label: "Privacidad", sub: "Tus datos, protegidos" },
  { icon: "info", label: "Acerca de RESONANCE", sub: "Versión 1.0.0" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, elapsed } = usePlayer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const totalMinutesListened = Math.floor(elapsed / 60);
  const favCount = favorites.length;
  const sessionCount = SESSIONS.length;

  const stats = [
    { label: "Sesiones", value: sessionCount.toString(), icon: "disc" as FeatherIconName },
    { label: "Minutos", value: totalMinutesListened > 0 ? totalMinutesListened.toString() : "—", icon: "clock" as FeatherIconName },
    { label: "Guardadas", value: favCount.toString(), icon: "heart" as FeatherIconName },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { borderColor: "rgba(198,155,79,0.2)" }]}>
          <LinearGradient
            colors={["rgba(198,155,79,0.1)", "rgba(60,36,21,0.5)"]}
            style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
          />
          <View style={[styles.avatarCircle, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
            <Feather name="user" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>Explorador de Sonido</Text>
          <Text style={[styles.userSub, { color: colors.mutedForeground }]}>
            Miembro desde 2024 · Viaje Resonance
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={stat.icon} size={18} color={colors.accent} style={styles.statIcon} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Subscription Banner */}
        <View style={[styles.premiumBanner, { borderColor: "rgba(198,155,79,0.3)" }]}>
          <LinearGradient
            colors={["rgba(198,155,79,0.15)", "rgba(36,22,15,0.8)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />
          <View style={styles.premiumLeft}>
            <Text style={[styles.premiumTitle, { color: colors.foreground }]}>
              RESONANCE Premium
            </Text>
            <Text style={[styles.premiumSub, { color: colors.mutedForeground }]}>
              Accede a todas las sesiones, modo offline y más
            </Text>
          </View>
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={14} color={colors.primaryForeground} />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={[styles.settingsTitle, { color: colors.mutedForeground }]}>
            AJUSTES
          </Text>
          {SETTINGS.map((item, i) => (
            <View
              key={item.label}
              style={[
                styles.settingRow,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: i < SETTINGS.length - 1 ? 1 : 0,
                },
              ]}
            >
              <View style={[styles.settingIconBg, { backgroundColor: colors.card }]}>
                <Feather name={item.icon} size={16} color={colors.accent} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
                <Text style={[styles.settingSub, { color: colors.mutedForeground }]}>
                  {item.sub}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.border} />
            </View>
          ))}
        </View>

        <Text style={[styles.footer, { color: colors.border }]}>
          RESONANCE · Sonidos que te regresan a ti mismo.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  profileCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  userSub: {
    fontSize: 12,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  premiumBanner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 28,
    gap: 14,
  },
  premiumLeft: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  premiumSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  premiumBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsTitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    letterSpacing: 0.5,
    paddingBottom: 16,
  },
});

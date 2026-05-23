import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const NOTIF_SETTINGS = [
  { id: "daily", label: "Recordatorio diario", sub: "A las 08:00 · Meditación matutina", icon: "bell" as FeatherName },
  { id: "sleep", label: "Temporizador de sueño", sub: "Detener audio al dormir", icon: "moon" as FeatherName },
  { id: "community", label: "Actividad de la comunidad", sub: "Mensajes y grupos", icon: "users" as FeatherName },
];

const PREF_SECTIONS = [
  {
    title: "Audio",
    items: [
      { icon: "volume-2" as FeatherName, label: "Calidad de audio", value: "Alta fidelidad" },
      { icon: "download" as FeatherName, label: "Descargas automáticas", value: "Solo WiFi" },
      { icon: "headphones" as FeatherName, label: "Dispositivo de reproducción", value: "Altavoz" },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { icon: "user" as FeatherName, label: "Editar perfil", value: "" },
      { icon: "lock" as FeatherName, label: "Cambiar contraseña", value: "" },
      { icon: "globe" as FeatherName, label: "Idioma", value: "Español" },
      { icon: "shield" as FeatherName, label: "Privacidad y datos", value: "" },
    ],
  },
  {
    title: "App",
    items: [
      { icon: "info" as FeatherName, label: "Acerca de Resonancia", value: "v1.0.0" },
      { icon: "file-text" as FeatherName, label: "Términos y condiciones", value: "" },
      { icon: "star" as FeatherName, label: "Calificar la app", value: "" },
    ],
  },
];

export default function ConfiguracionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [toggles, setToggles] = useState<Record<string, boolean>>({ daily: true, sleep: false, community: true });

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

        <Text style={[styles.title, { color: colors.foreground }]}>Configuraciones</Text>

        {/* Notificaciones */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTIFICACIONES</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {NOTIF_SETTINGS.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.row,
                i < NOTIF_SETTINGS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name={item.icon} size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Switch
                value={toggles[item.id] ?? false}
                onValueChange={(v) => setToggles((prev) => ({ ...prev, [item.id]: v }))}
                trackColor={{ false: colors.border, true: colors.primary + "88" }}
                thumbColor={toggles[item.id] ? colors.primary : "#666"}
              />
            </View>
          ))}
        </View>

        {/* Preference sections */}
        {PREF_SECTIONS.map((sec) => (
          <View key={sec.title}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>{sec.title.toUpperCase()}</Text>
            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {sec.items.map((item, i) => (
                <Pressable
                  key={item.label}
                  style={({ pressed }) => [
                    styles.row,
                    i < sec.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name={item.icon} size={15} color={colors.primary} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}>{item.label}</Text>
                  {item.value ? (
                    <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{item.value}</Text>
                  ) : null}
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { borderColor: "#C0392B33", backgroundColor: "#C0392B11", opacity: pressed ? 0.75 : 1 }]}
        >
          <Feather name="log-out" size={16} color="#E07060" />
          <Text style={[styles.logoutText, { color: "#E07060" }]}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  group: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowSub: { fontSize: 11, marginTop: 1 },
  rowValue: { fontSize: 13, marginRight: 4 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutText: { fontSize: 14, fontWeight: "600" },
});

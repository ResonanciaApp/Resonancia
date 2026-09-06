import { Feather } from "@expo/vector-icons";
import * as Application from "expo-application";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { MilestoneCards } from "@/components/MilestoneCards";
import { isIndigoThemeId } from "@/config/scene-themes";
import type { SceneId } from "@/context/AmbientPlayerContext";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

type MenuRow = {
  icon: FeatherName;
  label: string;
  value?: string;
  description?: string;
  accent?: boolean;
  toggle?: boolean;
  onPress?: () => void;
};

type MenuSection = {
  title: string;
  rows: MenuRow[];
  compactTitle?: boolean;
};

type ProfileSettingsSectionsProps = {
  placement?: "profile" | "settings";
  sceneId: SceneId;
  foreground: string;
  mutedForeground: string;
  accent: string;
  cardBackground: string;
  onLogout: () => void;
};

export function ProfileSettingsSections({
  placement = "settings",
  sceneId,
  foreground,
  mutedForeground,
  accent,
  cardBackground,
  onLogout,
}: ProfileSettingsSectionsProps) {
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const isIndigo = isIndigoThemeId(sceneId);
  const isIndigo2 = sceneId === "indigo2";
  const themeAccent = isIndigo2 ? accent : isIndigo ? "#AAAAC4" : accent;
  const dividerColor = isIndigo
    ? "rgba(170,170,196,0.14)"
    : isIndigo2
      ? "rgba(255,255,255,0.07)"
      : "rgba(255,255,255,0.09)";
  const borderColor = isIndigo
    ? "rgba(170,170,196,0.16)"
    : isIndigo2
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.1)";

  const comingSoon = (label: string) => {
    Alert.alert(label, "Esta función estará disponible próximamente.");
  };

  const toggleMilestones = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMilestonesOpen((open) => !open);
  };

  const sections: MenuSection[] = [
    {
      title: "Tu suscripción",
      compactTitle: true,
      rows: [
        { icon: "activity", label: "Terapia en línea", onPress: () => comingSoon("Terapia en línea") },
        { icon: "gift", label: "Canjear cupón", onPress: () => comingSoon("Canjear cupón") },
        { icon: "calendar", label: "Sesiones", onPress: () => router.push("/mis-sesiones" as never) },
        { icon: "users", label: "Encuentros", onPress: () => router.push("/(tabs)/explore" as never) },
      ],
    },
    {
      title: "Preferencias",
      compactTitle: true,
      rows: [
        {
          icon: "bell",
          label: "Recordatorios de práctica",
          description: "Mañana, tarde y noche",
          onPress: () => router.push("/notificaciones-practica" as never),
        },
        { icon: "heart", label: "Conectar HealthKit", toggle: true, onPress: () => comingSoon("HealthKit") },
        { icon: "moon", label: "Tema", value: isIndigo2 ? "Índigo 2" : isIndigo ? "Índigo" : "Actual", onPress: () => comingSoon("Tema") },
        { icon: "globe", label: "Idioma", value: "Español", onPress: () => comingSoon("Idioma") },
        { icon: "download", label: "Descargas", onPress: () => comingSoon("Descargas") },
        { icon: "flag", label: "Hitos", value: milestonesOpen ? "Ocultar" : undefined, onPress: toggleMilestones },
      ],
    },
    {
      title: "Comparte bienestar",
      compactTitle: true,
      rows: [
        { icon: "gift", label: "Regalar cuenta Premium", accent: true, onPress: () => comingSoon("Regalar cuenta Premium") },
        { icon: "users", label: "Compartir acceso familiar", value: "0 / 5", onPress: () => comingSoon("Acceso familiar") },
        { icon: "share-2", label: "Compartir RESONANCE", onPress: () => comingSoon("Compartir RESONANCE") },
        { icon: "heart", label: "Calificarnos en App Store", onPress: () => comingSoon("Calificar RESONANCE") },
        { icon: "briefcase", label: "RESONANCE para empresas", onPress: () => comingSoon("RESONANCE para empresas") },
      ],
    },
    {
      title: "Asistencia e información",
      rows: [
        {
          icon: "life-buoy",
          label: "Obtener ayuda",
          description: "¿Tienes problemas con la app? Escríbenos.",
          onPress: () => router.push("/ayuda" as never),
        },
        { icon: "users", label: "Quiénes somos", onPress: () => comingSoon("Quiénes somos") },
        { icon: "book-open", label: "Términos y condiciones", onPress: () => router.push("/terminos" as never) },
        { icon: "eye", label: "Políticas de privacidad", onPress: () => router.push("/terminos" as never) },
      ],
    },
    {
      title: "Nuestras redes",
      rows: [
        { icon: "instagram", label: "Instagram", onPress: () => comingSoon("Instagram") },
        { icon: "facebook", label: "Facebook", onPress: () => comingSoon("Facebook") },
        { icon: "youtube", label: "YouTube", onPress: () => comingSoon("YouTube") },
        { icon: "radio", label: "Blog", onPress: () => comingSoon("Blog") },
      ],
    },
  ];
  const visibleSections = sections;

  return (
    <View style={styles.root}>
      {visibleSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              section.compactTitle && styles.sectionTitleCompact,
              { color: foreground },
            ]}
          >
            {section.title}
          </Text>
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            {section.rows.map((row, index) => {
              const rowColor = row.accent ? "#D8B56A" : foreground;
              return (
                <React.Fragment key={row.label}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
                  <Pressable
                    onPress={row.onPress}
                    accessibilityRole={row.toggle ? "switch" : "button"}
                    accessibilityLabel={row.label}
                    accessibilityState={row.toggle ? { checked: false } : undefined}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={styles.iconBox}>
                      <Feather name={row.icon} size={21} color={row.accent ? "#D8B56A" : "#F9F9F9"} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowLabel, { color: rowColor }]}>{row.label}</Text>
                      {row.description && (
                        <Text style={[styles.rowDescription, { color: mutedForeground }]}>{row.description}</Text>
                      )}
                    </View>
                    {row.toggle ? (
                      <Switch
                        value={false}
                        onValueChange={row.onPress}
                        trackColor={{ false: "rgba(255,255,255,0.16)", true: themeAccent }}
                        thumbColor="#F9F9F9"
                      />
                    ) : (
                      <>
                        {row.value && <Text style={[styles.rowValue, { color: mutedForeground }]}>{row.value}</Text>}
                        <Feather
                          name={row.label === "Hitos" && milestonesOpen ? "chevron-up" : "chevron-right"}
                          size={20}
                          color={themeAccent}
                        />
                      </>
                    )}
                  </Pressable>
                  {row.label === "Hitos" && milestonesOpen && (
                    <View style={[styles.milestones, { borderTopColor: dividerColor }]}>
                      <MilestoneCards showTitle={false} />
                    </View>
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>
      ))}

      {placement === "settings" && (
        <>
          <Pressable
            onPress={onLogout}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [
              styles.logoutButton,
              { borderColor: themeAccent, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="log-out" size={21} color={themeAccent} />
            <Text style={[styles.logoutText, { color: foreground }]}>Cerrar sesión</Text>
          </Pressable>

          <View style={[styles.versionCard, { backgroundColor: cardBackground, borderColor }]}>
            <Text style={[styles.versionText, { color: mutedForeground }]}>
              Versión {Application.nativeApplicationVersion ?? "1.0.0"} ({Application.nativeBuildVersion ?? "—"})
            </Text>
            <Text style={[styles.versionText, { color: mutedForeground }]}>RESONANCE · Casa del Cuenco</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: 4,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 38,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionTitleCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  card: {
    borderRadius: 17,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  row: {
    minHeight: 66,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowPressed: {
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  iconBox: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: "Manrope",
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: "600",
  },
  rowDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  rowValue: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 7,
  },
  milestones: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  logoutButton: {
    minHeight: 62,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 3,
    marginHorizontal: 2,
  },
  logoutText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
  },
  versionCard: {
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginTop: 32,
    gap: 5,
  },
  versionText: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
});
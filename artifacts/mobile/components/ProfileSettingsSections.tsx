import { Feather } from "@expo/vector-icons";
import * as Application from "expo-application";
import { LinearGradient } from "expo-linear-gradient";
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
import { isIndigoThemeId, SCENE_THEMES } from "@/config/scene-themes";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
import type { SceneId } from "@/context/AmbientPlayerContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

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
  hideTitle?: boolean;
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
  const [themesOpen, setThemesOpen] = useState(false);
  const { openGeometrix } = useGeometrixPanel();
  const { isPremium: isPremiumDev, setPremium: setPremiumDev } = usePremium();
  const { primary } = useColors();
  const { setActiveSceneWithFade } = useSceneTheme();
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

  const toggleThemes = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setThemesOpen((open) => !open);
  };

  const sections: MenuSection[] = [
    {
      title: "Preferencias",
      hideTitle: true,
      rows: [
        {
          icon: "bell",
          label: "Recordatorios de práctica",
          description: "Mañana, tarde y noche",
          onPress: () => router.push("/notificaciones-practica" as never),
        },
        { icon: "zap", label: "Racha", toggle: true },
        { icon: "smile", label: "Registro diario estado de ánimo", toggle: true },
        { icon: "moon", label: "Tema", value: SCENE_THEMES[sceneId].label, onPress: toggleThemes },
        { icon: "flag", label: "Hitos", value: milestonesOpen ? "Ocultar" : undefined, onPress: toggleMilestones },
        { icon: "help-circle", label: "Ayuda y Soporte", onPress: () => router.push("/ayuda" as never) },
      ],
    },
    {
      title: "Comparte bienestar",
      compactTitle: true,
      rows: [
        { icon: "gift", label: "Regalar cuenta Premium", accent: true, onPress: () => comingSoon("Regalar cuenta Premium") },
        { icon: "share-2", label: "Compartir Resonancia", onPress: () => comingSoon("Compartir Resonancia") },
        { icon: "heart", label: "Calificarnos en App Store", onPress: () => comingSoon("Calificar RESONANCE") },
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
      {placement === "settings" && (
        <View style={[styles.section, styles.compactSection]}>
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <Pressable
              onPress={() => router.push("/membresia")}
              accessibilityRole="button"
              accessibilityLabel="Suscripción Premium"
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.iconBox}>
                <Feather name="star" size={20} color="#F9F9F9" />
              </View>
              <Text style={[styles.sectionTitle, styles.sectionTitleCompact, styles.subscriptionTitle, { color: foreground }]}>
                Suscripción
              </Text>
              <Text style={[styles.rowValue, styles.subscriptionPremium, { color: MEMBERSHIP_AURORA.premium.accent }]}>
                Premium
              </Text>
              <Feather name="chevron-right" size={19} color={themeAccent} />
            </Pressable>
            {__DEV__ && (
              <>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <View style={styles.row}>
                  <View style={styles.iconBox}>
                    <Feather name="star" size={20} color="#F9F9F9" />
                  </View>
                  <Text style={[styles.rowLabel, styles.rowCopy, { color: foreground }]}>
                    Modo Premium (testing)
                  </Text>
                  <Switch
                    value={isPremiumDev}
                    onValueChange={setPremiumDev}
                    accessibilityLabel="Modo Premium (testing)"
                    trackColor={{ false: "rgba(61,14,22,0.50)", true: primary + "AA" }}
                    thumbColor={isPremiumDev ? primary : "#888"}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      )}
      {visibleSections.map((section, index) => (
        <View key={section.title} style={[styles.section, index < visibleSections.length - 1 && styles.compactSection]}>
          {!section.hideTitle && (
            <Text
              style={[
                styles.sectionTitle,
                section.compactTitle && styles.sectionTitleCompact,
                { color: foreground },
              ]}
            >
              {section.title}
            </Text>
          )}
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            {section.rows.map((row, index) => {
              const rowColor = row.accent ? "#D8B56A" : foreground;
              return (
                <React.Fragment key={row.label}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
                  <Pressable
                    onPress={row.toggle ? undefined : row.onPress}
                    disabled={row.toggle}
                    accessibilityRole={row.toggle ? "switch" : "button"}
                    accessibilityLabel={row.label}
                    accessibilityState={row.toggle ? { checked: false, disabled: true } : undefined}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  >
                    <View style={styles.iconBox}>
                      <Feather name={row.icon} size={20} color={row.accent ? "#D8B56A" : "#F9F9F9"} />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowLabel, { color: rowColor }]}>{row.label}</Text>
                      {row.description && (
                        <Text style={[styles.rowDescription, { color: mutedForeground }]}>{row.description}</Text>
                      )}
                    </View>
                    {row.toggle ? (
                      <Switch
                        style={styles.toggleSwitch}
                        value={false}
                        disabled
                        accessible={false}
                        trackColor={{ false: "rgba(255,255,255,0.16)", true: themeAccent }}
                        thumbColor="#F9F9F9"
                      />
                    ) : (
                      <>
                        {row.value && <Text style={[styles.rowValue, { color: mutedForeground }]}>{row.value}</Text>}
                        <Feather
                          name={(row.label === "Hitos" && milestonesOpen) || (row.label === "Tema" && themesOpen) ? "chevron-up" : "chevron-right"}
                          size={19}
                          color={themeAccent}
                        />
                      </>
                    )}
                  </Pressable>
                  {row.label === "Tema" && themesOpen && (
                    <View style={[styles.themeChoices, { borderTopColor: dividerColor }]}>
                      {Object.values(SCENE_THEMES).map((candidate) => {
                        const selected = candidate.id === sceneId;
                        return (
                          <Pressable
                            key={candidate.id}
                            onPress={() => {
                              setActiveSceneWithFade(candidate.id);
                              setThemesOpen(false);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Tema ${candidate.label}`}
                            accessibilityState={{ selected }}
                            style={({ pressed }) => [styles.themeChoice, pressed && styles.rowPressed]}
                          >
                            <LinearGradient
                              colors={[candidate.gradient[0], candidate.gradient[candidate.gradient.length - 1]]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.themeSwatch}
                            />
                            <Text style={[styles.themeChoiceLabel, { color: foreground }]}>{candidate.label}</Text>
                            {selected && <Feather name="check" size={18} color={themeAccent} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
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
            onPress={() => openGeometrix()}
            accessibilityRole="button"
            accessibilityLabel="Abrir Geometrix"
            style={({ pressed }) => [
              styles.geometrixButton,
              {
                backgroundColor: cardBackground,
                borderColor,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <View style={styles.iconBox}>
              <Feather name="hexagon" size={21} color="#F9F9F9" />
            </View>
            <Text style={[styles.geometrixText, { color: foreground }]}>Geometrix</Text>
            <Feather name="chevron-right" size={20} color={themeAccent} />
          </Pressable>

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
  compactSection: {
    marginBottom: 21,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionTitleCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  subscriptionTitle: {
    flex: 1,
    marginBottom: 0,
  },
  subscriptionPremium: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
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
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "600",
  },
  toggleSwitch: {
    transform: [{ translateY: 4 }],
  },
  themeChoices: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 5,
  },
  themeChoice: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 12,
  },
  themeSwatch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  themeChoiceLabel: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 13.5,
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
  geometrixButton: {
    minHeight: 66,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 16,
  },
  geometrixText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: "600",
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
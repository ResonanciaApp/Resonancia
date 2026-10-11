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
import { SettingsStatisticsPanel } from "@/components/SettingsStatisticsPanel";
import { isIndigoThemeId, isIndigo2ThemeId, type ThemeSceneId } from "@/config/scene-themes";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { usePremium } from "@/context/PremiumContext";
import { useEmojiWidget } from "@/context/EmojiWidgetContext";
import { useTabBarLabels } from "@/context/TabBarLabelsContext";
import { useColors } from "@/hooks/useColors";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

type MenuRow = {
  icon: FeatherName;
  label: string;
  value?: string;
  description?: string;
  accent?: boolean;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
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
  sceneId: ThemeSceneId;
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
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const { openGeometrix } = useGeometrixPanel();
  const { isPremium: isPremiumDev, setPremium: setPremiumDev } = usePremium();
  const { primary } = useColors();
  const { enabled: emojiWidgetEnabled, loaded: emojiWidgetLoaded, saving: emojiWidgetSaving, setEnabled: setEmojiWidgetEnabled } = useEmojiWidget();
  const tabBarLabels = useTabBarLabels();
  const isIndigo = isIndigoThemeId(sceneId);
  const isIndigo2 = isIndigo2ThemeId(sceneId);
  const themeAccent = isIndigo2 ? accent : isIndigo ? "#AAAAC4" : accent;
  const dividerColor = isIndigo
    ? "rgba(170,170,196,0.14)"
    : isIndigo2
      ? "rgba(255,255,255,0.07)"
      : "rgba(255,255,255,0.09)";

  const comingSoon = (label: string) => {
    Alert.alert(label, "Esta función estará disponible próximamente.");
  };

  const toggleMilestones = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMilestonesOpen((open) => !open);
  };

  const sections: MenuSection[] = [
    {
      title: "Preferencias",
      hideTitle: true,
      rows: [
        ...(placement === "settings" ? [{
          icon: "bar-chart-2" as const,
          label: "Mis estadísticas",
          onPress: () => setStatisticsOpen(true),
        }] : []),
        {
          icon: "sliders",
          label: "Personalizar notificaciones",
          description: "Elige el contenido que quieres recibir",
          onPress: () => router.push("/personalizar-notificaciones" as never),
        },
        {
          icon: "bell",
          label: "Recordatorios de práctica",
          description: "Mañana, tarde y noche",
          onPress: () => router.push("/notificaciones-practica" as never),
        },
        {
          icon: "smile",
          label: "Widget emoji",
          toggle: true,
          toggleValue: emojiWidgetEnabled,
          onToggle: emojiWidgetLoaded && !emojiWidgetSaving ? (value) => { void setEmojiWidgetEnabled(value); } : undefined,
        },
        {
          icon: "type",
          label: "Títulos del menú inferior",
          toggle: true,
          toggleValue: tabBarLabels.enabled,
          onToggle: tabBarLabels.loaded && !tabBarLabels.saving ? value => { void tabBarLabels.setEnabled(value); } : undefined,
        },
        { icon: "zap", label: "Racha", toggle: true },
        { icon: "smile", label: "Registro diario estado de ánimo", toggle: true },
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
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
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
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            {section.rows.map((row, index) => {
              const rowColor = row.accent ? "#D8B56A" : foreground;
              return (
                <React.Fragment key={row.label}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
                  <Pressable
                     onPress={row.toggle ? (row.onToggle ? () => row.onToggle?.(!row.toggleValue) : undefined) : row.onPress}
                     disabled={row.toggle && !row.onToggle}
                    accessibilityRole={row.toggle ? "switch" : "button"}
                    accessibilityLabel={row.label}
                     accessibilityState={row.toggle ? { checked: !!row.toggleValue, disabled: !row.onToggle } : undefined}
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
                         value={!!row.toggleValue}
                         disabled={!row.onToggle}
                         pointerEvents={row.onToggle ? "none" : "auto"}
                        accessible={false}
                        trackColor={{ false: "rgba(255,255,255,0.16)", true: themeAccent }}
                        thumbColor="#F9F9F9"
                      />
                    ) : (
                      <>
                        {row.value && <Text style={[styles.rowValue, { color: mutedForeground }]}>{row.value}</Text>}
                        <Feather
                           name={row.label === "Hitos" && milestonesOpen ? "chevron-up" : "chevron-right"}
                          size={19}
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
          {statisticsOpen && (
            <SettingsStatisticsPanel onClose={() => setStatisticsOpen(false)} />
          )}
          <Pressable
            onPress={() => openGeometrix()}
            accessibilityRole="button"
            accessibilityLabel="Abrir Geometrix"
            style={({ pressed }) => [
              styles.geometrixButton,
              {
                backgroundColor: cardBackground,
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

          <View style={[styles.versionCard, { backgroundColor: cardBackground }]}>
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
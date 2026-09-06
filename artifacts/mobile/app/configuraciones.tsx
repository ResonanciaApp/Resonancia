import { Feather } from "@expo/vector-icons";
import { GoldGradientFill } from "@/components/GoldGradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as StoreReview from "expo-store-review";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

import { ProfileSettingsSections } from "@/components/ProfileSettingsSections";
import { VolumeSlider } from "@/components/VolumeSlider";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { EXPANSORES } from "@/data/expansores";
import { useBrightness } from "@/context/BrightnessContext";
import { useColors } from "@/hooks/useColors";
import { FREE_TIMER_MAX_MINUTES, showPremiumGate } from "@/lib/premiumGate";
import { useNotifications } from "@/context/NotificationsContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { deleteMyAccount, exportMyAccountData } from "@workspace/api-client-react";
import { removeLocalAccountData } from "@/lib/accountData";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const SETTINGS_KEY = "@resonance_settings";

type Settings = {
  communityEnabled: boolean;
  defaultSleepMinutes: number | null;
  rachaEnabled: boolean;
};

const DEFAULTS: Settings = {
  communityEnabled: true,
  defaultSleepMinutes: null,
  rachaEnabled: true,
};

const SLEEP_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Off", value: null },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

export default function ConfiguracionesScreen() {
  const colors = useColors();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const { forceAnimate, refetchCount } = useNotifications();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { getToken } = useClerkAuth();
  const { logout, isCreator, isAdmin, isSignedIn } = useAuth();
  const { isPremium: isPremiumDev, setPremium: setPremiumDev } = usePremium();
  const { expansorId, setExpansorId } = useUserProfile();
  const { updateDefaultSleepTimer } = usePlayer();
  const { brightness, setBrightness } = useBrightness();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  const [accountAction, setAccountAction] = useState<"export" | "delete" | null>(null);
  const settingsCardBackground =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(activeSceneId)
        ? "rgba(181,211,255,0.057)"
        : activeSceneId === "indigo2"
          ? "rgba(191,207,255,0.096)"
          : "rgba(181,211,255,0.057)";
  const settingsBorderColor = isIndigoThemeId(activeSceneId)
    ? "rgba(170,170,196,0.16)"
    : activeSceneId === "indigo2"
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.1)";
  const settingsGradientLocations =
    activeTheme.gradientLocations?.length === activeTheme.gradient.length
      ? activeTheme.gradientLocations
      : undefined;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULTS, ...parsed });
        }
      } catch {} finally {
        setHydrated(true);
      }
    })();
  }, []);

  const update = (partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const onPickSleep = (minutes: number | null) => {
    if (minutes !== null && minutes > FREE_TIMER_MAX_MINUTES && !isPremiumDev) {
      showPremiumGate(
        `El temporizador gratuito llega hasta ${FREE_TIMER_MAX_MINUTES} minutos. Hazte Premium para dormir con hasta 8 horas.`,
      );
      return;
    }
    update({ defaultSleepMinutes: minutes });
    updateDefaultSleepTimer(minutes);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "Saldrás de RESONANCIA. Tu progreso queda guardado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Borrar todos mis datos",
      "Se borrarán favoritos, historial, reflexiones del diario y tu perfil de este teléfono. Esto no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: async () => {
            try {
              await removeLocalAccountData();
              Alert.alert("Listo", "Tus datos fueron borrados. La app se reiniciará.", [
                { text: "OK", onPress: () => router.replace("/onboarding") },
              ]);
            } catch {
              Alert.alert("Error", "No se pudo borrar todo. Inténtalo de nuevo.");
            }
          },
        },
      ],
    );
  };

  const handleExportAccount = async () => {
    if (accountAction) return;
    setAccountAction("export");
    try {
      const exported = await exportMyAccountData();
      const json = JSON.stringify(exported, null, 2);
      const date = exported.exportedAt.slice(0, 10);
      const filename = `resonancia-datos-${date}.json`;

      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        if (!FileSystem.cacheDirectory) {
          throw new Error("No hay directorio temporal disponible");
        }
        const uri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(uri, json);
        if (!(await Sharing.isAvailableAsync())) {
          throw new Error("El menú para compartir no está disponible");
        }
        await Sharing.shareAsync(uri, {
          dialogTitle: "Exportar mis datos de RESONANCIA",
          mimeType: "application/json",
          UTI: "public.json",
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn("[Account] export failed", error);
      Alert.alert(
        "No se pudo exportar",
        "No pudimos preparar tus datos. Comprueba tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const performAccountDeletion = async () => {
    if (accountAction) return;
    setAccountAction("delete");
    try {
      await deleteMyAccount({ confirmation: "ELIMINAR" });
      await removeLocalAccountData();
      await logout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/onboarding");
    } catch (error) {
      console.warn("[Account] deletion failed", error);
      Alert.alert(
        "No se pudo eliminar la cuenta",
        "No cierres sesión. Inténtalo de nuevo para completar la eliminación de forma segura.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const handleDeleteAccount = () => {
    if (accountAction) return;
    Alert.alert(
      "Eliminar mi cuenta",
      "Se borrarán tu cuenta, perfil, actividad, biblioteca, mensajes, datos sociales y archivos subidos. Las reservas se conservarán sin datos personales. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmación final",
              "¿Confirmas que quieres eliminar definitivamente tu cuenta de RESONANCIA?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "ELIMINAR",
                  style: "destructive",
                  onPress: performAccountDeletion,
                },
              ],
            );
          },
        },
      ],
    );
  };

  const openExternal = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("No disponible", "No pudimos abrir el enlace.");
    });
  };

  const handleRate = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Próximamente", "La app estará disponible en las tiendas pronto.");
      return;
    }
    try {
      const available = await StoreReview.isAvailableAsync();
      const hasAction = await StoreReview.hasAction();
      if (available && hasAction) {
        await StoreReview.requestReview();
        return;
      }
      const url = await StoreReview.storeUrl();
      if (url) {
        Linking.openURL(url);
        return;
      }
      Alert.alert("Próximamente", "Cuando RESONANCIA esté en la tienda, podrás calificarla aquí.");
    } catch {
      Alert.alert("Próximamente", "Cuando RESONANCIA esté en la tienda, podrás calificarla aquí.");
    }
  };

  const handleTerms = () => {
    router.push("/terminos" as never);
  };

  const handleAbout = () => {
    const version = Application.nativeApplicationVersion ?? "1.0.0";
    const build = Application.nativeBuildVersion ?? "—";
    Alert.alert(
      "RESONANCIA · Casa del Cuenco",
      `Versión ${version} (${build})`,
    );
  };

  if (!hydrated) {
    return (
      <LinearGradient
        style={styles.root}
        colors={activeTheme.gradient as unknown as [string, string, ...string[]]}
        locations={settingsGradientLocations}
        start={activeTheme.gradientStart ?? { x: 0.5, y: 0 }}
        end={activeTheme.gradientEnd ?? { x: 0.5, y: 1 }}
      />
    );
  }

  return (
    <LinearGradient
      style={styles.root}
      colors={activeTheme.gradient as unknown as [string, string, ...string[]]}
      locations={settingsGradientLocations}
      start={activeTheme.gradientStart ?? { x: 0.5, y: 0 }}
      end={activeTheme.gradientEnd ?? { x: 0.5, y: 1 }}
    >
      <StatusBar hidden />

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

        <ProfileSettingsSections
          placement="settings"
          sceneId={activeSceneId}
          foreground={colors.foreground}
          mutedForeground={activeTheme.accent ?? colors.accent}
          accent={activeTheme.accent ?? colors.primary}
          cardBackground={settingsCardBackground}
          onLogout={handleLogout}
        />

        {false && (<>
        {/* ── Notificaciones ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTIFICACIONES</Text>
        <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.row}>
            <RowIcon icon="bell" colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                Recordatorios de práctica
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Mañana, tarde y noche
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/notificaciones-practica" as never)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Administrar recordatorios de práctica"
            >
              <Feather name="chevron-right" size={21} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: "rgba(61,14,22,0.40)" }]}>
            <RowIcon icon="users" colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Actividad de la comunidad</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Mensajes y publicaciones en grupos
              </Text>
            </View>
            <Switch
              value={settings.communityEnabled}
              onValueChange={(v) => update({ communityEnabled: v })}
              trackColor={{ false: "rgba(61,14,22,0.50)", true: colors.primary + "88" }}
              thumbColor={settings.communityEnabled ? colors.primary : "#666"}
            />
          </View>
        </View>
        </>)}

        {false && (<>
        {/* ── Reproductor ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REPRODUCTOR</Text>
        <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.subBlock}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <RowIcon icon="moon" colors={colors} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Timer de sueño por defecto</Text>
                <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                  Tiempo antes de que el audio se apague solo
                </Text>
              </View>
            </View>
            <View style={styles.chipsRow}>
              {SLEEP_OPTIONS.map((opt) => {
                const active = settings.defaultSleepMinutes === opt.value;
                const locked =
                  opt.value !== null && opt.value > FREE_TIMER_MAX_MINUTES && !isPremiumDev;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => onPickSleep(opt.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? undefined : "transparent",
                        overflow: "hidden",
                        borderColor: active ? colors.primary : "rgba(61,14,22,0.50)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      },
                    ]}
                  >
                    {active && <GoldGradientFill />}
                    {locked && (
                      <Feather name="lock" size={11} color={colors.mutedForeground} />
                    )}
                    <Text style={[styles.chipText, { color: active ? "#080F0A" : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
        </>)}

        {false && (<>
        {/* ── Cuenta ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUENTA</Text>
        <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
          <ActionRow
            icon="user"
            label="Editar perfil"
            onPress={() => router.push("/(tabs)/profile" as never)}
            colors={colors}
          />
          <ActionRow
            icon="globe"
            label="Idioma"
            value="Español"
            colors={colors}
            border
            disabled
          />
          {isSignedIn && (
            <ActionRow
              icon="download"
              label="Exportar mis datos"
              value={accountAction === "export" ? "Preparando…" : undefined}
              onPress={handleExportAccount}
              colors={colors}
              border
              disabled={accountAction !== null}
            />
          )}
          {isSignedIn && (
            <ActionRow
              icon="user-x"
              label="Eliminar mi cuenta"
              value={accountAction === "delete" ? "Eliminando…" : undefined}
              onPress={handleDeleteAccount}
              colors={colors}
              border
              danger
              disabled={accountAction !== null}
            />
          )}
        </View>
        </>)}

        {/* ── Creadores ── */}
        {false && (isCreator || isAdmin) && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CREADORES</Text>
            <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
              {isCreator && (
                <ActionRow
                  icon="upload-cloud"
                  label="Subir contenido"
                  onPress={() => router.push("/crear-contenido" as never)}
                  colors={colors}
                />
              )}
              {isCreator && (
                <ActionRow
                  icon="inbox"
                  label="Mis envíos"
                  onPress={() => router.push("/mis-envios" as never)}
                  colors={colors}
                  border
                />
              )}
              {isAdmin && (
                <ActionRow
                  icon="check-square"
                  label="Revisión de contenido"
                  onPress={() => router.push("/revision" as never)}
                  colors={colors}
                  border={isCreator}
                />
              )}
              {isAdmin && (
                <ActionRow
                  icon="shield"
                  label="Panel de administración"
                  onPress={() => {
                    const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");
                    openExternal(`${base}/admin/`);
                  }}
                  colors={colors}
                  border
                />
              )}
            </View>
          </>
        )}

        {false && (<>
        {/* ── Apariencia ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APARIENCIA</Text>
        <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
          <View style={[styles.row, { flexDirection: "column", alignItems: "flex-start", paddingVertical: 14, gap: 10 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <RowIcon icon="sun" colors={colors} />
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Brillo general de la app</Text>
              <Text style={{ marginLeft: "auto", fontSize: 13, color: colors.primary, fontVariant: ["tabular-nums"] }}>
                {Math.round(brightness * 100)}%
              </Text>
            </View>
            <View style={{ width: "100%", paddingHorizontal: 4 }}>
              <VolumeSlider
                value={brightness}
                onChange={setBrightness}
                color={colors.primary}
                trackColor="rgba(255,255,255,0.10)"
              />
            </View>
          </View>
        </View>
        </>)}

        {false && (<>
        {/* ── App ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APP</Text>
        <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
          <ActionRow icon="info" label="Acerca de RESONANCIA" onPress={handleAbout} colors={colors} />
          <ActionRow icon="star" label="Calificar la app" onPress={handleRate} colors={colors} border />
          <ActionRow icon="file-text" label="Términos y privacidad" onPress={handleTerms} colors={colors} border />
          <ActionRow
            icon="trash-2"
            label="Borrar datos de este teléfono"
            onPress={handleClearData}
            colors={colors}
            border
            danger
          />
        </View>
        </>)}

        {/* ── Soporte ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SOPORTE</Text>
        <View style={[styles.group, { backgroundColor: settingsCardBackground, borderColor: settingsBorderColor }]}>
          <ActionRow
            icon="mail"
            label="Contactar al equipo"
            onPress={() => openExternal("mailto:hola@resonancia.app")}
            colors={colors}
          />
          <ActionRow
            icon="help-circle"
            label="Centro de ayuda"
            onPress={() => openExternal("https://resonancia.app/ayuda")}
            colors={colors}
            border
          />
        </View>

        {false && (<>
        {/* ── Inicio ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INICIO</Text>
        <View style={[styles.group, { backgroundColor: "transparent", borderColor: "transparent" }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(255,255,255,0.07)","rgba(255,255,255,0)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.row}>
            <RowIcon icon="activity" colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Activar días de racha</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                Muestra los 7 días de racha en el inicio
              </Text>
            </View>
            <Switch
              value={settings.rachaEnabled}
              onValueChange={(v) => update({ rachaEnabled: v })}
              trackColor={{ false: "rgba(61,14,22,0.50)", true: colors.primary + "88" }}
              thumbColor={settings.rachaEnabled ? colors.primary : "#666"}
            />
          </View>
        </View>
        </>)}

        {/* ── Dev (solo testing premium) ── */}
        {__DEV__ && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESARROLLO</Text>
            <View style={[styles.group, { backgroundColor: settingsCardBackground, borderColor: settingsBorderColor }]}>
              <View style={styles.row}>
                <RowIcon icon="star" colors={colors} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Modo Premium (testing)</Text>
                <Switch
                  value={isPremiumDev}
                  onValueChange={(v) => setPremiumDev(v)}
                  trackColor={{ false: "rgba(61,14,22,0.50)", true: colors.primary + "AA" }}
                  thumbColor={isPremiumDev ? colors.primary : "#888"}
                />
              </View>
              <Pressable
                onPress={() => {
                  const options = [
                    { text: "Sin vínculo (ninguno)", onPress: () => setExpansorId(null) },
                    ...EXPANSORES.map((e) => ({
                      text: `${e.name} (${e.country})`,
                      onPress: () => setExpansorId(e.id),
                    })),
                    { text: "Cancelar", style: "cancel" as const },
                  ];
                  Alert.alert(
                    "Vincular perfil Expansor",
                    expansorId
                      ? `Actualmente: ${EXPANSORES.find((e) => e.id === expansorId)?.name ?? expansorId}`
                      : "Sin vínculo",
                    options,
                  );
                }}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <RowIcon icon="user-check" colors={colors} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Simular perfil Expansor</Text>
                  {expansorId && (
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                      {EXPANSORES.find((e) => e.id === expansorId)?.name ?? expansorId}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={async () => {
                  await AsyncStorage.setItem("@resonance_streak_force", "1");
                  router.replace("/(tabs)" as never);
                }}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <RowIcon icon="zap" colors={colors} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Probar animación de racha</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => {
                  router.replace("/(tabs)" as never);
                  setTimeout(() => forceAnimate(), 600);
                }}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <RowIcon icon="bell" colors={colors} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Probar animación cuenco</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={async () => {
                  try {
                    const token = await getToken();
                    const res = await fetch("/api/notifications/seed-dev", {
                      method: "POST",
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (!res.ok) throw new Error(`${res.status}`);
                    refetchCount();
                    router.replace("/(tabs)" as never);
                  } catch (e) {
                    Alert.alert("Error", String(e));
                  }
                }}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <RowIcon icon="layers" colors={colors} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>Sembrar notificaciones de prueba</Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                    Crea una de cada tipo y abre la pantalla
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Limpiar Biblioteca",
                    "¿Borrar todas las carpetas y playlists?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Borrar",
                        style: "destructive",
                        onPress: async () => {
                          await AsyncStorage.multiRemove(["@resonance_folders", "@resonance_playlists"]);
                          Alert.alert("Listo", "Carpetas y playlists eliminadas. Reinicia la app.");
                        },
                      },
                    ],
                  )
                }
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
              >
                <RowIcon icon="trash-2" colors={colors} />
                <Text style={[styles.rowLabel, { color: "#D08B7A" }]}>Limpiar carpetas y playlists</Text>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </>
        )}

      </ScrollView>
    </LinearGradient>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function RowIcon({ icon, colors }: { icon: FeatherName; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.rowIcon, { backgroundColor: colors.primary + "20" }]}>
      <Feather name={icon} size={15} color={colors.primary} />
    </View>
  );
}

function ActionRow({
  icon, label, value, onPress, colors, border, danger, disabled,
}: {
  icon: FeatherName;
  label: string;
  value?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  border?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => [
        styles.row,
        border && { borderTopWidth: 1, borderTopColor: "rgba(61,14,22,0.40)" },
        { opacity: pressed && onPress ? 0.75 : disabled ? 0.5 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (danger ? "#C0392B" : colors.primary) + "20" }]}>
        <Feather name={icon} size={15} color={danger ? "#E07060" : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? "#E07060" : colors.foreground, flex: 1 }]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : onPress && !disabled ? (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontFamily: "Manrope", fontSize: 26, fontWeight: "700", marginBottom: 28 },
  sectionLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
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
  subBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: "Manrope", fontSize: 14, fontWeight: "500" },
  rowSub: { fontFamily: "Manrope", fontSize: 11, marginTop: 2, lineHeight: 15 },
  rowValue: { fontFamily: "Manrope", fontSize: 13, marginRight: 4 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
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
  logoutText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
});

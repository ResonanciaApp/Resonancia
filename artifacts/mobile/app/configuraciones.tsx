import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
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

import { SacredBackground } from "@/components/SacredBackground";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const SETTINGS_KEY = "@resonance_settings";
const DAILY_NOTIF_ID = "resonance-daily-reminder";

type Settings = {
  dailyEnabled: boolean;
  dailyHour: number;
  dailyMinute: number;
  communityEnabled: boolean;
  defaultSleepMinutes: number | null;
};

const DEFAULTS: Settings = {
  dailyEnabled: false,
  dailyHour: 8,
  dailyMinute: 0,
  communityEnabled: true,
  defaultSleepMinutes: null,
};

const TIME_OPTIONS = [
  { h: 7, m: 0 }, { h: 8, m: 0 }, { h: 9, m: 0 },
  { h: 20, m: 0 }, { h: 21, m: 0 }, { h: 22, m: 0 },
];

const SLEEP_OPTIONS: { label: string; value: number | null }[] = [
  { label: "Off", value: null },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
];

function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function scheduleDailyReminder(h: number, m: number) {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIF_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NOTIF_ID,
      content: {
        title: "RESONANCIA",
        body: "Un momento para respirar y volver a ti.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: h,
        minute: m,
        repeats: true,
      },
    });
  } catch {}
}

async function cancelDailyReminder() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIF_ID);
  } catch {}
}

export default function ConfiguracionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { logout } = useAuth();
  const { isPremium: isPremiumDev, setPremium: setPremiumDev } = usePremium();
  const { setSleepTimer } = usePlayer();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

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

  // Daily reminder toggle: request permission + schedule
  const onToggleDaily = async (v: boolean) => {
    if (Platform.OS === "web") {
      Alert.alert("No disponible", "Las notificaciones diarias funcionan solo en la app móvil.");
      return;
    }
    if (v) {
      const perm = (await Notifications.requestPermissionsAsync()) as { granted?: boolean; status?: string };
      if (!perm.granted && perm.status !== "granted") {
        Alert.alert(
          "Permiso requerido",
          "Habilita las notificaciones desde los ajustes de tu teléfono para recibir el recordatorio.",
          [{ text: "OK" }],
        );
        return;
      }
      await scheduleDailyReminder(settings.dailyHour, settings.dailyMinute);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await cancelDailyReminder();
    }
    update({ dailyEnabled: v });
  };

  const onPickTime = async (h: number, m: number) => {
    update({ dailyHour: h, dailyMinute: m });
    if (settings.dailyEnabled) {
      await scheduleDailyReminder(h, m);
    }
  };

  const onPickSleep = (minutes: number | null) => {
    update({ defaultSleepMinutes: minutes });
    setSleepTimer(minutes);
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
              const keys = await AsyncStorage.getAllKeys();
              const resonanceKeys = keys.filter((k) => k.startsWith("@resonance"));
              await AsyncStorage.multiRemove(resonanceKeys);
              await cancelDailyReminder();
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
      `Versión ${version} (${build})\n\nSonidos que te regresan a ti mismo.`,
    );
  };

  if (!hydrated) {
    return <View style={[styles.root, { backgroundColor: colors.background }]} />;
  }

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

        {/* ── Notificaciones ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NOTIFICACIONES</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <RowIcon icon="bell" colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Recordatorio diario</Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {settings.dailyEnabled
                  ? `Todos los días a las ${formatTime(settings.dailyHour, settings.dailyMinute)}`
                  : "Una pausa para respirar cada día"}
              </Text>
            </View>
            <Switch
              value={settings.dailyEnabled}
              onValueChange={onToggleDaily}
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={settings.dailyEnabled ? colors.primary : "#666"}
            />
          </View>

          {settings.dailyEnabled && (
            <View style={[styles.subBlock, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <Text style={[styles.rowSub, { color: colors.mutedForeground, marginBottom: 10 }]}>
                Hora del recordatorio
              </Text>
              <View style={styles.chipsRow}>
                {TIME_OPTIONS.map((t) => {
                  const active = settings.dailyHour === t.h && settings.dailyMinute === t.m;
                  return (
                    <Pressable
                      key={`${t.h}-${t.m}`}
                      onPress={() => onPickTime(t.h, t.m)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : "transparent",
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: active ? "#080F0A" : colors.foreground }]}>
                        {formatTime(t.h, t.m)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
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
              trackColor={{ false: colors.border, true: colors.primary + "88" }}
              thumbColor={settings.communityEnabled ? colors.primary : "#666"}
            />
          </View>
        </View>

        {/* ── Reproductor ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REPRODUCTOR</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => onPickSleep(opt.value)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.primary : "transparent",
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: active ? "#080F0A" : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Cuenta ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUENTA</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          />
        </View>

        {/* ── App ── */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>APP</Text>
        <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActionRow icon="info" label="Acerca de RESONANCIA" onPress={handleAbout} colors={colors} />
          <ActionRow icon="star" label="Calificar la app" onPress={handleRate} colors={colors} border />
          <ActionRow icon="file-text" label="Términos y privacidad" onPress={handleTerms} colors={colors} border />
          <ActionRow
            icon="trash-2"
            label="Borrar todos mis datos"
            onPress={handleClearData}
            colors={colors}
            border
            danger
          />
        </View>

        {/* ── Dev (solo testing premium) ── */}
        {__DEV__ && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESARROLLO</Text>
            <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.row}>
                <RowIcon icon="star" colors={colors} />
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>Modo Premium (testing)</Text>
                <Switch
                  value={isPremiumDev}
                  onValueChange={(v) => setPremiumDev(v)}
                  trackColor={{ false: colors.border, true: colors.primary + "AA" }}
                  thumbColor={isPremiumDev ? colors.primary : "#888"}
                />
              </View>
            </View>
          </>
        )}

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            { borderColor: "#C0392B33", backgroundColor: "#C0392B11", opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="log-out" size={16} color="#E07060" />
          <Text style={[styles.logoutText, { color: "#E07060" }]}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
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
  icon, label, value, onPress, colors, border, danger,
}: {
  icon: FeatherName;
  label: string;
  value?: string;
  onPress?: () => void;
  colors: ReturnType<typeof useColors>;
  border?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        border && { borderTopWidth: 1, borderTopColor: colors.border },
        { opacity: pressed && onPress ? 0.75 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: (danger ? "#C0392B" : colors.primary) + "20" }]}>
        <Feather name={icon} size={15} color={danger ? "#E07060" : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? "#E07060" : colors.foreground, flex: 1 }]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      ) : onPress ? (
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      ) : null}
    </Pressable>
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
  subBlock: { paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 14, fontWeight: "500" },
  rowSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  rowValue: { fontSize: 13, marginRight: 4 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
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

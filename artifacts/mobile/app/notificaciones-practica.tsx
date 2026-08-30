import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
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

import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  formatPracticeNotificationTime,
  hasPracticeNotificationPermission,
  loadPracticeNotificationSettings,
  PRACTICE_NOTIFICATION_DEFAULTS,
  PRACTICE_NOTIFICATION_LABELS,
  requestPracticeNotificationPermission,
  savePracticeNotificationSettings,
  schedulePracticeNotification,
  cancelPracticeNotification,
  type PracticeNotificationPreference,
  type PracticeNotificationSettings,
  type PracticeNotificationSlot,
} from "@/lib/practiceNotifications";

const SLOTS: {
  id: PracticeNotificationSlot;
  icon: React.ComponentProps<typeof Feather>["name"];
}[] = [
  { id: "manana", icon: "sunrise" },
  { id: "tarde", icon: "sun" },
  { id: "noche", icon: "moon" },
];

function dateForPreference(preference: PracticeNotificationPreference): Date {
  const date = new Date();
  date.setHours(preference.hour, preference.minute, 0, 0);
  return date;
}

export default function PracticeNotificationsScreen() {
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [settings, setSettings] = useState<PracticeNotificationSettings>(
    PRACTICE_NOTIFICATION_DEFAULTS,
  );
  const [hydrated, setHydrated] = useState(false);
  const [permissionMissing, setPermissionMissing] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<PracticeNotificationSlot | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());
  const [pendingSlot, setPendingSlot] = useState<PracticeNotificationSlot | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPracticeNotificationSettings();
      if (cancelled) return;
      setSettings(loaded);
      setHydrated(true);

      if (Platform.OS !== "web" && Object.values(loaded).some((item) => item.enabled)) {
        const hasPermission = await hasPracticeNotificationPermission();
        if (cancelled) return;
        setPermissionMissing(!hasPermission);
      }
    })().catch(() => {
      if (!cancelled) setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePreference = useCallback(
    async (
      slot: PracticeNotificationSlot,
      partial: Partial<PracticeNotificationPreference>,
    ) => {
      const nextPreference = { ...settings[slot], ...partial };
      const next = { ...settings, [slot]: nextPreference };

      if (nextPreference.enabled) {
        await schedulePracticeNotification(slot, nextPreference);
      } else {
        await cancelPracticeNotification(slot);
      }
      await savePracticeNotificationSettings(next);
      setSettings(next);
    },
    [settings],
  );

  const showPermissionHelp = useCallback(() => {
    Alert.alert(
      "Permiso requerido",
      "Habilita las notificaciones de RESONANCIA desde los ajustes de tu teléfono para recibir tus recordatorios.",
      [
        { text: "Ahora no", style: "cancel" },
        {
          text: "Abrir ajustes",
          onPress: () => {
            Linking.openSettings().catch(() => {});
          },
        },
      ],
    );
  }, []);

  const toggleSlot = useCallback(
    async (slot: PracticeNotificationSlot, enabled: boolean) => {
      if (pendingSlot || Platform.OS === "web") {
        if (Platform.OS === "web") {
          Alert.alert(
            "No disponible",
            "Los recordatorios funcionan solo en la app móvil.",
          );
        }
        return;
      }

      setPendingSlot(slot);
      try {
        if (enabled) {
          const permission = await requestPracticeNotificationPermission();
          if (!permission.granted) {
            setPermissionMissing(true);
            showPermissionHelp();
            return;
          }
          setPermissionMissing(false);
        }
        await updatePreference(slot, { enabled });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
          () => {},
        );
      } catch {
        Alert.alert(
          "No se pudo actualizar",
          "No pudimos guardar este recordatorio. Inténtalo de nuevo.",
        );
      } finally {
        setPendingSlot(null);
      }
    },
    [pendingSlot, showPermissionHelp, updatePreference],
  );

  const openTimePicker = useCallback(
    (slot: PracticeNotificationSlot) => {
      if (Platform.OS === "web") {
        Alert.alert(
          "No disponible",
          "El selector de hora funciona solo en la app móvil.",
        );
        return;
      }
      setPickerValue(dateForPreference(settings[slot]));
      setPickerSlot(slot);
    },
    [settings],
  );

  const adjustPickerTime = useCallback(
    (part: "hour" | "minute", delta: number) => {
      setPickerValue((current) => {
        const next = new Date(current);
        if (part === "hour") {
          next.setHours((current.getHours() + delta + 24) % 24);
        } else {
          next.setMinutes((current.getMinutes() + delta + 60) % 60);
        }
        return next;
      });
      Haptics.selectionAsync().catch(() => {});
    },
    [],
  );

  const confirmPicker = useCallback(async () => {
    const slot = pickerSlot;
    if (!slot) return;
    setPickerSlot(null);
    try {
      await updatePreference(slot, {
        hour: pickerValue.getHours(),
        minute: pickerValue.getMinutes(),
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      Alert.alert(
        "No se pudo guardar la hora",
        "Inténtalo de nuevo para actualizar el recordatorio.",
      );
    }
  }, [pickerSlot, pickerValue, updatePreference]);

  return (
    <LinearGradient
      colors={theme.gradient as [string, string, ...string[]]}
      locations={theme.gradientLocations as [number, number, ...number[]] | undefined}
      style={styles.root}
    >
      <StatusBar hidden />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.headerButton}
          >
            <Feather name="chevron-left" size={28} color="#FBFBFB" />
          </Pressable>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.card}>
          {SLOTS.map(({ id, icon }, index) => {
            const preference = settings[id];
            const isPending = pendingSlot === id;
            return (
              <View
                key={id}
                style={[styles.slot, index > 0 && styles.slotDivider]}
              >
                <View style={styles.slotIcon}>
                  <Feather name={icon} size={19} color="#FBFBFB" />
                </View>
                <View style={styles.slotCopy}>
                  <Text style={styles.slotTitle}>
                    {PRACTICE_NOTIFICATION_LABELS[id]}
                  </Text>
                  <Pressable
                    onPress={() => openTimePicker(id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cambiar hora de ${PRACTICE_NOTIFICATION_LABELS[id]}`}
                    style={({ pressed }) => [
                      styles.timeButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Feather name="clock" size={14} color="#F4D7A1" />
                    <Text style={styles.timeText}>
                      {formatPracticeNotificationTime(preference.hour, preference.minute)}
                    </Text>
                    <Feather name="edit-2" size={12} color="#CFC5D5" />
                  </Pressable>
                </View>
                <Switch
                  value={preference.enabled}
                  onValueChange={(enabled) => void toggleSlot(id, enabled)}
                  disabled={!hydrated || isPending}
                  trackColor={{ false: "rgba(255,255,255,0.16)", true: "#BE9650" }}
                  thumbColor={preference.enabled ? "#FBFBFB" : "#A9A0AE"}
                  accessibilityLabel={`Activar ${PRACTICE_NOTIFICATION_LABELS[id]}`}
                  testID={`practice-notification-toggle-${id}`}
                />
              </View>
            );
          })}
        </View>

        {permissionMissing ? (
          <Pressable
            onPress={showPermissionHelp}
            style={({ pressed }) => [styles.permissionNote, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Feather name="info" size={16} color="#F4D7A1" />
            <Text style={styles.permissionText}>
              Las notificaciones están bloqueadas. Toca aquí para abrir los ajustes.
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {pickerSlot && Platform.OS !== "web" ? (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setPickerSlot(null)}
        >
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setPickerSlot(null)}
          />
          <View style={[styles.pickerSheet, { paddingBottom: bottomPad + 18 }]}>
            <View style={styles.pickerHeader}>
              <Pressable
                onPress={() => setPickerSlot(null)}
                hitSlop={8}
                style={styles.pickerHeaderButton}
              >
                <Text style={styles.pickerCancel}>Cancelar</Text>
              </Pressable>
              <Text style={styles.pickerTitle}>Elegir hora</Text>
              <Pressable
                onPress={() => void confirmPicker()}
                hitSlop={8}
                style={styles.pickerHeaderButton}
              >
                <Text style={styles.pickerDone}>Listo</Text>
              </Pressable>
            </View>

            <View style={styles.timeSelector}>
              <View style={styles.timeSelectorColumn}>
                <Text style={styles.timeSelectorLabel}>HORA</Text>
                <Pressable
                  onPress={() => adjustPickerTime("hour", 1)}
                  style={({ pressed }) => [
                    styles.timeArrowButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Aumentar hora"
                >
                  <Feather name="chevron-up" size={28} color="#F4D7A1" />
                </Pressable>
                <Text style={styles.timeSelectorValue}>
                  {String(pickerValue.getHours()).padStart(2, "0")}
                </Text>
                <Pressable
                  onPress={() => adjustPickerTime("hour", -1)}
                  style={({ pressed }) => [
                    styles.timeArrowButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Disminuir hora"
                >
                  <Feather name="chevron-down" size={28} color="#F4D7A1" />
                </Pressable>
              </View>

              <Text style={styles.timeSelectorColon}>:</Text>

              <View style={styles.timeSelectorColumn}>
                <Text style={styles.timeSelectorLabel}>MINUTOS</Text>
                <Pressable
                  onPress={() => adjustPickerTime("minute", 5)}
                  style={({ pressed }) => [
                    styles.timeArrowButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Aumentar minutos"
                >
                  <Feather name="chevron-up" size={28} color="#F4D7A1" />
                </Pressable>
                <Text style={styles.timeSelectorValue}>
                  {String(pickerValue.getMinutes()).padStart(2, "0")}
                </Text>
                <Pressable
                  onPress={() => adjustPickerTime("minute", -5)}
                  style={({ pressed }) => [
                    styles.timeArrowButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Disminuir minutos"
                >
                  <Feather name="chevron-down" size={28} color="#F4D7A1" />
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
  },
  card: {
    borderRadius: 22,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  slot: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 17,
    minHeight: 105,
    position: "relative",
  },
  slotDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
  },
  slotIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  slotCopy: { flex: 1, paddingRight: 10 },
  slotTitle: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 9,
    paddingVertical: 3,
    paddingRight: 6,
  },
  timeText: {
    color: "#F4D7A1",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  pickerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#120A18",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    minHeight: 310,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  pickerHeaderButton: {
    minWidth: 64,
    minHeight: 38,
    justifyContent: "center",
  },
  pickerTitle: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  pickerCancel: {
    color: "#CFC5D5",
    fontFamily: "Manrope",
    fontSize: 14,
  },
  pickerDone: {
    color: "#F4D7A1",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "right",
  },
  timeSelector: {
    minHeight: 220,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  timeSelectorColumn: {
    width: 104,
    alignItems: "center",
  },
  timeSelectorLabel: {
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  timeArrowButton: {
    width: 58,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  timeSelectorValue: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 48,
    fontWeight: "500",
    lineHeight: 58,
    fontVariant: ["tabular-nums"],
  },
  timeSelectorColon: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 42,
    fontWeight: "400",
    marginTop: 10,
  },
  permissionNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  permissionText: {
    flex: 1,
    color: "rgba(255,255,255,0.72)",
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
  },
  pressed: { opacity: 0.72 },
});
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilledSunIcon } from "@/components/FilledSunIcon";
import { getSleepActionColors, getThemeStyleId, SCENE_THEMES } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  SLEEP_REMINDER_CARD_BACKGROUND,
  SLEEP_REMINDER_CONTINUE_BACKGROUND,
  SLEEP_REMINDER_CONTINUE_FOREGROUND,
} from "@/constants/colors";
import {
  formatPracticeNotificationTimeLocal,
  loadPracticeNotificationSettings,
  PRACTICE_NOTIFICATION_DEFAULTS,
  requestPracticeNotificationPermission,
  type PracticeNotificationPreference,
  updatePracticeNotificationPreference,
} from "@/lib/practiceNotifications";

type SleepReminderSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: (preference: PracticeNotificationPreference) => void;
  variant?: "sleep" | "morning";
};

const SHEET_OFFSET = 720;

export function SleepReminderSheet({
  visible,
  onClose,
  onSaved,
  variant = "sleep",
}: SleepReminderSheetProps) {
  const { theme } = useSceneTheme();
  const isMorning = variant === "morning";
  const slot = isMorning ? "manana" : "noche";
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<PracticeNotificationPreference>(
    PRACTICE_NOTIFICATION_DEFAULTS[slot],
  );
  const [chooserOpen, setChooserOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setMounted(true);
    setError(null);
    setPermissionBlocked(false);
    setChooserOpen(false);
    void loadPracticeNotificationSettings()
      .then((settings) => {
        const preference = settings[slot];
        setDraft(
          isMorning && preference.hour >= 12
            ? { ...preference, hour: PRACTICE_NOTIFICATION_DEFAULTS.manana.hour }
            : preference,
        );
      })
      .catch(() => {
        setError("No pudimos cargar tu recordatorio. Inténtalo nuevamente.");
      });
  }, [isMorning, slot, visible]);

  useEffect(() => {
    if (!mounted) return;
    if (!visible) {
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_OFFSET,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 460,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
      return;
    }
    translateY.stopAnimation();
    backdropOpacity.stopAnimation();
    translateY.setValue(SHEET_OFFSET);
    backdropOpacity.setValue(0);
    const frame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 55,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.62,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => cancelAnimationFrame(frame);
  }, [backdropOpacity, mounted, translateY, visible]);

  const adjustTime = useCallback((part: "hour" | "minute", delta: number) => {
    setDraft((current) => ({
      ...current,
      [part]: part === "hour"
        ? (current.hour + delta + (isMorning ? 12 : 24)) % (isMorning ? 12 : 24)
        : (current.minute + delta + 60) % 60,
    }));
    void Haptics.selectionAsync();
  }, [isMorning]);

  const save = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Los recordatorios diarios requieren la aplicación para iOS o Android.");
      return;
    }
    setSaving(true);
    setError(null);
    setPermissionBlocked(false);
    try {
      if (draft.enabled) {
        const permission = await requestPracticeNotificationPermission();
        if (!permission.granted) {
          setPermissionBlocked(true);
          setError("Activa las notificaciones en los ajustes del teléfono para recibir este recordatorio.");
          return;
        }
      }
      await updatePracticeNotificationPreference(slot, draft);
      onSaved(draft);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      setError("No pudimos guardar el recordatorio. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      setSaving(false);
    }
  }, [draft, onClose, onSaved, slot]);

  if (!mounted) return null;

  const sleepActionColors = isMorning ? null : getSleepActionColors(theme.id);
  const timeLabel = formatPracticeNotificationTimeLocal(draft.hour, draft.minute);
  const gradient = isMorning
    ? ["#C96D68", "#855269", "#443044"] as const
    : getThemeStyleId(theme.id) === "indigo2" && theme.id !== "galactic"
      ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]] as const
      : theme.id === "galactic" || getThemeStyleId(theme.id) === "cloudy"
        ? [theme.gradient[0], theme.gradient[1], theme.gradient[2], theme.gradient[3]] as const
        : [theme.gradient[1], theme.gradient[2]] as const;
  return (
    <Modal
      transparent
      visible
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            isMorning && styles.morningSheetBorder,
            {
              paddingBottom: Math.max(insets.bottom, 18) + 18,
              transform: [{ translateY }],
            },
          ]}
        >
          <LinearGradient
            colors={gradient}
            locations={!isMorning && getThemeStyleId(theme.id) === "cloudy" ? [0, 1 / 3, 2 / 3, 1] : undefined}
            start={!isMorning && getThemeStyleId(theme.id) === "cloudy" ? theme.gradientStart : undefined}
            end={!isMorning && getThemeStyleId(theme.id) === "cloudy" ? theme.gradientEnd : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.handle} />
          <ScrollView
            style={styles.sheetScroll}
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.sheetContent}
          >
          <View style={styles.headingRow}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Cerrar recordatorio"
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

           <Text style={styles.title}>
             {isMorning ? <>Trae tu atención{"\n"}al presente</> : <>Vuelve a ti,{"\n"}te ayudamos a recordarlo.</>}
           </Text>
           <Text style={[styles.description, isMorning && styles.morningDescription]}>
             {isMorning
               ? "Medita al menos 3 minutos en la mañana y transforma tu vida"
               : "Te enviaremos recordatorios todos los días en los horarios que tú elijas."}
          </Text>

           <View style={[styles.reminderCard, isMorning ? styles.morningReminderCard : styles.nightReminderCard]}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderLabel}>
                 {isMorning ? (
                   <FilledSunIcon size={23} color="#FFD79A" />
                 ) : (
                   <Ionicons name="moon" size={23} color="#D6C8FF" />
                 )}
                 <Text style={styles.reminderTitle}>
                   {isMorning ? "Recordatorio para meditar" : "Recordatorio para dormir"}
                 </Text>
              </View>
              <Switch
                value={draft.enabled}
                onValueChange={(enabled) => {
                  setDraft((current) => ({ ...current, enabled }));
                  void Haptics.selectionAsync();
                }}
                disabled={saving}
                trackColor={{
                  false: "rgba(255,255,255,0.20)",
                     true: isMorning ? "#C96D68" : "#7651D8",
                }}
                thumbColor="#FFFFFF"
                 accessibilityLabel={`Activar recordatorio para ${isMorning ? "meditar" : "dormir"}`}
              />
            </View>

            <Pressable
              onPress={() => setChooserOpen((current) => !current)}
              style={({ pressed }) => [
                styles.timeButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar horario, actualmente ${timeLabel}`}
            >
              <Text style={styles.timeText}>{timeLabel}</Text>
              <Feather
                name={chooserOpen ? "chevron-up" : "chevron-down"}
                size={19}
                color="rgba(255,255,255,0.7)"
              />
            </Pressable>

            {chooserOpen ? (
              <View style={styles.chooser}>
                <TimeColumn
                  label="HORA"
                   value={isMorning && draft.hour === 0 ? "12" : String(draft.hour).padStart(2, "0")}
                  onDecrease={() => adjustTime("hour", -1)}
                  onIncrease={() => adjustTime("hour", 1)}
                />
                <Text style={styles.separator}>:</Text>
                <TimeColumn
                  label="MIN"
                  value={String(draft.minute).padStart(2, "0")}
                  onDecrease={() => adjustTime("minute", -5)}
                  onIncrease={() => adjustTime("minute", 5)}
                />
              </View>
            ) : null}

            <Text style={styles.summary}>
              Recibirás una notificación a las {timeLabel}.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="info" size={16} color="#F6D89B" />
              <Text style={styles.errorText}>{error}</Text>
              {permissionBlocked ? (
                <Pressable onPress={() => void Linking.openSettings()}>
                  <Text style={styles.settingsLink}>Abrir ajustes</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={() => void save()}
            disabled={saving}
            style={({ pressed }) => [
               styles.continueButton,
               isMorning && styles.morningContinueButton,
              sleepActionColors && { backgroundColor: sleepActionColors.background },
              pressed && !saving && styles.pressed,
              saving && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Guardar recordatorio"
          >
            {saving ? (
              <ActivityIndicator color={sleepActionColors?.foreground ?? (isMorning ? "#FFFFFF" : SLEEP_REMINDER_CONTINUE_FOREGROUND)} />
            ) : (
              <Text style={[styles.continueText, !isMorning && styles.nightContinueText, sleepActionColors && { color: sleepActionColors.foreground }]}>Continuar</Text>
            )}
          </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function TimeColumn({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.timeColumn}>
      <Text style={styles.timeColumnLabel}>{label}</Text>
      <Pressable onPress={onIncrease} hitSlop={6} style={styles.stepButton}>
        <Feather name="chevron-up" size={20} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.timeColumnValue}>{value}</Text>
      <Pressable onPress={onDecrease} hitSlop={6} style={styles.stepButton}>
        <Feather name="chevron-down" size={20} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  sheet: {
    maxHeight: "92%",
    overflow: "hidden",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  morningSheetBorder: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.10)",
  },
  handle: {
    alignSelf: "center",
    width: 56,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.48)",
    marginBottom: 16,
  },
  sheetContent: {
    paddingBottom: 2,
  },
  sheetScroll: {
    flexShrink: 1,
  },
  headingRow: {
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  closeButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: 14,
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 29,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  description: {
    marginTop: 10,
    color: "rgba(255,255,255,0.72)",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 22,
  },
  morningDescription: {
    color: "#F3DDE0",
  },
  reminderCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  nightReminderCard: {
    backgroundColor: SLEEP_REMINDER_CARD_BACKGROUND,
  },
  morningReminderCard: {
    backgroundColor: "rgba(20,18,32,0.36)",
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reminderLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  reminderTitle: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  timeButton: {
    marginTop: 18,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timeText: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 32,
    lineHeight: 39,
    fontWeight: "400",
  },
  chooser: {
    marginTop: 4,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.20)",
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  timeColumn: {
    width: 82,
    alignItems: "center",
  },
  timeColumnLabel: {
    color: "rgba(255,255,255,0.48)",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  stepButton: {
    width: 44,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  timeColumnValue: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
  },
  separator: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 28,
    marginTop: 10,
  },
  summary: {
    marginTop: 10,
    color: "rgba(255,255,255,0.56)",
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
  },
  errorBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  errorText: {
    flex: 1,
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
  },
  settingsLink: {
    color: "#F6D89B",
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "800",
  },
  continueButton: {
    height: 58,
    borderRadius: 29,
    marginTop: 18,
    backgroundColor: SLEEP_REMINDER_CONTINUE_BACKGROUND,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  morningContinueButton: {
    backgroundColor: "#C96D68",
  },
  continueText: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  nightContinueText: {
    color: SLEEP_REMINDER_CONTINUE_FOREGROUND,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
});
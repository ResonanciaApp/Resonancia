import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PracticeNotificationSlot = "manana" | "tarde" | "noche";

export interface PracticeNotificationPreference {
  enabled: boolean;
  hour: number;
  minute: number;
}

export type PracticeNotificationSettings = Record<
  PracticeNotificationSlot,
  PracticeNotificationPreference
>;

export const PRACTICE_NOTIFICATION_SETTINGS_KEY =
  "@resonancia_practice_notifications";
export const PRACTICE_REMINDER_SLOT_KEY = "@resonance_reminder_slot";

const LEGACY_PROFILE_REMINDER_KEY = "@profile_reminder";
const LEGACY_SETTINGS_KEY = "@resonance_settings";
const LEGACY_DAILY_NOTIFICATION_ID = "resonance-daily-reminder";
const PRACTICE_CHANNEL_ID = "practice-reminders";

export const PRACTICE_NOTIFICATION_IDS: Record<
  PracticeNotificationSlot,
  string
> = {
  manana: "resonancia-practice-manana",
  tarde: "resonancia-practice-tarde",
  noche: "resonancia-practice-noche",
};

export const PRACTICE_NOTIFICATION_LABELS: Record<
  PracticeNotificationSlot,
  string
> = {
  manana: "Alarma matutina",
  tarde: "Alarma vespertina",
  noche: "Alarma nocturna",
};

export const PRACTICE_NOTIFICATION_DEFAULTS: PracticeNotificationSettings = {
  manana: { enabled: false, hour: 8, minute: 0 },
  tarde: { enabled: false, hour: 15, minute: 0 },
  noche: { enabled: false, hour: 21, minute: 0 },
};

const VALID_SLOTS: PracticeNotificationSlot[] = ["manana", "tarde", "noche"];

function cloneDefaults(): PracticeNotificationSettings {
  return {
    manana: { ...PRACTICE_NOTIFICATION_DEFAULTS.manana },
    tarde: { ...PRACTICE_NOTIFICATION_DEFAULTS.tarde },
    noche: { ...PRACTICE_NOTIFICATION_DEFAULTS.noche },
  };
}

function validTime(hour: unknown, minute: unknown): boolean {
  return (
    typeof hour === "number" &&
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    typeof minute === "number" &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59
  );
}

function parseSettings(raw: string | null): PracticeNotificationSettings | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    const next = cloneDefaults();
    let found = false;

    for (const slot of VALID_SLOTS) {
      const value = record[slot];
      if (!value || typeof value !== "object") continue;
      const candidate = value as Record<string, unknown>;
      if (!validTime(candidate.hour, candidate.minute)) continue;
      next[slot] = {
        enabled: candidate.enabled === true,
        hour: candidate.hour as number,
        minute: candidate.minute as number,
      };
      found = true;
    }

    return found ? next : null;
  } catch {
    return null;
  }
}

function validSlot(value: unknown): value is PracticeNotificationSlot {
  return typeof value === "string" && VALID_SLOTS.includes(value as PracticeNotificationSlot);
}

function parseLegacyReminder(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const reminder = parsed as Record<string, unknown>;
    if (!validTime(reminder.hour, reminder.minute)) return null;
    return {
      enabled: reminder.enabled === true,
      hour: reminder.hour as number,
      minute: reminder.minute as number,
    };
  } catch {
    return null;
  }
}

async function clearLegacyReminderPreferences(): Promise<void> {
  const legacySettings = await AsyncStorage.getItem(LEGACY_SETTINGS_KEY);
  const writes: Promise<unknown>[] = [
    AsyncStorage.removeItem(LEGACY_PROFILE_REMINDER_KEY),
  ];

  if (legacySettings) {
    try {
      const parsed: unknown = JSON.parse(legacySettings);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const cleaned = { ...(parsed as Record<string, unknown>) };
        delete cleaned.dailyEnabled;
        delete cleaned.dailyHour;
        delete cleaned.dailyMinute;
        writes.push(
          AsyncStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(cleaned)),
        );
      }
    } catch {
      // Preserve unrelated settings when the old JSON cannot be parsed.
    }
  }

  await Promise.all(writes);
}

/**
 * Reads the current three-slot model. Older builds stored one reminder either
 * in @resonance_settings.daily* or, in older profile builds, @profile_reminder.
 * Settings is authoritative because it owned the actual scheduled identifier.
 */
export async function loadPracticeNotificationSettings(): Promise<PracticeNotificationSettings> {
  const current = parseSettings(
    await AsyncStorage.getItem(PRACTICE_NOTIFICATION_SETTINGS_KEY),
  );
  if (current) {
    // Retry on every load. A previous build may have persisted the migration
    // before the legacy cancellation completed.
    await cancelLegacyDailyReminder();
    await clearLegacyReminderPreferences();
    return current;
  }

  const next = cloneDefaults();
  const [legacyProfile, legacySettings, legacySlot] = await Promise.all([
    AsyncStorage.getItem(LEGACY_PROFILE_REMINDER_KEY),
    AsyncStorage.getItem(LEGACY_SETTINGS_KEY),
    AsyncStorage.getItem(PRACTICE_REMINDER_SLOT_KEY),
  ]);

  const profileReminder = parseLegacyReminder(legacyProfile);
  let settingsReminder: {
    enabled: boolean;
    hour: number;
    minute: number;
  } | null = null;
  if (legacySettings) {
    try {
      const parsed: unknown = JSON.parse(legacySettings);
      if (parsed && typeof parsed === "object") {
        const record = parsed as Record<string, unknown>;
        if (validTime(record.dailyHour, record.dailyMinute)) {
          settingsReminder = {
            enabled: record.dailyEnabled === true,
            hour: record.dailyHour as number,
            minute: record.dailyMinute as number,
          };
        }
      }
    } catch {
      // A corrupt legacy value should not block the new settings screen.
    }
  }

  const legacy = settingsReminder ?? profileReminder;
  if (legacy) {
    const slot: PracticeNotificationSlot = validSlot(legacySlot)
      ? legacySlot
      : "manana";
    next[slot] = { ...legacy };
  }

  await savePracticeNotificationSettings(next);
  await cancelLegacyDailyReminder();
  await clearLegacyReminderPreferences();
  return next;
}

let initializePromise: Promise<PracticeNotificationSettings> | null = null;

/**
 * Migrates and reconciles schedules at startup without prompting. Permission is
 * requested only after the user explicitly enables a reminder on the screen.
 */
export function initializePracticeNotifications(): Promise<PracticeNotificationSettings> {
  if (initializePromise) return initializePromise;

  initializePromise = (async () => {
    const settings = await loadPracticeNotificationSettings();
    if (Platform.OS === "web") return settings;

    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.status !== "granted") return settings;

    await Promise.allSettled(
      VALID_SLOTS.map((slot) =>
        settings[slot].enabled
          ? schedulePracticeNotification(slot, settings[slot])
          : cancelPracticeNotification(slot),
      ),
    );
    return settings;
  })().finally(() => {
    initializePromise = null;
  });

  return initializePromise;
}

export async function savePracticeNotificationSettings(
  settings: PracticeNotificationSettings,
): Promise<void> {
  await AsyncStorage.setItem(
    PRACTICE_NOTIFICATION_SETTINGS_KEY,
    JSON.stringify(settings),
  );
}

async function ensurePracticeChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(PRACTICE_CHANNEL_ID, {
    name: "Recordatorios de práctica",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#F9F9F9",
  });
}

export async function requestPracticeNotificationPermission(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> {
  if (Platform.OS === "web") {
    return { granted: false, canAskAgain: false };
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.status === "granted") {
    return { granted: true, canAskAgain: current.canAskAgain };
  }
  const requested = await Notifications.requestPermissionsAsync();
  return {
    granted: requested.granted || requested.status === "granted",
    canAskAgain: requested.canAskAgain,
  };
}

export async function hasPracticeNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const permission = await Notifications.getPermissionsAsync();
  return permission.granted || permission.status === "granted";
}

export async function schedulePracticeNotification(
  slot: PracticeNotificationSlot,
  preference: PracticeNotificationPreference,
): Promise<void> {
  if (Platform.OS === "web") return;
  await ensurePracticeChannel();
  const identifier = PRACTICE_NOTIFICATION_IDS[slot];
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title: "RESONANCIA",
      body: `Un momento para tu práctica ${slot === "manana" ? "de la mañana" : slot === "tarde" ? "de la tarde" : "de la noche"}.`,
      sound: true,
      data: { kind: "practice_reminder", slot },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: preference.hour,
      minute: preference.minute,
      repeats: true,
      channelId: PRACTICE_CHANNEL_ID,
    },
  });
}

export async function cancelPracticeNotification(
  slot: PracticeNotificationSlot,
): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(
    PRACTICE_NOTIFICATION_IDS[slot],
  ).catch(() => {});
}

export async function cancelLegacyDailyReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(
    LEGACY_DAILY_NOTIFICATION_ID,
  ).catch(() => {});
}

export async function cancelAllPracticeNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await Promise.all([
    ...VALID_SLOTS.map((slot) => cancelPracticeNotification(slot)),
    cancelLegacyDailyReminder(),
  ]);
}

export function formatPracticeNotificationTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyFollowCounts,
  getGetMyFollowCountsQueryKey,
} from "@workspace/api-client-react";
import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";
import { getSessionById } from "@/data/sessions";
import { usePremium } from "@/context/PremiumContext";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import {
  BG_GRADIENTS,
  bgGradientColors,
  brightnessFactor,
  gradientColors,
  HOME_GRADIENT,
  scaleColors,
  scaleHex,
} from "@/data/geometrix-creations";
import { SacredGlyph } from "@/components/SacredGlyph";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];


function resizeImageForWeb(uri: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no ctx")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = uri;
  });
}

/** Local day key (year-month-day) using device time, for streak grouping */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const WEEK_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

/** Day-of-week index Mon=0 … Sun=6 (ISO aligned) */
function isoDow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** Count consecutive active days ending today or yesterday */
function computeStreak(events: { playedAt: string }[]): number {
  if (events.length === 0) return 0;
  const days = new Set(events.map((e) => dayKey(new Date(e.playedAt))));
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yKey = dayKey(yesterday);

  let cursor: Date;
  if (days.has(todayKey)) cursor = today;
  else if (days.has(yKey)) cursor = yesterday;
  else return 0;

  let count = 0;
  const walk = new Date(cursor);
  while (days.has(dayKey(walk))) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

// ── Personalize sheet styles (defined before component to avoid TDZ on Hermes)
const pStyles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#090C1F",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: "#1a2046",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A3545",
    alignSelf: "center",
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EDE1D3",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: "#7A8FA8",
    marginBottom: 14,
    lineHeight: 17,
  },
  creationThumb: {
    width: 88,
    marginRight: 10,
    alignItems: "center",
  },
  thumbBg: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#12122f",
  },
  thumbBgOn: {
    borderColor: "#1a2046",
  },
  thumbCheck: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  thumbLabel: {
    fontSize: 11,
    color: "#7A8FA8",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "#7A8FA8",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#12122f",
  },
  swatchOn: {
    borderColor: "#1a2046",
  },
  swatchGrad: {
    flex: 1,
  },
  reminderCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reminderBell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(190,150,80,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderLabel: {
    flex: 1,
    fontSize: 14,
    color: "#EDE1D3",
    fontWeight: "500",
  },
  timePicker: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E2A38",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 10,
    color: "#7A8FA8",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginBottom: 16,
  },
  timeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(190,150,80,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    fontSize: 38,
    fontWeight: "200",
    color: "#EDE1D3",
    letterSpacing: 3,
    minWidth: 120,
    textAlign: "center",
  },
  minuteRow: {
    flexDirection: "row",
    gap: 8,
  },
  minuteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  minuteBtnOn: {
    backgroundColor: "rgba(190,150,80,0.12)",
  },
  minuteText: {
    fontSize: 13,
    color: "#7A8FA8",
    fontWeight: "500",
  },
});

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites, elapsed, history, statEvents, currentSession, isPlaying } = usePlayer();
  const { presets } = useMixer();
  const { isPremium } = usePremium();
  const {
    username,
    lastName,
    location,
    description,
    photoUri,
    updateProfile,
    setPhotoUri,
  } = useUserProfile();

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: 60_000 } });
  const { data: followCounts } = useGetMyFollowCounts({
    query: { queryKey: getGetMyFollowCountsQueryKey(), staleTime: 30_000 },
  });
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })
    : null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Geometrix creations (for profile background picker) ───────────────────
  const { creations: geoCreations } = useGeometrixCreations();

  // ── Personalize sheet ─────────────────────────────────────────────────────
  const [personalizeVisible, setPersonalizeVisible] = useState(false);
  const [profileBgGradientId, setProfileBgGradientId] = useState<string | null>(null);
  const [profileBgCreationId, setProfileBgCreationId] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [gradId, creId, rem] = await Promise.all([
          AsyncStorage.getItem("@profile_bg_gradient"),
          AsyncStorage.getItem("@profile_bg_creation"),
          AsyncStorage.getItem("@profile_reminder"),
        ]);
        if (gradId !== null) setProfileBgGradientId(gradId === "null" ? null : gradId);
        if (creId !== null) setProfileBgCreationId(creId === "null" ? null : creId);
        if (rem) {
          const p = JSON.parse(rem) as { enabled: boolean; hour: number; minute: number };
          setReminderEnabled(p.enabled ?? false);
          setReminderHour(p.hour ?? 8);
          setReminderMinute(p.minute ?? 0);
        }
      } catch {}
    })();
  }, []);

  const selectGradient = async (id: string | null) => {
    setProfileBgGradientId(id);
    await AsyncStorage.setItem("@profile_bg_gradient", id ?? "null");
    if (id !== null) {
      setProfileBgCreationId(null);
      await AsyncStorage.setItem("@profile_bg_creation", "null");
    }
  };
  const selectCreation = async (id: string | null) => {
    setProfileBgCreationId(id);
    await AsyncStorage.setItem("@profile_bg_creation", id ?? "null");
    if (id !== null) {
      setProfileBgGradientId(null);
      await AsyncStorage.setItem("@profile_bg_gradient", "null");
    }
  };
  const saveReminder = async (enabled: boolean, hour: number, minute: number) => {
    setReminderEnabled(enabled);
    setReminderHour(hour);
    setReminderMinute(minute);
    await AsyncStorage.setItem("@profile_reminder", JSON.stringify({ enabled, hour, minute }));
  };

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [editVisible, setEditVisible] = useState(false);
  const [editNombre, setEditNombre] = useState(username);
  const [editApellido, setEditApellido] = useState(lastName);
  const [editLocation, setEditLocationLocal] = useState(location);
  const [editDesc, setEditDesc] = useState(description);

  const openEdit = () => {
    setEditNombre(username);
    setEditApellido(lastName);
    setEditLocationLocal(location);
    setEditDesc(description);
    setEditVisible(true);
  };

  const saveEdit = () => {
    updateProfile({
      username: editNombre,
      lastName: editApellido,
      location: editLocation,
      description: editDesc,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditVisible(false);
  };

  // ── Photo picker ──────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const tempUri = result.assets[0].uri;
      if (Platform.OS === "web") {
        try {
          const dataUrl = await resizeImageForWeb(tempUri, 320);
          setPhotoUri(dataUrl);
        } catch {
          setPhotoUri(tempUri);
        }
      } else {
        try {
          const ext = tempUri.split(".").pop()?.split("?")[0] ?? "jpg";
          const src = new FSFile(tempUri);
          const dest = new FSFile(Paths.document, `profile_photo.${ext}`);
          src.copy(dest);
          setPhotoUri(dest.uri);
        } catch {
          setPhotoUri(tempUri);
        }
      }
    }
  };


  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalMinutes = Math.floor(elapsed / 60);

  const stats: {
    label: string;
    value: string;
    icon: FeatherIconName;
    href?: string;
  }[] = [
    {
      label: "Recientes",
      value: history.length.toString(),
      icon: "clock",
      href: "/recientes",
    },
    {
      label: "Minutos",
      value: totalMinutes > 0 ? totalMinutes.toString() : "—",
      icon: "activity",
    },
    {
      label: "Mezclas",
      value: presets.length.toString(),
      icon: "sliders",
      href: "/musica",
    },
  ];

  // ── Favorite sessions ─────────────────────────────────────────────────────
  const favSessions = favorites
    .map((id) => getSessionById(id))
    .filter(Boolean);

  // ── Activity summary (week minutes, top category, top session, streak) ──────
  const activity = useMemo(() => {
    const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let weeklyMinutes = 0;
    const categoryCount = new Map<string, number>();
    const sessionCount = new Map<string, number>();

    for (const e of statEvents) {
      if (new Date(e.playedAt).getTime() >= weekCutoff) {
        weeklyMinutes += e.minutes;
      }
      categoryCount.set(e.categoryLabel, (categoryCount.get(e.categoryLabel) ?? 0) + 1);
      sessionCount.set(e.sessionId, (sessionCount.get(e.sessionId) ?? 0) + 1);
    }

    let topCategory: string | null = null;
    let topCategoryN = 0;
    for (const [label, n] of categoryCount) {
      if (n > topCategoryN) {
        topCategoryN = n;
        topCategory = label;
      }
    }

    let topSessionId: string | null = null;
    let topSessionN = 0;
    for (const [id, n] of sessionCount) {
      if (n > topSessionN) {
        topSessionN = n;
        topSessionId = id;
      }
    }

    const topSession = topSessionId ? getSessionById(topSessionId) : null;
    const streak = computeStreak(statEvents);

    // Max streak
    const days = Array.from(new Set(statEvents.map((e) => dayKey(new Date(e.playedAt))))).sort();
    let maxStreak = 0;
    let run = 0;
    for (let i = 0; i < days.length; i++) {
      if (i === 0) { run = 1; }
      else {
        const prev = new Date(days[i - 1].split("-").map(Number).join("-"));
        const curr = new Date(days[i].split("-").map(Number).join("-"));
        const diffMs = curr.getTime() - prev.getTime();
        run = diffMs <= 24 * 60 * 60 * 1000 + 60_000 ? run + 1 : 1;
      }
      if (run > maxStreak) maxStreak = run;
    }

    // This-week day activity (Mon=0..Sun=6)
    const minutesByDay = new Map<string, number>();
    for (const e of statEvents) {
      const k = dayKey(new Date(e.playedAt));
      minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + e.minutes);
    }
    const today = new Date();
    const todayDow = isoDow(today);
    const weekActivity: boolean[] = Array(7).fill(false);
    for (let d = 0; d <= todayDow; d++) {
      const target = new Date(today);
      target.setDate(today.getDate() - (todayDow - d));
      weekActivity[d] = minutesByDay.has(dayKey(target));
    }

    return {
      weeklyMinutes: Math.round(weeklyMinutes),
      topCategory,
      topSession,
      streak,
      maxStreak,
      weekActivity,
      hasData: statEvents.length > 0,
    };
  }, [statEvents]);

  // ── Fondo activo (degradado de perfil) ────────────────────────────────────
  const activeBgColors = useMemo((): readonly [string, string] => {
    if (profileBgCreationId) {
      const creation = geoCreations.find((c) => c.id === profileBgCreationId);
      if (creation) {
        const bgFactor = brightnessFactor(creation.master.bgBrightness);
        const bgGrad = bgGradientColors(creation.master.bgGradientId);
        const bgColors = creation.master.bgColor
          ? ([scaleHex(creation.master.bgColor, bgFactor), scaleHex(creation.master.bgColor, bgFactor)] as const)
          : (scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor) as readonly [string, string]);
        return bgColors;
      }
    }
    if (profileBgGradientId) {
      const bg = bgGradientColors(profileBgGradientId);
      if (bg) return bg;
    }
    return [BG_GRADIENT[0], BG_GRADIENT[2]];
  }, [profileBgCreationId, profileBgGradientId, geoCreations]);

  // ── Crossfade de fondo ────────────────────────────────────────────────────
  const defaultBg = [BG_GRADIENT[0], BG_GRADIENT[2]] as const;
  const [bgFrom, setBgFrom] = useState<readonly [string, string]>(defaultBg);
  const [bgTo, setBgTo] = useState<readonly [string, string]>(defaultBg);
  const crossFadeAnim = useRef(new Animated.Value(1)).current;
  const prevBgRef = useRef<readonly [string, string]>(defaultBg);
  const bgMountedRef = useRef(false);

  useEffect(() => {
    if (!bgMountedRef.current) {
      bgMountedRef.current = true;
      setBgFrom(activeBgColors);
      setBgTo(activeBgColors);
      crossFadeAnim.setValue(1);
      prevBgRef.current = activeBgColors;
      return;
    }
    const prev = prevBgRef.current;
    const next = activeBgColors;
    if (prev[0] === next[0] && prev[1] === next[1]) return;
    prevBgRef.current = next;
    // 1. Actualizar state: bgFrom = color actual, bgTo = color nuevo
    setBgFrom(prev);
    setBgTo(next);
    // 2. Diferir el reset del Animated.Value hasta que React haya comiteado
    //    el nuevo bgFrom en la capa nativa (evita el flash de un frame).
    const raf = requestAnimationFrame(() => {
      crossFadeAnim.setValue(0);
      Animated.timing(crossFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeBgColors, crossFadeAnim]);

  return (
    <View style={styles.root}>
      {/* Fondo anterior — se desvanece */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        pointerEvents="none"
      >
        <LinearGradient colors={[...bgFrom]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      </Animated.View>
      {/* Fondo nuevo — aparece */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim }]}
        pointerEvents="none"
      >
        <LinearGradient colors={[...bgTo]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      </Animated.View>
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: "#FFFFFF" }]}>Perfil</Text>
          <Pressable
            onPress={() => setPersonalizeVisible(true)}
            hitSlop={12}
            style={({ pressed }) => [styles.settingsBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="sliders" size={20} color="#BE9650" />
          </Pressable>
        </View>

        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>

          {/* Avatar */}
          <Pressable onPress={pickPhoto} style={styles.avatarWrapper}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
                <Feather name="user" size={28} color={colors.primary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              <Feather name="camera" size={11} color="#fff" />
            </View>
          </Pressable>

          {/* Name + details */}
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {username}{lastName ? ` ${lastName}` : ""}
          </Text>

          {location ? (
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{location}</Text>
            </View>
          ) : null}

          {description ? (
            <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{description}</Text>
          ) : null}

          {memberSince ? (
            <View style={styles.locationRow}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                Miembro desde {memberSince}
              </Text>
            </View>
          ) : null}

          {/* Seguidores / Siguiendo */}
          <View style={styles.followCountsRow}>
            <Pressable
              onPress={() => router.push("/seguidores" as never)}
              style={styles.followCountItem}
            >
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {followCounts?.followersCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>seguidores</Text>
            </Pressable>
            <View style={[styles.followCountDivider, { backgroundColor: colors.border ?? "#1E2A38" }]} />
            <Pressable
              onPress={() => router.push("/siguiendo" as never)}
              style={styles.followCountItem}
            >
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {followCounts?.followingCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>siguiendo</Text>
            </Pressable>
          </View>

          {/* Editar Detalles button */}
          <Pressable
            onPress={openEdit}
            style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Feather name="edit-2" size={13} color={colors.primary} />
            <Text style={[styles.editBtnText, { color: colors.primary }]}>Editar Detalles</Text>
          </Pressable>
        </View>

        {/* ── Plan ── */}
        <Pressable
          onPress={() => router.push("/membresia" as never)}
          style={({ pressed }) => [
            styles.planCard,
            { backgroundColor: "rgba(255,255,255,0.03)", opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {isPremium ? (
            <View style={[styles.planIconWrap, { backgroundColor: "rgba(26,90,60,0.5)" }]}>
              <MaterialCommunityIcons name="star" size={20} color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.planIconWrap, { backgroundColor: "rgba(122,143,168,0.12)" }]}>
              <Feather name="user" size={20} color={colors.mutedForeground} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.planTitle, { color: isPremium ? colors.primary : colors.foreground }]}>
              {isPremium ? "Plan Premium" : "Plan Free"}
            </Text>
            <Text style={[styles.planSub, { color: colors.mutedForeground }]}>
              {isPremium ? "¡Tienes acceso completo al catálogo!" : "Acceso limitado al catálogo"}
            </Text>
          </View>
          {isPremium ? (
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          ) : (
            <View style={styles.planMejorar}>
              <Text style={[styles.planMejorarText, { color: colors.primary }]}>Mejorar</Text>
              <Feather name="chevron-right" size={15} color={colors.primary} />
            </View>
          )}
        </Pressable>

        {/* Banner premium (solo Free) */}
        {!isPremium && (
          <Pressable onPress={() => router.push("/membresia" as never)} style={styles.premiumBanner}>
            <LinearGradient
              colors={["#090D20", "#080A18", "#06070F"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
            <View style={styles.premiumGlow} />
            <View style={styles.premiumLeft}>
              <View style={styles.premiumTitleRow}>
                <Image source={require("../../assets/images/estrella-premium.png")} style={{ width: 13, height: 13, marginRight: 6 }} contentFit="contain" />
                <Text style={[styles.premiumTitle, { color: "#EDE7DA" }]}>Prueba Premium</Text>
              </View>
              <Text style={[styles.premiumSub, { color: "#FFFFFF", marginBottom: 10 }]}>
                Lleva tu relajación al siguiente nivel y accede a:
              </Text>
              {[
                { icon: "headphones", text: "+500 meditaciones" },
                { icon: "music",      text: "+50 Música y sonidos relajantes" },
                { icon: "users",      text: "Muro general de la comunidad" },
              ].map((f) => (
                <View key={f.text} style={styles.premiumFeatureRow}>
                  <Feather name={f.icon as never} size={11} color="#BE9650" />
                  <Text style={[styles.premiumFeatureText, { color: "#FFFFFF" }]}>{f.text}</Text>
                </View>
              ))}
            </View>
            <View style={[styles.premiumBadge, { backgroundColor: "#17352A", borderColor: "#A97A34" }]}>
              <Image source={require("../../assets/images/estrella-premium.png")} style={{ width: 20, height: 20 }} contentFit="contain" />
            </View>
          </Pressable>
        )}

        {/* ── Comunidad ── */}
        <View style={styles.communityRow}>
          {[
            { label: "Amigos",  icon: "users"     as const, route: "/amigos"  },
            { label: "Diario",  icon: "book-open" as const, route: "/diario"  },
            { label: "Grupos",  icon: "globe"     as const, route: "/grupos"  },
          ].map(({ label, icon, route }) => (
            <Pressable
              key={label}
              onPress={() => router.push(route as never)}
              style={({ pressed }) => [
                styles.communityCard,
                {
                  backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Feather name={icon} size={22} color="#FFFFFF" />
              <Text style={[styles.communityLabel, { color: "#FFFFFF" }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Tu Progreso (racha card) ── */}
        <View style={[styles.rachaCard, { backgroundColor: "rgba(255,255,255,0.03)" }]}>
          {/* Header: flame + title */}
          <View style={styles.rachaTop}>
            <View style={[styles.rachaBubble, { backgroundColor: "rgba(255,255,255,0.03)" }]}>
              <Text style={styles.rachaFlame}>{activity.streak > 0 ? "🔥" : "✨"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rachaValue, { color: colors.foreground }]}>
                {activity.streak > 0
                  ? `${activity.streak} día${activity.streak !== 1 ? "s" : ""} de racha`
                  : "Comienza tu racha"}
              </Text>
              <Text style={[styles.rachaSub, { color: colors.mutedForeground }]}>
                {activity.streak > 0
                  ? "Sigue así, no pierdas tu constancia"
                  : "Escucha una sesión hoy para empezar"}
              </Text>
            </View>
          </View>

          {/* Week day circles */}
          <View style={styles.rachaWeekRow}>
            {WEEK_INITIALS.map((label, i) => {
              const done = activity.weekActivity[i];
              const isToday = i === isoDow(new Date());
              return (
                <View key={i} style={styles.rachaDayPill}>
                  <Text style={[styles.rachaDayLabel, { color: isToday ? colors.foreground : colors.mutedForeground }]}>
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.rachaDayCircle,
                      {
                        backgroundColor: done ? colors.primary : "transparent",
                        borderColor: done ? colors.primary : isToday ? colors.foreground : colors.border ?? "#1E2A38",
                      },
                    ]}
                  >
                    {done && <Feather name="check" size={13} color="#090F17" />}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Max streak row */}
          <View style={[styles.rachaMaxRow, { borderTopColor: colors.border ?? "#1E2A38" }]}>
            <View style={[styles.rachaMaxIcon, { backgroundColor: "rgba(255,255,255,0.03)" }]}>
              <Text style={{ fontSize: 16 }}>🛡️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rachaMaxLabel, { color: colors.foreground }]}>Racha máxima</Text>
              <Text style={[styles.rachaMaxSub, { color: colors.mutedForeground }]}>Tu récord personal</Text>
            </View>
            <Text style={[styles.rachaMaxValue, { color: colors.primary }]}>
              {activity.maxStreak > 0 ? `${activity.maxStreak} días` : "—"}
            </Text>
          </View>

          {/* Ver más */}
          <Pressable
            onPress={() => router.push("/progreso" as never)}
            style={({ pressed }) => [styles.rachaVerMas, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.rachaVerMasText, { color: colors.primary }]}>Ver progreso completo</Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: colors.border }]}>
          RESONANCE · Sonidos que te regresan a ti mismo.
        </Text>
      </ScrollView>

      {/* ── Personalize Sheet ── */}
      <Modal
        visible={personalizeVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPersonalizeVisible(false)}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
            onPress={() => setPersonalizeVisible(false)}
          />
          <View style={[pStyles.sheet, { paddingBottom: bottomPad + 24 }]}>
            {/* Handle */}
            <View style={pStyles.handle} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 0 }}>

              {/* ── Geometrix ── */}
              <Text style={pStyles.sectionTitle}>Fondo de Geometrix</Text>
              <Text style={pStyles.sectionSub}>Elige una de tus creaciones como fondo de perfil</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 28 }}
                contentContainerStyle={{ paddingRight: 4 }}
              >
                {/* Ninguno */}
                <Pressable
                  onPress={() => selectCreation(null)}
                  style={pStyles.creationThumb}
                >
                  <View
                    style={[
                      pStyles.thumbBg,
                      { backgroundColor: "#0B0F14", alignItems: "center", justifyContent: "center" },
                      profileBgCreationId === null && pStyles.thumbBgOn,
                    ]}
                  >
                    <Feather name="x" size={22} color="#4A5568" />
                  </View>
                  <Text style={pStyles.thumbLabel}>Ninguno</Text>
                </Pressable>

                {geoCreations.length === 0 ? (
                  <View style={{ justifyContent: "center", paddingHorizontal: 16 }}>
                    <Text style={pStyles.emptyText}>Aún no tienes creaciones en Geometrix</Text>
                  </View>
                ) : (
                  geoCreations.map((c) => {
                    const bgFactor = brightnessFactor(c.master.bgBrightness);
                    const bgGrad = bgGradientColors(c.master.bgGradientId);
                    const bgColors = c.master.bgColor
                      ? ([scaleHex(c.master.bgColor, bgFactor), scaleHex(c.master.bgColor, bgFactor)] as const)
                      : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);
                    const isSelected = profileBgCreationId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => selectCreation(c.id)}
                        style={pStyles.creationThumb}
                      >
                        <View style={[pStyles.thumbBg, isSelected && pStyles.thumbBgOn]}>
                          {/* Fondo fiel a la receta */}
                          <LinearGradient
                            colors={bgColors as readonly [string, string, ...string[]]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={StyleSheet.absoluteFill}
                          />
                          {/* Capas de geometría (estáticas) */}
                          {c.active.map((id) => {
                            const s = c.settings[id];
                            if (!s) return null;
                            const opacity = Math.max(0.15, s.opacity * c.master.opacity);
                            return (
                              <View
                                key={id}
                                style={[
                                  StyleSheet.absoluteFill,
                                  { alignItems: "center", justifyContent: "center", opacity },
                                ]}
                                pointerEvents="none"
                              >
                                <SacredGlyph
                                  id={id}
                                  color={s.color}
                                  gradient={gradientColors(s.gradientId)}
                                  size={60}
                                  strokeWidth={1 + s.thickness * 2}
                                />
                              </View>
                            );
                          })}
                        </View>
                        <Text style={pStyles.thumbLabel} numberOfLines={1}>{c.name}</Text>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              {/* ── Paleta de degradado ── */}
              <Text style={pStyles.sectionTitle}>Color de fondo</Text>
              <Text style={pStyles.sectionSub}>Degradado oscuro para el fondo de tu perfil</Text>

              <View style={[pStyles.swatchRow, { marginBottom: 28 }]}>
                {/* Por defecto */}
                <Pressable
                  onPress={() => selectGradient(null)}
                  style={[pStyles.swatch, profileBgGradientId === null && pStyles.swatchOn]}
                >
                  <LinearGradient
                    colors={[HOME_GRADIENT[0], HOME_GRADIENT[2]]}
                    style={pStyles.swatchGrad}
                  />
                </Pressable>
                {BG_GRADIENTS.map((gr) => (
                  <Pressable
                    key={gr.id}
                    onPress={() => selectGradient(gr.id)}
                    style={[pStyles.swatch, profileBgGradientId === gr.id && pStyles.swatchOn]}
                  >
                    <LinearGradient
                      colors={[...gr.colors] as [string, string]}
                      style={pStyles.swatchGrad}
                    />
                  </Pressable>
                ))}
              </View>

              {/* ── Recordatorio ── */}
              <Text style={pStyles.sectionTitle}>Recordatorio diario</Text>
              <Text style={pStyles.sectionSub}>Recibe una notificación para meditar cada día</Text>

              <View style={pStyles.reminderCard}>
                <View style={pStyles.reminderRow}>
                  <View style={pStyles.reminderBell}>
                    <Feather name="bell" size={18} color="#BE9650" />
                  </View>
                  <Text style={pStyles.reminderLabel}>Activar recordatorio</Text>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={(v) => saveReminder(v, reminderHour, reminderMinute)}
                    trackColor={{ false: "#1E2A38", true: "#2D4A3A" }}
                    thumbColor={reminderEnabled ? "#BE9650" : "#7A8FA8"}
                  />
                </View>

                {reminderEnabled && (
                  <View style={pStyles.timePicker}>
                    <Text style={pStyles.timeLabel}>Hora del recordatorio</Text>
                    <View style={pStyles.timeRow}>
                      <Pressable
                        hitSlop={10}
                        onPress={() => saveReminder(reminderEnabled, (reminderHour - 1 + 24) % 24, reminderMinute)}
                        style={pStyles.timeBtn}
                      >
                        <Feather name="minus" size={16} color="#BE9650" />
                      </Pressable>
                      <Text style={pStyles.timeValue}>
                        {String(reminderHour).padStart(2, "0")}:{String(reminderMinute).padStart(2, "0")}
                      </Text>
                      <Pressable
                        hitSlop={10}
                        onPress={() => saveReminder(reminderEnabled, (reminderHour + 1) % 24, reminderMinute)}
                        style={pStyles.timeBtn}
                      >
                        <Feather name="plus" size={16} color="#BE9650" />
                      </Pressable>
                    </View>
                    <View style={pStyles.minuteRow}>
                      {[0, 15, 30, 45].map((m) => (
                        <Pressable
                          key={m}
                          onPress={() => saveReminder(reminderEnabled, reminderHour, m)}
                          style={[pStyles.minuteBtn, reminderMinute === m && pStyles.minuteBtnOn]}
                        >
                          <Text style={[pStyles.minuteText, reminderMinute === m && { color: "#BE9650" }]}>
                            :{String(m).padStart(2, "0")}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Edit Details Modal ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={[styles.modalRoot, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <Pressable onPress={() => setEditVisible(false)} hitSlop={12}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar Detalles</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalForm}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ModalField
              label="Nombre"
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Tu nombre"
              colors={colors}
            />
            <ModalField
              label="Apellido"
              value={editApellido}
              onChangeText={setEditApellido}
              placeholder="Tu apellido"
              colors={colors}
            />
            <ModalField
              label="Locación"
              value={editLocation}
              onChangeText={setEditLocationLocal}
              placeholder="Ciudad, País"
              colors={colors}
              icon="map-pin"
            />
            <ModalField
              label="Descripción"
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Cuéntanos un poco sobre ti..."
              colors={colors}
              multiline
            />

            <Pressable
              onPress={saveEdit}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Guardar</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Modal field component ────────────────────────────────────────────────────

function ModalField({ label, value, onChangeText, placeholder, colors, icon, multiline }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  icon?: React.ComponentProps<typeof Feather>["name"];
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[
        styles.fieldBox,
        { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.04)" },
        multiline && { minHeight: 90, alignItems: "flex-start" },
      ]}>
        {icon && <Feather name={icon} size={15} color={colors.mutedForeground} style={{ marginTop: multiline ? 2 : 0 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.fieldInput, { color: colors.foreground }, multiline && { textAlignVertical: "top", paddingTop: 2 }]}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          returnKeyType={multiline ? "default" : "next"}
        />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5 },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile card
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 32,
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#BE9650",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#090F17",
  },
  userName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12 },
  bioText: { fontSize: 13, lineHeight: 19, textAlign: "center", paddingHorizontal: 8, fontStyle: "italic" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 6,
  },
  editBtnText: { fontSize: 13, fontWeight: "600" },

  // Seguidores / Siguiendo
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 20 },
  followCountNum: { fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontSize: 11, marginTop: 1 },
  followCountDivider: { width: 1, height: 28 },

  // Plan card
  planCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  planIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  planTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  planSub: { fontSize: 12 },
  planMejorar: { flexDirection: "row", alignItems: "center", gap: 2 },
  planMejorarText: { fontSize: 14, fontWeight: "700" },

  // Tu Progreso — racha card
  rachaCard: { borderRadius: 18, padding: 18, marginBottom: 12 },
  rachaTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  rachaBubble: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  rachaFlame: { fontSize: 24 },
  rachaValue: { fontSize: 17, fontWeight: "700", marginBottom: 3 },
  rachaSub: { fontSize: 12, lineHeight: 16 },
  rachaWeekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  rachaDayPill: { alignItems: "center", gap: 5 },
  rachaDayLabel: { fontSize: 11, fontWeight: "600" },
  rachaDayCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rachaMaxRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  rachaMaxIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rachaMaxLabel: { fontSize: 13, fontWeight: "600" },
  rachaMaxSub: { fontSize: 11, marginTop: 1 },
  rachaMaxValue: { fontSize: 17, fontWeight: "700" },
  rachaVerMas: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 14 },
  rachaVerMasText: { fontSize: 13, fontWeight: "600" },

  // Membresía
  membershipRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  membershipPlan: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  membershipSub: { fontSize: 12 },
  membershipAction: { fontSize: 13, fontWeight: "600" },

  // Premium
  premiumBanner: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 32,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(169,122,52,0.45)",
  },
  premiumGlow: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 100,
    height: 60,
    borderRadius: 50,
    backgroundColor: "rgba(35,66,54,0.5)",
  },
  premiumLeft: { flex: 1 },
  premiumTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  premiumTitle: { fontSize: 15, fontWeight: "700" },
  premiumSub: { fontSize: 12, lineHeight: 17 },
  premiumFeatureRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  premiumFeatureText: { fontSize: 11, lineHeight: 16 },
  premiumBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  // Favoritos
  favRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  favImg: { width: 52, height: 52, borderRadius: 10 },
  favInfo: { flex: 1 },
  favTitle: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  favSub: { fontSize: 12 },

  // Menu
  menuCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },

  footer: { textAlign: "center", fontSize: 11, letterSpacing: 1, marginBottom: 8 },

  // Edit modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  modalForm: { padding: 24, gap: 20, paddingBottom: 60 },

  // Modal fields
  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 15, backgroundColor: "transparent" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontSize: 16, fontWeight: "700" },

  communityRow: { flexDirection: "row", gap: 8, marginBottom: 43 },
  communityCard: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  communityLabel: { fontSize: 12, fontWeight: "500", textAlign: "center", letterSpacing: 0.2 },
});

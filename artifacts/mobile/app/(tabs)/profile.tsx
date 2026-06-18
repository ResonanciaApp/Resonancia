import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";

import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyFollowCounts,
  getGetMyFollowCountsQueryKey,
} from "@workspace/api-client-react";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";
import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";
import { getSessionById } from "@/data/sessions";
import { getExpansorById } from "@/data/expansores";
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
  type GeoSettings,
} from "@/data/geometrix-creations";
import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, type GeometryId } from "@/data/geometries";

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

const BG_GRADIENT = ["#2E0510", "#160108"] as const;

// ── Personalize sheet styles (defined before component to avoid TDZ on Hermes)
const pStyles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: "#3D0E16",
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
    backgroundColor: "rgba(74,12,12,0.08)",
    alignSelf: "center",
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F4DAD5",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: "rgba(242,231,228,0.45)",
    marginBottom: 14,
    lineHeight: 17,
  },
  creationThumb: {
    width: 88,
    marginRight: -5,
    alignItems: "center",
  },
  thumbBg: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#3D0E16",
  },
  thumbBgOn: {
    borderColor: "#4A0C0C",
  },
  thumbCheck: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  thumbLabel: {
    fontSize: 11,
    color: "rgba(242,231,228,0.45)",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 12,
    color: "rgba(242,231,228,0.45)",
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
    borderColor: "#3D0E16",
  },
  swatchOn: {
    borderColor: "#4A0C0C",
  },
  swatchGrad: {
    flex: 1,
  },
  reminderCard: {
    backgroundColor: "rgba(74,12,12,0.08)",
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
    backgroundColor: "rgba(212,175,55,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderLabel: {
    flex: 1,
    fontSize: 14,
    color: "#F4DAD5",
    fontWeight: "500",
  },
  timePicker: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#3D0E16",
    alignItems: "center",
  },
  timeLabel: {
    fontSize: 10,
    color: "rgba(242,231,228,0.45)",
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
    backgroundColor: "rgba(212,175,55,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    fontSize: 38,
    fontWeight: "200",
    color: "#F4DAD5",
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
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  minuteBtnOn: {
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  minuteText: {
    fontSize: 13,
    color: "rgba(242,231,228,0.45)",
    fontWeight: "500",
  },
});

// ── BgGlyph: renderiza una capa de geometría animada en el fondo del perfil ─
function BgGlyph({
  id,
  settings,
  masterOpacity,
  size,
  index,
}: {
  id: GeometryId;
  settings: GeoSettings;
  masterOpacity: number;
  size: number;
  index: number;
}) {
  const rot   = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const fade  = useRef(new Animated.Value(1)).current;

  const spinning     = settings.rotate || settings.rotateLeft;
  const dir          = settings.rotateLeft ? -1 : 1;
  const safeSpeed    = Number.isFinite(settings.rotateSpeed)
    ? Math.max(0, Math.min(1, settings.rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const safeAmount   = Number.isFinite(settings.breatheAmount)
    ? Math.max(0, Math.min(1, settings.breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const safeScale    = Number.isFinite(settings.scale) ? settings.scale : 1;
  const safeZoom     = Number.isFinite(settings.zoom) && settings.zoom > 0 ? settings.zoom : 1;
  const safeThick    = Number.isFinite(settings.thickness) ? settings.thickness : 0;
  // Fórmula idéntica al editor: base × magnitud confirmada → SVG nítido a cualquier zoom.
  const userScale    = 0.4 + safeScale * 0.6;
  const glyphSize    = size * userScale * safeZoom;
  // Trazo constante en píxeles de pantalla (no engorda con zoom): igual que editor.
  const base1px = glyphSize > 0 ? 100 / glyphSize : 1;
  const sw      = base1px * (1 + safeThick * 5);

  useEffect(() => {
    if (spinning) {
      const a = Animated.loop(
        Animated.timing(rot, { toValue: 1, duration: spinDuration, easing: Easing.linear, useNativeDriver: true })
      );
      a.start();
      return () => a.stop();
    }
    rot.setValue(0);
  }, [spinning, spinDuration, rot]);

  useEffect(() => {
    if ((settings.breatheAmount ?? 0) > 0) {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      a.start();
      return () => a.stop();
    }
    pulse.setValue(0);
  }, [(settings.breatheAmount ?? 0) > 0, index, pulse]);

  useEffect(() => {
    const fadeOn = (settings.fadeLoopAmount ?? 0) > 0;
    if (fadeOn) {
      const safeFadeAmt = Math.max(0, Math.min(1, settings.fadeLoopAmount ?? 0));
      const minOpacity = 1 - safeFadeAmt * 0.85;
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(fade, { toValue: minOpacity, duration: 4000 + index * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(fade, { toValue: 1, duration: 4000 + index * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      a.start();
      return () => a.stop();
    }
    fade.setValue(1);
  }, [(settings.fadeLoopAmount ?? 0) > 0, index, fade]);

  const layerOpacity = Math.max(0.1, settings.opacity * masterOpacity);
  const rotDeg   = rot.interpolate({ inputRange: [0, 1], outputRange: [`${settings.manualAngle}deg`, `${settings.manualAngle + 360 * dir}deg`] });
  const scalePulse = pulse.interpolate({ inputRange: [0, 1], outputRange: [1 - breatheDepth, 1] });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          opacity: (settings.fadeLoopAmount ?? 0) > 0 ? Animated.multiply(fade, layerOpacity) : layerOpacity,
          transform: [
            { rotate: spinning ? rotDeg : `${settings.manualAngle}deg` },
            { scale: (settings.breatheAmount ?? 0) > 0 ? scalePulse : 1 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <SacredGlyph
        id={id}
        color={settings.color}
        gradient={gradientColors(settings.gradientId)}
        size={glyphSize}
        strokeWidth={sw}
      />
    </Animated.View>
  );
}

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
    expansorId,
    updateProfile,
    setPhotoUri,
  } = useUserProfile();

  const expansorData = expansorId ? getExpansorById(expansorId) : undefined;

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: 60_000 } });
  const { data: followCounts } = useGetMyFollowCounts({
    query: { queryKey: getGetMyFollowCountsQueryKey(), staleTime: 30_000 },
  });
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })
    : null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { width } = useWindowDimensions();

  // ── Geometrix creations (for profile background picker) ───────────────────
  const { creations: geoCreations, reload: reloadCreations } = useGeometrixCreations();

  // Recarga creaciones cada vez que el tab vuelve al foco (para que una
  // creación guardada en Geometrix aparezca inmediatamente al volver).
  useFocusEffect(
    useCallback(() => {
      reloadCreations();
    }, [reloadCreations])
  );

  // ── Expansor section (Daniela Vega) ──────────────────────────────────────
  const [dvDescExpanded, setDvDescExpanded] = useState(false);
  const [dvDescOverflows, setDvDescOverflows] = useState(false);
  const [dvLightboxUri, setDvLightboxUri] = useState<string | null>(null);
  const dvCellSize = Math.floor((width - 40 - 32 - 8) / 3);

  // ── Personalize sheet ─────────────────────────────────────────────────────
  const [scrollEnabled, setScrollEnabled] = useState(true);
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

  const selectGradient = (id: string | null) => {
    // Seleccionar cualquier swatch (incluso "por defecto") siempre descarta la
    // creación de Geometrix — son mutuamente excluyentes.
    setProfileBgGradientId(id);
    setProfileBgCreationId(null);
    void AsyncStorage.setItem("@profile_bg_gradient", id ?? "null");
    void AsyncStorage.setItem("@profile_bg_creation", "null");
  };
  const selectCreation = (id: string | null) => {
    setProfileBgCreationId(id);
    if (id !== null) setProfileBgGradientId(null);
    void AsyncStorage.setItem("@profile_bg_creation", id ?? "null");
    if (id !== null) void AsyncStorage.setItem("@profile_bg_gradient", "null");
  };
  const saveReminder = async (enabled: boolean, hour: number, minute: number) => {
    setReminderEnabled(enabled);
    setReminderHour(hour);
    setReminderMinute(minute);
    await AsyncStorage.setItem("@profile_reminder", JSON.stringify({ enabled, hour, minute }));
  };

  // ── Sections visibility toggle ────────────────────────────────────────────
  const [sectionsHidden, setSectionsHidden] = useState(false);
  const sectionsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem("@profile_sections_hidden").then((raw) => {
      if (raw === "1") {
        setSectionsHidden(true);
        sectionsAnim.setValue(0);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSections = useCallback(() => {
    const next = !sectionsHidden;
    setSectionsHidden(next);
    AsyncStorage.setItem("@profile_sections_hidden", next ? "1" : "0").catch(() => {});
    Animated.timing(sectionsAnim, {
      toValue: next ? 0 : 1,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [sectionsHidden, sectionsAnim]);

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
    return [BG_GRADIENT[0], BG_GRADIENT[1]];
  }, [profileBgCreationId, profileBgGradientId, geoCreations]);

  // Creación activa (para renderizar glyphs en el fondo)
  const activeBgCreation = useMemo(
    () => (profileBgCreationId ? (geoCreations.find((c) => c.id === profileBgCreationId) ?? null) : null),
    [profileBgCreationId, geoCreations]
  );
  // Misma base que el editor: canvasSide * 0.96 (portrait → canvasSide = width).
  const glyphSize = width * 0.96;

  // ── Crossfade de fondo ────────────────────────────────────────────────────
  const defaultBg = [BG_GRADIENT[0], BG_GRADIENT[1]] as const;
  const [bgFrom, setBgFrom] = useState<readonly [string, string]>(defaultBg);
  const [bgTo, setBgTo] = useState<readonly [string, string]>(defaultBg);
  const crossFadeAnim = useRef(new Animated.Value(1)).current;
  const prevBgRef = useRef<readonly [string, string]>(defaultBg);
  const bgMountedRef = useRef(false);
  // Fade-in del glifo al montar (carga async desde AsyncStorage → aparición suave).
  const glyphMountAnim = useRef(new Animated.Value(0)).current;

  // Gesto de deslizar hacia abajo en el handle para cerrar el sheet.
  const dismissPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, dx }) => dy > 8 && Math.abs(dy) > Math.abs(dx),
      onPanResponderRelease: (_, { dy }) => {
        if (dy > 50) setPersonalizeVisible(false);
      },
    }),
  ).current;

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

  // Reset SÍNCRONO antes del paint (evita el flash al montar el bloque condicional).
  // useLayoutEffect se ejecuta tras el commit pero antes de que el nativo pinte.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { glyphMountAnim.setValue(0); }, [activeBgCreation?.id]);

  // Animación de entrada del glifo (después del paint, sin flash).
  useEffect(() => {
    if (!activeBgCreation) return;
    Animated.timing(glyphMountAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBgCreation?.id]);

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
      {/* Geometrías de la creación seleccionada — fade-in al montar + crossfade de colores */}
      {activeBgCreation && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glyphMountAnim }]} pointerEvents="none">
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim }]} pointerEvents="none">
            {activeBgCreation.active
              .filter((gId) => !activeBgCreation.hiddenIds?.includes(gId))
              .map((gId, i) => {
                const s = activeBgCreation.settings[gId];
                if (!s) return null;
                return (
                  <BgGlyph
                    key={gId}
                    id={gId as GeometryId}
                    settings={s}
                    masterOpacity={activeBgCreation.master.opacity}
                    size={glyphSize}
                    index={i}
                  />
                );
              })}
          </Animated.View>
        </Animated.View>
      )}
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: "#FFFFFF" }]}>Perfil</Text>
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
              <GoldGradientFill />
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

        {/* ── Sección Expansor (Daniela Vega) ── */}
        <View style={[styles.dvExpansorSection, { marginHorizontal: 20 }]}>

          {/* Banner certificado */}
          <View style={styles.dvCertBanner}>
            <LinearGradient
              colors={["#E9C46A", "#B8860B"]}
              start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
              style={styles.dvCertBannerBar}
            />
            <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 10, justifyContent: "center" }}>
              <MaskedView maskElement={<Text style={styles.dvCertBannerTitle}>EXPANSOR CERTIFICADO</Text>}>
                <LinearGradient colors={["#D4AF37", "#E9C46A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.dvCertBannerTitle, { opacity: 0 }]}>EXPANSOR CERTIFICADO</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.dvCertBannerSub}>Verificado · Resonancia</Text>
            </View>
            <View style={{ paddingRight: 14, justifyContent: "center" }}>
              <View style={styles.dvCertBannerIconBorder}>
                <View style={styles.dvCertBannerIcon}>
                  <LinearGradient
                    colors={["rgba(212,175,55,0.30)", "rgba(184,134,11,0.20)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.dvCertBannerStar}>✦</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Me especializo en */}
          <View style={{ gap: 10 }}>
            <Text style={styles.dvServiceTitle}>Me especializo en</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dvSpecialtyWrap}>
              {["Cuencos Tibetanos", "Yoga"].map((s) => (
                <View key={s} style={styles.dvSpecialtyChip}>
                  <Text style={styles.dvSpecialtyText}>{s}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Mis servicios */}
          <View style={{ gap: 10 }}>
            <Text style={styles.dvServiceTitle}>Mis servicios</Text>
            <Text
              style={styles.dvServiceDesc}
              numberOfLines={dvDescExpanded ? undefined : 7}
              onTextLayout={(e) => { if (!dvDescOverflows && e.nativeEvent.lines.length > 7) setDvDescOverflows(true); }}
            >
              Instructora de yoga y sonoterapia. Integra los baños de sonido con prácticas de yin yoga para una experiencia de relajación total mente-cuerpo.
            </Text>
            {dvDescOverflows && (
              <Pressable onPress={() => setDvDescExpanded((v) => !v)} style={({ pressed }) => [styles.dvReadMoreBtn, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={styles.dvReadMoreText}>{dvDescExpanded ? "Leer menos" : "Leer más"}</Text>
                <Feather name={dvDescExpanded ? "chevron-up" : "chevron-down"} size={13} color="#D4AF37" />
              </Pressable>
            )}
          </View>

          {/* Contacto */}
          <View style={styles.dvContactRow}>
            <Pressable onPress={() => Linking.openURL("tel:+56912345678")} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
              <Feather name="phone" size={13} color="#FFFFFF" />
              <Text style={styles.dvActionPillText}>Teléfono</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL("mailto:daniela@resonancia.com")} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
              <Feather name="mail" size={13} color="#FFFFFF" />
              <Text style={styles.dvActionPillText}>Email</Text>
            </Pressable>
          </View>

          {/* Redes sociales */}
          <View style={styles.dvContactRow}>
            <Pressable onPress={() => Linking.openURL("https://instagram.com/danielavega")} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
              <Feather name="instagram" size={13} color="#FFFFFF" />
              <Text style={styles.dvActionPillText}>Instagram</Text>
            </Pressable>
          </View>

        </View>

        {/* ── Galería ── */}
        <View style={[styles.dvGallerySection, { marginHorizontal: 20 }]}>
          <View style={styles.dvGalleryGrid}>
            {[
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
              "https://images.unsplash.com/photo-1545389336-cf090694435e?w=400",
              "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400",
              "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400",
              "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400",
              "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400",
            ].map((uri, i) => (
              <Pressable key={i} onPress={() => setDvLightboxUri(uri)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <Image
                  source={{ uri }}
                  style={[styles.dvGalleryCell, { width: dvCellSize, height: dvCellSize * 1.3 }]}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Quote ── */}
        <View style={[styles.dvQuoteWrap, { marginHorizontal: 20 }]}>
          <Text style={styles.dvQuoteText}>"El sonido es el puente entre el mundo interior y el exterior."</Text>
        </View>

        {/* ── Secciones colapsables (ocultas con el ojo) ── */}
        <Animated.View style={{ opacity: sectionsAnim, maxHeight: sectionsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2400] }), overflow: "hidden" }}>

        {/* ── Plan ── */}
        <Pressable
          onPress={() => router.push("/membresia" as never)}
          style={({ pressed }) => [
            styles.planCard,
            { backgroundColor: "rgba(74,12,12,0.08)", opacity: pressed ? 0.85 : 1 },
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


        {/* ── Accesos rápidos ── */}
        <QuickAccessGrid
          onDragStart={() => setScrollEnabled(false)}
          onDragEnd={()   => setScrollEnabled(true)}
        />



        <Text style={[styles.footer, { color: colors.border }]}>
          RESONANCE · Sonidos que te regresan a ti mismo.
        </Text>

        </Animated.View>
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
          <LinearGradient
            colors={["#0A0E1F", "#070918"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[pStyles.sheet, { paddingBottom: bottomPad + 24 }]}
          >
            {/* Handle + botón cerrar — panHandlers habilitan swipe-down para cerrar */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 22 }} {...dismissPan.panHandlers}>
              <View style={{ flex: 1 }} />
              <View style={[pStyles.handle, { marginBottom: 0 }]} />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Pressable
                  onPress={() => setPersonalizeVisible(false)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
                >
                  <Feather name="x" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

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
                {/* Ninguno — solo si no hay creaciones guardadas */}
                {geoCreations.length === 0 && (
                  <Pressable
                    onPress={() => selectCreation(null)}
                    style={pStyles.creationThumb}
                  >
                    <View
                      style={[
                        pStyles.thumbBg,
                        { backgroundColor: "#2E0510", alignItems: "center", justifyContent: "center" },
                        profileBgCreationId === null && pStyles.thumbBgOn,
                      ]}
                    >
                      <Feather name="x" size={22} color="#4A5568" />
                    </View>
                    <Text style={pStyles.thumbLabel}>Ninguno</Text>
                  </Pressable>
                )}

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
                                  id={baseOf(id)}
                                  color={s.color}
                                  gradient={gradientColors(s.gradientId)}
                                  size={60}
                                  strokeWidth={1 + s.thickness * 2}
                                />
                              </View>
                            );
                          })}
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

              {/* ── Paleta de degradado ── */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
                <Text style={pStyles.sectionTitle}>Color de fondo</Text>
                {(profileBgGradientId !== null || profileBgCreationId !== null) && (
                  <Pressable
                    onPress={() => selectGradient(null)}
                    hitSlop={10}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 4, opacity: pressed ? 0.6 : 1 })}
                  >
                    <Feather name="rotate-ccw" size={11} color="#C0304A" />
                    <Text style={{ color: "#C0304A", fontSize: 12, fontWeight: "600" }}>Restablecer</Text>
                  </Pressable>
                )}
              </View>

              <View style={[pStyles.swatchRow, { marginTop: 13, marginBottom: 28 }]}>
                {/* Por defecto */}
                <Pressable
                  onPress={() => selectGradient(null)}
                  style={[pStyles.swatch, profileBgGradientId === null && profileBgCreationId === null && pStyles.swatchOn]}
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
                    <Feather name="bell" size={18} color="#D4AF37" />
                  </View>
                  <Text style={pStyles.reminderLabel}>Activar recordatorio</Text>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={(v) => saveReminder(v, reminderHour, reminderMinute)}
                    trackColor={{ false: "#3D0E16", true: "#4A0C0C" }}
                    thumbColor={reminderEnabled ? "#D4AF37" : "rgba(242,231,228,0.45)"}
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
                        <Feather name="minus" size={16} color="#D4AF37" />
                      </Pressable>
                      <Text style={pStyles.timeValue}>
                        {String(reminderHour).padStart(2, "0")}:{String(reminderMinute).padStart(2, "0")}
                      </Text>
                      <Pressable
                        hitSlop={10}
                        onPress={() => saveReminder(reminderEnabled, (reminderHour + 1) % 24, reminderMinute)}
                        style={pStyles.timeBtn}
                      >
                        <Feather name="plus" size={16} color="#D4AF37" />
                      </Pressable>
                    </View>
                    <View style={pStyles.minuteRow}>
                      {[0, 15, 30, 45].map((m) => (
                        <Pressable
                          key={m}
                          onPress={() => saveReminder(reminderEnabled, reminderHour, m)}
                          style={[pStyles.minuteBtn, reminderMinute === m && pStyles.minuteBtnOn]}
                        >
                          <Text style={[pStyles.minuteText, reminderMinute === m && { color: "#D4AF37" }]}>
                            :{String(m).padStart(2, "0")}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>

            </ScrollView>
          </LinearGradient>
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
                { overflow: "hidden", opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <GoldGradientFill />
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Guardar</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Lightbox galería Daniela Vega ── */}
      <Modal visible={!!dvLightboxUri} transparent animationType="fade" onRequestClose={() => setDvLightboxUri(null)}>
        <Pressable style={styles.dvLightboxBackdrop} onPress={() => setDvLightboxUri(null)}>
          <Image source={{ uri: dvLightboxUri ?? "" }} style={styles.dvLightboxImage} contentFit="contain" />
          <Pressable onPress={() => setDvLightboxUri(null)} style={[styles.dvLightboxClose, { top: (Platform.OS === "web" ? 20 : insets.top) + 12 }]} hitSlop={12}>
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </Pressable>
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
        { borderColor: colors.border, backgroundColor: "rgba(74,12,12,0.08)" },
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
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

  // Expansor section
  expansorSection: {
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  expansorHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  expansorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  expansorBadgeStar: { fontSize: 14, color: "#1B060F", fontWeight: "800" },
  expansorTitle: { fontSize: 14, fontWeight: "700", color: "#D4AF37" },
  expansorCertLabel: { fontSize: 11, color: "rgba(212,175,55,0.60)", marginTop: 1 },
  expansorViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  expansorViewText: { fontSize: 12, color: "#D4AF37", fontWeight: "600" },
  expansorSpecWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expansorChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(74,12,12,0.45)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  expansorChipText: { fontSize: 12, color: "#F4DAD5", fontWeight: "500" },
  expansorBio: { fontSize: 13, lineHeight: 20, color: "rgba(244,218,213,0.75)" },
  expansorLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expansorLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  expansorLinkText: { fontSize: 12, color: "#D4AF37", fontWeight: "600" },

  // ── Sección Daniela Vega (expansor) ──
  dvExpansorSection: {
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 18,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  dvCertBanner: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    backgroundColor: "rgba(212,175,55,0.05)",
  },
  dvCertBannerBar: { width: 5 },
  dvCertBannerTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4, color: "#D4AF37" },
  dvCertBannerSub: { fontSize: 11, color: "rgba(255,255,255,0.90)", marginTop: 2 },
  dvCertBannerIconBorder: {
    width: 35, height: 35, borderRadius: 18,
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.20)", flexShrink: 0,
  },
  dvCertBannerIcon: { flex: 1, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  dvCertBannerStar: { fontSize: 17, color: "rgba(212,175,55,0.90)", fontWeight: "800" },
  dvServiceTitle: { fontSize: 15, fontWeight: "700", color: "#F4DAD5", letterSpacing: 0.2 },
  dvServiceDesc: { fontSize: 13, lineHeight: 20, color: "rgba(244,218,213,0.65)" },
  dvReadMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, alignSelf: "flex-start" },
  dvReadMoreText: { fontSize: 13, fontWeight: "600", color: "#D4AF37" },
  dvSpecialtyWrap: { flexDirection: "row", gap: 8, alignItems: "center" },
  dvSpecialtyChip: {
    borderRadius: 20, paddingHorizontal: 14, height: 34, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center",
  },
  dvSpecialtyText: { fontSize: 13, color: "#FFFFFF", fontWeight: "400", letterSpacing: 0.1 },
  dvContactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dvActionPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 14, height: 34, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  dvActionPillText: { fontSize: 13, fontWeight: "400", color: "#FFFFFF", letterSpacing: 0.1 },
  dvGallerySection: {
    backgroundColor: "rgba(74,12,12,0.08)", borderRadius: 18, padding: 16, gap: 12, marginBottom: 16,
  },
  dvGalleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  dvGalleryCell: { borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)" },
  dvQuoteWrap: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 8, marginBottom: 16 },
  dvQuoteText: {
    fontSize: 18, fontStyle: "italic", color: "rgba(244,218,213,0.70)",
    textAlign: "center", lineHeight: 28, letterSpacing: 0.2,
  },
  dvLightboxBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  dvLightboxImage: { width: "100%", height: "80%" },
  dvLightboxClose: {
    position: "absolute", right: 18, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
});

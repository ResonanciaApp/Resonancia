import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import { BackPill } from "@/components/BackPill";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextStyle,
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
  useGetMyExpansorProfile,
  getGetMyExpansorProfileQueryKey,
  useUpdateMyExpansorProfile,
  type ExpansorProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";
import { SacredBackground } from "@/components/SacredBackground";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";
import { getSessionById } from "@/data/sessions";
import { getExpansorById } from "@/data/expansores";
import { uploadLocalFile } from "@/lib/upload";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { InvitarSheet } from "@/components/InvitarSheet";
import { SimplePersonalizeSheet } from "@/components/SimplePersonalizeSheet";
import { BibliotecaScreen, type LibHeaderActions } from "@/components/BibliotecaScreen";
import {
  gradientColors,
  type GeoSettings,
} from "@/data/geometrix-creations";
import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, type GeometryId } from "@/data/geometries";
import { GeometrixOverlay } from "@/components/GeometrixToggle";

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


function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoDate(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function computeCurrentStreak(events: { playedAt: string }[]): number {
  if (!events.length) return 0;
  const days = new Set(events.map((e) => dayKey(new Date(e.playedAt))));
  const today = new Date();
  let cursor: Date;
  if (days.has(dayKey(today))) cursor = daysAgoDate(0);
  else if (days.has(dayKey(daysAgoDate(1)))) cursor = daysAgoDate(1);
  else return 0;
  let count = 0;
  const walk = new Date(cursor);
  while (days.has(dayKey(walk))) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

function computeMaxStreak(events: { playedAt: string }[]): number {
  if (!events.length) return 0;
  const days = Array.from(new Set(events.map((e) => dayKey(new Date(e.playedAt))))).sort();
  let max = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const next = new Date(days[i]);
    const diff = Math.round((next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 1;
    }
  }
  return max;
}

const WEEK_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];



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

export function ProfileScreenBase({ dedicated = false }: { dedicated?: boolean }) {
  const colors = useColors();
  const { theme: activeTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { favorites, elapsed, history, statEvents, currentSession, isPlaying } = usePlayer();
  const { presets } = useMixer();
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

  const rachaStats = useMemo(() => {
    const currentStreak = computeCurrentStreak(statEvents);
    const maxStreak = computeMaxStreak(statEvents);
    const daysWithActivity = new Set(statEvents.map((e) => dayKey(new Date(e.playedAt))));
    const weekActivity: boolean[] = Array(7).fill(false);
    const today = new Date();
    const todayDow = isoDow(today);
    for (let d = 0; d <= todayDow; d++) {
      const target = new Date(today);
      target.setDate(today.getDate() - (todayDow - d));
      weekActivity[d] = daysWithActivity.has(dayKey(target));
    }
    const totalSessions = statEvents.length;
    const totalMinutes = Math.round(statEvents.reduce((s, e) => s + e.minutes, 0));
    const timeDisplay =
      totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes} min`;
    return { currentStreak, maxStreak, weekActivity, totalSessions, timeDisplay };
  }, [statEvents]);

  const expansorData = expansorId ? getExpansorById(expansorId) : undefined;

  const { data: me, refetch: refetchMe } = useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: 0 } });
  const { data: followCounts } = useGetMyFollowCounts({
    query: { queryKey: getGetMyFollowCountsQueryKey(), staleTime: 30_000 },
  });
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })
    : null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [libActions, setLibActions] = useState<LibHeaderActions | null>(null);

  // ── Borde del sticky header: se activa a partir de unos pocos px de scroll ──
  // (umbral en píxeles, no en % del contenido — así funciona igual en tabs
  // cortos que no alcanzan a generar mucho scroll, ej. "Mi Espacio")
  const HEADER_BORDER_THRESHOLD_PX = 8;
  const headerBorderActiveRef = useRef(false);
  const headerBorderAnim = useRef(new Animated.Value(0)).current;
  const handleHeaderScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShowBorder = y >= HEADER_BORDER_THRESHOLD_PX;
    if (shouldShowBorder !== headerBorderActiveRef.current) {
      headerBorderActiveRef.current = shouldShowBorder;
      Animated.timing(headerBorderAnim, {
        toValue: shouldShowBorder ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const { width } = useWindowDimensions();

  // ── Geometrix creations (for profile background picker) ───────────────────
  const { creations: geoCreations, reload: reloadCreations } = useGeometrixCreations();

  // Recarga creaciones cada vez que el tab vuelve al foco (para que una
  // creación guardada en Geometrix aparezca inmediatamente al volver).
  useFocusEffect(
    useCallback(() => {
      reloadCreations();
      refetchMe();
    }, [reloadCreations, refetchMe])
  );

  // ── Expansor profile ──────────────────────────────────────────────────────
  const isExpansor = false;
  const qc = useQueryClient();
  const { data: expansorProfile } = useGetMyExpansorProfile({
    query: {
      queryKey: getGetMyExpansorProfileQueryKey(),
      enabled: isExpansor,
      retry: false,
    },
  });
  const updateExpansorMutation = useUpdateMyExpansorProfile({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyExpansorProfileQueryKey() });
        setExpansorEditVisible(false);
      },
    },
  });

  const [dvDescExpanded, setDvDescExpanded] = useState(false);
  const [dvDescOverflows, setDvDescOverflows] = useState(false);
  const [dvLightboxUri, setDvLightboxUri] = useState<string | null>(null);
  const dvCellSize = Math.floor((width - 40 - 32 - 8) / 3);

  // ── Expansor edit sheet ───────────────────────────────────────────────────
  const [expansorEditVisible, setExpansorEditVisible] = useState(false);
  const [epSpecialties, setEpSpecialties] = useState("");
  const [epDescription, setEpDescription] = useState("");
  const [epPhone, setEpPhone] = useState("");
  const [epEmail, setEpEmail] = useState("");
  const [epInstagram, setEpInstagram] = useState("");
  const [epQuote, setEpQuote] = useState("");
  const [epPhotos, setEpPhotos] = useState<string[]>([]);
  const [epPhotoUploading, setEpPhotoUploading] = useState(false);

  function openExpansorEdit() {
    setEpSpecialties((expansorProfile?.specialties ?? []).join(", "));
    setEpDescription(expansorProfile?.description ?? "");
    setEpPhone(expansorProfile?.phone ?? "");
    setEpEmail(expansorProfile?.email ?? "");
    setEpInstagram(expansorProfile?.instagram ?? "");
    setEpQuote(expansorProfile?.quote ?? "");
    setEpPhotos(expansorProfile?.photos ?? []);
    setExpansorEditVisible(true);
  }

  async function pickAndUploadExpansorPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para subir fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setEpPhotoUploading(true);
    try {
      const ext = asset.uri.split(".").pop()?.split("?")[0] ?? "jpg";
      const objectPath = await uploadLocalFile(asset.uri, "image/jpeg", `expansor_photo_${Date.now()}.${ext}`, asset.fileSize ?? 500_000);
      setEpPhotos((prev) => [...prev, objectPath]);
    } catch {
      Alert.alert("Error", "No se pudo subir la foto. Intentá de nuevo.");
    } finally {
      setEpPhotoUploading(false);
    }
  }

  function removeExpansorPhoto(idx: number) {
    setEpPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function saveExpansorProfile() {
    updateExpansorMutation.mutate({
      data: {
        specialties: epSpecialties.split(",").map((s) => s.trim()).filter(Boolean),
        description: epDescription || null,
        phone: epPhone || null,
        email: epEmail || null,
        instagram: epInstagram || null,
        photos: epPhotos,
        quote: epQuote || null,
      },
    });
  }

  // ── Personalize sheet ─────────────────────────────────────────────────────
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [personalizeVisible, setPersonalizeVisible] = useState(false);
  const [profileGeoActive, setProfileGeoActive] = useState(false);
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

  // ── Muro de reflexiones (placeholders) ───────────────────────────────────
  const [muroExpanded, setMuroExpanded] = useState<boolean[]>([false, false, false]);

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [showInvitar, setShowInvitar] = useState(false);
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


  // ── Fondo activo (degradado de perfil) ────────────────────────────────────
  // Fondo fijo (mismo degradado que Inicio). La personalización de fondo se
  // retiró de la UI (WatercolorBtn); ya no debe tomar el color de una paleta
  // guardada previamente en AsyncStorage (@profile_bg_gradient/@profile_bg_creation).
  const activeBgColors = useMemo((): readonly string[] => {
    return activeTheme.gradient;
  }, [activeTheme]);

  // Creación activa (para renderizar glyphs en el fondo)
  const activeBgCreation = useMemo(
    () => (profileBgCreationId ? (geoCreations.find((c) => c.id === profileBgCreationId) ?? null) : null),
    [profileBgCreationId, geoCreations]
  );
  // Misma base que el editor: canvasSide * 0.96 (portrait → canvasSide = width).
  const glyphSize = width * 0.96;

  // ── Crossfade de fondo ────────────────────────────────────────────────────
  const defaultBg = activeTheme.gradient;
  const [bgFrom, setBgFrom] = useState<readonly string[]>(defaultBg);
  const [bgTo, setBgTo] = useState<readonly string[]>(defaultBg);
  const crossFadeAnim = useRef(new Animated.Value(1)).current;
  const prevBgRef = useRef<readonly string[]>(defaultBg);
  const bgMountedRef = useRef(false);
  // Fade-in del glifo al montar (carga async desde AsyncStorage → aparición suave).
  const glyphMountAnim = useRef(new Animated.Value(0)).current;


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
        <LinearGradient colors={[bgFrom[0], bgFrom[1], ...bgFrom.slice(2)]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      </Animated.View>
      {/* Fondo nuevo — aparece */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim }]}
        pointerEvents="none"
      >
        <LinearGradient colors={[bgTo[0], bgTo[1], ...bgTo.slice(2)]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
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
      <SacredBackground variant="gradient" noImage />
      <GeometrixOverlay active={profileGeoActive} />

      {/* ── Sticky header (estilo Calm) ── */}
      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 2,
          },
        ]}
      >
        <Animated.View collapsable={false} style={[styles.stickyHeaderBorder, { opacity: headerBorderAnim }]} />
        <View style={[styles.stickyHeaderRow, !dedicated && { paddingTop: 25 }]}>
          {dedicated ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never))}
              style={({ pressed }) => [styles.gearBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={10}
            >
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
          ) : (
            <BackPill
              onPress={() => router.canGoBack() ? router.back() : router.navigate("/(tabs)/inicio8" as never)}
              size={28}
              bgColor="rgba(255,255,255,0.1)"
              style={{ transform: [{ translateX: -2 }, { translateY: -50 }] }}
            />
          )}
          <Text style={[styles.stickyTitle, !dedicated && styles.stickyTitleBiblioteca]}>{dedicated ? "Mi Perfil" : "Biblioteca"}</Text>
          {dedicated ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
              <Pressable hitSlop={8} onPress={openEdit}>
                <Feather name="edit-2" size={22} color="#FBFBFB" />
              </Pressable>
              <Pressable hitSlop={8} onPress={() => router.push("/configuraciones")}>
                <Feather name="settings" size={23} color="#FBFBFB" />
              </Pressable>
            </View>
          ) : libActions && !libActions.hidden ? (
            <View style={styles.libActionsPill}>
              <Pressable onPress={libActions.onSearch} hitSlop={10} style={styles.libActionBtn}>
                <Feather name="search" size={22} color="#f9f9f9" />
              </Pressable>
              <Pressable onPress={libActions.onAdd} hitSlop={10} style={styles.libActionBtn}>
                <Feather name="plus" size={24} color="#f9f9f9" />
              </Pressable>
            </View>
          ) : (
            <View style={{ width: 25 }} />
          )}
        </View>

      </View>

      {dedicated && (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: 16, paddingHorizontal: 19 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={16}
      >
        {/* ── Acciones ── */}
        <View style={[styles.header, { justifyContent: "flex-end" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {isExpansor && (
              <Pressable
                onPress={openExpansorEdit}
                style={({ pressed }) => [styles.expansorEditIconBtn, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={10}
              >
                <Feather name="edit" size={17} color="#F7CB6B" />
              </Pressable>
            )}
          </View>
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

        </View>

        {/* ── Tu racha (oculta a pedido del usuario) ── */}
        {false && (
        <View style={[styles.rachaCard, { backgroundColor: "rgba(255,255,255,0.075)" }]}>
          <View style={styles.rachaTop}>
            <View style={[styles.rachaBubble, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
              <Text style={styles.rachaFlame}>{rachaStats.currentStreak > 0 ? "🔥" : "✨"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rachaValue, { color: colors.foreground }]}>
                {rachaStats.currentStreak > 0
                  ? `${rachaStats.currentStreak} día${rachaStats.currentStreak !== 1 ? "s" : ""} de racha`
                  : "Comienza tu racha"}
              </Text>
              <Text style={[styles.rachaSub, { color: colors.mutedForeground }]}>
                {rachaStats.currentStreak > 0
                  ? "Sigue así, no pierdas tu constancia"
                  : "Escucha una sesión hoy para empezar"}
              </Text>
            </View>
          </View>

          <View style={styles.rachaWeekRow}>
            {WEEK_INITIALS.map((label, i) => {
              const done = rachaStats.weekActivity[i];
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
                        borderColor: done ? colors.primary : isToday ? colors.foreground : colors.border,
                      },
                    ]}
                  >
                    {done && <Feather name="check" size={13} color="#1B060F" />}
                  </View>
                </View>
              );
            })}
          </View>

          <View style={[styles.rachaStatsRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16 }]}>
            {[
              { icon: "🧘", value: rachaStats.totalSessions.toString(), label: "Sesiones\ntotales" },
              { icon: "⏱️", value: rachaStats.timeDisplay, label: "Tiempo\ntotal" },
              { icon: "🏆", value: rachaStats.maxStreak > 0 ? `${rachaStats.maxStreak} d` : "—", label: "Racha\nmáxima" },
            ].map((s, i) => (
              <View key={s.label} style={styles.rachaStatCol}>
                {i > 0 && <View style={[styles.rachaStatDivider, { backgroundColor: colors.border }]} />}
                <Text style={styles.rachaStatEmoji}>{s.icon}</Text>
                <Text style={[styles.rachaStatVal, { color: colors.accent }]}>{s.value || "—"}</Text>
                <Text style={[styles.rachaStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* ── Sección Expansor (solo si role === "expansor") ── */}
        {isExpansor && (
          <>
            {/* Banner certificado — fuera del fondo */}
            <View style={[styles.dvCertBanner, { marginTop: -20, marginBottom: 20 }]}>
              <LinearGradient
                colors={["#FBA980", "#B8860B"]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.dvCertBannerBar}
              />
              <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 10, justifyContent: "center" }}>
                <MaskedView maskElement={<Text style={styles.dvCertBannerTitle}>EXPANSOR</Text>}>
                  <LinearGradient colors={["#F7CB6B", "#FBA980"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[styles.dvCertBannerTitle, { opacity: 0 }]}>EXPANSOR</Text>
                  </LinearGradient>
                </MaskedView>
                <Text style={styles.dvCertBannerSub}>Verificado por Resonancia</Text>
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

            <View style={styles.dvExpansorSection}>

              {/* Me especializo en */}
              {(expansorProfile?.specialties ?? []).length > 0 && (
                <View style={{ gap: 10 }}>
                  <Text style={styles.dvServiceTitle}>Me especializo en</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dvSpecialtyWrap}>
                    {(expansorProfile?.specialties ?? []).map((s) => (
                      <View key={s} style={styles.dvSpecialtyChip}>
                        <Text style={styles.dvSpecialtyText}>{s}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Mis servicios */}
              {expansorProfile?.description ? (
                <View style={{ gap: 10 }}>
                  <Text style={styles.dvServiceTitle}>Mis servicios</Text>
                  <Text
                    style={styles.dvServiceDesc}
                    numberOfLines={dvDescExpanded ? undefined : 7}
                    onTextLayout={(e) => { if (!dvDescOverflows && e.nativeEvent.lines.length > 7) setDvDescOverflows(true); }}
                  >
                    {expansorProfile.description}
                  </Text>
                  {dvDescOverflows && (
                    <Pressable onPress={() => setDvDescExpanded((v) => !v)} style={({ pressed }) => [styles.dvReadMoreBtn, { opacity: pressed ? 0.7 : 1 }]}>
                      <Text style={styles.dvReadMoreText}>{dvDescExpanded ? "Leer menos" : "Leer más"}</Text>
                      <Feather name={dvDescExpanded ? "chevron-up" : "chevron-down"} size={13} color="#F7CB6B" />
                    </Pressable>
                  )}
                </View>
              ) : null}

              {/* Contacto */}
              {(expansorProfile?.phone || expansorProfile?.email) && (
                <View style={styles.dvContactRow}>
                  {expansorProfile.phone ? (
                    <Pressable onPress={() => Linking.openURL(`tel:${expansorProfile.phone}`)} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="phone" size={13} color="#FFFFFF" />
                      <Text style={styles.dvActionPillText}>Teléfono</Text>
                    </Pressable>
                  ) : null}
                  {expansorProfile.email ? (
                    <Pressable onPress={() => Linking.openURL(`mailto:${expansorProfile.email}`)} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="mail" size={13} color="#FFFFFF" />
                      <Text style={styles.dvActionPillText}>Email</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}

              {/* Instagram */}
              {expansorProfile?.instagram ? (
                <View style={styles.dvContactRow}>
                  <Pressable onPress={() => Linking.openURL(expansorProfile.instagram!)} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                    <Feather name="instagram" size={13} color="#FFFFFF" />
                    <Text style={styles.dvActionPillText}>Instagram</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Placeholder si el perfil está vacío */}
              {!expansorProfile && (
                <Pressable onPress={openExpansorEdit} style={({ pressed }) => [styles.dvEmptyPrompt, { opacity: pressed ? 0.7 : 1 }]}>
                  <Feather name="plus-circle" size={16} color="#F7CB6B" />
                  <Text style={styles.dvEmptyPromptText}>Completa tu perfil expansor</Text>
                </Pressable>
              )}

            </View>

            {/* Galería */}
            {(expansorProfile?.photos ?? []).length > 0 && (
              <View style={styles.dvGallerySection}>
                <View style={styles.dvGalleryGrid}>
                  {(expansorProfile?.photos ?? []).map((objectPath, i) => {
                    const uri = resolveAvatarUrl(objectPath) ?? objectPath;
                    return (
                      <Pressable key={i} onPress={() => setDvLightboxUri(uri)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                        <Image
                          source={{ uri }}
                          style={[styles.dvGalleryCell, { width: dvCellSize, height: dvCellSize * 1.3 }]}
                          contentFit="cover"
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quote */}
            {expansorProfile?.quote ? (
              <View style={styles.dvQuoteWrap}>
                <Text style={styles.dvQuoteText}>"{expansorProfile.quote}"</Text>
              </View>
            ) : null}
          </>
        )}

        {/* ── Secciones colapsables (ocultas con el ojo) ── */}
        <Animated.View style={{ opacity: sectionsAnim, maxHeight: sectionsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2400] }), overflow: "hidden" }}>




        </Animated.View>

        {/* ── Reflexiones ── */}
        <View style={{ marginTop: 28 }}>
          <Text style={[styles.muroSectionTitle, { color: colors.mutedForeground, marginBottom: 12 }]}>Reflexiones</Text>
          {(() => {
            const MURO_PLACEHOLDERS = [
              {
                sessionId: "1",
                message: "Hoy comprendí que la respiración profunda no solo calma la mente, sino que me conecta con algo más grande que yo mismo. Fue una sesión completamente transformadora y espero poder repetirla pronto.",
              },
              {
                sessionId: "5",
                message: "Esta meditación me ayudó a soltar el control y confiar más en el proceso. Quedé muy tranquila y con muchas ganas de volver mañana.",
              },
              {
                sessionId: "8",
                message: "Aprendí que la gratitud no necesita de grandes cosas. En el silencio encontré todo lo que necesitaba en este momento. Cada respiración fue un regalo.",
              },
            ];
            const MAX_LINES = 3;
            return (
              <View style={{ marginTop: 4 }}>
                {MURO_PLACEHOLDERS.map((item, idx) => {
                  const session = getSessionById(item.sessionId);
                  const expanded = muroExpanded[idx] ?? false;
                  return (
                    <View key={idx} style={styles.muroCard}>
                      <View style={styles.muroLeft}>
                        {session?.image ? (
                          <Image source={session.image as number} style={styles.muroThumb} contentFit="cover" />
                        ) : (
                          <View style={[styles.muroThumb, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
                        )}
                        <Text style={[styles.muroSessionTitle, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {session?.title ?? "Sesión"}
                        </Text>
                      </View>
                      <View style={styles.muroRight}>
                        <View style={styles.muroMsgCard}>
                          <Text
                            style={[styles.muroMsgText, { color: colors.foreground }]}
                            numberOfLines={expanded ? undefined : MAX_LINES}
                          >
                            {item.message}
                          </Text>
                          <Pressable
                            onPress={() =>
                              setMuroExpanded((prev) => {
                                const next = [...prev];
                                next[idx] = !next[idx];
                                return next;
                              })
                            }
                            hitSlop={8}
                            style={{ marginTop: 8, alignSelf: "flex-end" }}
                          >
                            <Text style={styles.muroVerMas}>{expanded ? "Ver menos" : "Ver más"}</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })()}
        </View>
      </ScrollView>
      )}


      {!dedicated && <BibliotecaScreen embedded onHeaderActions={setLibActions} />}

      {/* ── Invitar Sheet ── */}
      <InvitarSheet
        visible={showInvitar}
        onClose={() => setShowInvitar(false)}
      />

      {/* ── Personalize Sheet ── */}
      <SimplePersonalizeSheet
        visible={personalizeVisible}
        onClose={() => setPersonalizeVisible(false)}
        selectedBgId={profileBgGradientId}
        onSelectBg={selectGradient}
        geoActive={profileGeoActive}
        onToggleGeo={setProfileGeoActive}
      />

      {/* ── Edit Details Modal ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <LinearGradient
            colors={activeTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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

      {/* ── Modal edición perfil Expansor ── */}
      <Modal visible={expansorEditVisible} transparent animationType="slide" onRequestClose={() => setExpansorEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={[styles.epModalBackdrop]}>
            <View style={[styles.epModalSheet, { paddingBottom: bottomPad + 20 }]}>
              {/* Header */}
              <View style={styles.epModalHeader}>
                <Text style={styles.epModalTitle}>Perfil Expansor</Text>
                <Pressable onPress={() => setExpansorEditVisible(false)} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  <Feather name="x" size={20} color="rgba(250,240,238,0.55)" />
                </Pressable>
              </View>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Especialidades (separadas por coma)</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                    <TextInput value={epSpecialties} onChangeText={setEpSpecialties} placeholder="Cuencos Tibetanos, Yoga" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Descripción de servicios</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0, minHeight: 90, alignItems: "flex-start" }]}>
                    <TextInput value={epDescription} onChangeText={setEpDescription} placeholder="Describe lo que ofrecés..." placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground, textAlignVertical: "top", paddingTop: 2 }]} multiline numberOfLines={4} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Teléfono</Text>
                    <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                      <Feather name="phone" size={15} color={colors.mutedForeground} />
                      <TextInput value={epPhone} onChangeText={setEpPhone} placeholder="+54 11 1234" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} keyboardType="phone-pad" />
                    </View>
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
                    <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                      <Feather name="mail" size={15} color={colors.mutedForeground} />
                      <TextInput value={epEmail} onChangeText={setEpEmail} placeholder="tu@email.com" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Instagram (URL)</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                    <Feather name="instagram" size={15} color={colors.mutedForeground} />
                    <TextInput value={epInstagram} onChangeText={setEpInstagram} placeholder="https://instagram.com/tu_usuario" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} autoCapitalize="none" />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Frase / Quote</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                    <TextInput value={epQuote} onChangeText={setEpQuote} placeholder="Tu frase inspiracional..." placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} />
                  </View>
                </View>

                {/* ── Galería de fotos ── */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Galería de fotos</Text>
                  <View style={styles.epPhotoGrid}>
                    {epPhotos.map((objectPath, idx) => {
                      const uri = resolveAvatarUrl(objectPath) ?? objectPath;
                      return (
                        <View key={idx} style={styles.epPhotoCell}>
                          <Image source={{ uri }} style={styles.epPhotoCellImg} contentFit="cover" />
                          <Pressable
                            onPress={() => removeExpansorPhoto(idx)}
                            style={styles.epPhotoRemoveBtn}
                            hitSlop={4}
                          >
                            <Feather name="x" size={11} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      );
                    })}
                    {epPhotos.length < 9 && (
                      <Pressable
                        onPress={pickAndUploadExpansorPhoto}
                        disabled={epPhotoUploading}
                        style={({ pressed }) => [styles.epPhotoAddBtn, { opacity: (pressed || epPhotoUploading) ? 0.6 : 1 }]}
                      >
                        {epPhotoUploading
                          ? <ActivityIndicator size="small" color="#F7CB6B" />
                          : <Feather name="plus" size={22} color="#F7CB6B" />
                        }
                      </Pressable>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={saveExpansorProfile}
                  disabled={updateExpansorMutation.isPending || epPhotoUploading}
                  style={({ pressed }) => [styles.saveBtn, { overflow: "hidden", opacity: (pressed || updateExpansorMutation.isPending || epPhotoUploading) ? 0.75 : 1 }]}
                >
                  <GoldGradientFill />
                  <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                    {updateExpansorMutation.isPending ? "Guardando..." : "Guardar"}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
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
  pageTitle: { fontFamily: "Manrope", fontSize: 28, fontWeight: "700", letterSpacing: 0.5 },

  // ── Sticky header (Panel/Biblioteca/Historial/Registros) ──────────────────
  stickyHeader: {
    zIndex: 10,
    backgroundColor: "transparent",
  },
  stickyHeaderBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  stickyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
    paddingBottom: 10,
  },
  gearBtn: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  giftIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 3,
    marginTop: 1,
  },
  stickyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#F4F4F4", letterSpacing: 0.3, flex: 1, textAlign: "center", marginLeft: -4, transform: [{ translateY: 4 }] },
  stickyTitleBiblioteca: { fontSize: 27, textAlign: "left", position: "absolute", left: 19, top: 25 },
  libActionsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 33,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  libActionBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  pillRowScroll: { marginTop: 5 },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 19,
    paddingBottom: 14,
  },
  pillBorder: {},
  pillBorderSel: {},
  pill: {
    flex: 1,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.053)",
    borderWidth: 1,
    borderColor: "rgba(247,203,107,0.1)",
  },
  pillSel: { borderWidth: 0 },
  pillText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "450" as TextStyle["fontWeight"], letterSpacing: 0.3, color: "#F4F4F4" },
  pillTextSel: { fontFamily: "Manrope", color: "#2D0D3A", fontWeight: "500" },

  comingSoonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  comingSoonText: { fontFamily: "Manrope", fontSize: 15, color: "rgba(244,218,213,0.45)", fontWeight: "600" },

  // Registros
  registrosCard: { borderRadius: 16, overflow: "hidden" },
  registrosRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  registrosLabel: { fontFamily: "Manrope", flex: 1, fontSize: 19, fontWeight: "500" },

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
  userName: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "Manrope", fontSize: 12 },
  bioText: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, textAlign: "center", paddingHorizontal: 8, fontStyle: "italic" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 6,
  },
  editBtnText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  // Seguidores / Siguiendo
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 20 },
  followCountNum: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontFamily: "Manrope", fontSize: 11, marginTop: 1 },
  followCountDivider: { width: 1, height: 28 },

  // Plan card
  planCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  planIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  planTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  planSub: { fontFamily: "Manrope", fontSize: 12 },
  planMejorar: { flexDirection: "row", alignItems: "center", gap: 2 },
  planMejorarText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },

  // Tu Progreso — racha card
  rachaCard: { borderRadius: 18, padding: 18, marginBottom: 12 },
  rachaTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
  rachaBubble: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  rachaFlame: { fontFamily: "Manrope", fontSize: 24 },
  rachaValue: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", marginBottom: 3 },
  rachaSub: { fontFamily: "Manrope", fontSize: 12, lineHeight: 16 },
  rachaWeekRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  rachaDayPill: { alignItems: "center", gap: 5 },
  rachaDayLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600" },
  rachaDayCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  rachaMaxRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  rachaMaxIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rachaMaxLabel: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
  rachaMaxSub: { fontFamily: "Manrope", fontSize: 11, marginTop: 1 },
  rachaMaxValue: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  rachaVerMas: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 14 },
  rachaVerMasText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

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
  membershipPlan: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  membershipSub: { fontFamily: "Manrope", fontSize: 12 },
  membershipAction: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },


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
  favTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", marginBottom: 3 },
  favSub: { fontFamily: "Manrope", fontSize: 12 },

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
  menuLabel: { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "500" },

  footer: { fontFamily: "Manrope", textAlign: "center", fontSize: 11, letterSpacing: 1, marginBottom: 8 },

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
  modalTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  modalForm: { padding: 24, gap: 20, paddingBottom: 60 },

  // Modal fields
  fieldWrap: { gap: 7 },
  fieldLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  fieldInput: { fontFamily: "Manrope", flex: 1, fontSize: 15, backgroundColor: "transparent" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },

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
  communityLabel: { fontFamily: "Manrope", fontSize: 12, fontWeight: "500", textAlign: "center", letterSpacing: 0.2 },

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
    backgroundColor: "#F7CB6B",
    alignItems: "center",
    justifyContent: "center",
  },
  expansorBadgeStar: { fontFamily: "Manrope", fontSize: 14, color: "#1B060F", fontWeight: "800" },
  expansorTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", color: "#F7CB6B" },
  expansorCertLabel: { fontFamily: "Manrope", fontSize: 11, color: "rgba(212,175,55,0.60)", marginTop: 1 },
  expansorViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  expansorViewText: { fontFamily: "Manrope", fontSize: 12, color: "#F7CB6B", fontWeight: "600" },
  expansorSpecWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expansorChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(74,12,12,0.45)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  expansorChipText: { fontFamily: "Manrope", fontSize: 12, color: "#FAF0EE", fontWeight: "500" },
  expansorBio: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.75)" },
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
  expansorLinkText: { fontFamily: "Manrope", fontSize: 12, color: "#F7CB6B", fontWeight: "600" },

  // ── Sección Daniela Vega (expansor) ──
  dvExpansorSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    gap: 16,
    marginTop: -11,
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
  dvCertBannerTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "800", letterSpacing: 0.4, color: "#F7CB6B" },
  dvCertBannerSub: { fontFamily: "Manrope", fontSize: 11, color: "rgba(255,255,255,0.90)", marginTop: 2 },
  dvCertBannerIconBorder: {
    width: 35, height: 35, borderRadius: 18,
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.20)", flexShrink: 0,
  },
  dvCertBannerIcon: { flex: 1, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  dvCertBannerStar: { fontFamily: "Manrope", fontSize: 17, color: "rgba(212,175,55,0.90)", fontWeight: "800" },
  dvServiceTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.2 },
  dvServiceDesc: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "#F4F4F4" },
  dvReadMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, alignSelf: "flex-start" },
  dvReadMoreText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F7CB6B" },
  dvSpecialtyWrap: { flexDirection: "row", gap: 8, alignItems: "center" },
  dvSpecialtyChip: {
    borderRadius: 20, paddingHorizontal: 14, height: 34, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center",
  },
  dvSpecialtyText: { fontFamily: "Manrope", fontSize: 13, color: "#FFFFFF", fontWeight: "400", letterSpacing: 0.1 },
  dvContactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dvActionPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 14, height: 34, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  dvActionPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#FFFFFF", letterSpacing: 0.1 },
  dvGallerySection: {
    borderRadius: 18, padding: 16, gap: 12, marginBottom: 16,
  },
  dvGalleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  dvGalleryCell: { borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)" },
  dvQuoteWrap: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 8, marginBottom: 16 },
  dvQuoteText: {
    fontFamily: "Manrope",
    fontSize: 18, fontStyle: "italic", color: "#F6F6F6",
    textAlign: "center", lineHeight: 28, letterSpacing: 0.2,
  },
  dvLightboxBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  dvLightboxImage: { width: "100%", height: "80%" },
  dvLightboxClose: {
    position: "absolute", right: 18, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  dvEmptyPrompt: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 12, justifyContent: "center",
  },
  dvEmptyPromptText: { fontFamily: "Manrope", fontSize: 14, color: "#F7CB6B", fontWeight: "600" },
  expansorEditIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(212,175,55,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  epModalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end",
  },
  epModalSheet: {
    flex: 1,
    backgroundColor: "#1B060F",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, gap: 16,
    maxHeight: "90%",
  },
  epModalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
  },
  epModalTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#FAF0EE" },
  epPhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  epPhotoCell: {
    width: 80,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  epPhotoCellImg: {
    width: "100%",
    height: "100%",
  },
  epPhotoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  epPhotoAddBtn: {
    width: 80,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(212,175,55,0.40)",
    backgroundColor: "rgba(212,175,55,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Muro de reflexiones ───────────────────────────────────────────────────
  muroSectionTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 18,
  },
  muroCard: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 25,
    alignItems: "flex-start",
  },
  muroLeft: {
    width: 88,
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  muroThumb: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  muroSessionTitle: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
  },
  muroRight: {
    flex: 1,
  },
  muroMsgCard: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  muroMsgText: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  muroVerMas: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    color: "#F7CB6B",
  },

  // ── Racha Stats Card ──────────────────────────────────────────────────────
  rachaStatsCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  rachaStatsHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rachaStatsTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginRight: 4,
  },
  rachaWeekPills: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  rachaWeekPill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  rachaWeekPillText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
  },
  rachaWeekSub: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
  },
  rachaStatsRow: {
    flexDirection: "row",
    paddingVertical: 14,
  },
  rachaStatCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  rachaStatDivider: {
    position: "absolute",
    left: 0,
    top: "15%",
    bottom: "15%",
    width: 1,
  },
  rachaStatEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  rachaStatVal: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  rachaStatLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  rachaStatSub: {
    fontFamily: "Manrope",
    fontSize: 9,
    marginTop: 1,
  },
});

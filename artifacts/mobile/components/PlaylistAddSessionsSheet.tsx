/**
 * PlaylistAddSessionsSheet — v3
 *
 * Cambios vs v2:
 * - Animación de ticket simplificada: solo fill+check, sin rebote/ripple extra.
 * - Tap en ticket (check) elimina la sesión de la playlist.
 * - Todas las filas muestran overlay oscuro + icono play sobre la miniatura.
 * - Tap en miniatura: play 11 s con progreso circular (SVG), luego auto-pausa.
 * - Título "Agregar a una playlist" centrado.
 */

import { Feather } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { AUDIO_MAP } from "@/config/audio-map";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";

const BG_SHEET  = "#27070E";
const GOLD      = "#D4AF37";
const NAVY_CHECK = "#060A0F";
const TEXT      = "#F4DAD5";
const MUTED     = "rgba(242,231,228,0.45)";

const THUMB_SIZE      = 50;
const RING_RADIUS     = 23;
const CIRCUMFERENCE   = 2 * Math.PI * RING_RADIUS;
const PREVIEW_MS      = 11_000;

const TABS = ["Sesiones sugeridas", "Música sugerida", "Recientes"] as const;
type Tab = (typeof TABS)[number];

// categorías que van en cada tab
const SUGGESTED_CATEGORIES = new Set([
  "sonidos-ancestrales",
  "meditaciones-guiadas",
]);
const MUSIC_CATEGORIES = new Set([
  "musica-sonidos",
]);

// ─── Animated SVG circle ─────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── Miniatura con overlay play/pause + progreso circular ────────────────────
function PreviewThumb({
  session,
  isPreviewing,
  progressSV,
  onPress,
}: {
  session: Session;
  isPreviewing: boolean;
  progressSV: ReturnType<typeof useSharedValue<number>>;
  onPress: () => void;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressSV.value),
  }));

  return (
    <Pressable onPress={onPress} style={styles.thumbWrap}>
      <Image
        source={session.image as never}
        style={styles.thumb}
        placeholder={BLUR_PLACEHOLDER}
        transition={IMAGE_TRANSITION}
        contentFit="cover"
      />
      {/* Overlay oscuro */}
      <View style={styles.thumbOverlay} />

      {/* Icono play / pause centrado */}
      <View style={styles.thumbIcon}>
        <Feather name={isPreviewing ? "pause" : "play"} size={14} color="#FFF" />
      </View>

      {/* Progreso circular — solo cuando está reproduciendo */}
      {isPreviewing && (
        <Svg
          style={StyleSheet.absoluteFill}
          width={THUMB_SIZE}
          height={THUMB_SIZE}
        >
          <AnimatedCircle
            cx={THUMB_SIZE / 2}
            cy={THUMB_SIZE / 2}
            r={RING_RADIUS}
            stroke={GOLD}
            strokeWidth={2.5}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            fill="none"
            rotation={-90}
            origin={`${THUMB_SIZE / 2}, ${THUMB_SIZE / 2}`}
            animatedProps={animatedProps}
          />
        </Svg>
      )}
    </Pressable>
  );
}

// ─── Botón ticket (+ / ✓) ────────────────────────────────────────────────────
function AddButton({ added, onPress }: { added: boolean; onPress: () => void }) {
  const fillProgress  = useSharedValue(added ? 1 : 0);
  const checkOpacity  = useSharedValue(added ? 1 : 0);
  const rippleScale   = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const prevAdded     = useRef(added);

  useEffect(() => {
    if (added && !prevAdded.current) {
      // Onda expansiva dorada
      rippleScale.value = 0.3;
      rippleOpacity.value = 0.3;
      rippleScale.value = withTiming(1.8, { duration: 450 });
      rippleOpacity.value = withTiming(0, { duration: 450 });
      // Relleno + check
      fillProgress.value  = withSpring(1, { stiffness: 280, damping: 22 });
      checkOpacity.value  = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
    } else if (!added && prevAdded.current) {
      fillProgress.value  = withTiming(0, { duration: 180 });
      checkOpacity.value  = withTiming(0, { duration: 140 });
    }
    prevAdded.current = added;
  }, [added]); // eslint-disable-line react-hooks/exhaustive-deps

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(212,175,55,${fillProgress.value})`,
    borderColor: fillProgress.value > 0.5 ? GOLD : "rgba(212,175,55,0.35)",
  }));

  const plusStyle  = useAnimatedStyle(() => ({ opacity: 1 - checkOpacity.value }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: checkOpacity.value }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.addBtnOuter}>
      {/* Onda expansiva (detrás del círculo) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.centered, rippleStyle]}
        pointerEvents="none"
      >
        <View style={styles.rippleCore}><GoldGradientFill /></View>
      </Animated.View>
      <Animated.View style={[styles.addCircle, circleStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.centered, plusStyle]}>
          <Feather name="plus" size={16} color={MUTED} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.centered, checkStyle]}>
          <Feather name="check" size={16} color={NAVY_CHECK} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Fila de sesión ───────────────────────────────────────────────────────────
function SessionRow({
  session,
  isAdded,
  onAddRemove,
  isPreviewing,
  progressSV,
  onPreviewToggle,
}: {
  session: Session;
  isAdded: boolean;
  onAddRemove: () => void;
  isPreviewing: boolean;
  progressSV: ReturnType<typeof useSharedValue<number>>;
  onPreviewToggle: () => void;
}) {
  const guide  = session.guideId  ? getGuideById(session.guideId) : null;
  const artist = session.artistId ? getArtist(session.artistId)   : null;
  const author = guide?.name ?? artist?.name ?? "Casa del Cuenco";

  return (
    <Pressable onPress={onPreviewToggle} style={styles.sessionRow}>
      <PreviewThumb
        session={session}
        isPreviewing={isPreviewing}
        progressSV={progressSV}
        onPress={onPreviewToggle}
      />
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle} numberOfLines={2}>{session.title}</Text>
        <Text style={styles.sessionAuthor} numberOfLines={1}>{author}</Text>
      </View>
      <AddButton added={isAdded} onPress={onAddRemove} />
    </Pressable>
  );
}

// ─── Snapshot helper ─────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Hoja principal ───────────────────────────────────────────────────────────
export function PlaylistAddSessionsSheet({
  visible,
  playlistId,
  onClose,
}: {
  visible: boolean;
  playlistId: string;
  onClose: () => void;
}) {
  const insets    = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("Sesiones sugeridas");
  const { playlists, addToPlaylist, removeFromPlaylist, isInPlaylist } = useFoldersPlaylists();
  const { history } = usePlayer();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  // ── Slide entre tabs ─────────────────────────────────────────────────────
  const slideX = useSharedValue(0);
  const contentWidth = useRef(Dimensions.get("window").width);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  const switchTab = useCallback((newTab: Tab) => {
    setActiveTab((prev) => {
      const prevIdx = TABS.indexOf(prev);
      const newIdx  = TABS.indexOf(newTab);
      if (prevIdx === newIdx) return prev;
      const dir = newIdx > prevIdx ? 1 : -1;
      slideX.value = dir * contentWidth.current;
      slideX.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) });
      return newTab;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preview state ────────────────────────────────────────────────────────
  const [previewId, setPreviewId] = useState<string | null>(null);
  const progressSV   = useSharedValue(0);
  const soundRef     = useRef<Audio.Sound | null>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rastrea para qué sesión se está cargando audio (evita race si el usuario
  // cambia de preview mientras el createAsync aún no terminó).
  const loadingForRef = useRef<string | null>(null);

  const stopPreview = useCallback(async () => {
    loadingForRef.current = null;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    cancelAnimation(progressSV);
    progressSV.value = 0;
    const s = soundRef.current;
    soundRef.current = null;
    if (s) { void s.stopAsync().catch(() => {}); void s.unloadAsync().catch(() => {}); }
    setPreviewId(null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startPreview = useCallback(async (session: Session) => {
    // Parar sonido anterior sin bloquear — fire-and-forget
    loadingForRef.current = null;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    cancelAnimation(progressSV);
    const old = soundRef.current;
    soundRef.current = null;
    if (old) { void old.stopAsync().catch(() => {}); void old.unloadAsync().catch(() => {}); }

    // Fuente: bundleado primero, luego audioUri remoto
    const bundled = AUDIO_MAP[session.id];
    const src: number | { uri: string } | undefined =
      bundled ?? (session.audioUri ? { uri: session.audioUri } : undefined);
    if (!src) { setPreviewId(null); return; }

    // ── Arrancar UI inmediatamente ──────────────────────────────────────────
    setPreviewId(session.id);
    progressSV.value = 0;
    progressSV.value = withTiming(1, { duration: PREVIEW_MS, easing: Easing.linear });
    timerRef.current = setTimeout(() => { void stopPreview(); }, PREVIEW_MS);
    loadingForRef.current = session.id;

    // ── Cargar audio en background (no bloquea la animación) ────────────────
    try {
      const { sound } = await Audio.Sound.createAsync(
        typeof src === "number" ? src : src,
        { shouldPlay: true },
      );
      if (loadingForRef.current === session.id) {
        soundRef.current = sound;
      } else {
        void sound.stopAsync().catch(() => {});
        void sound.unloadAsync().catch(() => {});
      }
    } catch { /* ignorar */ }
  }, [stopPreview]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePreviewToggle = useCallback((session: Session) => {
    if (previewId === session.id) {
      void stopPreview();
    } else {
      void startPreview(session);
    }
  }, [previewId, stopPreview, startPreview]);

  // Detener preview al cerrar la hoja
  useEffect(() => {
    if (!visible) { void stopPreview(); }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Snapshot frozen ──────────────────────────────────────────────────────
  const playlist = playlists.find((p) => p.id === playlistId);
  const snapshot = useRef<{ suggested: Session[]; music: Session[]; recent: Session[] }>({
    suggested: [], music: [], recent: [],
  });

  useEffect(() => {
    if (!visible) return;
    setActiveTab("Sesiones sugeridas");
    const inPl = new Set(playlist?.sessionIds ?? []);
    const pool = SESSIONS.filter((s) => !inPl.has(s.id));
    snapshot.current.suggested = shuffle(
      pool.filter((s) => SUGGESTED_CATEGORIES.has(s.categoryId))
    ).slice(0, 30);
    snapshot.current.music = shuffle(
      pool.filter((s) => MUSIC_CATEGORIES.has(s.categoryId))
    ).slice(0, 30);
    const recent: Session[] = [];
    if (history?.length) {
      const seen = new Set<string>();
      for (const entry of [...history].reverse()) {
        if (seen.has(entry.sessionId)) continue;
        seen.add(entry.sessionId);
        const s = SESSIONS.find((x) => x.id === entry.sessionId);
        if (s && !inPl.has(s.id)) recent.push(s);
      }
    }
    snapshot.current.recent = recent.slice(0, 30);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const [, forceUpdate] = useState(0);
  useEffect(() => { if (visible) forceUpdate((n) => n + 1); }, [visible]);

  const data = useMemo(() => {
    if (activeTab === "Sesiones sugeridas") return snapshot.current.suggested;
    if (activeTab === "Música sugerida")    return snapshot.current.music;
    return snapshot.current.recent;
  }, [activeTab, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderItem = useCallback(
    ({ item }: { item: Session }) => (
      <SessionRow
        session={item}
        isAdded={isInPlaylist(playlistId, item.id)}
        onAddRemove={() => {
          if (isInPlaylist(playlistId, item.id)) {
            removeFromPlaylist(playlistId, item.id);
          } else {
            addToPlaylist(playlistId, item.id);
          }
        }}
        isPreviewing={previewId === item.id}
        progressSV={progressSV}
        onPreviewToggle={() => handlePreviewToggle(item)}
      />
    ),
    [isInPlaylist, playlistId, addToPlaylist, removeFromPlaylist, previewId, progressSV, handlePreviewToggle]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
        <View style={styles.handle} />

        {/* Header — título centrado */}
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Agregar a una Playlist</Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.headerClose}>
            <Feather name="x" size={20} color={MUTED} />
          </Pressable>
        </View>

        {/* Tabs — scroll horizontal para que no se corten */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsWrapper}
        >
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                style={({ pressed }) => [styles.tabChip, active && styles.tabChipActive, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => switchTab(tab)}
              >
                {active && <GoldGradientFill />}
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Lista — animada con slide */}
        <Animated.View
          style={[{ flex: 1, overflow: "hidden" }, slideStyle]}
          onLayout={(e) => { contentWidth.current = e.nativeEvent.layout.width; }}
        >
          {data.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="music" size={40} color={MUTED} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>
                {activeTab === "Recientes" ? "Aún no escuchaste ninguna sesión" : "No hay más sesiones disponibles"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(s) => s.id}
              renderItem={renderItem}
              extraData={previewId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 4 }}
              getItemLayout={(_, index) => ({ length: 68, offset: 68 * index, index })}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: "82%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.35)",
    marginTop: 10, marginBottom: 4,
  },

  // Header centrado
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSpacer: { width: 28 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  headerClose: { width: 28, alignItems: "flex-end" },

  // Tabs
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabChip: {
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  tabChipActive: { overflow: "hidden" },
  tabText: { color: TEXT, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#1B060F", fontWeight: "700" },

  // Session rows
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 12,
    height: 68,
  },

  // Miniatura con overlay
  thumbWrap: {
    width: THUMB_SIZE, height: THUMB_SIZE,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumb: {
    width: THUMB_SIZE, height: THUMB_SIZE,
    borderRadius: 8,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 8,
  },
  thumbIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },

  sessionInfo: { flex: 1 },
  sessionTitle: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  sessionAuthor: { color: MUTED, fontSize: 12, marginTop: 2 },

  // Add button
  addBtnOuter: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  addCircle: {
    width: 30, height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { alignItems: "center", justifyContent: "center" },
  rippleCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
  },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 },
  emptyText: { color: MUTED, fontSize: 14, textAlign: "center" },
});

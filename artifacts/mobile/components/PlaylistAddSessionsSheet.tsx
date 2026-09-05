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
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
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
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { AUDIO_MAP } from "@/config/audio-map";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";

const GOLD      = "#F9F9F9";
const NAVY_CHECK = "#060A0F";
const TEXT      = "#FAF0EE";
const MUTED     = "#c2c2c2";

const THUMB_SIZE      = 75;
const RING_RADIUS     = 35;
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
            stroke="#f9f9f9"
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
      fillProgress.value  = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
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
          <Feather name="plus" size={20} color={MUTED} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.centered, checkStyle]}>
          <Feather name="check" size={20} color={NAVY_CHECK} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Fila de sesión ───────────────────────────────────────────────────────────
const SessionRow = React.memo(function SessionRow({
  session,
  isAdded,
  onAddRemove,
  previewId,
  progressSV,
  onPreviewToggle,
}: {
  session: Session;
  isAdded: boolean;
  onAddRemove: () => void;
  previewId: string | null;
  progressSV: ReturnType<typeof useSharedValue<number>>;
  onPreviewToggle: () => void;
}) {
  const isPreviewing = previewId === session.id;
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
        <Text style={styles.sessionAuthor} numberOfLines={1}>{author}{session.durationLabel ? ` · ${session.durationLabel}` : ""}</Text>
      </View>
      <AddButton added={isAdded} onPress={onAddRemove} />
    </Pressable>
  );
}, (prev, next) => {
  // Solo re-renderizar si cambió isAdded o si el estado de preview de ESTA fila cambió
  const prevPrev = prev.previewId === prev.session.id;
  const nextPrev = next.previewId === next.session.id;
  return (
    prev.isAdded === next.isAdded &&
    prevPrev === nextPrev &&
    prev.onAddRemove === next.onAddRemove &&
    prev.onPreviewToggle === next.onPreviewToggle
  );
});

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
  const { theme } = useSceneTheme();
  // colorTab: chip dorado (actualización inmediata al tap)
  // displayTab: datos del FlatList (actualización solo al terminar la animación)
  const [colorTab,   setColorTab]   = useState<Tab>("Sesiones sugeridas");
  const [displayTab, setDisplayTab] = useState<Tab>("Sesiones sugeridas");
  const { playlists, addToPlaylist, removeFromPlaylist, isInPlaylist } = useFoldersPlaylists();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  // ── Slide entre tabs ─────────────────────────────────────────────────────
  const slideX = useSharedValue(0);
  const contentWidth = useRef(Dimensions.get("window").width);
  const slideStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slideX.value }] }));

  const switchTab = useCallback((newTab: Tab) => {
    setColorTab((prev) => {
      const prevIdx = TABS.indexOf(prev);
      const newIdx  = TABS.indexOf(newTab);
      if (prevIdx === newIdx) return prev;
      const dir = newIdx > prevIdx ? 1 : -1;
      slideX.value = dir * contentWidth.current;
      // Actualizar la lista DESPUÉS de que la animación termine (evita jank)
      slideX.value = withTiming(
        0,
        { duration: 240, easing: Easing.out(Easing.cubic) },
        (finished) => { if (finished) runOnJS(setDisplayTab)(newTab); },
      );
      return newTab;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Preview state ────────────────────────────────────────────────────────
  const [previewId, setPreviewId] = useState<string | null>(null);
  const progressSV   = useSharedValue(0);
  const soundRef     = useRef<AudioPlayer | null>(null);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia un player de expo-audio (pause + remove libera el recurso nativo)
  const cleanupSound = useCallback(async (s: AudioPlayer) => {
    try { s.pause(); } catch { /* ignorar */ }
    try { s.remove(); } catch { /* ignorar */ }
  }, []);

  const stopPreview = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    cancelAnimation(progressSV);
    progressSV.value = 0;
    const s = soundRef.current;
    soundRef.current = null;
    setPreviewId(null);
    if (s) { void cleanupSound(s); }
  }, [cleanupSound]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPreview = useCallback(async (session: Session) => {
    // Cancelar temporizador y animación actuales
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    cancelAnimation(progressSV);
    progressSV.value = 0;

    // Limpiar sonido anterior de forma secuencial (stop → unload) antes de crear el nuevo
    const old = soundRef.current;
    soundRef.current = null;
    setPreviewId(null);
    if (old) { await cleanupSound(old); }

    const bundled = AUDIO_MAP[session.id];
    const src = (bundled ?? (session.audioUri ? { uri: session.audioUri } : undefined)) as
      number | { uri: string } | undefined;
    if (!src) return;

    // ── Arrancar UI inmediatamente ──────────────────────────────────────────
    setPreviewId(session.id);
    progressSV.value = 0;
    progressSV.value = withTiming(1, { duration: PREVIEW_MS, easing: Easing.linear });
    timerRef.current = setTimeout(() => { void stopPreview(); }, PREVIEW_MS);

    // ── Crear player (sincrónico; expo-audio carga y arranca solo) ──────────
    try {
      const player = createAudioPlayer(src);
      player.play();
      soundRef.current = player;
    } catch { /* ignorar */ }
  }, [cleanupSound, stopPreview]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setColorTab("Sesiones sugeridas");
    setDisplayTab("Sesiones sugeridas");
    const inPl = new Set(playlist?.sessionIds ?? []);
    const pool = SESSIONS.filter((s) => !inPl.has(s.id));
    snapshot.current.suggested = shuffle(
      pool.filter((s) => SUGGESTED_CATEGORIES.has(s.categoryId))
    ).slice(0, 30);
    snapshot.current.music = shuffle(
      pool.filter((s) => MUSIC_CATEGORIES.has(s.categoryId))
    ).slice(0, 30);
    // Recientes = sesiones añadidas más recientemente al catálogo
    // (misma lógica que "Nuevas sesiones" en la pantalla de inicio)
    const recent = pool
      .slice()
      .sort((a, b) => {
        const aNum = parseInt(a.id, 10);
        const bNum = parseInt(b.id, 10);
        const aIsNum = !isNaN(aNum);
        const bIsNum = !isNaN(bNum);
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        if (!aIsNum && bIsNum) return -1;
        if (aIsNum && !bIsNum) return 1;
        if (!aIsNum && !bIsNum) {
          const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bT - aT;
        }
        return bNum - aNum;
      })
      .slice(0, 30);
    snapshot.current.recent = recent;
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const [tick, forceUpdate] = useState(0);
  useEffect(() => { if (visible) forceUpdate((n) => n + 1); }, [visible]);

  const data = useMemo(() => {
    if (displayTab === "Sesiones sugeridas") return snapshot.current.suggested;
    if (displayTab === "Música sugerida")    return snapshot.current.music;
    return snapshot.current.recent;
  // tick se incrementa tras poblar el snapshot → memo re-lee datos frescos
  }, [displayTab, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // previewId sale de los deps: SessionRow.memo solo re-renderiza filas
  // cuyo estado de preview cambia, no todas las 30 al mismo tiempo.
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
        previewId={previewId}
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
        <LinearGradient
          colors={theme.gradient}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.handle} />

        {/* Header — X a la izquierda */}
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.headerClose}>
            <Feather name="x" size={26} color={MUTED} />
          </Pressable>
          <Text style={styles.headerTitle}>Agregar a una Playlist</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs — scroll horizontal para que no se corten */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsWrapper}
        >
          {TABS.map((tab) => {
            const active = tab === colorTab;
            return (
              <Pressable
                key={tab}
                style={({ pressed }) => [
                  styles.tabChip,
                    active
                      ? styles.tabChipActive
                      : (theme.id === "tibet"
                        ? styles.tabChipInactiveTibet
                        : isIndigoThemeId(theme.id)
                          ? styles.tabChipInactiveIndigo
                          : null),
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => switchTab(tab)}
              >
                {active && (
                    <LinearGradient
                      colors={isIndigoThemeId(theme.id) ? ["#784576", "#50326E"] : ["#FFFFFF", "#F5F5F5"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                )}
                  <Text
                    style={[
                      styles.tabText,
                      active && styles.tabTextActive,
                      active && isIndigoThemeId(theme.id) && styles.tabTextIndigoActive,
                    ]}
                  >
                    {tab}
                  </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Lista — animada con slide */}
        <Animated.View
          style={[{ flex: 1 }, slideStyle]}
          onLayout={(e) => { contentWidth.current = e.nativeEvent.layout.width; }}
        >
          {data.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="music" size={40} color={MUTED} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>
                {"No hay más sesiones disponibles"}
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
              getItemLayout={(_, index) => ({ length: 102, offset: 102 * index, index })}
              windowSize={5}
              maxToRenderPerBatch={12}
              initialNumToRender={12}
              removeClippedSubviews
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
    backgroundColor: "rgba(255,255,255,0.08)",
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
    fontFamily: "Manrope",
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
    paddingHorizontal: 20,
    paddingVertical: 2,
  },
  tabChip: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 27,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tabChipActive: { borderWidth: 0 },
  tabChipInactiveTibet: {
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  tabChipInactiveIndigo: {
    backgroundColor: "rgba(42,40,64,0.65)",
  },
  tabText: { fontFamily: "Manrope", color: "#FBFBFB", fontSize: 14, fontWeight: "700", textAlign: "center" },
  tabTextActive: { color: "#0D0A1E", fontWeight: "600" },
  tabTextIndigoActive: { color: "#F9F9F9" },

  // Session rows
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    height: 102,
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
  sessionTitle: { fontFamily: "Manrope", color: TEXT, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  sessionAuthor: { fontFamily: "Manrope", color: "#f4f4f4", fontSize: 11, marginTop: 2 },

  // Add button
  addBtnOuter: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  addCircle: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { alignItems: "center", justifyContent: "center" },
  rippleCore: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
  },

  // Empty
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 },
  emptyText: { fontFamily: "Manrope", color: MUTED, fontSize: 14, textAlign: "center" },
});

/**
 * PlaylistAddSessionsSheet
 *
 * Fixes vs prior version:
 * - Data is FROZEN at sheet-open time (useRef snapshot). Adding a session does NOT
 *   remove it from the list → no reordering, no item remount → animation works.
 * - isAdded is derived reactively from context (isInPlaylist) so the button state
 *   updates correctly without touching the stable list.
 * - overflow:"hidden" removed from sheet so the horizontal tabs ScrollView is not
 *   hard-clipped at the right edge; the rounded top corners still render correctly.
 * - Third tab label shortened to "Recientes" so all three chips fit without crowding.
 */

import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
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
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";

const BG_SHEET = "#0E1326";
const GOLD = "#BE9650";
const NAVY_CHECK = "#060A0F";
const TEXT = "#EDE1D3";
const MUTED = "#7A8FA8";

// Shorter labels so all three chips fit comfortably in the row
const TABS = ["Sugeridas", "Música", "Recientes"] as const;
type Tab = (typeof TABS)[number];

// ─── Animated + Button ────────────────────────────────────────────────────────
function AddButton({ added, onPress }: { added: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0.4);
  const rippleOpacity = useSharedValue(0);
  const fillProgress = useSharedValue(added ? 1 : 0);
  const checkOpacity = useSharedValue(added ? 1 : 0);
  const prevAdded = useRef(added);

  useEffect(() => {
    if (added && !prevAdded.current) {
      // onda expansiva
      rippleScale.value = 0.4;
      rippleOpacity.value = 0.7;
      rippleScale.value = withTiming(2.6, { duration: 500, easing: Easing.out(Easing.cubic) });
      rippleOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
      // relleno dorado + check
      fillProgress.value = withSpring(1, { stiffness: 320, damping: 22 });
      checkOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
      // rebote de escala
      scale.value = withSequence(
        withSpring(0.78, { stiffness: 420, damping: 18 }),
        withSpring(1.22, { stiffness: 360, damping: 14 }),
        withSpring(1, { stiffness: 340, damping: 24 })
      );
    } else if (!added && prevAdded.current) {
      fillProgress.value = withTiming(0, { duration: 200 });
      checkOpacity.value = withTiming(0, { duration: 150 });
      scale.value = withSpring(1);
    }
    prevAdded.current = added;
  }, [added]); // eslint-disable-line react-hooks/exhaustive-deps

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: `rgba(190,150,80,${fillProgress.value})`,
    borderColor: fillProgress.value > 0.5 ? GOLD : "rgba(190,150,80,0.35)",
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const plusStyle = useAnimatedStyle(() => ({ opacity: 1 - checkOpacity.value }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: checkOpacity.value }));

  return (
    <Pressable onPress={onPress} hitSlop={12} style={styles.addBtnOuter}>
      <Animated.View style={[styles.ripple, rippleStyle]} />
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
  onAdd,
}: {
  session: Session;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const artist = session.artistId ? getArtist(session.artistId) : null;
  const author = guide?.name ?? artist?.name ?? "Casa del Cuenco";

  return (
    <View style={styles.sessionRow}>
      <Image
        source={session.image as never}
        style={styles.thumb}
        placeholder={BLUR_PLACEHOLDER}
        transition={IMAGE_TRANSITION}
        contentFit="cover"
      />
      <View style={styles.sessionInfo}>
        <Text style={styles.sessionTitle} numberOfLines={2}>{session.title}</Text>
        <Text style={styles.sessionAuthor} numberOfLines={1}>{author}</Text>
      </View>
      <AddButton added={isAdded} onPress={onAdd} />
    </View>
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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("Sugeridas");
  const { playlists, addToPlaylist, isInPlaylist } = useFoldersPlaylists();
  const { history } = usePlayer();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const playlist = playlists.find((p) => p.id === playlistId);

  /**
   * Frozen snapshot: computed ONCE when the sheet opens.
   * Adding a session only changes isInPlaylist (button state) but does NOT
   * remove the item from the list → no reordering, no item remount → animation works.
   */
  const snapshot = useRef<{ suggested: Session[]; music: Session[]; recent: Session[] }>({
    suggested: [],
    music: [],
    recent: [],
  });

  useEffect(() => {
    if (!visible) return;
    // Reset tab
    setActiveTab("Sugeridas");

    // Snapshot the excluded set at open-time
    const inPl = new Set(playlist?.sessionIds ?? []);

    // Sugeridas: all sessions not in playlist, shuffled
    const pool = SESSIONS.filter((s) => !inPl.has(s.id));
    snapshot.current.suggested = shuffle(pool).slice(0, 30);

    // Música: musica-sonidos category not in playlist
    snapshot.current.music = SESSIONS.filter(
      (s) => s.categoryId === "musica-sonidos" && !inPl.has(s.id)
    ).slice(0, 30);

    // Recientes: from play history, deduped, not in playlist
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

  // Derive display list from frozen snapshot — NEVER changes after open
  const [, forceUpdate] = useState(0);
  // Force a re-read of the ref after the effect runs
  useEffect(() => {
    if (visible) forceUpdate((n) => n + 1);
  }, [visible]);

  const data = useMemo(() => {
    if (activeTab === "Sugeridas") return snapshot.current.suggested;
    if (activeTab === "Música") return snapshot.current.music;
    return snapshot.current.recent;
  }, [activeTab, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = useCallback(
    (sessionId: string) => addToPlaylist(playlistId, sessionId),
    [addToPlaylist, playlistId]
  );

  // renderItem is stable — uses isInPlaylist from context for reactive button state
  const renderItem = useCallback(
    ({ item }: { item: Session }) => (
      <SessionRow
        session={item}
        isAdded={isInPlaylist(playlistId, item.id)}
        onAdd={() => handleAdd(item.id)}
      />
    ),
    [isInPlaylist, playlistId, handleAdd]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet — NO overflow:hidden so tabs ScrollView isn't clipped at right edge */}
      <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
        {/* Rounded top corners bg — separate from content so overflow:hidden doesn't apply to the whole sheet */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Agregar a una playlist</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={20} color={MUTED} />
          </Pressable>
        </View>

        {/* Tabs — three shorter labels that all fit without hard clipping */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {TABS.map((tab) => {
              const active = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  style={({ pressed }) => [
                    styles.tabChip,
                    active && styles.tabChipActive,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* List */}
        {data.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="music" size={40} color={MUTED} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>
              {activeTab === "Recientes"
                ? "Aún no escuchaste ninguna sesión"
                : "No hay más sesiones disponibles"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(s) => s.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 4 }}
            getItemLayout={(_, index) => ({ length: 68, offset: 68 * index, index })}
          />
        )}
      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "82%",
    backgroundColor: BG_SHEET,
    // No overflow:"hidden" → tabs ScrollView scrolls cleanly past the right edge
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 10,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },

  // Tabs
  tabsWrapper: { marginBottom: 8 },
  tabsContent: { paddingHorizontal: 16, gap: 8, paddingRight: 32 },
  tabChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  tabChipActive: {
    backgroundColor: GOLD,
  },
  tabText: { color: TEXT, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#0B0F14", fontWeight: "700" },

  // Session rows
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 12,
    height: 68,
  },
  thumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  sessionInfo: { flex: 1 },
  sessionTitle: { color: TEXT, fontSize: 14, fontWeight: "600", lineHeight: 19 },
  sessionAuthor: { color: MUTED, fontSize: 12, marginTop: 2 },

  // Add button
  addBtnOuter: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GOLD,
  },
  addCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  emptyText: { color: MUTED, fontSize: 14, textAlign: "center" },
});

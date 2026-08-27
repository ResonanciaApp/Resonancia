import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSceneTheme } from "@/context/SceneThemeContext";
import MaskedView from "@react-native-masked-view/masked-view";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import { router, useFocusEffect } from "expo-router";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SacredBackground } from "@/components/SacredBackground";
import { SacredGlyph } from "@/components/SacredGlyph";
import { SessionCard } from "@/components/SessionCard";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useMixer, type MixPreset, type MixFolder } from "@/context/MixerContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { EqualizerBars } from "@/components/EqualizerBars";
import { useLoadMix } from "@/hooks/useLoadMix";
import { MixActionsSheet } from "@/components/MixActionsSheet";
import { MixCover } from "@/app/mi-mezcla/[id]";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { HistorialCalendar } from "@/components/HistorialCalendar";
import { ARTISTS, getArtist, type Artist } from "@/data/artists";
import { GUIDES, getGuide, type Guide } from "@/data/guides";
import { SESSIONS, getSessionById } from "@/data/sessions";
import { useFoldersPlaylists, type Playlist as UserPlaylist, type Folder as UserFolder, type FavFolder } from "@/context/FoldersPlaylistsContext";
import { baseOf, type GeometryId } from "@/data/geometries";
import { gradientColors, type GeometrixCreation } from "@/data/geometrix-creations";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import { PlaylistActionsSheet } from "@/components/PlaylistActionsSheet";
import { getDefaultPlaylistCover } from "@/data/default-playlist-covers";
import { FavoriteActionsSheet } from "@/components/FavoriteActionsSheet";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GEO_CELL = (width - H_PAD * 2 - 10) / 2;
const GOLD = "#F9F9F9";
const NAVY = "#210911";
const DARK_BLUE = "#210911";
const TEXT = "#FBFBFB";
const MUTED = "#c2c2c2";

type LibTab = "playlists" | "mezclas" | "geometrix" | "historial" | "favoritos" | "resonadores";
type SortMode = "recientes" | "agregado" | "alfabetico";
type ViewMode = "list" | "grid";

const LIB_TABS: { id: LibTab; label: string }[] = [
  { id: "playlists",   label: "Playlists" },
  { id: "mezclas",     label: "Mezclas" },
  { id: "geometrix",   label: "Geometrías" },
];

// ── Fila de mezcla guardada ───────────────────────────────────────────────────
const MIX_THUMB = 65;

/** Abre una playlist como panel bajo el tab bar (fallback: ruta raíz). */
function usePlaylistPanelOpener() {
  const overlay = useCategoryOverlayOptional();
  return (plId: string) => {
    if (overlay) overlay.openCategory(`/playlist/${plId}`);
    else router.push(`/playlist/${plId}` as never);
  };
}

function MixRow({
  mix,
  isPlayingThis,
  onPress,
  onLongPress,
  onPressThumb,
  onPressMenu,
}: {
  mix: MixPreset;
  isPlayingThis: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onPressThumb: () => void;
  onPressMenu: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onPressThumb} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
        <MixCover mix={mix} size={MIX_THUMB} radius={6} />
      </Pressable>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={600}
        style={({ pressed }) => [styles.rowInfo, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.rowTitle} numberOfLines={1}>{mix.name}</Text>
        {isPlayingThis ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <EqualizerBars color="#f9f9f9" size="sm" />
            <Text style={[styles.rowSub, { color: "#f9f9f9" }]}>Reproduciendo</Text>
          </View>
        ) : (
          <Text style={styles.rowSub} numberOfLines={1}>
            {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
          </Text>
        )}
      </Pressable>
      <Pressable onPress={onPressMenu} hitSlop={10} style={styles.mixMenuBtn}>
        <Feather name="more-vertical" size={18} color={MUTED} />
      </Pressable>
    </View>
  );
}

// ── Chip de tab (píldora estilo Dormir, sin íconos) ──────────────────────────
function LibChip({ label, sel, onPress }: { label: string; sel: boolean; onPress: () => void }) {
  const { theme } = useSceneTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, theme.id === "tibet" && styles.chipTibet, theme.id === "indigo" && styles.chipIndigo, sel && styles.chipSel, { opacity: pressed ? 0.7 : 1 }]}
    >
      {sel && (
        <LinearGradient
          colors={theme.id === "indigo" ? ["#774544", "#50316f"] : ["#FFFFFF", "#F5F5F5"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.chipText, sel && styles.chipTextSel, sel && theme.id === "indigo" && styles.chipTextIndigoSel]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Fila de chips animada ─────────────────────────────────────────────────────
// Al filtrar: el chip elegido se desliza (lento) al margen izquierdo mientras los
// demás hacen fade out. Al quitar el filtro: vuelve a su lugar a la misma
// velocidad y los demás reaparecen con fade in.
const CHIP_ANIM_DURATION = 600;
const CLOSE_SLOT = 38; // ancho de la X (30) + gap (8)

function AnimatedChipRow({
  tabs,
  activeTab,
  onSelect,
  onClear,
  onSearch,
  onAdd,
}: {
  tabs: { id: LibTab; label: string }[];
  activeTab: LibTab | null;
  onSelect: (id: LibTab) => void;
  onClear: () => void;
  onSearch?: () => void;
  onAdd?: () => void;
}) {
  const progress = useRef(new Animated.Value(activeTab ? 1 : 0)).current;
  const offsetsRef = useRef<Record<string, number>>({});
  const scrollXRef = useRef(0);
  // Chip que se está mostrando como seleccionado (se conserva durante el
  // regreso para que pueda volver a su lugar antes de desmontarse).
  const [displayTab, setDisplayTab] = useState<LibTab | null>(activeTab);
  // Chip que se ve en color "seleccionado" (oro). Se desacopla de displayTab:
  // al deseleccionar cambia el color de inmediato, mientras el chip sigue
  // animando de vuelta a su posición.
  const [colorTab, setColorTab] = useState<LibTab | null>(activeTab);
  // Desplazamiento (px) hacia el margen del chip seleccionado.
  const [targetTranslate, setTargetTranslate] = useState(0);

  const filtered = displayTab !== null;

  const animate = (toValue: number, onDone?: () => void) => {
    Animated.timing(progress, {
      toValue,
      duration: CHIP_ANIM_DURATION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDone?.();
    });
  };

  const handleSelect = (id: LibTab) => {
    const off = offsetsRef.current[id] ?? 0;
    const visualLeft = off - scrollXRef.current;
    setTargetTranslate(CLOSE_SLOT - visualLeft); // negativo: lo lleva al margen
    setDisplayTab(id);
    setColorTab(id); // se pone oro al instante
    onSelect(id);
    animate(1);
  };

  const handleClear = () => {
    setColorTab(null); // vuelve a gris al instante del tap, antes de moverse
    onClear();
    animate(0, () => setDisplayTab(null));
  };

  // Cleanup: detener la animación si el componente se desmonta a mitad de
  // transición (evita callbacks tardíos sobre estado ya desmontado).
  useEffect(() => () => progress.stopAnimation(), [progress]);

  return (
    <View style={styles.animChipWrap}>
      {/* Botón X (cierra el filtro) — aparece con fade in en el margen */}
      <Animated.View
        pointerEvents={filtered ? "auto" : "none"}
        style={[styles.animCloseBtn, { opacity: progress }]}
      >
        <Pressable onPress={handleClear} hitSlop={10} style={styles.chipCloseBtn}>
          <Feather name="x" size={22} color={MUTED} />
        </Pressable>
      </Animated.View>

      {/* Lupa + Más — a la derecha, siempre visibles (también con tab seleccionado) */}
      {(onSearch || onAdd) && (
        <Animated.View pointerEvents="auto" style={styles.chipRowActions}>
          {onSearch && (
            <Pressable onPress={onSearch} hitSlop={10} style={styles.chipActionBtn}>
              <Feather name="search" size={22} color="#f9f9f9" />
            </Pressable>
          )}
          {onAdd && (
            <Pressable onPress={onAdd} hitSlop={10} style={styles.chipActionBtn}>
              <Feather name="plus" size={24} color="#f9f9f9" />
            </Pressable>
          )}
        </Animated.View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!filtered}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollXRef.current = e.nativeEvent.contentOffset.x;
        }}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {tabs.map((t) => {
          const isSelected = displayTab === t.id;
          const chipStyle = isSelected
            ? {
                opacity: 1,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, targetTranslate],
                    }),
                  },
                ],
              }
            : {
                // Los demás se desvanecen mientras el seleccionado se desplaza.
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              };

          return (
            <Animated.View
              key={t.id}
              pointerEvents={filtered && !isSelected ? "none" : "auto"}
              onLayout={(e) => {
                offsetsRef.current[t.id] = e.nativeEvent.layout.x;
              }}
              style={chipStyle}
            >
              <LibChip
                label={t.label}
                sel={colorTab === t.id}
                onPress={() => (isSelected ? handleClear() : handleSelect(t.id))}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Fila de carpeta del usuario ───────────────────────────────────────────────
function FolderRow({ folder, onPress, onLongPress }: { folder: UserFolder; onPress: () => void; onLongPress?: () => void }) {
  const nPl = (folder.playlistIds ?? []).length;
  const nMix = (folder.presetIds ?? []).length;
  const nSub = (folder.subFolderIds ?? []).length;
  const count = nPl + nMix + nSub;
  const label = nMix > 0 || nSub > 0
    ? `${count} elemento${count !== 1 ? "s" : ""}`
    : `${nPl} playlist${nPl !== 1 ? "s" : ""}`;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={600} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.userPlCover}>
        <Feather name="folder" size={26} color={folder.pinned ? GOLD : MUTED} />
      </View>
      <View style={styles.rowInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{folder.name}</Text>
          {folder.pinned && <Feather name="bookmark" size={12} color={GOLD} />}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Fila de carpeta de mezclas ────────────────────────────────────────────────
function MixFolderRow({ folder, onPress, onLongPress }: { folder: MixFolder; onPress: () => void; onLongPress?: () => void }) {
  const count = folder.presetIds.length;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={600} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.userPlCover}>
        <Feather name="folder" size={26} color={folder.pinned ? GOLD : MUTED} />
      </View>
      <View style={styles.rowInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{folder.name}</Text>
          {folder.pinned && <Feather name="bookmark" size={12} color={GOLD} />}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          {count} mezcla{count !== 1 ? "s" : ""}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Fila de playlist del usuario ─────────────────────────────────────────────
function UserPlaylistRow({ pl, onPress, onLongPress }: { pl: UserPlaylist; onPress: () => void; onLongPress?: () => void }) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={600} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.userPlCover}>
        {getDefaultPlaylistCover(pl.id) && !pl.coverUri && !pl.coverType ? (
          <Image source={getDefaultPlaylistCover(pl.id)} style={styles.userPlCover} contentFit="cover" />
        ) : pl.coverType === "geometrix" && pl.coverGeometryId ? (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <SacredGlyph id={pl.coverGeometryId as GeometryId} color={GOLD} size={82} strokeWidth={1.2} opacity={1} />
          </View>
        ) : pl.coverType === "creation" && pl.coverCreationId ? (
          <CreationCoverPreview creationId={pl.coverCreationId} size={64} />
        ) : pl.coverUri ? (
          <Image source={{ uri: pl.coverUri }} style={styles.userPlCover} contentFit="cover" />
        ) : (
          <Feather name="music" size={24} color={MUTED} />
        )}
      </View>
      <View style={styles.rowInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{pl.name}</Text>
          {pl.pinned && <Feather name="bookmark" size={12} color={GOLD} />}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>Playlist · Casa del Cuenco</Text>
      </View>
    </Pressable>
  );
}

// ── Resonador fila ───────────────────────────────────────────────────────────
function ResonadorRow({ name, photo, tags, onPress, onLongPress }: {
  name: string;
  photo: import("react-native").ImageSourcePropType;
  tags: string[];
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={600} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <Image source={photo} style={styles.resonadorAvatar} resizeMode="cover" />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{name}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 3 }}>
          {tags.map((t) => (
            <View key={t} style={styles.resonadorTag}>
              <Text style={styles.resonadorTagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

// ── Modal de Buscar ───────────────────────────────────────────────────────────
type LibResult =
  | { kind: "session";  data: import("@/data/sessions").Session }
  | { kind: "mix";      data: MixPreset }
  | { kind: "playlist"; data: UserPlaylist };

function SearchOverlay({ visible, onClose, gradient, accentColor }: { visible: boolean; onClose: () => void; gradient: readonly string[]; accentColor: string }) {
  const overlay = useCategoryOverlayOptional();
  const openPlaylistPanel = usePlaylistPanelOpener();
  const [q, setQ] = useState("");
  const inputRef  = useRef<TextInput>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [kbReady,  setKbReady]  = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const insets    = useSafeAreaInsets();

  const { favorites, playSession } = usePlayer();
  const { isPremium: libIsPremium } = usePremium();
  const { presets, loadedPresetId, openSheet } = useMixer();
  const loadMix = useLoadMix();
  const { playlists: userPlaylists } = useFoldersPlaylists();

  useEffect(() => {
    if (!visible) { setQ(""); setKbReady(false); setKbHeight(0); fadeAnim.setValue(0); return; }
    const show = Keyboard.addListener("keyboardWillShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setKbReady(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: e.duration ?? 250, useNativeDriver: true }).start();
    });
    const showFallback = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setKbReady(true);
      fadeAnim.setValue(1);
    });
    const hide = Keyboard.addListener("keyboardWillHide", () => { setKbReady(false); fadeAnim.setValue(0); });
    return () => { show.remove(); showFallback.remove(); hide.remove(); };
  }, [visible, fadeAnim]);

  const results: LibResult[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: LibResult[] = [];
    const favSet = new Set(favorites);
    SESSIONS.filter((s) =>
      favSet.has(s.id) && (
        s.title.toLowerCase().includes(term) ||
        s.categoryLabel.toLowerCase().includes(term) ||
        (s.subtitle ?? "").toLowerCase().includes(term)
      )
    ).slice(0, 15).forEach((s) => out.push({ kind: "session", data: s }));
    userPlaylists
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 8).forEach((p) => out.push({ kind: "playlist", data: p }));
    presets
      .filter((m) => m.name.toLowerCase().includes(term))
      .slice(0, 8).forEach((m) => out.push({ kind: "mix", data: m }));
    return out;
  }, [q, favorites, userPlaylists, presets]);

  const handleSelect = (result: LibResult) => {
    onClose();
    if (result.kind === "session") {
      if (result.data.skipMiniPlayer && !(result.data.isPremium && !libIsPremium)) { playSession(result.data); return; }
      if (result.data.skipDetail) { playSession(result.data); router.push("/player" as never); return; }
      if (overlay) overlay.openCategory(`/session/${result.data.id}`); else router.push(`/session/${result.data.id}` as never);
    }
    else if (result.kind === "playlist") openPlaylistPanel(result.data.id);
    else {
      if (loadedPresetId !== result.data.id) loadMix(result.data);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} onShow={() => inputRef.current?.focus()}>
      <LinearGradient colors={gradient as [string, string, ...string[]]} style={[blStyles.root, { paddingBottom: kbHeight }]}>
        {/* Barra */}
        <View style={[blStyles.overlay, { paddingTop: insets.top + 14, backgroundColor: "transparent" }]}>
          <View style={blStyles.bar}>
            <Feather name="search" size={16} color={accentColor} style={{ opacity: 0.8 }} />
            <TextInput
              ref={inputRef}
              style={blStyles.input}
              placeholder="Buscar en tu biblioteca..."
              placeholderTextColor="rgba(242,231,228,0.45)"
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
              autoCorrect={false}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")} hitSlop={10}>
                <Feather name="x" size={15} color="rgba(242,231,228,0.45)" />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} style={blStyles.cancel}>
            <Text style={[blStyles.cancelText, { color: accentColor }]}>Cancelar</Text>
          </Pressable>
        </View>

        {/* Placeholder vacío */}
        {q.length === 0 && kbReady && (
          <Animated.View style={[blStyles.empty, { opacity: fadeAnim }]}>
            <Feather name="headphones" size={52} color={accentColor} style={{ marginBottom: 16 }} />
            <Text style={blStyles.emptyTitle}>Encuentra en tu biblioteca</Text>
            <Text style={blStyles.emptySub}>Busca favoritos, playlists y mezclas…</Text>
          </Animated.View>
        )}

        {/* Resultados */}
        {q.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(r) => `${r.kind}-${r.data.id}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={blStyles.empty}>
                <Feather name="search" size={40} color={MUTED} style={{ marginBottom: 12 }} />
                <Text style={blStyles.emptyTitle}>Sin resultados</Text>
                <Text style={blStyles.emptySub}>Intenta con otro término</Text>
              </View>
            }
            renderItem={({ item: result }) => {
              let thumb: React.ReactNode;
              let cat: string;
              let title: string;
              let sub: string | null = null;

              if (result.kind === "session") {
                const s = result.data;
                thumb = <Image source={s.image as number} style={blStyles.thumb} contentFit="cover" />;
                cat   = s.categoryLabel;
                title = s.title;
                sub   = s.guideId
                  ? getGuide(s.guideId).name
                  : s.artistId
                  ? getArtist(s.artistId).name
                  : s.subtitle ?? null;
              } else if (result.kind === "playlist") {
                const p = result.data;
                thumb = (
                  <View style={[blStyles.thumb, { alignItems: "center", justifyContent: "center" }]}>
                    <Feather name="list" size={28} color={GOLD} />
                  </View>
                );
                cat   = "Playlist";
                title = p.name;
                sub   = `${p.sessionIds.length} sesión${p.sessionIds.length !== 1 ? "es" : ""}`;
              } else {
                const m = result.data;
                thumb = (
                  <View style={[blStyles.thumb, { overflow: "hidden" }]}>
                    <MixCover mix={m} size={75} radius={14} />
                  </View>
                );
                cat   = "Mezcla";
                title = m.name;
                sub   = `${m.sounds.length} sonido${m.sounds.length !== 1 ? "s" : ""}`;
              }

              return (
                <Pressable
                  onPress={() => handleSelect(result)}
                  style={({ pressed }) => [blStyles.resultRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  {thumb}
                  <View style={{ flex: 1 }}>
                    <Text style={blStyles.resultCat}    numberOfLines={1}>{cat}</Text>
                    <Text style={blStyles.resultTitle}  numberOfLines={1}>{title}</Text>
                    {sub && <Text style={blStyles.resultAuthor} numberOfLines={1}>{sub}</Text>}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </LinearGradient>
    </Modal>
  );
}

const blStyles = StyleSheet.create({
  root:         { flex: 1 },
  overlay:      { flexDirection: "row", alignItems: "center", paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10 },
  bar:          { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  input:        { fontFamily: "Manrope", flex: 1, fontSize: 14, color: "#FBFBFB" },
  cancel:       { paddingVertical: 6 },
  cancelText:   { fontFamily: "Manrope", color: "#F9F9F9", fontSize: 14, fontWeight: "600" },
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle:   { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB", textAlign: "center", marginBottom: 10 },
  emptySub:     { fontFamily: "Manrope", fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },
  resultRow:    { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 5 },
  thumb:        { width: 75, height: 75, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.07)" },
  resultCat:    { fontFamily: "Manrope", fontSize: 12, color: "rgba(242,231,228,0.45)", marginBottom: 3 },
  resultTitle:  { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FBFBFB", marginBottom: 3 },
  resultAuthor: { fontFamily: "Manrope", fontSize: 12, color: "rgba(242,231,228,0.45)" },
});

// ── Modal de nombre de carpeta ────────────────────────────────────────────────
function NombreCarpetaModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor?: string }) {
  const { folders, createFolder } = useFoldersPlaylists();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const suggestedName = `Mi carpeta n.° ${folders.length + 1}`;

  useEffect(() => {
    if (visible) setName(suggestedName);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    const trimmed = name.trim() || suggestedName;
    const folder = createFolder(trimmed);
    onClose();
    router.push(`/carpeta/${folder.id}` as never);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.nameCard, bgColor ? { backgroundColor: bgColor } : undefined]}>
          <Pressable style={styles.nameCloseBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.nameCardTitle}>Ponle un nombre a la carpeta</Text>
          <View style={styles.nameInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              placeholderTextColor={MUTED}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.nameCreateBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreate}
          >
            <GoldGradientFill />
            <Text style={styles.nameCreateBtnText}>Crear</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Modal de nombre de playlist ───────────────────────────────────────────────
function NombrePlaylistModal({ visible, onClose, bgColor }: { visible: boolean; onClose: () => void; bgColor?: string }) {
  const openPlaylistPanel = usePlaylistPanelOpener();
  const { playlists, createPlaylist } = useFoldersPlaylists();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const suggestedName = `Mi Playlist n.° ${playlists.length + 1}`;

  useEffect(() => {
    if (visible) setName(suggestedName);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    const trimmed = name.trim() || suggestedName;
    const pl = createPlaylist(trimmed);
    onClose();
    openPlaylistPanel(pl.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.nameCard, bgColor ? { backgroundColor: bgColor } : undefined]}>
          <Pressable style={styles.nameCloseBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.nameCardTitle}>Ponle un nombre a tu playlist</Text>
          <View style={styles.nameInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              placeholderTextColor={MUTED}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.nameCreateBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreate}
          >
            <GoldGradientFill />
            <Text style={styles.nameCreateBtnText}>Crear</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Modal de nombre de carpeta de mezclas ─────────────────────────────────────
function NombreCarpetaMezclaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { mixFolders, createMixFolder } = useMixer();
  const { activeSceneId } = useSceneTheme();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const suggestedName = `Mi carpeta n.° ${mixFolders.length + 1}`;

  useEffect(() => {
    if (visible) setName(suggestedName);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    const trimmed = name.trim() || suggestedName;
    const folder = createMixFolder(trimmed);
    onClose();
    router.push(`/carpeta-mezcla/${folder.id}` as never);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.nameCard, { backgroundColor: "#2d4081" }]}>
          <Pressable style={styles.nameCloseBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.nameCardTitle}>Ponle un nombre a la carpeta</Text>
          <View style={styles.nameInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              placeholderTextColor={MUTED}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.nameCreateBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreate}
          >
            <GoldGradientFill />
            <Text style={styles.nameCreateBtnText}>Crear</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function NombreCarpetaFavModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { favFolders, createFavFolder } = useFoldersPlaylists();
  const [name, setName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const suggestedName = `Mi carpeta n.° ${favFolders.length + 1}`;

  useEffect(() => {
    if (visible) setName(suggestedName);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = () => {
    const trimmed = name.trim() || suggestedName;
    const folder = createFavFolder(trimmed);
    onClose();
    router.push(`/carpeta-favorito/${folder.id}` as never);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.nameCard, { backgroundColor: "#2d4081" }]}>
          <Pressable style={styles.nameCloseBtn} onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={TEXT} />
          </Pressable>
          <Text style={styles.nameCardTitle}>Ponle un nombre a la carpeta</Text>
          <View style={styles.nameInputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              placeholderTextColor={MUTED}
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.nameCreateBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleCreate}
          >
            <GoldGradientFill />
            <Text style={styles.nameCreateBtnText}>Crear</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Fila de carpeta de favoritos ──────────────────────────────────────────────
function FavFolderRow({ folder, onPress, onLongPress }: { folder: FavFolder; onPress: () => void; onLongPress?: () => void }) {
  const count = folder.sessionIds.length;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={600} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.userPlCover}>
        <Feather name="folder" size={26} color={folder.pinned ? GOLD : MUTED} />
      </View>
      <View style={styles.rowInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{folder.name}</Text>
          {folder.pinned && <Feather name="bookmark" size={12} color={GOLD} />}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          {count} favorito{count !== 1 ? "s" : ""}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Hoja de crear ────────────────────────────────────────────────────────────
function CreateSheet({ visible, onClose, onCreatePlaylist, onCreateCarpeta, onGoMezclas, gradient }: {
  visible: boolean;
  onClose: () => void;
  onCreatePlaylist: () => void;
  onCreateCarpeta: () => void;
  onGoMezclas: () => void;
  gradient: readonly string[];
}) {
  const { openGeometrix } = useGeometrixPanel();
  const ITEMS = [
    { icon: "list" as const,     title: "Crear una Playlist",        sub: "Crea una playlist con sesiones",           onPress: () => { onClose(); onCreatePlaylist(); } },
    { icon: "sliders" as const,  title: "Crea tus mezclas",       sub: "Crea una mezcla de sonidos relajantes", onPress: () => { onClose(); onGoMezclas(); } },
    { icon: "hexagon" as const,  title: "Crea tus Geometrix",     sub: "Crea y anima tus geometrías sagradas",  onPress: () => { onClose(); openGeometrix(); } },
    { icon: "folder" as const,   title: "Carpetas",               sub: "Organiza tus Playlists",                 onPress: () => { onClose(); onCreateCarpeta(); } },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[StyleSheet.absoluteFill, styles.sheetBackdrop]} onPress={onClose} />
      <LinearGradient colors={gradient as [string, string, ...string[]]} style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>¿Qué quieres crear?</Text>
        {ITEMS.map((it) => (
          <Pressable key={it.title} style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.7 : 1 }]} onPress={it.onPress}>
            <View style={styles.sheetIcon}>
              <Feather name={it.icon} size={20} color={GOLD} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemTitle}>{it.title}</Text>
              <Text style={styles.sheetItemSub}>{it.sub}</Text>
            </View>
          </Pressable>
        ))}
      </LinearGradient>
    </Modal>
  );
}

// ── Fila de creación Geometrix ────────────────────────────────────────────────
function formatRelGeo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

function GeometrixRow({ creation, onPress }: { creation: GeometrixCreation; onPress: () => void }) {
  const firstLayers = creation.active.slice(0, 3);
  return (
    <Pressable
      style={({ pressed }) => [styles.geoRow, { opacity: pressed ? 0.75 : 1 }]}
      onPress={onPress}
    >
      {/* Miniatura: cuadrado oscuro con las primeras capas superpuestas */}
      <View style={styles.geoThumb}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
        {firstLayers.map((instId, idx) => {
          const geoId = baseOf(instId);
          const settings = creation.settings[instId];
          if (!settings) return null;
          const layerSize = Math.round((72 + idx * 8) * 1.82);
          return (
            <View
              key={instId}
              style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}
              pointerEvents="none"
            >
              <SacredGlyph
                id={geoId}
                color={settings.color}
                gradient={gradientColors(settings.gradientId)}
                size={layerSize}
                strokeWidth={1 + settings.thickness * 1.5}
              />
            </View>
          );
        })}
      </View>

      {/* Info */}
      <View style={styles.geoInfo}>
        <Text style={styles.geoName} numberOfLines={1}>{creation.name}</Text>
        <Text style={styles.geoSub} numberOfLines={1}>
          {creation.active.length} {creation.active.length === 1 ? "capa" : "capas"} · {formatRelGeo(creation.updatedAt)}
        </Text>
      </View>

    </Pressable>
  );
}

// ── Hoja de ordenar ──────────────────────────────────────────────────────────
const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes",   label: "Recientes",               icon: "clock" },
  { id: "agregado",    label: "Agregado recientemente",  icon: "plus-circle" },
  { id: "alfabetico",  label: "Alfabéticamente",          icon: "type" },
];

function SortSheet({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: SortMode;
  onSelect: (s: SortMode) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sortSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.sortSheetHandle} />
        <Text style={styles.sortSheetTitle}>Ordenar por</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = opt.id === current;
          return (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [styles.sortSheetRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { onSelect(opt.id); onClose(); }}
            >
              <Feather name={opt.icon as never} size={21} color={active ? GOLD : MUTED} />
              <Text style={[styles.sortSheetLabel, active && styles.sortSheetLabelActive]}>
                {opt.label}
              </Text>
              {active && <Feather name="check" size={21} color={GOLD} style={{ marginLeft: "auto" }} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

// ── Wrapper animado para transiciones de tab ──────────────────────────────────
function AnimatedTabContent({
  animType,
  children,
}: {
  animType: "slide" | "fade" | "none";
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const tx      = useRef(new Animated.Value(animType === "slide" ? 20 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tx, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: tx }] }}>
      {children}
    </Animated.View>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export type LibHeaderActions = { onSearch: () => void; onAdd: () => void; hidden: boolean };

export function BibliotecaScreen({
  embedded = false,
  onHeaderActions,
}: { embedded?: boolean; onHeaderActions?: (state: LibHeaderActions | null) => void } = {}) {
  const openPlaylistPanel = usePlaylistPanelOpener();
  const insets = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const { activeSceneId, theme: sceneTheme } = useSceneTheme();
  const iconPlaceholderColor = "#fefefe";

  // ── Borde bajo los chips (Playlists/Mezclas/Favoritos/Resonadores) ──────
  // se activa a partir de unos pocos px de scroll dentro de ESTA pantalla
  // (independiente del sticky header de Perfil / sus demás pestañas)
  const HEADER_BORDER_THRESHOLD_PX = 8;
  const headerBorderActiveRef = useRef(false);
  const headerBorderAnim = useRef(new Animated.Value(0)).current;
  const handleHeaderScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<LibTab | null>(null);
  const [sort, setSort] = useState<SortMode>("recientes");
  const [sortVisible, setSortVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mixesLimit, setMixesLimit] = useState(12);
  const [geoLimit, setGeoLimit] = useState(8);
  const [addResonadorVisible, setAddResonadorVisible] = useState(false);
  const [addResonadorQ, setAddResonadorQ] = useState("");
  const [addResKbHeight, setAddResKbHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardWillShow", (e) => setAddResKbHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener("keyboardWillHide", () => setAddResKbHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const [favLimit, setFavLimit] = useState(12);
  const [searchVisible, setSearchVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [nombreVisible, setNombreVisible] = useState(false);
  const [nombreCarpetaVisible, setNombreCarpetaVisible] = useState(false);
  const [nombreCarpetaMezclaVisible, setNombreCarpetaMezclaVisible] = useState(false);
  const [actionsItemId, setActionsItemId] = useState<string | null>(null);
  const [actionsItemKind, setActionsItemKind] = useState<"playlist" | "folder" | null>(null);
  const [nombreCarpetaFavVisible, setNombreCarpetaFavVisible] = useState(false);
  const [favActionsItemId, setFavActionsItemId] = useState<string | null>(null);
  const [favActionsItemKind, setFavActionsItemKind] = useState<"session" | "folder" | null>(null);
  const { playlists: userPlaylists, folders: userFolders, favFolders, pinnedFavoriteIds } = useFoldersPlaylists();

  const { creations: geometrixCreations, reload: reloadCreations } = useGeometrixCreations();
  useFocusEffect(useCallback(() => { reloadCreations(); }, [reloadCreations]));

  // Reset paginación al cambiar de tab
  useEffect(() => { setMixesLimit(12); setGeoLimit(8); setFavLimit(12); }, [activeTab]);

  // Expone lupa/+ al header externo (píldora alineada con el título "Biblioteca").
  useEffect(() => {
    if (!onHeaderActions) return;
    onHeaderActions({
      onSearch: () => setSearchVisible(true),
      onAdd: () => setCreateVisible(true),
      hidden: false,
    });
    return () => onHeaderActions(null);
  }, [onHeaderActions, activeTab]);

  const toggleView = () => setViewMode((v) => (v === "list" ? "grid" : "list"));

  const {
    presets, loadedPresetId, isPlaying: mixerPlaying, deletePreset, duplicatePreset, openSheet,
    mixFolders,
  } = useMixer();
  const { openMixer } = useMixerPanel();
  const { openGeometrix } = useGeometrixPanel();
  const loadMix = useLoadMix();
  const [mixMenuPreset, setMixMenuPreset] = useState<MixPreset | null>(null);
  const [mixMenuFolder, setMixMenuFolder] = useState<MixFolder | null>(null);

  const { history, favorites } = usePlayer();
  const { isPremium } = usePremium();


  // Resonadores = todos los artistas + guías disponibles para seguir
  const allResonadores = useMemo(() => {
    const artists = ARTISTS.filter((a) => a.id !== "resonancia").map((a) => ({
      id: a.id, name: a.name, photo: a.photo, tags: ["Músico"], kind: "artist" as const,
    }));
    const guides = GUIDES.filter((g) => g.id !== "casa-cuenco").map((g) => ({
      id: g.id, name: g.name, photo: g.photo, tags: ["Voz Guía"], kind: "guide" as const,
    }));
    return [...artists, ...guides];
  }, []);

  const FOLLOWED_KEY = "@biblioteca_followed_resonadores";
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(FOLLOWED_KEY).then((val) => {
      if (val) setFollowedIds(JSON.parse(val));
    });
  }, []);
  const saveFollowed = (ids: string[]) => {
    setFollowedIds(ids);
    AsyncStorage.setItem(FOLLOWED_KEY, JSON.stringify(ids));
  };
  const followResonador = (id: string) => {
    if (!followedIds.includes(id)) saveFollowed([id, ...followedIds]);
  };
  const unfollowResonador = (id: string, name?: string) => {
    Alert.alert(
      "Dejar de seguir",
      `¿Querés dejar de seguir a ${name ?? "este resonador"}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => saveFollowed(followedIds.filter((x) => x !== id)) },
      ]
    );
  };

  const resonadores = useMemo(
    () => followedIds.map((id) => allResonadores.find((r) => r.id === id)).filter((r): r is typeof allResonadores[number] => !!r),
    [allResonadores, followedIds]
  );

  const renderContent = () => {
    // ── Modo general (sin tab seleccionado) ──────────────────────────────────
    if (activeTab === null) {
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;

      const sortSessions = (arr: import("@/data/sessions").Session[]) => {
        if (sort === "alfabetico") return [...arr].sort((a, b) => a.title.localeCompare(b.title, "es"));
        if (sort === "agregado")   return [...arr].sort((a, b) => parseInt(b.id) - parseInt(a.id));
        return arr; // "recientes" = orden natural
      };

      // Comparador según el modo de orden elegido (Recientes / Agregado / Alfabético),
      // manteniendo los fijados (pinned) siempre primero.
      const cmpGeneral = (a: { pinned?: boolean; name?: string; createdAt: string }, b: { pinned?: boolean; name?: string; createdAt: string }) => {
        if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (sort === "alfabetico") return (a.name ?? "").localeCompare(b.name ?? "", "es");
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      };

      const sortedFoldersGeneral = [...userFolders].sort(cmpGeneral);
      const sortedFavFoldersGeneral = [...favFolders].sort(cmpGeneral);
      const plIdsInFoldersGeneral = new Set(userFolders.flatMap((f) => f.playlistIds ?? []));
      const sortedPlaylists = userPlaylists
        .filter((pl) => !plIdsInFoldersGeneral.has(pl.id))
        .sort(cmpGeneral);
      const hasUserContent = sortedFoldersGeneral.length > 0 || sortedPlaylists.length > 0 || sortedFavFoldersGeneral.length > 0;
      const mixIdsInFoldersGeneral = new Set([
        ...mixFolders.flatMap((f) => f.presetIds),
        ...userFolders.flatMap((f) => f.presetIds ?? []),
      ]);
      const sortedMixesGeneral = presets
        .filter((p) => !mixIdsInFoldersGeneral.has(p.id))
        .sort(cmpGeneral);

      return (
        <View style={{ gap: 15, marginTop: 30 }}>
          {/* ── Carpetas y playlists del usuario (siempre al tope en vista general) ── */}
          {hasUserContent && (
            <>
              {viewMode === "grid" ? (
                <View style={styles.gridWrap}>
                  {sortedPlaylists.map((pl) => (
                    <Pressable
                      key={pl.id}
                      style={({ pressed }) => [{ width: cellW, opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => openPlaylistPanel(pl.id)}
                    >
                      <View style={[styles.gridThumb, { width: cellW, height: cellW, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
                        {getDefaultPlaylistCover(pl.id) && !pl.coverUri && !pl.coverType ? (
                          <Image source={getDefaultPlaylistCover(pl.id)} style={{ width: cellW, height: cellW, borderRadius: 8 }} contentFit="cover" />
                        ) : pl.coverType === "geometrix" && pl.coverGeometryId ? (
                          <SacredGlyph id={pl.coverGeometryId as GeometryId} color={GOLD} size={Math.round(cellW * 1.28)} strokeWidth={1.2} opacity={1} />
                        ) : pl.coverType === "creation" && pl.coverCreationId ? (
                          <CreationCoverPreview creationId={pl.coverCreationId} size={cellW} />
                        ) : pl.coverUri ? (
                          <Image source={{ uri: pl.coverUri }} style={{ width: cellW, height: cellW, borderRadius: 8 }} contentFit="cover" />
                        ) : (
                          <Feather name="list" size={cellW * 0.32} color={GOLD} />
                        )}
                      </View>
                      <Text style={styles.gridTitle} numberOfLines={2}>{pl.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={{ gap: 15 }}>
                  {sortedFavFoldersGeneral.map((folder) => (
                    <FavFolderRow
                      key={folder.id}
                      folder={folder}
                      onPress={() => router.push(`/carpeta-favorito/${folder.id}` as never)}
                      onLongPress={() => { setFavActionsItemId(folder.id); setFavActionsItemKind("folder"); }}
                    />
                  ))}
                  {sortedFoldersGeneral.map((folder) => (
                    <FolderRow
                      key={folder.id}
                      folder={folder}
                      onPress={() => router.push(`/carpeta/${folder.id}` as never)}
                      onLongPress={() => { setActionsItemId(folder.id); setActionsItemKind("folder"); }}
                    />
                  ))}
                  {sortedPlaylists.map((pl) => (
                    <UserPlaylistRow
                      key={pl.id}
                      pl={pl}
                      onPress={() => openPlaylistPanel(pl.id)}
                      onLongPress={() => { setActionsItemId(pl.id); setActionsItemKind("playlist"); }}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── Mezclas del usuario (vista general) ── */}
          {sortedMixesGeneral.length > 0 && (
            viewMode === "grid" ? (
              <View style={styles.gridWrap}>
                {sortedMixesGeneral.map((mix) => {
                  const isPlayingMix = loadedPresetId === mix.id && mixerPlaying;
                  return (
                    <View key={mix.id} style={{ width: cellW }}>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                        onPress={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}
                      >
                        <View style={[styles.gridThumb, { width: cellW, height: cellW, overflow: "hidden" }]}>
                          <MixCover mix={mix} size={cellW} radius={8} />
                          {isPlayingMix && (
                            <View style={{ position: "absolute", bottom: 6, right: 6 }}>
                              <EqualizerBars color={GOLD} size="sm" />
                            </View>
                          )}
                        </View>
                      </Pressable>
                      <Pressable onPress={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}>
                        <Text style={styles.gridTitle} numberOfLines={2}>{mix.name}</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={{ gap: 14 }}>
                {sortedMixesGeneral.map((mix) => (
                  <MixRow
                    key={mix.id}
                    mix={mix}
                    isPlayingThis={loadedPresetId === mix.id && mixerPlaying}
                    onPress={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}
                    onLongPress={() => setMixMenuPreset(mix)}
                    onPressThumb={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}
                    onPressMenu={() => setMixMenuPreset(mix)}
                  />
                ))}
              </View>
            )
          )}

          {/* ── Resonadores seguidos ── */}
          {resonadores.map((r) => (
            <Pressable
              key={r.id}
              style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never)}
              onLongPress={() => unfollowResonador(r.id, r.name)}
              delayLongPress={600}
            >
              <Image source={r.photo} style={{ width: 62, height: 62, borderRadius: 31 }} resizeMode="cover" />
              <View style={styles.rowInfo}>
                <Text style={styles.addResonadorLabel} numberOfLines={1}>{r.name}</Text>
                <Text style={[styles.rowSub, { marginTop: 2 }]} numberOfLines={1}>{r.tags[0]}</Text>
              </View>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setNombreVisible(true)}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="list" size={25} color={iconPlaceholderColor} />
            </View>
            <Text style={styles.addResonadorLabel}>Crear una Playlist</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => openMixer()}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="sliders" size={25} color={iconPlaceholderColor} />
            </View>
            <Text style={styles.addResonadorLabel}>Crear una mezcla</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => openGeometrix()}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="hexagon" size={25} color={iconPlaceholderColor} />
            </View>
            <Text style={styles.addResonadorLabel}>Crear una geometría</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => { setAddResonadorQ(""); setAddResonadorVisible(true); }}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="plus" size={28} color={iconPlaceholderColor} />
            </View>
            <Text style={styles.addResonadorLabel}>Agregar Resonador</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setNombreCarpetaVisible(true)}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="folder" size={25} color={iconPlaceholderColor} />
            </View>
            <Text style={styles.addResonadorLabel}>Crear una carpeta</Text>
          </Pressable>
        </View>
      );
    }

    if (activeTab === "playlists") {
      const plIdsInFolders = new Set(userFolders.flatMap((f) => f.playlistIds ?? []));
      const sortedUserPl = userPlaylists
        .filter((pl) => !plIdsInFolders.has(pl.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // Aplicar ordenamiento según sort mode
      const applySort = (arr: typeof sortedUserPl) => {
        if (sort === "agregado") return [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (sort === "alfabetico") return [...arr].sort((a, b) => a.name.localeCompare(b.name, "es"));
        return arr; // "recientes" ya está ordenado
      };
      const displayPl = applySort(sortedUserPl);

      if (displayPl.length === 0 && userFolders.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Feather name="music" size={52} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Tus playlists aparecerán aquí</Text>
            <Text style={styles.emptySub}>Crea una playlist para organizar tus sesiones favoritas.</Text>
          </View>
        );
      }

      // Ancho de celda: 4 cols con 3 gaps entre ellas
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;

      if (viewMode === "grid") {
        return (
          <View style={[styles.gridWrap, { marginTop: 30 }]}>
            {displayPl.map((pl) => (
              <Pressable key={pl.id} style={({ pressed }) => [{ width: cellW, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => openPlaylistPanel(pl.id)}>
                <View style={[styles.gridThumb, { width: cellW, height: cellW, backgroundColor: "rgba(255,255,255,0.04)", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
                  {getDefaultPlaylistCover(pl.id) && !pl.coverUri && !pl.coverType ? (
                    <Image source={getDefaultPlaylistCover(pl.id)} style={{ width: cellW, height: cellW, borderRadius: 8 }} contentFit="cover" />
                  ) : pl.coverType === "geometrix" && pl.coverGeometryId ? (
                    <SacredGlyph id={pl.coverGeometryId as GeometryId} color={GOLD} size={Math.round(cellW * 1.28)} strokeWidth={1.2} opacity={1} />
                  ) : pl.coverType === "creation" && pl.coverCreationId ? (
                    <CreationCoverPreview creationId={pl.coverCreationId} size={cellW} />
                  ) : pl.coverUri ? (
                    <Image source={{ uri: pl.coverUri }} style={{ width: cellW, height: cellW, borderRadius: 8 }} contentFit="cover" />
                  ) : (
                    <Feather name="music" size={28} color={MUTED} />
                  )}
                </View>
                <Text style={styles.gridTitle} numberOfLines={2}>{pl.name}</Text>
              </Pressable>
            ))}
          </View>
        );
      }
      const sortedFolders = [...userFolders].sort((a, b) => {
        if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const pinnedFirstPl = [...displayPl].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      return (
        <View style={{ gap: 15, marginTop: 30 }}>
          {sortedFolders.map((folder) => (
            <FolderRow
              key={folder.id}
              folder={folder}
              onPress={() => router.push(`/carpeta/${folder.id}` as never)}
              onLongPress={() => { setActionsItemId(folder.id); setActionsItemKind("folder"); }}
            />
          ))}
          {pinnedFirstPl.map((pl) => (
            <UserPlaylistRow
              key={pl.id}
              pl={pl}
              onPress={() => openPlaylistPanel(pl.id)}
              onLongPress={() => { setActionsItemId(pl.id); setActionsItemKind("playlist"); }}
            />
          ))}
        </View>
      );
    }

    if (activeTab === "mezclas") {
      const sortedMixFolders = [...mixFolders].sort((a, b) => {
        if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const openMixFolderMenu = (folder: MixFolder) => setMixMenuFolder(folder);

      // Carpetas unificadas del usuario que contienen al menos una mezcla
      const userFoldersWithMixes = [...userFolders]
        .filter((f) => (f.presetIds ?? []).length > 0)
        .sort((a, b) => {
          if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      const createButtons = (
        <>
          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => setNombreCarpetaVisible(true)}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="folder" size={25} color={iconPlaceholderColor} />
            </View>
            <Text style={styles.addResonadorLabel}>Crear una carpeta</Text>
          </Pressable>
        </>
      );

      if (presets.length === 0 && sortedMixFolders.length === 0) {
        return (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="tune-variant" size={52} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Tus mezclas aparecerán aquí</Text>
            <Text style={styles.emptySub}>Guarda una mezcla desde el Mezclador para verla en tu biblioteca.</Text>
          </View>
        );
      }
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
      const mixIdsInFolders = new Set([
        ...mixFolders.flatMap((f) => f.presetIds),
        ...userFolders.flatMap((f) => f.presetIds ?? []),
      ]);
      const unfiledPresetsRaw = presets.filter((p) => !mixIdsInFolders.has(p.id));
      const unfiledPresets =
        sort === "alfabetico"
          ? [...unfiledPresetsRaw].sort((a, b) => a.name.localeCompare(b.name, "es"))
          : sort === "agregado"
            ? [...unfiledPresetsRaw].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            : unfiledPresetsRaw;
      const visibleMixes = unfiledPresets.slice(0, mixesLimit);
      const hasMixesMore = unfiledPresets.length > mixesLimit;
      if (viewMode === "grid") {
        return (
          <View style={{ gap: 15, marginTop: 30 }}>
            <View style={styles.gridWrap}>
              {visibleMixes.map((mix) => {
                const isPlaying = loadedPresetId === mix.id && mixerPlaying;
                return (
                  <View key={mix.id} style={{ width: cellW }}>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      onPress={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}
                    >
                      <View style={[styles.gridThumb, { width: cellW, height: cellW, overflow: "hidden" }]}>
                        <MixCover mix={mix} size={cellW} radius={8} />
                        {isPlaying && (
                          <View style={{ position: "absolute", bottom: 6, right: 6 }}>
                            <EqualizerBars color={GOLD} size="sm" />
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <Pressable onPress={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}>
                      <Text style={styles.gridTitle} numberOfLines={2}>{mix.name}</Text>
                    </Pressable>
                    <Text style={[styles.gridTitle, { color: MUTED, fontWeight: "400", marginTop: 1 }]} numberOfLines={1}>
                      {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
            {hasMixesMore && (
              <Pressable style={styles.loadMoreBtn} onPress={() => setMixesLimit((n) => n + 12)}>
                <Text style={styles.loadMoreText}>Cargar más</Text>
              </Pressable>
            )}
            {createButtons}
          </View>
        );
      }
      return (
        <View style={{ gap: 15, marginTop: 30 }}>
          <View style={{ gap: 14 }}>
            {userFoldersWithMixes.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                onPress={() => router.push(`/carpeta/${folder.id}` as never)}
                onLongPress={() => { setActionsItemId(folder.id); setActionsItemKind("folder"); }}
              />
            ))}
            {sortedMixFolders.map((folder) => (
              <MixFolderRow
                key={folder.id}
                folder={folder}
                onPress={() => router.push(`/carpeta-mezcla/${folder.id}` as never)}
                onLongPress={() => openMixFolderMenu(folder)}
              />
            ))}
            {visibleMixes.map((mix) => (
              <MixRow
                key={mix.id}
                mix={mix}
                isPlayingThis={loadedPresetId === mix.id && mixerPlaying}
                onPress={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}
                onLongPress={() => setMixMenuPreset(mix)}
                onPressThumb={() => { if (loadedPresetId !== mix.id) loadMix(mix); }}
                onPressMenu={() => setMixMenuPreset(mix)}
              />
            ))}
          </View>
          {hasMixesMore && (
            <Pressable style={styles.loadMoreBtn} onPress={() => setMixesLimit((n) => n + 12)}>
              <Text style={styles.loadMoreText}>Cargar más</Text>
            </Pressable>
          )}
          {createButtons}
        </View>
      );
    }

    if (activeTab === "geometrix") {
      if (geometrixCreations.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Feather name="hexagon" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Tus Geometrix aparecerán aquí</Text>
            <Text style={styles.emptySub}>Crea y guarda una geometría sagrada para verla aquí.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => openGeometrix()}>
              <GoldGradientFill />
              <Text style={styles.emptyBtnText}>Ir a Geometrix</Text>
            </Pressable>
          </View>
        );
      }
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
      const visibleGeo = geometrixCreations.slice(0, geoLimit);
      const hasGeoMore = geometrixCreations.length > geoLimit;
      if (viewMode === "grid") {
        return (
          <>
            <View style={styles.gridWrap}>
              {visibleGeo.map((c) => {
                const firstLayers = c.active.slice(0, 3);
                return (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [{ width: cellW, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => openGeometrix({ load: c.id })}
                  >
                    <View style={[styles.gridThumb, { width: cellW, height: cellW, overflow: "hidden" }]}>
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
                      {firstLayers.map((instId, idx) => {
                        const geoId = baseOf(instId);
                        const settings = c.settings[instId];
                        if (!settings) return null;
                        const layerSize = cellW * 0.45 + idx * 4;
                        return (
                          <View key={instId} style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
                            <SacredGlyph id={geoId} color={settings.color} gradient={gradientColors(settings.gradientId)} size={layerSize} strokeWidth={1 + settings.thickness * 1.5} />
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.gridTitle} numberOfLines={2}>{c.name}</Text>
                    <Text style={[styles.gridTitle, { color: MUTED, fontWeight: "400", marginTop: 1 }]} numberOfLines={1}>
                      {c.active.length} {c.active.length === 1 ? "capa" : "capas"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {hasGeoMore && (
              <Pressable style={styles.loadMoreBtn} onPress={() => setGeoLimit((n) => n + 8)}>
                <Text style={styles.loadMoreText}>Cargar más</Text>
              </Pressable>
            )}
          </>
        );
      }
      return (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 14, paddingHorizontal: H_PAD }}>
            {visibleGeo.map((c) => (
              <GeometrixRow
                key={c.id}
                creation={c}
                onPress={() => openGeometrix({ load: c.id })}
              />
            ))}
          </View>
          {hasGeoMore && (
            <Pressable style={styles.loadMoreBtn} onPress={() => setGeoLimit((n) => n + 8)}>
              <Text style={styles.loadMoreText}>Cargar más</Text>
            </Pressable>
          )}
        </>
      );
    }

    if (activeTab === "historial") {
      return <HistorialCalendar containerPadding={H_PAD} />;
    }

    if (activeTab === "favoritos") {
      const sessionsInAnyFavFolder = new Set(favFolders.flatMap((f) => f.sessionIds));
      const favSessions = favorites
        .filter((id) => !sessionsInAnyFavFolder.has(id))
        .map((id) => SESSIONS.find((s) => s.id === id))
        .filter((s): s is typeof SESSIONS[number] => !!s);
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;

      const createFolderBtn = (
        <Pressable
          style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1, paddingHorizontal: H_PAD }]}
          onPress={() => setNombreCarpetaFavVisible(true)}
        >
          <View style={styles.addResonadorIcon}>
            <Feather name="folder" size={25} color={iconPlaceholderColor} />
          </View>
          <Text style={styles.addResonadorLabel}>Crear una carpeta</Text>
        </Pressable>
      );

      if (favSessions.length === 0 && favFolders.length === 0) {
        return (
          <View style={{ gap: 15 }}>
            <View style={styles.emptyState}>
              <Feather name="heart" size={52} color={GOLD} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>Tus favoritos aparecerán aquí</Text>
              <Text style={styles.emptySub}>Toca el corazón en cualquier sesión para guardarla aquí.</Text>
            </View>
            {createFolderBtn}
          </View>
        );
      }

      const sortedFavFolders = [...favFolders].sort((a, b) => {
        if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const favSorted =
        sort === "alfabetico"
          ? [...favSessions].sort((a, b) => a.title.localeCompare(b.title, "es"))
          : favSessions;
      const pinnedFirstFav = [...favSorted].sort(
        (a, b) => (pinnedFavoriteIds.includes(b.id) ? 1 : 0) - (pinnedFavoriteIds.includes(a.id) ? 1 : 0)
      );

      if (viewMode === "grid") {
        return (
          <View style={{ gap: 15 }}>
            <View style={styles.gridWrap}>
              {pinnedFirstFav.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  width={cellW}
                  onLongPress={() => { setFavActionsItemId(s.id); setFavActionsItemKind("session"); }}
                />
              ))}
            </View>
            {createFolderBtn}
          </View>
        );
      }
      return (
        <View style={{ gap: 15 }}>
          <View style={{ gap: 9 }}>
            {pinnedFirstFav.map((s) => (
              <View key={s.id} style={{ paddingHorizontal: H_PAD }}>
                <SessionCard
                  session={s}
                  horizontal
                  thumbWidth={65}
                  thumbHeight={64}
                  thumbRadius={6}
                  showDuration={false}
                  pinned={pinnedFavoriteIds.includes(s.id)}
                  onLongPress={() => { setFavActionsItemId(s.id); setFavActionsItemKind("session"); }}
                />
              </View>
            ))}
            {sortedFavFolders.map((folder) => (
              <FavFolderRow
                key={folder.id}
                folder={folder}
                onPress={() => router.push(`/carpeta-favorito/${folder.id}` as never)}
                onLongPress={() => { setFavActionsItemId(folder.id); setFavActionsItemKind("folder"); }}
              />
            ))}
          </View>
          {createFolderBtn}
        </View>
      );
    }

    if (activeTab === "resonadores") {
      if (resonadores.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Feather name="users" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Sigue a un Resonador</Text>
            <Text style={styles.emptySub}>Los músicos, productores y voces guía que sigas aparecerán aquí.</Text>
          </View>
        );
      }
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
      if (viewMode === "grid") {
        return (
          <View style={styles.gridWrap}>
            {resonadores.map((r) => (
              <Pressable
                key={r.id}
                style={({ pressed }) => [{ width: cellW, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never)}
                onLongPress={() => unfollowResonador(r.id, r.name)}
                delayLongPress={600}
              >
                <Image source={r.photo} style={[styles.gridThumb, { width: cellW, height: cellW, borderRadius: cellW / 2 }]} resizeMode="cover" />
                <Text style={styles.gridTitle} numberOfLines={2}>{r.name}</Text>
                <Text style={[styles.gridTitle, { color: MUTED, fontWeight: "400", marginTop: 1 }]} numberOfLines={1}>{r.tags[0]}</Text>
              </Pressable>
            ))}
          </View>
        );
      }
      return (
        <View style={{ gap: 9 }}>
          {resonadores.map((r) => (
            <ResonadorRow
              key={r.id}
              name={r.name}
              photo={r.photo}
              tags={r.tags}
              onPress={() => router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never)}
              onLongPress={() => unfollowResonador(r.id, r.name)}
            />
          ))}
        </View>
      );
    }

    return null;
  };

  const Wrapper = embedded ? View : LinearGradient;
  const wrapperProps = embedded
    ? { style: styles.root }
    : {
        style: styles.root,
        colors: ["#340D1A", "#190913"] as const,
        start: { x: 0, y: 0 },
        end: { x: 0, y: 1 },
      };

  return (
    <Wrapper {...(wrapperProps as any)}>
      {!embedded && <SacredBackground variant="solid" />}

      {/* ── STICKY HEADER ────────────────────────────────────────────────── */}
      <View
        style={[styles.stickyHeader, {
          paddingTop: topPad - 34,
        }]}
      >
        {/* Fila 2: chips de tab (animados) */}
        {/* En Android/tablet el inset real es chico (piso 40): dar más aire
            entre el título y los tabs para igualar la altura del header de iPhone */}
        <View
          style={{ marginTop: -52 + (Platform.OS !== "web" && insets.top < 40 ? 31 : 0), marginBottom: -4 }}
        >
          <AnimatedChipRow
            tabs={LIB_TABS}
            activeTab={activeTab}
            onSelect={(id) => setActiveTab(id)}
            onClear={() => setActiveTab(null)}
            onSearch={onHeaderActions ? undefined : () => setSearchVisible(true)}
            onAdd={onHeaderActions ? undefined : () => setCreateVisible(true)}
          />
        </View>

        <LinearGradient
          colors={["rgba(0,0,0,0.28)", "rgba(0,0,0,0)"]}
          style={styles.stickyHeaderShadow}
          pointerEvents="none"
        />
      </View>

      {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: 23 }}
        showsVerticalScrollIndicator={false}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={16}
      >
        {(activeTab === null || activeTab === "playlists" || activeTab === "mezclas" || activeTab === "favoritos") &&
          !(activeTab === "playlists" && userPlaylists.length === 0 && userFolders.length === 0) &&
          !(activeTab === "mezclas" && presets.length === 0 && mixFolders.length === 0) &&
          !(activeTab === null && userPlaylists.length === 0 && userFolders.length === 0 && presets.length === 0 && mixFolders.length === 0) && (
          <View style={styles.sortTriggerRow}>
            <Pressable style={styles.sortBtn} hitSlop={8} onPress={() => setSortVisible(true)}>
              <Text style={styles.sortText}>{SORT_OPTIONS.find((o) => o.id === sort)?.label}</Text>
              <Feather name="chevron-down" size={15} color={MUTED} />
            </Pressable>
          </View>
        )}
        <AnimatedTabContent
          key={activeTab ?? "general"}
          animType={
            activeTab === null        ? "none"
            : activeTab === "playlists" ? "slide"
            : "fade"
          }
        >
          {renderContent()}
        </AnimatedTabContent>
      </ScrollView>

      {/* Overlays */}
      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} gradient={sceneTheme.gradient} accentColor="#f9f9f9" />
      <CreateSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreatePlaylist={() => setNombreVisible(true)}
        onCreateCarpeta={() => setNombreCarpetaVisible(true)}
        onGoMezclas={() => { openMixer(); router.navigate("/(tabs)/musica" as never); }}
        gradient={sceneTheme.gradient}
      />
      <NombrePlaylistModal
        visible={nombreVisible}
        onClose={() => setNombreVisible(false)}
        bgColor={sceneTheme.gradient[0]}
      />
      <NombreCarpetaModal
        visible={nombreCarpetaVisible}
        onClose={() => setNombreCarpetaVisible(false)}
        bgColor={sceneTheme.gradient[0]}
      />
      <NombreCarpetaMezclaModal visible={nombreCarpetaMezclaVisible} onClose={() => setNombreCarpetaMezclaVisible(false)} />
      <NombreCarpetaFavModal visible={nombreCarpetaFavVisible} onClose={() => setNombreCarpetaFavVisible(false)} />
      <PlaylistActionsSheet
        itemId={actionsItemId}
        itemKind={actionsItemKind}
        visible={actionsItemId !== null}
        onClose={() => { setActionsItemId(null); setActionsItemKind(null); }}
      />
      <FavoriteActionsSheet
        itemId={favActionsItemId}
        itemKind={favActionsItemKind}
        visible={favActionsItemId !== null}
        onClose={() => { setFavActionsItemId(null); setFavActionsItemKind(null); }}
      />
      <MixActionsSheet
        mix={mixMenuPreset}
        visible={mixMenuPreset !== null}
        onClose={() => setMixMenuPreset(null)}
        onEdit={(mix) => router.push(`/mi-mezcla/${mix.id}` as never)}
        onDuplicate={(mix) => { setMixMenuPreset(null); duplicatePreset(mix.id); }}
        onDelete={(mix) => deletePreset(mix.id)}
      />
      <MixActionsSheet
        mix={null}
        folder={mixMenuFolder}
        visible={mixMenuFolder !== null}
        onClose={() => setMixMenuFolder(null)}
        onDuplicate={() => {}}
        onDelete={() => {}}
      />
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />

      {/* ── Modal Agregar Resonador ── */}
      <Modal
        visible={addResonadorVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setAddResonadorVisible(false); setAddResonadorQ(""); }}
      >
        <View style={{ flex: 1 }}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.65)", bottom: addResKbHeight }]} pointerEvents="none" />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
          <LinearGradient
            colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
            style={styles.addResModalSheet}
          >
            <View style={styles.addResModalHeader}>
              <Text style={styles.addResModalTitle}>Buscar Resonador</Text>
              <Pressable hitSlop={10} onPress={() => { setAddResonadorVisible(false); setAddResonadorQ(""); }}>
                <Feather name="x" size={22} color={TEXT} />
              </Pressable>
            </View>
            <View style={styles.addResSearchRow}>
              <Feather name="search" size={16} color={MUTED} />
              <TextInput
                style={styles.addResSearchInput}
                placeholder="Artistas, guiadores..."
                placeholderTextColor={MUTED}
                value={addResonadorQ}
                onChangeText={setAddResonadorQ}
                autoFocus
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>
              {allResonadores
                .filter((r) => addResonadorQ.length === 0 || r.name.toLowerCase().includes(addResonadorQ.toLowerCase()))
                .map((r) => {
                  const isFollowed = followedIds.includes(r.id);
                  return (
                    <Pressable
                      key={r.id}
                      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => {
                        setAddResonadorVisible(false);
                        setAddResonadorQ("");
                        router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never);
                      }}
                    >
                      <Image source={r.photo} style={[styles.rowThumb, { borderRadius: 28 }]} resizeMode="cover" />
                      <View style={styles.rowInfo}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{r.name}</Text>
                        <Text style={styles.rowSub} numberOfLines={1}>{r.tags[0]}</Text>
                      </View>
                      <Pressable
                        hitSlop={12}
                        onPress={() => isFollowed ? saveFollowed(followedIds.filter((x) => x !== r.id)) : followResonador(r.id)}
                        style={[styles.addResonadorIcon, { width: 36, height: 36, borderRadius: 18, backgroundColor: isFollowed ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.025)" }]}
                      >
                        <Feather name={isFollowed ? "check" : "plus"} size={18} color={isFollowed ? GOLD : TEXT} />
                      </Pressable>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </LinearGradient>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Sticky header ───────────────────────────────────────────────────────────
  stickyHeader: {
    zIndex: 10,
  },
  stickyHeaderShadow: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -12,
    height: 12,
  },
  stickyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.025)", marginTop: 10, marginHorizontal: -15 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: H_PAD,
  },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarImg: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.025)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
  },
  headerTitle: { fontFamily: "Manrope", fontSize: 27, fontWeight: "700", color: TEXT, letterSpacing: 0.5 },
  headerSubtitle: { fontFamily: "Manrope", fontSize: 14, color: "#F4F4F4", marginTop: 2 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { width: 43, height: 43, alignItems: "center", justifyContent: "center" },

  animChipWrap: { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 20 },
  chipRowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    position: "absolute",
    right: H_PAD,
    top: 0,
    marginTop: 38,
    zIndex: 3,
    height: 48,
    paddingHorizontal: 10,
    borderRadius: 100,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipActionBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
  animCloseBtn: { position: "absolute", left: H_PAD - 10, top: 0, bottom: 0, justifyContent: "center", zIndex: 3 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 13, paddingTop: 5, paddingBottom: 5, paddingLeft: H_PAD, paddingRight: H_PAD },
  chipRowFiltered: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingVertical: 2,
  },
  chipCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    height: 29,
    paddingHorizontal: 11.5,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
  },
  chipTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  chipIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  chipSel: { borderWidth: 0 },
  chipText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "400", letterSpacing: 0.3, color: "#F4F4F4" },
  chipTextSel: { fontFamily: "Manrope", color: "#0D0A1E", fontWeight: "600" },
  chipTextIndigoSel: { color: "#F9F9F9" },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingBottom: 10,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortTriggerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: H_PAD,
    marginTop: -10,
    marginBottom: -8,
  },
  sortText: { fontFamily: "Manrope", fontSize: 13, color: MUTED, fontWeight: "500" },
  viewToggleBtn: { padding: 2 },


  // ── Scroll content ──────────────────────────────────────────────────────────
  scroll: { flex: 1, backgroundColor: "transparent" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.18)",
    marginHorizontal: 20,
    marginTop: -17,
    marginBottom: 8,
  },

  // ── Lista (fila) ────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: H_PAD,
    height: 62,
  },
  rowThumb: {
    width: 56, height: 56,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  rowInfo: { flex: 1, gap: 3 },
  rowTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: TEXT },
  rowSub:   { fontFamily: "Manrope", fontSize: 12, color: MUTED },
  mixMenuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Grilla ──────────────────────────────────────────────────────────────────
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  gridThumb: { borderRadius: 6, backgroundColor: "rgba(255,255,255,0.04)" },
  gridTitle: { fontFamily: "Manrope", fontSize: 12, color: TEXT, marginTop: 6, fontWeight: "500" },

  // ── SortSheet ────────────────────────────────────────────────────────────────
  sortSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0E1326",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  sortSheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.35)",
    marginBottom: 16,
  },
  sortSheetTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  sortSheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  sortSheetLabel: { fontFamily: "Manrope", color: MUTED, fontSize: 15, flex: 1 },
  sortSheetLabelActive: { fontFamily: "Manrope", color: TEXT, fontWeight: "600" },

  // ── Resonadores ─────────────────────────────────────────────────────────────
  resonadorAvatar: {
    width: 65, height: 65,
    borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.025)",
    overflow: "hidden",
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontFamily: "Manrope", fontSize: 11, color: MUTED },
  resonadorTag: {},
  resonadorTagText: { fontFamily: "Manrope", fontSize: 11, color: "rgba(255,255,255,0.85)" },

  // ── Estado vacío ────────────────────────────────────────────────────────────
  generalSectionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: H_PAD,
    marginTop: 20,
    marginBottom: 4,
  },
  recentSectionTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: H_PAD,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub:   { fontFamily: "Manrope", fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 24,
    overflow: "hidden",
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: { fontFamily: "Manrope", color: "#000", fontWeight: "700", fontSize: 14 },

  // Geometrix rows
  geoRow: {
    width: GEO_CELL,
  },
  geoThumb: {
    width: GEO_CELL,
    height: GEO_CELL,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.025)",
  },
  geoInfo: { marginTop: 7, alignItems: "center" },
  geoName: { fontFamily: "Manrope", color: TEXT, fontSize: 14, fontWeight: "600", textAlign: "center" },
  geoSub:  { fontFamily: "Manrope", color: MUTED, fontSize: 12, marginTop: 3, textAlign: "center" },

  // ── User playlist cover ──────────────────────────────────────────────────────
  userPlCover: {
    width: 65,
    height: 64,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Modal de nombre ──────────────────────────────────────────────────────────
  nameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  nameCard: {
    flex: 1,
    width: "100%",
    backgroundColor: "#190913",
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  nameCloseBtn: {
    position: "absolute",
    top: 18,
    right: 20,
  },
  nameCardTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 48,
    marginBottom: 36,
    lineHeight: 26,
  },
  nameInputWrap: {
    width: "85%",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingVertical: 10,
    marginBottom: 40,
    backgroundColor: "transparent",
  },
  nameInput: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    padding: 0,
  },
  nameCreateBtn: {
    overflow: "hidden",
    borderRadius: 30,
    paddingHorizontal: 52,
    paddingVertical: 15,
  },
  nameCreateBtnText: {
    fontFamily: "Manrope",
    color: "#1B060F",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ── Hoja de crear ────────────────────────────────────────────────────────────
  sheetBackdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 20 },
  sheetRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingVertical: 14,
  },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignItems: "center", justifyContent: "center",
  },
  sheetItemTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: TEXT, marginBottom: 2 },
  sheetItemSub:   { fontFamily: "Manrope", fontSize: 12, color: MUTED },

  // ── Cargar más ────────────────────────────────────────────────────────────────
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 32,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  loadMoreText: {
    fontFamily: "Manrope",
    color: GOLD,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── Agregar Resonador ────────────────────────────────────────────────────────
  addResonadorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: H_PAD,
    height: 62,
  },
  addResonadorIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.045)",
    alignItems: "center",
    justifyContent: "center",
  },
  addResonadorLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
  },
  addResModalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  addResModalSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 18,
    height: "92%",
  },
  addResModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  addResModalTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
  },
  addResSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderRadius: 12,
    marginHorizontal: H_PAD,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.20)",
  },
  addResSearchInput: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
});

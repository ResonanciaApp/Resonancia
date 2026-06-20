import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { GoldGradientFill } from "@/components/GoldGradient";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SacredGlyph } from "@/components/SacredGlyph";
import { SessionCard } from "@/components/SessionCard";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useMixer, type MixPreset } from "@/context/MixerContext";
import { useLoadMix } from "@/hooks/useLoadMix";
import { MixActionsSheet } from "@/components/MixActionsSheet";
import { MixCover } from "@/app/mi-mezcla/[id]";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { PLAYLISTS, type Playlist } from "@/data/playlists";
import { ARTISTS, type Artist } from "@/data/artists";
import { GUIDES, type Guide } from "@/data/guides";
import { SESSIONS, getSessionById } from "@/data/sessions";
import { useFoldersPlaylists, type Playlist as UserPlaylist, type Folder as UserFolder } from "@/context/FoldersPlaylistsContext";
import { baseOf, type GeometryId } from "@/data/geometries";
import { gradientColors, type GeometrixCreation } from "@/data/geometrix-creations";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import { PlaylistActionsSheet } from "@/components/PlaylistActionsSheet";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GOLD = "#D4AF37";
const NAVY = "#160108";
const DARK_BLUE = "#2E0510";
const TEXT = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.45)";

type LibTab = "playlists" | "mezclas" | "geometrix" | "favoritos" | "resonadores";
type SortMode = "recientes" | "agregado" | "alfabetico";
type ViewMode = "list" | "grid";

const LIB_TABS: { id: LibTab; label: string }[] = [
  { id: "playlists",   label: "Playlist" },
  { id: "mezclas",     label: "Mezclas" },
  { id: "favoritos",   label: "Favoritos" },
  { id: "resonadores", label: "Resonadores" },
];

// ── Fila de mezcla guardada ───────────────────────────────────────────────────
const MIX_THUMB = 56;
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
        <MixCover mix={mix} size={MIX_THUMB} radius={10} />
      </Pressable>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={600}
        style={({ pressed }) => [styles.rowInfo, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.rowTitle} numberOfLines={1}>{mix.name}</Text>
        {isPlayingThis ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Feather name="bar-chart-2" size={12} color={GOLD} />
            <Text style={[styles.rowSub, { color: GOLD }]}>Reproduciendo</Text>
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

// ── Chip de tab ───────────────────────────────────────────────────────────────
function LibChip({ label, sel, onPress }: { label: string; sel: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}>
      {sel && (
        <LinearGradient
          colors={["#D6AD5F", "#B47344"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
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
}: {
  tabs: { id: LibTab; label: string }[];
  activeTab: LibTab | null;
  onSelect: (id: LibTab) => void;
  onClear: () => void;
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
          <Feather name="x" size={15} color={MUTED} />
        </Pressable>
      </Animated.View>

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
                zIndex: 2,
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

// ── Fila de playlist (vista lista) ───────────────────────────────────────────
function PlaylistRow({ pl, onPress }: { pl: Playlist; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <Image source={pl.cover as number} style={styles.rowThumb} resizeMode="cover" />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{pl.title}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>Playlist · Casa del Cuenco</Text>
      </View>
    </Pressable>
  );
}

// ── Card de playlist (vista grilla) ──────────────────────────────────────────
function PlaylistGrid({ pl, onPress }: { pl: Playlist; onPress: () => void }) {
  const cardW = (width - H_PAD * 2 - 12) / 3;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ width: cardW, opacity: pressed ? 0.8 : 1 }]}>
      <Image source={pl.cover as number} style={[styles.gridThumb, { width: cardW, height: cardW }]} resizeMode="cover" />
      <Text style={styles.gridTitle} numberOfLines={2}>{pl.title}</Text>
    </Pressable>
  );
}

// ── Fila de carpeta del usuario ───────────────────────────────────────────────
function FolderRow({ folder, onPress, onLongPress }: { folder: UserFolder; onPress: () => void; onLongPress?: () => void }) {
  const count = (folder.playlistIds ?? []).length;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={600} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.userPlCover}>
        <Feather name="folder" size={22} color={folder.pinned ? GOLD : MUTED} />
      </View>
      <View style={styles.rowInfo}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>{folder.name}</Text>
          {folder.pinned && <Feather name="bookmark" size={12} color={GOLD} />}
        </View>
        <Text style={styles.rowSub} numberOfLines={1}>
          Carpeta · {count === 0 ? "Vacía" : `${count} playlist${count !== 1 ? "s" : ""}`}
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
        {pl.coverType === "geometrix" && pl.coverGeometryId ? (
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}>
            <SacredGlyph id={pl.coverGeometryId as GeometryId} color={GOLD} size={82} strokeWidth={1.2} opacity={1} />
          </View>
        ) : pl.coverType === "creation" && pl.coverCreationId ? (
          <CreationCoverPreview creationId={pl.coverCreationId} size={64} />
        ) : pl.coverUri ? (
          <Image source={{ uri: pl.coverUri }} style={styles.userPlCover} contentFit="cover" />
        ) : (
          <Feather name="music" size={20} color={MUTED} />
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
function ResonadorRow({ name, photo, tags, onPress }: {
  name: string;
  photo: import("react-native").ImageSourcePropType;
  tags: string[];
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
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
function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [kbReady, setKbReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setKbReady(false);
      setKbHeight(0);
      fadeAnim.setValue(0);
      return;
    }
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setKbReady(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKbReady(false);
      fadeAnim.setValue(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, [visible, fadeAnim]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} onShow={() => inputRef.current?.focus()}>
      <View style={[styles.searchModalRoot, { paddingBottom: kbHeight }]}>
        <View style={styles.searchOverlay}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={MUTED} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Buscar en tu biblioteca..."
              placeholderTextColor={MUTED}
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
            />
          </View>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
        {q.length === 0 && kbReady && (
          <Animated.View style={[styles.searchEmpty, { opacity: fadeAnim }]}>
            <Feather name="headphones" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.searchEmptyTitle}>Encuentra tus sesiones favoritas</Text>
            <Text style={styles.searchEmptySub}>Busca todo lo que guardaste, seguiste o creaste.</Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

// ── Modal de nombre de carpeta ────────────────────────────────────────────────
function NombreCarpetaModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}
    >
      <View style={styles.nameOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.nameCard}>
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
      </View>
    </Modal>
  );
}

// ── Modal de nombre de playlist ───────────────────────────────────────────────
function NombrePlaylistModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
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
    router.push(`/playlist/${pl.id}` as never);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 80)}
    >
      <View style={styles.nameOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.nameCard}>
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
      </View>
    </Modal>
  );
}

// ── Hoja de crear ────────────────────────────────────────────────────────────
function CreateSheet({ visible, onClose, onCreatePlaylist, onCreateCarpeta, onGoMezclas }: {
  visible: boolean;
  onClose: () => void;
  onCreatePlaylist: () => void;
  onCreateCarpeta: () => void;
  onGoMezclas: () => void;
}) {
  const ITEMS = [
    { icon: "list" as const,     title: "Crear una Playlist",     sub: "Crea una playlist con sesiones",        onPress: () => { onClose(); onCreatePlaylist(); } },
    { icon: "sliders" as const,  title: "Crea tus mezclas",       sub: "Crea una mezcla de sonidos relajantes", onPress: () => { onClose(); onGoMezclas(); } },
    { icon: "hexagon" as const,  title: "Crea tus Geometrix",     sub: "Crea y anima tus geometrías sagradas",  onPress: () => { onClose(); router.push("/geometrix" as never); } },
    { icon: "folder" as const,   title: "Carpetas",               sub: "Organiza tus Playlist",                 onPress: () => { onClose(); onCreateCarpeta(); } },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
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
      </View>
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
        <LinearGradient
          colors={["#2E0510", "#160108"]}
          style={StyleSheet.absoluteFill}
        />
        {firstLayers.map((instId, idx) => {
          const geoId = baseOf(instId);
          const settings = creation.settings[instId];
          if (!settings) return null;
          const layerSize = 36 + idx * 4;
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

      <Feather name="chevron-right" size={18} color={MUTED} />
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
              <Feather name={opt.icon as never} size={17} color={active ? GOLD : MUTED} />
              <Text style={[styles.sortSheetLabel, active && styles.sortSheetLabelActive]}>
                {opt.label}
              </Text>
              {active && <Feather name="check" size={17} color={GOLD} style={{ marginLeft: "auto" }} />}
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
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(tx, {
        toValue: 0,
        duration: 600,
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
export default function BibliotecaScreen() {
  const insets = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<LibTab | null>(null);
  const [sort, setSort] = useState<SortMode>("recientes");
  const [sortVisible, setSortVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [mixesLimit, setMixesLimit] = useState(12);
  const [geoLimit, setGeoLimit] = useState(8);
  const [recentLimit, setRecentLimit] = useState(3);
  const [addResonadorVisible, setAddResonadorVisible] = useState(false);
  const [addResonadorQ, setAddResonadorQ] = useState("");
  const [favLimit, setFavLimit] = useState(12);
  const [searchVisible, setSearchVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [nombreVisible, setNombreVisible] = useState(false);
  const [nombreCarpetaVisible, setNombreCarpetaVisible] = useState(false);
  const [actionsItemId, setActionsItemId] = useState<string | null>(null);
  const [actionsItemKind, setActionsItemKind] = useState<"playlist" | "folder" | null>(null);
  const { playlists: userPlaylists, folders: userFolders } = useFoldersPlaylists();

  const { creations: geometrixCreations, reload: reloadCreations } = useGeometrixCreations();
  useFocusEffect(useCallback(() => { reloadCreations(); }, [reloadCreations]));

  // Reset paginación al cambiar de tab
  useEffect(() => { setMixesLimit(12); setGeoLimit(8); setRecentLimit(3); setFavLimit(12); }, [activeTab]);

  const toggleView = () => setViewMode((v) => (v === "list" ? "grid" : "list"));

  const { presets, loadedPresetId, isPlaying: mixerPlaying, deletePreset, duplicatePreset } = useMixer();
  const loadMix = useLoadMix();
  const [mixMenuPreset, setMixMenuPreset] = useState<MixPreset | null>(null);

  const { history, favorites } = usePlayer();
  const { isPremium } = usePremium();

  const listenedRecently = useMemo(() => {
    const seen = new Set<string>();
    const result: import("@/data/sessions").Session[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s) result.push(s);
    }
    return result;
  }, [history]);

  // Resonadores = artistas featured + guías featured
  const resonadores = useMemo(() => {
    const artists = ARTISTS.filter((a) => a.featured !== false && a.id !== "resonancia").map((a) => ({
      id: a.id, name: a.name, photo: a.photo, tags: ["Músico"], kind: "artist" as const,
    }));
    const guides = GUIDES.filter((g) => g.featured !== false && g.id !== "casa-cuenco").map((g) => ({
      id: g.id, name: g.name, photo: g.photo, tags: ["Voz Guía"], kind: "guide" as const,
    }));
    return [...artists, ...guides];
  }, []);

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

      const sortedRecent = sortSessions(listenedRecently);
      const visibleRecent = sortedRecent.slice(0, recentLimit);
      const hasMoreRecent = sortedRecent.length > recentLimit;

      const sortedFoldersGeneral = [...userFolders].sort((a, b) => {
        if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const sortedPlaylists = [...userPlaylists].sort((a, b) => {
        if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const hasUserContent = sortedFoldersGeneral.length > 0 || sortedPlaylists.length > 0;

      return (
        <>
          {/* ── Carpetas y playlists del usuario (siempre al tope en vista general) ── */}
          {hasUserContent && (
            <>
              {viewMode === "grid" ? (
                <View style={styles.gridWrap}>
                  {sortedPlaylists.map((pl) => (
                    <Pressable
                      key={pl.id}
                      style={({ pressed }) => [{ width: cellW, opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => router.push(`/playlist/${pl.id}` as never)}
                    >
                      <View style={[styles.gridThumb, { width: cellW, height: cellW, backgroundColor: "rgba(212,175,55,0.08)", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
                        {pl.coverType === "geometrix" && pl.coverGeometryId ? (
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
                <View style={{ gap: 9 }}>
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
                      onPress={() => router.push(`/playlist/${pl.id}` as never)}
                      onLongPress={() => { setActionsItemId(pl.id); setActionsItemKind("playlist"); }}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── Escuchadas recientemente ── */}
          {listenedRecently.length > 0 && (
            <>
              {viewMode === "grid" ? (
                <View style={[styles.gridWrap, sortedPlaylists.length > 0 && { marginTop: 9 }]}>
                  {visibleRecent.map((s) => (
                    <SessionCard key={s.id} session={s} width={cellW} />
                  ))}
                </View>
              ) : (
                <View style={{ paddingHorizontal: H_PAD, gap: 9, marginTop: sortedPlaylists.length > 0 ? 9 : 0 }}>
                  {visibleRecent.map((s) => (
                    <SessionCard key={s.id} session={s} horizontal />
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── Resonadores ── */}
          <View style={{ gap: 9, marginTop: 9 }}>
            {resonadores.slice(0, 2).map((r) => (
              <ResonadorRow
                key={r.id}
                name={r.name}
                photo={r.photo}
                tags={r.tags}
                onPress={() => router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never)}
              />
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.addResonadorBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => { setAddResonadorQ(""); setAddResonadorVisible(true); }}
          >
            <View style={styles.addResonadorIcon}>
              <Feather name="plus" size={20} color={TEXT} />
            </View>
            <Text style={styles.addResonadorLabel}>Agregar Resonador</Text>
          </Pressable>
        </>
      );
    }

    if (activeTab === "playlists") {
      const sortedUserPl = [...userPlaylists].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      // Aplicar ordenamiento según sort mode
      const applySort = (arr: typeof sortedUserPl) => {
        if (sort === "agregado") return [...arr].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (sort === "alfabetico") return [...arr].sort((a, b) => a.name.localeCompare(b.name, "es"));
        return arr; // "recientes" ya está ordenado
      };
      const displayPl = applySort(sortedUserPl);

      // Ancho de celda: 4 cols con 3 gaps entre ellas
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;

      if (viewMode === "grid") {
        return (
          <View style={styles.gridWrap}>
            {displayPl.map((pl) => (
              <Pressable key={pl.id} style={({ pressed }) => [{ width: cellW, opacity: pressed ? 0.8 : 1 }]}
                onPress={() => router.push(`/playlist/${pl.id}` as never)}>
                <View style={[styles.gridThumb, { width: cellW, height: cellW, backgroundColor: "rgba(212,175,55,0.08)", alignItems: "center", justifyContent: "center", overflow: "hidden" }]}>
                  {pl.coverType === "geometrix" && pl.coverGeometryId ? (
                    <SacredGlyph id={pl.coverGeometryId as GeometryId} color={GOLD} size={Math.round(cellW * 1.28)} strokeWidth={1.2} opacity={1} />
                  ) : pl.coverType === "creation" && pl.coverCreationId ? (
                    <CreationCoverPreview creationId={pl.coverCreationId} size={cellW} />
                  ) : pl.coverUri ? (
                    <Image source={{ uri: pl.coverUri }} style={{ width: cellW, height: cellW, borderRadius: 8 }} contentFit="cover" />
                  ) : (
                    <Feather name="music" size={24} color={MUTED} />
                  )}
                </View>
                <Text style={styles.gridTitle} numberOfLines={2}>{pl.name}</Text>
              </Pressable>
            ))}
            {PLAYLISTS.map((pl) => (
              <PlaylistGrid key={pl.id} pl={pl} onPress={() => router.push(`/coleccion/${pl.id}` as never)} />
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
        <View style={{ gap: 9 }}>
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
              onPress={() => router.push(`/playlist/${pl.id}` as never)}
              onLongPress={() => { setActionsItemId(pl.id); setActionsItemKind("playlist"); }}
            />
          ))}
          {PLAYLISTS.map((pl) => (
            <PlaylistRow key={pl.id} pl={pl} onPress={() => router.push(`/coleccion/${pl.id}` as never)} />
          ))}
        </View>
      );
    }

    if (activeTab === "mezclas") {
      if (presets.length === 0) {
        return (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="tune-variant" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Tus mezclas aparecerán aquí</Text>
            <Text style={styles.emptySub}>Guarda una mezcla desde el Mezclador para verla en tu biblioteca.</Text>
          </View>
        );
      }
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
      const visibleMixes = presets.slice(0, mixesLimit);
      const hasMixesMore = presets.length > mixesLimit;
      if (viewMode === "grid") {
        return (
          <>
            <View style={styles.gridWrap}>
              {visibleMixes.map((mix) => {
                const isPlaying = loadedPresetId === mix.id && mixerPlaying;
                return (
                  <View key={mix.id} style={{ width: cellW }}>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
                      onPress={() => router.push(`/mi-mezcla/${mix.id}` as never)}
                    >
                      <View style={[styles.gridThumb, { width: cellW, height: cellW, overflow: "hidden" }]}>
                        <MixCover mix={mix} size={cellW} radius={8} />
                        {isPlaying && (
                          <View style={{ position: "absolute", bottom: 6, right: 6 }}>
                            <Feather name="bar-chart-2" size={14} color={GOLD} />
                          </View>
                        )}
                      </View>
                    </Pressable>
                    <Pressable onPress={() => loadMix(mix)}>
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
          </>
        );
      }
      return (
        <>
          <View style={{ gap: 9 }}>
            {visibleMixes.map((mix) => (
              <MixRow
                key={mix.id}
                mix={mix}
                isPlayingThis={loadedPresetId === mix.id && mixerPlaying}
                onPress={() => loadMix(mix)}
                onLongPress={() => setMixMenuPreset(mix)}
                onPressThumb={() => router.push(`/mi-mezcla/${mix.id}` as never)}
                onPressMenu={() => setMixMenuPreset(mix)}
              />
            ))}
          </View>
          {hasMixesMore && (
            <Pressable style={styles.loadMoreBtn} onPress={() => setMixesLimit((n) => n + 12)}>
              <Text style={styles.loadMoreText}>Cargar más</Text>
            </Pressable>
          )}
        </>
      );
    }

    if (activeTab === "geometrix") {
      if (geometrixCreations.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Feather name="hexagon" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Tus Geometrix aparecerán aquí</Text>
            <Text style={styles.emptySub}>Crea y guarda una geometría sagrada para verla aquí.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.navigate("/(tabs)/geometrix" as never)}>
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
                    onPress={() => router.navigate({ pathname: "/(tabs)/geometrix", params: { load: c.id } } as never)}
                  >
                    <View style={[styles.gridThumb, { width: cellW, height: cellW, overflow: "hidden" }]}>
                      <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
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
          <View style={{ gap: 9 }}>
            {visibleGeo.map((c) => (
              <GeometrixRow
                key={c.id}
                creation={c}
                onPress={() =>
                  router.navigate({
                    pathname: "/(tabs)/geometrix",
                    params: { load: c.id },
                  } as never)
                }
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

    if (activeTab === "favoritos") {
      const favSessions = SESSIONS.filter((s) => favorites.includes(s.id));
      const GRID_GAP = 10;
      const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
      if (favSessions.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Feather name="heart" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Tus favoritos aparecerán aquí</Text>
            <Text style={styles.emptySub}>Toca el corazón en cualquier sesión para guardarla aquí.</Text>
          </View>
        );
      }
      if (viewMode === "grid") {
        return (
          <View style={styles.gridWrap}>
            {favSessions.map((s) => (
              <SessionCard key={s.id} session={s} width={cellW} />
            ))}
          </View>
        );
      }
      return (
        <View style={{ paddingHorizontal: H_PAD, gap: 9 }}>
          {favSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              horizontal
            />
          ))}
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
            />
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.root, { backgroundColor: "#160108" }]}>
      <LinearGradient
        colors={["#2E0510", "#160108"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SacredBackground variant="solid" />

      {/* ── STICKY HEADER ────────────────────────────────────────────────── */}
      <View
        style={[styles.stickyHeader, {
          paddingTop: topPad + 2,
          backgroundColor: "#2E0510",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 9 },
          shadowOpacity: 0.22,
          shadowRadius: 7,
          elevation: 7,
        }]}
      >
        {/* Fila 1: título + iconos */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Tu Biblioteca</Text>
          </View>
          <View style={styles.headerIcons}>
            <Pressable hitSlop={10} onPress={() => setSearchVisible(true)} style={styles.headerIconBtn}>
              <Feather name="search" size={21} color={TEXT} />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => setCreateVisible(true)} style={styles.headerIconBtn}>
              <Feather name="plus" size={24} color={TEXT} />
            </Pressable>
          </View>
        </View>

        {/* Fila 2: chips de tab (animados) */}
        <AnimatedChipRow
          tabs={LIB_TABS}
          activeTab={activeTab}
          onSelect={(id) => setActiveTab(id)}
          onClear={() => setActiveTab(null)}
        />

      </View>

      {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedTabContent
          key={activeTab ?? "general"}
          animType={
            activeTab === null        ? "none"
            : activeTab === "playlists" ? "slide"
            : "fade"
          }
        >
          {/* Ordenar + toggle vista */}
          <View style={styles.controlRow}>
            <Pressable onPress={() => setSortVisible(true)} style={styles.sortBtn} hitSlop={8}>
              <Feather name="chevrons-down" size={14} color={MUTED} />
              <Text style={styles.sortText}>
                {sort === "recientes" ? "Recientes" : sort === "agregado" ? "Agregado recientemente" : "Alfabéticamente"}
              </Text>
            </Pressable>
            <Pressable onPress={toggleView} hitSlop={10} style={styles.viewToggleBtn}>
              {viewMode === "list"
                ? <MaterialCommunityIcons name="view-grid-outline" size={21} color={MUTED} />
                : <MaterialCommunityIcons name="view-list-outline" size={21} color={MUTED} />
              }
            </Pressable>
          </View>
          {renderContent()}
        </AnimatedTabContent>
      </ScrollView>

      {/* Overlays */}
      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <CreateSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreatePlaylist={() => setNombreVisible(true)}
        onCreateCarpeta={() => setNombreCarpetaVisible(true)}
        onGoMezclas={() => router.navigate("/(tabs)/musica" as never)}
      />
      <NombrePlaylistModal visible={nombreVisible} onClose={() => setNombreVisible(false)} />
      <NombreCarpetaModal visible={nombreCarpetaVisible} onClose={() => setNombreCarpetaVisible(false)} />
      <PlaylistActionsSheet
        itemId={actionsItemId}
        itemKind={actionsItemKind}
        visible={actionsItemId !== null}
        onClose={() => { setActionsItemId(null); setActionsItemKind(null); }}
      />
      <MixActionsSheet
        mix={mixMenuPreset}
        visible={mixMenuPreset !== null}
        onClose={() => setMixMenuPreset(null)}
        onEdit={(mix) => router.push(`/mi-mezcla/${mix.id}` as never)}
        onDuplicate={(mix) => { setMixMenuPreset(null); duplicatePreset(mix.id); }}
        onDelete={(mix) => deletePreset(mix.id)}
      />
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />

      {/* ── Modal Agregar Resonador ── */}
      <Modal
        visible={addResonadorVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { setAddResonadorVisible(false); setAddResonadorQ(""); }}
      >
        <View style={styles.addResModalBg}>
          <View style={styles.addResModalSheet}>
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
            <ScrollView showsVerticalScrollIndicator={false}>
              {resonadores
                .filter((r) => addResonadorQ.length === 0 || r.name.toLowerCase().includes(addResonadorQ.toLowerCase()))
                .map((r) => (
                  <ResonadorRow
                    key={r.id}
                    name={r.name}
                    photo={r.photo}
                    tags={r.tags}
                    onPress={() => {
                      setAddResonadorVisible(false);
                      setAddResonadorQ("");
                      router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never);
                    }}
                  />
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Sticky header ───────────────────────────────────────────────────────────
  stickyHeader: {
    zIndex: 10,
    paddingHorizontal: H_PAD,
  },
  stickyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(244,218,213,0.15)", marginTop: 10, marginHorizontal: -15 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 12,
  },
  avatarBtn: { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarImg: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
  },
  headerTitle: { fontSize: 27, fontWeight: "700", color: TEXT, letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: MUTED, marginTop: 3, fontWeight: "400" },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  animChipWrap: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  animCloseBtn: { position: "absolute", left: 0, top: 0, bottom: 0, justifyContent: "center", zIndex: 3 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2 },
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
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  chipText: { fontSize: 13, fontWeight: "500", color: TEXT },
  chipTextSel: { color: "#1B060F", fontWeight: "700" },

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
  sortText: { fontSize: 13, color: MUTED, fontWeight: "500" },
  viewToggleBtn: { padding: 2 },


  // ── Scroll content ──────────────────────────────────────────────────────────
  scroll: { flex: 1 },
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
    marginBottom: 7,
  },
  rowThumb: {
    width: 56, height: 56,
    borderRadius: 6,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  rowInfo: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: TEXT },
  rowSub:   { fontSize: 12, color: MUTED },
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
    gap: 10,
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  gridThumb: { borderRadius: 6, backgroundColor: "rgba(212,175,55,0.12)" },
  gridTitle: { fontSize: 12, color: TEXT, marginTop: 6, fontWeight: "500" },

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
  sortSheetLabel: { color: MUTED, fontSize: 15, flex: 1 },
  sortSheetLabelActive: { color: TEXT, fontWeight: "600" },

  // ── Resonadores ─────────────────────────────────────────────────────────────
  resonadorAvatar: {
    width: 65, height: 65,
    borderRadius: 33,
    backgroundColor: "rgba(212,175,55,0.12)",
    overflow: "hidden",
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontSize: 11, color: MUTED },
  resonadorTag: {},
  resonadorTagText: { fontSize: 11, color: "rgba(255,255,255,0.85)" },

  // ── Estado vacío ────────────────────────────────────────────────────────────
  generalSectionLabel: {
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
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: H_PAD,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub:   { fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 24,
    overflow: "hidden",
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },

  // Geometrix rows
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    height: 62,
    marginBottom: 7,
    gap: 14,
  },
  geoThumb: {
    width: 62,
    height: 62,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
  },
  geoInfo: { flex: 1 },
  geoName: { color: TEXT, fontSize: 14, fontWeight: "600" },
  geoSub:  { color: MUTED, fontSize: 12, marginTop: 3 },

  // ── User playlist cover ──────────────────────────────────────────────────────
  userPlCover: {
    width: 65,
    height: 64,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.15)",
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
    width: "100%",
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.15)",
  },
  nameCloseBtn: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  nameCardTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  nameInputWrap: {
    width: "100%",
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 28,
  },
  nameInput: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
  },
  nameCreateBtn: {
    overflow: "hidden",
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  nameCreateBtnText: {
    color: "#1B060F",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ── Búsqueda overlay ──────────────────────────────────────────────────────────
  searchModalRoot: {
    flex: 1,
    backgroundColor: "#2E0510",
  },
  searchOverlay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E0510",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    gap: 10,
  },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { color: GOLD, fontSize: 14, fontWeight: "600" },
  searchEmpty: {
    flex: 1,
    backgroundColor: "#160108",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  searchEmptyTitle: { fontSize: 18, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 10 },
  searchEmptySub:   { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },

  // ── Hoja de crear ────────────────────────────────────────────────────────────
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: NAVY,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: "rgba(74,12,12,0.35)",
    alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 20 },
  sheetRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  sheetItemTitle: { fontSize: 15, fontWeight: "600", color: TEXT, marginBottom: 2 },
  sheetItemSub:   { fontSize: 12, color: MUTED },

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
    backgroundColor: "rgba(212,175,55,0.07)",
  },
  loadMoreText: {
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
    paddingVertical: 10,
  },
  addResonadorIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.22)",
  },
  addResonadorLabel: {
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
    backgroundColor: "#2E0510",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 18,
    paddingBottom: 48,
    maxHeight: "75%",
  },
  addResModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  addResModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT,
  },
  addResSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    marginHorizontal: H_PAD,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.20)",
  },
  addResSearchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
  },
});

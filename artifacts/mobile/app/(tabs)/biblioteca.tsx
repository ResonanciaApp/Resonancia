import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useCallback, useMemo } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
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
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer, type MixPreset } from "@/context/MixerContext";
import { getSoundImage } from "@/config/sound-images";
import { useLoadMix } from "@/hooks/useLoadMix";
import { PLAYLISTS, type Playlist } from "@/data/playlists";
import { ARTISTS, type Artist } from "@/data/artists";
import { GUIDES, type Guide } from "@/data/guides";
import { SESSIONS, getSessionById } from "@/data/sessions";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GOLD = "#BE9650";
const NAVY = "#0B0F14";
const DARK_BLUE = "#1A3A6E";
const TEXT = "#EDE1D3";
const MUTED = "#7A8FA8";

type LibTab = "playlists" | "mezclas" | "geometrix" | "resonadores";
type SortMode = "recientes" | "agregado";
type ViewMode = "list" | "grid";

const LIB_TABS: { id: LibTab; label: string }[] = [
  { id: "playlists",   label: "Playlist" },
  { id: "mezclas",     label: "Mezclas" },
  { id: "geometrix",   label: "Geometrix" },
  { id: "resonadores", label: "Resonadores" },
];

// ── Stack de imágenes de sonidos ─────────────────────────────────────────────
const THUMB = 40;
const SHIFT = 24;
const MAX_STACK = 3;
function SoundStack({ sounds }: { sounds: { id: string }[] }) {
  const visible = sounds.slice(0, MAX_STACK);
  const stackW = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  return (
    <View style={{ width: stackW, height: THUMB, position: "relative" }}>
      {visible.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View
            key={s.id}
            style={[
              styles.stackThumb,
              { left: i * SHIFT, zIndex: i, backgroundColor: "rgba(190,150,80,0.12)" },
            ]}
          >
            {img ? (
              <Image source={img as number} style={styles.stackThumbImg} contentFit="cover" />
            ) : (
              <Feather name="music" size={14} color={GOLD} />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ── Fila de mezcla guardada ───────────────────────────────────────────────────
function MixRow({ mix, isPlayingThis, onPress }: { mix: MixPreset; isPlayingThis: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <SoundStack sounds={mix.sounds} />
      <View style={styles.rowInfo}>
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
      </View>
      {isPlayingThis && <Feather name="bar-chart-2" size={18} color={GOLD} />}
    </Pressable>
  );
}

// ── Chip de tab ───────────────────────────────────────────────────────────────
function LibChip({ label, sel, onPress }: { label: string; sel: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, sel && styles.chipSel, { opacity: pressed ? 0.7 : 1 }]}>
      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
    </Pressable>
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
      <Feather name="more-horizontal" size={18} color={MUTED} />
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

// ── Resonador fila ───────────────────────────────────────────────────────────
function ResonadorRow({ name, photo, role, onPress }: {
  name: string;
  photo: import("react-native").ImageSourcePropType;
  role: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.8 : 1 }]}>
      <Image source={photo} style={styles.resonadorAvatar} resizeMode="cover" />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>{name}</Text>
        <View style={styles.verifiedRow}>
          <Feather name="check-circle" size={11} color={GOLD} />
          <Text style={styles.verifiedText}>Verificado por Resonancia · {role}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Modal de Buscar ───────────────────────────────────────────────────────────
function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<TextInput>(null);
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} onShow={() => inputRef.current?.focus()}>
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
      {q.length === 0 && (
        <View style={styles.searchEmpty}>
          <Feather name="headphones" size={48} color={GOLD} style={{ marginBottom: 16 }} />
          <Text style={styles.searchEmptyTitle}>Encuentra tus sesiones favoritas</Text>
          <Text style={styles.searchEmptySub}>Busca todo lo que guardaste, seguiste o creaste.</Text>
        </View>
      )}
    </Modal>
  );
}

// ── Modal de Crear (+) ────────────────────────────────────────────────────────
function CreateSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const ITEMS = [
    { icon: "list" as const,     title: "Crear una Playlist",     sub: "Crea una playlist con sesiones" },
    { icon: "sliders" as const,  title: "Crea tus mezclas",       sub: "Crea una mezcla de sonidos relajantes" },
    { icon: "hexagon" as const,  title: "Crea tus Geometrix",     sub: "Crea y anima tus geometrías sagradas" },
    { icon: "folder" as const,   title: "Carpetas",               sub: "Organiza tus Playlist" },
  ];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>¿Qué quieres crear?</Text>
        {ITEMS.map((it) => (
          <Pressable key={it.title} style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.7 : 1 }]} onPress={onClose}>
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

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function BibliotecaScreen() {
  const insets = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<LibTab>("playlists");
  const [sort, setSort] = useState<SortMode>("recientes");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchVisible, setSearchVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);

  const toggleSort = () => setSort((s) => (s === "recientes" ? "agregado" : "recientes"));
  const toggleView = () => setViewMode((v) => (v === "list" ? "grid" : "list"));

  const { presets, loadedPresetId, isPlaying: mixerPlaying } = useMixer();
  const loadMix = useLoadMix();

  // Resonadores = artistas featured + guías featured
  const resonadores = useMemo(() => {
    const artists = ARTISTS.filter((a) => a.featured !== false && a.id !== "resonancia").map((a) => ({
      id: a.id, name: a.name, photo: a.photo, role: "Músico · Productor", kind: "artist" as const,
    }));
    const guides = GUIDES.filter((g) => g.featured !== false && g.id !== "casa-cuenco").map((g) => ({
      id: g.id, name: g.name, photo: g.photo, role: "Voz Guía", kind: "guide" as const,
    }));
    return [...artists, ...guides];
  }, []);

  const renderContent = () => {
    if (activeTab === "playlists") {
      if (viewMode === "grid") {
        return (
          <View style={styles.gridWrap}>
            {PLAYLISTS.map((pl) => (
              <PlaylistGrid key={pl.id} pl={pl} onPress={() => router.push(`/coleccion/${pl.id}` as never)} />
            ))}
          </View>
        );
      }
      return PLAYLISTS.map((pl) => (
        <PlaylistRow key={pl.id} pl={pl} onPress={() => router.push(`/coleccion/${pl.id}` as never)} />
      ));
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
      return (
        <>
          {presets.map((mix) => (
            <MixRow
              key={mix.id}
              mix={mix}
              isPlayingThis={loadedPresetId === mix.id && mixerPlaying}
              onPress={() => loadMix(mix)}
            />
          ))}
        </>
      );
    }

    if (activeTab === "geometrix") {
      return (
        <View style={styles.emptyState}>
          <Feather name="hexagon" size={48} color={GOLD} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Tus Geometrix aparecerán aquí</Text>
          <Text style={styles.emptySub}>Crea y guarda una geometría sagrada para verla aquí.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push("/geometrix" as never)}>
            <Text style={styles.emptyBtnText}>Ir a Geometrix</Text>
          </Pressable>
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
      return resonadores.map((r) => (
        <ResonadorRow
          key={r.id}
          name={r.name}
          photo={r.photo}
          role={r.role}
          onPress={() => router.push((r.kind === "artist" ? `/artista/${r.id}` : `/guiador/${r.id}`) as never)}
        />
      ));
    }

    return null;
  };

  return (
    <View style={styles.root}>
      <SacredBackground variant="solid" />

      {/* ── STICKY HEADER ────────────────────────────────────────────────── */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 2 }]}>
        {/* Fila 1: avatar + título + iconos */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => openDrawer()} hitSlop={8} style={styles.avatarBtn}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Feather name="user" size={15} color={MUTED} />
              </View>
            )}
          </Pressable>
          <Text style={styles.headerTitle}>Biblioteca</Text>
          <View style={styles.headerIcons}>
            <Pressable hitSlop={10} onPress={() => setSearchVisible(true)} style={styles.headerIconBtn}>
              <Feather name="search" size={21} color={TEXT} />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => setCreateVisible(true)} style={styles.headerIconBtn}>
              <Feather name="plus" size={24} color={TEXT} />
            </Pressable>
          </View>
        </View>

        {/* Fila 2: chips de tab */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipRowContent}
        >
          {LIB_TABS.map((t) => (
            <LibChip key={t.id} label={t.label} sel={activeTab === t.id} onPress={() => setActiveTab(t.id)} />
          ))}
        </ScrollView>

        {/* Fila 3: ordenar + toggle vista */}
        <View style={styles.controlRow}>
          <Pressable onPress={toggleSort} style={styles.sortBtn} hitSlop={8}>
            <Feather name={sort === "recientes" ? "chevron-down" : "chevron-up"} size={14} color={MUTED} />
            <Text style={styles.sortText}>{sort === "recientes" ? "Recientes" : "Agregado recientemente"}</Text>
          </Pressable>
          <Pressable onPress={toggleView} hitSlop={10} style={styles.viewToggleBtn}>
            {viewMode === "list"
              ? <MaterialCommunityIcons name="view-grid-outline" size={21} color={MUTED} />
              : <MaterialCommunityIcons name="view-list-outline" size={21} color={MUTED} />
            }
          </Pressable>
        </View>

        {/* Sombra inferior del sticky header */}
        <View style={styles.headerShadow} />
      </View>

      {/* ── CONTENIDO ────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* Overlays */}
      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <CreateSheet  visible={createVisible}  onClose={() => setCreateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#080B1A" },

  // ── Sticky header ───────────────────────────────────────────────────────────
  stickyHeader: {
    backgroundColor: "#080B1A",
    zIndex: 10,
    paddingHorizontal: H_PAD,
  },
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
    backgroundColor: "rgba(190,150,80,0.12)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(190,150,80,0.25)",
  },
  headerTitle: { flex: 1, fontSize: 27, fontWeight: "700", color: TEXT, letterSpacing: 0.5 },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  chipRow: { flexGrow: 0, marginBottom: 10 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  chipSel: { backgroundColor: "#FFFFFF" },
  chipText: { fontSize: 13, fontWeight: "500", color: TEXT },
  chipTextSel: { color: DARK_BLUE, fontWeight: "700" },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 13, color: MUTED, fontWeight: "500" },
  viewToggleBtn: { padding: 2 },

  headerShadow: {
    height: 10,
    marginHorizontal: -H_PAD,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: "#080B1A",
  },

  // ── Scroll content ──────────────────────────────────────────────────────────
  scroll: { flex: 1 },

  // ── Lista (fila) ────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
  },
  rowThumb: {
    width: 56, height: 56,
    borderRadius: 6,
    backgroundColor: "rgba(190,150,80,0.12)",
  },
  rowInfo: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: TEXT },
  rowSub:   { fontSize: 12, color: MUTED },
  stackThumb: {
    position: "absolute",
    width: THUMB, height: THUMB,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#080B1A",
  },
  stackThumbImg: { width: "100%", height: "100%" },

  // ── Grilla ──────────────────────────────────────────────────────────────────
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  gridThumb: { borderRadius: 6, backgroundColor: "rgba(190,150,80,0.12)" },
  gridTitle: { fontSize: 12, color: TEXT, marginTop: 6, fontWeight: "500" },

  // ── Resonadores ─────────────────────────────────────────────────────────────
  resonadorAvatar: {
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(190,150,80,0.12)",
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { fontSize: 11, color: MUTED },

  // ── Estado vacío ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: H_PAD,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub:   { fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: GOLD,
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 999,
  },
  emptyBtnText: { color: "#000", fontWeight: "700", fontSize: 14 },

  // ── Búsqueda overlay ────────────────────────────────────────────────────────
  searchOverlay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#080B1A",
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
    backgroundColor: "#080B1A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  searchEmptyTitle: { fontSize: 18, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 10 },
  searchEmptySub:   { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },

  // ── Hoja de crear ────────────────────────────────────────────────────────────
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#12182E",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontSize: 17, fontWeight: "700", color: TEXT, marginBottom: 20 },
  sheetRow: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  sheetIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(190,150,80,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  sheetItemTitle: { fontSize: 15, fontWeight: "600", color: TEXT, marginBottom: 2 },
  sheetItemSub:   { fontSize: 12, color: MUTED },
});

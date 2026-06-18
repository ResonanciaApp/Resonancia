import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useState, useMemo, useRef, useEffect } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { ARTISTS, type Artist } from "@/data/artists";
import { EXPANSORES, type Expansor } from "@/data/expansores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 18;
const CARD_GAP = 10;
const BG: [string, string] = ["#2E0510", "#160108"];
const MUTED = "rgba(242,231,228,0.45)";
const CHIP_ANIM_DURATION = 600;
const CLOSE_SLOT = 38;

// ── Filtros ───────────────────────────────────────────────────────────────────
type FilterId = string;
const ARTISTA_FILTER_TABS: { id: FilterId; label: string }[] = [
  { id: "Ambient", label: "Ambient" },
  { id: "Enteógena", label: "Enteógena" },
  { id: "Meditación", label: "Meditación" },
  { id: "Cuencos", label: "Cuencos" },
];
const EXPANSOR_FILTER_TABS: { id: FilterId; label: string }[] = [
  { id: "Cuencos Tibetanos", label: "Cuencos Tibetanos" },
  { id: "Cuencos de Cristal", label: "Cuencos de Cristal" },
  { id: "Gong", label: "Gong" },
  { id: "Campanas", label: "Campanas" },
];

// ── Chip individual (igual a LibChip de Biblioteca) ───────────────────────────
function ResoChip({ label, sel, onPress }: { label: string; sel: boolean; onPress: () => void }) {
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

// ── Fila de chips animada (mismo patrón que Biblioteca) ───────────────────────
function AnimatedFilterRow({
  tabs,
  activeFilter,
  onSelect,
  onClear,
}: {
  tabs: { id: FilterId; label: string }[];
  activeFilter: FilterId | null;
  onSelect: (id: FilterId) => void;
  onClear: () => void;
}) {
  const progress = useRef(new Animated.Value(activeFilter ? 1 : 0)).current;
  const offsetsRef = useRef<Record<string, number>>({});
  const scrollXRef = useRef(0);
  const [displayTab, setDisplayTab] = useState<FilterId | null>(activeFilter);
  const [colorTab, setColorTab] = useState<FilterId | null>(activeFilter);
  const [targetTranslate, setTargetTranslate] = useState(0);

  const filtered = displayTab !== null;

  const animate = (toValue: number, onDone?: () => void) => {
    Animated.timing(progress, {
      toValue,
      duration: CHIP_ANIM_DURATION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onDone?.(); });
  };

  const handleSelect = (id: FilterId) => {
    const off = offsetsRef.current[id] ?? 0;
    const visualLeft = off - scrollXRef.current;
    setTargetTranslate(CLOSE_SLOT - visualLeft);
    setDisplayTab(id);
    setColorTab(id);
    onSelect(id);
    animate(1);
  };

  const handleClear = () => {
    setColorTab(null);
    onClear();
    animate(0, () => setDisplayTab(null));
  };

  useEffect(() => () => progress.stopAnimation(), [progress]);

  return (
    <View style={styles.animChipWrap}>
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
        onScroll={(e) => { scrollXRef.current = e.nativeEvent.contentOffset.x; }}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {tabs.map((t) => {
          const isSelected = displayTab === t.id;
          const chipStyle = isSelected
            ? {
                opacity: 1 as number,
                zIndex: 2,
                transform: [{
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, targetTranslate],
                  }),
                }],
              }
            : {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              };

          return (
            <Animated.View
              key={t.id}
              pointerEvents={filtered && !isSelected ? "none" : "auto"}
              onLayout={(e) => { offsetsRef.current[t.id] = e.nativeEvent.layout.x; }}
              style={chipStyle}
            >
              <ResoChip
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

// ── Card de Resonador (artista o expansor) ────────────────────────────────────
type CardItem =
  | { kind: "artista"; data: Artist }
  | { kind: "expansor"; data: Expansor };

const ResonadorCard = memo(function ResonadorCard({
  item,
  cardW,
}: {
  item: CardItem;
  cardW: number;
}) {
  const isArtista = item.kind === "artista";
  const d = item.data;
  const certified = d.certified;
  const subtitle = isArtista
    ? (d as Artist).genre
    : (d as Expansor).specialty[0] ?? "";
  const location = isArtista
    ? (d as Artist).country
    : `${(d as Expansor).city}`;

  const photoSize = cardW - 16;

  function handlePress() {
    if (isArtista) router.push(`/artista/${d.id}` as never);
    else router.push(`/expansor/${d.id}` as never);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { width: cardW, opacity: pressed ? 0.82 : 1 }]}
    >
      {/* Foto circular */}
      <View style={styles.photoOuter}>
        <View
          style={[
            styles.photoWrap,
            {
              width: photoSize,
              height: photoSize,
              borderRadius: photoSize / 2,
            },
          ]}
        >
          <Image
            source={d.photo}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        </View>
      </View>

      {/* Nombre */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={2}>{d.name}</Text>
      </View>
    </Pressable>
  );
});

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ResonadoresScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { width: screenWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<"artistas" | "expansores">("artistas");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [query, setQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  function toggleSearch() {
    if (searchVisible) { setQuery(""); }
    setSearchVisible((v) => !v);
  }

  const filterTabs = activeTab === "artistas" ? ARTISTA_FILTER_TABS : EXPANSOR_FILTER_TABS;
  const activeFilterKey = activeFilter === "Todos" ? null : activeFilter;

  // Reset filter when switching tab
  function switchTab(t: "artistas" | "expansores") {
    setActiveTab(t);
    setActiveFilter("Todos");
    setQuery("");
  }

  const items: CardItem[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (activeTab === "artistas") {
      return ARTISTS.filter((a) => a.id !== "resonancia")
        .filter((a) => {
          if (activeFilter !== "Todos") {
            if (!a.genre.toLowerCase().includes(activeFilter.toLowerCase())) return false;
          }
          if (q) return a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q);
          return true;
        })
        .map((a) => ({ kind: "artista" as const, data: a }));
    } else {
      return EXPANSORES.filter((e) => {
        if (activeFilter !== "Todos") {
          if (!e.specialty.some((s) => s.toLowerCase().includes(activeFilter.toLowerCase()))) return false;
        }
        if (q) {
          return (
            e.name.toLowerCase().includes(q) ||
            e.city.toLowerCase().includes(q) ||
            e.specialty.some((s) => s.toLowerCase().includes(q))
          );
        }
        return true;
      }).map((e) => ({ kind: "expansor" as const, data: e }));
    }
  }, [activeTab, activeFilter, query]);

  // Card width: 3 columnas exactas llenando el ancho real del dispositivo
  const numCols = 3;
  const SCREEN_PAD = H_PAD * 2;
  const cardW = Math.floor((screenWidth - SCREEN_PAD - CARD_GAP * 2) / numCols);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={BG} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        {/* Título + icono búsqueda */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Equipo</Text>
          </View>
          <Pressable onPress={toggleSearch} hitSlop={10} style={styles.searchIconBtn}>
            <Feather
              name={searchVisible ? "x" : "search"}
              size={20}
              color={searchVisible ? "#D4AF37" : "rgba(212,175,55,0.65)"}
            />
          </Pressable>
        </View>

        {/* Buscador inline (visible al tocar el icono) */}
        {searchVisible && (
          <View style={styles.searchWrap}>
            <Feather name="search" size={14} color="rgba(212,175,55,0.55)" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={activeTab === "artistas" ? "Buscar artista..." : "Buscar por nombre o ciudad..."}
              placeholderTextColor="rgba(244,218,213,0.30)"
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={14} color="rgba(244,218,213,0.45)" />
              </Pressable>
            )}
          </View>
        )}

        {/* Tab switcher — ancho completo */}
        <View style={styles.tabPill}>
          {(["artistas", "expansores"] as const).map((t) => {
            const isActive = activeTab === t;
            return (
              <Pressable
                key={t}
                onPress={() => switchTab(t)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                {isActive && (
                  <LinearGradient
                    colors={["#D6AD5F", "#B47344"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                  {t === "artistas" ? "Resonadores" : "Expansores"}
                </Text>
                <Text style={[styles.tabBtnSub, isActive && styles.tabBtnSubActive]}>
                  {t === "artistas" ? "La esencia de resonancia" : "Los que expanden la vibración"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Filtros chip animados (mismo sistema que Biblioteca) ── */}
      <View style={styles.filtersScroll}>
        <AnimatedFilterRow
          key={activeTab}
          tabs={filterTabs}
          activeFilter={activeFilterKey}
          onSelect={(id) => setActiveFilter(id)}
          onClear={() => setActiveFilter("Todos")}
        />
      </View>

      {/* ── Grid ── */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.data.id}
        numColumns={numCols}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={36} color="rgba(244,218,213,0.20)" />
            <Text style={styles.emptyText}>Sin resultados</Text>
          </View>
        }
        renderItem={({ item }) => <ResonadorCard item={item} cardW={cardW} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F4DAD5",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(244,218,213,0.45)",
    marginTop: 2,
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74,12,12,0.30)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: "#F4DAD5",
    fontSize: 13,
    paddingVertical: 0,
  },

  // Tab pill — ancho completo
  tabPill: {
    flexDirection: "row",
    backgroundColor: "rgba(74,12,12,0.35)",
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    overflow: "hidden",
  },
  tabBtnActive: {},
  tabBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(244,218,213,0.45)",
  },
  tabBtnTextActive: {
    color: "#1B060F",
    fontWeight: "700",
  },
  tabBtnSub: {
    fontSize: 10,
    color: "rgba(244,218,213,0.30)",
    marginTop: 2,
    textAlign: "center",
  },
  tabBtnSubActive: {
    color: "rgba(27,6,15,0.65)",
  },

  // Filters — igual que Biblioteca
  filtersScroll: { paddingHorizontal: H_PAD, paddingBottom: 6 },
  animChipWrap: { flexDirection: "row", alignItems: "center" },
  animCloseBtn: { position: "absolute", left: 0, top: 0, bottom: 0, justifyContent: "center", zIndex: 3 },
  chipCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  chipText: { fontSize: 13, fontWeight: "500", color: "rgba(242,231,228,0.45)" },
  chipTextSel: { color: "#1B060F", fontWeight: "700" },

  // Grid
  grid: { paddingHorizontal: H_PAD, paddingTop: 10 },
  row: { gap: CARD_GAP, marginBottom: 16 },

  // Card
  card: {
    alignItems: "center",
    paddingVertical: 8,
  },
  photoOuter: {
    alignItems: "center",
    marginBottom: 10,
  },
  photoWrap: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.30)",
    position: "relative",
  },
  certBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#D4AF37",
    borderRadius: 99,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  certStar: { fontSize: 9, color: "#1B060F", fontWeight: "800" },
  cardInfo: { alignItems: "center", paddingHorizontal: 6 },
  cardName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F4DAD5",
    marginBottom: 3,
    textAlign: "center",
  },
  cardSub: {
    fontSize: 10,
    color: "rgba(212,175,55,0.75)",
    marginBottom: 4,
    textAlign: "center",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardLocation: { fontSize: 10, color: "rgba(244,218,213,0.40)", textAlign: "center" },

  // Empty
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: "rgba(244,218,213,0.30)" },
});

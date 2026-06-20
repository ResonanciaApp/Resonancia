import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useState, useMemo, useRef, useEffect } from "react";
import {
  Alert,
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

import { GhostPill } from "@/components/GhostPill";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { EXPANSORES, REGIONS_BY_COUNTRY, COUNTRY_FLAGS, type Expansor } from "@/data/expansores";
import { RESONADORES, type Resonador } from "@/data/resonadores";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/context/UserProfileContext";

const H_PAD = 18;
const CARD_GAP = 10;
const BG: [string, string] = ["#2E0510", "#160108"];
const MUTED = "rgba(250,240,238,0.45)";
const CHIP_ANIM_DURATION = 600;
const CLOSE_SLOT = 38;

// ── Filtros resonadores ───────────────────────────────────────────────────────
type FilterId = string;
const ARTISTA_FILTER_TABS: { id: FilterId; label: string }[] = [
  { id: "Sonoterapeuta", label: "Sonoterapeuta" },
  { id: "Productor", label: "Productor" },
  { id: "Músico", label: "Músico" },
  { id: "Voz guía", label: "Voz guía" },
];

// ── Chip individual ───────────────────────────────────────────────────────────
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

// ── Fila de chips animada ─────────────────────────────────────────────────────
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

// ── Fila de países (sin animación — persistente) ──────────────────────────────
function CountryChipRow({
  countries,
  selected,
  onSelect,
}: {
  countries: string[];
  selected: string | null;
  onSelect: (c: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRowContent}
      style={styles.chipRow}
    >
      {countries.map((c) => (
        <ResoChip
          key={c}
          label={`${COUNTRY_FLAGS[c] ?? ""} ${c}`}
          sel={selected === c}
          onPress={() => onSelect(selected === c ? null : c)}
        />
      ))}
    </ScrollView>
  );
}

// ── Card de Resonador ─────────────────────────────────────────────────────────
type CardItem =
  | { kind: "expansor"; data: Expansor }
  | { kind: "resonador"; data: Resonador };

const ResonadorCard = memo(function ResonadorCard({
  item,
  cardW,
}: {
  item: CardItem;
  cardW: number;
}) {
  const d = item.data;
  const { expansorId } = useUserProfile();

  const photoSize = cardW - 16;

  function handlePress() {
    if (item.kind === "expansor") router.push(`/expansor-perfil/${d.id}` as never);
    else router.push(`/resonador-perfil/${d.id}` as never);
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, { width: cardW, opacity: pressed ? 0.82 : 1 }]}
    >
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
  const [activeTab, setActiveTab] = useState<"resonadores" | "expansores">("resonadores");
  const EXPANSOR_PAGE = 9;
  const [expansorLimit, setExpansorLimit] = useState(EXPANSOR_PAGE);

  // Resonadores filter
  const [activeFilter, setActiveFilter] = useState("Todos");

  // Expansores filters — cascada país → región
  const [selectedCountry, setSelectedCountry] = useState<string | null>("Chile");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  function toggleSearch() {
    if (searchVisible) { setQuery(""); }
    setSearchVisible((v) => !v);
  }

  // Países presentes en EXPANSORES, ordenados alfabéticamente
  const availableCountries = useMemo(() => {
    const set = new Set(EXPANSORES.map((e) => e.country));
    return [...set].sort((a, b) => {
      if (a === "Chile") return -1;
      if (b === "Chile") return 1;
      return a.localeCompare(b);
    });
  }, []);

  // Regiones del país seleccionado
  const regionTabs = useMemo(() => {
    if (!selectedCountry) return [];
    return (REGIONS_BY_COUNTRY[selectedCountry] ?? []).map((r) => ({ id: r, label: r }));
  }, [selectedCountry]);

  function handleSelectCountry(c: string | null) {
    setSelectedCountry(c);
    setSelectedRegion(null);
  }

  const activeFilterKey = activeFilter === "Todos" ? null : activeFilter;

  function switchTab(t: "resonadores" | "expansores") {
    setActiveTab(t);
    setActiveFilter("Todos");
    setSelectedCountry(null);
    setSelectedRegion(null);
    setQuery("");
    setExpansorLimit(EXPANSOR_PAGE);
  }

  const items: CardItem[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (activeTab === "resonadores") {
      return RESONADORES.filter((r) => {
        if (activeFilter !== "Todos" && r.subtipo !== activeFilter) return false;
        if (q) {
          return (
            r.name.toLowerCase().includes(q) ||
            r.subtipo.toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q) ||
            r.specialty.some((s) => s.toLowerCase().includes(q))
          );
        }
        return true;
      }).map((r) => ({ kind: "resonador" as const, data: r }));
    } else {
      return EXPANSORES.filter((e) => {
        if (selectedCountry && e.country !== selectedCountry) return false;
        if (selectedRegion && e.region !== selectedRegion) return false;
        if (q) {
          return (
            e.name.toLowerCase().includes(q) ||
            e.city.toLowerCase().includes(q) ||
            (e.region ?? "").toLowerCase().includes(q) ||
            e.country.toLowerCase().includes(q) ||
            e.specialty.some((s) => s.toLowerCase().includes(q))
          );
        }
        return true;
      }).map((e) => ({ kind: "expansor" as const, data: e }));
    }
  }, [activeTab, activeFilter, selectedCountry, selectedRegion, query]);

  const numCols = 3;
  const SCREEN_PAD = H_PAD * 2;
  const cardW = Math.floor((screenWidth - SCREEN_PAD - CARD_GAP * 2) / numCols);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={BG} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Equipo</Text>
          </View>
          <GhostPill style={{ transform: [{ translateX: 3 }, { translateY: -6 }] }}>
            <Pressable onPress={toggleSearch} hitSlop={10} style={styles.searchIconBtn}>
              <Feather
                name={searchVisible ? "x" : "search"}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>
            <Pressable hitSlop={10} style={styles.searchIconBtn}>
              <Feather name="info" size={20} color="#FFFFFF" />
            </Pressable>
          </GhostPill>
        </View>
        <Text style={styles.subtitle}>Únete a la red de Resonancia</Text>

        {searchVisible && (
          <View style={styles.searchWrap}>
            <Feather name="search" size={14} color="rgba(212,175,55,0.55)" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={activeTab === "resonadores" ? "Buscar resonador..." : "Buscar por nombre, ciudad o país..."}
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

        {/* Banner */}
        <Image
          source={require("@/assets/images/banner-equipo.jpg")}
          style={styles.banner}
          contentFit="cover"
        />

        {/* Tab switcher */}
        <View style={styles.tabPill}>
          {(["resonadores", "expansores"] as const).map((t) => {
            const isActive = activeTab === t;
            const label = t === "resonadores" ? "Resonadores" : "Expansores";
            const sub = t === "resonadores" ? "El equipo creador" : "Los que expanden la vibración";
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
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{label}</Text>
                <Text style={[styles.tabBtnSub, isActive && styles.tabBtnSubActive]}>{sub}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Filtros ── */}
      <View style={styles.filtersScroll}>
        {activeTab === "resonadores" ? (
          <AnimatedFilterRow
            key="resonadores"
            tabs={ARTISTA_FILTER_TABS}
            activeFilter={activeFilterKey}
            onSelect={(id) => setActiveFilter(id)}
            onClear={() => setActiveFilter("Todos")}
          />
        ) : (
          <View style={styles.expansorFilters}>
            {/* Nivel 1: Países */}
            <CountryChipRow
              countries={availableCountries}
              selected={selectedCountry}
              onSelect={handleSelectCountry}
            />

            {/* Nivel 2: Regiones (solo cuando hay país seleccionado) */}
            {selectedCountry && regionTabs.length > 0 && (
              <View style={styles.regionRow}>
                <AnimatedFilterRow
                  key={selectedCountry}
                  tabs={regionTabs}
                  activeFilter={selectedRegion}
                  onSelect={(id) => setSelectedRegion(id)}
                  onClear={() => setSelectedRegion(null)}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── Grid ── */}
      <FlatList
        data={activeTab === "expansores" ? items.slice(0, expansorLimit) : items}
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
        ListFooterComponent={
          activeTab === "expansores" && items.length > EXPANSOR_PAGE ? (
            <Pressable
              onPress={() =>
                expansorLimit >= items.length
                  ? setExpansorLimit(EXPANSOR_PAGE)
                  : setExpansorLimit((l) => l + EXPANSOR_PAGE)
              }
              style={({ pressed }) => [styles.loadMoreBtn, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={styles.loadMoreText}>
                {expansorLimit >= items.length ? "Cargar menos" : "Cargar más"}
              </Text>
            </Pressable>
          ) : null
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
  banner: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 4,
  },
  titleIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(244,218,213,0.45)",
    marginBottom: 10,
  },

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
    color: "#FAF0EE",
    fontSize: 13,
    paddingVertical: 0,
  },

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
    color: "rgba(244,218,214,0.30)",
    marginTop: 2,
    textAlign: "center",
  },
  tabBtnSubActive: {
    color: "rgba(27,6,15,0.65)",
  },

  filtersScroll: { paddingHorizontal: H_PAD, paddingBottom: 6 },

  // Expansores: dos niveles de filtro
  expansorFilters: { gap: 6 },
  regionRow: { marginTop: 2 },

  // Chips
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
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  chipText: { fontSize: 13, fontWeight: "400", color: "#FFFFFF" },
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
    color: "#FAF0EE",
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

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: "rgba(244,218,213,0.30)" },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: -9,
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // ── Footer sections ──────────────────────────────────────────────────────────
  footerSections: {
    marginTop: 24,
    paddingBottom: 16,
  },

  // Recent sessions header
  recentHeader: {
    marginBottom: 14,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.2,
  },
  recentSub: {
    fontSize: 11,
    color: "rgba(244,218,213,0.45)",
    marginTop: 3,
  },

  // Recent sessions carousel
  recentScrollWrap: {
    marginHorizontal: -H_PAD,
  },
  recentScrollContent: {
    paddingHorizontal: H_PAD,
    gap: 10,
    paddingBottom: 4,
  },
  recentCard: {
    width: 164,
  },
  recentImgWrap: {
    width: 164,
    height: 122,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 7,
  },
  recentImg: {
    width: 164,
    height: 122,
  },
  recentPremiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#D4AF37",
    borderRadius: 99,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  recentPremiumStar: {
    fontSize: 8,
    color: "#1B060F",
    fontWeight: "800",
  },
  recentCardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FAF0EE",
    lineHeight: 15,
  },
  recentCardCat: {
    fontSize: 10,
    color: "rgba(212,175,55,0.70)",
    marginTop: 2,
  },

  // CTA button
  ctaBtn: {
    marginTop: 22,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  ctaIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
  },
  ctaIconText: {
    fontSize: 16,
    color: "#D4AF37",
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.2,
  },
  ctaHint: {
    fontSize: 11,
    color: "rgba(244,218,213,0.50)",
    marginTop: 2,
  },
});

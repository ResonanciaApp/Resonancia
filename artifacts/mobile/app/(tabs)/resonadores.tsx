import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { EXPANSORES, REGIONS_BY_COUNTRY, type Expansor } from "@/data/expansores";
import { RESONADORES, type Resonador } from "@/data/resonadores";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/context/UserProfileContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

const H_PAD = 18;
const CARD_GAP = 10;
const BG: [string, string] = ["#340D1A", "#190913"];
const MUTED = "#c2c2c2";
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
          colors={["#F9F9F9", "#F9F9F9"]}
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
          label={c}
          sel={selected === c}
          onPress={() => onSelect(selected === c ? null : c)}
        />
      ))}
    </ScrollView>
  );
}

// ── Filtro chevron expansores ──────────────────────────────────────────────────
function ExpansorChevronFilter({
  availableCountries,
  selectedCountry,
  onSelectCountry,
}: {
  availableCountries: string[];
  selectedCountry: string | null;
  onSelectCountry: (c: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  function toggle() {
    const next = !open;
    setOpen(next);
    Animated.timing(anim, {
      toValue: next ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }

  function handleCountry(c: string) {
    onSelectCountry(selectedCountry === c ? null : c);
    setOpen(false);
    Animated.timing(anim, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: false }).start();
  }

  const chevronRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const dropOpacity  = anim;
  const dropScale    = anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });

  const label = selectedCountry ?? "Todos los países";

  return (
    <View style={styles.chevronWrap}>
      {/* Pill trigger */}
      <Pressable onPress={toggle} style={({ pressed }) => [styles.chevronTrigger, { opacity: pressed ? 0.75 : 1 }]}>
        <Text style={styles.chevronTriggerText}>{label}</Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather name="chevron-down" size={14} color="#F6F6F6" />
        </Animated.View>
      </Pressable>

      {/* Dropdown flotante — posición absoluta bajo la pill */}
      {open && (
        <Animated.View style={[styles.chevronDropdown, { opacity: dropOpacity, transform: [{ scale: dropScale }] }]}>
          {/* "Todos" option */}
          <Pressable
            onPress={() => handleCountry("")}
            style={[styles.chevronOption, !selectedCountry && styles.chevronOptionSel]}
          >
            <Text style={[styles.chevronOptionText, !selectedCountry && styles.chevronOptionTextSel]}>
              Todos los países
            </Text>
          </Pressable>
          {availableCountries.map((c, i) => (
            <Pressable
              key={c}
              onPress={() => handleCountry(c)}
              style={[
                styles.chevronOption,
                selectedCountry === c && styles.chevronOptionSel,
                i < availableCountries.length - 1 && styles.chevronOptionDivider,
              ]}
            >
              <Text style={[styles.chevronOptionText, selectedCountry === c && styles.chevronOptionTextSel]}>
                {c}
              </Text>
              {selectedCountry === c && <Feather name="check" size={13} color="#F9F9F9" />}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
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
            item.kind === "expansor" && { borderWidth: 0 },
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
        <Text style={styles.cardTag} numberOfLines={1}>
          {item.kind === "resonador"
            ? item.data.subtipo
            : item.data.region ?? ""}
        </Text>
      </View>
    </Pressable>
  );
});

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function ResonadoresScreen() {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { width: screenWidth } = useWindowDimensions();

  // Animación de entrada: desliza de derecha a izquierda al enfocar la tab
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  useFocusEffect(
    useCallback(() => {
      slideAnim.setValue(screenWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return () => slideAnim.stopAnimation();
    }, [slideAnim, screenWidth])
  );

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

  // Texto cinemático sobre el banner: aparece al 0.6s, fade in, 4s, fade out
  const bannerTextOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const seq = Animated.sequence([
      Animated.delay(600),
      Animated.timing(bannerTextOpacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.delay(4000),
      Animated.timing(bannerTextOpacity, {
        toValue: 0,
        duration: 1200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]);
    seq.start();
    return () => seq.stop();
  }, [bannerTextOpacity]);

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
    <Animated.View style={[styles.root, { transform: [{ translateX: slideAnim }] }]}>
      <LinearGradient
        colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar hidden />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Feather name="chevron-up" size={18} color="rgba(255,255,255,0.45)" style={{ marginBottom: 2, marginLeft: 2 }} />
            <Text style={[styles.title, { transform: [{ translateY: -6 }] }]}>Resonadores</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, transform: [{ translateX: 3 }, { translateY: -6 }] }}>
            <Pressable onPress={toggleSearch} hitSlop={10} style={styles.searchIconBtn}>
              <Feather
                name={searchVisible ? "x" : "search"}
                size={25}
                color="#FFFFFF"
              />
            </Pressable>
            <Pressable
              hitSlop={10}
              style={styles.searchIconBtn}
              onPress={() => router.push("/equipo-info" as never)}
            >
              <Feather name="info" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {searchVisible && (
          <View style={styles.searchWrap}>
            <Feather name="search" size={14} color="rgba(212,175,55,0.55)" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={activeTab === "resonadores" ? "Buscar resonador..." : "Buscar por nombre, ciudad o país..."}
              placeholderTextColor="rgba(255,255,255,0.30)"
              style={styles.searchInput}
              returnKeyType="search"
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={14} color="rgba(255,255,255,0.45)" />
              </Pressable>
            )}
          </View>
        )}

        {/* Tab switcher */}
        <View style={styles.tabPill}>
          {(["resonadores", "expansores"] as const).map((t) => {
            const isActive = activeTab === t;
            const label   = t === "resonadores" ? "Resonadores" : "Expansores";
            const bajada  = t === "resonadores" ? "La esencia de Resonancia" : "Los que expanden la vibración";
            return (
              <Pressable
                key={t}
                onPress={() => switchTab(t)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                {isActive && (
                  <LinearGradient
                    colors={["#F9F9F9", "#F9F9F9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>{label}</Text>
                <Text style={[styles.tabBtnBajada, isActive && styles.tabBtnBajadaActive]}>{bajada}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Filtro chevron expansores ── */}
      {activeTab === "expansores" && (
        <ExpansorChevronFilter
          availableCountries={availableCountries}
          selectedCountry={selectedCountry}
          onSelectCountry={handleSelectCountry}
        />
      )}

      {/* ── Filtros ── (oculto) */}
      <View style={[styles.filtersScroll, { display: "none" }]}>
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
        style={{ marginTop: -2 }}
        data={items}
        keyExtractor={(item) => item.data.id}
        numColumns={numCols}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={36} color="rgba(255,255,255,0.20)" />
            <Text style={styles.emptyText}>Sin resultados</Text>
          </View>
        }
        renderItem={({ item }) => <ResonadorCard item={item} cardW={cardW} />}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  banner: {
    width: undefined,
    aspectRatio: 1536 / 508,
    marginHorizontal: -H_PAD,
    marginTop: -15,
    marginBottom: 14,
    overflow: "hidden",
    transform: [{ translateY: 20 }],
  },
  bannerTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#7A1212",
    opacity: 0.15,
  },
  bannerBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#F9F9F9",
    opacity: 0.5,
  },
  bannerTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    transform: [{ translateY: -5 }],
  },
  bannerText: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
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
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
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
    fontFamily: "Manrope",
    flex: 1,
    color: "#FAF0EE",
    fontSize: 13,
    paddingVertical: 0,
  },

  tabPill: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.40)",
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
    marginTop: 25,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 999,
    alignItems: "center",
    overflow: "hidden",
  },
  tabBtnActive: {},
  tabBtnText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#F6F6F6",
  },
  tabBtnTextActive: {
    fontFamily: "Manrope",
    color: "#1B060F",
    fontWeight: "700",
  },
  tabBtnBajada: {
    fontFamily: "Manrope",
    fontSize: 9,
    fontWeight: "400",
    color: "rgba(255,255,255,0.50)",
    textAlign: "center",
    marginTop: 1,
    letterSpacing: 0.2,
  },
  tabBtnBajadaActive: {
    color: "rgba(27,6,15,0.65)",
  },

  // ── Chevron filter ──────────────────────────────────────────────────────────
  chevronWrap: {
    marginHorizontal: H_PAD,
    marginTop: -5,
    marginBottom: 4,
    zIndex: 100,
  },
  chevronTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.40)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chevronTriggerText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.2,
  },
  chevronDropdown: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: "rgba(18,6,12,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 200,
  },
  chevronOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chevronOptionSel: {
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  chevronOptionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  chevronOptionText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.80)",
  },
  chevronOptionTextSel: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontWeight: "600",
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
    backgroundColor: "rgba(0,0,0,0.50)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#FFFFFF" },
  chipTextSel: { fontFamily: "Manrope", color: "#1B060F", fontWeight: "700" },

  // Grid
  grid: { paddingHorizontal: H_PAD, paddingTop: 0 },
  row: { gap: CARD_GAP, marginBottom: 16 },

  // Card
  card: {
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
  },
  photoOuter: {
    alignItems: "center",
    marginBottom: 10,
  },
  photoWrap: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.50)",
    position: "relative",
  },
  certBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#F9F9F9",
    borderRadius: 99,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  certStar: { fontFamily: "Manrope", fontSize: 9, color: "#1B060F", fontWeight: "800" },
  cardInfo: { alignItems: "center", paddingHorizontal: 6 },
  cardName: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    color: "#FAF0EE",
    marginBottom: 2,
    textAlign: "center",
  },
  cardTag: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "400",
    color: "#F4F4F4",
    textAlign: "center",
    marginBottom: 3,
  },
  cardSub: {
    fontFamily: "Manrope",
    fontSize: 10,
    color: "rgba(212,175,55,0.75)",
    marginBottom: 4,
    textAlign: "center",
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  cardLocation: { fontFamily: "Manrope", fontSize: 10, color: "rgba(255,255,255,0.40)", textAlign: "center" },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, color: "rgba(255,255,255,0.30)" },
  loadMoreBtn: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
  },
  loadMoreText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
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
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.2,
  },
  recentSub: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
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
    backgroundColor: "#F9F9F9",
    borderRadius: 99,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  recentPremiumStar: {
    fontFamily: "Manrope",
    fontSize: 8,
    color: "#1B060F",
    fontWeight: "800",
  },
  recentCardTitle: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#FAF0EE",
    lineHeight: 15,
  },
  recentCardCat: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    fontSize: 16,
    color: "#F9F9F9",
  },
  ctaTextWrap: {
    flex: 1,
  },
  ctaQuestion: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.2,
  },
  ctaHint: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(255,255,255,0.50)",
    marginTop: 2,
  },
});

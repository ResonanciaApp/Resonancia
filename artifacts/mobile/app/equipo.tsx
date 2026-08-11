import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
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
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { RESONADORES, type Resonador } from "@/data/resonadores";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/context/UserProfileContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useBackOverride } from "@/context/BackOverrideContext";

const H_PAD = 18;
const CARD_GAP = 10;
const BG: [string, string] = ["#340D1A", "#190913"];
const MUTED = "#c2c2c2";
const CHIP_ANIM_DURATION = 600;
const CLOSE_SLOT = 38;

function brightenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const newL = Math.min(1, l + amount / 100);
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t; if (tt < 0) tt += 1; if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let rr: number, gg: number, bb: number;
  if (s === 0) { rr = gg = bb = newL; } else {
    const q2 = newL < 0.5 ? newL * (1 + s) : newL + s - newL * s;
    const p2 = 2 * newL - q2;
    rr = hue2rgb(p2, q2, h + 1 / 3); gg = hue2rgb(p2, q2, h); bb = hue2rgb(p2, q2, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}

// ── Filtros resonadores ───────────────────────────────────────────────────────
type FilterId = string;
const ARTISTA_FILTER_TABS: { id: FilterId; label: string }[] = [
  { id: "Sonoterapeuta", label: "Sonoterapeuta" },
  { id: "Voz guía",      label: "Voz Guía" },
  { id: "Productor",     label: "Productor" },
  { id: "Músico",        label: "Músico" },
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
          style={[StyleSheet.absoluteFill, { margin: -1 }]}
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

// ── Card de Resonador ─────────────────────────────────────────────────────────
type CardItem = { kind: "resonador"; data: Resonador };

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
export default function EquipoScreen() {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
  const backOverride = useBackOverride();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { width: screenWidth } = useWindowDimensions();

  const [activeFilter, setActiveFilter] = useState<FilterId | null>(null);
  const items: CardItem[] = useMemo(() => {
    return RESONADORES.filter((r) => {
      if (activeFilter !== null && r.subtipo !== activeFilter) return false;
      return true;
    }).map((r) => ({ kind: "resonador" as const, data: r }));
  }, [activeFilter]);

  const numCols = 3;
  const SCREEN_PAD = H_PAD * 2;
  const cardW = Math.floor((screenWidth - SCREEN_PAD - CARD_GAP * 2) / numCols);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={sceneTheme.gradient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar hidden />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <BackPill onPress={backOverride ?? (() => router.back())} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ transform: [{ translateY: -23 }] }} />
            <Text style={[styles.title, { transform: [{ translateY: 4 }] }]}>Resonadores</Text>
            <Text style={[styles.titleSub, { transform: [{ translateY: 4 }] }]}>La esencia de Resonancia</Text>
          </View>
          <LinearGradient
            colors={[
              brightenHex(sceneTheme.gradient[0] as string, 62),
              brightenHex(sceneTheme.gradient[0] as string, 18),
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.uneteBorder, { transform: [{ translateX: 3 }, { translateY: 4 }] }]}
          >
            <Pressable
              hitSlop={10}
              onPress={() => router.push("/equipo-info" as never)}
              style={[styles.uneteBtn, { backgroundColor: sceneTheme.gradient[0] as string }]}
            >
              <Text style={styles.uneteBtnText}>Únete</Text>
            </Pressable>
          </LinearGradient>
        </View>

        <AnimatedFilterRow
          tabs={ARTISTA_FILTER_TABS}
          activeFilter={activeFilter}
          onSelect={(id) => setActiveFilter(id)}
          onClear={() => setActiveFilter(null)}
        />
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
    alignItems: "flex-end",
    gap: 10,
    paddingBottom: 4,
  },
  uneteBorder: {
    borderRadius: 999,
    padding: 2,
  },
  uneteBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  uneteBtnText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#F9F9F9",
    letterSpacing: 0.4,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "700",
    color: "#F9F9F9",
    letterSpacing: 0.5,
  },
  titleSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(249,249,249,0.50)",
    letterSpacing: 0.2,
    marginTop: 2,
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
  animChipWrap: { flexDirection: "row", alignItems: "center", marginTop: 15, marginHorizontal: -H_PAD },
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
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
  chip: {
    height: 31,
    paddingHorizontal: 13,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#FFFFFF" },
  chipTextSel: { fontFamily: "Manrope", color: "#1B060F", fontWeight: "700" },
  grid: { paddingHorizontal: H_PAD, paddingTop: 25 },
  row: { gap: CARD_GAP, marginBottom: 31 },
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
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, color: "rgba(255,255,255,0.30)" },
});

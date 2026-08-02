// ── Pantalla escondida (no enlazada desde ningún menú) ──────────────────────
// Copia de respaldo de los "tabs" animados de Biblioteca (AnimatedChipRow +
// LIB_TABS + LibChip), guardada para reutilizar más adelante en otra pantalla.
// Acceso solo por URL directa: /dev-biblioteca-tabs (no aparece en la nav).
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SacredBackground } from "@/components/SacredBackground";

const GOLD = "#dad4ec";
const TEXT = "#FBFBFB";
const MUTED = "#c2c2c2";
const H_PAD = 15;

type LibTab = "playlists" | "mezclas" | "geometrix" | "favoritos" | "resonadores";

const LIB_TABS: { id: LibTab; label: string }[] = [
  { id: "playlists", label: "Rituales" },
  { id: "mezclas", label: "Mezclas" },
  { id: "geometrix", label: "Geometrix" },
  { id: "favoritos", label: "Favoritos" },
];

// ── Chip de tab ───────────────────────────────────────────────────────────────
function LibChip({ label, sel, onPress }: { label: string; sel: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}>
      <LinearGradient
        colors={sel ? ["#dad4ec", "#f3e7e9"] : ["rgba(255,255,255,0.055)", "rgba(255,255,255,0.055)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
    </Pressable>
  );
}

// ── Fila de chips animada (fade + desplazamiento al margen) ─────────────────
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
  const [displayTab, setDisplayTab] = useState<LibTab | null>(activeTab);
  const [colorTab, setColorTab] = useState<LibTab | null>(activeTab);
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
    setTargetTranslate(CLOSE_SLOT - visualLeft);
    setDisplayTab(id);
    setColorTab(id);
    progress.setValue(0);
    animate(1);
    onSelect(id);
  };

  const handleClear = () => {
    setColorTab(null);
    animate(0, () => setDisplayTab(null));
    onClear();
  };

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

export default function DevBibliotecaTabsBackup() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LibTab | null>(null);

  return (
    <View style={styles.root}>
      <SacredBackground variant="solid" />
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: H_PAD }}>
        <Text style={styles.title}>Backup: tabs de Biblioteca</Text>
        <Text style={styles.subtitle}>
          Pantalla escondida (no enlazada) — solo referencia para reutilizar esta
          animación más adelante.
        </Text>
        <View style={{ marginTop: 24 }}>
          <AnimatedChipRow
            tabs={LIB_TABS}
            activeTab={activeTab}
            onSelect={setActiveTab}
            onClear={() => setActiveTab(null)}
          />
        </View>
        <Text style={styles.hint}>
          Seleccionado: {activeTab ?? "ninguno"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B060F" },
  title: { fontFamily: "Manrope", color: TEXT, fontSize: 18, fontWeight: "700" },
  subtitle: { fontFamily: "Manrope", color: MUTED, fontSize: 12, marginTop: 6, lineHeight: 17 },
  hint: { fontFamily: "Manrope", color: MUTED, fontSize: 12, marginTop: 20 },

  animChipWrap: { flexDirection: "row", alignItems: "center" },
  animCloseBtn: { position: "absolute", left: 0, top: 0, bottom: 0, justifyContent: "center", zIndex: 3 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chipCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    overflow: "hidden",
  },
  chipText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: TEXT },
  chipTextSel: { color: "#1B060F" },
});

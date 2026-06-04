import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES } from "@/data/mix-categories";
import {
  type MixSound,
  type SoundCategoryId,
  SOUND_CATEGORIES,
  SOUNDS,
  getSoundsByCategory,
  hasSoundFile,
} from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

type TabId = "popular" | SoundCategoryId;

const COUNTS_KEY = "@resonance_sound_play_counts";


export default function MiMusicaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { isActive, toggleSound, activeSounds } = useMixer();
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({});
  const [descExpanded, setDescExpanded] = useState(false);

  const toggleDesc = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescExpanded((v) => !v);
  };

  useEffect(() => {
    AsyncStorage.getItem(COUNTS_KEY)
      .then((raw) => {
        if (raw) setPlayCounts(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const incrementCount = (soundId: string) => {
    setPlayCounts((prev) => {
      const next = { ...prev, [soundId]: (prev[soundId] ?? 0) + 1 };
      AsyncStorage.setItem(COUNTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSoundPress = (sound: MixSound) => {
    if (!hasSoundFile(sound.id)) return;
    if (sound.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (!isActive(sound.id)) {
      const ok = toggleSound(sound.id);
      if (!ok) {
        Alert.alert(
          "Límite alcanzado",
          `Podés mezclar hasta ${MAX_ACTIVE_SOUNDS} sonidos a la vez. Quitá uno para agregar otro.`,
        );
      } else {
        incrementCount(sound.id);
      }
    } else {
      toggleSound(sound.id);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "popular", label: "Popular" },
    ...SOUND_CATEGORIES.map((c) => ({ id: c.id as TabId, label: c.label })),
  ];
  const tabsHalf = Math.ceil(tabs.length / 2);
  const tabsTopRow = tabs.slice(0, tabsHalf);
  const tabsBottomRow = tabs.slice(tabsHalf);

  const renderTab = (tab: { id: TabId; label: string }) => {
    const selected = activeTab === tab.id;
    return (
      <Pressable
        key={tab.id}
        onPress={() => setActiveTab(tab.id)}
        style={[
          styles.tab,
          {
            backgroundColor: "transparent",
            borderColor: selected ? "rgba(237,225,211,0.55)" : "rgba(255,255,255,0.12)",
          },
        ]}
      >
        <Text
          style={[
            styles.tabLabel,
            {
              color: selected ? colors.foreground : colors.mutedForeground,
              fontWeight: selected ? "600" : "400",
            },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  const renderSoundCard = (sound: MixSound) => {
    const available = hasSoundFile(sound.id);
    const active = isActive(sound.id);
    const locked = sound.isPremium && !isPremium;
    const image = getSoundImage(sound.id);

    return (
      <Pressable
        key={sound.id}
        onPress={() => handleSoundPress(sound)}
        disabled={!available}
        style={[styles.soundCard, { opacity: available ? 1 : 0.5 }]}
      >
        <View
          style={[
            styles.cardImageWrap,
            active && styles.cardImageWrapActive,
            { borderColor: active ? "#FFFFFF" : "transparent" },
          ]}
        >
          {image ? (
            <Image
              source={image}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(182,149,95,0.1)" }]} />
          )}

          {locked && (
            <Image
              source={require("../../assets/images/estrella-premium.png")}
              style={[styles.lockBadge, { width: 22, height: 22 }]}
              contentFit="contain"
            />
          )}

          {active && (
            <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={11} color={colors.primaryForeground} />
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text
            style={[styles.soundName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {sound.name}
          </Text>
        </View>
      </Pressable>
    );
  };

  const popularSounds = SOUNDS.filter(hasSoundFile ? (s) => hasSoundFile(s.id) : () => true)
    .slice()
    .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
    .slice(0, 50);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <View style={[styles.inner, { paddingTop: topPad + 12 }]}>
        {/* Header fijo (no scrollea) */}
        <View style={styles.header}>
          <Pressable onPress={toggleDesc} style={styles.titleRow} hitSlop={10}>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mezclador</Text>
            <Feather
              name={descExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.mutedForeground}
              style={styles.titleChevron}
            />
          </Pressable>
          <Text style={styles.activeCount}>
            {activeSounds.length}/{MAX_ACTIVE_SOUNDS} sonidos activos
          </Text>
          {descExpanded && (
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              Crea tu ambiente sonoro combinando loops de naturaleza, mantras y frecuencias.{"\n"}
              Activa hasta {MAX_ACTIVE_SOUNDS} sonidos a la vez y regula el volumen de cada uno.{"\n"}
              Tus mezclas favoritas se guardan en cada categoría.
            </Text>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: 200 + bottomPad,
            paddingHorizontal: 20,
          }}
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Barra sticky: categorías de mezclas + tabs de sonido ── */}
          <View style={[styles.stickyBar, { backgroundColor: colors.background }]}>
            {/* Categorías de mezclas (siempre visibles) */}
            <View style={styles.catRow}>
              {MIX_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/mezclas/${cat.id}` as never)}
                  style={({ pressed }) => [styles.catCard, { backgroundColor: "#151A23", borderColor: "rgba(255,255,255,0.1)", opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.catLabel, { color: colors.foreground }]} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tabs de categorías de sonido (2 filas que se deslizan juntas) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsScrollContent}
            >
              <View style={styles.tabsColumn}>
                <View style={styles.tabRow}>{tabsTopRow.map(renderTab)}</View>
                <View style={styles.tabRow}>{tabsBottomRow.map(renderTab)}</View>
              </View>
            </ScrollView>
          </View>

          {/* Separador sutil entre tabs y contenido */}
          <View style={styles.separator} />

          {/* ── Biblioteca de sonidos ── */}
          {activeTab === "popular" ? (
            /* Popular: todos los sonidos ordenados por selecciones, sin títulos */
            <View style={styles.grid}>
              {popularSounds.map(renderSoundCard)}
            </View>
          ) : (
            /* Categoría específica: con título */
            SOUND_CATEGORIES.filter((cat) => activeTab === cat.id).map((cat) => {
              const sounds = getSoundsByCategory(cat.id);
              if (sounds.length === 0) return null;
              return (
                <View key={cat.id} style={styles.grid}>
                  {sounds.map(renderSoundCard)}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20 },
  scroll: { flex: 1, marginHorizontal: -20, backgroundColor: "#090F17" },
  header: { marginBottom: 18 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  titleChevron: { marginTop: 4 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5 },
  activeCount: { fontSize: 13, fontWeight: "500", color: "#89C5E0", marginTop: 3, letterSpacing: 0.2 },
  pageSub: { fontSize: 13, lineHeight: 19, marginTop: 6 },

  // Barra sticky (categorías de mezclas + tabs de sonido)
  stickyBar: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  // Secciones (categorías individuales)
  section: { marginBottom: 57 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 14 },

  // Tabs de categorías de sonido (2 filas, scroll horizontal conjunto)
  tabsScroll: { marginHorizontal: -20, marginBottom: 12 },
  tabsScrollContent: { paddingHorizontal: 20 },
  tabsColumn: { gap: 10 },
  tabRow: { flexDirection: "row", gap: 14 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: "400", letterSpacing: 0.2 },

  // Categorías de mezclas
  catRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  catCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
    marginTop: 8,
    marginBottom: 24,
  },

  // Grilla de sonidos — 3 columnas uniformes
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 24, justifyContent: "flex-start" },
  soundCard: {
    width: "31%",
  },
  cardImageWrap: {
    width: "77%",
    aspectRatio: 1,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
  },
  cardImageWrapActive: {
    transform: [{ rotate: "-5deg" }, { scale: 1.05 }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  cardImage: { width: "100%", height: "100%" },
  cardImageInner: { borderRadius: 0 },
  cardFooter: {
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 2,
  },
  soundName: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  lockBadge: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  activeBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    width: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

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

const IMG_DESCANSO = require("../../assets/images/cat-descanso.png");
const IMG_MEDITACION = require("../../assets/images/cat-meditacion.png");

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
  const [mezclasOpen, setMezclasOpen] = useState(false);

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

  // ── Ícono por categoría ────────────────────────────────────────
  const renderCatIcon = (cat: typeof MIX_CATEGORIES[0]) => {
    const size = 26;
    if (cat.id === "dormir") {
      return <Image source={IMG_DESCANSO} style={{ width: size, height: size }} contentFit="contain" />;
    }
    if (cat.id === "motivarme") {
      return <Image source={IMG_MEDITACION} style={{ width: size, height: size }} contentFit="contain" />;
    }
    const color = cat.color ?? colors.mutedForeground;
    if (cat.iconFamily === "Feather") {
      return <Feather name={cat.icon as any} size={size} color={color} />;
    }
    if (cat.iconFamily === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={cat.icon as any} size={size} color={color} />;
    }
    if (cat.icon === "image-filter-hdr") {
      return <MaterialCommunityIcons name="image-filter-hdr" size={size} color={color} />;
    }
    return <Feather name="circle" size={size} color={color} />;
  };

  const renderTab = (tab: { id: TabId; label: string }) => {
    const selected = activeTab === tab.id;
    return (
      <Pressable
        key={tab.id}
        onPress={() => setActiveTab(tab.id)}
        style={[
          styles.tab,
          {
            backgroundColor: "#151A23",
            borderColor: selected ? "rgba(100,185,220,0.45)" : "transparent",
          },
        ]}
      >
        <Text
          style={[
            styles.tabLabel,
            {
              color: selected ? "#EDE1D3" : colors.mutedForeground,
              fontWeight: selected ? "600" : "400",
            },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  const tabRow1 = tabs.slice(0, Math.ceil(tabs.length / 2));
  const tabRow2 = tabs.slice(Math.ceil(tabs.length / 2));

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
        {/* ── Header fijo ── */}
        <View style={styles.header}>
          {/* Título — sin flecha */}
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mezclador</Text>

          {/* Descripción: 2 líneas → tap para ver todo */}
          <Pressable onPress={toggleDesc} hitSlop={8}>
            <Text
              style={[styles.pageSub, { color: colors.mutedForeground }]}
              numberOfLines={descExpanded ? undefined : 2}
            >
              Aquí es donde tú eres el creador, ¡comparte tus mezclas!
            </Text>
          </Pressable>

          {/* Tus mezclas — colapsable */}
          <Pressable
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setMezclasOpen((v) => !v);
            }}
            style={styles.mezclasHeader}
          >
            <MaterialCommunityIcons name="heart" size={16} color="#E05252" style={{ marginRight: 7 }} />
            <Text style={[styles.subSectionTitle, { color: colors.foreground, flex: 1, marginBottom: 0 }]}>
              Tus mezclas
            </Text>
            <Feather
              name={mezclasOpen ? "chevron-up" : "chevron-down"}
              size={17}
              color={colors.mutedForeground}
            />
          </Pressable>

          {/* 3 bloques de categoría */}
          {mezclasOpen && (
            <View style={styles.catRow}>
              {MIX_CATEGORIES.map((cat) => {
                const accent = cat.color ?? colors.primary;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push(`/mezclas/${cat.id}` as never)}
                    style={({ pressed }) => [
                      styles.catCard,
                      {
                        backgroundColor: pressed ? accent + "18" : "#151A23",
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                      },
                    ]}
                  >
                    <Text
                      style={[styles.catLabel, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
          {/* ── Barra sticky: título Sonidos + tabs ── */}
          <View style={[styles.stickyBar, { backgroundColor: colors.background }]}>
            <Text style={[styles.soundsSectionTitle, { color: colors.foreground }]}>Sonidos</Text>

            {/* Filtros de sonido — 2 filas scrollables juntas */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
              contentContainerStyle={styles.tabsScrollContent}
            >
              <View style={styles.tabsBlock}>
                <View style={styles.tabRow}>{tabRow1.map(renderTab)}</View>
                <View style={styles.tabRow}>{tabRow2.map(renderTab)}</View>
              </View>
            </ScrollView>
          </View>


          {/* ── Biblioteca de sonidos ── */}
          {activeTab === "popular" ? (
            <View style={styles.grid}>
              {popularSounds.map(renderSoundCard)}
            </View>
          ) : (
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

  // Header
  header: { marginBottom: 12 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  pageSub: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  subSectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },
  mezclasHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingVertical: 4 },

  // Barra sticky
  stickyBar: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  soundsSectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },

  // Secciones
  section: { marginBottom: 57 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 14 },

  // Tabs de categorías de sonido
  tabsScroll: { marginHorizontal: -20, marginBottom: 4 },
  tabsScrollContent: { paddingHorizontal: 20 },
  tabsBlock: { flexDirection: "column", gap: 8 },
  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  // borderColor is set dynamically; borderWidth stays 1 so layout doesn't shift
  tabLabel: { fontSize: 13, fontWeight: "400", letterSpacing: 0.2 },

  // Categorías de mezclas — 3 tarjetas iguales
  catRow: { flexDirection: "row", gap: 8 },
  catCard: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.2,
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

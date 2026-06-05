import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  SOUNDS,
  SOUND_CATEGORIES,
  hasSoundFile,
} from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

const IMG_DESCANSO = require("../../assets/images/cat-descanso.png");
const IMG_MEDITACION = require("../../assets/images/cat-meditacion.png");

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "voces";

const MAIN_TABS: { id: MainTabId; label: string; icon: string; categories: SoundCategoryId[] | null }[] = [
  { id: "popular",        label: "Popular",        icon: "trending-up", categories: null },
  { id: "naturaleza",     label: "Naturaleza",     icon: "wind",        categories: ["naturaleza", "agua", "ruidos"] },
  { id: "ancestrales",    label: "Ancestrales",    icon: "bell",        categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento"] },
  { id: "sintetizadores", label: "Sintetizadores", icon: "sliders",     categories: ["solfeggio", "frecuencias"] },
  { id: "voces",          label: "Voces",          icon: "mic",         categories: ["mantras"] },
];

const COUNTS_KEY = "@resonance_sound_play_counts";

export default function MiMusicaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { isActive, toggleSound, activeSounds } = useMixer();
  const [mainTab, setMainTab] = useState<MainTabId>("popular");
  const [subTab, setSubTab] = useState<SoundCategoryId | null>(null);
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

  const renderSoundCard = (sound: MixSound, idx: number) => {
    const available = hasSoundFile(sound.id);
    const active = isActive(sound.id);
    const locked = sound.isPremium && !isPremium;
    const image = getSoundImage(sound.id);
    const tiltDir = idx % 2 === 0 ? "-5deg" : "5deg";

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
            active && [
              styles.cardImageWrapActive,
              { transform: [{ rotate: tiltDir }, { scale: 1.05 }] },
            ],
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

  const currentTabDef = MAIN_TABS.find((t) => t.id === mainTab);
  const subTabCategories = currentTabDef?.categories ?? null;

  const displayedSounds = useMemo(() => {
    if (!subTabCategories) return popularSounds;
    const catFilter = subTab ? [subTab] : subTabCategories;
    return SOUNDS.filter(
      (s) => catFilter.includes(s.category as SoundCategoryId) && hasSoundFile(s.id),
    );
  }, [mainTab, subTab, popularSounds, subTabCategories]);

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
            <Text style={[styles.subSectionTitle, { color: colors.foreground, marginBottom: 0, marginRight: 7 }]}>
              Mi
            </Text>
            <MaterialCommunityIcons name="heart" size={16} color="#E05252" />
            <Feather
              name={mezclasOpen ? "chevron-up" : "chevron-down"}
              size={15}
              color={colors.mutedForeground}
              style={{ marginLeft: 6 }}
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
          {/* ── Barra sticky: categorías principales + sub-tabs ── */}
          <View style={[styles.stickyBar, { backgroundColor: colors.background }]}>
            <View style={styles.segmentedContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mainTabBarContent}
            >
              {MAIN_TABS.map((tab) => {
                const selected = mainTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => { setMainTab(tab.id); setSubTab(null); }}
                    style={[
                      styles.mainTabItem,
                      selected && styles.mainTabItemActive,
                    ]}
                  >
                    <Feather
                      name={tab.icon as any}
                      size={20}
                      color={selected ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.mainTabText,
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
              })}
            </ScrollView>
            </View>

            {/* ── Sub-tabs — solo si el tab principal tiene > 1 categoría ── */}
            {subTabCategories && subTabCategories.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={styles.subTabRow}
              >
                {subTabCategories.map((catId) => {
                  const cat = SOUND_CATEGORIES.find((c) => c.id === catId);
                  if (!cat) return null;
                  const selected = subTab === catId;
                  return (
                    <Pressable
                      key={catId}
                      onPress={() => setSubTab(selected ? null : catId)}
                      style={[
                        styles.subTabPill,
                        {
                          borderLeftColor: selected ? "rgba(190,150,80,0.85)" : "transparent",
                          backgroundColor: selected ? "rgba(190,150,80,0.08)" : "rgba(255,255,255,0.05)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subTabPillText,
                          { color: selected ? colors.foreground : colors.mutedForeground },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={{ height: 6, backgroundColor: "#0E141C", marginHorizontal: -20 }} />
            )}
          </View>


          {/* ── Biblioteca de sonidos ── */}
          <View style={[styles.grid, { marginTop: 33 }]}>
            {displayedSounds.map((s, i) => renderSoundCard(s, i))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20 },
  scroll: { flex: 1, marginHorizontal: -20, backgroundColor: "#0E141C" },

  // Header
  header: { marginBottom: 12 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  pageSub: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  subSectionTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },
  mezclasHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingVertical: 4 },

  // Barra sticky
  stickyBar: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  // Secciones
  section: { marginBottom: 57 },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 14 },

  // Tabs principales — segmented control (Variante C)
  segmentedContainer: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 2,
  },
  mainTabBarContent: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 2,
  },
  mainTabItem: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  mainTabItemActive: {
    borderColor: "rgba(190,150,80,0.3)",
    backgroundColor: "rgba(190,150,80,0.11)",
  },
  mainTabText: { fontSize: 12, letterSpacing: 0.2 },

  // Sub-tabs — left-border accent
  subTabRow: { flexDirection: "row", gap: 6, paddingTop: 10, paddingBottom: 10, paddingHorizontal: 20 },
  subTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderLeftWidth: 2,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  subTabPillText: { fontSize: 13, fontWeight: "600", letterSpacing: 0.1 },

  // Categorías de mezclas — 3 tarjetas iguales
  catRow: { flexDirection: "row", gap: 8 },
  catCard: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
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
});

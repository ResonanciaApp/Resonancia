import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
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
  getSoundsByCategory,
  hasSoundFile,
} from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

type TabId = "todos" | SoundCategoryId;

export default function MiMusicaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { isActive, toggleSound } = useMixer();
  const [activeTab, setActiveTab] = useState<TabId>("todos");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSoundPress = (sound: MixSound) => {
    if (!hasSoundFile(sound.id)) return; // "Próximamente"
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
      }
    } else {
      toggleSound(sound.id);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "todos", label: "Todos" },
    ...SOUND_CATEGORIES.map((c) => ({ id: c.id as TabId, label: c.label })),
  ];

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
        {/* Imagen — ocupa la parte superior cuadrada */}
        <View
          style={[
            styles.cardImageWrap,
            active && styles.cardImageWrapActive,
            { borderColor: active ? "#FFFFFF" : "transparent" },
          ]}
        >
          {image ? (
            <ImageBackground
              source={image}
              style={styles.cardImage}
              imageStyle={styles.cardImageInner}
            />
          ) : (
            <View style={[styles.cardImage, { backgroundColor: "rgba(182,149,95,0.1)" }]} />
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

        {/* Título debajo de la imagen */}
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <View style={[styles.inner, { paddingTop: topPad + 12 }]}>
        {/* Header fijo (no scrollea) */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mezclador</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tus mezclas, organizadas por momento
          </Text>
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
            {/* Categorías de mezclas */}
            <View style={styles.catRow}>
              {MIX_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/mezclas/${cat.id}` as never)}
                  style={[styles.catCard, { backgroundColor: "#090E17", borderColor: "transparent" }]}
                >
                  {cat.iconFamily === "MaterialCommunityIcons" ? (
                    <MaterialCommunityIcons
                      name={cat.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                      size={26}
                      color={colors.accent}
                    />
                  ) : (
                    <Feather name={cat.icon as React.ComponentProps<typeof Feather>["name"]} size={24} color={colors.accent} />
                  )}
                  <Text style={[styles.catLabel, { color: colors.foreground }]} numberOfLines={2}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tabs de categorías de sonido */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsRow}
              style={styles.tabsScroll}
            >
              {tabs.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[
                      styles.tab,
                      {
                        backgroundColor: selected ? colors.primary : "#090E17",
                        borderColor: selected ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: selected ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Separador sutil entre tabs y contenido */}
          <View style={styles.separator} />

          {/* ── Biblioteca de sonidos (con títulos por categoría, filtrada por tab) ── */}
          {SOUND_CATEGORIES.filter(
            (cat) => activeTab === "todos" || activeTab === cat.id,
          ).map((cat) => {
            const sounds = getSoundsByCategory(cat.id);
            if (sounds.length === 0) return null;
            return (
              <View key={cat.id} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {cat.label}
                </Text>
                <View style={styles.grid}>{sounds.map(renderSoundCard)}</View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 20 },
  scroll: { flex: 1, marginHorizontal: -20 },
  header: { marginBottom: 16 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13, lineHeight: 18 },

  // Barra sticky (categorías de mezclas + tabs de sonido)
  stickyBar: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  // Secciones
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 14 },

  // Tabs de categorías de sonido (reducidos ~25%)
  tabsScroll: { marginBottom: 12, marginHorizontal: -20 },
  tabsRow: { gap: 6, paddingHorizontal: 20 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.2 },

  // Categorías de mezclas (reducidas ~25%)
  catRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  catCard: {
    flex: 1,
    height: 98,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  catIconWrap: {
    width: 33,
    height: 33,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  // Separador sutil
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 8,
    marginBottom: 24,
  },

  // Grilla de sonidos — 3 columnas uniformes sin espacio a la derecha
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
  // Al seleccionar: se inclina, se levanta (sombra) y crece un poco.
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

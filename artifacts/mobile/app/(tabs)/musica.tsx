import { Feather } from "@expo/vector-icons";
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
        style={[
          styles.soundCard,
          {
            backgroundColor: colors.card,
            borderColor: active ? colors.primary : "rgba(255,255,255,0.06)",
            borderWidth: active ? 2 : StyleSheet.hairlineWidth,
            opacity: available ? 1 : 0.55,
          },
        ]}
      >
        {/* Imagen — ocupa la parte superior cuadrada */}
        <View style={styles.cardImageWrap}>
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
            <View style={styles.lockBadge}>
              <Feather name="star" size={9} color="#18110C" />
            </View>
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 200 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mi Música</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tus mezclas, organizadas por momento
          </Text>
        </View>

        {/* ── Categorías de mezclas ── */}
        <View style={styles.catRow}>
          {MIX_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => router.push(`/mezclas/${cat.id}` as never)}
              style={[styles.catCard, { backgroundColor: "rgba(237,225,211,0.06)", borderColor: colors.border }]}
            >
              <View style={[styles.catIconWrap, { backgroundColor: "rgba(237,225,211,0.08)" }]}>
                <Feather name={cat.icon} size={22} color={colors.accent} />
              </View>
              <Text style={[styles.catLabel, { color: colors.foreground }]} numberOfLines={2}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Tabs de categorías de sonido ── */}
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
                    backgroundColor: selected ? colors.primary : "rgba(237,225,211,0.06)",
                    borderColor: selected ? colors.primary : colors.border,
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13, lineHeight: 18 },

  // Secciones
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },

  // Tabs de categorías de sonido
  tabsScroll: { marginBottom: 16, marginHorizontal: -20 },
  tabsRow: { gap: 8, paddingHorizontal: 20 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },

  // Categorías de mezclas
  catRow: { flexDirection: "row", gap: 10, marginBottom: 26 },
  catCard: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    textAlign: "center",
  },
  // Grilla de sonidos
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  soundCard: {
    width: "31%",
    borderRadius: 14,
    overflow: "hidden",
  },
  cardImageWrap: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: "100%" },
  cardImageInner: { borderRadius: 0 },
  cardFooter: {
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 6,
  },
  soundName: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  lockBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#D6A85B",
    alignItems: "center",
    justifyContent: "center",
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

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
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

import { MixerPanel } from "@/components/MixerPanel";
import { SacredBackground } from "@/components/SacredBackground";
import { getMixImage } from "@/config/mix-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { type MixCategory, getCategoryMeta } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";

export default function CategoryMixesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { presets, deletePreset, loadedPresetId, isPlaying } = useMixer();
  const loadMix = useLoadMix();

  const params = useLocalSearchParams<{ category: string }>();
  const categoryId = params.category as MixCategory;
  const meta = getCategoryMeta(categoryId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const userMixes = useMemo(
    () => presets.filter((p) => p.category === categoryId),
    [presets, categoryId],
  );

  const handleOpen = (mix: MixPreset) => {
    loadMix(mix);
  };

  const handleDelete = (mix: MixPreset) => {
    Alert.alert("Eliminar mezcla", `¿Eliminar "${mix.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deletePreset(mix.id) },
    ]);
  };

  const renderMix = (mix: MixPreset) => {
    const isPlayingThis = loadedPresetId === mix.id && isPlaying;
    return (
      <Pressable
        key={mix.id}
        onPress={() => handleOpen(mix)}
        onLongPress={() => handleDelete(mix)}
        style={[
          styles.mixRow,
          { backgroundColor: colors.card, borderColor: isPlayingThis ? colors.primary : colors.border },
        ]}
      >
        <ImageBackground
          source={getMixImage(mix.image)}
          style={styles.mixThumb}
          imageStyle={styles.mixThumbInner}
        >
          <View
            style={[
              styles.playBubble,
              { backgroundColor: isPlayingThis ? colors.primary : "rgba(24,17,12,0.55)" },
            ]}
          >
            <Feather name={isPlayingThis ? "pause" : "play"} size={14} color="#FFFFFF" />
          </View>
        </ImageBackground>

        <View style={styles.mixInfo}>
          <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
            {mix.name}
          </Text>
          {!!mix.description && (
            <Text style={[styles.mixDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {mix.description}
            </Text>
          )}
          {isPlayingThis ? (
            <View style={styles.playingRow}>
              <Feather name="volume-2" size={11} color={colors.primary} />
              <Text style={[styles.mixMeta, { color: colors.primary }]}>Reproduciendo...</Text>
            </View>
          ) : (
            <Text style={[styles.mixMeta, { color: colors.accent }]}>
              {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        <Pressable onPress={() => handleDelete(mix)} hitSlop={10} style={styles.trashBtn}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 200 + bottomPad, paddingTop: topPad + 12, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/mi-musica" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Hero de la categoría */}
        {meta && (
          <View style={styles.hero}>
            <ImageBackground source={meta.image} style={styles.heroImage} imageStyle={styles.heroImageInner}>
              <LinearGradient
                colors={["rgba(24,17,12,0.10)", "rgba(24,17,12,0.45)", "rgba(24,17,12,0.95)"]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroIconWrap}>
                  <Feather name={meta.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroLabel}>{meta.label}</Text>
                  <Text style={styles.heroSub}>{meta.subtitle}</Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        )}

        {/* Mezcla activa */}
        <MixerPanel currentCategory={categoryId} />

        {/* Mezclas del usuario */}
        {userMixes.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis mezclas</Text>
            {userMixes.map(renderMix)}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Todavía no guardaste mezclas en esta categoría.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: { borderRadius: 18, overflow: "hidden", marginBottom: 22 },
  heroImage: { height: 150, justifyContent: "flex-end" },
  heroImageInner: { borderRadius: 18 },
  heroContent: { padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(237,225,211,0.14)",
    borderWidth: 1,
    borderColor: "rgba(237,225,211,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { flex: 1 },
  heroLabel: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSub: { fontSize: 13, color: "rgba(237,225,211,0.9)", marginTop: 2 },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },
  emptyText: { fontSize: 13, lineHeight: 19 },

  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  mixThumb: { width: 56, height: 56, borderRadius: 12, overflow: "hidden", justifyContent: "center", alignItems: "center" },
  mixThumbInner: { borderRadius: 12 },
  playBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  mixInfo: { flex: 1 },
  mixName: { fontSize: 15, fontWeight: "700" },
  mixDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  mixMeta: { fontSize: 11, fontWeight: "600", marginTop: 4 },
  playingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  trashBtn: { padding: 4 },
});

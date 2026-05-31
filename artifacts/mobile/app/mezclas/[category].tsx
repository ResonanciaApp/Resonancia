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

import { SacredBackground } from "@/components/SacredBackground";
import { getMixImage } from "@/config/mix-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { getCuratedByCategory } from "@/data/curated-mixes";
import { type MixCategory, getCategoryMeta } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";

export default function CategoryMixesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { presets, deletePreset } = useMixer();
  const loadMix = useLoadMix();

  const params = useLocalSearchParams<{ category: string }>();
  const categoryId = params.category as MixCategory;
  const meta = getCategoryMeta(categoryId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const curated = useMemo(() => getCuratedByCategory(categoryId), [categoryId]);
  const userMixes = useMemo(
    () => presets.filter((p) => p.category === categoryId),
    [presets, categoryId],
  );

  const handleOpen = (mix: MixPreset) => {
    const ok = loadMix(mix);
    if (!ok) return;
    if (router.canGoBack()) router.back();
    else router.replace("/mi-musica" as never);
  };

  const handleDelete = (mix: MixPreset) => {
    Alert.alert("Eliminar mezcla", `¿Eliminar "${mix.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deletePreset(mix.id) },
    ]);
  };

  const renderMix = (mix: MixPreset) => (
    <Pressable
      key={mix.id}
      onPress={() => handleOpen(mix)}
      onLongPress={mix.isCurated ? undefined : () => handleDelete(mix)}
      style={[styles.mixRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <ImageBackground
        source={getMixImage(mix.image)}
        style={styles.mixThumb}
        imageStyle={styles.mixThumbInner}
      >
        <View style={[styles.playBubble, { backgroundColor: "rgba(24,17,12,0.55)" }]}>
          <Feather name="play" size={14} color="#FFFFFF" />
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
        <Text style={[styles.mixMeta, { color: colors.accent }]}>
          {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {!mix.isCurated && (
        <Pressable onPress={() => handleDelete(mix)} hitSlop={10} style={styles.trashBtn}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      )}
    </Pressable>
  );

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
                <Text style={styles.heroLabel}>{meta.label}</Text>
                <Text style={styles.heroSub}>{meta.subtitle}</Text>
              </View>
            </ImageBackground>
          </View>
        )}

        {/* Mezclas del usuario */}
        {userMixes.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis mezclas</Text>
            {userMixes.map(renderMix)}
          </View>
        )}

        {/* Mezclas sugeridas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sugeridas</Text>
          {curated.map(renderMix)}
        </View>
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
  heroContent: { padding: 16 },
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
  trashBtn: { padding: 4 },
});

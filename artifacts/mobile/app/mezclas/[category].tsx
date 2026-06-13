import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MixActionsSheet } from "@/components/MixActionsSheet";
import { MiniPlayer } from "@/components/MiniPlayer";
import { SacredBackground } from "@/components/SacredBackground";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { type MixCategory, getCategoryMeta } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";

const IMG_DESCANSO = require("../../assets/images/cat-descanso.png");
const IMG_MEDITACION = require("../../assets/images/cat-meditacion.png");

// ── Íconos de categoría ──────────────────────────────────────────
function MoonIcon({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </Svg>
  );
}

function ZenStonesIcon({ color, size = 40 }: { color: string; size?: number }) {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 30 30">
      <Ellipse cx="15" cy="23.5" rx="8" ry="4.2" fill={color} opacity={0.95} />
      <Ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill={color} opacity={0.85} />
      <Ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill={color} opacity={0.75} />
    </Svg>
  );
}

// ── Stack de imágenes ────────────────────────────────────────────
const THUMB = 44;
const SHIFT = 26;
const MAX_STACK = 2;

function SoundStack({ sounds }: { sounds: { id: string }[] }) {
  const colors = useColors();
  const visible = sounds.slice(0, MAX_STACK);
  const stackWidth = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  return (
    <View style={[styles.stackWrap, { width: stackWidth }]}>
      {visible.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View key={s.id} style={[styles.stackThumb, { left: i * SHIFT, zIndex: i }]}>
            {img ? (
              <Image source={img} style={styles.stackThumbImg} resizeMode="cover" />
            ) : (
              <View style={[styles.stackThumbImg, { backgroundColor: "rgba(212,175,55,0.15)" }]}>
                <Feather name="music" size={14} color={colors.primary} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function CategoryMixesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { presets, deletePreset, duplicatePreset, loadedPresetId, isPlaying, stopAll } = useMixer();
  const loadMix = useLoadMix();
  const { isPremium } = usePremium();

  const [menuMix, setMenuMix] = useState<MixPreset | null>(null);

  // Detener la mezcla al salir de la pantalla (volver al Mezclador)
  useFocusEffect(
    useCallback(() => {
      return () => { stopAll(); };
    }, [stopAll]),
  );

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

  const handleDuplicate = (mix: MixPreset) => {
    const countInCategory = presets.filter((p) => p.category === mix.category).length;
    if (!isPremium && countInCategory >= 1) {
      Alert.alert(
        "Mezclas ilimitadas con Premium",
        "En la versión gratuita podés guardar 1 mezcla por categoría. Hacete Premium para duplicar y guardar todas las que quieras.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
        ],
      );
      return;
    }
    duplicatePreset(mix.id);
  };


  const renderMix = (mix: MixPreset) => {
    const isPlayingThis = loadedPresetId === mix.id && isPlaying;
    return (
      <Pressable
        key={mix.id}
        onPress={() => handleOpen(mix)}
        style={[styles.mixRow, { backgroundColor: "rgba(74,12,12,0.08)" }]}
      >
        {/* Stack de imágenes de sonidos */}
        <SoundStack sounds={mix.sounds} />

        {/* Info */}
        <View style={styles.mixInfo}>
          <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
            {mix.name}
          </Text>
          {isPlayingThis ? (
            <View style={styles.playingRow}>
              <Feather name="bar-chart-2" size={12} color={colors.primary} />
              <Text style={[styles.mixMeta, { color: colors.primary }]}>Reproduciendo</Text>
            </View>
          ) : (
            <Text style={[styles.mixMeta, { color: colors.mutedForeground }]}>
              {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Indicador "activa" */}
        {isPlayingThis && (
          <Feather name="bar-chart-2" size={18} color={colors.primary} style={{ marginRight: 2 }} />
        )}

        {/* 3 puntitos */}
        <View onStartShouldSetResponder={() => true}>
          <Pressable
            onPress={() => setMenuMix(mix)}
            hitSlop={12}
            style={styles.menuBtn}
          >
            <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
          </Pressable>
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
        contentContainerStyle={{ paddingBottom: 200 + bottomPad, paddingTop: topPad + 12, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/musica" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Hero de la categoría */}
        {meta && (
          <View style={styles.hero}>
            <Text style={[styles.heroLabel, { color: colors.foreground }]}>{meta.label}</Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>{meta.subtitle}</Text>
          </View>
        )}

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

      <MixActionsSheet
        mix={menuMix}
        visible={menuMix !== null}
        onClose={() => setMenuMix(null)}
        onDuplicate={(mix) => { setMenuMix(null); handleDuplicate(mix); }}
        onDelete={(mix) => deletePreset(mix.id)}
      />

      {/* Reproductor flotante — mismo que en las tabs */}
      <View style={[styles.miniPlayerFloat, { bottom: 16 + bottomPad }]}>
        <MiniPlayer />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  miniPlayerFloat: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  hero: { alignItems: "center", marginBottom: 28, gap: 10 },
  heroIcon: { width: 44, height: 44 },
  heroLabel: { fontSize: 26, fontWeight: "700", letterSpacing: 0.3 },
  heroSub: { fontSize: 14, lineHeight: 20, textAlign: "center" },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },
  emptyText: { fontSize: 13, lineHeight: 19 },

  // ── Mix row ─────────────────────────────────────────────────────
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },

  // ── Stack ───────────────────────────────────────────────────────
  stackWrap: {
    height: THUMB,
    position: "relative",
    flexShrink: 0,
  },
  stackThumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  stackThumbImg: {
    width: THUMB,
    height: THUMB,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Info ────────────────────────────────────────────────────────
  mixInfo: { flex: 1, minWidth: 0 },
  mixName: { fontSize: 15, fontWeight: "700" },
  mixMeta: { fontSize: 12, marginTop: 3 },
  playingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },

  // ── Menú ────────────────────────────────────────────────────────
  menuBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});

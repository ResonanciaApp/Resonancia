import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Image,
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

import { useQueryClient } from "@tanstack/react-query";

import {
  getGetSharedMixesQueryKey,
  useShareMix,
  useUnshareMix,
} from "@workspace/api-client-react";

import { MixerPanel } from "@/components/MixerPanel";
import { SacredBackground } from "@/components/SacredBackground";
import { getSoundImage } from "@/config/sound-images";
import { useAuth } from "@/context/AuthContext";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { type MixCategory, getCategoryMeta } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";
import { getMixImage } from "@/config/mix-images";

// ── Stack de imágenes ────────────────────────────────────────────
const THUMB = 44;
const SHIFT = 26;
const MAX_STACK = 4;

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
              <View style={[styles.stackThumbImg, { backgroundColor: "rgba(182,149,95,0.15)" }]}>
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
  const { presets, deletePreset, duplicatePreset, setPresetShared, loadedPresetId, isPlaying } =
    useMixer();
  const loadMix = useLoadMix();
  const { isSignedIn } = useAuth();
  const { isPremium } = usePremium();
  const queryClient = useQueryClient();
  const shareMix = useShareMix();
  const unshareMix = useUnshareMix();

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

  const doShare = (mix: MixPreset) => {
    shareMix.mutate(
      {
        data: {
          name: mix.name,
          description: mix.description,
          image: mix.image,
          category: mix.category as "dormir" | "trabajar" | "motivarme" | "concentracion",
          sounds: mix.sounds.map((s) => ({ id: s.id, volume: s.volume })),
        },
      },
      {
        onSuccess: (shared) => {
          setPresetShared(mix.id, shared.id);
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
          Alert.alert("¡Compartida!", "Tu mezcla ya está disponible para la comunidad.");
        },
        onError: () => {
          Alert.alert("Error", "No se pudo compartir la mezcla. Intenta de nuevo.");
        },
      },
    );
  };

  const handleShare = (mix: MixPreset) => {
    if (!isSignedIn) {
      Alert.alert(
        "Crea tu cuenta",
        "Necesitas una cuenta para compartir tus mezclas con la comunidad.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Registrarme", onPress: () => router.push("/(auth)/sign-up" as never) },
        ],
      );
      return;
    }
    if (!isPremium) {
      Alert.alert(
        "Función Premium",
        "Compartir mezclas con la comunidad es una función exclusiva de Premium.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
        ],
      );
      return;
    }
    doShare(mix);
  };

  const handleUnshare = (mix: MixPreset) => {
    if (mix.sharedId == null) return;
    unshareMix.mutate(
      { id: mix.sharedId },
      {
        onSuccess: () => {
          setPresetShared(mix.id, null);
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
        },
        onError: () => {
          Alert.alert("Error", "No se pudo quitar la mezcla. Intenta de nuevo.");
        },
      },
    );
  };

  const handleMenu = (mix: MixPreset) => {
    Alert.alert(mix.name, undefined, [
      {
        text: mix.sharedId != null ? "Dejar de compartir" : "Compartir",
        onPress: () => (mix.sharedId != null ? handleUnshare(mix) : handleShare(mix)),
      },
      { text: "Duplicar", onPress: () => handleDuplicate(mix) },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          Alert.alert("Eliminar mezcla", `¿Eliminar "${mix.name}"?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", style: "destructive", onPress: () => deletePreset(mix.id) },
          ]),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const renderMix = (mix: MixPreset) => {
    const isPlayingThis = loadedPresetId === mix.id && isPlaying;
    return (
      <Pressable
        key={mix.id}
        onPress={() => handleOpen(mix)}
        style={[styles.mixRow, { backgroundColor: "rgba(255,255,255,0.06)" }]}
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
            onPress={() => handleMenu(mix)}
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
            <ImageBackground source={meta.image} style={styles.heroImage} imageStyle={styles.heroImageInner}>
              <LinearGradient
                colors={["rgba(24,17,12,0.10)", "rgba(24,17,12,0.45)", "rgba(24,17,12,0.95)"]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroIconWrap}>
                  <Feather name={meta.icon as React.ComponentProps<typeof Feather>["name"]} size={20} color="#FFFFFF" />
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
        <MixerPanel />

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

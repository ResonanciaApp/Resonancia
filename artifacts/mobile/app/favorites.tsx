import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { getSoundImage } from "@/config/sound-images";
import { usePlayer } from "@/context/PlayerContext";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";

// ── Mini-stack de imágenes de sonidos ────────────────────────────
const THUMB = 38;
const SHIFT = 22;
const MAX_STACK = 4;

function SoundStack({ sounds }: { sounds: { id: string }[] }) {
  const visible = sounds.slice(0, MAX_STACK);
  const stackWidth = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  return (
    <View style={{ width: stackWidth, height: THUMB, position: "relative" }}>
      {visible.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View key={s.id} style={[mixStyles.thumb, { left: i * SHIFT, zIndex: i }]}>
            {img ? (
              <Image source={img} style={mixStyles.thumbImg} resizeMode="cover" />
            ) : (
              <View style={[mixStyles.thumbImg, { backgroundColor: "rgba(182,149,95,0.15)" }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

function FavMixRow({ mix, onPress }: { mix: MixPreset; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        mixStyles.row,
        { backgroundColor: "rgba(255,255,255,0.06)", opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <SoundStack sounds={mix.sounds} />
      <View style={mixStyles.info}>
        <Text style={[mixStyles.name, { color: colors.foreground }]} numberOfLines={1}>
          {mix.name}
        </Text>
        <Text style={[mixStyles.meta, { color: colors.mutedForeground }]}>
          {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
        </Text>
      </View>
      <Feather name="play-circle" size={22} color={colors.primary} />
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = usePlayer();
  const { presets } = useMixer();
  const loadMix = useLoadMix();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const favSessions = useMemo(
    () => SESSIONS.filter((s) => favorites.includes(s.id) && s.categoryId !== "sabiduria-dia"),
    [favorites],
  );

  const favMixes = useMemo(
    () => presets.filter((p) => p.favorited),
    [presets],
  );

  const [query, setQuery] = useState("");

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favSessions;
    return favSessions.filter((s) => {
      const hay = [
        s.title,
        s.description,
        s.categoryLabel,
        s.sleepTag,
        ...(s.themeTag ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [favSessions, query]);

  const hasAnything = favSessions.length > 0 || favMixes.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: "rgba(255,255,255,0.04)" }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Favoritos</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tus viajes sonoros y reflexiones guardados
          </Text>
        </View>

        {/* Buscador (solo si hay sesiones) */}
        {favSessions.length > 0 && (
          <View
            style={[
              styles.searchWrap,
              {
                backgroundColor: "rgba(255,255,255,0.04)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255,255,255,0.07)",
              },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar en favoritos…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}

        {/* ── Mezclas favoritas ── */}
        {favMixes.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mezclas</Text>
            {favMixes.map((mix) => (
              <FavMixRow
                key={mix.id}
                mix={mix}
                onPress={() => {
                  loadMix(mix);
                  router.back();
                }}
              />
            ))}
          </View>
        )}

        {/* ── Sesiones favoritas ── */}
        <View style={styles.sectionBlock}>
          {favMixes.length > 0 && favSessions.length > 0 && (
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sesiones</Text>
          )}
          {favSessions.length === 0 ? (
            !hasAnything ? (
              <View style={[styles.emptySmall, { backgroundColor: colors.card }]}>
                <Feather name="heart" size={20} color={colors.border} />
                <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                  Aún no guardaste favoritos
                </Text>
                <Pressable
                  onPress={() => router.push("/(tabs)/explore" as never)}
                  style={styles.emptyLink}
                >
                  <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Explorar</Text>
                </Pressable>
              </View>
            ) : null
          ) : (
            <View>
              {filteredSessions.length === 0 ? (
                <View
                  style={[styles.emptySmall, { backgroundColor: "rgba(255,255,255,0.04)" }]}
                >
                  <Feather name="search" size={18} color={colors.border} />
                  <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                    Ninguna sesión coincide con tu búsqueda.
                  </Text>
                </View>
              ) : (
                filteredSessions.map((s) => (
                  <SessionCard key={s.id} session={s} horizontal />
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Estilos mezclas ──────────────────────────────────────────────
const mixStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  thumbImg: { width: THUMB, height: THUMB, borderRadius: 8 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 3 },
});

// ── Estilos pantalla ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { marginBottom: 20 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },
  sectionBlock: { marginBottom: 32 },
  emptySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  emptySmallText: { fontSize: 13, flex: 1 },
  emptyLink: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyLinkText: { fontSize: 12, fontWeight: "600" },
});

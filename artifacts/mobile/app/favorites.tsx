import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState, useMemo } from "react";
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
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

import { LinearGradient } from "expo-linear-gradient";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { VideoActionsSheet } from "@/components/VideoActionsSheet";
import { VideoCard } from "@/components/VideoCard";
import { getSoundImage } from "@/config/sound-images";
import { usePlayer } from "@/context/PlayerContext";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useVideosState } from "@/context/VideosContext";
import { SESSIONS } from "@/data/sessions";
import { type VideoItem } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";
import { useVideos } from "@/hooks/useVideos";

// ── Constantes ────────────────────────────────────────────────────
const TABS = [
  { id: "sesiones" as const, label: "Sesiones" },
  { id: "mezclas"  as const, label: "Mezclas"  },
  { id: "videos"   as const, label: "Videos"   },
  { id: "musica"   as const, label: "Música"   },
];
type TabId = (typeof TABS)[number]["id"];

const TAB_INDICATOR_COLOR = "#dad4ec";

// ── Mini-stack de imágenes de sonidos (interactivo) ──────────────
const THUMB = 38;
const SHIFT = 22;
const SHIFT_OPEN = 50;
const MAX_STACK = 4;

function SoundStack({ sounds }: { sounds: { id: string }[] }) {
  const [open, setOpen] = useState(false);
  const openAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.timing(openAnim, {
      toValue: next ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const visible = sounds.slice(0, MAX_STACK);
  const wStacked = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  const wOpen    = THUMB + Math.max(0, visible.length - 1) * SHIFT_OPEN;
  const animWidth = openAnim.interpolate({ inputRange: [0, 1], outputRange: [wStacked, wOpen] });

  return (
    <Pressable
      onPress={(e) => { e.stopPropagation(); toggle(); }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={open ? "Colapsar sonidos" : "Ver sonidos"}
    >
      <Animated.View style={{ width: animWidth, height: THUMB, position: "relative" }}>
        {visible.map((s, i) => {
          const img = getSoundImage(s.id);
          const leftAnim = openAnim.interpolate({
            inputRange:  [0, 1],
            outputRange: [i * SHIFT, i * SHIFT_OPEN],
          });
          return (
            <Animated.View key={s.id} style={[mixStyles.thumb, { left: leftAnim, zIndex: i }]}>
              {img ? (
                <Image source={img} style={mixStyles.thumbImg} resizeMode="cover" />
              ) : (
                <View style={[mixStyles.thumbImg, { backgroundColor: "rgba(212,175,55,0.15)" }]} />
              )}
            </Animated.View>
          );
        })}
      </Animated.View>
    </Pressable>
  );
}

function FavMixRow({ mix, onPress }: { mix: MixPreset; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        mixStyles.row,
        { backgroundColor: "rgba(74,12,12,0.08)", opacity: pressed ? 0.8 : 1 },
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
  const { favoriteVideoIds } = useVideosState();
  const { videos: allVideos } = useVideos();
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Tab state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>("sesiones");
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  const onTabLayout = (idx: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[idx] = { x, width };
    if (idx === 0) {
      setIndicatorWidth(width);
      indicatorAnim.setValue(x);
    }
  };

  const selectTab = (id: TabId, idx: number) => {
    setActiveTab(id);
    const layout = tabLayouts.current[idx];
    if (layout) {
      setIndicatorWidth(layout.width);
      Animated.timing(indicatorAnim, {
        toValue: layout.x,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  };

  // ── Datos ─────────────────────────────────────────────────────
  const favSessions = useMemo(
    () => SESSIONS.filter((s) => favorites.includes(s.id)),
    [favorites],
  );

  const favMixes = useMemo(
    () => presets.filter((p) => p.favorited),
    [presets],
  );

  const favVideos = useMemo(
    () => allVideos.filter((v) => favoriteVideoIds.includes(v.id)),
    [allVideos, favoriteVideoIds],
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

  const filteredMixes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favMixes;
    return favMixes.filter((m) => {
      const hay = [m.name, m.description, ...m.sounds.map((s) => s.id)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [favMixes, query]);

  const searchBar = (
    <View
      style={[
        styles.searchWrap,
        {
          backgroundColor: "rgba(74,12,12,0.08)",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(61,14,22,0.40)",
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
  );

  // ── Render por tab ────────────────────────────────────────────
  const renderSesiones = () => (
    <View>
      {favSessions.length > 0 && searchBar}
      {favSessions.length === 0 ? (
        <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
          <Feather name="heart" size={20} color={colors.border} />
          <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
            Aún no guardaste sesiones favoritas
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/explore" as never)}
            style={styles.emptyLink}
          >
            <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Explorar</Text>
          </Pressable>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
          <Feather name="search" size={18} color={colors.border} />
          <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
            Ninguna sesión coincide con tu búsqueda.
          </Text>
        </View>
      ) : (
        filteredSessions.map((s) => <SessionCard key={s.id} session={s} horizontal />)
      )}
    </View>
  );

  const renderMezclas = () => (
    <View>
      {favMixes.length > 0 && searchBar}
      {favMixes.length === 0 ? (
        <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
          <Feather name="heart" size={20} color={colors.border} />
          <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
            Aún no guardaste mezclas favoritas
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/musica" as never)}
            style={styles.emptyLink}
          >
            <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Ir al Mezclador</Text>
          </Pressable>
        </View>
      ) : filteredMixes.length === 0 ? (
        <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
          <Feather name="search" size={18} color={colors.border} />
          <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
            Ninguna mezcla coincide con tu búsqueda.
          </Text>
        </View>
      ) : (
        filteredMixes.map((mix) => (
          <FavMixRow
            key={mix.id}
            mix={mix}
            onPress={() => {
              loadMix(mix);
              router.back();
            }}
          />
        ))
      )}
    </View>
  );

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favVideos;
    return favVideos.filter((v) => {
      const hay = [v.title, v.subtitle, v.description, v.author]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [favVideos, query]);

  const renderVideos = () => (
    <View>
      {favVideos.length > 0 && searchBar}
      {favVideos.length === 0 ? (
        <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
          <Feather name="heart" size={20} color={colors.border} />
          <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
            Aún no guardaste videos favoritos
          </Text>
          <Pressable
            onPress={() => router.push("/videos" as never)}
            style={styles.emptyLink}
          >
            <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Ver videos</Text>
          </Pressable>
        </View>
      ) : filteredVideos.length === 0 ? (
        <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
          <Feather name="search" size={18} color={colors.border} />
          <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
            Ningún video coincide con tu búsqueda.
          </Text>
        </View>
      ) : (
        filteredVideos.map((v) => (
          <VideoCard
            key={v.id}
            video={v}
            horizontal
            onOptionsPress={() => setActionsVideo(v)}
          />
        ))
      )}
    </View>
  );

  const renderMusica = () => (
    <View style={[styles.emptySmall, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
      <Feather name="music" size={20} color={colors.border} />
      <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
        Próximamente
      </Text>
    </View>
  );

  return (
    <LinearGradient
      style={styles.root}
      colors={["#340D1A", "#190913"]}
      locations={[0, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar hidden />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: "rgba(74,12,12,0.08)" }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Título */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Favoritos</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Aquí guardas lo que te encanta
          </Text>
        </View>

        {/* ── Tabs ── */}
        <View
          style={[
            styles.tabBar,
            { borderBottomColor: "rgba(61,14,22,0.40)" },
          ]}
        >
          {TABS.map(({ id, label }, idx) => (
            <Pressable
              key={id}
              onLayout={(e) => onTabLayout(idx, e)}
              onPress={() => selectTab(id, idx)}
              style={styles.tabItem}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: id === activeTab ? colors.foreground : colors.mutedForeground,
                    fontWeight: id === activeTab ? "600" : "400",
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
          {indicatorWidth > 0 && (
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  width: indicatorWidth,
                  backgroundColor: TAB_INDICATOR_COLOR,
                  transform: [{ translateX: indicatorAnim }],
                },
              ]}
            />
          )}
        </View>

        {/* ── Contenido del tab activo ── */}
        <View style={{ marginTop: 20 }}>
          {activeTab === "sesiones" && renderSesiones()}
          {activeTab === "mezclas"  && renderMezclas()}
          {activeTab === "videos"   && renderVideos()}
          {activeTab === "musica"   && renderMusica()}
        </View>
      </ScrollView>

      <VideoActionsSheet
        video={actionsVideo}
        visible={actionsVideo !== null}
        onClose={() => setActionsVideo(null)}
      />
    </LinearGradient>
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
  name: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700" },
  meta: { fontFamily: "Manrope", fontSize: 12, marginTop: 3 },
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

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
    marginBottom: 0,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },

  // Búsqueda
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginBottom: 16,
  },
  searchInput: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 14,
    padding: 0,
  },

  // Textos
  pageTitle: { fontFamily: "Manrope", fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontFamily: "Manrope", fontSize: 13 },

  // Empty
  emptySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  emptySmallText: { fontFamily: "Manrope", fontSize: 13, flex: 1 },
  emptyLink: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyLinkText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600" },
});

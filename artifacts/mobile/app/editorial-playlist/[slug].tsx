import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { EqualizerBars } from "@/components/EqualizerBars";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import {
  fetchEditorialPlaylist,
  EditorialPlaylistFetchError,
  PLAYLISTS,
  type PlaylistSnapshot,
} from "@/data/playlists";
import { getSessionById, type Session } from "@/data/sessions";
import { resolveAvatarUrl } from "@/lib/avatar";
import {
  classifyEditorialDetailStatus,
  parseEditorialPlaylistCache,
  pickRandomQueueStart,
} from "@/lib/editorial-playlist-helpers";
import { useSceneTheme } from "@/context/SceneThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DETAIL_CACHE_PREFIX = "@resonance_editorial_playlist_detail:";
const OWNER_PREFIX = "editorial:";

type EditorialPlaylistScreenProps = { slug?: string };

function resolveSlug(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getAuthor(session: Session): string {
  if (session.guideId) return getGuide(session.guideId).name;
  if (session.artistId) return getArtist(session.artistId).name;
  return "Resonancia";
}

export default function EditorialPlaylistScreen({ slug: slugProp }: EditorialPlaylistScreenProps = {}) {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = slugProp ?? resolveSlug(params.slug);
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { version: catalogVersion } = useCatalog();
  const { isPremium } = usePremium();
  const {
    isEditorialPlaylistSaved,
    toggleEditorialPlaylist,
  } = useFoldersPlaylists();
  const {
    currentSession,
    activePlaylistOwner,
    playSessionInPlaylist,
    pauseResume,
    isPlaying,
  } = usePlayer();
  const backOverride = useBackOverride();
  const [remotePlaylist, setRemotePlaylist] = useState<PlaylistSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [authoritativeMissing, setAuthoritativeMissing] = useState(false);

  const bundledPlaylist = useMemo(
    () => PLAYLISTS.find((playlist) => playlist.id === slug),
    [slug, catalogVersion],
  );

  useEffect(() => {
    let cancelled = false;
    setRemotePlaylist(null);
    setAuthoritativeMissing(false);
    if (!slug) return () => { cancelled = true; };
    const cacheKey = `${DETAIL_CACHE_PREFIX}${slug}`;

    void (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && !cancelled) {
          const parsed = parseEditorialPlaylistCache<PlaylistSnapshot>(cached);
          if (parsed) setRemotePlaylist(parsed);
        }
      } catch {
        // Unreadable cache: the catalog snapshot remains the fallback.
      }

      try {
        if (!cancelled) setLoading(true);
        const fresh = await fetchEditorialPlaylist(slug);
        if (cancelled) return;
        setRemotePlaylist(fresh);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
      } catch (caught) {
        // 404/410 son una respuesta autoritativa: no permitimos que un
        // snapshot cacheado siga apareciendo como si estuviera publicado.
        // Los errores transitorios conservan el último valor válido.
        if (
          caught instanceof EditorialPlaylistFetchError &&
          classifyEditorialDetailStatus(caught.status) === "missing"
        ) {
          await AsyncStorage.removeItem(cacheKey).catch(() => {});
          if (!cancelled) {
            setRemotePlaylist(null);
            setAuthoritativeMissing(true);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const playlist = useMemo(() => {
    if (!slug || authoritativeMissing) return null;
    const snapshot = remotePlaylist;
    const base = bundledPlaylist;
    if (!snapshot && !base) return null;
    const title = snapshot?.title ?? base?.title ?? slug;
    const description = snapshot?.description ?? base?.description ?? "";
    const sessionIds = snapshot?.sessionIds ?? base?.sessionIds ?? [];
    const coverUrl = resolveAvatarUrl(snapshot?.coverUrl ?? base?.coverUrl ?? null);
    return {
      id: slug,
      title,
      description: description ?? "",
      sessionIds,
      durationLabel: snapshot?.durationLabel ?? base?.durationLabel ?? "",
      editorialType: snapshot?.editorialType ?? base?.editorialType ?? "meditative",
      coverUrl,
      cover: base?.cover,
    };
  }, [authoritativeMissing, bundledPlaylist, remotePlaylist, slug]);

  const rows = useMemo(
    () =>
      (playlist?.sessionIds ?? []).map((id) => ({
        id,
        session: getSessionById(id),
      })),
    [playlist?.sessionIds, catalogVersion],
  );
  const availableRows = useMemo(
    () =>
      rows.filter(
        (row): row is { id: string; session: Session } =>
          !!row.session && (!row.session.isPremium || isPremium),
      ),
    [isPremium, rows],
  );
  const playableIds = useMemo(
    () => availableRows.map((row) => row.session.id),
    [availableRows],
  );
  const owner = slug ? `${OWNER_PREFIX}${slug}` : null;
  const ownsQueue = !!owner && activePlaylistOwner === owner;
  const currentIsEditorial = ownsQueue && !!currentSession &&
    rows.some((row) => row.id === currentSession.id);
  const displayIsPlaying = currentIsEditorial && isPlaying;

  const goBack = () => {
    if (backOverride) {
      backOverride();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/explore" as never);
    }
  };

  const playFrom = (session: Session, shuffle = false) => {
    if (!owner || playableIds.length === 0) return;
    playSessionInPlaylist(session, playableIds, owner, shuffle);
  };

  const handlePlayAll = () => {
    if (!playableIds.length) {
      if (rows.some((row) => row.session?.isPremium)) {
        router.push("/membresia" as never);
      } else {
        Alert.alert("Selección no disponible", "Esta selección no tiene sesiones reproducibles.");
      }
      return;
    }
    if (displayIsPlaying) {
      pauseResume();
      return;
    }
    const first = pickRandomQueueStart(availableRows)?.session;
    if (first) playFrom(first);
  };

  const handleShuffle = () => {
    if (!playableIds.length) {
      handlePlayAll();
      return;
    }
    const first = availableRows[0]?.session;
    if (first) playFrom(first, true);
  };

  const handleRowPress = (row: { id: string; session?: Session }) => {
    if (!row.session) return;
    if (row.session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (ownsQueue && currentSession?.id === row.session.id) {
      pauseResume();
      return;
    }
    playFrom(row.session);
  };

  if (!playlist) {
    return (
      <View style={[styles.root, { backgroundColor: theme.solid }]}>
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
        <View style={styles.empty}>
          <Feather name="list" size={42} color={COLORS.muted} />
          <Text style={styles.emptyTitle}>Selección no disponible</Text>
          <Text style={styles.emptyBody}>
            Esta playlist editorial ya no está publicada.
          </Text>
          <Pressable onPress={goBack} style={styles.backTextButton}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const saved = isEditorialPlaylistSaved(playlist.id);
  const coverSource = playlist.coverUrl ? { uri: playlist.coverUrl } : null;

  return (
    <View style={[styles.root, { backgroundColor: theme.solid }]}>
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <StatusBar hidden />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 8 }]}>
          <Pressable
            onPress={goBack}
            hitSlop={12}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Feather name="chevron-left" size={28} color={COLORS.text} />
          </Pressable>
          <View style={styles.headerSpacer} />
          <Pressable
            onPress={() => Share.share({ message: `Escucha "${playlist.title}" en Resonancia.` })}
            hitSlop={12}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Más opciones"
            testID="editorial-playlist-menu"
          >
            <Feather name="more-horizontal" size={24} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.cover}>
            {coverSource ? (
              <Image
                source={coverSource}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.missingCover}>
                <Feather name="image" size={42} color={COLORS.gold} />
                <Text style={styles.missingCoverText}>Sin portada</Text>
              </View>
            )}
          </View>
          <View style={styles.titleBlock}>
            <View style={styles.titleLine}>
              <Text style={styles.title} numberOfLines={3}>{playlist.title}</Text>
              <Pressable
                onPress={() => toggleEditorialPlaylist(playlist.id)}
                hitSlop={10}
                style={styles.heartButton}
                accessibilityRole="button"
                accessibilityLabel={saved ? "Quitar de Biblioteca" : "Guardar en Biblioteca"}
                testID="editorial-playlist-save"
              >
                <Feather
                  name="heart"
                  size={23}
                  color={saved ? COLORS.gold : COLORS.text}
                  fill={saved ? COLORS.gold : "transparent"}
                />
              </Pressable>
            </View>
            <View style={styles.creatorRow}>
              <Image
                source={require("../../assets/images/logo-resonancia.png")}
                style={styles.creatorAvatar}
                contentFit="cover"
              />
              <View>
                <Text style={styles.creatorName}>Resonancia</Text>
                <Text style={styles.creatorCaption}>Selección especial de Resonancia</Text>
              </View>
            </View>
          </View>
        </View>

        {!!playlist.description && (
          <Text style={styles.description}>{playlist.description}</Text>
        )}

        <View style={styles.controls}>
          <Pressable
            onPress={handlePlayAll}
            style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.82 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={displayIsPlaying ? "Pausar selección" : "Reproducir selección"}
            testID="editorial-playlist-play"
          >
            <Feather name={displayIsPlaying ? "pause" : "play"} size={17} color={COLORS.navy} />
            <Text style={styles.playButtonText}>{displayIsPlaying ? "Pausar" : "Reproducir"}</Text>
          </Pressable>
          <Pressable
            onPress={handleShuffle}
            style={({ pressed }) => [styles.shuffleButton, { opacity: pressed ? 0.78 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Reproducir aleatoriamente"
            testID="editorial-playlist-shuffle"
          >
            <Text style={styles.shuffleText}>Aleatorio</Text>
            <Feather name="shuffle" size={16} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.divider} />
        <View style={styles.sessionList}>
          {rows.length === 0 && (
            <Text style={styles.unavailablePlaylist}>
              Esta selección todavía no tiene sesiones disponibles.
            </Text>
          )}
          {rows.map((row) => (
            <EditorialSessionRow
              key={row.id}
              session={row.session}
              isPremium={isPremium}
              isActive={currentIsEditorial && currentSession?.id === row.id}
              isPlaying={displayIsPlaying && currentSession?.id === row.id}
              onPress={() => handleRowPress(row)}
            />
          ))}
        </View>
        {loading && <Text style={styles.refreshing}>Actualizando selección…</Text>}
      </ScrollView>
    </View>
  );
}

function EditorialSessionRow({
  session,
  isPremium,
  isActive,
  isPlaying,
  onPress,
}: {
  session?: Session;
  isPremium: boolean;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
}) {
  const locked = !!session?.isPremium && !isPremium;
  return (
    <Pressable
      onPress={onPress}
      disabled={!session}
      style={({ pressed }) => [styles.sessionRow, { opacity: pressed ? 0.76 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={session?.title ?? "Sesión no disponible"}
    >
      <View style={styles.sessionThumb}>
        {session ? (
          <Image
            source={session.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
        ) : (
          <Feather name="slash" size={19} color={COLORS.muted} />
        )}
        {session && <SessionDurationBadge label={session.durationLabel} style={styles.rowDuration} />}
        {locked && (
          <View style={styles.lockBadge}>
            <Feather name="lock" size={10} color={COLORS.text} />
          </View>
        )}
      </View>
      <View style={styles.sessionCopy}>
        {session ? (
          <>
            <Text style={[styles.sessionTitle, isActive && styles.sessionTitleActive]} numberOfLines={2}>
              {session.title}
            </Text>
            <Text style={styles.sessionMeta} numberOfLines={1}>
              {session.categoryLabel} · {getAuthor(session)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.sessionTitle}>Sesión no disponible</Text>
            <Text style={styles.sessionMeta}>Ya no forma parte del catálogo</Text>
          </>
        )}
      </View>
      {isPlaying && <EqualizerBars color={COLORS.gold} size="sm" />}
      {isActive && !isPlaying && <Feather name="pause" size={17} color={COLORS.gold} />}
    </Pressable>
  );
}

const COLORS = {
  text: "#FBFBFB",
  muted: "rgba(251,251,251,0.62)",
  gold: "#BE9650",
  navy: "#060A0F",
  line: "rgba(190,150,80,0.24)",
  card: "rgba(190,150,80,0.06)",
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  headerSpacer: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    gap: 18,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
  },
  cover: {
    width: 138,
    height: 138,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.line,
  },
  missingCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  missingCoverText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  titleBlock: { flex: 1, gap: 15 },
  titleLine: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  title: {
    flex: 1,
    color: COLORS.text,
    fontFamily: "Manrope",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "700",
  },
  heartButton: { paddingTop: 4, width: 30, alignItems: "center" },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  creatorAvatar: { width: 31, height: 31, borderRadius: 16 },
  creatorName: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  creatorCaption: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  description: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 20,
    marginTop: 22,
  },
  controls: {
    paddingHorizontal: 20,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: COLORS.gold,
  },
  playButtonText: { color: COLORS.navy, fontSize: 14, fontWeight: "700" },
  shuffleButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(251,251,251,0.35)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  shuffleText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.line,
    marginHorizontal: 20,
    marginTop: 24,
  },
  sessionList: { paddingHorizontal: 20 },
  sessionRow: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(251,251,251,0.14)",
  },
  sessionThumb: {
    width: 62,
    height: 62,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  rowDuration: { position: "absolute", bottom: 5, left: 5 },
  lockBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  sessionCopy: { flex: 1, gap: 6 },
  sessionTitle: { color: COLORS.text, fontSize: 14, lineHeight: 19, fontWeight: "600" },
  sessionTitleActive: { color: COLORS.gold },
  sessionMeta: { color: COLORS.muted, fontSize: 12 },
  unavailablePlaylist: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 28,
  },
  refreshing: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    paddingTop: 18,
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 35 },
  emptyTitle: { color: COLORS.text, fontSize: 19, fontWeight: "700", marginTop: 14 },
  emptyBody: { color: COLORS.muted, fontSize: 14, textAlign: "center", marginTop: 8 },
  backTextButton: { marginTop: 22, padding: 10 },
  backText: { color: COLORS.gold, fontSize: 15, fontWeight: "700" },
});

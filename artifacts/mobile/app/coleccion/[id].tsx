import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MiniPlayer } from "@/components/MiniPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { getPlaylistById } from "@/data/playlists";
import { getSessionById } from "@/data/sessions";

const { width } = Dimensions.get("window");
const SAVED_KEY = "@resonance_saved_colecciones";

const BG = "#0B0F14";
const GOLD = "#BE9650";
const FG = "#EDE1D3";
const MUTED = "#7A8FA8";

export default function ColeccionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { playSession, currentSession } = usePlayer();
  const [saved, setSaved] = useState(false);

  const playlist = getPlaylistById(id ?? "");

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY).then((val) => {
      if (!val) return;
      const ids: string[] = JSON.parse(val);
      setSaved(ids.includes(id ?? ""));
    });
  }, [id]);

  const toggleSave = async () => {
    const val = await AsyncStorage.getItem(SAVED_KEY);
    const ids: string[] = val ? JSON.parse(val) : [];
    const next = saved ? ids.filter((x) => x !== id) : [...ids, id ?? ""];
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaved(!saved);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = async () => {
    if (!playlist) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      message: `🎵 Escucha "${playlist.title}" en RESONANCIA — meditación y sonido.`,
    });
  };

  if (!playlist) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: MUTED }}>Colección no encontrada</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: GOLD }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const sessions = playlist.sessionIds
    .map((sid) => getSessionById(sid))
    .filter((s): s is NonNullable<typeof s> => !!s);

  const handlePlay = (sessionId: string) => {
    const s = getSessionById(sessionId);
    if (!s) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    playSession(s);
  };

  const handleShuffle = () => {
    if (sessions.length === 0) return;
    const random = sessions[Math.floor(Math.random() * sessions.length)];
    handlePlay(random.id);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const miniPlayerVisible = !!currentSession;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad + (miniPlayerVisible ? 88 : 32) }}
      >
        {/* ── Portada ─────────────────────────────────────────────────── */}
        <View style={styles.coverWrap}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Image source={playlist.cover as any} style={styles.cover} contentFit="cover" />
          <LinearGradient
            colors={["transparent", BG]}
            locations={[0.4, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={[styles.backBtn, { top: topPad + 8 }]}
          >
            <Feather name="chevron-left" size={28} color="white" />
          </Pressable>
          <Text style={styles.coverTitle}>{playlist.title}</Text>
        </View>

        {/* ── Meta ────────────────────────────────────────────────────── */}
        <View style={styles.meta}>
          <Text style={styles.description}>{playlist.description}</Text>
          <View style={styles.hechaRow}>
            <View style={styles.goldDot} />
            <Text style={styles.hechaText}>
              Hecha por <Text style={styles.hechaLabel}>Resonancia</Text>
            </Text>
          </View>
          <Text style={styles.savedCount}>
            {playlist.savedCount.toLocaleString("es-ES")} veces guardada{"  •  "}{playlist.durationLabel}
          </Text>
        </View>

        {/* ── Acciones ────────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          <View style={styles.actionLeft}>
            {sessions[0] && (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Image source={sessions[0].image as any} style={styles.miniCover} contentFit="cover" />
            )}
            <Pressable onPress={toggleSave} hitSlop={10}>
              <Feather
                name={saved ? "check-circle" : "plus-circle"}
                size={26}
                color={saved ? GOLD : MUTED}
              />
            </Pressable>
            <Pressable hitSlop={10}>
              <Feather name="download" size={24} color={MUTED} />
            </Pressable>
            <Pressable hitSlop={10} onPress={handleShare}>
              <Feather name="more-horizontal" size={24} color={MUTED} />
            </Pressable>
          </View>
          <View style={styles.actionRight}>
            <Pressable hitSlop={10} onPress={handleShuffle}>
              <Feather name="shuffle" size={24} color={MUTED} />
            </Pressable>
            <Pressable
              style={styles.playCircle}
              onPress={() => sessions[0] && handlePlay(sessions[0].id)}
            >
              <Feather name="play" size={26} color={BG} style={{ marginLeft: 3 }} />
            </Pressable>
          </View>
        </View>

        {/* ── Pistas ──────────────────────────────────────────────────── */}
        <View style={styles.trackList}>
          {sessions.map((s) => {
            const creator =
              s.categoryId === "meditaciones-guiadas"
                ? getGuide(s.guideId)
                : getArtist(s.artistId);
            return (
              <Pressable
                key={s.id}
                style={({ pressed }) => [styles.trackRow, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => handlePlay(s.id)}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Image source={s.image as any} style={styles.trackThumb} contentFit="cover" />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>{creator.name}</Text>
                </View>
                <Pressable hitSlop={12} style={styles.trackMore}>
                  <Feather name="more-vertical" size={18} color={MUTED} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Mini player ─────────────────────────────────────────────── */}
      {miniPlayerVisible && (
        <View style={[styles.miniPlayerWrap, { bottom: bottomPad + 4 }]}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  coverWrap: { width, height: width, position: "relative" },
  cover: { width, height: width },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  coverTitle: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    fontSize: 30,
    fontWeight: "800",
    color: FG,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  meta: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  description: { fontSize: 14, color: MUTED, lineHeight: 21, marginBottom: 12 },
  hechaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  goldDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: GOLD,
  },
  hechaText: { fontSize: 13, color: MUTED },
  hechaLabel: { color: FG, fontWeight: "600" },
  savedCount: { fontSize: 12, color: MUTED, marginTop: 2 },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionLeft: { flexDirection: "row", alignItems: "center", gap: 18 },
  actionRight: { flexDirection: "row", alignItems: "center", gap: 18 },
  miniCover: { width: 44, height: 44, borderRadius: 8 },
  playCircle: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: "center", justifyContent: "center",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },

  trackList: { paddingHorizontal: 16, paddingTop: 8 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(190,150,80,0.06)",
  },
  trackThumb: {
    width: 52, height: 52, borderRadius: 8,
    backgroundColor: "rgba(190,150,80,0.05)",
  },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 14, fontWeight: "600", color: FG, marginBottom: 3 },
  trackArtist: { fontSize: 12, color: MUTED },
  trackMore: { paddingHorizontal: 4 },

  miniPlayerWrap: {
    position: "absolute",
    left: 0, right: 0,
    paddingHorizontal: 12,
  },
});

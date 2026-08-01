import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient } from "@/components/GoldGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBadge } from "@/components/PremiumBadge";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getArtistById, getArtistSessions } from "@/data/artists";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const PHOTO_SIZE = 120;

export default function ArtistaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { id } = useLocalSearchParams<{ id: string }>();

  const artist = getArtistById(id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!artist) {
    return (
      <View style={[styles.root, { backgroundColor: "#210911" }]}>
        <StatusBar hidden />
        <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Feather name="user-x" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Artista no encontrado</Text>
          <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
            Este perfil no existe o fue removido.
          </Text>
        </View>
      </View>
    );
  }

  const sessions = getArtistSessions(artist.id);

  const handlePlay = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    playSession(session);
    router.push("/player" as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#060905" }]}>
      <StatusBar hidden />
      <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Profile */}
        <View style={styles.profile}>
          <View style={styles.photoWrap}>
            <ExpoImage
              source={artist.photo as any}
              style={styles.photo}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
            {artist.certified && (
              <GoldGradient style={[styles.badge, { borderColor: "#1B060F" }]}>
                <Feather name="check" size={15} color="#1B060F" />
              </GoldGradient>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{artist.name}</Text>
          </View>

          {artist.certified && (
            <View style={[styles.certChip, { backgroundColor: "rgba(212,175,55,0.16)" }]}>
              <Feather name="award" size={12} color={colors.primary} />
              <Text style={[styles.certText, { color: colors.primary }]}>Artista certificado</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{artist.country}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Feather name="music" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{artist.genre}</Text>
            </View>
          </View>

          <Text style={[styles.trackCount, { color: colors.accent }]}>
            {sessions.length} {sessions.length === 1 ? "pista" : "pistas"} en la app
          </Text>
        </View>

        {/* Bio */}
        {!!artist.bio && (
          <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
            <Text style={[styles.bio, { color: colors.mutedForeground }]}>{artist.bio}</Text>
          </View>
        )}

        {/* Links */}
        {artist.links && artist.links.length > 0 && (
          <View style={[styles.linksRow, { paddingHorizontal: H_PAD }]}>
            {artist.links.map((link) => (
              <Pressable
                key={link.url}
                onPress={() => Linking.openURL(link.url)}
                style={[styles.linkChip, { borderColor: "rgba(61,14,22,0.40)" }]}
              >
                <Feather name="external-link" size={13} color={colors.foreground} />
                <Text style={[styles.linkText, { color: colors.foreground }]}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Sessions */}
        <View style={[styles.section, { paddingHorizontal: H_PAD, marginTop: 22 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sus pistas</Text>

          {sessions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              Este artista todavía no tiene pistas publicadas.
            </Text>
          ) : (
            sessions.map((session) => {
              const locked = session.isPremium && !isPremium;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => handlePlay(session.id)}
                  style={({ pressed }) => [
                    styles.trackRow,
                    { backgroundColor: "rgba(74,12,12,0.08)", opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View style={styles.trackImgWrap}>
                    <ExpoImage
                      source={session.image as any}
                      style={styles.trackImg}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <PremiumBadge session={session} size={16} top={4} right={4} />
                  </View>
                  <View style={styles.trackMeta}>
                    <Text style={[styles.trackTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={[styles.trackSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {session.soundTag ?? session.subtitle} · {session.durationLabel}
                    </Text>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: "rgba(212,175,55,0.18)" }]}>
                    <Feather name={locked ? "lock" : "play"} size={15} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },

  profile: { alignItems: "center", paddingHorizontal: H_PAD, marginBottom: 6 },
  photoWrap: { width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 14 },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  badge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontFamily: "Manrope", fontSize: 24, fontWeight: "700", letterSpacing: 0.3 },
  certChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 8,
  },
  certText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 10, flexWrap: "wrap", justifyContent: "center" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Manrope", fontSize: 12 },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.30)", marginHorizontal: 8 },
  trackCount: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", marginTop: 10 },

  section: {},
  bio: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 16 },

  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 },
  linkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  linkText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 },
  empty: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21 },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  trackImgWrap: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", marginRight: 12 },
  trackImg: { width: 52, height: 52 },
  trackMeta: { flex: 1, marginRight: 10 },
  trackTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  trackSub: { fontFamily: "Manrope", fontSize: 12, marginTop: 3 },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },
});

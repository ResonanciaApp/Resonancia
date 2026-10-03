import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DrawerStats } from "@/components/DrawerStats";
import { useSceneTheme } from "@/context/SceneThemeContext";

import { BackPill } from "@/components/BackPill";
import { GhostPill } from "@/components/GhostPill";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { type ExternalProject, type Resonador } from "@/data/resonadores";
import { useResonadorById } from "@/hooks/useResonadores";
import { getSessionById, type Session } from "@/data/sessions";
import { SessionCarousel } from "@/components/SessionCarousel";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useColors } from "@/hooks/useColors";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const H_PAD = 20;
const AVATAR_SIZE = 84 * 1.35;
const GOLD = "#F9F9F9";
const GOLD_MUTED = "rgba(212,175,55,0.70)";

const PLATFORM_ICON: Record<ExternalProject["platform"], string> = {
  spotify:    "music",
  soundcloud: "cloud",
  bandcamp:   "disc",
  youtube:    "youtube",
  web:        "globe",
};

const PLATFORM_LABEL: Record<ExternalProject["platform"], string> = {
  spotify:    "Spotify",
  soundcloud: "SoundCloud",
  bandcamp:   "Bandcamp",
  youtube:    "YouTube",
  web:        "Sitio web",
};

export default function ResonadorPerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { clerkUserId, isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isSignedIn } });
  const { playSession } = usePlayer();
  const { isPremium } = usePremium();
  const [following, setFollowing] = React.useState(false);
  const [friendRequested, setFriendRequested] = React.useState(false);
  const [overrides, setOverrides] = React.useState<(Partial<Resonador> & { photoUri?: string }) | null>(null);
  const { theme: activeTheme } = useSceneTheme();
  const bgColors: readonly string[] = activeTheme.gradient;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { resonador: _resonador } = useResonadorById(id);

  useFocusEffect(
    React.useCallback(() => {
      if (!id) return;
      AsyncStorage.getItem(`@resonancia_resonador_overrides_${id}`)
        .then((raw) => {
          if (!raw) return;
          const parsed = JSON.parse(raw);
          // Migración: descartar identidad vieja guardada localmente
          // ("Luna Cósmica" / México / Bolivia) para que manden los datos curados.
          const stale =
            parsed?.name === "Luna Cósmica" ||
            parsed?.country === "Bolivia" ||
            parsed?.country === "México";
          if (stale) {
            delete parsed.name;
            delete parsed.city;
            delete parsed.country;
            AsyncStorage.setItem(
              `@resonancia_resonador_overrides_${id}`,
              JSON.stringify(parsed)
            ).catch(() => {});
          }
          setOverrides(parsed);
        })
        .catch(() => {});
    }, [id])
  );

  if (!_resonador) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <LinearGradient colors={activeTheme.gradient} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Feather name="user-x" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Perfil no encontrado</Text>
        </View>
      </View>
    );
  }

  const resonador = overrides
    ? ({ ..._resonador, ...overrides } as Resonador)
    : _resonador;
  const isAdmin = me?.role === "admin";
  const isOwn = isAdmin || !!(clerkUserId && resonador.clerkId && clerkUserId === resonador.clerkId);


  const sessions = (resonador.sessionIds ?? [])
    .map((sid) => getSessionById(sid))
    .filter(Boolean) as NonNullable<ReturnType<typeof getSessionById>>[];

  // ── Sticky header gradient ─────────────────────────────────────────────────
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [60, 130],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const sortedSessions = [...sessions].sort(
    (a, b) => Number.parseInt(b.id, 10) - Number.parseInt(a.id, 10),
  );

  const openSession = (session: Session) => {
    if (session.skipMiniPlayer) {
      playSession(session);
    } else if (
      session.skipDetail !== false &&
      (session.skipDetail || ["sonidos-ancestrales", "musica-sonidos"].includes(session.categoryId ?? ""))
    ) {
      playSession(session);
      router.push("/player" as never);
    } else {
      router.push(`/session/${session.id}` as never);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={bgColors as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />

      {/* ── Header (flotante sobre el hero) ── */}
      <View
        style={[
          styles.headerRow,
          styles.headerOverlay,
          { paddingHorizontal: H_PAD, paddingTop: topPad + 8 },
        ]}
      >
        {/* Fondo degradado — aparece al scrollear */}
        <Animated.View style={[StyleSheet.absoluteFill, { bottom: -25, opacity: headerBgOpacity }]} pointerEvents="none">
          <LinearGradient
            colors={[bgColors[0] as string, bgColors[1] as string]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.headerTitleAbs, { top: topPad + 8, opacity: headerBgOpacity }]}>
          <Text style={styles.headerNameTitle} numberOfLines={1}>{resonador.name}</Text>
        </Animated.View>
        <GhostPill noBorder style={{ backgroundColor: "rgba(0,0,0,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.20)", marginTop: -2, transform: [{ translateY: 2 }] }}>
          <BackPill onPress={() => router.back()} size={27} iconOffsetX={-2} />
        </GhostPill>
        <Animated.View style={{ opacity: isOwn ? 1 : headerBgOpacity }}>
          {isOwn ? (
            <Pressable
              onPress={() => router.push(`/resonador-editar/${resonador.id}` as never)}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <View style={styles.apoyaloChip}>
                <Text style={styles.apoyaloChipText}>Editar</Text>
              </View>
            </Pressable>
          ) : resonador.donationUrl ? (
            <Pressable
              onPress={() => Linking.openURL(resonador.donationUrl!)}
              style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
            >
              <View style={styles.apoyaloChip}>
                <Text style={styles.apoyaloChipText}>Apóyalo</Text>
              </View>
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </Animated.View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ── Hero banner + avatar flotante ── */}
        <View style={[styles.heroArea, { height: 192 + topPad + 50 }]}>
          <Image
            source={resonador.coverPhoto ?? resonador.photo}
            style={styles.heroImg}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            transition={IMAGE_TRANSITION}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.16)", "rgba(0,0,0,0.55)"]}
            locations={[0.55, 0.82, 1]}
            style={styles.heroFade}
          />
          {/* Avatar flotando a la mitad del borde inferior */}
          <View style={styles.heroAvatarFloat}>
            <Image
              source={resonador.photo}
              style={styles.avatarImage}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
            {resonador.certified && (
              <View style={styles.certBadge}>
                <Text style={styles.certBadgeStar}>✦</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Tarjeta de perfil ── */}
        <View style={[styles.profileCard, { marginTop: -1 }]}>

          <Text style={[styles.userName, { color: colors.foreground }]}>{resonador.name}</Text>

          {/* Subtipo pill */}
          <View style={styles.subtipoPill}>
            <Text style={styles.subtipoText}>{resonador.subtipo}</Text>
          </View>

          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{resonador.bio}</Text>
          <View style={styles.bioDivider} />

          {/* Pills de acción */}
          {!isOwn && (
            <View style={styles.actionPillsWrap}>
              <View style={styles.actionPillsRow}>
                <Pressable
                  onPress={() => setFollowing((v) => !v)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    following && styles.actionPillActive,
                    { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" },
                  ]}
                >
                  {following && (
                    <LinearGradient
                      colors={["#F9F9F9", "#F9F9F9"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Feather name={following ? "user-check" : "user-plus"} size={13} color={following ? "#1B060F" : "#FFFFFF"} />
                  <Text style={[styles.actionPillText, following && styles.actionPillTextActive]}>
                    {following ? "Siguiendo" : "Seguir"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setFriendRequested((v) => !v)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    friendRequested && styles.actionPillSent,
                    { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" },
                  ]}
                >
                  <Feather name={friendRequested ? "user-x" : "users"} size={13} color={friendRequested ? "rgba(250,240,238,0.55)" : "#FFFFFF"} />
                  <Text style={[styles.actionPillText, friendRequested && styles.actionPillTextSent]}>
                    {friendRequested ? "Solicitado" : "Amistad"}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => router.push("/mensajes" as never)}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.actionPillFull,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Feather name="message-circle" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Enviar mensaje</Text>
              </Pressable>
            </View>
          )}
        </View>


        {/* ── Mis sesiones ── */}
        {sessions.length > 0 && (
          <View style={[styles.card, styles.sessionsSection]}>
            <View style={[styles.cardHeader, { paddingHorizontal: H_PAD }]}>
              <Text style={[styles.cardTitle, { fontSize: 17 }]}>Mis sesiones</Text>
            </View>

            <SessionCarousel
              title=""
              sessions={sortedSessions.slice(0, 8)}
              isPremium={isPremium}
              onPress={openSession}
              style={styles.sessionGrid}
              showHeader={false}
              gridLayout
              fillGridWidth
              gridScrollEnabled={false}
              eagerRender
              presentation="editorial"
              disableAmbientalVariant
              sleepMetadataBelow
              categoryGridPresentation
              whiteMetadataGlass
              showDurationClock
              hideCategoryAboveTitle
              showSleepCategoryPillWithInlineDuration
            />
            {sortedSessions.length > 8 && (
              <Pressable
                onPress={() => router.push(`/resonador-sesiones/${resonador.id}` as never)}
                accessibilityRole="button"
                accessibilityLabel="Ver todas las sesiones"
                style={({ pressed }) => [
                  styles.viewAllButton,
                  { backgroundColor: pressed ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.1)" },
                ]}
              >
                <Text style={styles.viewAllText}>Ver todas</Text>
              </Pressable>
            )}
          </View>
        )}

        {sessions.length > 0 &&
          resonador.projects && resonador.projects.length > 0 && (
          <View style={[styles.sessionsProjectsDivider, { marginHorizontal: H_PAD }]} />
        )}

        {/* ── Enlaces externos ── */}
        {resonador.projects && resonador.projects.length > 0 && (
          <View
            style={[
              styles.card,
              styles.projectsCard,
              { marginHorizontal: H_PAD, marginTop: 18 },
            ]}
          >
            <Text style={styles.cardTitle}>Sígueme</Text>
            <View style={styles.projectsList}>
              {resonador.projects.map((proj, i) => (
                <Pressable
                  key={i}
                  onPress={() => Linking.openURL(proj.url)}
                  style={({ pressed }) => [styles.projectRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <View style={styles.projectIconCircle}>
                    <Feather
                      name={PLATFORM_ICON[proj.platform] as any}
                      size={15}
                      color={GOLD_MUTED}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectLabel}>{proj.label}</Text>
                    <Text style={styles.projectPlatform}>{PLATFORM_LABEL[proj.platform]}</Text>
                  </View>
                  <Feather name="external-link" size={14} color="rgba(212,175,55,0.45)" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

      </Animated.ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: { fontFamily: "Manrope", fontSize: 21, fontWeight: "700" },
  headerNameTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#F9F9F9",
    textAlign: "center",
  },
  headerTitleAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  scroll: { gap: 16 },
  /* ── Hero banner ── */
  heroArea: {
    height: 192, // 150 hero + 42 mitad del avatar
    position: "relative",
    overflow: "visible",
    backgroundColor: "#1B060F", // cubre los 42px bajo la imagen
  },
  heroImg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0, // llena todo el heroArea (192px)
  },
  heroFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
  },
  heroAvatarFloat: {
    position: "absolute",
    bottom: -15,
    alignSelf: "center",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    // Sombra para efecto flotante
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 10,
  },

  /* ── Tarjeta de perfil ── */
  profileCard: {
    borderRadius: 24,
    padding: 24,
    paddingTop: 14,
    alignItems: "center",
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2.5,
    borderColor: "rgba(212,175,55,0.50)",
  },
  certBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  certBadgeStar: { fontFamily: "Manrope", fontSize: 10, color: "#1B060F", fontWeight: "800" },
  userName: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", textAlign: "center" },

  subtipoPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 6,
  },
  subtipoText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#f9f9f9",
    letterSpacing: 0.3,
  },

  bioText: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
    fontStyle: "italic",
    marginTop: 5,
  },
  bioDivider: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginTop: 14,
    transform: [{ translateY: 20 }],
  },

  actionPillsWrap: { alignSelf: "stretch", gap: 8, marginTop: 14 },
  actionPillsRow: { flexDirection: "row", gap: 8 },
  actionPillFull: { alignSelf: "stretch", justifyContent: "center" },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 34,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionPillActive: { backgroundColor: "transparent" },
  actionPillSent: { backgroundColor: "rgba(255,255,255,0.04)" },
  actionPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#FFFFFF", letterSpacing: 0.1 },
  actionPillTextActive: { fontFamily: "Manrope", color: "#1B060F", fontWeight: "600" },
  actionPillTextSent: { color: "#c2c2c2" },

  /* ── Cards de sección ── */
  card: {
    backgroundColor: "rgba(181,211,255,0.057)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.2 },
  cardCount: { fontFamily: "Manrope", fontSize: 11, color: GOLD_MUTED, fontWeight: "500" },

  /* ── Sección 1: Sesiones ── */
  sessionsSection: {
    marginTop: 3,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  sessionGrid: { marginTop: -24, marginBottom: 18 },
  viewAllButton: {
    marginHorizontal: H_PAD,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 100,
  },
  viewAllText: { fontFamily: "Manrope", fontSize: 14, color: "#F9F9F9", fontWeight: "500" },
  sessionsProjectsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.20)",
    marginTop: 10,
  },

  /* ── Sección 2: Géneros ── */
  genresWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    backgroundColor: "rgba(212,175,55,0.06)",
  },
  genreText: { fontFamily: "Manrope", fontSize: 12, color: GOLD_MUTED, fontWeight: "500", letterSpacing: 0.2 },

  /* ── Sígueme ── */
  projectsCard: { backgroundColor: "rgba(0,0,0,0.16)" },
  projectsList: { gap: 0 },
  projectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(212,175,55,0.10)",
  },
  projectIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  projectLabel: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#FAF0EE" },
  projectPlatform: { fontFamily: "Manrope", fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 },

  /* ── Chip Apóyalo ── */
  apoyaloChip: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  apoyaloChipText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

});

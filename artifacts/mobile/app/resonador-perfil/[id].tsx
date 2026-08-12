import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";
import { DrawerStats } from "@/components/DrawerStats";
import { useSceneTheme } from "@/context/SceneThemeContext";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { COUNTRY_FLAGS, getResonadorById, type ExternalProject, type Resonador } from "@/data/resonadores";
import { getSessionById } from "@/data/sessions";
import { SessionCard } from "@/components/SessionCard";
import { useColors } from "@/hooks/useColors";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const H_PAD = 20;
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
  const [following, setFollowing] = React.useState(false);
  const [friendRequested, setFriendRequested] = React.useState(false);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [descOverflows, setDescOverflows] = React.useState(false);
  const [overrides, setOverrides] = React.useState<(Partial<Resonador> & { photoUri?: string }) | null>(null);
  const { theme: activeTheme } = useSceneTheme();
  const bgColors: readonly string[] = activeTheme.gradient;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const _resonador = getResonadorById(id);

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


  const flag = COUNTRY_FLAGS[resonador.country] ?? "";
  const locationStr = resonador.city.includes(resonador.country)
    ? `${flag} ${resonador.city}`.trim()
    : `${flag} ${resonador.city}, ${resonador.country}`.trim();
  const hasContacts = !!(resonador.instagram || resonador.phone || resonador.email || resonador.linktree);
  const sessions = (resonador.sessionIds ?? [])
    .map((sid) => getSessionById(sid))
    .filter(Boolean) as NonNullable<ReturnType<typeof getSessionById>>[];

  const SESSION_PAGE = 10;
  const [sessionLimit, setSessionLimit] = useState(SESSION_PAGE);
  const [sessionSort, setSessionSort] = useState<"recientes" | "escuchadas">("recientes");

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

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sessionSort === "recientes") return parseInt(b.id) - parseInt(a.id);
    // "escuchadas": mantener orden original (sin datos reales de escuchas)
    return 0;
  });

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
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerBgOpacity }]} pointerEvents="none">
          <LinearGradient
            colors={[bgColors[0] as string, bgColors[1] as string, `${bgColors[0]}00`]}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View pointerEvents="none" style={[styles.headerTitleAbs, { top: topPad - 2 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Perfil</Text>
        </View>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { marginTop: -10 }]} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        {resonador.donationUrl && !isOwn ? (
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
            colors={["transparent", "rgba(0,0,0,0.28)", "rgba(0,0,0,0.55)"]}
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

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{locationStr}</Text>
          </View>

          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{resonador.bio}</Text>

          {resonador.memberSince ? (
            <View style={styles.locationRow}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                Miembro desde {resonador.memberSince}
              </Text>
            </View>
          ) : null}

          {/* Seguidores / Siguiendo */}
          <View style={styles.followCountsRow}>
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {resonador.followersCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>seguidores</Text>
            </View>
            <View style={[styles.followCountDivider, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {resonador.followingCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>siguiendo</Text>
            </View>
          </View>

          {/* Pills de acción */}
          {isOwn ? (
            <View style={styles.actionPillsWrap}>
              <Pressable
                onPress={() => router.push(`/resonador-editar/${resonador.id}` as never)}
                style={({ pressed }) => [
                  styles.actionPill,
                  styles.actionPillFull,
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Feather name="edit-2" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Editar mi perfil</Text>
              </Pressable>
            </View>
          ) : (
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


        {/* ── Sección Resonador ── */}
        <View style={[styles.resonadorSection, { marginHorizontal: H_PAD, marginTop: -18 }]}>

          {/* ── Banner RESONADOR ── */}
          <LinearGradient
            colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.05)", "rgba(255,255,255,0.22)"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resonadorBannerOuter}
          >
          <View style={styles.resonadorBanner}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
            {/* Ícono circular izquierda */}
            <View style={styles.bannerIconCircle}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
              <Text style={styles.bannerIconText}>✦</Text>
            </View>

            {/* Texto */}
            <View style={styles.bannerTextWrap}>
              <MaskedView
                maskElement={<Text style={styles.bannerTitle}>RESONADOR</Text>}
              >
                <LinearGradient colors={[GOLD, "#F9F9F9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.bannerTitle, { opacity: 0 }]}>RESONADOR</Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.bannerSubtipo}>{resonador.subtipo}</Text>
              <Text style={styles.bannerVerified}>Verificado por Resonancia</Text>
            </View>
          </View>
          </LinearGradient>

          {/* Me especializo en */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Me especializo en</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {resonador.specialty.map((s) => (
                <View key={s} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Mis servicios */}
          {resonador.servicesDescription ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionTitle}>Mis servicios</Text>
              <Text
                style={styles.serviceDesc}
                numberOfLines={descExpanded ? undefined : 7}
                onTextLayout={(e) => {
                  if (!descOverflows && e.nativeEvent.lines.length > 7)
                    setDescOverflows(true);
                }}
              >
                {resonador.servicesDescription}
              </Text>
              {descOverflows && (
                <Pressable
                  onPress={() => setDescExpanded((v) => !v)}
                  style={({ pressed }) => [styles.readMoreBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.readMoreText}>{descExpanded ? "Leer menos" : "Leer más"}</Text>
                  <Feather name={descExpanded ? "chevron-up" : "chevron-down"} size={13} color={GOLD} />
                </Pressable>
              )}
            </View>
          ) : null}

        </View>

        {/* Contacto y redes — grilla 2×2 */}
        {hasContacts && (
          <View style={[styles.contactGrid, { marginHorizontal: H_PAD }]}>
            {resonador.instagram && (
              <Pressable
                onPress={() => Linking.openURL(resonador.instagram!)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="instagram" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Instagram</Text>
              </Pressable>
            )}
            {resonador.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${resonador.phone}`)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="phone" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Teléfono</Text>
              </Pressable>
            )}
            {resonador.email && (
              <Pressable
                onPress={() => Linking.openURL(`mailto:${resonador.email}`)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="mail" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Correo</Text>
              </Pressable>
            )}
            {resonador.linktree && (
              <Pressable
                onPress={() => Linking.openURL(resonador.linktree!)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="link" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Linktree</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Grilla de imágenes ── */}
        {(() => {
          const customPhotos = resonador.photos ?? [];
          if (customPhotos.length > 0) {
            return (
              <View style={[styles.photoGrid, { marginHorizontal: H_PAD, marginTop: 9 }]}>
                {customPhotos.slice(0, 6).map((uri, i) => (
                  <View key={i} style={styles.photoCell}>
                    <Image
                      source={{ uri }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                  </View>
                ))}
              </View>
            );
          }
          if (sessions.length > 0) {
            return (
              <View style={[styles.photoGrid, { marginHorizontal: H_PAD, marginTop: 9 }]}>
                {sessions.slice(0, 6).map((session, i) => (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push(`/session/${session.id}` as never)}
                    style={({ pressed }) => [styles.photoCell, { opacity: pressed ? 0.8 : 1 }]}
                  >
                    <Image
                      source={session.image}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    {i === 5 && sessions.length > 6 && (
                      <View style={styles.photoCellMore}>
                        <Text style={styles.photoCellMoreText}>+{sessions.length - 5}</Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            );
          }
          return null;
        })()}

        {/* ── SECCIÓN 1: Mi obra en Resonancia ── */}
        {sessions.length > 0 && (
          <View style={[styles.card, { marginHorizontal: H_PAD, backgroundColor: "transparent", paddingHorizontal: 0, marginTop: -9 }]}>
            <View style={[styles.cardHeader, { paddingHorizontal: 0 }]}>
              <Text style={styles.cardTitle}>Mi obra en Resonancia</Text>
              <Pressable
                onPress={() => {/* TODO: nav a catálogo del resonador */}}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={styles.verTodasText}>Ver todas</Text>
              </Pressable>
            </View>

            {/* Filtro de orden */}
            <Pressable
              hitSlop={8}
              onPress={() => {
                setSessionSort((v) => v === "recientes" ? "escuchadas" : "recientes");
                setSessionLimit(SESSION_PAGE);
              }}
              style={({ pressed }) => [styles.sessionSortBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="chevrons-down" size={13} color="rgba(250,240,238,0.40)" />
              <Text style={styles.sessionSortText}>
                {sessionSort === "recientes" ? "Más recientes" : "Más escuchadas"}
              </Text>
            </Pressable>

            <View style={styles.sessionList}>
              {sortedSessions.slice(0, sessionLimit).map((session) => (
                <SessionCard key={session.id} session={session} horizontal />
              ))}
            </View>
            {sortedSessions.length > sessionLimit && (
              <Pressable
                onPress={() => setSessionLimit((v) => v + SESSION_PAGE)}
                style={({ pressed }) => [styles.verMasBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.verMasText}>Ver más</Text>
                <Feather name="chevron-down" size={14} color={GOLD} />
              </Pressable>
            )}
            {sessionLimit > SESSION_PAGE && sortedSessions.length <= sessionLimit && (
              <Pressable
                onPress={() => setSessionLimit(SESSION_PAGE)}
                style={({ pressed }) => [styles.verMasBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.verMasText}>Ver menos</Text>
                <Feather name="chevron-up" size={14} color={GOLD} />
              </Pressable>
            )}
          </View>
        )}

        {/* ── SECCIÓN 4: Proyectos externos ── */}
        {resonador.projects && resonador.projects.length > 0 && (
          <View style={[styles.card, { marginHorizontal: H_PAD, marginTop: -15 }]}>
            <Text style={styles.cardTitle}>Proyectos externos</Text>
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

        {/* ── SECCIÓN 5: Formación ── */}
        {resonador.formacion && resonador.formacion.length > 0 && (
          <View style={[styles.card, { marginHorizontal: H_PAD, marginTop: 12 }]}>
            <Text style={styles.cardTitle}>Formación</Text>
            <View style={styles.formacionList}>
              {resonador.formacion.map((f, i) => (
                <View key={i} style={[styles.formacionItem, i > 0 && styles.formacionItemBorder]}>
                  <View style={styles.formacionDot} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.formacionTitulo}>{f.titulo}</Text>
                    <Text style={styles.formacionInst}>{f.institucion}</Text>
                    {f.years ? (
                      <Text style={styles.formacionYears}>{f.years}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quote */}
        {resonador.quote ? (
          <View style={[styles.quoteWrap, { marginHorizontal: H_PAD, marginTop: 1 }]}>
            <Text style={styles.quoteText}>"{resonador.quote}"</Text>
          </View>
        ) : null}

        {/* ── Stats del usuario ── */}
        <View style={{ marginHorizontal: H_PAD }}>
          <DrawerStats />
        </View>
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
    backgroundColor: "rgba(6,10,15,0.4)",
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
    width: 84,
    height: 84,
    borderRadius: 42,
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
    width: 84,
    height: 84,
    borderRadius: 42,
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
    marginTop: 2,
  },
  subtipoText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#f9f9f9",
    letterSpacing: 0.3,
  },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "Manrope", fontSize: 12 },
  bioText: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
    fontStyle: "italic",
  },
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 20 },
  followCountNum: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontFamily: "Manrope", fontSize: 11, marginTop: 1 },
  followCountDivider: { width: 1, height: 28 },

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
  },
  actionPillActive: { backgroundColor: "transparent" },
  actionPillSent: { backgroundColor: "rgba(255,255,255,0.04)" },
  actionPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#FFFFFF", letterSpacing: 0.1 },
  actionPillTextActive: { fontFamily: "Manrope", color: "#1B060F", fontWeight: "600" },
  actionPillTextSent: { color: "#c2c2c2" },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactPill: { flexBasis: "47%", flexGrow: 1, justifyContent: "center" },

  /* ── Sección Resonador ── */
  resonadorSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },

  /* Banner */
  resonadorBannerOuter: {
    borderRadius: 14,
    padding: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  resonadorBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  bannerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  bannerIconText: { fontFamily: "Manrope", fontSize: 18, color: GOLD, fontWeight: "800" },
  bannerTextWrap: { flex: 1, gap: 1 },
  bannerTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: GOLD,
  },
  bannerSubtipo: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  bannerVerified: {
    fontFamily: "Manrope",
    fontSize: 10,
    color: "rgba(212,175,55,0.55)",
    marginTop: 2,
    letterSpacing: 0.2,
  },

  sectionBlock: { gap: 10 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  specialtyChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 34,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  specialtyText: { fontFamily: "Manrope", fontSize: 13, color: "#FFFFFF", fontWeight: "400", letterSpacing: 0.1 },
  serviceDesc: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "#F4F4F4" },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  readMoreText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: GOLD },

  /* ── Cards de sección ── */
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.2 },
  cardCount: { fontFamily: "Manrope", fontSize: 11, color: GOLD_MUTED, fontWeight: "500" },

  /* ── Grilla de fotos ── */
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoCell: {
    width: "30.5%",
    aspectRatio: 3 / 4,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    overflow: "hidden",
  },
  photoCellMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27,6,15,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCellMoreText: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.5,
  },

  /* ── Sección 1: Sesiones ── */
  verTodasText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", color: GOLD, letterSpacing: 0.2 },
  sessionSortBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4, alignSelf: "flex-start" },
  sessionSortText: { fontFamily: "Manrope", fontSize: 12, color: "rgba(250,240,238,0.40)", fontWeight: "500" },
  sessionList: { gap: 4 },
  verMasBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    marginTop: 4,
  },
  verMasText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: GOLD },

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

  /* ── Sección 4: Proyectos externos ── */
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

  /* ── Sección 5: Formación ── */
  formacionList: { gap: 0 },
  formacionItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  formacionItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(212,175,55,0.10)",
  },
  formacionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginTop: 5,
    flexShrink: 0,
    opacity: 0.7,
  },
  formacionTitulo: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", color: "#FAF0EE" },
  formacionInst: { fontFamily: "Manrope", fontSize: 12, color: "#F4F4F4", marginTop: 1 },
  formacionYears: { fontFamily: "Manrope", fontSize: 11, color: GOLD_MUTED, marginTop: 2 },

  /* ── Chip Apóyalo ── */
  apoyaloChip: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
  },
  apoyaloChipText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  /* ── Quote ── */
  quoteWrap: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 8 },
  quoteText: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontStyle: "italic",
    color: "#F6F6F6",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.2,
  },
});

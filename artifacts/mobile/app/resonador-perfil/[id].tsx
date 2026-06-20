import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { COUNTRY_FLAGS, getResonadorById, type ExternalProject } from "@/data/resonadores";
import { getSessionById } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GOLD = "#D4AF37";
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

  const [following, setFollowing] = React.useState(false);
  const [friendRequested, setFriendRequested] = React.useState(false);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [descOverflows, setDescOverflows] = React.useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const resonador = getResonadorById(id);

  if (!resonador) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
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

  const flag = COUNTRY_FLAGS[resonador.country] ?? "";
  const locationStr = `${flag} ${resonador.city}, ${resonador.country}`.trim();
  const hasSocials = !!(resonador.instagram || resonador.linktree);
  const sessions = (resonador.sessionIds ?? [])
    .map((sid) => getSessionById(sid))
    .filter(Boolean) as NonNullable<ReturnType<typeof getSessionById>>[];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Perfil</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
      >
        {/* ── Tarjeta de perfil ── */}
        <View style={styles.profileCard}>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
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
            <View style={[styles.followCountDivider, { backgroundColor: colors.border ?? "#3D0E16" }]} />
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {resonador.followingCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>siguiendo</Text>
            </View>
          </View>

          {/* Pills de acción */}
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
                    colors={["#D6AD5F", "#B47344"]}
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
        </View>

        {/* ── Botón de apoyo ── */}
        {resonador.donationUrl ? (
          <Pressable
            onPress={() => Linking.openURL(resonador.donationUrl!)}
            style={({ pressed }) => [
              styles.donationBtn,
              { marginHorizontal: H_PAD, marginTop: -24, opacity: pressed ? 0.80 : 1 },
            ]}
          >
            <LinearGradient
              colors={["rgba(212,175,55,0.08)", "rgba(212,175,55,0.03)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.donationIconWrap}>
              <LinearGradient
                colors={["rgba(212,175,55,0.18)", "rgba(184,134,11,0.10)"]}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="heart" size={15} color={GOLD} />
            </View>
            <View style={styles.donationTextWrap}>
              <Text style={styles.donationTitle}>
                Apoyar a {resonador.name.split(" ")[0]}
              </Text>
              <Text style={styles.donationSub}>Tu apoyo llega directo a su obra</Text>
            </View>
            <Feather name="external-link" size={14} color="rgba(212,175,55,0.45)" />
          </Pressable>
        ) : null}

        {/* ── Sección Resonador ── */}
        <View style={[styles.resonadorSection, { marginHorizontal: H_PAD }]}>

          {/* ── Banner RESONADOR ── */}
          <LinearGradient
            colors={["rgba(212,175,55,0.50)", "rgba(212,175,55,0.05)", "rgba(212,175,55,0.50)"]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.resonadorBannerOuter}
          >
          <View style={styles.resonadorBanner}>
            <LinearGradient
              colors={["rgba(74,12,12,0.80)", "rgba(27,6,15,0.95)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Ícono circular izquierda */}
            <View style={styles.bannerIconCircle}>
              <LinearGradient
                colors={["rgba(212,175,55,0.20)", "rgba(184,134,11,0.12)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.bannerIconText}>✦</Text>
            </View>

            {/* Texto */}
            <View style={styles.bannerTextWrap}>
              <MaskedView
                maskElement={<Text style={styles.bannerTitle}>RESONADOR</Text>}
              >
                <LinearGradient colors={[GOLD, "#E9C46A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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

          {/* Redes sociales */}
          {hasSocials && (
            <View style={styles.contactRow}>
              {resonador.instagram && (
                <Pressable
                  onPress={() => Linking.openURL(resonador.instagram!)}
                  style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <Feather name="instagram" size={13} color="#FFFFFF" />
                  <Text style={styles.actionPillText}>Instagram</Text>
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
        </View>

        {/* ── Grilla de imágenes ── */}
        {sessions.length > 0 && (
          <View style={[styles.photoGrid, { marginHorizontal: H_PAD }]}>
            {sessions.slice(0, 6).map((session, i) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/session/${session.id}` as never)}
                style={({ pressed }) => [styles.photoCell, { opacity: pressed ? 0.8 : 1 }]}
              >
                <Image
                  source={session.image}
                  style={StyleSheet.absoluteFill}
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
        )}

        {/* ── SECCIÓN 1: Mi obra en Resonancia ── */}
        {sessions.length > 0 && (
          <View style={[styles.card, { marginHorizontal: H_PAD }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Mi obra en Resonancia</Text>
              <Text style={styles.cardCount}>{sessions.length} {sessions.length === 1 ? "sesión" : "sesiones"}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sessionScroll}
            >
              {sessions.map((session) => (
                <Pressable
                  key={session.id}
                  onPress={() => router.push(`/session/${session.id}` as never)}
                  style={({ pressed }) => [styles.sessionCard, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <View style={styles.sessionImgWrap}>
                    <Image
                      source={session.image}
                      style={styles.sessionImg}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(27,6,15,0.70)"]}
                      style={styles.sessionImgGrad}
                    />
                    {session.isPremium && (
                      <View style={styles.sessionPremiumBadge}>
                        <Text style={styles.sessionPremiumStar}>★</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionTitle} numberOfLines={2}>{session.title}</Text>
                  <Text style={styles.sessionCat} numberOfLines={1}>{session.categoryLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── SECCIÓN 2: Géneros y estilos ── */}
        {resonador.genres && resonador.genres.length > 0 && (
          <View style={[styles.card, { marginHorizontal: H_PAD, backgroundColor: "transparent" }]}>
            <Text style={styles.cardTitle}>Géneros y estilos</Text>
            <View style={styles.genresWrap}>
              {resonador.genres.map((g) => (
                <View key={g} style={styles.genreChip}>
                  <Text style={styles.genreText}>{g}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── SECCIÓN 4: Proyectos externos ── */}
        {resonador.projects && resonador.projects.length > 0 && (
          <View style={[styles.card, { marginHorizontal: H_PAD }]}>
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
          <View style={[styles.card, { marginHorizontal: H_PAD }]}>
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
          <View style={[styles.quoteWrap, { marginHorizontal: H_PAD }]}>
            <Text style={styles.quoteText}>"{resonador.quote}"</Text>
          </View>
        ) : null}
      </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(244,218,213,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { paddingTop: 4, gap: 16 },

  /* ── Tarjeta de perfil ── */
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
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
  certBadgeStar: { fontSize: 10, color: "#1B060F", fontWeight: "800" },
  userName: { fontSize: 20, fontWeight: "700", textAlign: "center" },

  subtipoPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
    marginTop: 2,
  },
  subtipoText: {
    fontSize: 11,
    fontWeight: "600",
    color: GOLD_MUTED,
    letterSpacing: 0.3,
  },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12 },
  bioText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    paddingHorizontal: 8,
    fontStyle: "italic",
  },
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 20 },
  followCountNum: { fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontSize: 11, marginTop: 1 },
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
  actionPillText: { fontSize: 13, fontWeight: "400", color: "#FFFFFF", letterSpacing: 0.1 },
  actionPillTextActive: { color: "#1B060F", fontWeight: "600" },
  actionPillTextSent: { color: "rgba(250,240,238,0.45)" },
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactPill: { flex: 1, justifyContent: "center" },

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
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.45,
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
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  bannerIconText: { fontSize: 18, color: GOLD, fontWeight: "800" },
  bannerTextWrap: { flex: 1, gap: 1 },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: GOLD,
  },
  bannerSubtipo: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    marginTop: 1,
  },
  bannerVerified: {
    fontSize: 10,
    color: "rgba(212,175,55,0.55)",
    marginTop: 2,
    letterSpacing: 0.2,
  },

  sectionBlock: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.2 },
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
  specialtyText: { fontSize: 13, color: "#FFFFFF", fontWeight: "400", letterSpacing: 0.1 },
  serviceDesc: { fontSize: 13, lineHeight: 20, color: "rgba(244,218,213,0.65)" },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  readMoreText: { fontSize: 13, fontWeight: "600", color: GOLD },

  /* ── Cards de sección ── */
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.2 },
  cardCount: { fontSize: 11, color: GOLD_MUTED, fontWeight: "500" },

  /* ── Grilla de fotos ── */
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    borderRadius: 16,
    overflow: "hidden",
  },
  photoCell: {
    width: "32.5%",
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    overflow: "hidden",
  },
  photoCellMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(27,6,15,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCellMoreText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.5,
  },

  /* ── Sección 1: Sesiones ── */
  sessionScroll: { gap: 10, paddingRight: 4 },
  sessionCard: { width: 130, gap: 6 },
  sessionImgWrap: { borderRadius: 12, overflow: "hidden", position: "relative" },
  sessionImg: { width: 130, height: 130, borderRadius: 12 },
  sessionImgGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 12 },
  sessionPremiumBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionPremiumStar: { fontSize: 10, color: "#1B060F" },
  sessionTitle: { fontSize: 12, fontWeight: "600", color: "#FAF0EE", lineHeight: 16 },
  sessionCat: { fontSize: 10, color: "rgba(244,218,213,0.50)" },

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
  genreText: { fontSize: 12, color: GOLD_MUTED, fontWeight: "500", letterSpacing: 0.2 },

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
  projectLabel: { fontSize: 13, fontWeight: "600", color: "#FAF0EE" },
  projectPlatform: { fontSize: 11, color: "rgba(244,218,213,0.45)", marginTop: 1 },

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
  formacionTitulo: { fontSize: 13, fontWeight: "700", color: "#FAF0EE" },
  formacionInst: { fontSize: 12, color: "rgba(244,218,213,0.65)", marginTop: 1 },
  formacionYears: { fontSize: 11, color: GOLD_MUTED, marginTop: 2 },

  /* ── Botón de apoyo ── */
  donationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  donationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  donationTextWrap: { flex: 1, gap: 2 },
  donationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: GOLD_MUTED,
    letterSpacing: 0.1,
  },
  donationSub: {
    fontSize: 11,
    color: "rgba(212,175,55,0.40)",
    letterSpacing: 0.1,
  },

  /* ── Quote ── */
  quoteWrap: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 8 },
  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    color: "rgba(244,218,213,0.70)",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.2,
  },
});

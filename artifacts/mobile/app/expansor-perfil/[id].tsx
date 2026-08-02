import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";
import { DrawerStats } from "@/components/DrawerStats";
import { WatercolorBtn } from "@/components/WatercolorBtn";
import { GhostPill } from "@/components/GhostPill";
import { SimplePersonalizeSheet } from "@/components/SimplePersonalizeSheet";
import { GeometrixOverlay } from "@/components/GeometrixToggle";
import { usePremium } from "@/context/PremiumContext";
import { bgGradientColors } from "@/data/geometrix-creations";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { COUNTRY_FLAGS, getExpansorById, type Expansor } from "@/data/expansores";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export const EXPANSOR_OVERRIDE_KEY = (id: string) =>
  `@resonancia_expansor_overrides_${id}`;

const H_PAD = 20;
const GALLERY_GAP = 4;
const SECTION_PAD = 16;

export default function ExpansorPerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { clerkUserId, isSignedIn } = useAuth();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey(), enabled: isSignedIn } });

  const { isPremium } = usePremium();
  const [following, setFollowing] = React.useState(false);
  const [friendRequested, setFriendRequested] = React.useState(false);
  const [lightboxUri, setLightboxUri] = React.useState<string | null>(null);
  const [profileGeoActive, setProfileGeoActive] = React.useState(false);
  const [profileBgId, setProfileBgId] = React.useState<string | null>(null);
  const [personalizeVisible, setPersonalizeVisible] = React.useState(false);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [descOverflows, setDescOverflows] = React.useState(false);
  const [overrides, setOverrides] = React.useState<Partial<Expansor> | null>(null);
  const bgColors: readonly string[] = bgGradientColors(profileBgId) ?? ["#340D1A", "#190913"];

  const _expansor = getExpansorById(id);

  useFocusEffect(
    React.useCallback(() => {
      if (!id) return;
      AsyncStorage.getItem(EXPANSOR_OVERRIDE_KEY(id))
        .then((raw) => { if (raw) setOverrides(JSON.parse(raw)); })
        .catch(() => {});
    }, [id])
  );

  const expansor = overrides && _expansor
    ? ({ ..._expansor, ...overrides } as Expansor)
    : _expansor;

  const isAdmin = me?.role === "admin";
  const isOwn = isAdmin || !!(clerkUserId && expansor && (expansor as any).clerkId && clerkUserId === (expansor as any).clerkId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const cellSize = (screenWidth - H_PAD * 2 - SECTION_PAD * 2 - GALLERY_GAP * 2) / 3;

  if (!expansor) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />
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

  const flag = COUNTRY_FLAGS[expansor.country] ?? "";
  const locationStr = `${flag} ${expansor.city}, ${expansor.country}`.trim();

  const hasContactRow = !!(expansor.phone || expansor.email);
  const hasSocialRow = !!(expansor.instagram || expansor.linktree || expansor.facebook);
  const hasGallery = !!(expansor.gallery && expansor.gallery.length > 0);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={bgColors as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <GeometrixOverlay active={profileGeoActive} />

      {/* Header */}
      <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Perfil</Text>
        {isOwn ? (
          <GhostPill>
            <WatercolorBtn
              isPremium={isPremium}
              onPress={() => setPersonalizeVisible(true)}
              size={17}
            />
            <Pressable
              onPress={() => router.push(`/expansor-editar/${expansor.id}` as never)}
              style={styles.pillBtn}
              hitSlop={8}
            >
              <Feather name="edit-2" size={17} color="#dad4ec" />
            </Pressable>
          </GhostPill>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
      >
        {/* ── Profile Card ── */}
        <View style={styles.profileCard}>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Image
              source={expansor.photo}
              style={styles.avatarImage}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
            {expansor.certified && (
              <View style={styles.certBadge}>
                <Text style={styles.certBadgeStar}>✦</Text>
              </View>
            )}
          </View>

          <Text style={[styles.userName, { color: colors.foreground }]}>{expansor.name}</Text>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{locationStr}</Text>
          </View>

          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{expansor.bio}</Text>

          {expansor.memberSince ? (
            <View style={styles.locationRow}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                Miembro desde {expansor.memberSince}
              </Text>
            </View>
          ) : null}

          {/* Seguidores / Siguiendo */}
          <View style={styles.followCountsRow}>
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {expansor.followersCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>seguidores</Text>
            </View>
            <View style={[styles.followCountDivider, { backgroundColor: colors.border ?? "#3D0E16" }]} />
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {expansor.followingCount ?? 0}
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
                    colors={["#dad4ec", "#f3e7e9"]}
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
                onPress={() => {
                  if (friendRequested) {
                    Alert.alert("Solicitud enviada", "Ya enviaste una solicitud de amistad a este usuario.");
                  } else {
                    setFriendRequested(true);
                    Alert.alert("¡Listo!", "Solicitud de amistad enviada.");
                  }
                }}
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

        {/* ── Sección Expansor ── */}
        <View style={[styles.expansorSection, { marginHorizontal: H_PAD, marginTop: -20 }]}>

          {/* Banner certificado — V5 */}
          <View style={styles.certBanner}>
            {/* Barra lateral izquierda — absolute para cubrir toda la altura */}
            <LinearGradient
              colors={["#FBA980", "#B8860B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.certBannerBar}
            />

            {/* Contenido con mismo padding que resonador */}
            <View style={styles.certBannerContent}>
              {/* Ícono circular izquierda */}
              <View style={styles.certBannerIconBorder}>
                <View style={styles.certBannerIcon}>
                  <LinearGradient
                    colors={["rgba(212,175,55,0.30)", "rgba(184,134,11,0.20)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.certBannerStar}>✦</Text>
                </View>
              </View>

              {/* Texto */}
              <View style={{ flex: 1, gap: 1 }}>
                <MaskedView
                  maskElement={<Text style={styles.certBannerTitle}>EXPANSOR</Text>}
                >
                  <LinearGradient colors={["#dad4ec", "#FBA980"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[styles.certBannerTitle, { opacity: 0 }]}>EXPANSOR</Text>
                  </LinearGradient>
                </MaskedView>
                {expansor.subtipo ? (
                  <Text style={styles.certBannerSub}>{expansor.subtipo}</Text>
                ) : null}
                <Text style={styles.certBannerVerified}>Verificado por Resonancia</Text>
              </View>
            </View>
          </View>

          {/* Me especializo en + chips */}
          <View style={styles.sectionBlock}>
            <Text style={styles.serviceTitle}>Me especializo en</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtyWrap}
            >
              {expansor.specialty.map((s) => (
                <View key={s} style={styles.specialtyChip}>
                  <Text style={styles.specialtyText}>{s}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Mis servicios + descripción */}
          <View style={styles.sectionBlock}>
            <Text style={styles.serviceTitle}>Mis servicios</Text>
            {(expansor.servicesDescription || expansor.bio) ? (
              <View>
                <Text
                  style={styles.serviceDesc}
                  numberOfLines={descExpanded ? undefined : 7}
                  onTextLayout={(e) => {
                    if (!descOverflows && e.nativeEvent.lines.length > 7)
                      setDescOverflows(true);
                  }}
                >
                  {expansor.servicesDescription ?? expansor.bio}
                </Text>
                {descOverflows && (
                  <Pressable
                    onPress={() => setDescExpanded((v) => !v)}
                    style={({ pressed }) => [styles.readMoreBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={styles.readMoreText}>
                      {descExpanded ? "Leer menos" : "Leer más"}
                    </Text>
                    <Feather
                      name={descExpanded ? "chevron-up" : "chevron-down"}
                      size={13}
                      color="#dad4ec"
                    />
                  </Pressable>
                )}
              </View>
            ) : null}
          </View>

        </View>

        {/* Botones contacto: teléfono + email */}
        {hasContactRow && (
          <View style={[styles.contactRow, { marginHorizontal: H_PAD }]}>
            {expansor.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${expansor.phone}`)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="phone" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Teléfono</Text>
              </Pressable>
            )}
            {expansor.email && (
              <Pressable
                onPress={() => Linking.openURL(`mailto:${expansor.email}`)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="mail" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Email</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Botones sociales: Instagram + Linktree + Facebook */}
        {hasSocialRow && (
          <View style={[styles.contactRow, { marginHorizontal: H_PAD }]}>
            {expansor.instagram && (
              <Pressable
                onPress={() => Linking.openURL(expansor.instagram!)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="instagram" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Instagram</Text>
              </Pressable>
            )}
            {expansor.linktree && (
              <Pressable
                onPress={() => Linking.openURL(expansor.linktree!)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="link" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Linktree</Text>
              </Pressable>
            )}
            {expansor.facebook && (
              <Pressable
                onPress={() => Linking.openURL(expansor.facebook!)}
                style={({ pressed }) => [styles.actionPill, styles.contactPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="facebook" size={13} color="#FFFFFF" />
                <Text style={styles.actionPillText}>Facebook</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Descubre lo que hago — galería ── */}
        {hasGallery && (
          <View style={[styles.gallerySection, { marginHorizontal: H_PAD }]}>
            <View style={styles.galleryGrid}>
              {(expansor.gallery ?? []).slice(0, 9).map((uri, i) => (
                <Pressable
                  key={i}
                  onPress={() => setLightboxUri(uri)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <Image
                    source={{ uri }}
                    style={[styles.galleryCell, { width: cellSize, height: cellSize * 1.3 }]}
                    contentFit="cover"
                    placeholder={BLUR_PLACEHOLDER}
                    transition={IMAGE_TRANSITION}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── Quote — al final ── */}
        {expansor.quote ? (
          <View style={[styles.quoteWrap, { marginHorizontal: H_PAD }]}>
            <Text style={styles.quoteText}>"{expansor.quote}"</Text>
          </View>
        ) : null}

        {/* ── Stats del usuario ── */}
        <View style={{ marginHorizontal: H_PAD }}>
          <DrawerStats />
        </View>
      </ScrollView>

      <SimplePersonalizeSheet
        visible={personalizeVisible}
        onClose={() => setPersonalizeVisible(false)}
        selectedBgId={profileBgId}
        onSelectBg={setProfileBgId}
        geoActive={profileGeoActive}
        onToggleGeo={setProfileGeoActive}
      />

      {/* ── Lightbox ── */}
      <Modal visible={!!lightboxUri} transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxUri(null)}>
          <Image
            source={{ uri: lightboxUri ?? "" }}
            style={styles.lightboxImage}
            contentFit="contain"
            placeholder={BLUR_PLACEHOLDER}
          />
          <Pressable
            onPress={() => setLightboxUri(null)}
            style={[styles.lightboxClose, { top: (Platform.OS === "web" ? 20 : insets.top) + 12 }]}
            hitSlop={12}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      </Modal>
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
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },

  scroll: { paddingTop: 4, gap: 16 },

  /* ── Profile card ── */
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginTop: 25, marginBottom: 8 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  certBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#dad4ec",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  certBadgeStar: { fontFamily: "Manrope", fontSize: 10, color: "#1B060F", fontWeight: "800" },
  userName: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", textAlign: "center" },
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

  /* ── Pills de acción ── */
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
  actionPillText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  actionPillTextActive: { fontFamily: "Manrope", color: "#1B060F", fontWeight: "600" },
  actionPillTextSent: { color: "#c2c2c2" },

  /* ── Sección Expansor ── */
  expansorSection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  certBanner: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    backgroundColor: "rgba(212,175,55,0.05)",
  },
  certBannerBar: {
    width: 5,
  },
  certBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 16,
    gap: 14,
  },
  certBannerTitle: {
    fontFamily: "Manrope",
    fontSize: 14, fontWeight: "800", letterSpacing: 0.6, color: "#dad4ec",
  },
  certBannerSub: {
    fontFamily: "Manrope",
    fontSize: 12, color: "rgba(255,255,255,0.90)", marginTop: 2,
  },
  certBannerIconBorder: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.35)",
    flexShrink: 0,
  },
  certBannerIcon: {
    flex: 1, borderRadius: 21, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  certBannerStar: { fontFamily: "Manrope", fontSize: 18, color: "rgba(212,175,55,0.90)", fontWeight: "800" },
  certBannerVerified: { fontFamily: "Manrope", fontSize: 10, color: "#F4F4F4", marginTop: 2, letterSpacing: 0.2 },
  editBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  pillBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionBlock: { gap: 10 },
  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.90)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  serviceTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#FAF0EE",
    letterSpacing: 0.2,
  },
  serviceDesc: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    color: "#F4F4F4",
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  readMoreText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#dad4ec",
  },
  specialtyWrap: { flexDirection: "row", gap: 8, alignItems: "center" },
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

  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactPill: { flex: 1, justifyContent: "center" },

  /* ── Quote ── */
  quoteWrap: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  quoteText: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontStyle: "italic",
    color: "#F6F6F6",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.2,
  },

  /* ── Galería ── */
  gallerySection: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  galleryTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GALLERY_GAP,
  },
  galleryCell: {
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  /* ── Lightbox ── */
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImage: {
    width: "100%",
    height: "80%",
  },
  lightboxClose: {
    position: "absolute",
    right: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});

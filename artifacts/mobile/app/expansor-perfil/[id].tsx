import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { COUNTRY_FLAGS, getExpansorById } from "@/data/expansores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GALLERY_GAP = 4;
const SECTION_PAD = 16;

export default function ExpansorPerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [following, setFollowing] = React.useState(false);
  const [friendRequested, setFriendRequested] = React.useState(false);
  const [lightboxUri, setLightboxUri] = React.useState<string | null>(null);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [descOverflows, setDescOverflows] = React.useState(false);

  const expansor = getExpansorById(id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const cellSize = (screenWidth - H_PAD * 2 - SECTION_PAD * 2 - GALLERY_GAP * 2) / 3;

  if (!expansor) {
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

  const flag = COUNTRY_FLAGS[expansor.country] ?? "";
  const locationStr = `${flag} ${expansor.city}, ${expansor.country}`.trim();

  const hasContactRow = !!(expansor.phone || expansor.email);
  const hasSocialRow = !!(expansor.instagram || expansor.linktree || expansor.facebook);
  const hasGallery = !!(expansor.gallery && expansor.gallery.length > 0);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
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
                <Feather name={friendRequested ? "user-x" : "users"} size={13} color={friendRequested ? "rgba(242,231,228,0.55)" : "#FFFFFF"} />
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
        <View style={[styles.expansorSection, { marginHorizontal: H_PAD }]}>

          {/* Banner certificado — V5 */}
          <View style={styles.certBanner}>
            {/* Barra lateral izquierda */}
            <LinearGradient
              colors={["#E9C46A", "#B8860B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.certBannerBar}
            />

            {/* Texto */}
            <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 10, justifyContent: "center" }}>
              <MaskedView
                maskElement={
                  <Text style={styles.certBannerTitle}>
                    {expansor.certified ? "EXPANSOR CERTIFICADO" : "EXPANSOR RESONANCIA"}
                  </Text>
                }
              >
                <LinearGradient colors={["#D4AF37", "#E9C46A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={[styles.certBannerTitle, { opacity: 0 }]}>
                    {expansor.certified ? "EXPANSOR CERTIFICADO" : "EXPANSOR RESONANCIA"}
                  </Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.certBannerSub}>Verificado · Resonancia</Text>
            </View>

            {/* Ícono circular derecha */}
            <View style={{ paddingRight: 14, justifyContent: "center" }}>
              <View style={styles.certBannerIcon}>
                <LinearGradient
                  colors={["rgba(212,175,55,0.30)", "rgba(184,134,11,0.20)"]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.certBannerStar}>✦</Text>
              </View>
            </View>
          </View>

          {/* Me especializo en + chips */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>Me especializo en</Text>
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
                      color="#D4AF37"
                    />
                  </Pressable>
                )}
              </View>
            ) : null}
          </View>

          {/* Botones contacto: teléfono + email */}
          {hasContactRow && (
            <View style={styles.contactRow}>
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
            <View style={styles.contactRow}>
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
        </View>

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
      </ScrollView>

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

  /* ── Profile card ── */
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  certBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  certBadgeStar: { fontSize: 10, color: "#1B060F", fontWeight: "800" },
  userName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
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
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  actionPillTextActive: { color: "#1B060F", fontWeight: "600" },
  actionPillTextSent: { color: "rgba(242,231,228,0.45)" },

  /* ── Sección Expansor ── */
  expansorSection: {
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 18,
    padding: 16,
    gap: 16,
  },
  certBanner: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    backgroundColor: "rgba(212,175,55,0.05)",
  },
  certBannerBar: {
    width: 5,
  },
  certBannerTitle: {
    fontSize: 13, fontWeight: "800", letterSpacing: 0.4, color: "#D4AF37",
  },
  certBannerSub: {
    fontSize: 11, color: "rgba(212,175,55,0.55)", marginTop: 2,
  },
  certBannerIcon: {
    width: 38, height: 38, borderRadius: 19, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.50)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  certBannerStar: { fontSize: 17, color: "rgba(212,175,55,0.90)", fontWeight: "800" },

  sectionBlock: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.90)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F4DAD5",
    letterSpacing: 0.2,
  },
  serviceDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(244,218,213,0.65)",
  },
  readMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D4AF37",
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
  specialtyText: { fontSize: 13, color: "#FFFFFF", fontWeight: "400", letterSpacing: 0.1 },

  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactPill: { flex: 1, justifyContent: "center" },

  /* ── Quote ── */
  quoteWrap: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  quoteText: {
    fontSize: 18,
    fontStyle: "italic",
    color: "rgba(244,218,213,0.70)",
    textAlign: "center",
    lineHeight: 28,
    letterSpacing: 0.2,
  },

  /* ── Galería ── */
  gallerySection: {
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  galleryTitle: {
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

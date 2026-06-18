import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Alert,
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
import { COUNTRY_FLAGS, getExpansorById } from "@/data/expansores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;

export default function ExpansorPerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [following, setFollowing] = React.useState(false);
  const [friendRequested, setFriendRequested] = React.useState(false);

  const expansor = getExpansorById(id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />

      {/* Header barra */}
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
        {/* ── Profile Card — mismo layout que profile.tsx ── */}
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

          {/* Nombre */}
          <Text style={[styles.userName, { color: colors.foreground }]}>{expansor.name}</Text>

          {/* Ubicación */}
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>{locationStr}</Text>
          </View>

          {/* Bio */}
          <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{expansor.bio}</Text>

          {/* Miembro desde */}
          {expansor.memberSince ? (
            <View style={styles.locationRow}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                Miembro desde {expansor.memberSince}
              </Text>
            </View>
          ) : null}

          {/* Seguidores / Siguiendo — idéntico a profile.tsx */}
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

          {/* ── Pills de acción ── */}
          <View style={styles.actionPillsWrap}>
            {/* Fila 1: Seguir + Amistad */}
            <View style={styles.actionPillsRow}>
              {/* Seguir */}
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
                <Feather
                  name={following ? "user-check" : "user-plus"}
                  size={13}
                  color={following ? "#1B060F" : "#FFFFFF"}
                />
                <Text style={[styles.actionPillText, following && styles.actionPillTextActive]}>
                  {following ? "Siguiendo" : "Seguir"}
                </Text>
              </Pressable>

              {/* Amistad */}
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
                <Feather
                  name={friendRequested ? "user-x" : "users"}
                  size={13}
                  color={friendRequested ? "rgba(242,231,228,0.55)" : "#FFFFFF"}
                />
                <Text style={[styles.actionPillText, friendRequested && styles.actionPillTextSent]}>
                  {friendRequested ? "Solicitado" : "Amistad"}
                </Text>
              </Pressable>
            </View>

            {/* Fila 2: Enviar mensaje — mismo ancho total */}
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

          {/* Banner certificado */}
          <View style={styles.certBanner}>
            <LinearGradient
              colors={["rgba(212,175,55,0.12)", "rgba(212,175,55,0.04)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.certBannerStar}>✦</Text>
            <MaskedView
              maskElement={
                <Text style={styles.certBannerText}>
                  {expansor.certified ? "Expansor Certificado" : "Expansor Resonancia"}
                </Text>
              }
            >
              <LinearGradient
                colors={["#D4AF37", "#E9C46A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.certBannerText, { opacity: 0 }]}>
                  {expansor.certified ? "Expansor Certificado" : "Expansor Resonancia"}
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>

          {/* Mis servicios */}
          <Text style={styles.serviceTitle}>Mis servicios</Text>

          {/* Chips de servicios */}
          <View style={styles.specialtyWrap}>
            {expansor.specialty.map((s) => (
              <View key={s} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Descripción de servicios */}
          {expansor.bio ? (
            <Text style={styles.serviceDesc}>{expansor.bio}</Text>
          ) : null}

        </View>
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

  /* ── Profile card — sin fondo, igual que profile.tsx ── */
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

  /* — Seguidores/Siguiendo — copiado exacto de profile.tsx — */
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 20 },
  followCountNum: { fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontSize: 11, marginTop: 1 },
  followCountDivider: { width: 1, height: 28 },

  /* — Pills de acción (mismo estilo que headerTabChip de Inicio) — */
  actionPillsWrap: {
    alignSelf: "stretch",
    gap: 8,
    marginTop: 14,
  },
  actionPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionPillFull: {
    alignSelf: "stretch",
    justifyContent: "center",
  },
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
  actionPillActive: {
    backgroundColor: "transparent",
  },
  actionPillSent: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  actionPillTextActive: {
    color: "#1B060F",
    fontWeight: "600",
  },
  actionPillTextSent: {
    color: "rgba(242,231,228,0.45)",
  },

  /* ── Sección Expansor ── */
  expansorSection: {
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  certBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
  },
  certBannerStar: { fontSize: 15, color: "#D4AF37", fontWeight: "800" },
  certBannerText: { fontSize: 13, fontWeight: "700", color: "#D4AF37" },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F4DAD5",
    letterSpacing: 0.2,
  },
  specialtyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  serviceDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(244,218,213,0.65)",
  },
});

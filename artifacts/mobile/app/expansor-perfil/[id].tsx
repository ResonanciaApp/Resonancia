import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { COUNTRY_FLAGS, getExpansorById } from "@/data/expansores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;

export default function ExpansorPerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

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
        </View>

        {/* ── Bloque Expansor Certificado ── */}
        <View style={[styles.expansorSection, { marginHorizontal: H_PAD }]}>
          {/* Cabecera */}
          <View style={styles.expansorHeader}>
            <View style={styles.expansorBadge}>
              <Text style={styles.expansorBadgeStar}>✦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expansorTitle}>
                {expansor.certified ? "Expansor Certificado" : "Expansor Resonancia"}
              </Text>
              <Text style={styles.expansorSub}>
                {expansor.city}, {expansor.country}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(`/expansor/${expansor.id}` as never)}
              style={({ pressed }) => [styles.verPublicoBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.verPublicoText}>Ver pantalla pública</Text>
              <Feather name="chevron-right" size={13} color="#D4AF37" />
            </Pressable>
          </View>

          {/* Especialidades */}
          <View style={styles.specialtyWrap}>
            {expansor.specialty.map((s) => (
              <View key={s} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{s}</Text>
              </View>
            ))}
          </View>

          {/* Links */}
          {expansor.links && expansor.links.length > 0 && (
            <View style={styles.linksRow}>
              {expansor.links.map((link) => (
                <Pressable
                  key={link.label}
                  onPress={() => Linking.openURL(link.url)}
                  style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Feather name="external-link" size={12} color="#D4AF37" />
                  <Text style={styles.linkLabel}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Sello */}
          {expansor.certified && (
            <View style={styles.certCard}>
              <LinearGradient
                colors={["rgba(212,175,55,0.12)", "rgba(212,175,55,0.04)"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.certCardStar}>✦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.certCardTitle}>Expansor Certificado por Resonancia</Text>
                <Text style={styles.certCardSub}>
                  Este practicante ha sido verificado por el equipo de Resonancia y ofrece sesiones
                  de sonoterapia con cuencos en su ciudad.
                </Text>
              </View>
            </View>
          )}
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

  /* ── Bloque Expansor ── */
  expansorSection: {
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    padding: 16,
    gap: 12,
  },
  expansorHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  expansorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  expansorBadgeStar: { fontSize: 14, color: "#1B060F", fontWeight: "800" },
  expansorTitle: { fontSize: 13, fontWeight: "700", color: "#D4AF37" },
  expansorSub: { fontSize: 11, color: "rgba(212,175,55,0.60)", marginTop: 1 },
  verPublicoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  verPublicoText: { fontSize: 11, color: "#D4AF37", fontWeight: "600" },
  specialtyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specialtyChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(74,12,12,0.50)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  specialtyText: { fontSize: 12, color: "#F4DAD5", fontWeight: "500" },
  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  linkLabel: { fontSize: 12, color: "#D4AF37", fontWeight: "600" },
  certCard: {
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  certCardStar: { fontSize: 18, color: "#D4AF37", marginTop: 2 },
  certCardTitle: { fontSize: 12, fontWeight: "700", color: "#D4AF37", marginBottom: 4 },
  certCardSub: { fontSize: 11, color: "rgba(244,218,213,0.55)", lineHeight: 17 },
});

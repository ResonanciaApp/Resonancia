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
import { getExpansorById } from "@/data/expansores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const PHOTO_SIZE = 96;

export default function ExpansorPerfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const expansor = getExpansorById(id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!expansor) {
    return (
      <View style={[styles.root, { backgroundColor: "#160108" }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#2E0510", "#160108"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Feather name="user-x" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Perfil no encontrado</Text>
        </View>
      </View>
    );
  }

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
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40, paddingHorizontal: H_PAD }]}
      >
        {/* ── Avatar + nombre ── */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={expansor.photo}
              style={styles.avatar}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
            />
            {expansor.certified && (
              <View style={styles.certBadge}>
                <Text style={styles.certStar}>✦</Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.foreground }]}>{expansor.name}</Text>

          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color="rgba(212,175,55,0.7)" />
            <Text style={styles.location}>{expansor.city}, {expansor.country}</Text>
          </View>

          <Text style={[styles.bio, { color: colors.mutedForeground }]}>{expansor.bio}</Text>
        </View>

        {/* ── Sección Expansor certificado ── */}
        <View style={styles.expansorSection}>
          {/* Cabecera */}
          <View style={styles.expansorHeader}>
            <View style={styles.expansorBadge}>
              <Text style={styles.expansorBadgeStar}>✦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expansorTitle}>
                {expansor.certified ? "Expansor Certificado" : "Expansor"}
              </Text>
              <Text style={styles.expansorSub}>por Resonancia</Text>
            </View>
            <Pressable
              onPress={() => router.push(`/expansor/${expansor.id}` as never)}
              style={({ pressed }) => [styles.verPublicoBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.verPublicoText}>Ver pantalla pública</Text>
              <Feather name="external-link" size={12} color="#D4AF37" />
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

          {/* Sello de certificación */}
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
    marginBottom: 8,
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
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { paddingTop: 12, gap: 16 },

  profileCard: {
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  avatarWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.35)",
    position: "relative",
    marginBottom: 4,
  },
  avatar: { width: "100%", height: "100%" },
  certBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "#D4AF37",
    borderRadius: 99,
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  certStar: { fontSize: 11, color: "#1B060F", fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "700", letterSpacing: 0.2, textAlign: "center" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  location: { fontSize: 13, color: "rgba(244,218,213,0.55)" },
  bio: { fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 4 },

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
  },
  expansorBadgeStar: { fontSize: 14, color: "#1B060F", fontWeight: "800" },
  expansorTitle: { fontSize: 14, fontWeight: "700", color: "#D4AF37" },
  expansorSub: { fontSize: 11, color: "rgba(212,175,55,0.60)", marginTop: 1 },
  verPublicoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    backgroundColor: "rgba(74,12,12,0.45)",
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

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
const PHOTO_SIZE = 120;

export default function ExpansorScreen() {
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
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Expansor no encontrado</Text>
          <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
            Este perfil no existe o fue removido.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 32 }]}
      >
        {/* Foto + info básica */}
        <View style={[styles.profileTop, { paddingHorizontal: H_PAD }]}>
          <View style={styles.photoWrap}>
            <Image
              source={expansor.photo}
              style={styles.photo}
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

          <View style={styles.nameBlock}>
            <Text style={[styles.name, { color: colors.foreground }]}>{expansor.name}</Text>

            {expansor.certified && (
              <View style={styles.certRow}>
                <Text style={styles.certLabel}>Expansora Certificada</Text>
              </View>
            )}

            <View style={styles.locationRow}>
              <Feather name="map-pin" size={12} color="rgba(212,175,55,0.7)" />
              <Text style={styles.location}>{expansor.city}, {expansor.country}</Text>
            </View>
          </View>
        </View>

        {/* Especialidades */}
        <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.specialtyWrap}>
            {expansor.specialty.map((s) => (
              <View key={s} style={styles.specialtyChip}>
                <Text style={styles.specialtyText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bio */}
        <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
          <Text style={styles.sectionTitle}>Sobre {expansor.name.split(" ")[0]}</Text>
          <Text style={[styles.bio, { color: colors.foreground }]}>{expansor.bio}</Text>
        </View>

        {/* Links */}
        {expansor.links && expansor.links.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <View style={styles.linksRow}>
              {expansor.links.map((link) => (
                <Pressable
                  key={link.label}
                  onPress={() => Linking.openURL(link.url)}
                  style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Feather name="external-link" size={13} color="#D4AF37" />
                  <Text style={styles.linkLabel}>{link.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Sello de certificación */}
        {expansor.certified && (
          <View style={[styles.certCard, { marginHorizontal: H_PAD }]}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(244,218,213,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingTop: 16 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.35)",
    position: "relative",
  },
  photo: { width: "100%", height: "100%" },
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
  nameBlock: { flex: 1, gap: 4 },
  name: { fontSize: 22, fontWeight: "700", letterSpacing: 0.2 },
  certRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  certLabel: { fontSize: 12, color: "#D4AF37", fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  location: { fontSize: 13, color: "rgba(244,218,213,0.55)" },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(212,175,55,0.65)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  specialtyWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specialtyChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(74,12,12,0.45)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  specialtyText: { fontSize: 13, color: "#F4DAD5", fontWeight: "500" },
  bio: { fontSize: 15, lineHeight: 23, opacity: 0.85 },

  linksRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  linkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  linkLabel: { fontSize: 13, color: "#D4AF37", fontWeight: "600" },

  certCard: {
    borderRadius: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
    marginBottom: 8,
  },
  certCardStar: { fontSize: 20, color: "#D4AF37", marginTop: 2 },
  certCardTitle: { fontSize: 13, fontWeight: "700", color: "#D4AF37", marginBottom: 4 },
  certCardSub: { fontSize: 12, color: "rgba(244,218,213,0.55)", lineHeight: 18 },
});

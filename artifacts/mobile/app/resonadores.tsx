import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { ARTISTS, getArtistTrackCount } from "@/data/artists";
import { GUIDES, getGuideTrackCount } from "@/data/guides";
import { useColors } from "@/hooks/useColors";

const C = {
  gold:     "#F9F9F9",
  goldSoft: "#A97A34",
  fg:       "#FFFFFF",
  muted:    "#c2c2c2",
  card:     "rgba(255,255,255,0.03)",
  border:   "rgba(212,175,55,0.18)",
  certified: "#5FB98C",
};

type RoleTag = "ARTISTA" | "VOZ GUÍA" | "LA CASA";

function RoleBadge({ role }: { role: RoleTag }) {
  const color =
    role === "VOZ GUÍA" ? "#7DB8C8" :
    role === "LA CASA"  ? C.goldSoft :
                          C.gold;
  return (
    <View style={[styles.roleBadge, { borderColor: color + "55", backgroundColor: color + "18" }]}>
      <Text style={[styles.roleText, { color }]}>{role}</Text>
    </View>
  );
}

function CertifiedSeal() {
  return (
    <View style={styles.certBadge}>
      <Feather name="check-circle" size={11} color={C.certified} />
      <Text style={styles.certText}>Certificado</Text>
    </View>
  );
}

function CollaboratorCard({
  photo,
  name,
  role,
  specialty,
  country,
  trackCount,
  trackLabel,
  certified,
  onPress,
}: {
  photo: import("react-native").ImageSourcePropType;
  name: string;
  role: RoleTag;
  specialty: string;
  country: string;
  trackCount: number;
  trackLabel: string;
  certified?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}
    >
      {/* Foto circular */}
      <View style={styles.photoWrap}>
        <Image source={photo} style={styles.photo} contentFit="cover" />
        {role === "LA CASA" && (
          <LinearGradient
            colors={["#4A0C0C", "#27070E", "#1B060F"]}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
        </View>

        <View style={styles.metaRow}>
          <Feather name="map-pin" size={10} color={C.muted} />
          <Text style={styles.metaText}>{country}</Text>
          <View style={styles.dot} />
          <Text style={styles.metaText}>
            {trackCount > 0 ? `${trackCount} ${trackLabel}` : "Próximamente"}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Feather name="chevron-right" size={18} color={C.muted} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSub}>{subtitle}</Text>
    </View>
  );
}

export default function ResonadoresScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const allGuides = GUIDES;
  const allArtists = ARTISTS;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={["#4A0C0C", "#27070E", "#1B060F"]}
          style={[styles.hero, { paddingTop: topPad + 16 }]}
        >
          <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ marginBottom: 16, marginTop: -20 }} />

          <View style={styles.heroCenter}>
            <View style={styles.heroIconWrap}>
              <Feather name="award" size={28} color={C.gold} />
            </View>
            <View style={{ height: 52 }} />
            <Text style={styles.heroTitle}>Resonadores</Text>
            <Text style={styles.heroSub}>
              Las voces, los artistas y los guías que dan vida a esta experiencia. Cada uno aporta su esencia para acompañarte en el camino.
            </Text>
            <View style={styles.heroCertRow}>
              <Feather name="check-circle" size={13} color={C.certified} />
              <Text style={styles.heroCertText}>Certificados</Text>
            </View>
          </View>

          {/* Línea decorativa */}
          <LinearGradient
            colors={["transparent", C.gold + "55", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.heroDivider}
          />
        </LinearGradient>

        <View style={styles.content}>
          {/* ── Voces Guía ── */}
          <SectionHeader
            title="Voces Guía"
            subtitle="Maestros y facilitadores que guían tu meditación con presencia y cuidado"
          />

          {allGuides.map((guide) => {
            const trackCount = getGuideTrackCount(guide.id);
            const isHouse = !guide.featured;
            return (
              <CollaboratorCard
                key={guide.id}
                photo={guide.photo}
                name={guide.name}
                role={isHouse ? "LA CASA" : "VOZ GUÍA"}
                specialty={guide.specialty}
                country={guide.country}
                trackCount={trackCount}
                trackLabel={trackCount === 1 ? "meditación" : "meditaciones"}
                certified={guide.certified}
                onPress={() => router.push(`/guiador/${guide.id}` as never)}
              />
            );
          })}

          <View style={styles.sectionGap} />

          {/* ── Artistas ── */}
          <SectionHeader
            title="Artistas"
            subtitle="Productores y músicos que componen los paisajes sonoros de la app"
          />

          {allArtists.map((artist) => {
            const trackCount = getArtistTrackCount(artist.id);
            const isHouse = !artist.featured;
            return (
              <CollaboratorCard
                key={artist.id}
                photo={artist.photo}
                name={artist.name}
                role={isHouse ? "LA CASA" : "ARTISTA"}
                specialty={artist.genre}
                country={artist.country}
                trackCount={trackCount}
                trackLabel={trackCount === 1 ? "pista" : "pistas"}
                certified={artist.certified}
                onPress={() => router.push(`/artista/${artist.id}` as never)}
              />
            );
          })}

          {/* ── Pie ── */}
          <View style={styles.footer}>
            <LinearGradient
              colors={["transparent", C.gold + "33", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerLine}
            />
            <Text style={styles.footerText}>
              Todos los Resonadores son evaluados y certificados por el equipo de Resonancia antes de publicar su contenido en la app.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroCenter: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "700",
    color: C.fg,
    letterSpacing: 0.3,
    marginBottom: 12,
    textAlign: "center",
  },
  heroSub: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: C.muted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 14,
  },
  heroCertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroCertText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: C.certified,
    letterSpacing: 0.3,
  },
  heroDivider: {
    height: 1,
    width: "100%",
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  // Section headers
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: C.fg,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: "Manrope",
    fontSize: 12.5,
    color: C.muted,
    lineHeight: 18,
  },
  sectionGap: { height: 32 },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 0,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  photoWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.3)",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  info: {
    flex: 1,
    gap: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: C.fg,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  specialty: {
    fontFamily: "Manrope",
    fontSize: 12.5,
    color: C.muted,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  metaText: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: C.muted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.muted,
    opacity: 0.5,
  },

  // Role badge
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: "Manrope",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },

  // Certified
  certBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  certText: {
    fontFamily: "Manrope",
    fontSize: 10.5,
    color: C.certified,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 16,
  },
  footerLine: {
    height: 1,
    width: "80%",
  },
  footerText: {
    fontFamily: "Manrope",
    fontSize: 11.5,
    color: C.muted,
    textAlign: "center",
    lineHeight: 18,
    fontStyle: "italic",
    maxWidth: 300,
  },
});

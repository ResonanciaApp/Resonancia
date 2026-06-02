import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { usePremium } from "@/context/PremiumContext";

const IMAGES = [
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-2.jpg"),
  require("@/assets/images/sessions/session-5.jpg"),
  require("@/assets/images/sessions/session-8.jpg"),
];

const P = {
  bg0:        "#06150F",
  bg1:        "#0D261D",
  bg2:        "#17352A",
  glow:       "#234236",
  green:      "#5FB98C",
  greenSoft:  "#3E8A66",
  gold:       "#D6A14D",
  goldSoft:   "#C89544",
  goldHi:     "#F0C36A",
  textMain:   "#EDE7DA",
  textMuted:  "#D5C8B2",
  btnFrom:    "#173A2B",
  btnTo:      "#244935",
  border:     "#A97A34",
};

const PERKS = [
  "Catálogo completo desbloqueado",
  "Favoritos y diario ilimitados",
  "Temporizador de sueño extendido",
];

function PremiumActiveBanner() {
  return (
    <View style={styles.outerActiveWrap}>
      {/* Borde dorado sutil */}
      <LinearGradient
        colors={["rgba(235,203,130,0.55)", "rgba(194,145,63,0.35)", "rgba(122,90,38,0.25)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goldBorder}
      >
      {/* Fondo verde oscuro */}
      <LinearGradient
        colors={["#1A4231", "#0E2D20"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardActive}
      >
        {/* Top glow */}
        <View style={styles.topGlow} />

        {/* Insignia verde con check dorado */}
        <View style={styles.activeBadge}>
          <Feather name="check" size={26} color={P.goldHi} />
        </View>

        {/* Eyebrow */}
        <Text style={[styles.eyebrow, { color: P.green, marginTop: 14 }]}>
          Membresía activa
        </Text>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: P.gold }]}>Eres Premium</Text>
          <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 24, height: 24, marginLeft: 10, marginTop: 6 }} contentFit="contain" />
        </View>

        {/* Divider line */}
        <LinearGradient
          colors={["transparent", P.green, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />

        {/* Lista de beneficios con check verde */}
        <View style={styles.perks}>
          {PERKS.map((perk) => (
            <View key={perk} style={styles.perkRow}>
              <View style={styles.perkCheck}>
                <Feather name="check" size={12} color={P.green} />
              </View>
              <Text style={[styles.perkText, { color: P.textMuted }]}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* CTA secundario */}
        <Pressable
          onPress={() => router.push("/membresia" as never)}
          style={({ pressed }) => [styles.btnWrap, styles.btnWrapActive, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={[P.btnFrom, P.btnTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={[styles.btnText, { color: P.gold }]}>Gestionar membresía</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
      </LinearGradient>
    </View>
  );
}

export default function PremiumBanner() {
  const { isPremium } = usePremium();
  if (isPremium) return <PremiumActiveBanner />;

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={[P.bg1, P.bg0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        {/* Top glow */}
        <View style={styles.topGlow} />

        {/* Eyebrow */}
        <Text style={[styles.eyebrow, { color: P.textMuted }]}>
          Únete a la comunidad
        </Text>

        {/* Premium title */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: P.gold }]}>Premium</Text>
          <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 26, height: 26, marginLeft: 10, marginTop: 6 }} contentFit="contain" />
        </View>

        {/* Divider line */}
        <LinearGradient
          colors={["transparent", P.goldSoft, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.divider}
        />

        {/* Description */}
        <Text style={[styles.sub, { color: P.textMuted }]}>
          Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.
        </Text>

        {/* Preview images with star overlay */}
        <View style={styles.images}>
          {IMAGES.map((src, i) => (
            <View key={i} style={{ position: "relative" }}>
              <Image source={src} style={styles.thumb} contentFit="cover" />
              <Image
                source={require("../assets/images/estrella-premium.png")}
                style={{ position: "absolute", top: 4, left: 4, width: 18, height: 18, zIndex: 2 }}
                contentFit="contain"
              />
            </View>
          ))}
        </View>

        {/* CTA button */}
        <Pressable
          onPress={() => router.push("/membresia" as never)}
          style={({ pressed }) => [styles.btnWrap, { opacity: pressed ? 0.88 : 1 }]}
        >
          <LinearGradient
            colors={[P.btnFrom, P.btnTo]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={[styles.btnText, { color: P.gold }]}>Probar gratis</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 22,
    borderWidth: 0.6,
    borderColor: "rgba(169,122,52,0.28)",
    overflow: "hidden",
    opacity: 0.82,
    shadowColor: "#06150F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  outerActiveWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 22,
    overflow: "hidden",
    opacity: 0.82,
  },
  goldBorder: {
    borderRadius: 22,
    padding: 0.8,
    shadowColor: "#06150F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
  },
  cardActive: {
    borderRadius: 20.5,
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  activeBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(95,185,140,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(95,185,140,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  perks: {
    alignSelf: "stretch",
    gap: 10,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  perkCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(95,185,140,0.14)",
    borderWidth: 1,
    borderColor: "rgba(95,185,140,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: {
    fontSize: 13.5,
    flex: 1,
    letterSpacing: 0.2,
  },
  btnWrapActive: {
    borderColor: "rgba(95,185,140,0.55)",
  },
  card: {
    paddingVertical: 30,
    paddingHorizontal: 22,
    alignItems: "center",
  },
  topGlow: {
    position: "absolute",
    top: -30,
    width: 200,
    height: 80,
    borderRadius: 100,
    backgroundColor: "rgba(35,66,54,0.55)",
    alignSelf: "center",
  },
  eyebrow: {
    fontSize: 13,
    letterSpacing: 0.5,
    marginBottom: 6,
    textAlign: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  star: {
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    width: 160,
    height: 1,
    marginBottom: 16,
  },
  sub: {
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
    maxWidth: 270,
  },
  images: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 26,
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(169,122,52,0.3)",
  },
  btnWrap: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: P.border,
    overflow: "hidden",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 36,
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

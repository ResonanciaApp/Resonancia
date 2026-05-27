import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { View, Text, Pressable, StyleSheet } from "react-native";

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
  gold:       "#D6A14D",
  goldSoft:   "#C89544",
  goldHi:     "#F0C36A",
  textMain:   "#EDE7DA",
  textMuted:  "#D5C8B2",
  btnFrom:    "#173A2B",
  btnTo:      "#244935",
  border:     "#A97A34",
};

export default function PremiumBanner() {
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
          <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 22, height: 22, marginLeft: 8 }} contentFit="contain" />
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
    borderWidth: 1,
    borderColor: "rgba(169,122,52,0.45)",
    overflow: "hidden",
    shadowColor: "#06150F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 10,
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

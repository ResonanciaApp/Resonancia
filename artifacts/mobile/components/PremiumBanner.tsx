import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { usePremium } from "@/context/PremiumContext";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { usePremiumContent } from "@/hooks/usePremiumContent";
import { resolveAvatarUrl } from "@/lib/avatar";

const IMAGES = [
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-2.jpg"),
  require("@/assets/images/sessions/session-4.jpg"),
  require("@/assets/images/sessions/session-5.jpg"),
  require("@/assets/images/sessions/session-6.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
  require("@/assets/images/sessions/session-8.jpg"),
  require("@/assets/images/sessions/session-9.jpg"),
  require("@/assets/images/sessions/session-10.jpg"),
  require("@/assets/images/sessions/session-11.jpg"),
];

const AMBIENT_IMAGES = [
  require("@/assets/images/sessions/ambiental-123-cascada.jpg"),
  require("@/assets/images/sessions/ambiental-123-lago.jpg"),
  require("@/assets/images/sessions/ambiental-espacio-profundo.jpg"),
  require("@/assets/images/sessions/ambiental-rrrr-binaural.jpg"),
  require("@/assets/images/sessions/ambiental-test-01-lluvia-suave.jpg"),
  require("@/assets/images/sessions/ambiental-test-02-bosque-amanecer.jpg"),
  require("@/assets/images/sessions/ambiental-test-03-oceano-calma.jpg"),
  require("@/assets/images/sessions/ambiental-test-04-viento-bambues.jpg"),
  require("@/assets/images/sessions/ambiental-test-05-fuego-hogar.jpg"),
  require("@/assets/images/sessions/ambiental-test-06-noche-estrellas.jpg"),
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
  textMuted:  "#FFFFFF",
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

export default function PremiumBanner({
  sleepVariant = false,
}: {
  sleepVariant?: boolean;
}) {
  const { isPremium } = usePremium();
  const settings = usePremiumContent();
  const surface = sleepVariant ? "sleep" : "home";
  const content = settings.content[surface];
  const { width: viewportWidth } = useWindowDimensions();
  const defaultPreviewCardSize = (viewportWidth - 15) / 4;
  if (isPremium) return null;

  return (
    <View style={[styles.outer, sleepVariant && styles.sleepOuter]}>
      <View style={[styles.card, sleepVariant && styles.sleepCard]}>
        {sleepVariant ? (
          <>
            <Image
              source={require("../assets/images/estrella-premium.png")}
              style={styles.sleepStar}
              contentFit="contain"
            />
            <Text style={styles.sleepTitle}>{content.title}</Text>
          </>
        ) : (
          <>
            <Image
              source={require("../assets/images/estrella-premium.png")}
              style={styles.defaultStar}
              contentFit="contain"
            />
            <View style={styles.defaultTitle}>
              {content.title.split(/\s+/).map((word, index) => (
                <Text key={index} style={[styles.sleepTitle, styles.defaultTitleWord, word.toLowerCase() === "premium" && styles.defaultPremiumWord]}>{word}</Text>
              ))}
            </View>
          </>
        )}

        {/* Description */}
        <Text style={[styles.sub, { color: P.textMuted }]}>
          {content.description}
        </Text>

        {/* Preview images with star overlay */}
        {content.images.length > 0 && <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.images, styles.defaultImages]}
          style={[
            styles.imagesScroll,
            { width: viewportWidth + 17, marginLeft: -22 },
          ]}
        >
          {content.images.map((path, i) => (
            <View
              key={i}
              style={[
                styles.previewCard,
                {
                  width: defaultPreviewCardSize,
                  height: defaultPreviewCardSize,
                  borderWidth: 0,
                },
              ]}
            >
              <Image source={path.startsWith("builtin:")
                ? AMBIENT_IMAGES[Number(path.slice(8))]
                : { uri: resolveAvatarUrl(`/api/premium-content/image/${surface}/${i}?revision=${settings.revision}`)! }}
                style={styles.thumb} contentFit="cover" />
              <Image
                source={require("../assets/images/estrella-premium.png")}
                style={{ position: "absolute", top: 4, left: 4, width: 18, height: 18, zIndex: 2 }}
                contentFit="contain"
              />
            </View>
          ))}
        </ScrollView>}

        {/* CTA button */}
        <Pressable
          onPress={() => router.push("/membresia" as never)}
          style={({ pressed }) => [
            styles.btnWrap,
            styles.freeTrialButtonWrap,
            {
              width: Math.max(178, viewportWidth - 217),
              alignSelf: "center",
            },
            { opacity: pressed ? 0.88 : 1 },
          ]}
        >
          <View style={[styles.btn, styles.freeTrialButtonInner]}>
            <Text
              style={[
                styles.btnText,
                styles.freeTrialButtonText,
              ]}
            >
              Probar gratis
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 15,
    borderWidth: 0,
    borderColor: "transparent",
    overflow: "visible",
    opacity: 1,
  },
  outerActiveWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 15,
    overflow: "hidden",
    opacity: 0.82,
  },
  sleepOuter: {
    marginHorizontal: 0,
    marginTop: 26,
    borderWidth: 0,
    borderColor: "transparent",
  },
  goldBorder: {
    borderRadius: 15,
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
    fontFamily: "Manrope",
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
    overflow: "visible",
    backgroundColor: "transparent",
  },
  sleepCard: {
    backgroundColor: "transparent",
  },
  sleepStar: {
    width: 36,
    height: 36,
    alignSelf: "center",
    marginBottom: 12,
  },
  defaultStar: {
    width: 36,
    height: 36,
    alignSelf: "center",
    marginBottom: 10,
  },
  sleepTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 14,
  },
  defaultTitle: {
    marginTop: 6,
    marginBottom: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 6,
  },
  defaultTitleWord: {
    marginBottom: 0,
  },
  defaultPremiumWord: {
    color: MEMBERSHIP_AURORA.premium.accent,
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
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  star: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
  },
  divider: {
    width: 160,
    height: 1,
    marginBottom: 16,
  },
  sub: {
    fontFamily: "Manrope",
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 22,
    maxWidth: 270,
  },
  images: {
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 0,
  },
  imagesScroll: {
    width: "100%",
    marginBottom: 26,
  },
  defaultImages: {
    gap: 9,
  },
  sleepImages: {
    alignSelf: "stretch",
    marginHorizontal: -22,
    marginBottom: 26,
  },
  previewCard: {
    position: "relative",
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(169,122,52,0.3)",
  },
  thumb: {
    width: "100%",
    height: "100%",
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
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  freeTrialButtonText: {
    color: "#F9F9F9",
  },
  freeTrialButtonWrap: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: MEMBERSHIP_AURORA.trialButtonBackground,
  },
  freeTrialButtonInner: {
    paddingVertical: 14,
  },
});

import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.55)";

type AncestralItem = {
  slug: string;
  title: string;
  image: ReturnType<typeof require>;
  desc: string;
};

const ITEMS: AncestralItem[] = [
  {
    slug: "cuencos",
    title: "Cuencos",
    image: require("@/assets/images/ancestral/cuencos.png"),
    desc: "Los cuencos tibetanos son instrumentos de meditación milenarios, forjados en aleaciones de hasta siete metales sagrados. Su vibración crea ondas de sonido que penetran cada célula del cuerpo, induciendo un estado de calma profunda. Utilizados durante siglos en monasterios budistas del Himalaya, armonizan los chakras y disuelven bloqueos energéticos. Al golpear o frotar el borde con el mazo, se genera un tono resonante que equilibra el sistema nervioso. La práctica regular reduce el estrés, mejora la concentración y facilita la entrada en estados meditativos profundos. Son considerados portales sonoros hacia la consciencia expandida. Una invitación a soltar todo lo que no eres.",
  },
  {
    slug: "gongs",
    title: "Gongs",
    image: require("@/assets/images/ancestral/gongs.png"),
    desc: "El gong es uno de los instrumentos más antiguos y poderosos del arsenal sonoro de la humanidad. Sus vibraciones se propagan en capas superpuestas que envuelven al oyente en un baño de frecuencias purificadoras. Originario de culturas del sudeste asiático, ha sido usado en rituales de sanación, ceremonias espirituales y templos sagrados. Cada golpe produce un espectro de armónicos únicos que resuenan con distintos centros energéticos del cuerpo. El baño de gong induce estados de consciencia similares a la meditación profunda o el sueño lúcido. Libera tensiones acumuladas y activa el proceso natural de regeneración celular. Es una experiencia sonora de transformación total.",
  },
  {
    slug: "digeridoos",
    title: "Digeridoos",
    image: require("@/assets/images/ancestral/digeridoos.png"),
    desc: "El didjeridoo es el instrumento de viento más antiguo del mundo, nacido en comunidades aborígenes de Australia hace más de 40,000 años. Su sonido grave y continuo —producido por la técnica de respiración circular— sincroniza los hemisferios cerebrales. Los aborígenes lo consideran un vehículo para comunicarse con los espíritus del Dreamtime, la dimensión ancestral de la existencia. Sus vibraciones penetran profundamente en los tejidos del cuerpo, liberando tensión muscular y estimulando el sistema linfático. El zumbido calma el sistema nervioso autónomo y reduce naturalmente los niveles de cortisol. Se utiliza en terapias sonoras modernas para tratar insomnio, ansiedad y dolor crónico. Escucharlo es reconectar con la memoria más antigua de la tierra.",
  },
  {
    slug: "tambores",
    title: "Tambores",
    image: require("@/assets/images/ancestral/tambores.png"),
    desc: "El tambor chamánico es el instrumento sagrado por excelencia de los sanadores de todas las tradiciones indígenas del mundo. Su ritmo primordial imita el latido del corazón de la Gran Madre Tierra, guiando al oyente hacia estados de trance y visión. La frecuencia del tambor —entre 4 y 7 Hz— coincide con las ondas theta del cerebro, el estado de ensoñación profunda. Los chamanes lo utilizan como vehículo para viajar entre mundos, sanar enfermedades del alma y recuperar partes perdidas del ser. Cada golpe es una invocación, un llamado a las fuerzas naturales que sostienen la vida. La práctica refuerza la conexión con el cuerpo, libera emociones reprimidas y activa la intuición. Es el pulso original de toda música sagrada.",
  },
  {
    slug: "naturaleza",
    title: "Sonidos Naturaleza",
    image: require("@/assets/images/ancestral/naturaleza.png"),
    desc: "Los sonidos de la naturaleza son la primera medicina sonora que conoció la humanidad — el lenguaje original del planeta. El murmullo del agua, el viento entre los árboles, el canto de los pájaros y la lluvia sobre las hojas regulan el sistema nervioso con una eficacia que ningún instrumento artificial puede igualar. Científicamente, su exposición reduce la presión arterial, disminuye la hormona del estrés y acelera la recuperación. Cada ecosistema tiene su propia sinfonía: el océano trae calma y expansión; el bosque, enraizamiento y presencia; la lluvia, limpieza y renovación. Los sonidos naturales sincronizan el ritmo interno del cuerpo con el de la Tierra misma. Escucharlos conscientemente es una práctica de meditación en sí misma. La naturaleza siempre ha sabido cómo curar.",
  },
  {
    slug: "flautas",
    title: "Flautas",
    image: require("@/assets/images/ancestral/flautas.png"),
    desc: "La flauta es uno de los instrumentos más antiguos de la historia humana, con ejemplares tallados en hueso que datan de más de 35,000 años. Su voz —cálida, melódica y directamente ligada al aliento— habla directamente al corazón y al alma. En tradiciones nativas americanas, es un instrumento de sanación emocional y comunicación espiritual. Su sonido activa el nervio vago, relajando profundamente el cuerpo y abriendo el corazón. Las flautas de madera, bambú y hueso sagrado generan armónicos que limpian el campo áurico y disuelven la armadura emocional. Son compañeras perfectas para meditación, yoga y los momentos de transición entre el día y el sueño. El aliento que las anima es el mismo aliento que anima la vida.",
  },
];

export default function AncestralInfoScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const item = ITEMS.find((i) => i.slug === slug);
  if (!item) return null;

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* ── Sticky header ── */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{item.title}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 + bottomPad }}>
        {/* ── Banner ── */}
        <View style={styles.banner}>
          <Image source={item.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
          <LinearGradient
            colors={["transparent", "rgba(22,1,8,0.50)", "#16040A"]}
            locations={[0.40, 0.75, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Gold accent line */}
          <View style={styles.bannerAccent} />
        </View>

        {/* ── Title ── */}
        <View style={styles.titleRow}>
          <View style={styles.goldDot} />
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.goldDot} />
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Description ── */}
        <View style={styles.descCard}>
          <Text style={styles.desc}>{item.desc}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#210911" },

  stickyHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 15, paddingBottom: 10,
  },
  headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#fff", letterSpacing: 0.2 },

  banner: { height: 280, position: "relative" },
  bannerAccent: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: "rgba(212,175,55,0.30)" },

  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 22, marginBottom: 10, paddingHorizontal: 20 },
  title: { fontFamily: "Manrope", fontSize: 26, fontWeight: "800", color: TEXT, letterSpacing: 0.5, textAlign: "center" },
  goldDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, opacity: 0.7 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(212,175,55,0.20)", marginHorizontal: 30, marginBottom: 22 },

  descCard: { marginHorizontal: 20, backgroundColor: "rgba(74,12,12,0.12)", borderRadius: 16, padding: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(212,175,55,0.15)" },
  desc: { fontFamily: "Manrope", fontSize: 15, color: MUTED, lineHeight: 26, textAlign: "center" },
});

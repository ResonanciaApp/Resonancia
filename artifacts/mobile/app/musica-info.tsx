import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: W, height: H } = Dimensions.get("window");
const GOLD  = "#D4AF37";
const GOLD2 = "#E9C46A";
const TEXT  = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.5)";
const BG    = "#1B060F";
const BG_MID= "#27070E";

const R2 = 0;
const R3 = 380;
const R4 = 820;
const R5 = 1260;
const TOTAL_SCROLL = H + 1500;

const HERO_IMG = require("@/assets/images/cat-musica.png");
const IMG2     = require("@/assets/images/sessions/session-18.jpg");
const IMG3     = require("@/assets/images/sessions/session-20.jpg");

function mkReveal(scrollY: Animated.Value, start: number, range = 180, dy = 40) {
  return {
    opacity:    scrollY.interpolate({ inputRange: [start, start+range], outputRange: [0,1], extrapolate:"clamp" }),
    translateY: scrollY.interpolate({ inputRange: [start, start+range], outputRange: [dy,0], extrapolate:"clamp" }),
  };
}

const BENEFITS = [
  { icon: "headphones", label: "Reduce la ansiedad",    sub: "Las frecuencias de 432 Hz sincronizan el sistema nervioso y calman la mente." },
  { icon: "moon",       label: "Facilita el sueño",     sub: "La música ambient de baja frecuencia induce estados delta de descanso profundo." },
  { icon: "zap",        label: "Amplifica la energía",  sub: "Las escalas enteógenas activan canales de percepción ampliada." },
  { icon: "globe",      label: "Conexión global",       sub: "Música tribal de tradiciones del mundo — de Bali a los Andes." },
];

function BenefitCard({ icon, label, sub }: { icon: string; label: string; sub: string }) {
  return (
    <View style={info.benefitCard}>
      <View style={info.benefitIcon}><Feather name={icon as never} size={22} color={GOLD} /></View>
      <View style={{ flex: 1 }}>
        <Text style={info.benefitLabel}>{label}</Text>
        <Text style={info.benefitSub}>{sub}</Text>
      </View>
    </View>
  );
}

export default function MusicaInfoScreen() {
  const insets  = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  const heroTx = scrollY.interpolate({ inputRange:[0,H], outputRange:[0,-H*0.35], extrapolate:"clamp" });
  const barW   = scrollY.interpolate({ inputRange:[0,TOTAL_SCROLL], outputRange:[0,W-40], extrapolate:"clamp" });

  const s2 = mkReveal(scrollY, R2);
  const s3 = mkReveal(scrollY, R3);
  const s4 = mkReveal(scrollY, R4);
  const s5 = mkReveal(scrollY, R5);

  useEffect(() => {
    scrollY.setValue(0);
  }, [scrollY]);

  return (
    <View style={{ flex:1, backgroundColor: BG }}>
      {/* Barra de progreso */}
      <View style={[info.progressTrack, { top: insets.top + 8 }]}>
        <Animated.View style={[info.progressFill, { width: barW }]} />
      </View>

      {/* Botón cerrar */}
      <Pressable onPress={()=>router.back()} hitSlop={10}
        style={[info.closeBtn, { top: insets.top + 4 }]}>
        <Feather name="x" size={20} color="#fff" />
      </Pressable>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        {/* ── HERO ── */}
        <View style={{ height: H, overflow:"hidden" }}>
          <Animated.View style={{ flex:1, transform:[{ translateY: heroTx }] }}>
            <Image source={HERO_IMG} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
          </Animated.View>
          <LinearGradient colors={["transparent", BG_MID, BG]} locations={[0.4,0.78,1]}
            style={StyleSheet.absoluteFill} />
          <View style={[info.heroContent, { paddingBottom: insets.bottom + 48 }]}>
            <Text style={info.heroCat}>RESONANCIA · MÚSICA</Text>
            <Text style={info.heroTitle}>Paisajes Sonoros</Text>
            <Text style={info.heroSub}>
              Ambient, enteógena, tribal y étnica — música que abre mundos interiores.
            </Text>
            <View style={info.heroCta}>
              <Feather name="chevron-down" size={28} color={GOLD} />
            </View>
          </View>
        </View>

        {/* ── SECCIÓN 2: Qué es ── */}
        <Animated.View style={[info.section, { opacity: s2.opacity, transform:[{ translateY: s2.translateY }] }]}>
          <Text style={info.sectionTitle}>¿Qué es la música consciente?</Text>
          <Text style={info.sectionBody}>
            Va más allá del entretenimiento. Cada frecuencia, ritmo y textura está diseñado
            para inducir estados específicos de conciencia — desde la calma profunda hasta la
            expansión perceptual.{"\n\n"}
            Nuestra selección reúne productores que trabajan en la frontera entre la música,
            la neuroacústica y las tradiciones espirituales del mundo.
          </Text>
          <Image source={IMG2} style={info.sectionImg} contentFit="cover" />
        </Animated.View>

        {/* ── SECCIÓN 3: Géneros ── */}
        <Animated.View style={[info.section, { opacity: s3.opacity, transform:[{ translateY: s3.translateY }] }]}>
          <Text style={info.sectionTitle}>Los cuatro géneros</Text>
          {[
            { t:"Ambient", d:"Texturas etéreas, drones y pad que disuelven el ruido mental." },
            { t:"Enteógena", d:"Escalas y ritmos que expanden la percepción y activan estados no ordinarios." },
            { t:"Tribal", d:"Percusiones y cantos de tradiciones chamánicas globales." },
            { t:"Étnica", d:"Instrumentos del mundo — sitar, duduk, kora — en paisajes contemporáneos." },
          ].map((g)=>(
            <View key={g.t} style={info.genreRow}>
              <View style={info.genreDot} />
              <View style={{ flex:1 }}>
                <Text style={info.genreTitle}>{g.t}</Text>
                <Text style={info.genreSub}>{g.d}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ── SECCIÓN 4: Beneficios ── */}
        <Animated.View style={[info.section, { opacity: s4.opacity, transform:[{ translateY: s4.translateY }] }]}>
          <Text style={info.sectionTitle}>Beneficios comprobados</Text>
          {BENEFITS.map((b)=><BenefitCard key={b.label} {...b} />)}
        </Animated.View>

        {/* ── SECCIÓN 5: CTA ── */}
        <Animated.View style={[info.ctaSection, { opacity: s5.opacity, transform:[{ translateY: s5.translateY }] }]}>
          <Text style={info.ctaTitle}>Empieza a escuchar</Text>
          <Text style={info.ctaBody}>Elige un género y déjate llevar por el sonido.</Text>
          <Pressable onPress={()=>router.back()} style={info.ctaBtn}>
            <LinearGradient colors={[GOLD, GOLD2]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />
            <Text style={info.ctaBtnText}>Explorar Música</Text>
          </Pressable>
          <View style={{ height: 60 }} />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const info = StyleSheet.create({
  progressTrack:{ position:"absolute", left:20, right:20, height:2, backgroundColor:"rgba(255,255,255,0.15)", borderRadius:1, zIndex:10 },
  progressFill: { height:2, backgroundColor:GOLD, borderRadius:1 },
  closeBtn:     { position:"absolute", right:16, zIndex:11, width:36, height:36, borderRadius:18, backgroundColor:"rgba(0,0,0,0.45)", alignItems:"center", justifyContent:"center" },
  heroContent:  { position:"absolute", bottom:0, left:0, right:0, paddingHorizontal:24 },
  heroCat:      { fontSize:11, fontWeight:"700", letterSpacing:2, color:GOLD, marginBottom:10 },
  heroTitle:    { fontSize:38, fontWeight:"900", color:"#fff", letterSpacing:0.3, lineHeight:44, marginBottom:12 },
  heroSub:      { fontSize:15, color:"rgba(255,255,255,0.82)", lineHeight:23, marginBottom:20 },
  heroCta:      { alignItems:"center", marginTop:8 },
  section:      { paddingHorizontal:24, paddingTop:48 },
  sectionTitle: { fontSize:22, fontWeight:"800", color:TEXT, marginBottom:16, lineHeight:28 },
  sectionBody:  { fontSize:15, color:MUTED, lineHeight:24, marginBottom:20 },
  sectionImg:   { width:"100%", height:200, borderRadius:16, marginTop:8 },
  genreRow:     { flexDirection:"row", alignItems:"flex-start", gap:14, marginBottom:20 },
  genreDot:     { width:8, height:8, borderRadius:4, backgroundColor:GOLD, marginTop:6 },
  genreTitle:   { fontSize:16, fontWeight:"700", color:TEXT, marginBottom:4 },
  genreSub:     { fontSize:13, color:MUTED, lineHeight:20 },
  benefitCard:  { flexDirection:"row", alignItems:"flex-start", gap:16, marginBottom:24, backgroundColor:"rgba(74,12,12,0.18)", borderRadius:14, padding:16 },
  benefitIcon:  { width:40, height:40, borderRadius:20, backgroundColor:"rgba(212,175,55,0.12)", alignItems:"center", justifyContent:"center" },
  benefitLabel: { fontSize:15, fontWeight:"700", color:TEXT, marginBottom:4 },
  benefitSub:   { fontSize:13, color:MUTED, lineHeight:19 },
  ctaSection:   { paddingHorizontal:24, paddingTop:56, alignItems:"center" },
  ctaTitle:     { fontSize:26, fontWeight:"800", color:TEXT, textAlign:"center", marginBottom:12 },
  ctaBody:      { fontSize:15, color:MUTED, textAlign:"center", lineHeight:22, marginBottom:32 },
  ctaBtn:       { width:"100%", height:52, borderRadius:26, overflow:"hidden", alignItems:"center", justifyContent:"center" },
  ctaBtnText:   { fontSize:16, fontWeight:"700", color:"#1B060F" },
});

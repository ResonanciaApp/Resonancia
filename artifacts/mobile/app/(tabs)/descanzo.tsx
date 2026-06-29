import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { DESCANSO_SOUNDS } from "@/data/descanso-sounds";
import { useDescansoPlayer } from "@/hooks/useDescansoPlayer";

/* ─── Sleep tabs ────────────────────────────────────────────────────── */
const SLEEP_TABS = [
  { id: "dormirme", emoji: "😴", line1: "Dormirme",    line2: "rápido"    },
  { id: "zen",      emoji: "🙏", line1: "Modo",        line2: "zen"       },
  { id: "relax",    emoji: "🌿", line1: "Full",        line2: "relax"     },
  { id: "ruido",    emoji: "⛈️", line1: "Ruido",       line2: "ambiental" },
] as const;

type SleepTabId = typeof SLEEP_TABS[number]["id"] | "todos";

const TAB_UNSEL_COLORS: [string, string] = ["rgba(18,4,24,0.75)", "rgba(8,2,12,0.75)"];
const TAB_SEL_COLORS:   [string, string] = ["rgba(35,10,50,0.75)", "rgba(18,4,28,0.75)"];
const TAB_BORDER_SEL  = "#401950";
const TAB_TEXT_SEL    = "#E8D4FF";
const TAB_TEXT_UNSEL  = "rgba(232,212,255,0.45)";

const H_PAD = 20;
const { width: W, height: H } = Dimensions.get("window");

/* ─── Estrellas estáticas pre-generadas ─────────────────────────────── */
const STAR_ZONE = H * 0.42;
const STAR_COUNT = 110;
const COLS = 10;
const ROWS = Math.ceil(STAR_COUNT / COLS);
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const normalizedRow = row / ROWS;
  const rowFade = 1 - normalizedRow * 0.85;
  return {
    key: i,
    x: (col / COLS) * W + (Math.random() - 0.5) * (W / COLS) * 0.95,
    y: normalizedRow * STAR_ZONE + (Math.random() - 0.5) * (STAR_ZONE / ROWS) * 0.9,
    size: 0.8 + Math.random() * 1.6,
    minOpacity: (0.08 + Math.random() * 0.15) * rowFade,
    maxOpacity: (0.45 + Math.random() * 0.45) * rowFade,
    duration: 1200 + Math.random() * 2800,
    delay: Math.random() * 4000,
  };
});

function NightSky() {
  const twinkles = useRef(STARS.map((s) => new Animated.Value(s.minOpacity))).current;
  const shootX   = useRef(new Animated.Value(0)).current;
  const shootY   = useRef(new Animated.Value(0)).current;
  const shootOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    STARS.forEach((star, i) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(twinkles[i], {
            toValue: star.maxOpacity,
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: true,
          }),
          Animated.timing(twinkles[i], {
            toValue: star.minOpacity,
            duration: star.duration,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => { if (finished) loop(); });
      };
      loop();
    });

    const fire = () => {
      const sx = Math.random() * W * 0.5;
      const sy = 30 + Math.random() * H * 0.25;
      shootX.setValue(sx);
      shootY.setValue(sy);
      shootOp.setValue(0);
      Animated.sequence([
        Animated.timing(shootOp, { toValue: 0.9, duration: 120, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(shootX,  { toValue: sx + 130, duration: 550, useNativeDriver: true }),
          Animated.timing(shootY,  { toValue: sy + 90,  duration: 550, useNativeDriver: true }),
          Animated.timing(shootOp, { toValue: 0,        duration: 550, useNativeDriver: true }),
        ]),
      ]).start();
    };

    fire();
    const id = setInterval(fire, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map((star, i) => (
        <Animated.View
          key={star.key}
          style={{
            position: "absolute",
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: "#ffffff",
            opacity: twinkles[i],
          }}
        />
      ))}
      <Animated.View
        style={{
          position: "absolute",
          width: 70,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: "#ffffff",
          opacity: shootOp,
          transform: [
            { translateX: shootX },
            { translateY: shootY },
            { rotate: "32deg" },
          ],
        }}
      />
    </View>
  );
}

/* ─── Constantes del sheet ───────────────────────────────────────────── */
const TIMER_OPTIONS = [15, 30, 45, 60, 90] as const;
const SHEET_BG = "#14031E";

/* ─── NightTimerSheet (controlado desde DescansoScreen) ─────────────── */
interface NightTimerSheetProps {
  visible:      boolean;
  onClose:      () => void;
  timerMin:     number;
  setTimerMin:  (v: number) => void;
  fadeVol:      boolean;
  setFadeVol:   (v: boolean) => void;
}

function NightTimerSheet({
  visible, onClose, timerMin, setTimerMin, fadeVol, setFadeVol,
}: NightTimerSheetProps) {
  const insets     = useSafeAreaInsets();
  const slideY     = useRef(new Animated.Value(500)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      slideY.setValue(500);
      backdropOp.setValue(0);
      Animated.parallel([
        Animated.timing(slideY,     { toValue: 0,   duration: 320, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 1,   duration: 280, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(slideY,     { toValue: 500, duration: 260, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 0,   duration: 220, useNativeDriver: true }),
      ]).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  return (
    <Modal transparent animationType="none" visible statusBarTranslucent onRequestClose={onClose}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: backdropOp }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: 28 + insets.bottom, transform: [{ translateY: slideY }] },
        ]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.sheetHeader}>
          <Ionicons name="moon" size={20} color="#C4A8F5" />
          <Text style={styles.sheetTitle}>Prepara tu noche</Text>
        </View>

        <Text style={styles.sheetLabel}>Temporizador</Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((min) => {
            const sel = timerMin === min;
            return (
              <Pressable
                key={min}
                onPress={() => setTimerMin(min)}
                style={[styles.timerChip, sel && styles.timerChipSel]}
              >
                <Text style={[styles.timerChipText, sel && styles.timerChipTextSel]}>
                  {min} min
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fadeRow}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.fadeTitle}>Desvanecer volumen</Text>
            <Text style={styles.fadeSub}>El sonido baja gradualmente hasta silenciarse</Text>
          </View>
          <Switch
            value={fadeVol}
            onValueChange={setFadeVol}
            trackColor={{ false: "rgba(255,255,255,0.12)", true: "#7B4FCE" }}
            thumbColor={fadeVol ? "#C4A8F5" : "rgba(255,255,255,0.6)"}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ─── Indicador de reproducción ─────────────────────────────────────── */
function PlayingDot() {
  const op = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: "absolute", top: 6, right: 6,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: "#C4A8F5",
        opacity: op,
      }}
    />
  );
}

/* ─── Pantalla ──────────────────────────────────────────────────────── */
export default function DescansoScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab,   setActiveTab]   = useState<SleepTabId>("todos");
  const [timerSheet,  setTimerSheet]  = useState(false);
  const [timerMin,    setTimerMin]    = useState(30);
  const [fadeVol,     setFadeVol]     = useState(false);

  const player = useDescansoPlayer({ timerMinutes: timerMin, fadeVolume: fadeVol });

  const visibleSounds = activeTab === "todos"
    ? DESCANSO_SOUNDS
    : DESCANSO_SOUNDS.filter((s) => s.categoryId === activeTab);

  return (
    <View style={[styles.root, { backgroundColor: "#08010C" }]}>
      <StatusBar barStyle="light-content" />
      <NightSky />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: topPad + 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Ionicons name="moon" size={34} color="#C4A8F5" style={styles.heroIcon} />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Descanso</Text>
          <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.8)" }]}>
            Sonidos especialmente diseñados{"\n"}para un descanso profundo
          </Text>
        </View>

        {/* ── Tabs de modo ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabGrid}
          contentContainerStyle={styles.tabGridContent}
        >
          {SLEEP_TABS.map((tab) => {
            const sel = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [styles.tabCell, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={sel ? TAB_SEL_COLORS : TAB_UNSEL_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.tabGradient, sel && styles.tabGradientSel]}
                >
                  <Text style={[styles.tabEmoji, { opacity: sel ? 1 : 0.45 }]}>{tab.emoji}</Text>
                  <View>
                    <Text style={[styles.tabLine, { color: sel ? TAB_TEXT_SEL : TAB_TEXT_UNSEL }]}>{tab.line1}</Text>
                    <Text style={[styles.tabLine, { color: sel ? TAB_TEXT_SEL : TAB_TEXT_UNSEL }]}>{tab.line2}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Banner Prepara tu noche ── */}
        <Pressable
          style={({ pressed }) => [styles.nightBannerWrap, pressed && { opacity: 0.82 }]}
          onPress={() => setTimerSheet(true)}
        >
          <View style={styles.nightBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.nightBannerTitle}>Prepara tu noche</Text>
              <Text style={styles.nightBannerSub}>
                {timerMin} min{fadeVol ? " · fade" : ""}{player.selectedId ? " · reproduciendo" : ""}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </View>
        </Pressable>

        {/* ── Grilla de sonidos ── */}
        <View style={styles.soundGrid}>
          {visibleSounds.map((sound) => {
            const sel       = player.selectedId === sound.id;
            const playing   = sel && player.isPlaying;
            return (
              <Pressable
                key={sound.id}
                onPress={() => player.toggle(sound.id, sound.audioUri ?? null)}
                style={({ pressed }) => [styles.soundCell, pressed && { opacity: 0.88 }]}
              >
                <View style={[styles.soundImageWrap, sel && styles.soundImageWrapSel]}>
                  <Image source={sound.image} style={styles.soundImage} resizeMode="cover" />
                  {!sel && <View style={styles.soundOverlay} />}
                  {playing && <PlayingDot />}
                </View>
                <Text style={[styles.soundLabel, sel && styles.soundLabelSel]} numberOfLines={1}>
                  {sound.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

      </ScrollView>

      <NightTimerSheet
        visible={timerSheet}
        onClose={() => setTimerSheet(false)}
        timerMin={timerMin}
        setTimerMin={setTimerMin}
        fadeVol={fadeVol}
        setFadeVol={setFadeVol}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },

  /* NightTimerSheet */
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },
  sheetLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },
  timerChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  timerChipSel: {
    backgroundColor: "rgba(196,168,245,0.15)",
    borderColor: "rgba(196,168,245,0.5)",
  },
  timerChipText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  timerChipTextSel: {
    color: "#C4A8F5",
    fontWeight: "700",
  },
  fadeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  fadeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginBottom: 2,
  },
  fadeSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 16,
  },

  /* Sound grid */
  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: H_PAD,
    gap: 10,
    marginTop: 3,
    marginBottom: 6,
  },
  soundCell: {
    width: (W - H_PAD * 2 - 20) / 3,
    alignItems: "center",
  },
  soundImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  soundImageWrapSel: {
    borderColor: "rgba(255,255,255,0.8)",
  },
  soundImage: {
    width: "100%",
    height: "100%",
  },
  soundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  soundLabel: {
    marginTop: 6,
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
  soundLabelSel: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
  },

  /* Banner Prepara tu noche */
  nightBannerWrap: {
    marginHorizontal: H_PAD,
    marginTop: -10,
    marginBottom: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  nightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  nightBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 3,
  },
  nightBannerSub: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },

  /* Sleep tabs */
  tabGrid: {
    marginBottom: 32,
  },
  tabGridContent: {
    paddingHorizontal: H_PAD,
    gap: 10,
    flexDirection: "row",
  },
  tabCell: {
    width: Math.round((W - 2 * H_PAD - 10) / 2) - 15,
    borderRadius: 14,
    overflow: "hidden",
  },
  tabGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabGradientSel: {
    borderColor: TAB_BORDER_SEL,
  },
  tabEmoji: {
    fontSize: 26,
  },
  tabLine: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 28,
  },
  heroIcon: {
    marginTop: 14,
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

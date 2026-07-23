import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
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
import { LinearGradient } from "expo-linear-gradient";
import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useColors } from "@/hooks/useColors";
import { DESCANSO_SOUNDS } from "@/data/descanso-sounds";
import { getSessionsByDescansoTag, getSessionById } from "@/data/sessions";
import { useDescansoPlayerContext } from "@/context/DescansoPlayerContext";
import { SessionCard } from "@/components/SessionCard";
import { SessionCarousel } from "@/components/SessionCarousel";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

/* ─── Descanso tabs ─────────────────────────────────────────────────── */
const SLEEP_TABS = [
  { id: "historias", label: "Historias" },
  { id: "asmr",      label: "ASMR" },
  { id: "binaural",  label: "Sonidos Binaurales" },
  { id: "ambiental", label: "Ambientales" },
] as const;

type SleepTabId = typeof SLEEP_TABS[number]["id"];
const SOUND_TAB_IDS: SleepTabId[] = ["binaural", "ambiental"];

function SleepPill({
  sel, label, onPress,
}: { sel: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sleepPill, sel && styles.sleepPillSel, { opacity: pressed ? 0.7 : 1 }]}
    >
      {sel && <LinearGradient colors={["#190D5A", "#1A2A90"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />}
      <Text style={[styles.sleepPillText, sel && styles.sleepPillTextSel]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const H_PAD = 19;
const HERO_H = 220;
const { width: W, height: H } = Dimensions.get("window");
const RECENT_CARD_W = Math.round((W - H_PAD * 2) / 1.85);
const SOUND_CARD_W  = 120;

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
    <View style={[StyleSheet.absoluteFill, { opacity: 0.3 }]} pointerEvents="none">
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
const SHEET_BG = "#120A18";

/* ─── NightTimerSheet (controlado desde DescansoScreen) ─────────────── */
interface NightTimerSheetProps {
  visible:      boolean;
  onClose:      () => void;
  timerMin:     number | null;
  setTimerMin:  (v: number | null) => void;
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
        Animated.timing(slideY,     { toValue: 0,   duration: DURATION.SHEET_OPEN,  easing: easeOutCubic, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 1,   duration: DURATION.SHEET_OPEN,  easing: easeOutCubic, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(slideY,     { toValue: 500, duration: DURATION.SHEET_CLOSE, easing: easeOutCubic, useNativeDriver: true }),
        Animated.timing(backdropOp, { toValue: 0,   duration: DURATION.SHEET_CLOSE, easing: easeOutCubic, useNativeDriver: true }),
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
          <Ionicons name="moon" size={16} color="#FFFFFF" />
          <Text style={styles.sheetTitle}>Prepara tu noche</Text>
        </View>

        <Text style={styles.sheetLabel}>Temporizador</Text>
        <View style={styles.timerRow}>
          {TIMER_OPTIONS.map((min) => {
            const sel = timerMin === min;
            return (
              <Pressable
                key={min}
                onPress={() => setTimerMin(sel ? null : min)}
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
  const { theme: sceneTheme } = useSceneTheme();
  const bgGradient = sceneTheme.gradient;

  const [activeTab,   setActiveTab]   = useState<SleepTabId | null>(null);
  const [timerSheet,  setTimerSheet]  = useState(false);
  const { timerMinutes: timerMin, setTimerMinutes: setTimerMin, fadeVolume: fadeVol, setFadeVolume: setFadeVol, ...player } = useDescansoPlayerContext();

  const scrollY      = useRef(new Animated.Value(0)).current;
  const [stickyVisible, setStickyVisible] = useState(false);
  const stickyAnim = useRef(new Animated.Value(0)).current;
  const [tabsOffsetY, setTabsOffsetY] = useState(HERO_H);
  const [headerH,     setHeaderH]     = useState(60);
  const [tabsMounted, setTabsMounted] = useState(false);
  useEffect(() => {
    if (stickyVisible) {
      setTabsMounted(true);
      Animated.timing(stickyAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(stickyAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setTabsMounted(false);
      });
    }
  }, [stickyVisible]);

  // ── Borde del sticky header (tabs): se activa recién a partir de 1% de scroll ──
  const HEADER_BORDER_THRESHOLD = 0.01;
  const headerBorderActiveRef = useRef(false);
  const headerBorderAnim = useRef(new Animated.Value(0)).current;
  const scrollContentHeightRef = useRef(0);
  const scrollLayoutHeightRef = useRef(0);

  const {
    currentSession,
    isPlaying: sessionIsPlaying,
    elapsed: sessionElapsed,
    actualDurationSeconds: sessionDuration,
    playSession,
    pauseResume,
    stop,
    history,
    favorites,
  } = usePlayer();

  const { isPremium } = usePremium();

  const isSoundTab = activeTab !== null && SOUND_TAB_IDS.includes(activeTab);
  const visibleSounds = isSoundTab
    ? DESCANSO_SOUNDS.filter((s) => s.categoryId === activeTab)
    : [];

  const selectedSound = player.selectedId
    ? (DESCANSO_SOUNDS.find((s) => s.id === player.selectedId) ?? null)
    : null;
  const tabBarH = 68 + Math.max(8, bottomPad - 10);

  const visibleSessions = activeTab === "historias"
    ? [...getSessionsByDescansoTag("Historias para dormir"), ...getSessionsByDescansoTag("Historias infantiles")]
    : activeTab === "asmr"
      ? getSessionsByDescansoTag("ASMR")
      : [];

  const historiasForTodos = useMemo(() =>
    [...getSessionsByDescansoTag("Historias para dormir"), ...getSessionsByDescansoTag("Historias infantiles")],
    [],
  );
  const asmrForTodos = useMemo(() => getSessionsByDescansoTag("ASMR"), []);

  const allDescansoIds = useMemo(() => {
    const ids = new Set<string>();
    historiasForTodos.forEach((s) => ids.add(s.id));
    asmrForTodos.forEach((s) => ids.add(s.id));
    return ids;
  }, [historiasForTodos, asmrForTodos]);

  const recentInDescanso = useMemo(() => {
    const seen = new Set<string>();
    const result: import("@/data/sessions").Session[] = [];
    for (const h of history) {
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s && allDescansoIds.has(s.id)) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history, allDescansoIds]);

  const favoritesInDescanso = useMemo(() => {
    const result: import("@/data/sessions").Session[] = [];
    for (const id of favorites) {
      const s = getSessionById(id);
      if (s && allDescansoIds.has(s.id)) result.push(s);
    }
    return result;
  }, [favorites, allDescansoIds]);
  const binauralSounds = useMemo(() => DESCANSO_SOUNDS.filter((s) => s.categoryId === "binaural"), []);
  const ambientalSounds = useMemo(() => DESCANSO_SOUNDS.filter((s) => s.categoryId === "ambiental"), []);

  const cardW = (W - H_PAD * 2 - 14) / 2;

  // ── "Todas las sesiones" Modal ──
  const [allVisible,      setAllVisible]      = useState(false);
  const [allVisibleCount, setAllVisibleCount] = useState(20);
  const slideX = useRef(new Animated.Value(W)).current;
  const closeAll = () => {
    Animated.timing(slideX, { toValue: W, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => { setAllVisible(false); setAllVisibleCount(20); });
  };
  useEffect(() => {
    if (!allVisible) return;
    slideX.setValue(W);
    Animated.timing(slideX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [allVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const allDormiSessions = useMemo(
    () => [...historiasForTodos, ...asmrForTodos],
    [historiasForTodos, asmrForTodos],
  );

  return (
    <LinearGradient
      colors={bgGradient}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" />
      <GeoUniverseBackground />
      <NightSky />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: topPad + 2 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={(e) => {
          scrollLayoutHeightRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_w, h) => {
          scrollContentHeightRef.current = h;
        }}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollY.setValue(y);
          const visible = y > HERO_H * 0.5565;
          if (visible !== stickyVisible) setStickyVisible(visible);
          const scrollable = scrollContentHeightRef.current - scrollLayoutHeightRef.current;
          const progress = scrollable > 0 ? y / scrollable : 0;
          const shouldShowBorder = progress >= HEADER_BORDER_THRESHOLD;
          if (shouldShowBorder !== headerBorderActiveRef.current) {
            headerBorderActiveRef.current = shouldShowBorder;
            Animated.timing(headerBorderAnim, {
              toValue: shouldShowBorder ? 1 : 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }
        }}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Dormir</Text>
        </View>

        {/* ── Tabs de modo ── */}
        <View onLayout={(e) => setTabsOffsetY(e.nativeEvent.layout.y)} style={{ marginTop: 23 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabGrid}
            contentContainerStyle={styles.tabGridContent}
          >
            <SleepPill sel={activeTab === null} label="Todos" onPress={() => setActiveTab(null)} />
            {SLEEP_TABS.map((tab) => (
              <SleepPill
                key={tab.id}
                sel={activeTab === tab.id}
                label={tab.label}
                onPress={() => setActiveTab(tab.id)}
              />
            ))}
          </ScrollView>
        </View>


        {activeTab === null ? (
          /* ── Vista "Todos": recientes + favoritos + carruseles por subcategoría ── */
          <View style={{ marginTop: -25 }}>
            {recentInDescanso.length > 0 && (
              <>
                <SessionCarousel
                  title="Escuchadas recientemente"
                  sessions={recentInDescanso}
                  isPremium={isPremium}
                  onPress={(s) => { if (currentSession?.id !== s.id) playSession(s); router.push("/player" as never); }}
                  style={{ marginTop: 24, marginBottom: 0, paddingHorizontal: H_PAD }}
                  cardWidth={RECENT_CARD_W}
                  titleSize={20}
                />
                <View style={styles.sectionDivider} />
              </>
            )}
            {favoritesInDescanso.length > 0 && (
              <>
                <SessionCarousel
                  title="Favoritos"
                  sessions={favoritesInDescanso}
                  isPremium={isPremium}
                  onPress={(s) => { if (currentSession?.id !== s.id) playSession(s); router.push("/player" as never); }}
                  style={{ marginTop: 24, marginBottom: 0, paddingHorizontal: H_PAD }}
                  cardWidth={RECENT_CARD_W}
                  titleSize={20}
                />
                <View style={styles.sectionDivider} />
              </>
            )}
            {historiasForTodos.length > 0 && (
              <>
                <SessionCarousel
                  title="Historias"
                  sessions={historiasForTodos.slice(0, 5)}
                  isPremium={isPremium}
                  onPress={(s) => { if (currentSession?.id !== s.id) playSession(s); router.push("/player" as never); }}
                  style={{ marginTop: 24, marginBottom: 0, paddingHorizontal: H_PAD }}
                  cardWidth={RECENT_CARD_W}
                  titleSize={20}
                  onViewAll={historiasForTodos.length > 5 ? () => setActiveTab("historias") : undefined}
                />
                <View style={styles.sectionDivider} />
              </>
            )}
            {asmrForTodos.length > 0 && (
              <>
                <SessionCarousel
                  title="ASMR"
                  sessions={asmrForTodos.slice(0, 5)}
                  isPremium={isPremium}
                  onPress={(s) => { if (currentSession?.id !== s.id) playSession(s); router.push("/player" as never); }}
                  style={{ marginTop: 24, marginBottom: 0, paddingHorizontal: H_PAD }}
                  cardWidth={RECENT_CARD_W}
                  titleSize={20}
                  onViewAll={asmrForTodos.length > 5 ? () => setActiveTab("asmr") : undefined}
                />
                {(binauralSounds.length > 0 || ambientalSounds.length > 0) && (
                  <View style={styles.sectionDivider} />
                )}
              </>
            )}
            {binauralSounds.length > 0 && (
              <>
                <Text style={styles.todosSectionTitle}>Sonidos Binaurales</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12, paddingBottom: 4 }}>
                  {binauralSounds.slice(0, 5).map((sound) => {
                    const sel = player.selectedId === sound.id;
                    const playing = sel && player.isPlaying;
                    return (
                      <Pressable key={sound.id} onPress={() => player.toggle(sound.id, sound.audioUri ?? null)}
                        style={({ pressed }) => [{ width: RECENT_CARD_W, opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.soundImageWrap}>
                          <Image source={sound.image} style={styles.soundImage} resizeMode="cover" />
                          {playing && <PlayingDot />}
                        </View>
                        <Text style={[styles.soundLabel, sel && styles.soundLabelSel]} numberOfLines={2}>{sound.label}</Text>
                      </Pressable>
                    );
                  })}
                  {binauralSounds.length > 5 && (
                    <Pressable onPress={() => setActiveTab("binaural")}
                      style={{ width: RECENT_CARD_W, alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <View style={{ width: RECENT_CARD_W, aspectRatio: 1, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="chevron-right" size={26} color="rgba(255,255,255,0.5)" />
                      </View>
                      <Text style={{ fontFamily: "Manrope", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Ver más</Text>
                    </Pressable>
                  )}
                </ScrollView>
                {ambientalSounds.length > 0 && <View style={styles.sectionDivider} />}
              </>
            )}
            {ambientalSounds.length > 0 && (
              <>
                <Text style={styles.todosSectionTitle}>Ambientales</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 12, paddingBottom: 4 }}>
                  {ambientalSounds.slice(0, 5).map((sound) => {
                    const sel = player.selectedId === sound.id;
                    const playing = sel && player.isPlaying;
                    return (
                      <Pressable key={sound.id} onPress={() => player.toggle(sound.id, sound.audioUri ?? null)}
                        style={({ pressed }) => [{ width: RECENT_CARD_W, opacity: pressed ? 0.85 : 1 }]}>
                        <View style={styles.soundImageWrap}>
                          <Image source={sound.image} style={styles.soundImage} resizeMode="cover" />
                          {playing && <PlayingDot />}
                        </View>
                        <Text style={[styles.soundLabel, sel && styles.soundLabelSel]} numberOfLines={2}>{sound.label}</Text>
                      </Pressable>
                    );
                  })}
                  {ambientalSounds.length > 5 && (
                    <Pressable onPress={() => setActiveTab("ambiental")}
                      style={{ width: RECENT_CARD_W, alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <View style={{ width: RECENT_CARD_W, aspectRatio: 1, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="chevron-right" size={26} color="rgba(255,255,255,0.5)" />
                      </View>
                      <Text style={{ fontFamily: "Manrope", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Ver más</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </>
            )}

            {/* ── Botón "Ver todas las sesiones de Dormir" ── */}
            <Pressable
              onPress={() => setAllVisible(true)}
              style={({ pressed }) => [{
                flexDirection: "row", alignItems: "center", justifyContent: "center",
                paddingVertical: 18, gap: 6, marginTop: 4, opacity: pressed ? 0.7 : 1,
              }]}
            >
              <Text style={{ fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: "#F7CB6B" }}>
                Todas las sesiones de Dormir
              </Text>
              <Feather name="chevron-right" size={16} color="#F7CB6B" />
            </Pressable>
          </View>
        ) : isSoundTab ? (
          <>
            {/* ── Grilla de sonidos (estilo idéntico a SessionCard) ── */}
            <View style={styles.sessionGrid}>
              {visibleSounds.map((sound) => {
                const sel     = player.selectedId === sound.id;
                const playing = sel && player.isPlaying;
                return (
                  <Pressable
                    key={sound.id}
                    onPress={() => player.toggle(sound.id, sound.audioUri ?? null)}
                    style={({ pressed }) => [{ width: cardW, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <View style={[
                      styles.soundImageWrap,
                      { borderRadius: colors.radius - 4 },
                    ]}>
                      <Image source={sound.image} style={styles.soundImage} resizeMode="cover" />
                    </View>
                    <Text style={[styles.soundLabel, sel && styles.soundLabelSel]} numberOfLines={2}>
                      {sound.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          /* ── Grilla de sesiones (Historias / ASMR) ── */
          <View style={styles.sessionGrid}>
            {visibleSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                width={cardW}
                style={{ marginRight: 0 }}
                showDuration={false}
                showAuthorAvatar={false}
                overridePress={() => {
                  if (currentSession?.id !== session.id) {
                    playSession(session);
                  }
                  router.push("/player" as never);
                }}
                playing={currentSession?.id === session.id}
              />
            ))}
          </View>
        )}

      </ScrollView>

      {/* ── Sticky header (título) ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 10,
            opacity: stickyAnim,
            backgroundColor: bgGradient[0],
          },
        ]}
        pointerEvents={stickyVisible ? "auto" : "none"}
        onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
      >
        <Text style={[styles.stickyHeaderTitle, { color: colors.foreground }]}>Dormir</Text>
      </Animated.View>

      {/* ── Tabs sticky (se pegan debajo del título) ── */}
      {tabsMounted && (
        <Animated.View style={[styles.stickyTabs, { top: headerH, backgroundColor: bgGradient[0], opacity: stickyAnim }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.tabGrid, { marginBottom: 13 }]}
            contentContainerStyle={styles.tabGridContent}
          >
            <SleepPill sel={activeTab === null} label="Todos" onPress={() => setActiveTab(null)} />
            {SLEEP_TABS.map((tab) => (
              <SleepPill
                key={tab.id}
                sel={activeTab === tab.id}
                label={tab.label}
                onPress={() => setActiveTab(tab.id)}
              />
            ))}
          </ScrollView>
          <Animated.View style={[styles.stickyTabsBorder, { opacity: headerBorderAnim }]} />
        </Animated.View>
      )}

      <NightTimerSheet
        visible={timerSheet}
        onClose={() => setTimerSheet(false)}
        timerMin={timerMin}
        setTimerMin={setTimerMin}
        fadeVol={fadeVol}
        setFadeVol={setFadeVol}
      />

      {/* ── Modal "Todas las sesiones de Dormir" (desliza desde la derecha) ── */}
      <Modal visible={allVisible} transparent animationType="none" onRequestClose={closeAll} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgGradient[bgGradient.length - 1] as string, transform: [{ translateX: slideX }] }]}>
          <LinearGradient colors={bgGradient} style={StyleSheet.absoluteFill} />

          {/* Cabecera */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: topPad + 14, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 4 }}>
            <Pressable onPress={closeAll} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
            <Text style={{ fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: "#FBFBFB", flex: 1 }}>
              Sesiones de Dormir
            </Text>
          </View>

          {/* Grilla paginada */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row", flexWrap: "wrap",
              columnGap: 14, paddingHorizontal: H_PAD,
              rowGap: 24, paddingTop: 8, paddingBottom: 120 + bottomPad,
            }}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
                setAllVisibleCount((c) => c + 20);
              }
            }}
          >
            {allDormiSessions.slice(0, allVisibleCount).map((s) => {
              const locked = !!s.isPremium && !isPremium;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    if (locked) { router.push("/membresia" as never); return; }
                    closeAll();
                    if (currentSession?.id !== s.id) playSession(s);
                    router.push("/player" as never);
                  }}
                  style={({ pressed }) => [{ width: cardW, opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={{ width: "100%", aspectRatio: 1, borderRadius: 17, overflow: "hidden" }}>
                    <Image source={s.image as number} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                    <View style={{ position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(27,6,15,0.72)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#fff" }}>{s.durationLabel}</Text>
                    </View>
                    {locked && (
                      <View style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="lock" size={9} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#FBFBFB", lineHeight: 18, marginTop: 8 }} numberOfLines={2}>
                    {s.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Modal>

    </LinearGradient>
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
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  sheetLabel: {
    fontFamily: "Manrope",
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
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  timerChipSel: {
    backgroundColor: "rgba(196,168,245,0.15)",
    borderColor: "rgba(196,168,245,0.5)",
  },
  timerChipText: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  timerChipTextSel: {
    fontFamily: "Manrope",
    color: "#C4A8F5",
    fontWeight: "700",
  },
  fadeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  fadeTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.88)",
    marginBottom: 2,
  },
  fadeSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 16,
  },

  /* Session grid (Historias / ASMR) */
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
    marginTop: -17,
    marginBottom: 6,
  },

  /* Sound grid */
  soundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: H_PAD,
    gap: 10,
    marginTop: -17,
    marginBottom: 6,
  },
  soundCell: {
    width: (W - H_PAD * 2 - 20) / 3,
    alignItems: "center",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: H_PAD,
    marginTop: 20,
    marginBottom: 4,
  },
  todosSectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
    marginTop: 24,
    marginBottom: 21,
    paddingHorizontal: H_PAD,
  },
  soundImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 17,
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
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
    color: "#FBFBFB",
  },
  soundLabelSel: {
    color: "#FBFBFB",
  },

  /* Banner Prepara tu noche */
  nightBannerWrap: {
    marginHorizontal: H_PAD,
    marginTop: -17,
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
    minHeight: 78,
  },
  nightBannerTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 3,
  },
  nightBannerSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },
  dormirMiniPlayer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.40)",
    paddingLeft: 0,
    paddingRight: 0,
    paddingVertical: 0,
    gap: 12,
    height: 64,
    overflow: "hidden",
  },
  dormirMiniImg: {
    width: 60,
    height: 64,
    borderRadius: 0,
    marginLeft: 0,
  },
  dormirMiniPlayBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dormirMiniTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
    marginBottom: 2,
  },
  dormirMiniSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "rgba(255,255,255,0.48)",
  },

  /* Sleep pills */
  tabGrid: {
    marginBottom: 43,
  },
  tabGridContent: {
    paddingHorizontal: H_PAD,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  sleepPillBorder: {},
  sleepPillBorderSel: {},
  sleepPill: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 999,
    gap: 5,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sleepPillSel: { borderWidth: 0 },
  sleepPillText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "450",
    letterSpacing: 0.3,
    color: "#F4F4F4",
  },
  sleepPillTextSel: { fontFamily: "Manrope", color: "#FFFFFF", fontWeight: "600" },

  /* Sticky header */
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
    backgroundColor: "#0D0512",
  },
  stickyHeaderTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  stickyTabs: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 19,
    backgroundColor: "#0D0512",
    paddingTop: 24,
    paddingBottom: 0,
  },
  stickyTabsBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  /* Hero */
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
    paddingBottom: 8,
  },
  heroIcon: {
    marginTop: 14,
    marginBottom: 14,
  },
  heroTitle: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "left",
    transform: [{ translateY: 1 }],
  },
});

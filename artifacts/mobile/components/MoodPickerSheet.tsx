import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmotionalQuoteCard } from "@/components/EmotionalQuoteCard";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { SessionCarousel } from "@/components/SessionCarousel";
import {
  getMoodById,
  MOOD_SURVEY_OPTIONS,
  MOODS,
  type Mood,
  type MoodId,
} from "@/data/moods";
import { useMoodQuotes } from "@/context/MoodQuotesContext";
import type { MoodQuote } from "@/data/mood-quotes";

const MOOD_HEROES: Record<MoodId, number> = {
  estresado: require("@/assets/images/mood-heroes/mood-hero-estresado.jpg"),
  ansioso: require("@/assets/images/mood-heroes/mood-hero-ansioso.jpg"),
  cansado: require("@/assets/images/mood-heroes/mood-hero-cansado.jpg"),
  inepto: require("@/assets/images/mood-heroes/mood-hero-inepto.jpg"),
  triste: require("@/assets/images/mood-heroes/mood-hero-triste.jpg"),
  solo: require("@/assets/images/mood-heroes/mood-hero-solo.jpg"),
  deprimido: require("@/assets/images/mood-heroes/mood-hero-deprimido.jpg"),
  desmotivado: require("@/assets/images/mood-heroes/mood-hero-desmotivado.jpg"),
  enojado: require("@/assets/images/mood-heroes/mood-hero-enojado.jpg"),
  adolorido: require("@/assets/images/mood-heroes/mood-hero-adolorido.jpg"),
  agradecido: require("@/assets/images/mood-heroes/mood-hero-agradecido.jpg"),
  emocionado: require("@/assets/images/mood-heroes/mood-hero-emocionado.jpg"),
  "lleno-de-amor": require("@/assets/images/mood-heroes/mood-hero-lleno-de-amor.jpg"),
  feliz: require("@/assets/images/mood-heroes/mood-hero-feliz.jpg"),
  "en-paz": require("@/assets/images/mood-heroes/mood-hero-en-paz.jpg"),
  esperanzado: require("@/assets/images/mood-heroes/mood-hero-esperanzado.jpg"),
  contento: require("@/assets/images/mood-heroes/mood-hero-contento.jpg"),
  presente: require("@/assets/images/mood-heroes/mood-hero-presente.jpg"),
};
import { SESSIONS, type Session } from "@/data/sessions";
import {
  readMoodHistory,
  saveMoodCheckIn,
  type MoodHistoryRecord,
} from "@/data/mood-history";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { startOfWeek, dayKey } from "@/utils/stats";
import { getPrimaryMoodId } from "@/data/mood-quote-rotation";
import colors, { WIDGET_GREEN_SOLID } from "@/constants/colors";

type Props = {
  visible: boolean;
  onClose: () => void;
  initialSelectedIds?: MoodId[];
  onSelect?: (moodIds: MoodId[]) => void;
};

type FlowStep = "select" | "survey" | "complete";
type Answers = Partial<Record<MoodId, string>>;

const WEEKDAY_LABELS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const GOLD = "#F9F9F9";
const FG = "#F5F2F8";
const MUTED = "rgba(245,242,248,0.62)";
const MOOD_GREEN = WIDGET_GREEN_SOLID;
const CINEMATIC_DURATION = 3000;
const CINEMATIC_BASE_DELAY = 200;
const MOOD_PICKER_ORDER: MoodId[] = [
  "agradecido",
  "emocionado",
  "lleno-de-amor",
  "feliz",
  "en-paz",
  "esperanzado",
  "contento",
  "presente",
  "cansado",
  "desmotivado",
  "solo",
  "triste",
  "ansioso",
  "estresado",
  "enojado",
  "adolorido",
  "inepto",
  "deprimido",
];

const MOOD_PICKER_OPTIONS = MOOD_PICKER_ORDER
  .map((moodId) => MOODS.find((mood) => mood.id === moodId))
  .filter((mood): mood is Mood => Boolean(mood));

function getBundledRecommendation(id: string): Session {
  const session = SESSIONS.find((candidate) => candidate.id === id);
  if (!session) {
    throw new Error(`Falta la recomendación emocional base ${id}`);
  }
  return Object.freeze({
    ...session,
    benefits: [...session.benefits],
    instruments: [...session.instruments],
    themeTag: session.themeTag ? [...session.themeTag] : undefined,
    temaTag: session.temaTag ? [...session.temaTag] : undefined,
    moodIds: session.moodIds ? [...session.moodIds] : undefined,
    sonidosTags: session.sonidosTags ? [...session.sonidosTags] : undefined,
    descansoTags: session.descansoTags ? [...session.descansoTags] : undefined,
    guideIds: session.guideIds ? [...session.guideIds] : undefined,
    guests: session.guests?.map((guest) => ({ ...guest })),
  });
}

const BUNDLED_MOOD_RECOMMENDATIONS = {
  meditation: getBundledRecommendation("1"),
  music: getBundledRecommendation("24"),
  soundTherapy: getBundledRecommendation("8"),
  reflection: getBundledRecommendation("5"),
  story: getBundledRecommendation("61"),
};
const BUNDLED_MOOD_RECOMMENDATION_IDS = new Set(
  Object.values(BUNDLED_MOOD_RECOMMENDATIONS).map((session) => session.id),
);

function getRecommendations(moodIds: MoodId[]): Session[] {
  const selected = new Set(moodIds);
  const relevanceScore = (session: Session) =>
    session.moodIds?.reduce(
      (matches, moodId) => matches + (selected.has(moodId) ? 1 : 0),
      0,
    ) ?? 0;
  const ranked = [...SESSIONS].sort(
    (a, b) => relevanceScore(b) - relevanceScore(a),
  );
  const used = new Set<string>();
  const pick = (
    predicate: (session: Session) => boolean,
    fallback: Session,
  ): Session => {
    const match = ranked.find(
      (session) =>
        !used.has(session.id) &&
        relevanceScore(session) > 0 &&
        (!BUNDLED_MOOD_RECOMMENDATION_IDS.has(session.id) ||
          session.id === fallback.id) &&
        !session.isPlaceholder &&
        predicate(session),
    );
    const recommendation = match ?? fallback;
    used.add(recommendation.id);
    return recommendation;
  };

  return [
    pick(
      (session) =>
        session.categoryId === "meditaciones-guiadas" &&
        session.meditationTag !== "3 Minutos de Sabiduría" &&
        !session.sabiduriaTag,
      BUNDLED_MOOD_RECOMMENDATIONS.meditation,
    ),
    pick(
      (session) =>
        session.categoryId === "musica-sonidos" && Boolean(session.soundTag),
      BUNDLED_MOOD_RECOMMENDATIONS.music,
    ),
    pick(
      (session) => session.categoryId === "sonidos-ancestrales",
      BUNDLED_MOOD_RECOMMENDATIONS.soundTherapy,
    ),
    pick(
      (session) =>
        Boolean(session.sabiduriaTag) ||
        session.meditationTag === "3 Minutos de Sabiduría",
      BUNDLED_MOOD_RECOMMENDATIONS.reflection,
    ),
    pick(
      (session) =>
        session.descansoTag?.startsWith("Historias") === true ||
        session.descansoTags?.some((tag) => tag.startsWith("Historias")) === true,
      BUNDLED_MOOD_RECOMMENDATIONS.story,
    ),
  ];
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

function colorWithOpacity(color: string, opacity: number): string {
  const match = color.match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${match[1]}${alpha}`;
}

export function MoodPickerSheet({
  visible,
  onClose,
  initialSelectedIds = [],
  onSelect,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions();
  const { theme } = useSceneTheme();
  const { version: catalogVersion } = useCatalog();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { openCategory } = useCategoryOverlay();
  const { getQuoteForMood, completeCheckIn } = useMoodQuotes();
  const topPad =  Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [step, setStep] = useState<FlowStep>("select");
  const [selected, setSelected] = useState<MoodId[]>([]);
  const [surveyIndex, setSurveyIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<MoodHistoryRecord[]>([]);
  const [completionCycle, setCompletionCycle] = useState(0);
  const [completionQuote, setCompletionQuote] = useState<MoodQuote | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const isFinishingRef = useRef(false);
  const flowGenerationRef = useRef(0);

  useEffect(() => {
    flowGenerationRef.current += 1;
    if (!visible) {
      return;
    }
    setStep("select");
    setSelected([...initialSelectedIds]);
    setSurveyIndex(0);
    setAnswers({});
    setCompletionQuote(null);
    setIsFinishing(isFinishingRef.current);
    let active = true;
    readMoodHistory()
      .then((records) => {
        if (active) setHistory(records);
      })
      .catch(() => {
        if (active) setHistory([]);
      });
    return () => {
      active = false;
    };
    // The initial selection is intentionally captured only when the modal opens.
    // Parent selection changes while the completion screen is visible must not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const selectedMoods = useMemo(
    () =>
      selected
        .map((moodId) => getMoodById(moodId))
        .filter((mood): mood is NonNullable<typeof mood> => Boolean(mood)),
    [selected],
  );
  const currentMood = selectedMoods[surveyIndex];
  const currentAnswer = currentMood ? answers[currentMood.id] : undefined;
  const themeAccent = theme.accent ?? colors.light.accent;
  const themeCardBackground = theme.id === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(theme.id)
      ? "rgba(181,211,255,0.057)"
      : theme.id === "indigo2"
        ? "rgba(191,207,255,0.096)"
        : "rgba(181,211,255,0.057)";
  const recommendations = useMemo(
    () => getRecommendations(selected),
    [selected, catalogVersion],
  );
  const recommendationCardWidth = Math.round(
    (viewportWidth - 32 - 56) * 0.85 * 1.25 - 25,
  );
  const recommendationCardHeight = Math.round(
    (recommendationCardWidth / (16 / 9)) * 1.1,
  );

  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }, [history]);

  const weekRecordsByDay = useMemo(() => {
    const monday = weekDays[0];
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    const byDay = new Map<string, MoodHistoryRecord[]>();
    history.forEach((record) => {
      const date = new Date(record.createdAt);
      if (date < monday || date >= nextMonday) return;
      const key = dayKey(date);
      byDay.set(key, [...(byDay.get(key) ?? []), record]);
    });
    return byDay;
  }, [history, weekDays]);

  function handleClose() {
    onClose();
  }

  function handleStartSurvey() {
    if (!selected.length) return;
    setAnswers({});
    setSurveyIndex(0);
    setStep("survey");
  }

  function toggleMood(moodId: MoodId) {
    setSelected((current) =>
      current.includes(moodId)
        ? current.filter((id) => id !== moodId)
        : [...current, moodId],
    );
  }

  async function finishFlow(nextAnswers: Answers) {
    if (!selected.length || isFinishingRef.current) return;
    const flowGeneration = flowGenerationRef.current;
    isFinishingRef.current = true;
    setIsFinishing(true);
    const primaryMoodId = getPrimaryMoodId(selected);
    if (!primaryMoodId) {
      isFinishingRef.current = false;
      setIsFinishing(false);
      return;
    }
    try {
      const { result: records, quote } = await completeCheckIn(
        primaryMoodId,
        (slot) => saveMoodCheckIn(selected, nextAnswers, {
          moodId: primaryMoodId,
          slot,
        }),
      );
      if (flowGeneration !== flowGenerationRef.current) {
        isFinishingRef.current = false;
        setIsFinishing(false);
        return;
      }
      setHistory(records);
      setCompletionQuote(quote);
    } catch {
      isFinishingRef.current = false;
      setIsFinishing(false);
      if (flowGeneration !== flowGenerationRef.current) return;
      Alert.alert(
        "No pudimos guardar este registro",
        "Inténtalo nuevamente para conservarlo en tu historial.",
      );
      return;
    }
    onSelect?.(selected);
    setAnswers(nextAnswers);
    setCompletionCycle((cycle) => cycle + 1);
    setStep("complete");
    isFinishingRef.current = false;
    setIsFinishing(false);
  }

  async function advanceSurvey() {
    if (!currentMood || !currentAnswer) return;
    const nextAnswers = { ...answers, [currentMood.id]: currentAnswer };
    if (surveyIndex < selectedMoods.length - 1) {
      setAnswers(nextAnswers);
      setSurveyIndex((index) => index + 1);
      return;
    }
    await finishFlow(nextAnswers);
  }

  async function skipSurvey() {
    if (!currentMood) return;
    const nextAnswers = { ...answers };
    delete nextAnswers[currentMood.id];
    if (surveyIndex < selectedMoods.length - 1) {
      setAnswers(nextAnswers);
      setSurveyIndex((index) => index + 1);
      return;
    }
    await finishFlow(nextAnswers);
  }

  function handleSessionPress(session: Session) {
    onClose();
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    if (session.skipDetail) {
      playSession(session);
      router.push("/player" as never);
      return;
    }
    openCategory(`/session/${session.id}`);
  }

  const bgColors = theme.gradient as unknown as [string, string, ...string[]];
  const fadeColor = bgColors[0] || "#080910";
  const firstMood = selectedMoods[0];
  const firstMoodAnswer = firstMood
    ? MOOD_SURVEY_OPTIONS[firstMood.id].find((option) => option.id === answers[firstMood.id])
    : undefined;
  const moodQuote = completionQuote ?? (firstMood ? getQuoteForMood(firstMood.id) : undefined);
  const moodHeroHeight = Math.min(410, Math.max(340, viewportWidth * 0.98));
  const fadeSolidStart = 1 - 55 / moodHeroHeight;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <LinearGradient colors={bgColors} style={styles.root}>
        {step === "select" && (
          <>
            <View style={[styles.header, { paddingTop: topPad + 8 }]}>
              <Pressable
                onPress={handleClose}
                style={styles.headerButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar selector de emociones"
                testID="mood-picker-close"
              >
                <Feather name="x" size={23} color={GOLD} />
              </Pressable>
              <View />
              <View style={styles.headerButtonPlaceholder} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 28 }]}
            >
              <Text style={styles.title}>¿Cómo te sientes hoy?</Text>
              <Text style={styles.subtitle}>
                Elige una o varias emociones para personalizar este momento.
              </Text>
              <View style={styles.grid}>
                {MOOD_PICKER_OPTIONS.map((mood) => {
                  const isSelected = selected.includes(mood.id);
                  return (
                    <Pressable
                      key={mood.id}
                      onPress={() => toggleMood(mood.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={mood.label}
                      testID={`mood-option-${mood.id}`}
                      style={({ pressed }) => [
                        styles.moodCard,
                        { backgroundColor: themeCardBackground },
                        isSelected && styles.moodCardSelected,
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                        {mood.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View
              style={[
                styles.footer,
                styles.surveyFooter,
                { paddingBottom: bottomPad + 16 },
              ]}
            >
              <PrimaryButton
                label="Continuar"
                disabled={!selected.length}
                onPress={handleStartSurvey}
                testID="mood-picker-continue"
              />
            </View>
          </>
        )}

        {step === "survey" && currentMood && (
          <>
            <View style={[styles.header, { paddingTop: topPad + 8 }]}>
              <Pressable
                onPress={() => setStep("select")}
                style={[styles.headerButton, styles.surveyBackButton]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Volver a seleccionar emociones"
              >
                <Feather name="chevron-left" size={32} color={GOLD} style={{ transform: [{ translateX: -1 }] }} />
              </Pressable>
              <Text style={styles.progressLabel}>
                {surveyIndex + 1} DE {selectedMoods.length}
              </Text>
              <Pressable
                onPress={skipSurvey}
                disabled={isFinishing}
                hitSlop={10}
                style={[styles.skipButton, isFinishing && styles.continueButtonDisabled]}
              >
                <Text style={[styles.skipText, isFinishing && styles.continueButtonTextDisabled]}>
                  Omitir
                </Text>
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 28 }]}
            >
              <Text style={[styles.title, styles.surveyTitle]}>
                ¿Por qué te sientes de esta manera?
              </Text>
              <Text style={[styles.subtitle, { color: themeAccent }]}>
                Depende de ti si quieres compartir esto
              </Text>
              <View style={styles.optionsCard}>
                {MOOD_SURVEY_OPTIONS[currentMood.id].map((option, index) => {
                  const isSelected = currentAnswer === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() =>
                        setAnswers((current) => ({ ...current, [currentMood.id]: option.id }))
                      }
                      style={({ pressed }) => [
                        styles.optionRow,
                        index > 0 && styles.optionRowBorder,
                        { opacity: pressed ? 0.8 : 1 },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={option.label}
                    >
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View
              style={[
                styles.footer,
                styles.surveyFooter,
                { paddingBottom: bottomPad + 16 },
              ]}
            >
              <PrimaryButton
                label="Continuar"
                disabled={!currentAnswer || isFinishing}
                onPress={advanceSurvey}
              />
            </View>
          </>
        )}

        {step === "complete" && (
          <View style={styles.completeRoot}>
            <View style={[styles.header, styles.completeHeader, { paddingTop: topPad + 8 }]}>
              <Pressable
                onPress={handleClose}
                style={styles.headerButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Cerrar verificación de estado de ánimo"
              >
                <Feather name="x" size={23} color={GOLD} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: bottomPad + 28 }}
              bounces={false}
            >
              <View style={[styles.heroContainer, { width: viewportWidth, height: moodHeroHeight }]}>
                <Image
                  source={MOOD_HEROES[firstMood?.id ?? "feliz"]}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={[
                    colorWithOpacity(fadeColor, 0),
                    colorWithOpacity(fadeColor, 0.3),
                    fadeColor,
                    fadeColor,
                  ]}
                  locations={[0.3, 0.7, fadeSolidStart, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.heroOverlay, { paddingTop: topPad + 80 }]}>
                  <CinematicFadeSlide
                    active={visible}
                    replayKey={completionCycle}
                    delay={CINEMATIC_BASE_DELAY}
                    duration={CINEMATIC_DURATION}
                    style={styles.heroAnimatedContent}
                  >
                    <Text style={styles.heroKicker}>Tu momento</Text>
                    <Text style={styles.heroEmoji}>{firstMood?.emoji}</Text>
                    <Text style={styles.heroMoodLabel}>{firstMood?.label}</Text>
                    {firstMoodAnswer?.id !== "other" && (
                      <Text style={styles.heroAnswer}>
                        {firstMoodAnswer?.label ?? "Sin respuesta seleccionada"}
                      </Text>
                    )}
                  </CinematicFadeSlide>
                </View>
              </View>

              <LinearGradient
                colors={bgColors}
                style={styles.completeContent}
              >
                <CinematicFadeSlide
                  active={visible}
                  replayKey={completionCycle}
                  delay={CINEMATIC_BASE_DELAY + 700}
                  duration={CINEMATIC_DURATION}
                >
                  <Text style={styles.resonanceTitle}>Resonancia te recomienda:</Text>
                </CinematicFadeSlide>

                <CinematicFadeSlide
                  active={visible}
                  replayKey={completionCycle}
                  delay={CINEMATIC_BASE_DELAY + 1200}
                  duration={CINEMATIC_DURATION}
                  style={styles.recommendationsCarousel}
                >
                  <SessionCarousel
                    title=""
                    sessions={recommendations}
                    isPremium={isPremium}
                    onPress={handleSessionPress}
                    onLockedPress={handleSessionPress}
                    showHeader={false}
                    style={styles.recommendationsCarouselInner}
                    cardWidth={recommendationCardWidth}
                    fixedCardHeight={recommendationCardHeight}
                    allowOversizedCardWidth
                    showDurationBadge
                    showDurationClock
                    showCategoryAboveCardTitle
                    whiteMetadataGlass
                    durationBadgeStyle={{ top: "auto", bottom: 8, left: 8 }}
                    eagerRender
                  />
                </CinematicFadeSlide>

                <CinematicFadeSlide
                  active={visible}
                  replayKey={completionCycle}
                  delay={CINEMATIC_BASE_DELAY + 1700}
                  duration={CINEMATIC_DURATION}
                >
                  <View style={styles.completeSectionDivider} />

                  <View style={styles.weekCard}>
                    <Text style={styles.weekTitle}>Esta semana</Text>
                    <View style={styles.weekDaysRow}>
                      {weekDays.map((date, index) => {
                        const records = weekRecordsByDay.get(dayKey(date)) ?? [];
                        const moods = records.flatMap((record) => record.moodIds);
                        const firstDayMood = moods[0] ? getMoodById(moods[0]) : undefined;
                        return (
                          <View key={dayKey(date)} style={styles.weekDay}>
                            <Text style={styles.weekDayLabel}>{WEEKDAY_LABELS[index]}</Text>
                            <View style={[styles.weekMood, firstDayMood && styles.weekMoodActive]}>
                              {firstDayMood ? (
                                <Text style={styles.weekMoodEmoji}>{firstDayMood.emoji}</Text>
                              ) : (
                                <View style={styles.weekMoodEmpty} />
                              )}
                            </View>
                            {moods.length > 1 && <Text style={styles.weekMoodCount}>+{moods.length - 1}</Text>}
                          </View>
                        );
                      })}
                    </View>
                    <Pressable
                      onPress={() => {
                        onClose();
                        router.push("/historial-emociones" as never);
                      }}
                      style={({ pressed }) => [styles.historyButton, { opacity: pressed ? 0.78 : 1 }]}
                      accessibilityRole="button"
                      accessibilityLabel="Ver todo el historial de emociones"
                    >
                      <Text style={styles.historyButtonText}>Ver todo</Text>
                      <Feather name="chevron-right" size={16} color="#060A0F" />
                    </Pressable>
                  </View>

                  <View style={styles.completeSectionDivider} />
                </CinematicFadeSlide>

                {moodQuote && (
                  <View>
                    <CinematicFadeSlide
                      active={visible}
                      replayKey={`${completionCycle}:${firstMood?.id ?? "none"}`}
                      delay={120}
                      duration={CINEMATIC_DURATION}
                    >
                      <EmotionalQuoteCard
                        author={moodQuote.author}
                        background={moodQuote.background}
                        quote={moodQuote.text}
                      />
                    </CinematicFadeSlide>
                  </View>
                )}

                {history.length > 0 && (
                  <Text style={styles.lastCheckIn}>
                    Último registro: {formatShortDate(history[0].createdAt)}
                  </Text>
                )}
              </LinearGradient>
            </ScrollView>
          </View>
        )}
      </LinearGradient>
    </Modal>
  );
}

function PrimaryButton({
  label,
  disabled,
  onPress,
  testID,
}: {
  label: string;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.continueButton,
        disabled && styles.continueButtonDisabled,
        { opacity: pressed ? 0.86 : 1 },
      ]}
    >
      <Text style={[styles.continueButtonText, disabled && styles.continueButtonTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#080910",
  },
  header: {
    minHeight: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  surveyBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  headerButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  headerKicker: {
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.76)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.4,
  },
  progressLabel: {
    fontFamily: "Manrope",
    color: "rgba(249,249,249,0.55)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  skipButton: {
    minWidth: 82,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  skipText: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 13,
    fontWeight: "600",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontFamily: "Manrope",
    color: FG,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    letterSpacing: -0.25,
    marginBottom: 8,
  },
  surveyTitle: {
    fontSize: 17,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  moodCard: {
    width: "48%",
    minHeight: 84,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.075)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  moodCardSelected: {
    borderColor: MOOD_GREEN,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  moodEmoji: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 4,
  },
  moodLabel: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.84)",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  moodLabelSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(7,8,16,0.22)",
  },
  surveyFooter: {
    backgroundColor: "transparent",
  },
  continueButton: {
    minHeight: 56,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: MOOD_GREEN,
  },
  continueButtonDisabled: {
    backgroundColor: "rgba(238,238,242,0.82)",
  },
  continueButtonText: {
    fontFamily: "Manrope",
    color: "#060A0F",
    fontSize: 16,
    fontWeight: "700",
  },
  continueButtonTextDisabled: {
    color: "rgba(30,28,38,0.48)",
  },
  optionsCard: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  optionRow: {
    minHeight: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.16)",
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: MOOD_GREEN,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: MOOD_GREEN,
  },
  optionText: {
    flex: 1,
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.90)",
    fontSize: 15,
    lineHeight: 21,
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  completeRoot: {
    flex: 1,
  },
  completeHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
  },
  heroContainer: {
    position: "relative",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    paddingHorizontal: 20,
    transform: [{ translateY: -55 }],
  },
  heroAnimatedContent: {
    width: "100%",
    alignItems: "center",
  },
  heroKicker: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.4,
    color: "rgba(249,249,249,0.7)",
    textTransform: "uppercase",
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroEmoji: {
    fontSize: 64,
    lineHeight: 74,
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroMoodLabel: {
    fontFamily: "Manrope",
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroAnswer: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    maxWidth: "85%",
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  completeContent: {
    paddingHorizontal: 16,
    marginTop: -55,
    paddingTop: 12,
  },
  resonanceTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: "#F9F9F9",
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  recommendationsCarousel: {
    marginHorizontal: -16,
  },
  recommendationsCarouselInner: {
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  completeSectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 31,
    marginBottom: 31,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  weekCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
    backgroundColor: "transparent",
  },
  weekTitle: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 18,
  },
  weekDaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
  },
  weekDayLabel: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.48)",
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 9,
  },
  weekMood: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  weekMoodActive: {
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  weekMoodEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  weekMoodEmoji: {
    fontSize: 18,
  },
  weekMoodCount: {
    position: "absolute",
    top: 43,
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.62)",
    fontSize: 9,
  },
  historyButton: {
    height: 44,
    borderRadius: 23,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
  historyButtonText: {
    fontFamily: "Manrope",
    color: "#060A0F",
    fontSize: 14,
    fontWeight: "700",
  },
  lastCheckIn: {
    alignSelf: "center",
    marginTop: 14,
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
  },
});
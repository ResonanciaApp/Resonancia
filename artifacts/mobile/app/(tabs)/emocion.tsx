import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MoodPickerSheet } from "@/components/MoodPickerSheet";
import { SessionRow } from "@/components/SessionRow";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getMoodById, type Mood, type MoodId } from "@/data/moods";
import { SESSIONS, type Session } from "@/data/sessions";

const GOLD = "#F9F9F9";
const MUTED = "rgba(244,244,244,0.62)";
const SURFACE = "rgba(255,255,255,0.065)";
const CARD_BG = "rgba(181,211,255,0.045)";
const GRID_PAD = 20;
const SECTION_GAP = 32;

export default function EmocionScreen() {
  const insets = useSafeAreaInsets();
  const { theme, activeSceneId } = useSceneTheme();
  const { version: catalogVersion } = useCatalog();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { openCategory } = useCategoryOverlay();
  const [draft, setDraft] = useState("");
  const [moodSheetVisible, setMoodSheetVisible] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [recoOffset, setRecoOffset] = useState(0);
  const topPad = Platform.OS === "web" ? 66 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 126 : insets.bottom + 118;
  const cardBg = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : CARD_BG;
  const moodRecommended = React.useMemo<Session[]>(() => {
    if (selectedMoods.length) {
      const cats = new Set(selectedMoods.flatMap((mood) => mood.categoryIds));
      const themes = new Set<string>(selectedMoods.flatMap((mood) => mood.themeTags));
      const pool = SESSIONS.filter((session) => cats.has(session.categoryId));
      const boosted = pool.filter((session) => session.themeTag?.some((tag) => themes.has(tag)));
      const rest = pool.filter((session) => !session.themeTag?.some((tag) => themes.has(tag)));
      return [...boosted, ...rest].slice(0, 5);
    }

    const recommendedCategories = ["meditaciones-guiadas", "sonidos-ancestrales", "musica-sonidos"];
    const pool = SESSIONS.filter((session) => recommendedCategories.includes(session.categoryId));
    const seed = new Date().toDateString() + recoOffset;
    let hash = 0;
    for (let index = 0; index < seed.length; index++) {
      hash = (hash * 31 + seed.charCodeAt(index)) & 0x7fffffff;
    }
    const shuffled = [...pool];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swapIndex = Math.abs(hash ^ (index * 2654435761)) % (index + 1);
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled.slice(0, 5);
  }, [catalogVersion, recoOffset, selectedMoods]);

  function handleMoodSelect(moodIds: MoodId[]) {
    setSelectedMoods(
      moodIds
        .map((moodId) => getMoodById(moodId))
        .filter((mood): mood is Mood => Boolean(mood)),
    );
  }

  const moodSelectionEmoji = selectedMoods.map((mood) => mood.emoji).join(" ");
  const moodSelectionLabel = selectedMoods.length === 1
    ? selectedMoods[0].label
    : `${selectedMoods.length} emociones`;

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 18, paddingBottom: bottomPad }]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>TU ESPACIO PERSONAL</Text>
            <Text style={styles.title}>Emoción</Text>
            <Text style={styles.subtitle}>Un momento para escucharte y encontrar lo que necesitas.</Text>
          </View>
          <View style={styles.headerEmoji}>
            <Text style={styles.headerEmojiText}>🙂</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.assistantIcon}>
                <Feather name="star" size={16} color={GOLD} />
              </View>
              <Text style={styles.sectionTitle}>Conversamos contigo</Text>
            </View>
            <View style={styles.comingSoonPill}>
              <Text style={styles.comingSoonText}>PRÓXIMAMENTE</Text>
            </View>
          </View>
          <Text style={styles.sectionDescription}>
            Este será tu espacio para recibir sesiones sugeridas según lo que estés viviendo.
          </Text>

          <View style={styles.chatCard}>
            <View style={styles.assistantRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarMark}>R</Text>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.messageText}>Hola, estoy aquí para acompañarte. ¿Cómo ha estado tu día?</Text>
              </View>
            </View>

            <View style={[styles.messageBubble, styles.userBubble]}>
              <Text style={styles.messageText}>Me cuesta desconectarme al final del día.</Text>
            </View>

            <View style={styles.assistantRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarMark}>R</Text>
              </View>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <Text style={styles.messageText}>
                  Podré recomendarte una práctica suave para cerrar el día con más calma.
                </Text>
              </View>
            </View>

            <View style={styles.composer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Escribe cómo te sientes…"
                placeholderTextColor="rgba(244,244,244,0.42)"
                style={styles.composerInput}
                multiline
                maxLength={240}
              />
              <View style={styles.sendButton}>
                <Feather name="arrow-up" size={18} color="#121019" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.homeMoodBlock}>
          <View style={[styles.sectionDivider, { marginTop: -15 }]} />
          <View style={{ paddingHorizontal: GRID_PAD, marginTop: -15 }}>
            <Text style={styles.homeSectionTitle}>Personaliza tus recomendaciones</Text>
          </View>

          {selectedMoods.length ? (
            <Pressable
              onPress={() => setMoodSheetVisible(true)}
              style={({ pressed }) => [styles.moodRow, styles.moodRowActive, { overflow: "hidden", opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
              <Text style={styles.moodSientesLabel}>Sientes:</Text>
              <View style={{ flex: 1 }} />
              <LinearGradient
                colors={["rgba(190,100,80,0.55)", "rgba(120,60,160,0.55)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.moodPill}
              >
                <Text style={styles.moodPillEmoji} numberOfLines={1}>{moodSelectionEmoji}</Text>
                <Text style={styles.moodPillLabel} numberOfLines={1}>{moodSelectionLabel}</Text>
                <Pressable
                  onPress={(event) => { event.stopPropagation?.(); setSelectedMoods([]); }}
                  hitSlop={10}
                  style={{ marginLeft: 2 }}
                >
                  <Feather name="x-circle" size={14} color="rgba(255,255,255,0.75)" />
                </Pressable>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setMoodSheetVisible(true)}
              style={({ pressed }) => [styles.moodRow, { overflow: "hidden", opacity: pressed ? 0.78 : 1 }]}
            >
              <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
              <Text style={styles.moodEmoji}>🙂</Text>
              <Text style={styles.moodRowLabel}>Expresa tu emoción</Text>
              <Feather name="chevron-right" size={16} color="#f9f9f9" />
            </Pressable>
          )}

          <View style={{ paddingHorizontal: GRID_PAD }}>
            <Text style={[styles.homeSectionTitle, { marginTop: 24 }]}>
              {selectedMoods.length ? "Para tus estados de ánimo" : "Recomendado para ti"}
            </Text>
          </View>
          <View style={styles.recoSection}>
            {moodRecommended.map((session) => (
              <View key={session.id} style={styles.recoCard}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: cardBg }]} />
                <SessionRow
                  session={session}
                  imageSize={84}
                  metaText={session.categoryLabel}
                  onPress={() => {
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
                  }}
                />
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => setRecoOffset((offset) => offset + 1)}
            style={({ pressed }) => [
              styles.refreshRecommendations,
              { backgroundColor: pressed ? "rgba(0,0,0,0.24)" : cardBg },
            ]}
          >
            <Text style={styles.refreshRecommendationsText}>Actualizar recomendaciones</Text>
          </Pressable>
        </View>
      </ScrollView>
      <MoodPickerSheet
        visible={moodSheetVisible}
        onClose={() => setMoodSheetVisible(false)}
        initialSelectedIds={selectedMoods.map((mood) => mood.id)}
        onSelect={handleMoodSelect}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 19 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 34,
    gap: 18,
  },
  eyebrow: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
    color: "rgba(249,249,249,0.64)",
    marginBottom: 6,
  },
  title: {
    fontFamily: "Manrope",
    color: GOLD,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  subtitle: {
    maxWidth: 275,
    marginTop: 7,
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
  },
  headerEmoji: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerEmojiText: { fontSize: 30 },
  section: { marginBottom: 34 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  assistantIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,249,249,0.13)",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    color: GOLD,
    fontSize: 19,
    fontWeight: "700",
  },
  comingSoonPill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "rgba(249,249,249,0.12)",
  },
  comingSoonText: {
    color: "rgba(249,249,249,0.78)",
    fontFamily: "Manrope",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.75,
  },
  sectionDescription: {
    marginTop: 9,
    color: MUTED,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
  },
  chatCard: {
    marginTop: 17,
    borderRadius: 24,
    padding: 15,
    gap: 11,
    overflow: "hidden",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  assistantRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingRight: 28,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249,249,249,0.18)",
  },
  avatarMark: {
    color: GOLD,
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "800",
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assistantBubble: {
    flex: 1,
    borderBottomLeftRadius: 4,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    borderBottomRightRadius: 4,
    backgroundColor: "rgba(249,249,249,0.19)",
  },
  messageText: {
    color: "rgba(255,255,255,0.90)",
    fontFamily: "Manrope",
    fontSize: 12.5,
    lineHeight: 18,
  },
  composer: {
    minHeight: 50,
    marginTop: 4,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  composerInput: {
    flex: 1,
    maxHeight: 72,
    paddingVertical: 7,
    color: GOLD,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
  },
  sendButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GOLD,
  },
  homeMoodBlock: {
    marginHorizontal: -19,
    marginBottom: 34,
  },
  sectionDivider: {
    marginHorizontal: GRID_PAD * 2,
    marginBottom: SECTION_GAP,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  homeSectionTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 21,
    color: "#FBFBFB",
  },
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: GRID_PAD,
    marginBottom: 8,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  moodRowActive: {
    paddingVertical: 11,
  },
  moodEmoji: {
    fontFamily: "Manrope",
    fontSize: 22,
  },
  moodRowLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  moodSientesLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#FBFBFB",
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  moodPillEmoji: {
    fontFamily: "Manrope",
    fontSize: 16,
  },
  moodPillLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  recoSection: {
    marginHorizontal: GRID_PAD,
    marginBottom: SECTION_GAP,
    flexDirection: "column",
    gap: 16,
  },
  recoCard: {
    borderRadius: 14,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  refreshRecommendations: {
    marginTop: -40,
    marginHorizontal: GRID_PAD,
    marginBottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "rgba(249,249,249,0.5)",
  },
  refreshRecommendationsText: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "#f9f9f9",
    fontWeight: "500",
  },
});
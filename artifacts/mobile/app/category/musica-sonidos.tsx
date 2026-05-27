import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS, type Session, type SoundTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const COLS = 3;
const CARD_WIDTH = (width - H_PAD * 2 - GAP * (COLS - 1)) / COLS;
const IMG_SIZE = CARD_WIDTH - 10;

type Tab = "Todos" | SoundTag;

const TABS: Tab[] = ["Todos", "Binaural", "Música", "Sonidos Naturaleza", "Música Enteógena"];

const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45];

const TAG_COLORS: Record<SoundTag, { bg: string; text: string }> = {
  Binaural: { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
  Música: { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
  "Sonidos Naturaleza": { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
  "Música Enteógena": { bg: "rgba(182,149,95,0.18)", text: "rgba(230,195,120,0.9)" },
};

const TAG_ICONS: Record<SoundTag, React.ComponentProps<typeof Feather>["name"]> = {
  Binaural: "headphones",
  Música: "music",
  "Sonidos Naturaleza": "wind",
  "Música Enteógena": "zap",
};

const MUSICA_SESSIONS = SESSIONS.filter((s) => s.categoryId === "musica-sonidos");

export default function MusicaSonidosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, playSessionWithDuration } = usePlayer();

  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [query, setQuery] = useState("");
  const [pendingSession, setPendingSession] = useState<Session | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let list = MUSICA_SESSIONS;
    if (activeTab !== "Todos") {
      list = list.filter((s) => s.soundTag === activeTab);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          (s.soundTag ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, query]);

  const handleSelectDuration = (minutes: number) => {
    if (!pendingSession) return;
    setPendingSession(null);
    playSessionWithDuration(pendingSession, minutes);
    router.push("/player" as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#1A2418" }]}>
      <StatusBar barStyle="light-content" />
      <ExpoImage
        source={require("@/assets/images/backgrounds/musica-sonidos.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={0}
        cachePolicy="memory-disk"
        priority="high"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 120 + bottomPad,
          paddingTop: topPad + 8,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "rgba(168,196,168,0.12)", borderColor: "rgba(168,196,168,0.28)" }]}>
            <Feather name="music" size={22} color="#A8C4A8" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Música y Sonidos
          </Text>
          <Text style={[styles.pageSub, { color: "#B8D4B8" }]}>
            Elige un sonido y conecta con el momento presente
          </Text>
        </View>

        {/* Search bar */}
        <View style={[styles.searchWrap, { paddingHorizontal: H_PAD, marginBottom: 16 }]}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: "rgba(42,62,42,0.55)", borderColor: "transparent", borderWidth: 0 },
            ]}
          >
            <Feather name="search" size={16} color="#B8D4B8" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Busca +${MUSICA_SESSIONS.length} sonidos`}
              placeholderTextColor="#B8D4B8"
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={14} color="#B8D4B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { paddingHorizontal: H_PAD }]}
          style={{ marginBottom: 20 }}
        >
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? "#A8C4A8" : "rgba(42,62,42,0.55)",
                    borderColor: "transparent",
                    borderWidth: 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? "#1A2418" : "#B8D4B8" },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grid */}
        <View style={[styles.grid, { paddingHorizontal: H_PAD }]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="search" size={32} color="#B8D4B8" style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: "#B8D4B8" }]}>
                Sin resultados{query ? ` para "${query}"` : ""}
              </Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {filtered.map((session) => {
                const fav = isFavorite(session.id);
                const tag = session.soundTag;
                const tagStyle = tag ? TAG_COLORS[tag] : null;
                const tagIcon = tag ? TAG_ICONS[tag] : null;

                return (
                  <Pressable
                    key={session.id}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: "rgba(42,62,42,0.55)",
                        borderColor: "transparent",
                        borderWidth: 0,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                    onPress={() => setPendingSession(session)}
                  >
                    {/* Circular image */}
                    <View style={[styles.imgWrap, { width: IMG_SIZE, height: IMG_SIZE }]}>
                      <Image
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        source={session.image as any}
                        style={[styles.img, { width: IMG_SIZE, height: IMG_SIZE, borderRadius: IMG_SIZE / 2 }]}
                      />
                      {/* Tag badge on image */}
                      {activeTab === "Todos" && tag && tagStyle && tagIcon && (
                        <View
                          style={[
                            styles.tagBadge,
                            { backgroundColor: tagStyle.bg },
                          ]}
                        >
                          <Feather name={tagIcon} size={9} color={tagStyle.text} />
                          <Text style={[styles.tagText, { color: tagStyle.text }]}>
                            {tag === "Sonidos Naturaleza" ? "Natural" : tag}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Title */}
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Duration Picker Modal */}
      <Modal
        visible={!!pendingSession}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPendingSession(null)}
      >
        <TouchableWithoutFeedback onPress={() => setPendingSession(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: colors.card,
                    paddingBottom: Math.max(insets.bottom, 24) + 8,
                  },
                ]}
              >
                {/* Drag handle */}
                <View style={[styles.dragHandle, { backgroundColor: "rgba(182,149,95,0.3)" }]} />

                {/* Session info */}
                {pendingSession && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalIcon, { backgroundColor: "rgba(182,149,95,0.1)" }]}>
                        <Feather name="clock" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                          ¿Cuánto tiempo?
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {pendingSession.title}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
                      El audio tendrá la duración que elijas
                    </Text>

                    {/* Duration options */}
                    <View style={styles.durationGrid}>
                      {DURATION_OPTIONS.map((min) => (
                        <Pressable
                          key={min}
                          style={({ pressed }) => [
                            styles.durationBtn,
                            {
                              backgroundColor: pressed
                                ? colors.primary
                                : "rgba(182,149,95,0.08)",
                              borderColor: pressed
                                ? colors.primary
                                : "rgba(182,149,95,0.25)",
                            },
                          ]}
                          onPress={() => handleSelectDuration(min)}
                        >
                          {({ pressed }) => (
                            <>
                              <Text style={[styles.durationNum, { color: pressed ? colors.primaryForeground : colors.foreground }]}>
                                {min}
                              </Text>
                              <Text style={[styles.durationUnit, { color: pressed ? colors.primaryForeground : colors.mutedForeground }]}>
                                min
                              </Text>
                            </>
                          )}
                        </Pressable>
                      ))}
                    </View>

                    {/* Cancel */}
                    <Pressable
                      style={[styles.cancelBtn, { borderColor: "rgba(182,149,95,0.2)" }]}
                      onPress={() => setPendingSession(null)}
                    >
                      <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                        Cancelar
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  searchWrap: {},
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
  },

  grid: {},
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    alignItems: "center",
    position: "relative",
    marginBottom: 4,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 2,
  },
  imgWrap: {
    position: "relative",
    marginBottom: 8,
    marginTop: 4,
  },
  img: {
    resizeMode: "cover",
  },
  tagBadge: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    left: "10%",
    right: "10%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
    marginBottom: 2,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    width: "100%",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 13,
  },
  modalHint: {
    fontSize: 12,
    marginBottom: 22,
    lineHeight: 18,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  durationBtn: {
    width: (width - 48 - 20) / 3,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationNum: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  durationUnit: {
    fontSize: 11,
    fontWeight: "500",
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

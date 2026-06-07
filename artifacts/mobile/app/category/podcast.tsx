import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { Image } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { PremiumBadge } from "@/components/PremiumBadge";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { getNatureSounds } from "@/config/nature-base-map";
import { useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session, type SonidosTag } from "@/data/sessions";
import { useCatalog } from "@/context/CatalogContext";
import { hasSoundFile } from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GAP = 10;
const COLS = 3;
const SCREEN_W = Dimensions.get("window").width;
const CARD_WIDTH = ((SCREEN_W - H_PAD * 2 - GAP * (COLS - 1)) / COLS) * 0.85 + 12;
const SONIDOS_ACCENT = "#6BA8C8";

type SonidosTab = SonidosTag;

const TABS: { label: string; value: SonidosTab; icon: string }[] = [
  { label: "Binaurales", value: "Sonidos Binaurales",   icon: "headphones" },
  { label: "Naturales",  value: "Sonidos Naturaleza",   icon: "wind"       },
  { label: "Inmersivos", value: "Sonidos Atmosféricos", icon: "cloud"      },
  { label: "Hipnóticos", value: "Sonidos Hipnóticos",   icon: "target"     },
];

/** Timer del sonido. 5/10/20 min gratis; el resto (incluido "Sin límite") es premium. */
const TIMER_OPTIONS: { minutes: number | null; label: string; free: boolean }[] = [
  { minutes: 5, label: "5 min", free: true },
  { minutes: 10, label: "10 min", free: true },
  { minutes: 20, label: "20 min", free: true },
  { minutes: 30, label: "30 min", free: false },
  { minutes: 40, label: "40 min", free: false },
  { minutes: 60, label: "1 h", free: false },
  { minutes: null, label: "Sin límite", free: false },
];

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

export default function SonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { version } = useCatalog();

  const [activeTab, setActiveTab] = useState<SonidosTab>("Sonidos Binaurales");
  const [query, setQuery] = useState("");
  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [subtitleOpen, setSubtitleOpen] = useState(false);
  const [pendingSession, setPendingSession] = useState<Session | null>(null);
  const { stopAll, toggleSound, setSleepTimer } = useMixer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sonidosSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "podcast"),
    [version],
  );

  const filtered = useMemo(() => {
    const base = sonidosSessions.filter((s) => s.sonidosTag === activeTab);
    const q = query.trim().toLowerCase();
    return q ? base.filter((s) => s.title.toLowerCase().includes(q)) : base;
  }, [sonidosSessions, activeTab, query]);

  const handleSelectTimer = (opt: (typeof TIMER_OPTIONS)[number]) => {
    if (!pendingSession) return;
    // Gating premium: solo 5/10/20 min son gratis.
    if (!opt.free && !isPremium) {
      setPendingSession(null);
      stopAll();
      router.push("/membresia" as never);
      return;
    }
    const session = pendingSession;
    setPendingSession(null);
    const nature = getNatureSounds(session.id);
    const base = nature?.base;
    // Sin sonido base válido (mapeado y con archivo) no hay nada que reproducir.
    if (!base || !hasSoundFile(base)) {
      stopAll();
      return;
    }
    // El ambiente viene precargado: se pasa a la inmersiva como segunda capa.
    const ambient =
      nature?.ambient && hasSoundFile(nature.ambient) ? nature.ambient : undefined;
    // null = "Sin límite": setSleepTimer(null) deja sonando sin temporizador.
    setSleepTimer(opt.minutes);
    router.push({
      pathname: "/inmersivo",
      params: {
        title: session.title,
        baseId: base,
        ...(ambient ? { ambientId: ambient } : {}),
      },
    } as never);
  };

  // Cancelar el timer detiene el sonido que arrancó al tocar la card.
  const handleCancelTimer = () => {
    setPendingSession(null);
    stopAll();
  };

  return (
    <LinearGradient

      style={styles.root}

      colors={BG_GRADIENT}

      locations={[0, 0.5, 1]}

      start={{ x: 0, y: 0 }}

      end={{ x: 0, y: 1 }}

    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.iconCircle, { backgroundColor: SONIDOS_ACCENT + "1A" }]}>
            <ExpoImage
              source={require("../../assets/images/cat-sonidos.png")}
              style={{ width: 34, height: 34 }}
              contentFit="contain"
            />
          </View>
          <Pressable
            onPress={() => setSubtitleOpen((v) => !v)}
            style={styles.titleRow}
            hitSlop={8}
          >
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>Sonidos</Text>
            <Feather
              name={subtitleOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.mutedForeground}
              style={styles.titleChevron}
            />
          </Pressable>
          {subtitleOpen && (
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              Ponte audífonos y a dormir
            </Text>
          )}
          <View style={styles.searchBar}>
            <Feather name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar en Sonidos…"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Sticky tab bar — bloques con ícono */}
        <View style={styles.tabBarWrap}>
          <View style={[styles.tabRow, { paddingHorizontal: H_PAD }]}>
            {TABS.map(({ label, value, icon }) => {
              const sel = activeTab === value;
              return (
                <Pressable
                  key={value}
                  onPress={() => setActiveTab(value)}
                  style={[styles.tabBlock, sel && styles.tabBlockActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: sel }}
                >
                  <Feather
                    name={icon as any}
                    size={24}
                    color={sel ? SONIDOS_ACCENT : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: "#FFFFFF",
                        fontWeight: sel ? "700" : "400",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Línea divisora entre tabs y sesiones */}
        <View style={[styles.divider, { marginHorizontal: H_PAD }]} />

        {/* Session grid */}
        <View style={[styles.grid, { paddingHorizontal: H_PAD, paddingTop: 24 }]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="waveform"
                size={32}
                color={colors.mutedForeground}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Próximamente
              </Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {filtered.map((session) => {
                const locked = !!session.isPremium && !isPremium;
                return (
                  <Pressable
                    key={session.id}
                    style={({ pressed }) => [
                      styles.card,
                      { width: CARD_WIDTH, opacity: pressed ? 0.82 : 1 },
                    ]}
                    onPress={() => {
                      if (locked) {
                        router.push("/membresia" as never);
                        return;
                      }
                      // Sonidos Naturaleza (modelo Pura Mente): arranca el sonido
                      // base al instante y abre el timer; el ambiente precargado
                      // se suma como segunda capa en la inmersiva.
                      const base = getNatureSounds(session.id)?.base;
                      if (base && hasSoundFile(base)) {
                        stopAll();
                        toggleSound(base);
                        setPendingSession(session);
                        return;
                      }
                      router.push(`/session/${session.id}` as never);
                    }}
                    onLongPress={() => setActionsSession(session)}
                  >
                    <View
                      style={{
                        width: CARD_WIDTH,
                        height: CARD_WIDTH,
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      <ExpoImage
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        source={session.image as any}
                        style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
                        contentFit="cover"
                        transition={IMAGE_TRANSITION}
                        cachePolicy="memory-disk"
                        placeholder={BLUR_PLACEHOLDER}
                      />
                      <PremiumBadge session={session} />
                    </View>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                  </Pressable>
                );
              })}
              {Array.from({
                length: (COLS - (filtered.length % COLS)) % COLS,
              }).map((_, i) => (
                <View key={`ghost-${i}`} style={{ width: CARD_WIDTH }} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Duration Picker Modal — Sonidos Naturaleza */}
      <Modal
        visible={!!pendingSession}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleCancelTimer}
      >
        <TouchableWithoutFeedback onPress={handleCancelTimer}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalSheet,
                  {
                    backgroundColor: "rgba(9,14,23,0.98)",
                    paddingBottom: Math.max(insets.bottom, 24) + 8,
                  },
                ]}
              >
                <View style={[styles.dragHandle, { backgroundColor: "rgba(198,155,79,0.25)" }]} />
                {pendingSession && (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalIcon, { backgroundColor: "rgba(198,155,79,0.12)" }]}>
                        <Feather name="clock" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                          ¿Cuánto tiempo?
                        </Text>
                        <Text style={[styles.modalSub, { color: colors.foreground }]} numberOfLines={1}>
                          {pendingSession.title}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.modalHint, { color: colors.mutedForeground }]}>
                      El sonido se detiene al terminar este tiempo · 5, 10 y 20 min gratis
                    </Text>

                    <View style={styles.durationGrid}>
                      {TIMER_OPTIONS.map((opt) => {
                        const lockedOpt = !opt.free && !isPremium;
                        return (
                          <Pressable
                            key={opt.label}
                            style={({ pressed }) => [
                              styles.durationBtn,
                              {
                                backgroundColor: pressed ? colors.primary : "rgba(198,155,79,0.10)",
                                borderColor: pressed ? colors.primary : "rgba(198,155,79,0.28)",
                              },
                            ]}
                            onPress={() => handleSelectTimer(opt)}
                          >
                            {({ pressed }) => (
                              <>
                                <Text
                                  style={[
                                    styles.durationNum,
                                    { fontSize: 18, color: pressed ? "#090F17" : colors.foreground },
                                  ]}
                                >
                                  {opt.label}
                                </Text>
                                {lockedOpt && (
                                  <View style={styles.timerLock}>
                                    <Feather name="lock" size={9} color="#BE9650" />
                                  </View>
                                )}
                              </>
                            )}
                          </Pressable>
                        );
                      })}
                    </View>

                    <Pressable
                      style={[styles.cancelBtn, { borderColor: "rgba(198,155,79,0.22)" }]}
                      onPress={handleCancelTimer}
                    >
                      <Text style={[styles.cancelText, { color: colors.foreground }]}>
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

      <SessionActionsSheet
        session={actionsSession}
        visible={!!actionsSession}
        onClose={() => setActionsSession(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    alignItems: "center",
    marginBottom: 20,
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
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  titleChevron: { marginLeft: 6, marginBottom: 4 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginTop: 18,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 16,
  },

  tabBarWrap: {
    paddingBottom: 0,
  },
  tabRow: { flexDirection: "row", gap: 8 },
  tabBlock: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabBlockActive: { backgroundColor: "rgba(100,142,195,0.14)" },
  tabLabel: { fontSize: 12, letterSpacing: 0.1 },

  grid: {},
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GAP,
    rowGap: 24,
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  // Modal — Sonidos Naturaleza timer
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
    width: (SCREEN_W - 48 - 20) / 3,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  timerLock: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(214,168,91,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationNum: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
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

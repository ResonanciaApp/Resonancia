import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { VozInteriorPanel } from "@/components/VozInteriorPanel";
import { type DiarioSection, useDiario } from "@/hooks/useDiario";
import { NoOlvidarCard, type NoOlvidarItem } from "@/components/NoOlvidarCard";
import { useDiarioFavoritesCtx } from "@/context/DiarioFavoritesContext";
import { useVozInterior } from "@/hooks/useVozInterior";
import { useColors } from "@/hooks/useColors";

const MAX_CHARS = 1000;

type SectionMeta = {
  key: DiarioSection;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  accentColor: string;
  gradientColors: [string, string];
  placeholder: string;
};

const SECTIONS: SectionMeta[] = [
  {
    key: "reflexiones",
    title: "Mis reflexiones",
    subtitle: "Mis más increíbles descubrimientos",
    icon: "moon",
    accentColor: "#D6A85B",
    gradientColors: ["#241C0C", "#141008"],
    placeholder: "Escribe aquí tu reflexión...",
  },
  {
    key: "ideas",
    title: "Ideas Brillantes",
    subtitle: "Las chispas que no quiero perder",
    icon: "zap",
    accentColor: "#D6A85B",
    gradientColors: ["#241C0C", "#141008"],
    placeholder: "Escribe aquí tus ideas geniales...",
  },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EntryCard({
  entry,
  accentColor,
  isFavorited,
  onToggleFavorite,
  onDelete,
}: {
  entry: { id: string; text: string; createdAt: string };
  accentColor: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const confirmTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const SINGLE_LINE_H = 22;

  const handleTrashPress = () => {
    if (confirmingDelete) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmingDelete(false);
      onDelete();
    } else {
      setConfirmingDelete(true);
      confirmTimerRef.current = setTimeout(() => setConfirmingDelete(false), 3000);
    }
  };

  const isTruncated = fullHeight !== null && fullHeight > SINGLE_LINE_H + 4;

  return (
    <Pressable
      onPress={() => isTruncated && setExpanded((v) => !v)}
      style={[styles.entryCard, { backgroundColor: colors.background, borderColor: colors.border }]}
    >
      <Text style={[styles.entryDate, { color: accentColor }]}>
        {formatDate(entry.createdAt)}
      </Text>

      {/* Hidden full-text to measure natural height */}
      {fullHeight === null && (
        <View
          style={{ opacity: 0, position: "absolute", left: 14, right: 14 }}
          onLayout={(e) => setFullHeight(e.nativeEvent.layout.height)}
        >
          <Text style={styles.entryText}>{entry.text}</Text>
        </View>
      )}

      {/* Visible text — truncated or full */}
      <Text
        style={[styles.entryText, { color: colors.foreground }]}
        numberOfLines={!expanded && isTruncated ? 1 : undefined}
        ellipsizeMode="tail"
      >
        {entry.text}
      </Text>

      {isTruncated && !expanded && (
        <Text style={[styles.expandHint, { color: colors.mutedForeground }]}>
          Toca para leer más
        </Text>
      )}

      {/* Favorite badge */}
      {isFavorited && (
        <View style={styles.favBadge}>
          <Feather name="heart" size={9} color="#D4709A" />
          <Text style={styles.favBadgeText}>En "A no olvidar"</Text>
        </View>
      )}

      {/* Action buttons: favorite + delete */}
      <View style={styles.entryActions}>
        <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.actionBtn}>
          <Feather
            name="heart"
            size={13}
            color={isFavorited ? "#D4709A" : colors.mutedForeground}
          />
        </Pressable>
        <Pressable onPress={handleTrashPress} hitSlop={8} style={[styles.actionBtn, confirmingDelete && styles.actionBtnConfirm]}>
          {confirmingDelete
            ? <Text style={styles.confirmDeleteText}>¿Borrar?</Text>
            : <Feather name="trash-2" size={13} color={colors.mutedForeground} />
          }
        </Pressable>
      </View>
    </Pressable>
  );
}

function SectionPanel({ meta }: { meta: SectionMeta }) {
  const colors = useColors();
  const { entries, saveEntry, deleteEntry, deleteAll } = useDiario(meta.key);
  const { isFavorited, toggleFavorite } = useDiarioFavoritesCtx();
  const [text, setText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const remaining = MAX_CHARS - text.length;

  const handleSave = async () => {
    if (!text.trim()) return;
    await saveEntry(text);
    setText("");
  };

  const handleDeleteAll = () => {
    deleteAll();
  };

  return (
    <View style={[styles.panel, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
      {/* Card header */}
      <View style={styles.panelHeader}>
        <View style={styles.panelHeaderLeft}>
          <View style={[styles.panelIconBg, { backgroundColor: `${meta.accentColor}22` }]}>
            <Feather name={meta.icon} size={18} color={meta.accentColor} />
          </View>
          <View>
            <Text style={[styles.panelTitle, { color: meta.accentColor }]}>{meta.title}</Text>
            <Text style={styles.panelSubtitle}>{meta.subtitle}</Text>
          </View>
        </View>
        {entries.length > 0 && (
          <Pressable onPress={() => setShowHistory(!showHistory)} style={styles.historyToggle}>
            <Feather name={showHistory ? "chevron-up" : "clock"} size={16} color="#FFFFFF" />
            <Text style={styles.historyCount}>{entries.length}</Text>
          </Pressable>
        )}
      </View>

      {/* Text input */}
      <View style={styles.inputArea}>
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
          placeholder={meta.placeholder}
          placeholderTextColor="rgba(237,225,211,0.55)"
          multiline
          style={[
            styles.textInput,
            {
              color: colors.foreground,
              borderColor: text.length > 0 ? `${meta.accentColor}55` : colors.border,
            },
          ]}
        />
        <View style={styles.inputFooter}>
          <View />
          <Pressable
            onPress={handleSave}
            disabled={!text.trim()}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: text.trim() ? meta.accentColor : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="check" size={14} color={text.trim() ? "#070E09" : colors.mutedForeground} style={{ paddingLeft: 1 }} />
            <Text style={[styles.saveBtnText, { color: text.trim() ? "#070E09" : colors.mutedForeground }]}>
              Guardar
            </Text>
          </Pressable>
        </View>
      </View>

      {/* History */}
      {showHistory && entries.length > 0 && (
        <View style={[styles.history, { borderTopColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>
              HISTORIAL · {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
            </Text>
            <Pressable onPress={handleDeleteAll} hitSlop={8} style={styles.deleteAllBtn}>
              <Feather name="trash-2" size={11} color={colors.mutedForeground} />
              <Text style={[styles.deleteAllText, { color: colors.mutedForeground }]}>
                Borrar todo
              </Text>
            </Pressable>
          </View>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              accentColor={meta.accentColor}
              isFavorited={isFavorited(entry.id)}
              onToggleFavorite={() => toggleFavorite(entry, meta.key)}
              onDelete={() => deleteEntry(entry.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function DiarioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { favoriteEntries, toggleFavorite } = useDiarioFavoritesCtx();
  const {
    entries: vozEntries,
    playEntry,
    playingId,
    playingPositionMs,
    updateEntry: updateVozEntry,
  } = useVozInterior();
  const [noOlvidarOpen, setNoOlvidarOpen] = useState(true);

  const noOlvidarItems = React.useMemo<NoOlvidarItem[]>(() => {
    const diarioFavs: NoOlvidarItem[] = favoriteEntries
      .filter((e) => e.sectionKey !== "aprendizaje")
      .map((e) => ({
        kind: "diary" as const,
        id: `ref-${e.id}`,
        rawId: e.id,
        text: e.text,
        createdAt: e.createdAt,
        sectionTitle: e.sectionTitle,
        accentColor: e.accentColor,
        sectionKey: e.sectionKey,
      }));
    const vozFavs: NoOlvidarItem[] = vozEntries
      .filter((e) => e.isFavorite)
      .map((e) => ({
        kind: "voz" as const,
        id: `voz-${e.id}`,
        rawId: e.id,
        title: e.title?.trim() ?? "",
        durationMs: e.durationMs,
        createdAt: e.createdAt,
      }));
    return [...diarioFavs, ...vozFavs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [favoriteEntries, vozEntries]);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: 160 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Mi Diario</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
              Guarda audios de voz con las inspiraciones y mensajes que brotan desde tu interior.
            </Text>
          </View>
        </View>

        {/* Divider line */}
        <View style={[styles.divider, { backgroundColor: "rgba(182,149,95,0.2)" }]} />

        {/* Sections */}
        <View style={styles.sections}>
          {/* ── A no olvidar ── */}
          <View style={[styles.noOlvidarPanel, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
            <Pressable
              onPress={() => setNoOlvidarOpen((v) => !v)}
              style={({ pressed }) => [styles.noOlvidarHeader, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.noOlvidarTitleRow}>
                <View style={[styles.panelIconBg, { backgroundColor: "rgba(212,112,154,0.15)" }]}>
                  <Feather name="heart" size={16} color="#D4709A" />
                </View>
                <View>
                  <Text style={[styles.noOlvidarTitle, { color: "#D4709A" }]}>A no olvidar</Text>
                  <Text style={[styles.noOlvidarSub, { color: colors.mutedForeground }]}>
                    Tus notas y audios favoritos
                  </Text>
                </View>
              </View>
              <View style={styles.noOlvidarRight}>
                {noOlvidarItems.length > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{noOlvidarItems.length}</Text>
                  </View>
                )}
                <Feather
                  name={noOlvidarOpen ? "chevron-up" : "chevron-down"}
                  size={17}
                  color="#D4709A"
                />
              </View>
            </Pressable>

            {noOlvidarOpen && noOlvidarItems.length === 0 && (
              <View style={styles.noOlvidarEmpty}>
                <Text style={[styles.noOlvidarEmptyText, { color: colors.mutedForeground }]}>
                  Toca el corazón en cualquier entrada para guardarla aquí.
                </Text>
              </View>
            )}

            {noOlvidarOpen && noOlvidarItems.length > 0 && (
              <View style={styles.noOlvidarList}>
                {noOlvidarItems.map((item) => {
                  const vozEntry =
                    item.kind === "voz"
                      ? vozEntries.find((e) => e.id === item.rawId)
                      : undefined;
                  return (
                    <NoOlvidarCard
                      key={item.id}
                      item={item}
                      isPlaying={item.kind === "voz" && playingId === item.rawId}
                      positionMs={
                        item.kind === "voz" && playingId === item.rawId
                          ? playingPositionMs
                          : 0
                      }
                      onPlay={
                        item.kind === "voz" && vozEntry
                          ? () => playEntry(vozEntry)
                          : undefined
                      }
                      onRemove={() => {
                        if (item.kind === "voz") {
                          updateVozEntry(item.rawId, { isFavorite: false });
                        } else {
                          toggleFavorite(
                            { id: item.rawId, text: item.text, createdAt: item.createdAt },
                            item.sectionKey,
                          );
                        }
                      }}
                    />
                  );
                })}
              </View>
            )}
          </View>

          <VozInteriorPanel />
          {SECTIONS.map((s) => (
            <SectionPanel key={s.key} meta={s} />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  screenTitle: { fontSize: 28, fontWeight: "700", letterSpacing: 0.3 },
  screenSubtitle: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: 1, marginHorizontal: 20, marginBottom: 24 },
  sections: { paddingHorizontal: 20, gap: 16 },

  // A no olvidar
  noOlvidarPanel: { borderRadius: 20, overflow: "hidden" },
  noOlvidarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  noOlvidarTitleRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  noOlvidarTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  noOlvidarSub: { fontSize: 11, marginTop: 1 },
  noOlvidarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(212,112,154,0.18)",
  },
  countText: { fontSize: 12, fontWeight: "700", color: "#D4709A" },
  noOlvidarEmpty: { padding: 16, paddingTop: 12 },
  noOlvidarEmptyText: { fontSize: 13, lineHeight: 20, textAlign: "center" },
  noOlvidarList: { padding: 14, gap: 10 },

  // Panel
  panel: {
    borderRadius: 20,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  panelHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  panelIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  panelSubtitle: { color: "#FFFFFF", fontSize: 11, marginTop: 1 },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  historyCount: { color: "#F5EDD8", fontSize: 12, fontWeight: "600" },

  // Input
  inputArea: { padding: 14 },
  textInput: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  inputFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  charCount: { fontSize: 11 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { fontSize: 13, fontWeight: "700" },

  // History
  history: { borderTopWidth: 1, padding: 14, gap: 10 },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyTitle: { fontSize: 10, letterSpacing: 1.5, fontWeight: "600" },
  deleteAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  deleteAllText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },
  entryCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    position: "relative",
  },
  entryDate: { fontSize: 10, letterSpacing: 0.5, marginBottom: 6, fontWeight: "600" },
  entryText: { fontSize: 13, lineHeight: 20 },
  expandHint: { fontSize: 10, marginTop: 4, letterSpacing: 0.3 },
  entryActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 8,
  },
  actionBtn: {
    padding: 6,
  },
  actionBtnConfirm: {
    backgroundColor: "rgba(224,112,96,0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  confirmDeleteText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#E07060",
  },
  favBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,112,154,0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  favBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#D4709A",
  },
});

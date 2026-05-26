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
import { useDiarioFavoritesCtx } from "@/context/DiarioFavoritesContext";
import { useColors } from "@/hooks/useColors";

const MAX_CHARS = 1000;

type SectionMeta = {
  key: DiarioSection;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  accentColor: string;
  gradientColors: [string, string];
};

const SECTIONS: SectionMeta[] = [
  {
    key: "reflexiones",
    title: "Mis reflexiones",
    subtitle: "Mis más increíbles descubrimientos",
    icon: "moon",
    accentColor: "#8AAAD4",
    gradientColors: ["#243350", "#131E33"],
  },
  {
    key: "ideas",
    title: "Ideas Brillantes",
    subtitle: "Las chispas que no quiero perder",
    icon: "zap",
    accentColor: "#F0CC82",
    gradientColors: ["#3D2E00", "#231A00"],
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
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: "rgba(199,156,88,0.15)" }]}>
      {/* Card header */}
      <LinearGradient
        colors={meta.gradientColors}
        style={styles.panelHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.panelHeaderLeft}>
          <View style={[styles.panelIconBg, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name={meta.icon} size={18} color="#F5EDD8" />
          </View>
          <View>
            <Text style={styles.panelTitle}>{meta.title}</Text>
            <Text style={styles.panelSubtitle}>{meta.subtitle}</Text>
          </View>
        </View>
        {entries.length > 0 && (
          <Pressable onPress={() => setShowHistory(!showHistory)} style={styles.historyToggle}>
            <Feather name={showHistory ? "chevron-up" : "clock"} size={16} color="#F5EDD8" />
            <Text style={styles.historyCount}>{entries.length}</Text>
          </Pressable>
        )}
      </LinearGradient>

      {/* Text input */}
      <View style={styles.inputArea}>
        <TextInput
          value={text}
          onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
          placeholder="Escribe aquí tu reflexión..."
          placeholderTextColor={colors.mutedForeground}
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
          <Text style={[styles.charCount, { color: remaining < 100 ? "#E07060" : colors.mutedForeground }]}>
            {remaining} caracteres restantes
          </Text>
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
            <Feather name="check" size={14} color={text.trim() ? "#141B26" : colors.mutedForeground} style={{ paddingLeft: 1 }} />
            <Text style={[styles.saveBtnText, { color: text.trim() ? "#141B26" : colors.mutedForeground }]}>
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
          <View>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Mi Diario</Text>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
              Tu espacio de reflexión interior
            </Text>
          </View>
          <View style={[styles.headerIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="book-open" size={18} color={colors.accent} />
          </View>
        </View>

        {/* Divider line */}
        <View style={[styles.divider, { backgroundColor: "rgba(199,156,88,0.2)" }]} />

        {/* Sections */}
        <View style={styles.sections}>
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
  screenSubtitle: { fontSize: 13, marginTop: 3 },
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

  // Panel
  panel: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  panelHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  panelIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  panelTitle: { color: "#F5EDD8", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  panelSubtitle: { color: "rgba(245,237,216,0.7)", fontSize: 11, marginTop: 1 },
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

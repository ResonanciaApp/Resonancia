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
import { type DiarioSection, useDiario } from "@/hooks/useDiario";
import { useDiarioFavorites } from "@/hooks/useDiarioFavorites";
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
    key: "aprendizaje",
    title: "Qué aprendí hoy",
    subtitle: "Recuerda las enseñanzas de la vida",
    icon: "sunrise",
    accentColor: "#C69B4F",
    gradientColors: ["#BF9B70", "#8A6E48"],
  },
  {
    key: "suenos",
    title: "Materializo mis sueños",
    subtitle: "Guarda tus ideas sobre tus proyectos",
    icon: "star",
    accentColor: "#E0B882",
    gradientColors: ["#C49A52", "#8A6C2A"],
  },
  {
    key: "reflexiones",
    title: "Reflexiones profundas",
    subtitle: "Mis más increíbles descubrimientos",
    icon: "moon",
    accentColor: "#8AAAD4",
    gradientColors: ["#243350", "#131E33"],
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
  const SINGLE_LINE_H = 22;

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

      {/* Action buttons: favorite + delete */}
      <View style={styles.entryActions}>
        <Pressable onPress={onToggleFavorite} hitSlop={8} style={styles.actionBtn}>
          <Feather
            name="heart"
            size={13}
            color={isFavorited ? "#E07070" : colors.mutedForeground}
          />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
          <Feather name="trash-2" size={13} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </Pressable>
  );
}

function SectionPanel({ meta }: { meta: SectionMeta }) {
  const colors = useColors();
  const { entries, saveEntry, deleteEntry } = useDiario(meta.key);
  const { isFavorited, toggleFavorite } = useDiarioFavorites();
  const [text, setText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const remaining = MAX_CHARS - text.length;

  const handleSave = async () => {
    if (!text.trim()) return;
    await saveEntry(text);
    setText("");
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Eliminar entrada",
      "¿Seguro que querés borrar esta reflexión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteEntry(id) },
      ],
    );
  };

  return (
    <View style={[styles.panel, { backgroundColor: colors.card, borderColor: "rgba(198,155,79,0.15)" }]}>
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
            <Feather name="check" size={14} color={text.trim() ? "#18110C" : colors.mutedForeground} style={{ paddingLeft: 1 }} />
            <Text style={[styles.saveBtnText, { color: text.trim() ? "#18110C" : colors.mutedForeground }]}>
              Guardar
            </Text>
          </Pressable>
        </View>
      </View>

      {/* History */}
      {showHistory && entries.length > 0 && (
        <View style={[styles.history, { borderTopColor: colors.border }]}>
          <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>
            HISTORIAL · {entries.length} {entries.length === 1 ? "entrada" : "entradas"}
          </Text>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              accentColor={meta.accentColor}
              isFavorited={isFavorited(entry.id)}
              onToggleFavorite={() => toggleFavorite(entry, meta.key)}
              onDelete={() => handleDelete(entry.id)}
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
        <View style={[styles.divider, { backgroundColor: "rgba(198,155,79,0.2)" }]} />

        {/* Sections */}
        <View style={styles.sections}>
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
  historyTitle: { fontSize: 10, letterSpacing: 1.5, fontWeight: "600", marginBottom: 4 },
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
});

import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { type VozEntry, useVozInterior } from "@/hooks/useVozInterior";
import { useColors } from "@/hooks/useColors";

const BAR_COUNT = 7;
const ACCENT = "#D6A85B";
const PINK = "#D4709A";
const GRADIENT: [string, string] = ["#241C0C", "#141008"];

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BAR_HEIGHTS_ACTIVE = [10, 22, 14, 30, 16, 24, 12];

function WaveformBar({ index, active }: { index: number; active: boolean }) {
  const height = active ? BAR_HEIGHTS_ACTIVE[index % BAR_HEIGHTS_ACTIVE.length] : 4;
  return (
    <View
      style={[
        styles.waveBar,
        { height, backgroundColor: active ? ACCENT : "rgba(155,111,212,0.35)" },
      ]}
    />
  );
}

function RecordButton({ isRecording, onPress }: { isRecording: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.recordBtnWrapper}>
      <View
        style={[
          styles.recordBtn,
          {
            backgroundColor: isRecording ? "#D4304A" : ACCENT,
            shadowColor: isRecording ? "#D4304A" : ACCENT,
          },
        ]}
      >
        <Feather name={isRecording ? "square" : "mic"} size={26} color="#FFF" />
      </View>
    </Pressable>
  );
}

function RecordingEntry({
  entry,
  isPlaying,
  positionMs,
  onPlay,
  onDelete,
  onUpdateEntry,
}: {
  entry: VozEntry;
  isPlaying: boolean;
  positionMs: number;
  onPlay: () => void;
  onDelete: () => void;
  onUpdateEntry: (patch: Partial<Pick<VozEntry, "title" | "isFavorite">>) => void;
}) {
  const colors = useColors();
  const progress = entry.durationMs > 0 ? Math.min(positionMs / entry.durationMs, 1) : 0;
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(entry.title ?? "");
  const inputRef = useRef<TextInput>(null);

  const confirmTitle = () => {
    onUpdateEntry({ title: titleInput.trim() });
    setEditingTitle(false);
  };

  const isFav = entry.isFavorite ?? false;

  return (
    <View style={[styles.entryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {/* Title row */}
      <View style={styles.titleRow}>
        {editingTitle ? (
          <View style={styles.titleEditRow}>
            <TextInput
              ref={inputRef}
              value={titleInput}
              onChangeText={setTitleInput}
              onSubmitEditing={confirmTitle}
              onBlur={confirmTitle}
              placeholder="Agregar título..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.titleInput, { color: colors.foreground, borderColor: `${ACCENT}55` }]}
              maxLength={60}
              returnKeyType="done"
            />
          </View>
        ) : (
          <Pressable onPress={() => { setTitleInput(entry.title ?? ""); setEditingTitle(true); setTimeout(() => inputRef.current?.focus(), 60); }} style={styles.titlePressable}>
            {entry.title?.trim() ? (
              <Text style={[styles.titleText, { color: colors.foreground }]} numberOfLines={1}>
                {entry.title}
              </Text>
            ) : (
              <Text style={[styles.titlePlaceholder, { color: colors.mutedForeground }]}>
                Toca para agregar título...
              </Text>
            )}
            <Feather name="edit-2" size={10} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
          </Pressable>
        )}

        {/* Favorite toggle */}
        <Pressable
          onPress={() => onUpdateEntry({ isFavorite: !isFav })}
          hitSlop={8}
          style={styles.favBtn}
        >
          <Feather name="heart" size={14} color={isFav ? PINK : colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Playback row */}
      <View style={styles.entryRow}>
        <Pressable onPress={onPlay} style={[styles.playBtn, { backgroundColor: `${ACCENT}22`, borderColor: `${ACCENT}55` }]}>
          <Feather name={isPlaying ? "pause" : "play"} size={14} color={ACCENT} />
        </Pressable>

        <View style={styles.entryMeta}>
          <Text style={[styles.entryDate, { color: ACCENT }]}>{formatDate(entry.createdAt)}</Text>
          <Text style={[styles.entryDuration, { color: colors.mutedForeground }]}>
            {isPlaying ? `${formatMs(positionMs)} / ${formatMs(entry.durationMs)}` : formatMs(entry.durationMs)}
          </Text>
        </View>

        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
          <Feather name="trash-2" size={13} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {isPlaying && (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: ACCENT }]} />
        </View>
      )}

      {/* Favorite badge */}
      {isFav && (
        <View style={styles.favBadge}>
          <Feather name="heart" size={9} color={PINK} />
          <Text style={[styles.favBadgeText, { color: PINK }]}>En "A no olvidar"</Text>
        </View>
      )}
    </View>
  );
}

export function VozInteriorPanel() {
  const colors = useColors();
  const {
    entries,
    isRecording,
    elapsedMs,
    playingId,
    playingPositionMs,
    startRecording,
    stopRecording,
    deleteEntry,
    deleteAllEntries,
    updateEntry,
    playEntry,
  } = useVozInterior();

  const [showHistory, setShowHistory] = React.useState(false);

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
      setShowHistory(true);
    } else {
      const ok = await startRecording();
      if (!ok) {
        Alert.alert(
          "Permiso requerido",
          "RESONANCIA necesita acceso al micrófono para grabar tu Voz Interior.",
          [{ text: "Entendido" }],
        );
      }
    }
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
  };

  return (
    <View style={[styles.panel, { backgroundColor: "rgba(255,255,255,0.05)" }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <Feather name="mic" size={18} color={ACCENT} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: ACCENT }]}>Voz Interior</Text>
            <Text style={styles.headerSubtitle}>Graba tus pensamientos y emociones</Text>
          </View>
        </View>
        {entries.length > 0 && (
          <Pressable onPress={() => setShowHistory((v) => !v)} style={styles.historyToggle}>
            <Feather name={showHistory ? "chevron-up" : "clock"} size={16} color="#FFFFFF" />
            <Text style={styles.historyCount}>{entries.length}</Text>
          </Pressable>
        )}
      </View>

      {/* Record Area */}
      <View style={styles.recordArea}>
        <View style={styles.waveform}>
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <WaveformBar key={i} index={i} active={isRecording} />
          ))}
        </View>

        <RecordButton isRecording={isRecording} onPress={handleRecord} />

        <View style={styles.timerWrapper}>
          {isRecording ? (
            <>
              <View style={styles.recDot} />
              <Text style={[styles.timerText, { color: "#D4304A" }]}>{formatMs(elapsedMs)}</Text>
            </>
          ) : (
            <Text style={[styles.timerHint, { color: colors.mutedForeground }]}>
              {Platform.OS === "web" ? "Disponible en la app" : "Toca para grabar"}
            </Text>
          )}
        </View>
      </View>

      {/* History */}
      {showHistory && entries.length > 0 && (
        <View style={[styles.history, { borderTopColor: colors.border }]}>
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.historyTitle, { color: colors.mutedForeground }]}>
              HISTORIAL · {entries.length} {entries.length === 1 ? "grabación" : "grabaciones"}
            </Text>
            <Pressable
              onPress={() => deleteAllEntries()}
              style={styles.deleteAllBtn}
              hitSlop={8}
            >
              <Feather name="trash-2" size={12} color={colors.mutedForeground} />
              <Text style={[styles.deleteAllText, { color: colors.mutedForeground }]}>
                Borrar todos
              </Text>
            </Pressable>
          </View>
          {entries.map((entry) => (
            <RecordingEntry
              key={entry.id}
              entry={entry}
              isPlaying={playingId === entry.id}
              positionMs={playingId === entry.id ? playingPositionMs : 0}
              onPlay={() => playEntry(entry)}
              onDelete={() => handleDelete(entry.id)}
              onUpdateEntry={(patch) => updateEntry(entry.id, patch)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(214,168,91,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  headerSubtitle: { color: "#FFFFFF", fontSize: 11, marginTop: 1 },
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  historyCount: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  historyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  deleteAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteAllText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  recordArea: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 48,
  },
  waveBar: {
    width: 4,
    borderRadius: 3,
  },
  recordBtnWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
  },
  recordPulse: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  recordBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  timerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 20,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D4304A",
  },
  timerText: { fontSize: 18, fontWeight: "700", letterSpacing: 2, fontVariant: ["tabular-nums"] },
  timerHint: { fontSize: 12, letterSpacing: 0.3 },

  history: { borderTopWidth: 1, padding: 14, gap: 10 },
  historyTitle: { fontSize: 10, letterSpacing: 1.5, fontWeight: "600", marginBottom: 4 },

  // Entry card
  entryCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titlePressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  titlePlaceholder: {
    fontSize: 12,
    fontStyle: "italic",
    flex: 1,
  },
  titleEditRow: {
    flex: 1,
  },
  titleInput: {
    fontSize: 13,
    fontWeight: "600",
    borderBottomWidth: 1,
    paddingBottom: 3,
    paddingHorizontal: 2,
  },
  favBtn: {
    padding: 4,
  },

  entryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  entryMeta: { flex: 1 },
  entryDate: { fontSize: 10, fontWeight: "600", letterSpacing: 0.4 },
  entryDuration: { fontSize: 13, fontWeight: "600", marginTop: 2, fontVariant: ["tabular-nums"] },
  deleteBtn: { padding: 6 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },

  favBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: `${PINK}18`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  favBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});

import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { type DiarioSection } from "@/hooks/useDiario";
import { useColors } from "@/hooks/useColors";

const PINK = "#D4709A";

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type DiaryNoOlvidar = {
  kind: "diary";
  id: string;
  rawId: string;
  text: string;
  createdAt: string;
  sectionTitle: string;
  accentColor: string;
  sectionKey: DiarioSection;
};

export type VozNoOlvidar = {
  kind: "voz";
  id: string;
  rawId: string;
  title: string;
  durationMs: number;
  createdAt: string;
};

export type NoOlvidarItem = DiaryNoOlvidar | VozNoOlvidar;

// ─── Diary card ───────────────────────────────────────────────────────────────

function DiaryCard({ item, onRemove }: { item: DiaryNoOlvidar; onRemove: () => void }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [fullH, setFullH] = useState<number | null>(null);
  const measured = useRef(false);
  const LINE_H = 20;
  const isTruncated = fullH !== null && fullH > LINE_H + 6;

  const confirmRemove = onRemove;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row: badge + delete */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: item.accentColor + "22", borderColor: item.accentColor + "55" }]}>
          <Text style={[styles.badgeText, { color: item.accentColor }]}>{item.sectionTitle}</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
        <Pressable onPress={confirmRemove} hitSlop={10} style={styles.deleteBtn}>
          <Feather name="trash-2" size={13} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Hidden measure view */}
      {!measured.current && (
        <View
          style={{ opacity: 0, position: "absolute", left: 14, right: 14 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && !measured.current) {
              measured.current = true;
              setFullH(h);
            }
          }}
        >
          <Text style={[styles.bodyText, { color: colors.foreground }]}>{item.text}</Text>
        </View>
      )}

      {/* Body text */}
      <Pressable onPress={() => isTruncated && setExpanded((v) => !v)}>
        <Text
          style={[styles.bodyText, { color: colors.foreground }]}
          numberOfLines={expanded || !isTruncated ? undefined : 1}
          ellipsizeMode="tail"
        >
          {item.text}
        </Text>
        {isTruncated && (
          <Text style={[styles.expandHint, { color: colors.mutedForeground }]}>
            {expanded ? "Toca para colapsar" : "Toca para leer más"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Voz card ─────────────────────────────────────────────────────────────────

function VozCard({
  item,
  isPlaying,
  positionMs,
  onPlay,
  onRemove,
}: {
  item: VozNoOlvidar;
  isPlaying: boolean;
  positionMs: number;
  onPlay: () => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  const progress = item.durationMs > 0 ? Math.min(positionMs / item.durationMs, 1) : 0;

  const confirmRemove = onRemove;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row: badge + date + delete */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: "#98825A22", borderColor: "#98825A55" }]}>
          <Feather name="mic" size={9} color="#98825A" style={{ marginRight: 3 }} />
          <Text style={[styles.badgeText, { color: "#98825A" }]}>Voz Interior</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
        <Pressable onPress={confirmRemove} hitSlop={10} style={styles.deleteBtn}>
          <Feather name="trash-2" size={13} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Title */}
      {item.title ? (
        <Text style={[styles.vozTitle, { color: colors.foreground }]} numberOfLines={1}>
          {item.title}
        </Text>
      ) : (
        <Text style={[styles.vozTitleEmpty, { color: colors.mutedForeground }]}>
          Sin título
        </Text>
      )}

      {/* Playback row */}
      <View style={styles.playRow}>
        <Pressable
          onPress={onPlay}
          style={[styles.playBtn, { backgroundColor: PINK + "22", borderColor: PINK + "55" }]}
        >
          <Feather name={isPlaying ? "pause" : "play"} size={14} color={PINK} />
        </Pressable>
        <Text style={[styles.durationText, { color: colors.mutedForeground }]}>
          {isPlaying ? `${formatMs(positionMs)} / ${formatMs(item.durationMs)}` : formatMs(item.durationMs)}
        </Text>
      </View>

      {/* Progress bar */}
      {isPlaying && (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: PINK }]} />
        </View>
      )}
    </View>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function NoOlvidarCard({
  item,
  isPlaying = false,
  positionMs = 0,
  onPlay,
  onRemove,
}: {
  item: NoOlvidarItem;
  isPlaying?: boolean;
  positionMs?: number;
  onPlay?: () => void;
  onRemove: () => void;
}) {
  if (item.kind === "voz") {
    return (
      <VozCard
        item={item}
        isPlaying={isPlaying}
        positionMs={positionMs}
        onPlay={onPlay ?? (() => {})}
        onRemove={onRemove}
      />
    );
  }
  return <DiaryCard item={item} onRemove={onRemove} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  dateText: { fontSize: 10, flex: 1 },
  deleteBtn: { padding: 4 },

  bodyText: { fontSize: 13, lineHeight: 20 },
  expandHint: { fontSize: 10, marginTop: 3, letterSpacing: 0.3 },

  vozTitle: { fontSize: 14, fontWeight: "600" },
  vozTitleEmpty: { fontSize: 13, fontStyle: "italic" },

  playRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationText: { fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] },

  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
});

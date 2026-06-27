import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const LINE_H = 20;
const MAX_LINES = 3;

export type DiarioCardEntry = {
  id: string;
  text: string;
  createdAt: string;
  sectionTitle: string;
  accentColor: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DiarioEntryCard({
  entry,
  showHeart = false,
  showDate = true,
}: {
  entry: DiarioCardEntry;
  showHeart?: boolean;
  showDate?: boolean;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const hasMeasured = useRef(false);

  const isTruncated = fullHeight !== null && fullHeight > LINE_H * MAX_LINES + 4;
  const numberOfLines = !hasMeasured.current || expanded || !isTruncated ? undefined : MAX_LINES;

  return (
    <Pressable
      onPress={() => isTruncated && setExpanded((v) => !v)}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: entry.accentColor + "20",
              borderColor: entry.accentColor + "55",
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: entry.accentColor }]}>
            {entry.sectionTitle}
          </Text>
        </View>
        {showHeart && <Feather name="heart" size={11} color="#E07070" />}
        {showDate && !showHeart && (
          <Text style={[styles.date, { color: colors.mutedForeground }]}>
            {formatDate(entry.createdAt)}
          </Text>
        )}
      </View>

      <View
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (!hasMeasured.current && h > 0) {
            hasMeasured.current = true;
            setFullHeight(h);
          }
        }}
      >
        <Text
          style={[styles.text, { color: colors.foreground }]}
          numberOfLines={numberOfLines}
          ellipsizeMode="tail"
        >
          {entry.text}
        </Text>
      </View>

      {isTruncated && !expanded && (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Toca para leer más
        </Text>
      )}
      {isTruncated && expanded && (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Toca para colapsar
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  date: { fontSize: 10 },
  text: { fontSize: 13, lineHeight: 20 },
  hint: { fontSize: 10, marginTop: 2, letterSpacing: 0.3 },
});

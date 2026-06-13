import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SessionRow } from "@/components/SessionRow";
import { getMoodById } from "@/data/moods";
import { SESSIONS } from "@/data/sessions";

export default function EstadoAnimoScreen() {
  const { mood: moodId } = useLocalSearchParams<{ mood: string }>();
  const mood = getMoodById(moodId ?? "");

  const sessions = useMemo(() => {
    if (!mood) return [];

    const themeSet = new Set(mood.themeTags);
    const categorySet = new Set(mood.categoryIds);

    const withTag = SESSIONS.filter(
      (s) => s.themeTag?.some((t) => themeSet.has(t))
    );
    const withTagIds = new Set(withTag.map((s) => s.id));

    const byCategory = SESSIONS.filter(
      (s) => !withTagIds.has(s.id) && categorySet.has(s.categoryId)
    );

    return [...withTag, ...byCategory];
  }, [mood]);

  if (!mood) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.emptyText}>Estado de ánimo no encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#EDE1D3" />
        </Pressable>
        <Text style={styles.headerTitle}>Para tu estado de ánimo</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.moodChip}>
        <Text style={styles.moodChipEmoji}>{mood.emoji}</Text>
        <Text style={styles.moodChipLabel}>{mood.label}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.chipClose}>
          <Feather name="x" size={14} color="rgba(190,150,80,0.7)" />
        </Pressable>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            No hay sesiones para este estado de ánimo aún.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <SessionRow session={item} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1B060F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EDE1D3",
    flex: 1,
    textAlign: "center",
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(190,150,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.30)",
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 20,
  },
  moodChipEmoji: {
    fontSize: 18,
  },
  moodChipLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#BE9650",
  },
  chipClose: {
    marginLeft: 2,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.10)",
    marginLeft: 94,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    color: "rgba(237,225,211,0.45)",
    textAlign: "center",
  },
});

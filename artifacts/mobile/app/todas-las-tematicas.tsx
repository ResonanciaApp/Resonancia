import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const TAG_W = (width - H_PAD * 2 - GAP) / 2;
const TAG_H = 140;

export default function TodasLasTemáticasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.card, borderColor: "rgba(198,155,79,0.2)", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Todas las Temáticas</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {TAG_CARDS.length} temáticas disponibles
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {TAG_CARDS.map((tag) => (
            <Pressable
              key={tag.id}
              onPress={() => router.push(`/tag/${tag.id}` as never)}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Image
                source={tag.image}
                style={{ position: "absolute", width: TAG_W, height: TAG_H }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(10,6,4,0.15)", "rgba(10,6,4,0.78)"]}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { borderRadius: 16, borderWidth: 1, borderColor: "rgba(198,155,79,0.22)" },
                ]}
              />
              <Text style={styles.label}>{tag.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 18,
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: H_PAD,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  card: {
    width: TAG_W,
    height: TAG_H,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

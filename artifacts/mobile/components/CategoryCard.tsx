import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type Category } from "@/data/categories";
import { useColors } from "@/hooks/useColors";

type IconName = React.ComponentProps<typeof Feather>["name"];

type Props = {
  category: Category;
  wide?: boolean;
};

export function CategoryCard({ category, wide = false }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => router.push(`/category/${category.id}` as never)}
      style={({ pressed }) => [
        wide ? styles.wide : styles.card,
        { opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <LinearGradient
        colors={category.gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
      />
      <View
        style={[
          styles.border,
          { borderRadius: colors.radius, borderColor: "rgba(198,155,79,0.15)" },
        ]}
      />
      <View style={styles.iconWrapper}>
        <View
          style={[
            styles.iconBg,
            { backgroundColor: "rgba(198,155,79,0.12)", borderColor: "rgba(198,155,79,0.2)" },
          ]}
        >
          <Feather name={category.icon as IconName} size={wide ? 22 : 18} color={category.color} />
        </View>
      </View>
      <View style={styles.content}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={wide ? 1 : 2}
        >
          {category.title}
        </Text>
        {wide ? (
          <Text style={[styles.subtitle, { color: colors.foreground }]} numberOfLines={1}>
            {category.subtitle}
          </Text>
        ) : null}
        <Text style={[styles.count, { color: colors.accent }]}>
          {category.sessionCount} sessions
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 170,
    borderRadius: 22,
    marginRight: 12,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  wide: {
    flex: 1,
    height: 120,
    borderRadius: 22,
    marginBottom: 10,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    gap: 14,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  iconWrapper: {},
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  count: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

import React from "react";
import { StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";

type Props = {
  categoryId?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CategoryAtmosphericCard({
  children,
  style,
}: Props) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
});
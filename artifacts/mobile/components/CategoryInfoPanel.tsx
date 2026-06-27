import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export type InfoItem = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  body: string;
};

type Props = {
  accentColor: string;
  heading: string;
  items: InfoItem[];
  quote: string;
  whyItems: { icon: React.ComponentProps<typeof Feather>["name"]; text: string }[];
};

export function CategoryInfoPanel({ accentColor, heading, items, quote, whyItems }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrapper, { borderTopColor: accentColor + "33" }]}>
      {/* Toggle button */}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.toggle,
          { backgroundColor: "rgba(74,12,12,0.08)", borderColor: "transparent", opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Feather name="info" size={16} color={accentColor} style={{ marginRight: 10 }} />
        <Text style={[styles.toggleLabel, { color: accentColor }]}>
          {heading}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={accentColor}
          style={{ marginLeft: "auto" }}
        />
      </Pressable>

      {/* Expanded content */}
      {open && (
        <View style={styles.content}>
          {/* How-it-works cards */}
          {items.map((item, i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: "rgba(74,12,12,0.08)", borderColor: "transparent" }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: accentColor + "22" }]}>
                <Feather name={item.icon} size={18} color={accentColor} />
              </View>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>{item.body}</Text>
              </View>
            </View>
          ))}

          {/* Quote */}
          <View style={[styles.quoteBlock, { borderLeftColor: accentColor }]}>
            <Text style={[styles.quoteText, { color: colors.foreground }]}>
              "{quote}"
            </Text>
          </View>

          {/* Why items */}
          {whyItems.map((item, i) => (
            <View key={i} style={styles.whyRow}>
              <Feather name={item.icon} size={14} color={accentColor} style={{ marginTop: 2, marginRight: 10 }} />
              <Text style={[styles.whyText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 32,
    marginBottom: 24,
    borderTopWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  content: {
    marginTop: 16,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 8,
    marginVertical: 4,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  whyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  whyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});

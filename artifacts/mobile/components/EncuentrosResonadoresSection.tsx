import React, { useRef, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from "react-native";
import { router } from "expo-router";

import { CalendarioEncuentroSheet } from "@/components/CalendarioEncuentroSheet";
import { EncuentroCard } from "@/components/EncuentroCard";
import { ENCUENTROS, type Encuentro } from "@/data/encuentros";

const HORIZONTAL_PAD = 20;
const CARD_GAP = 12;

type Props = {
  marginTop?: number;
  marginBottom?: number;
  titleMarginTop?: number;
};

export function EncuentrosResonadoresSection({
  marginTop = 0,
  marginBottom = 35,
  titleMarginTop = 25,
}: Props) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [calendarEncounter, setCalendarEncounter] = useState<Encuentro | null>(null);
  const cardWidth = Math.max(0, width - HORIZONTAL_PAD * 2);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <View style={[styles.root, { marginTop, marginBottom }]}>
      <Text style={[styles.title, { marginTop: titleMarginTop }]}>
        Encuentros Resonadores
      </Text>

      <FlatList
        data={ENCUENTROS}
        keyExtractor={(item) => item.id}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <EncuentroCard
              encuentro={item}
              onPress={() => router.push(`/encuentro/${item.id}` as never)}
              onCalendarPress={() => setCalendarEncounter(item)}
            />
          </View>
        )}
      />

      <View style={styles.dots}>
        {ENCUENTROS.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex ? styles.dotActive : styles.dotInactive]}
          />
        ))}
      </View>

      <CalendarioEncuentroSheet
        encuentro={calendarEncounter}
        visible={calendarEncounter !== null}
        onClose={() => setCalendarEncounter(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#F4F4F4",
    paddingHorizontal: HORIZONTAL_PAD,
  },
  carouselContent: {
    paddingHorizontal: HORIZONTAL_PAD,
    gap: CARD_GAP,
    paddingTop: 16,
  },
  dots: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    height: 6,
    backgroundColor: "#f9f9f9",
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(244,244,244,0.35)",
  },
});
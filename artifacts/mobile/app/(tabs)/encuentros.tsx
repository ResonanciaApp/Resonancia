import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { EncuentroCard } from "@/components/EncuentroCard";
import { ENCUENTROS, type Encuentro } from "@/data/encuentros";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H_PADDING = 20;
const CARD_GAP = 12;
const CARD_W = SCREEN_W - CARD_H_PADDING * 2;
const PILL_H = 68;

export default function EncuentrosScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = PILL_H + Math.max(8, insets.bottom - 10);
  const [activeIndex, setActiveIndex] = useState(0);
  const { theme: activeTheme } = useSceneTheme();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  function handleCardPress(_enc: Encuentro) {
    // TODO: navegar a detalle del encuentro
  }

  function handleCalendarPress(_enc: Encuentro) {
    // TODO: abrir modal de calendario
  }

  return (
    <View style={[styles.root, { backgroundColor: activeTheme.gradient[0] as string, paddingTop: insets.top }]}>
      <LinearGradient colors={activeTheme.gradient} style={StyleSheet.absoluteFill} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Encuentros</Text>
      </View>

      {/* Carrusel */}
      <FlatList
        data={ENCUENTROS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={[
          styles.carouselContent,
          { paddingBottom: tabBarHeight + 24 },
        ]}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={[styles.cardWrap, { width: CARD_W }]}>
            <EncuentroCard
              encuentro={item}
              onPress={() => handleCardPress(item)}
              onCalendarPress={() => handleCalendarPress(item)}
            />
          </View>
        )}
      />

      {/* Puntos de paginación */}
      <View style={[styles.dots, { bottom: tabBarHeight + 8 }]}>
        {ENCUENTROS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: CARD_H_PADDING,
    paddingTop: 19,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: -9,
  },
  headerSub: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(244,218,213,0.6)",
    marginTop: 4,
    textAlign: "center",
  },
  carouselContent: {
    paddingHorizontal: CARD_H_PADDING,
    gap: CARD_GAP,
    paddingTop: 40,
  },
  cardWrap: {
    // width set inline
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
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
    backgroundColor: "#F7CB6B",
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(244,244,244,0.35)",
  },
});

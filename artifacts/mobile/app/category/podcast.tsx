import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { Image } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { PremiumBadge } from "@/components/PremiumBadge";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session, type SonidosTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GAP = 10;
const COLS = 3;
const SCREEN_W = Dimensions.get("window").width;
const CARD_WIDTH = ((SCREEN_W - H_PAD * 2 - GAP * (COLS - 1)) / COLS) * 0.85 + 12;
const SONIDOS_ACCENT = "#6B9AB5";

type SonidosTab = SonidosTag;

const TABS: { label: string; value: SonidosTab }[] = [
  { label: "Binaurales",   value: "Sonidos Binaurales"    },
  { label: "Naturaleza",   value: "Sonidos Naturaleza"    },
  { label: "Atmosféricos", value: "Sonidos Atmosféricos"  },
];

const SONIDOS_SESSIONS = SESSIONS.filter((s) => s.categoryId === "podcast");

export default function SonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<SonidosTab>("Sonidos Binaurales");
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  // Tab indicator animation
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);

  const onTabLayout = (idx: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[idx] = { x, width };
    if (idx === 0 && indicatorWidth === 0) {
      setIndicatorWidth(width);
      indicatorAnim.setValue(x);
    }
  };

  const selectTab = (value: SonidosTab, idx: number) => {
    setActiveTab(value);
    const layout = tabLayouts.current[idx];
    if (layout) {
      setIndicatorWidth(layout.width);
      Animated.spring(indicatorAnim, {
        toValue: layout.x,
        tension: 200,
        friction: 24,
        useNativeDriver: true,
      }).start();
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(
    () => SONIDOS_SESSIONS.filter((s) => s.sonidosTag === activeTab),
    [activeTab],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.iconCircle}>
            <Image
              source={require("../../assets/images/cat-sonidos.png")}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Sonidos</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Frecuencias, naturaleza y atmósferas para transformar tu estado
          </Text>
        </View>

        {/* Sticky tab bar */}
        <View style={[styles.tabBarWrap, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.tabBar,
              { borderBottomColor: "rgba(255,255,255,0.08)", paddingHorizontal: H_PAD },
            ]}
          >
            {TABS.map(({ label, value }, idx) => (
              <Pressable
                key={value}
                onPress={() => selectTab(value, idx)}
                onLayout={(e) => onTabLayout(idx, e)}
                style={styles.tabItem}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color:
                        activeTab === value
                          ? colors.foreground
                          : colors.mutedForeground,
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}

            {indicatorWidth > 0 && (
              <Animated.View
                style={[
                  styles.tabIndicator,
                  { width: indicatorWidth, transform: [{ translateX: indicatorAnim }] },
                ]}
              />
            )}
          </View>
        </View>

        {/* Session grid */}
        <View style={[styles.grid, { paddingHorizontal: H_PAD, paddingTop: 24 }]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name="waveform"
                size={32}
                color={colors.mutedForeground}
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Próximamente
              </Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {filtered.map((session) => {
                const locked = !!session.isPremium && !isPremium;
                return (
                  <Pressable
                    key={session.id}
                    style={({ pressed }) => [
                      styles.card,
                      { width: CARD_WIDTH, opacity: pressed ? 0.82 : 1 },
                    ]}
                    onPress={() =>
                      router.push((locked ? "/membresia" : `/session/${session.id}`) as never)
                    }
                    onLongPress={() => setActionsSession(session)}
                  >
                    <View
                      style={{
                        width: CARD_WIDTH,
                        height: CARD_WIDTH,
                        borderRadius: 16,
                        overflow: "hidden",
                      }}
                    >
                      <ExpoImage
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        source={session.image as any}
                        style={{ width: CARD_WIDTH, height: CARD_WIDTH }}
                        contentFit="cover"
                        transition={IMAGE_TRANSITION}
                        cachePolicy="memory-disk"
                        placeholder={BLUR_PLACEHOLDER}
                      />
                      <PremiumBadge session={session} />
                    </View>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={!!actionsSession}
        onClose={() => setActionsSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  tabBarWrap: {
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
    paddingBottom: 0,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    backgroundColor: SONIDOS_ACCENT,
    borderRadius: 1,
  },

  grid: {},
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GAP,
    rowGap: 24,
    justifyContent: "space-between",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

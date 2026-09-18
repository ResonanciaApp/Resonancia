import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useInspiration } from "@/hooks/inspiration";
import { useInspirationReducedMotion } from "@/components/InspirationFade";
import { InspirationArtwork } from "@/components/InspirationArtwork";
import { InspirationShare } from "@/components/InspirationShare";
import { useColors } from "@/hooks/useColors";
import type { InspirationDay } from "@/types/inspiration";
import { addDays, formatDayNumber, formatISODate, parseISO } from "@/lib/date-utils";
import { settledInspirationIndex } from "@/lib/inspiration-interaction";

function monthAndYear(date: string): string {
  return new Intl.DateTimeFormat("es", { month: "short", year: "numeric" })
    .format(parseISO(date))
    .replace(".", "");
}

function SelectionDot({ date, selected, reduced }: { date: string; selected: boolean; reduced: boolean }) {
  const opacity = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    opacity.stopAnimation();
    if (reduced) {
      opacity.setValue(selected ? 1 : 0);
      return;
    }
    Animated.timing(opacity, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduced, selected]);
  return <Animated.View testID={`inspiration-dot-${date}`} pointerEvents="none" style={[styles.selectionDot, { opacity }]} />;
}

export default function InspiracionDiariaIndex() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useInspirationReducedMotion();
  const current = useInspiration();
  const previousAnchor = formatISODate(addDays(parseISO(current.today), -7));
  const previous = useInspiration({ date: previousAnchor, timezone: current.timezone });
  const days = useMemo(() => {
    const byDate = new Map<string, InspirationDay>();
    for (const day of [...previous.days, ...current.days]) {
      if (day.date <= current.today) byDate.set(day.date, day);
    }
    return [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [current.days, current.today, previous.days]);
  const [selected, setSelected] = useState(current.today);
  const [displayedDate, setDisplayedDate] = useState(current.today);
  const [moving, setMoving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const activeIndex = Math.max(0, days.findIndex((day) => day.date === selected));
  const activeDay = days[activeIndex];
  const displayedDay = days.find((day) => day.date === displayedDate) ?? activeDay;
  const selectedRef = useRef(selected);
  const desiredDisplay = useRef(displayedDate);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const slider = useRef<FlatList<InspirationDay>>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);
  const offset = useRef(activeIndex * width);
  const pendingTarget = useRef<number | null>(null);
  const loading = (current.loading || previous.loading) && !days.some((day) => day.status === "available");
  const error = current.error || previous.error;
  const topInset = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);

  const cancelSettle = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const revealContent = useCallback((date: string) => {
    desiredDisplay.current = date;
    setDisplayedDate(date);
    contentOpacity.stopAnimation();
    if (reduced) {
      contentOpacity.setValue(1);
      return;
    }
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity, reduced]);

  const fadeToContent = useCallback((date: string) => {
    desiredDisplay.current = date;
    contentOpacity.stopAnimation();
    if (reduced) {
      revealContent(date);
      return;
    }
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && desiredDisplay.current === date) revealContent(date);
    });
  }, [contentOpacity, reduced, revealContent]);

  const hideContent = useCallback(() => {
    contentOpacity.stopAnimation();
    if (reduced) {
      contentOpacity.setValue(0);
      return;
    }
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [contentOpacity, reduced]);

  useEffect(() => () => cancelSettle(), [cancelSettle]);
  useEffect(() => {
    cancelSettle();
    pendingTarget.current = null;
    dragging.current = false;
    const currentIndex = Math.max(0, days.findIndex((day) => day.date === selectedRef.current));
    offset.current = currentIndex * width;
    slider.current?.scrollToOffset({ offset: offset.current, animated: false });
    setMoving(false);
  }, [cancelSettle, width]);

  const commit = useCallback(() => {
    cancelSettle();
    const index = settledInspirationIndex(offset.current, width, days.length);
    if (index === null) return;
    if (pendingTarget.current !== null && pendingTarget.current !== index) return;
    pendingTarget.current = null;
    const date = days[index]?.date;
    setMoving(false);
    if (date) {
      if (date !== selectedRef.current) {
        selectedRef.current = date;
        setSelected(date);
      }
      revealContent(date);
    }
  }, [cancelSettle, days, revealContent, width]);

  const scheduleSettle = useCallback(() => {
    cancelSettle();
    settleTimer.current = setTimeout(() => {
      if (!dragging.current) commit();
    }, 180);
  }, [cancelSettle, commit]);

  const chooseDay = (index: number) => {
    cancelSettle();
    pendingTarget.current = index;
    const date = days[index]?.date;
    if (date && date !== selectedRef.current) {
      selectedRef.current = date;
      setSelected(date);
      fadeToContent(date);
    } else if (date) {
      revealContent(date);
    }
    setMoving(false);
    slider.current?.scrollToOffset({ offset: index * width, animated: !reduced });
    if (reduced || Math.abs(offset.current - index * width) <= 1) {
      offset.current = index * width;
      commit();
    }
  };

  const openDetail = (day: InspirationDay | undefined) => {
    if (moving || day?.status !== "available" || !day.id) return;
    router.push({ pathname: "/inspiracion-diaria/[date]", params: { date: day.date, id: day.id } });
  };

  const retry = async () => {
    await Promise.all([current.retry(), previous.retry()]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.foreground }}>Cargando inspiración…</Text>
        </View>
      ) : (
        <FlatList
          ref={slider}
          style={StyleSheet.absoluteFillObject}
          data={days}
          horizontal
          pagingEnabled
          initialScrollIndex={Math.max(0, days.length - 1)}
          keyExtractor={(day) => day.date}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          showsHorizontalScrollIndicator={false}
          extraData={`${selected}-${width}-${height}-${moving}`}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            offset.current = event.nativeEvent.contentOffset.x;
            if (!dragging.current) scheduleSettle();
          }}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            cancelSettle();
            dragging.current = true;
            pendingTarget.current = null;
            setMoving(true);
            hideContent();
          }}
          onScrollEndDrag={() => {
            dragging.current = false;
            scheduleSettle();
          }}
          onMomentumScrollBegin={cancelSettle}
          onMomentumScrollEnd={(event) => {
            offset.current = event.nativeEvent.contentOffset.x;
            commit();
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width, height }]}>
              {item.status === "available" && item.content && (
                <InspirationArtwork
                  key={`${item.content.imageUrl}-${item.content.overlayOpacity}`}
                  content={item.content}
                />
              )}
            </View>
          )}
        />
      )}

      <View style={[styles.overlay, { paddingTop: topInset - 2 }]} pointerEvents="box-none">
        <View style={styles.header}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/inicio8"))}
            style={styles.circleButton}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Feather name="chevron-left" size={27} color="#fff" />
          </Pressable>
          <Text style={styles.title}>{current.week?.settings.sectionTitle || "Inspiración diaria"}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.days}>
          {days.map((day, index) => (
            <Pressable
              key={day.date}
              onPress={() => chooseDay(index)}
              style={styles.dayCard}
              accessibilityRole="button"
              accessibilityState={{ selected: day.date === selected }}
              accessibilityLabel={`${day.date === current.today ? "Hoy, " : ""}${formatDayNumber(day.date)} ${monthAndYear(day.date)}, ${day.status === "available" ? "disponible" : "no disponible"}`}
            >
              {day.status === "available" && day.content ? (
                <Image
                  source={{ uri: day.content.imageUrl }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition={{ left: `${day.content.imagePositionX}%`, top: `${day.content.imagePositionY}%` }}
                />
              ) : (
                <View style={[StyleSheet.absoluteFillObject, styles.emptyCard]} />
              )}
              {day.status === "available" && day.content && (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: `rgba(0,0,0,${day.content.overlayOpacity * 0.35})` },
                  ]}
                />
              )}
              <View style={styles.cardShade} />
              <Text style={styles.cardNumber}>{formatDayNumber(day.date)}</Text>
              <SelectionDot date={day.date} selected={day.date === selected} reduced={reduced} />
            </Pressable>
          ))}
        </View>

        <Animated.View
          testID={`inspiration-content-${displayedDay?.date ?? "empty"}`}
          pointerEvents="box-none"
          style={[
            styles.pageContent,
            {
              paddingTop: topInset + 180,
              paddingBottom: Math.max(insets.bottom, 18) + 38,
              opacity: contentOpacity,
            },
          ]}
        >
          {displayedDay?.status === "available" && displayedDay.content ? (
            <View style={styles.message}>
              <View>
                <Text style={styles.dayNumber}>{formatDayNumber(displayedDay.date)}</Text>
                <Text style={styles.month}>{monthAndYear(displayedDay.date)}</Text>
              </View>
              <View style={styles.quoteBlock}>
                <Text
                  style={[
                    styles.quote,
                    Platform.OS === "web" && ({ overflowWrap: "anywhere", wordBreak: "break-word" } as never),
                  ]}
                >
                  {displayedDay.content.quote}
                </Text>
                {!!displayedDay.content.author && <Text style={styles.author}>— {displayedDay.content.author}</Text>}
              </View>
              <View>
                <Pressable
                  disabled={moving || displayedDay.date !== selected}
                  onPress={() => openDetail(displayedDay)}
                  style={styles.read}
                >
                  <Text style={styles.readText}>{current.week?.settings.readMoreLabel || "Leer más"}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.unavailableContent}>
              <Feather name="calendar" size={36} color="rgba(255,255,255,.72)" />
              <Text style={styles.unavailable}>No disponible</Text>
              {!!displayedDay && <Text style={styles.unavailableDate}>{formatDayNumber(displayedDay.date)} {monthAndYear(displayedDay.date)}</Text>}
            </View>
          )}
        </Animated.View>

        <View style={[styles.bottomActions, { bottom: Math.max(insets.bottom, 18) + 18 }]} pointerEvents="box-none">
          <Pressable
            onPress={() => openDetail(activeDay)}
            disabled={activeDay?.status !== "available"}
            style={[styles.actionButton, activeDay?.status !== "available" && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Editar notas"
          >
            <Feather name="edit-3" size={21} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => setSharing(true)}
            disabled={activeDay?.status !== "available"}
            style={[styles.actionButton, activeDay?.status !== "available" && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Compartir inspiración"
          >
            <Feather name="share" size={21} color="#fff" />
          </Pressable>
        </View>

        {!!error && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{error}</Text>
            <Pressable onPress={() => void retry()}>
              <Text style={styles.retry}>Reintentar</Text>
            </Pressable>
          </View>
        )}
      </View>

      {sharing && activeDay?.status === "available" && activeDay.content && (
        <InspirationShare day={activeDay} onClose={() => setSharing(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  slide: { backgroundColor: "#191919" },
  pageContent: { ...StyleSheet.absoluteFillObject, justifyContent: "center", paddingHorizontal: 28 },
  message: { width: "100%", alignItems: "center", transform: [{ translateY: -8 }] },
  unavailableContent: { alignItems: "center", justifyContent: "center", gap: 12, transform: [{ translateY: -8 }] },
  quoteBlock: { width: "100%", alignItems: "center" },
  dayNumber: { color: "#fff", textAlign: "center", fontFamily: "Manrope", fontSize: 35, lineHeight: 40, fontWeight: "500" },
  month: { color: "rgba(255,255,255,.9)", textAlign: "center", fontFamily: "Manrope", fontSize: 16, marginTop: 2 },
  quote: { width: "100%", flexShrink: 1, color: "#fff", textAlign: "center", fontFamily: "Manrope", fontSize: 25, lineHeight: 34, fontWeight: "500", marginTop: 34 },
  author: { color: "rgba(255,255,255,.82)", textAlign: "center", fontFamily: "Manrope", fontSize: 14, fontStyle: "italic", marginTop: 12 },
  read: {
    alignSelf: "center",
    marginTop: 28,
    paddingVertical: 9,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.18)",
    backgroundColor: "rgba(255,255,255,.14)",
  },
  readText: { color: "#fff", fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
  overlay: { ...StyleSheet.absoluteFillObject },
  header: { height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 18 },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "rgba(10,12,18,.22)",
  },
  title: { flex: 1, color: "#fff", textAlign: "center", fontFamily: "Manrope", fontSize: 17, fontWeight: "600" },
  headerSpacer: { width: 48 },
  days: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, marginTop: 12 },
  dayCard: {
    width: 31,
    height: 47,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: "rgba(10,12,18,.35)",
  },
  emptyCard: { backgroundColor: "rgba(16,19,27,.68)" },
  cardShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,.08)" },
  cardNumber: {
    position: "absolute",
    top: 5,
    alignSelf: "center",
    color: "#fff",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,.8)",
    textShadowRadius: 4,
  },
  selectionDot: { position: "absolute", bottom: 5, alignSelf: "center", width: 6, height: 6, borderRadius: 3, backgroundColor: "#74E1B7" },
  bottomActions: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 18 },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "rgba(255,255,255,.12)",
  },
  disabled: { opacity: 0.38 },
  notice: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 94,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    padding: 9,
    borderRadius: 12,
    backgroundColor: "rgba(4,8,13,.7)",
  },
  noticeText: { color: "rgba(255,255,255,.82)", fontFamily: "Manrope", fontSize: 12 },
  retry: { color: "#fff", fontFamily: "Manrope", fontSize: 12, fontWeight: "700" },
  unavailable: { color: "#fff", fontFamily: "Manrope", fontSize: 20 },
  unavailableDate: { color: "rgba(255,255,255,.7)", fontFamily: "Manrope", fontSize: 14 },
});
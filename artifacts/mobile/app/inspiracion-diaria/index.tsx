import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView, useWindowDimensions, ActivityIndicator, NativeSyntheticEvent, NativeScrollEvent, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useInspiration } from "@/hooks/inspiration";
import { InspirationFade, useInspirationReducedMotion } from "@/components/InspirationFade";
import { InspirationArtwork } from "@/components/InspirationArtwork";
import { useColors } from "@/hooks/useColors";
import type { InspirationDay } from "@/types/inspiration";
import { formatShortDate, formatDayNumber, formatDayLetter, parseISO, addDays, formatISODate } from "@/lib/date-utils";
import { initialInspirationDate, settledInspirationIndex, commitInspirationDate } from "@/lib/inspiration-interaction";

function WeekPager({ initialDate, requestedWeek }: { initialDate?: string; requestedWeek?: string }) {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [pageHeight, setPageHeight] = useState(height);
  const [headerHeight, setHeaderHeight] = useState(200);
  const reduced = useInspirationReducedMotion();
  const pinnedWeek = useRef(requestedWeek);
  const { days, today, loading, error, week, weekStart, isCached, retry } = useInspiration({ date: initialDate, weekStart: pinnedWeek.current });
  // Midnight refreshes availability, not the week the reader is exploring.
  if (!pinnedWeek.current) pinnedWeek.current = weekStart;
  // Mount per explicit entry/week, never reinitialize on a refreshed days array.
  const [selected, setSelected] = useState(() => {
    return initialInspirationDate(days.map(d => d.date), initialDate, today);
  });
  const [entrance, setEntrance] = useState(0);
  const activeIndex = Math.max(0, days.findIndex(d => d.date === selected));
  const selectedRef = useRef(selected);
  const slider = useRef<FlatList<InspirationDay>>(null);
  const thumbnails = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragging = useRef(false);
  const offset = useRef(activeIndex * width);
  const pendingTarget = useRef<number | null>(null);
  const [moving, setMoving] = useState(false);
  const cancelSettle = () => { if (settleTimer.current) clearTimeout(settleTimer.current); };
  useEffect(() => () => cancelSettle(), []);
  useEffect(() => {
    cancelSettle();
    pendingTarget.current = null;
    dragging.current = false;
    offset.current = activeIndex * width;
    slider.current?.scrollToOffset({ offset: offset.current, animated: false });
    setMoving(false);
  }, [width]);
  useEffect(() => {
    thumbnails.current?.scrollTo({ x: Math.max(0, activeIndex * 56 - (width - 96) / 2 + 28), animated: !reduced });
  }, [activeIndex, width, reduced]);
  const commit = useCallback(() => {
    cancelSettle();
    const index = settledInspirationIndex(offset.current, width, days.length);
    if (index === null) return;
    if (pendingTarget.current !== null && pendingTarget.current !== index) return;
    pendingTarget.current = null;
    const date = days[index]?.date;
    setMoving(false);
    if (date && date !== selectedRef.current) {
      const previous = selectedRef.current;
      selectedRef.current = date;
      setSelected(date);
      setEntrance(value => commitInspirationDate(previous, date, value).entrance);
    }
  }, [days, width]);
  const scheduleSettle = () => {
    cancelSettle();
    settleTimer.current = setTimeout(() => { if (!dragging.current) commit(); }, 180);
  };
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.x;
    if (!dragging.current) scheduleSettle();
  };
  const chooseDay = (index: number) => {
    cancelSettle();
    pendingTarget.current = index;
    setMoving(true);
    slider.current?.scrollToOffset({ offset: index * width, animated: !reduced });
    if (reduced || Math.abs(offset.current - index * width) <= 1) { offset.current = index * width; commit(); }
  };
  const openWeek = (amount: number) => {
    const date = formatISODate(addDays(parseISO(weekStart), amount * 7));
    router.setParams({ date, weekStart: date, entry: undefined });
  };
  const close = () => router.canGoBack() ? router.back() : router.replace("/(tabs)/inicio8");
  return <View onLayout={event => setPageHeight(event.nativeEvent.layout.height)} style={[styles.container, { backgroundColor: colors.background }]}>
    <View onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, paddingTop: (Platform.OS === "web" ? 67 : Math.max(insets.top, 40)) + 8, backgroundColor: "rgba(10,16,19,.65)" }}>
      <View style={styles.topRow}>
        <Pressable onPress={close} style={styles.icon} accessibilityLabel="Cerrar"><Feather name="x" size={24} color="#fff" /></Pressable>
        <Text style={styles.title} numberOfLines={2}>{week?.settings.sectionTitle || "Inspiración diaria"}</Text>
        <Pressable onPress={() => router.push("/inspiracion-diaria/notas")} style={styles.icon} accessibilityLabel="Mis notas"><Feather name="edit-3" size={21} color="#fff" /></Pressable>
      </View>
      <View style={styles.weekRow}>
        <Pressable onPress={() => openWeek(-1)} style={styles.nav} testID="week-prev-btn" accessibilityLabel="Semana anterior"><Feather name="chevron-left" size={22} color="#fff" /></Pressable>
        <ScrollView ref={thumbnails} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }} style={{ flex: 1 }}>
          {days.map((day, index) => <Pressable key={day.date} onPress={() => chooseDay(index)} style={styles.day}
            accessibilityRole="button" accessibilityState={{ selected: day.date === selected }}
            accessibilityLabel={`${formatShortDate(day.date)}${day.date === today ? ", hoy" : ""}, ${day.status === "available" ? "disponible" : day.status === "future" ? "futuro bloqueado" : "no disponible"}`}>
            <View style={[styles.thumb, { borderColor: day.date === selected ? "#d2b77c" : "rgba(255,255,255,.2)", borderWidth: day.date === selected ? 2 : 1 }]}>
              {day.status === "available" && day.content ? <Image source={{ uri: day.content.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover"
                contentPosition={{ left: `${day.content.imagePositionX}%`, top: `${day.content.imagePositionY}%` }} /> :
                <Feather name={day.status === "future" ? "lock" : "calendar"} size={16} color="#aaa" />}
              {day.date === today && <View style={styles.todayDot} />}
            </View>
            <Text style={{ color: day.date === selected ? "#e8d4a8" : "#ddd", fontSize: 12 }}>{formatDayLetter(day.date)} {formatDayNumber(day.date)}</Text>
          </Pressable>)}
        </ScrollView>
        <Pressable onPress={() => openWeek(1)} style={styles.nav} testID="week-next-btn" accessibilityLabel="Semana siguiente"><Feather name="chevron-right" size={22} color="#fff" /></Pressable>
      </View>
      <Pressable onPress={() => router.setParams({ date: today, weekStart: undefined, entry: undefined })} style={{ alignSelf: "center", padding: 8 }}><Text style={{ color: "#ddd", fontSize: 12 }}>Volver a hoy</Text></Pressable>
    {(error || isCached) && <View style={{ padding: 10, backgroundColor: colors.card }}>
      <Text style={{ color: colors.foreground }}>{error || "Mostrando copia guardada; actualizando…"}</Text>
      {error && <Pressable onPress={() => void retry()}><Text style={{ color: colors.primary, paddingTop: 6 }}>Reintentar</Text></Pressable>}
    </View>}
    </View>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.foreground }}>Cargando inspiración…</Text></View> :
      <FlatList ref={slider} style={StyleSheet.absoluteFillObject} data={days} horizontal pagingEnabled initialScrollIndex={activeIndex} keyExtractor={d => d.date}
        showsHorizontalScrollIndicator={false} getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        extraData={`${selected}-${entrance}-${width}-${moving}`} onScroll={onScroll} scrollEventThrottle={16}
        onScrollBeginDrag={() => { cancelSettle(); dragging.current = true; pendingTarget.current = null; setMoving(true); }}
        onScrollEndDrag={() => { dragging.current = false; scheduleSettle(); }}
        onMomentumScrollBegin={cancelSettle} onMomentumScrollEnd={event => { offset.current = event.nativeEvent.contentOffset.x; commit(); }}
        renderItem={({ item }) => <View style={{ width, height: pageHeight }}>
          {item.status === "available" && item.content ? <>
            <InspirationArtwork key={item.content.imageUrl} content={item.content} />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", padding: 24, paddingTop: headerHeight + 24, paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 0) + 28 }}>
              <InspirationFade animate={item.date === selected} replayKey={`${item.date}-${entrance}`} delay={0}>
                <Text style={styles.date}>{formatShortDate(item.date).toUpperCase()}</Text>
              </InspirationFade>
              <InspirationFade animate={item.date === selected} replayKey={`${item.date}-${entrance}`} delay={100}>
                <Text style={styles.quote}>{item.content.quote}</Text>
                {!!item.content.author && <Text style={styles.author}>— {item.content.author}</Text>}
              </InspirationFade>
              <InspirationFade animate={item.date === selected} replayKey={`${item.date}-${entrance}`} delay={200}>
                <Pressable disabled={moving || item.date !== selected} onPress={() => router.push({ pathname: "/inspiracion-diaria/[date]", params: { date: item.date, id: item.id! } })} style={styles.read}>
                  <Text style={{ color: "#fff", fontWeight: "600" }}>{week?.settings.readMoreLabel || "Leer más"}</Text><Feather name="arrow-right" size={16} color="#fff" />
                </Pressable>
              </InspirationFade>
            </ScrollView>
          </> : <View style={[styles.center, { paddingTop: headerHeight + 24 }]}><Feather name={item.status === "future" ? "lock" : "calendar"} size={40} color={colors.mutedForeground} />
            <Text style={{ color: colors.foreground, fontSize: 20, marginTop: 16 }}>{item.status === "future" ? "Disponible pronto" : error ? "No se pudo consultar este día" : "No disponible"}</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>{formatShortDate(item.date)}</Text></View>}
        </View>} />}
  </View>;
}

export default function InspiracionDiariaIndex() {
  const params = useLocalSearchParams<{ date?: string; weekStart?: string; entry?: string }>();
  return <WeekPager key={`${params.entry || ""}-${params.date || ""}-${params.weekStart || ""}`} initialDate={params.entry === "today" ? undefined : params.date} requestedWeek={params.entry === "today" ? undefined : params.weekStart} />;
}
const styles = StyleSheet.create({
  container: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
  title: { flex: 1, textAlign: "center", color: "#fff", fontFamily: "Manrope", fontSize: 16, fontWeight: "600" },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  weekRow: { flexDirection: "row", alignItems: "center" }, nav: { width: 40, height: 64, alignItems: "center", justifyContent: "center" },
  day: { width: 56, alignItems: "center", gap: 5 }, thumb: { width: 42, height: 52, borderRadius: 8, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  todayDot: { position: "absolute", bottom: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  date: { color: "#eee", fontSize: 12, letterSpacing: 1.2, marginBottom: 12, fontFamily: "Manrope" },
  quote: { color: "#fff", fontSize: 28, lineHeight: 38, fontFamily: "Manrope", fontWeight: "500" },
  author: { color: "#eee", fontSize: 16, marginTop: 12, fontStyle: "italic" },
  read: { alignSelf: "flex-start", flexDirection: "row", gap: 10, padding: 14, paddingHorizontal: 22, borderRadius: 28, marginTop: 28, backgroundColor: "rgba(255,255,255,.18)" },
});
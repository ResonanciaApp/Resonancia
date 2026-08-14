/**
 * QuickAccessGrid — grilla 3×2 de accesos rápidos con drag-to-reorder.
 */
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoldGradient } from "@/components/GoldGradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const ALL_ITEMS: { id: string; label: string; icon: FeatherIconName; route: string }[] = [
  { id: "mezclas",   label: "Mis mezclas",   icon: "sliders",        route: "/mezclas"              },
  { id: "geometrix", label: "Mis Geometrix", icon: "triangle",       route: "/geometrix-creaciones" },
  { id: "grupos",    label: "Grupos",        icon: "users",          route: "/grupos"               },
  { id: "carpetas",  label: "Carpetas",      icon: "folder",         route: "/carpetas"             },
  { id: "playlists", label: "Playlists",      icon: "list",           route: "/playlists"            },
  { id: "chats",     label: "Chats",         icon: "message-circle", route: "/amigos"               },
];

const ORDER_KEY = "@resonance_quick_order";
const COLS      = 3;
const GAP       = 8;
const H_PAD     = 20;
const BLOCK_H   = 90;

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const r = [...arr];
  const [item] = r.splice(from, 1);
  r.splice(to, 0, item);
  return r;
}

type Props = {
  onDragStart?: () => void;
  onDragEnd?:   () => void;
};

export function QuickAccessGrid({ onDragStart, onDragEnd }: Props) {
  const colors  = useColors();
  const { width: screenW } = useWindowDimensions();
  const blockW  = (screenW - H_PAD * 2 - GAP * 2) / COLS;

  /* ── order state ─────────────────────────────────── */
  const [items, setItems] = useState(ALL_ITEMS);

  useEffect(() => {
    AsyncStorage.getItem(ORDER_KEY).then((raw) => {
      if (!raw) return;
      try {
        const ids: string[] = JSON.parse(raw);
        const sorted = ids
          .map((id) => ALL_ITEMS.find((i) => i.id === id))
          .filter(Boolean) as typeof ALL_ITEMS;
        ALL_ITEMS.forEach((item) => {
          if (!sorted.find((s) => s.id === item.id)) sorted.push(item);
        });
        setItems(sorted);
      } catch {}
    });
  }, []);

  const saveOrder = useCallback((next: typeof ALL_ITEMS) => {
    AsyncStorage.setItem(ORDER_KEY, JSON.stringify(next.map((i) => i.id))).catch(() => {});
  }, []);

  /* ── drag state ──────────────────────────────────── */
  const draggingIdxRef  = useRef<number | null>(null);
  const hoverIdxRef     = useRef<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoverIdx,    setHoverIdx]    = useState<number | null>(null);

  const insertLine = React.useMemo(() => {
    if (draggingIdx === null || hoverIdx === null || draggingIdx === hoverIdx) return null;
    const col = hoverIdx % COLS;
    const row = Math.floor(hoverIdx / COLS);
    const insertBefore = draggingIdx > hoverIdx;
    const x = insertBefore
      ? col * (blockW + GAP) - GAP / 2 - 1
      : col * (blockW + GAP) + blockW + GAP / 2 - 1;
    const y = row * (BLOCK_H + GAP);
    return { x, y };
  }, [draggingIdx, hoverIdx, blockW]);

  const dragAnim    = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const ghostInitX  = useRef(0);
  const ghostInitY  = useRef(0);
  const gridRef     = useRef<View>(null);
  const gridOrigin  = useRef({ x: 0, y: 0 });

  const getCellIdx = useCallback(
    (moveX: number, moveY: number): number => {
      const relX = moveX - gridOrigin.current.x;
      const relY = moveY - gridOrigin.current.y;
      const col  = Math.max(0, Math.min(COLS - 1, Math.floor(relX / (blockW + GAP))));
      const row  = Math.max(0, Math.min(1,        Math.floor(relY / (BLOCK_H + GAP))));
      return Math.min(row * COLS + col, items.length - 1);
    },
    [blockW, items.length],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => draggingIdxRef.current !== null,
      onMoveShouldSetPanResponder:  () => draggingIdxRef.current !== null,
      onPanResponderMove: (_, g) => {
        if (draggingIdxRef.current === null) return;
        dragAnim.setValue({ x: g.dx, y: g.dy });
        const idx = getCellIdx(g.moveX, g.moveY);
        if (idx !== hoverIdxRef.current) {
          hoverIdxRef.current = idx;
          setHoverIdx(idx);
        }
      },
      onPanResponderRelease: (_, g) => {
        const from = draggingIdxRef.current;
        const to   = getCellIdx(g.moveX, g.moveY);
        draggingIdxRef.current = null;
        hoverIdxRef.current    = null;
        setDraggingIdx(null);
        setHoverIdx(null);
        onDragEnd?.();
        if (from !== null && to !== null && from !== to) {
          setItems((prev) => {
            const next = reorder(prev, from, to);
            saveOrder(next);
            return next;
          });
        }
      },
      onPanResponderTerminate: () => {
        draggingIdxRef.current = null;
        hoverIdxRef.current    = null;
        setDraggingIdx(null);
        setHoverIdx(null);
        onDragEnd?.();
      },
    }),
  ).current;

  const startDrag = useCallback(
    (idx: number) => {
      gridRef.current?.measure((_fx, _fy, _w, _h, pageX, pageY) => {
        gridOrigin.current = { x: pageX, y: pageY };
        const col = idx % COLS;
        const row = Math.floor(idx / COLS);
        ghostInitX.current = col * (blockW + GAP);
        ghostInitY.current = row * (BLOCK_H + GAP);
        dragAnim.setValue({ x: 0, y: 0 });
        draggingIdxRef.current = idx;
        setDraggingIdx(idx);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onDragStart?.();
      });
    },
    [blockW, dragAnim, onDragStart],
  );

  const draggingItem = draggingIdx !== null ? items[draggingIdx] : null;

  return (
    <View ref={gridRef} style={styles.grid} {...panResponder.panHandlers}>
      {items.map((item, idx) => {
        const isDragging = idx === draggingIdx;
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              if (draggingIdxRef.current !== null) return;
              router.push(item.route as never);
            }}
            onLongPress={() => startDrag(idx)}
            delayLongPress={350}
            style={[
              styles.block,
              { width: blockW },
              isDragging && styles.blockDragging,
            ]}
          >
            <Feather name={item.icon} size={22} color={colors.mutedForeground} />
            <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}

      {/* Línea de inserción */}
      {insertLine && (
        <GoldGradient
          pointerEvents="none"
          style={[styles.insertLine, { left: insertLine.x, top: insertLine.y }]}
        />
      )}

      {/* Ghost */}
      {draggingItem && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { width: blockW },
            {
              transform: [
                { translateX: Animated.add(new Animated.Value(ghostInitX.current), dragAnim.x) },
                { translateY: Animated.add(new Animated.Value(ghostInitY.current), dragAnim.y) },
              ],
            },
          ]}
        >
          <Feather name={draggingItem.icon} size={22} color="#FAF0EE" />
          <Text style={[styles.label, { color: "#FAF0EE" }]} numberOfLines={1}>
            {draggingItem.label}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap:      "wrap",
    gap:           GAP,
    marginBottom:  16,
    position:      "relative",
  },
  insertLine: {
    position:        "absolute",
    width:           2.5,
    height:          BLOCK_H,
    borderRadius:    2,
  },
  block: {
    height:          BLOCK_H,
    borderRadius:    18,
    overflow:        "hidden",
    alignItems:      "center",
    justifyContent:  "center",
    gap:             8,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  blockDragging: {
    opacity: 0.25,
  },
  label: {
    fontFamily: "Manrope",
    fontSize:      12,
    fontWeight:    "600",
    textAlign:     "center",
    letterSpacing: 0.2,
  },
  ghost: {
    position:        "absolute",
    height:          BLOCK_H,
    borderRadius:    18,
    alignItems:      "center",
    justifyContent:  "center",
    gap:             8,
    backgroundColor: "rgba(74,12,12,0.35)",
    ...Platform.select({
      ios: {
        shadowColor:   "#000",
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius:  10,
      },
      android: { elevation: 10 },
    }),
  },
});

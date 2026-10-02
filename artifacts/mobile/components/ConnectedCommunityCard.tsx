import { Image } from "expo-image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  changedDigitSlots,
  reconcileVisible,
  rotateOne,
  type CommunityAvatar,
} from "@/components/connectedCommunityModel";

export type ConnectedCommunityCardProps = {
  count: number | null;
  avatars: CommunityAvatar[];
  active: boolean;
  stale: boolean;
  loading: boolean;
};

const ROTATE_MS = 12000;
const DIGIT_MS = 220;
const FADE_MS = 600;
const SIZE = 44;
const OVERLAP = 12;
const DIGIT_W = 30;
const DIGIT_H = 56;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => alive && setReduced(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReduced);
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return reduced;
}

function DigitSlot({ char, animate, color, changed }: { char: string; animate: boolean; color: string; changed: boolean }) {
  const [prev, setPrev] = useState<string | null>(null);
  const shown = useRef(char);
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (shown.current === char) return;
    const old = shown.current;
    shown.current = char;
    progress.stopAnimation();
    if (!animate || !changed) { progress.setValue(1); setPrev(null); return; }
    setPrev(old);
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: DIGIT_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      .start(({ finished }) => finished && setPrev(null));
  }, [char, animate, changed, progress]);
  useEffect(() => { if (!animate) { progress.stopAnimation(); progress.setValue(1); setPrev(null); } }, [animate, progress]);
  const inY = progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const outY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const outO = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const txt = [styles.digit, { color }];
  return (
    <View style={styles.digitSlot}>
      {prev !== null ? (
        <Animated.Text style={[...txt, styles.abs, { opacity: outO, transform: [{ translateY: outY }] }]}>{prev}</Animated.Text>
      ) : null}
      <Animated.Text style={[...txt, { opacity: progress, transform: [{ translateY: prev !== null ? inY : 0 }] }]}>{char}</Animated.Text>
    </View>
  );
}

function AvatarSlot({ url, animate, ring, index }: { url: string; animate: boolean; ring: string; index: number }) {
  const [under, setUnder] = useState<string | null>(null);
  const current = useRef(url);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (current.current === url) return;
    const old = current.current;
    current.current = url;
    fade.stopAnimation();
    if (!animate) { fade.setValue(1); setUnder(null); return; }
    setUnder(old);
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: FADE_MS, useNativeDriver: true })
      .start(({ finished }) => finished && setUnder(null));
  }, [url, animate, fade]);
  return (
    <View style={[styles.avatar, { borderColor: ring, marginLeft: index === 0 ? 0 : -OVERLAP, zIndex: 10 - index }]}>
      {under ? <Image source={{ uri: under }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
      </Animated.View>
    </View>
  );
}

export function ConnectedCommunityCard({ count, avatars, active, stale, loading }: ConnectedCommunityCardProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const live = active && !stale;
  const animate = live && !reduced;

  const [visible, setVisible] = useState<CommunityAvatar[]>(() => reconcileVisible(avatars, []));
  const poolRef = useRef(avatars);
  poolRef.current = avatars;

  // Pool changes: departed users disappear immediately.
  useEffect(() => {
    setVisible((cur) => reconcileVisible(avatars, cur));
  }, [avatars]);

  // Preload.
  useEffect(() => {
    const urls = avatars.map((a) => a?.avatarUrl).filter(Boolean);
    if (urls.length) Image.prefetch(urls).catch(() => {});
  }, [avatars]);

  // Rotation only when live.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setVisible((cur) => rotateOne(poolRef.current, cur)), ROTATE_MS);
    return () => clearInterval(t);
  }, [live]);

  // Count text, with digits changed vs previous rendered value.
  const text = count === null ? "" : String(Math.max(0, Math.floor(count)));
  const prevText = useRef(text);
  const changedMask = useMemo(() => changedDigitSlots(prevText.current, text), [text]);
  useEffect(() => { prevText.current = text; }, [text]);

  const appear = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const entered = useRef(false);
  useEffect(() => {
    if (animate && !entered.current) {
      entered.current = true;
      appear.setValue(0);
      Animated.timing(appear, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } else {
      if (active) entered.current = true;
      appear.stopAnimation(); appear.setValue(1);
    }
  }, [active, animate, appear]);

  const status = count === null ? (loading ? "Cargando" : "No disponible") : stale ? "Sin actualizar" : null;
  const label = count === null
    ? `Personas conectadas contigo ahora: ${status ?? "no disponible"}`
    : `${count} personas conectadas contigo ahora${stale ? ", dato sin actualizar" : ""}`;
  const fg = colors.foreground;
  const muted = colors.mutedForeground ?? fg;
  const slots = Math.max(text.length, 1);

  return (
    <Animated.View
      testID="connected-community-card"
      accessible
      accessibilityRole="summary"
      accessibilityLabel={label}
      style={[styles.root, { opacity: appear }]}
    >
      <View style={[styles.countRow, { minWidth: slots * DIGIT_W }]}>
        {count === null ? (
          <Text style={[styles.digit, { color: fg, opacity: 0.3 }]}>{loading ? "\u2013" : "\u2013"}</Text>
        ) : (
          Array.from(text).map((c, i) => (
            <DigitSlot
              key={`${text.length - i}`}
              char={c}
              color={fg}
              animate={animate}
              changed={changedMask[changedMask.length - text.length + i] ?? false}
            />
          ))
        )}
      </View>
      <Text style={[styles.caption, { color: muted }]} maxFontSizeMultiplier={1.4}>
        personas conectadas contigo ahora
      </Text>
      <View style={styles.statusSlot}>
        {status ? <Text style={[styles.status, { color: muted }]} maxFontSizeMultiplier={1.3}>{status}</Text> : null}
      </View>
      {visible.length > 0 ? (
        <View style={styles.faces} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {visible.map((a, i) => (
            <AvatarSlot key={i} url={a.avatarUrl} animate={animate} ring={colors.background ?? "transparent"} index={i} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default ConnectedCommunityCard;

const styles = StyleSheet.create({
  root: { alignItems: "center", backgroundColor: "transparent", paddingHorizontal: 20, paddingVertical: 12 },
  countRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", height: DIGIT_H },
  digitSlot: { width: DIGIT_W, height: DIGIT_H, alignItems: "center", justifyContent: "center" },
  abs: { position: "absolute" },
  digit: {
    fontFamily: "Manrope", fontSize: 48, lineHeight: DIGIT_H, fontWeight: "700",
    fontVariant: ["tabular-nums"], textAlign: "center", includeFontPadding: false,
  },
  caption: { fontFamily: "Manrope", fontSize: 14, lineHeight: 20, marginTop: 2, textAlign: "center" },
  statusSlot: { minHeight: 18, justifyContent: "center", marginBottom: 8 },
  status: { fontFamily: "Manrope", fontSize: 12, lineHeight: 16, textAlign: "center" },
  faces: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: SIZE },
  avatar: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.12)" },
});

import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MEMBERSHIP_AURORA, SLEEP_REMINDER_NIGHT_GRADIENT, STREAK_INFO_COLORS } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import type { DailyQuoteShareAction } from "@/utils/dailyQuoteShare";

const WORDMARK = require("@/assets/images/logo-resonancia-new.png");

const GOLD = MEMBERSHIP_AURORA.premium.accent;
const GOLD_SOFT = MEMBERSHIP_AURORA.premium.soft;
const NAVY = STREAK_INFO_COLORS.fallbackBackground;
const NAVY_DEEP = SLEEP_REMINDER_NIGHT_GRADIENT[1];
const IMAGE_ACTIONS: DailyQuoteShareAction[] = ["instagram", "whatsapp", "messenger", "more"];

type Option = {
  action: DailyQuoteShareAction;
  label: string;
  tint: string;
  icon: React.ReactNode;
};

const OPTIONS: Option[] = [
  { action: "copy", label: "Copiar frase", tint: STREAK_INFO_COLORS.iconBackground, icon: <Feather name="copy" size={25} color={STREAK_INFO_COLORS.foreground} /> },
  { action: "sms", label: "Mensaje", tint: "#34C759", icon: <Ionicons name="chatbubble" size={25} color="#FFFFFF" /> },
  { action: "instagram", label: "Instagram", tint: "#C13584", icon: <Ionicons name="logo-instagram" size={28} color="#FFFFFF" /> },
  { action: "whatsapp", label: "WhatsApp", tint: "#25D366", icon: <Ionicons name="logo-whatsapp" size={29} color="#FFFFFF" /> },
  { action: "messenger", label: "Messenger", tint: "#0A7CFF", icon: <FontAwesome5 name="facebook-messenger" size={26} color="#FFFFFF" /> },
  { action: "more", label: "Más", tint: STREAK_INFO_COLORS.iconBackground, icon: <MaterialCommunityIcons name="dots-horizontal" size={28} color={STREAK_INFO_COLORS.foreground} /> },
];

export function DailyQuoteShareSheet({
  visible,
  quote,
  onClose,
  onAction,
  busy,
  feedback,
}: {
  visible: boolean;
  quote: { text: string; author: string };
  onClose: () => void;
  onAction: (action: DailyQuoteShareAction, artwork: View | null) => void;
  busy: boolean;
  feedback: string | null;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const artworkRef = useRef<View>(null);
  const colors = useColors();
  const { theme } = useSceneTheme();
  const [logoState, setLogoState] = useState<"loading" | "ready" | "error">("loading");
  const logoNote = logoState === "error" ? "No se pudo cargar el logo; solo puedes copiar o enviar texto." : null;
  const shownFeedback = feedback ?? logoNote;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
      testID="daily-quote-share-modal"
    >
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar compartir frase"
          testID="daily-quote-share-backdrop"
        />
        <View
          style={[styles.sheet, { maxHeight: height * 0.92, paddingBottom: bottomPad + 18, borderColor: GOLD }]}
          accessibilityViewIsModal
        >
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, ...string[]]}
            locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
            start={theme.gradientStart}
            end={theme.gradientEnd}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.handle} />
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            style={styles.close}
            testID="daily-quote-share-close"
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View ref={artworkRef} collapsable={false} style={styles.artwork} testID="daily-quote-share-artwork">
              <LinearGradient
                colors={[NAVY, NAVY_DEEP]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.frame} pointerEvents="none" />
              <Image source={WORDMARK} style={styles.logo} resizeMode="contain" accessibilityLabel="Resonancia" onLoad={() => setLogoState("ready")} onError={() => setLogoState("error")} />
              <View style={styles.rule} />
              <Text style={styles.quote}>{`“${quote.text}”`}</Text>
              <Text style={styles.author}>{quote.author}</Text>
            </View>

            <Text style={[styles.heading, { color: colors.foreground }]} accessibilityRole="header">
              Comparte esta frase con quienes quieres
            </Text>

            <View style={styles.feedbackSlot} accessibilityLiveRegion="polite">
              {busy ? (
                <View style={styles.feedbackRow}>
                  <ActivityIndicator size="small" color={GOLD} />
                  <Text style={styles.feedback}>{shownFeedback ?? "Preparando tu frase…"}</Text>
                </View>
              ) : shownFeedback ? (
                <Text style={styles.feedback}>{shownFeedback}</Text>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
              style={{ opacity: busy ? 0.5 : 1 }}
            >
              {OPTIONS.map((o) => {
                const blocked = busy || (IMAGE_ACTIONS.includes(o.action) && logoState !== "ready");
                return (
                <Pressable
                  key={o.action}
                  onPress={() => {
                    if (!blocked) onAction(o.action, artworkRef.current);
                  }}
                  disabled={blocked}
                  accessibilityRole="button"
                  accessibilityLabel={o.label}
                  accessibilityState={{ disabled: blocked, busy }}
                  testID={`daily-quote-share-${o.action}`}
                  style={({ pressed }) => [styles.option, { opacity: blocked ? 0.4 : pressed ? 0.6 : 1 }]}
                >
                  <View style={[styles.circle, { backgroundColor: o.tint }]}>{o.icon}</View>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{o.label}</Text>
                </Pressable>
                );
              })}
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(4,7,22,0.7)" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    
    paddingTop: 10,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: STREAK_INFO_COLORS.footnote,
    marginBottom: 6,
  },
  close: {
    position: "absolute",
    top: 14,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: STREAK_INFO_COLORS.navigationBackground,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingTop: 22, paddingBottom: 4 },
  artwork: {
    marginHorizontal: 24,
    borderRadius: 22,
    overflow: "hidden",
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 28,
    alignItems: "center",
  },
  frame: {
    ...StyleSheet.absoluteFillObject,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MEMBERSHIP_AURORA.premium.border,
  },
  logo: { width: 190, height: 47 },
  rule: { width: 36, height: 1, backgroundColor: GOLD, opacity: 0.7, marginVertical: 20 },
  quote: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "700",
    color: STREAK_INFO_COLORS.foreground,
    textAlign: "center",
  },
  author: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    color: GOLD_SOFT,
    marginTop: 16,
    textAlign: "center",
  },
  heading: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 26,
    marginHorizontal: 32,
  },
  feedbackSlot: { minHeight: 30, justifyContent: "center", alignItems: "center", marginTop: 10 },
  feedbackRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  feedback: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: GOLD, textAlign: "center", paddingHorizontal: 24 },
  row: { paddingHorizontal: 20, gap: 8, paddingTop: 6, paddingBottom: 4 },
  option: { width: 82, alignItems: "center" },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});

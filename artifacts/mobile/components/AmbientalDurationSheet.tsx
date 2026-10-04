import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { SCENE_THEMES } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";
import { useAmbientalDurationTransition } from "@/hooks/useAmbientalDurationTransition";
import { CIRCLE_DIAMETER, MANUAL_HEIGHT_INCREASE } from "@/lib/ambiental-duration-transition";
import { FREE_TIMER_MAX_MINUTES, showPremiumGate } from "@/lib/premiumGate";
import { REGISTER_BUTTON_ENABLED_BACKGROUND } from "@/constants/colors";
import { PremiumPlansSurface, usePremiumPlansModalHost } from "@/components/PremiumPlansOverlay";
import Svg, { Path } from "react-native-svg";

const SHEET_HEIGHT = 320;
const WHEEL_ROW_HEIGHT = 44;
const WHEEL_HEIGHT = 132;
const PRESETS = [5, 10, 20] as const;
const MAX_CUSTOM_HOURS = 8;
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const HOURS = Array.from({ length: MAX_CUSTOM_HOURS + 1 }, (_, index) => index);

type WheelPickerProps = {
  values: number[];
  selectedValue: number;
  suffix: string;
  onChange: (value: number) => void;
  testID: string;
};

function WheelPicker({
  values,
  selectedValue,
  suffix,
  onChange,
  testID,
}: WheelPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const initialIndex = Math.max(0, values.indexOf(selectedValue));

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: initialIndex * WHEEL_ROW_HEIGHT,
        animated: false,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [initialIndex, values.length]);

  const handleScrollEnd = (offsetY: number) => {
    const index = Math.max(
      0,
      Math.min(values.length - 1, Math.round(offsetY / WHEEL_ROW_HEIGHT)),
    );
    onChange(values[index]);
  };

  return (
    <View style={styles.wheelColumn} testID={testID}>
      <View pointerEvents="none" style={styles.wheelSelection} />
      <ScrollView
        ref={scrollRef}
        style={styles.wheel}
        contentContainerStyle={styles.wheelContent}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ROW_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) =>
          handleScrollEnd(event.nativeEvent.contentOffset.y)
        }
        onScrollEndDrag={(event) =>
          handleScrollEnd(event.nativeEvent.contentOffset.y)
        }
        accessibilityLabel={`Seleccionar ${suffix}`}
      >
        {values.map((value) => (
          <View key={value} style={styles.wheelRow}>
            <Text style={styles.wheelNumber}>{value}</Text>
            <Text style={styles.wheelSuffix}>{suffix}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

type Props = {
  visible: boolean;
  sessionTitle?: string;
  isPremium: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  onStart: (minutes: number) => void;
};

export function AmbientalDurationSheet({
  visible,
  sessionTitle,
  isPremium,
  onClose,
  onDismissed,
  onStart,
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const selectedPresetBackground = theme.id === "cloudy" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.16)";
  const sheetGradient: [string, string] = theme.id === "indigo2"
    ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]
    : [theme.gradient[1], theme.gradient[2]];
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const { phase, values, transition, baselineHeight, startButtonLayout, reducedMotion } = useAmbientalDurationTransition();
  const customMode = phase === "revealing" || phase === "manual";
  const presetsInteractive = visible && phase === "presets";
  const manualInteractive = visible && phase === "manual";
  const [selectedPreset, setSelectedPreset] = useState<number>(10);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(10);
  const sheetY = useRef(new Animated.Value(SHEET_HEIGHT + 80)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const customOpacity = values.manualOpacity;
  const dismissedRef = useRef(onDismissed);
  dismissedRef.current = onDismissed;
  const visibilityGeneration = useRef(0);
  const premiumPlans = usePremiumPlansModalHost(rendered);

  useEffect(() => {
    const token = ++visibilityGeneration.current;
    let frame: number | undefined;
    const cleanup = () => {
      visibilityGeneration.current++;
      if (frame !== undefined) cancelAnimationFrame(frame);
      transition.cancel();
      sheetY.stopAnimation();
      backdropOpacity.stopAnimation();
    };
    if (visible) {
      setRendered(true);
      transition.reset();
      setSelectedPreset(10);
      setCustomHours(0);
      setCustomMinutes(10);
      sheetY.stopAnimation();
      backdropOpacity.stopAnimation();
      sheetY.setValue(SHEET_HEIGHT + 80);
      backdropOpacity.setValue(0);
      frame = requestAnimationFrame(() => {
        if (token !== visibilityGeneration.current) return;
        Animated.parallel([
          Animated.spring(sheetY, {
            toValue: 0,
            tension: 55,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0.62,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return cleanup;
    }

    transition.cancel();
    sheetY.stopAnimation();
    backdropOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: Math.max(SHEET_HEIGHT, baselineHeight.current) + MANUAL_HEIGHT_INCREASE + 80,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 460,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || token !== visibilityGeneration.current) return;
      setRendered(false);
      frame = requestAnimationFrame(() => {
        if (token === visibilityGeneration.current) dismissedRef.current?.();
      });
    });
    return cleanup;
  }, [
    visible,
    sheetY,
    backdropOpacity,
    transition,
    baselineHeight,
  ]);

  const minuteValues = useMemo(
    () => (customHours === MAX_CUSTOM_HOURS ? [0] : MINUTES),
    [customHours],
  );
  const customTotalMinutes = customHours * 60 + customMinutes;
  const selectedMinutes = customMode ? customTotalMinutes : selectedPreset;
  const canStart = visible && selectedMinutes > 0 && (phase === "presets" || phase === "manual");
  // A constant distance from the bottom cancels the panel's upward height growth.
  const startBottom = startButtonLayout.current && baselineHeight.current > 0
    ? baselineHeight.current - startButtonLayout.current.y - startButtonLayout.current.height
    : undefined;
  const pinnedStartStyle = phase !== "presets" && startBottom !== undefined
    ? {
        position: "absolute" as const,
        left: 0,
        right: 0,
        bottom: startBottom,
        height: startButtonLayout.current!.height,
        marginTop: 0,
      }
    : undefined;
  const enterCustomMode = () => {
    if (visible && startButtonLayout.current) transition.start(baselineHeight.current, reducedMotion.current);
  };
  const closeSheet = () => {
    transition.cancel();
    onClose();
  };

  const handleHoursChange = (hours: number) => {
    setCustomHours(hours);
    if (hours === MAX_CUSTOM_HOURS) setCustomMinutes(0);
  };

  const handleStart = () => {
    if (!canStart || transition.isTransitioning()) return;
    if (!isPremium && selectedMinutes > FREE_TIMER_MAX_MINUTES) {
      showPremiumGate(
        `El temporizador gratuito llega hasta ${FREE_TIMER_MAX_MINUTES} minutos. Hazte Premium para usar sesiones más largas.`,
      );
      return;
    }
    onStart(selectedMinutes);
  };

  if (!rendered) return null;

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={premiumPlans.visible ? premiumPlans.close : closeSheet}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeSheet}
          accessibilityLabel="Cerrar selector de duración"
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: "#000000", opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetGradient[0],
              transform: [{ translateY: sheetY }],
            },
          ]}
          accessibilityViewIsModal
        >
          <LinearGradient
            pointerEvents="none"
            colors={sheetGradient}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            testID="ambiental-duration-sheet-height"
            onLayout={(event) => {
              if (transition.getPhase() === "presets" && event.nativeEvent.layout.height > 0) {
                baselineHeight.current = event.nativeEvent.layout.height;
              }
            }}
            style={{
              minHeight: SHEET_HEIGHT,
              height: phase === "presets" ? undefined : values.sheetHeight,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
          <View style={styles.handle} />
          <Text
            style={[styles.title, { color: colors.foreground }]}
            accessibilityLabel={
              sessionTitle
                ? `Escoge tu duración para ${sessionTitle}`
                : "Escoge tu duración"
            }
          >
            Escoge tu duración
          </Text>

          <View style={styles.contentArea}>
            <View
              pointerEvents={presetsInteractive ? "auto" : "none"}
              accessibilityElementsHidden={!presetsInteractive}
              importantForAccessibility={presetsInteractive ? "auto" : "no-hide-descendants"}
              style={styles.presetsArea}
            >
              <View style={styles.presetRow}>
                {PRESETS.map((minutes, index) => {
                  const selected = !customMode && selectedPreset === minutes;
                  return (
                    <View key={minutes} style={styles.circleSlot}>
                    <Animated.View
                      testID={`ambiental-duration-circle-${minutes}`}
                      style={{ opacity: values.circleOpacities[index], transform: [{ scale: values.scales[index] }] }}
                    >
                    <Pressable
                      disabled={!presetsInteractive}
                      onPress={() => {
                        if (transition.getPhase() === "presets") setSelectedPreset(minutes);
                      }}
                      style={[
                        styles.preset,
                        {
                          backgroundColor: selected
                            ? selectedPresetBackground
                            : "rgba(255,255,255,0.1)",
                          borderColor: selected
                            ? "rgba(249,249,249,0.8)"
                            : "transparent",
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${minutes} minutos`}
                      testID={`ambiental-duration-${minutes}`}
                    >
                      <Text
                        style={[
                          styles.presetValue,
                          {
                            color: selected
                              ? "#F9F9F9"
                              : "#F4F4F4",
                          },
                        ]}
                      >
                        {minutes}
                      </Text>
                      <Text
                        style={[
                          styles.presetUnit,
                          {
                            color: selected
                              ? "#F9F9F9"
                              : "#F4F4F4",
                          },
                        ]}
                      >
                        min
                      </Text>
                    </Pressable>
                    </Animated.View>
                    </View>
                  );
                })}
                <View style={styles.circleSlot}>
                <Animated.View
                  testID="ambiental-duration-circle-plus"
                  style={{ opacity: values.circleOpacities[3], transform: [{ scale: values.scales[3] }] }}
                >
                <Pressable
                  disabled={!presetsInteractive}
                  onPress={enterCustomMode}
                  style={[
                    styles.preset,
                    {
                      backgroundColor: customMode
                        ? selectedPresetBackground
                        : "rgba(255,255,255,0.1)",
                      borderColor: "transparent",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Elegir una duración personalizada"
                  testID="ambiental-duration-custom"
                >
                  <Feather name="plus" size={34} color="#F4F4F4" />
                </Pressable>
                </Animated.View>
                </View>
              </View>
            </View>

            <Animated.View
              testID="ambiental-duration-manual"
              pointerEvents={manualInteractive ? "auto" : "none"}
              accessibilityElementsHidden={!manualInteractive}
              importantForAccessibility={manualInteractive ? "auto" : "no-hide-descendants"}
              style={[styles.customArea, { opacity: customOpacity }]}
            >
              <View style={styles.wheelsRow}>
                <WheelPicker
                  values={HOURS}
                  selectedValue={customHours}
                  suffix="horas"
                  onChange={(hours) => {
                    if (transition.getPhase() === "manual") handleHoursChange(hours);
                  }}
                  testID="ambiental-duration-hours"
                />
                <WheelPicker
                  values={minuteValues}
                  selectedValue={customMinutes}
                  suffix="minutos"
                  onChange={(minutes) => {
                    if (transition.getPhase() === "manual") setCustomMinutes(minutes);
                  }}
                  testID="ambiental-duration-minutes"
                />
              </View>
            </Animated.View>
          </View>

          <Pressable
            onLayout={(event) => {
              if (transition.getPhase() === "presets" && event.nativeEvent.layout.height > 0) {
                const { y, height } = event.nativeEvent.layout;
                startButtonLayout.current = { y, height };
              }
            }}
            onPress={handleStart}
            disabled={!canStart}
            style={({ pressed }) => [
              styles.startButton,
              pinnedStartStyle,
              {
                opacity: !canStart ? 0.45 : pressed ? 0.78 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Empezar sesión de ${selectedMinutes} minutos`}
            testID="ambiental-duration-start"
          >
            <View
              style={[
                styles.startButtonFill,
                { backgroundColor: REGISTER_BUTTON_ENABLED_BACKGROUND },
              ]}
            />
            <View style={styles.startButtonContent}>
              <Svg width={21} height={21} viewBox="0 0 48 48">
                <Path
                  d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z"
                  fill="#F9F9F9"
                />
              </Svg>
              <Text style={styles.startButtonText}>Empezar sesión</Text>
            </View>
          </Pressable>

          {customMode && (
            <Animated.View testID="ambiental-duration-cancel-anchor" style={{
              opacity: customOpacity,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: (startBottom ?? Math.max(insets.bottom, 16)) + (startButtonLayout.current?.height ?? 0) + 12,
            }}>
            <Pressable
              onPress={closeSheet}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: "rgba(249,249,249,0.6)",
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancelar selección de duración"
              testID="ambiental-duration-cancel"
            >
              <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
                Cancelar
              </Text>
            </Pressable>
            </Animated.View>
          )}
          </Animated.View>
        </Animated.View>
        {premiumPlans.visible ? <PremiumPlansSurface onClose={premiumPlans.close} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: SHEET_HEIGHT,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    zIndex: 2,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
  handle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.24)",
    marginTop: 13,
    marginBottom: 10,
    transform: [{ translateY: 20 }],
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    transform: [{ translateY: 20 }],
  },
  contentArea: {
    minHeight: 110,
    justifyContent: "center",
  },
  presetsArea: {
    width: "100%",
  },
  presetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    transform: [{ translateY: 18 }],
  },
  preset: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
    borderRadius: 38,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  circleSlot: {
    width: CIRCLE_DIAMETER,
    height: CIRCLE_DIAMETER,
  },
  presetValue: {
    fontFamily: "Manrope",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 27,
  },
  presetUnit: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
  },
  customArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  wheelsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  wheelColumn: {
    width: 142,
    height: WHEEL_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  wheel: {
    flex: 1,
  },
  wheelContent: {
    paddingVertical: (WHEEL_HEIGHT - WHEEL_ROW_HEIGHT) / 2,
  },
  wheelSelection: {
    position: "absolute",
    zIndex: 2,
    left: 0,
    right: 0,
    top: (WHEEL_HEIGHT - WHEEL_ROW_HEIGHT) / 2,
    height: WHEEL_ROW_HEIGHT,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  wheelRow: {
    height: WHEEL_ROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  wheelNumber: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
  },
  wheelSuffix: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "600",
  },
  startButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 26,
    overflow: "hidden",
    shadowColor: "#8769e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  startButtonFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: "hidden",
  },
  startButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  startButtonText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#F9F9F9",
  },
  cancelButton: {
    height: 54,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
});
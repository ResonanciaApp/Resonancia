import { Feather } from "@expo/vector-icons";
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
import { useColors } from "@/hooks/useColors";
import { FREE_TIMER_MAX_MINUTES, showPremiumGate } from "@/lib/premiumGate";

const SHEET_HEIGHT = 390;
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
  onStart: (minutes: number) => void;
};

export function AmbientalDurationSheet({
  visible,
  sessionTitle,
  isPremium,
  onClose,
  onStart,
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);
  const [customMode, setCustomMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number>(10);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(10);
  const sheetY = useRef(new Animated.Value(SHEET_HEIGHT + 80)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const presetsOpacity = useRef(new Animated.Value(1)).current;
  const customOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      setCustomMode(false);
      setSelectedPreset(10);
      setCustomHours(0);
      setCustomMinutes(10);
      sheetY.stopAnimation();
      backdropOpacity.stopAnimation();
      presetsOpacity.stopAnimation();
      customOpacity.stopAnimation();
      sheetY.setValue(SHEET_HEIGHT + 80);
      backdropOpacity.setValue(0);
      presetsOpacity.setValue(1);
      customOpacity.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(sheetY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 0.62,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start();
      });
      return;
    }

    sheetY.stopAnimation();
    backdropOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: SHEET_HEIGHT + 80,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setRendered(false));
  }, [
    visible,
    sheetY,
    backdropOpacity,
    presetsOpacity,
    customOpacity,
  ]);

  const minuteValues = useMemo(
    () => (customHours === MAX_CUSTOM_HOURS ? [0] : MINUTES),
    [customHours],
  );
  const customTotalMinutes = customHours * 60 + customMinutes;
  const selectedMinutes = customMode ? customTotalMinutes : selectedPreset;
  const canStart = selectedMinutes > 0;

  const enterCustomMode = () => {
    setCustomMode(true);
    Animated.parallel([
      Animated.timing(presetsOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(customOpacity, {
        toValue: 1,
        duration: 220,
        delay: 70,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleHoursChange = (hours: number) => {
    setCustomHours(hours);
    if (hours === MAX_CUSTOM_HOURS) setCustomMinutes(0);
  };

  const handleStart = () => {
    if (!canStart) return;
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
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
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
              // `colors.card` es translúcido en la paleta global. El sheet
              // necesita una superficie opaca del mismo tema que Inicio.
              backgroundColor: theme.gradient[0],
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetY }],
            },
          ]}
          accessibilityViewIsModal
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
            <Animated.View
              pointerEvents={customMode ? "none" : "auto"}
              style={[styles.presetsArea, { opacity: presetsOpacity }]}
            >
              <View style={styles.presetRow}>
                {PRESETS.map((minutes) => {
                  const selected = selectedPreset === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      onPress={() => setSelectedPreset(minutes)}
                      style={[
                        styles.preset,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.muted,
                          borderColor: selected
                            ? colors.foreground
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
                              ? colors.background
                              : colors.foreground,
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
                              ? colors.background
                              : colors.mutedForeground,
                          },
                        ]}
                      >
                        min
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  onPress={enterCustomMode}
                  style={[
                    styles.preset,
                    { backgroundColor: colors.muted, borderColor: "transparent" },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Elegir una duración personalizada"
                  testID="ambiental-duration-custom"
                >
                  <Feather name="plus" size={34} color={colors.foreground} />
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View
              pointerEvents={customMode ? "auto" : "none"}
              style={[styles.customArea, { opacity: customOpacity }]}
            >
              <View style={styles.wheelsRow}>
                <WheelPicker
                  values={HOURS}
                  selectedValue={customHours}
                  suffix="horas"
                  onChange={handleHoursChange}
                  testID="ambiental-duration-hours"
                />
                <WheelPicker
                  values={minuteValues}
                  selectedValue={customMinutes}
                  suffix="minutos"
                  onChange={setCustomMinutes}
                  testID="ambiental-duration-minutes"
                />
              </View>
            </Animated.View>
          </View>

          <Pressable
            onPress={handleStart}
            disabled={!canStart}
            style={({ pressed }) => [
              styles.startButton,
              {
                backgroundColor: colors.primary,
                opacity: !canStart ? 0.45 : pressed ? 0.78 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Empezar sesión de ${selectedMinutes} minutos`}
            testID="ambiental-duration-start"
          >
            <Text style={[styles.startButtonText, { color: colors.background }]}>
              Empezar sesión
            </Text>
          </Pressable>

          {customMode && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  backgroundColor: colors.muted,
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
          )}
        </Animated.View>
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
    marginTop: 12,
    marginBottom: 22,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 23,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 22,
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
  },
  preset: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
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
    height: 58,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  startButtonText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "800",
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
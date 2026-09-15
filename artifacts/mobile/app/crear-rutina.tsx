import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import {
  ROUTINE_CATEGORY_TABS,
  ROUTINE_SUGGESTIONS,
  useRutina,
  type RoutineCategory,
} from "@/context/RutinaContext";
import { useColors } from "@/hooks/useColors";
import { SacredBackground } from "@/components/SacredBackground";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { markRoutineAdditionTransition } from "@/lib/routineCompletionTransition";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const ROUTINE_MUTED = "#7F7F7F";
const ROUTINE_SELECTED = "#F9F9F9";

function repeatLabel(repeatEnabled: boolean, timesPerDay: number) {
  if (!repeatEnabled) return "Repetición apagada";
  return timesPerDay === 1 ? "Cada día" : `${timesPerDay} veces al día`;
}

export default function CrearRutinaScreen() {
  const { from } = useLocalSearchParams<{ from?: string }>();
  const colors = useColors();
  const { activeSceneId, theme: activeTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { addActivity } = useRutina();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RoutineCategory>("Sugerido");
  const [suggestedCategory, setSuggestedCategory] = useState<RoutineCategory | null>(null);
  const [repeatDays, setRepeatDays] = useState<number[]>(ALL_DAYS);
  const [repeatEnabled, setRepeatEnabled] = useState(true);
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [draftRepeatEnabled, setDraftRepeatEnabled] = useState(true);
  const [draftTimesPerDay, setDraftTimesPerDay] = useState(1);
  const [repeatSheetOpen, setRepeatSheetOpen] = useState(false);
  const [suggestionEditing, setSuggestionEditing] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const contentScrollRef = useRef<any>(null);
  const suggestionsYRef = useRef(0);
  const suggestionTransition = useSharedValue(0);

  const topPad = Platform.OS === "web" ? 24 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 24 : Math.max(insets.bottom, 18);
  const suggestions = useMemo(() => ROUTINE_SUGGESTIONS[category], [category]);
  const canSave = title.trim().length > 0;
  const suggestionSurface =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.07)"
      : activeSceneId === "indigo2"
        ? "rgba(191,207,255,0.07)"
        : isIndigoThemeId(activeSceneId)
          ? "rgba(181,211,255,0.07)"
          : "rgba(181,211,255,0.07)";
  const tabAccentColor = activeTheme.accent ?? colors.primary;
  const suggestionsFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - suggestionTransition.value,
  }));
  const undoPillFadeStyle = useAnimatedStyle(() => ({
    opacity: suggestionTransition.value,
  }));

  const enterSuggestionEditing = (suggestionTitle: string, suggestionCategory: RoutineCategory) => {
    setTitle(suggestionTitle);
    setSuggestedCategory(suggestionCategory);
    setSuggestionEditing(true);
    suggestionTransition.value = withTiming(1, { duration: 350 });
    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.setNativeProps({
        selection: {
          start: suggestionTitle.length,
          end: suggestionTitle.length,
        },
      });
    });
  };

  const undoSuggestionEditing = () => {
    setSuggestionEditing(false);
    suggestionTransition.value = withTiming(0, { duration: 350 });
    requestAnimationFrame(() => {
      contentScrollRef.current?.scrollTo?.({
        y: Math.max(0, suggestionsYRef.current - topPad - 12),
        animated: true,
      });
    });
  };

  const openRepeatSheet = () => {
    Keyboard.dismiss();
    setDraftRepeatEnabled(repeatEnabled);
    setDraftTimesPerDay(timesPerDay);
    setRepeatSheetOpen(true);
  };

  const saveRepeatSettings = () => {
    setRepeatEnabled(draftRepeatEnabled);
    setRepeatDays(draftRepeatEnabled ? ALL_DAYS : []);
    setTimesPerDay(draftRepeatEnabled ? draftTimesPerDay : 1);
    setRepeatSheetOpen(false);
  };

  const save = () => {
    if (!canSave) return;
    Keyboard.dismiss();
    const activity = addActivity({
      title,
      description,
      category: category === "Sugerido" && suggestedCategory ? suggestedCategory : category,
      repeatDays,
      repeatEnabled,
      timesPerDay,
    });
    if (from === "calendar") markRoutineAdditionTransition(activity.id);
    router.back();
  };

  return (
    <View style={styles.root}>
      <SacredBackground variant="gradient" />
      <KeyboardAwareScrollViewCompat
        scrollRef={contentScrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: bottomPad + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cerrar creación de actividad"
            testID="crear-rutina-close"
            hitSlop={10}
            style={({ pressed }) => [styles.headerSide, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={25} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} pointerEvents="none">
            Crear actividad
          </Text>
          <Pressable
            onPress={save}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Guardar actividad"
            testID="crear-rutina-save"
            style={({ pressed }) => [
              styles.headerSide,
              styles.saveSide,
              { opacity: !canSave ? 0.32 : pressed ? 0.65 : 1 },
            ]}
          >
            <Text style={[styles.saveText, { color: WIDGET_GREEN_SOLID }]}>Guardar</Text>
          </Pressable>
        </View>

        <TextInput
          ref={titleInputRef}
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            setSuggestedCategory(null);
          }}
          placeholder="Nombra tu actividad"
          placeholderTextColor={ROUTINE_MUTED}
          style={[styles.titleInput, { color: colors.foreground }]}
          accessibilityLabel="Nombre de la actividad"
          testID="crear-rutina-title"
          returnKeyType="next"
          maxLength={80}
        />

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Añadir una descripción (opcional)"
          placeholderTextColor={ROUTINE_MUTED}
          style={[styles.descriptionInput, { color: colors.foreground }]}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Descripción de la actividad"
          testID="crear-rutina-description"
          maxLength={180}
        />

        <View style={styles.actionsBlock}>
          <Pressable
            onPress={openRepeatSheet}
            accessibilityRole="button"
            accessibilityLabel={`Repetición: ${repeatLabel(repeatEnabled, timesPerDay)}`}
            testID="crear-rutina-repeat"
            style={({ pressed }) => [
              styles.simpleAction,
              { opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <Feather name="repeat" size={19} color={WIDGET_GREEN_SOLID} />
            <Text style={[styles.actionText, styles.repeatActionText, { color: WIDGET_GREEN_SOLID }]}>
              {repeatLabel(repeatEnabled, timesPerDay)}
            </Text>
          </Pressable>
        </View>

        <View
          style={styles.suggestionsBlock}
          onLayout={(event) => {
            suggestionsYRef.current = event.nativeEvent.layout.y;
          }}
        >
          <Reanimated.View
            pointerEvents={suggestionEditing ? "none" : "auto"}
            style={suggestionsFadeStyle}
          >
            <View style={[styles.tabRail, { borderBottomColor: ROUTINE_MUTED }]}>
              <ScrollView
                horizontal
                style={styles.tabScroller}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabRow}
                keyboardShouldPersistTaps="handled"
              >
                {ROUTINE_CATEGORY_TABS.map((tab) => {
                  const selected = tab === category;
                  return (
                    <Pressable
                      key={tab}
                      onPress={() => {
                        setCategory(tab);
                        setSuggestedCategory(null);
                      }}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      testID={`crear-rutina-tab-${tab}`}
                      style={({ pressed }) => [
                        styles.tab,
                        {
                          borderBottomColor: selected ? ROUTINE_SELECTED : "transparent",
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { color: selected ? ROUTINE_SELECTED : ROUTINE_MUTED },
                        ]}
                      >
                        {tab}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.suggestionList}>
              {suggestions.map((suggestion) => (
                <Pressable
                  key={`${suggestion.category}-${suggestion.title}`}
                  onPress={() => enterSuggestionEditing(suggestion.title, suggestion.category)}
                  accessibilityRole="button"
                  accessibilityLabel={`Usar sugerencia ${suggestion.title}`}
                  testID={`crear-rutina-suggestion-${suggestion.title}`}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    {
                      backgroundColor: "rgba(0,0,0,0.28)",
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[styles.suggestionText, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {suggestion.title}
                  </Text>
                  {category === "Sugerido" ? (
                    <Text
                      style={[styles.suggestionCategory, { color: tabAccentColor }]}
                      numberOfLines={1}
                    >
                      {suggestion.category}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Reanimated.View>
          <Reanimated.View
            pointerEvents={suggestionEditing ? "auto" : "none"}
            style={[styles.undoPillLayer, undoPillFadeStyle]}
          >
            <Pressable
              onPress={undoSuggestionEditing}
              accessibilityRole="button"
              accessibilityLabel="Volver a las sugerencias"
              testID="crear-rutina-undo-suggestion"
              style={({ pressed }) => [
                styles.undoPill,
                { opacity: pressed ? 0.76 : 1 },
              ]}
            >
              <Feather name="arrow-left" size={16} color="#060A0F" />
              <Text style={styles.undoPillText}>Atrás</Text>
            </Pressable>
          </Reanimated.View>
        </View>

      </KeyboardAwareScrollViewCompat>

      <Modal
        visible={repeatSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRepeatSheetOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setRepeatSheetOpen(false)}
            accessibilityLabel="Cerrar selector de repetición"
          />
          <View style={[styles.repeatSheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Pressable
                onPress={() => setRepeatSheetOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar repetición"
                hitSlop={10}
                style={({ pressed }) => [styles.sheetHeaderSide, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Feather name="x" size={25} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Repetir</Text>
              <View style={styles.sheetHeaderSide} />
            </View>

            <View style={styles.repeatSettings}>
              <View style={[styles.settingRow, { backgroundColor: suggestionSurface }]}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Repite</Text>
                <View style={styles.repeatOptions}>
                  <Pressable
                    onPress={() => setDraftRepeatEnabled(false)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: !draftRepeatEnabled }}
                    testID="crear-rutina-repeat-off"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text style={[
                      styles.settingValue,
                      { color: !draftRepeatEnabled ? WIDGET_GREEN_SOLID : colors.mutedForeground },
                    ]}>
                      Apagado
                    </Text>
                  </Pressable>
                  <View style={[styles.optionDivider, { backgroundColor: colors.border }]} />
                  <Pressable
                    onPress={() => setDraftRepeatEnabled(true)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: draftRepeatEnabled }}
                    testID="crear-rutina-repeat-daily"
                    style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                  >
                    <Text style={[
                      styles.settingValue,
                      { color: draftRepeatEnabled ? WIDGET_GREEN_SOLID : colors.mutedForeground },
                    ]}>
                      Cada día
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View
                style={[
                  styles.settingRow,
                  {
                    backgroundColor: suggestionSurface,
                    opacity: draftRepeatEnabled ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Veces al día</Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setDraftTimesPerDay((current) => Math.max(1, current - 1))}
                    disabled={!draftRepeatEnabled || draftTimesPerDay <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Restar una vez al día"
                    testID="crear-rutina-times-minus"
                    style={({ pressed }) => [
                      styles.stepperButton,
                      {
                        backgroundColor: colors.background,
                        opacity: pressed ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Feather name="minus" size={17} color={colors.foreground} />
                  </Pressable>
                  <Text
                    testID="crear-rutina-times-value"
                    style={[styles.stepperValue, { color: colors.foreground }]}
                  >
                    {draftTimesPerDay}
                  </Text>
                  <Pressable
                    onPress={() => setDraftTimesPerDay((current) => Math.min(12, current + 1))}
                    disabled={!draftRepeatEnabled || draftTimesPerDay >= 12}
                    accessibilityRole="button"
                    accessibilityLabel="Sumar una vez al día"
                    testID="crear-rutina-times-plus"
                    style={({ pressed }) => [
                      styles.stepperButton,
                      {
                        backgroundColor: colors.background,
                        opacity: pressed ? 0.55 : 1,
                      },
                    ]}
                  >
                    <Feather name="plus" size={17} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            </View>

            <Pressable
              onPress={saveRepeatSettings}
              accessibilityRole="button"
              accessibilityLabel="Guardar repetición"
              testID="crear-rutina-repeat-apply"
              style={({ pressed }) => [
                styles.applyButton,
                { backgroundColor: WIDGET_GREEN_SOLID, opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={styles.applyButtonText}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
  },
  header: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  headerSide: {
    width: 72,
  },
  saveSide: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
    position: "absolute",
    left: 72,
    right: 72,
    textAlign: "center",
  },
  saveText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  titleInput: {
    marginTop: 35,
    minHeight: 40,
    paddingHorizontal: 0,
    fontFamily: "Manrope",
    fontSize: 21,
    fontWeight: "600",
  },
  descriptionInput: {
    marginTop: 10,
    minHeight: 36,
    paddingHorizontal: 0,
    paddingTop: 4,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
  },
  actionsBlock: {
    marginTop: 31,
    gap: 18,
  },
  simpleAction: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  actionText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  repeatActionText: {
    fontSize: 12,
  },
  validationText: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#E78B83",
    marginTop: 6,
  },
  suggestionsBlock: {
    marginTop: 67,
    position: "relative",
  },
  undoPillLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "flex-start",
  },
  undoPill: {
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  undoPillText: {
    color: "#060A0F",
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
  },
  tabRail: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabScroller: {
    marginHorizontal: -22,
  },
  tabRow: {
    gap: 27,
    paddingLeft: 22,
    paddingRight: 22,
  },
  tab: {
    paddingTop: 0,
    paddingBottom: 11,
    borderBottomWidth: 2,
  },
  tabText: {
    fontFamily: "Manrope",
    fontSize: 14,
  },
  suggestionList: {
    gap: 9,
    marginTop: 30,
  },
  suggestionRow: {
    minHeight: 50,
    borderRadius: 13,
    paddingHorizontal: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  suggestionText: {
    fontFamily: "Manrope",
    fontSize: 14,
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  suggestionCategory: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    flexShrink: 0,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  repeatSheet: {
    minHeight: "63%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 25,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.28)",
    marginBottom: 22,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  sheetHeaderSide: {
    width: 44,
  },
  sheetTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    position: "absolute",
    left: 44,
    right: 44,
    textAlign: "center",
  },
  repeatSettings: {
    marginTop: 38,
    gap: 18,
    flex: 1,
  },
  settingRow: {
    minHeight: 58,
    borderRadius: 14,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
  },
  repeatOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingValue: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
  },
  optionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    minWidth: 18,
    textAlign: "center",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  applyButton: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
  },
  applyButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#0E0E17",
  },
});
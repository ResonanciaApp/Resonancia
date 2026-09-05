import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import {
  ROUTINE_CATEGORY_TABS,
  ROUTINE_DAY_LABELS,
  ROUTINE_SUGGESTIONS,
  useRutina,
  type RoutineCategory,
} from "@/context/RutinaContext";
import { useColors } from "@/hooks/useColors";
import { SacredBackground } from "@/components/SacredBackground";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const ROUTINE_MUTED = "#7F7F7F";
const ROUTINE_SELECTED = "#F9F9F9";

function repeatLabel(repeatDays: number[]) {
  if (repeatDays.length === 7) return "Cada día";
  if (!repeatDays.length) return "Elegir días";
  return repeatDays.map((day) => ROUTINE_DAY_LABELS[day]).join(" · ");
}

export default function CrearRutinaScreen() {
  const colors = useColors();
  const { activeSceneId } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { addActivity } = useRutina();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RoutineCategory>("Sugerido");
  const [repeatDays, setRepeatDays] = useState<number[]>(ALL_DAYS);
  const [repeatSheetOpen, setRepeatSheetOpen] = useState(false);

  const topPad = Platform.OS === "web" ? 24 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 24 : Math.max(insets.bottom, 18);
  const suggestions = useMemo(() => ROUTINE_SUGGESTIONS[category], [category]);
  const canSave = title.trim().length > 0 && repeatDays.length > 0;
  const suggestionSurface =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(activeSceneId)
        ? "rgba(42,40,64,0.65)"
        : "rgba(255,255,255,0.05)";

  const toggleDay = (day: number) => {
    setRepeatDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  };

  const save = () => {
    if (!canSave) return;
    Keyboard.dismiss();
    addActivity({
      title,
      description,
      category,
      repeatDays,
    });
    router.back();
  };

  return (
    <View style={styles.root}>
      <SacredBackground />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad, paddingBottom: bottomPad + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
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
          value={title}
          onChangeText={setTitle}
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
            onPress={() => {
              Keyboard.dismiss();
              setRepeatSheetOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Repetición: ${repeatLabel(repeatDays)}`}
            testID="crear-rutina-repeat"
            style={({ pressed }) => [
              styles.simpleAction,
              { opacity: pressed ? 0.68 : 1 },
            ]}
          >
            <Feather name="repeat" size={19} color={WIDGET_GREEN_SOLID} />
            <Text style={[styles.actionText, { color: WIDGET_GREEN_SOLID }]}>
              {repeatLabel(repeatDays)}
            </Text>
          </Pressable>
          {!repeatDays.length ? (
            <Text style={styles.validationText}>Selecciona al menos un día.</Text>
          ) : null}
          <View
            style={styles.simpleAction}
            accessibilityState={{ disabled: true }}
          >
            <Feather name="plus-square" size={18} color={WIDGET_GREEN_SOLID} />
            <Text style={[styles.actionText, { color: WIDGET_GREEN_SOLID }]}>
              Adjuntar una práctica <Text style={styles.optionalText}>(opcional)</Text>
            </Text>
          </View>
        </View>

        <View style={styles.suggestionsBlock}>
          <View style={styles.tabRail}>
            <KeyboardAwareScrollViewCompat
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
                    onPress={() => setCategory(tab)}
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
                    <Text style={[styles.tabText, { color: selected ? ROUTINE_SELECTED : ROUTINE_MUTED }]}>
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </KeyboardAwareScrollViewCompat>
          </View>

          <View style={styles.suggestionList}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={`${suggestion.category}-${suggestion.title}`}
                onPress={() => setTitle(suggestion.title)}
                accessibilityRole="button"
                accessibilityLabel={`Usar sugerencia ${suggestion.title}`}
                testID={`crear-rutina-suggestion-${suggestion.title}`}
                style={({ pressed }) => [
                  styles.suggestionRow,
                  {
                    backgroundColor: suggestionSurface,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{suggestion.title}</Text>
              </Pressable>
            ))}
          </View>
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
              <View>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Repetición</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  ¿Qué días quieres reservar para ti?
                </Text>
              </View>
              <Pressable
                onPress={() => setRepeatDays(ALL_DAYS)}
                accessibilityRole="button"
                accessibilityLabel="Seleccionar cada día"
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={[styles.everyDayText, { color: WIDGET_GREEN_SOLID }]}>Cada día</Text>
              </Pressable>
            </View>

            <View style={styles.dayPicker}>
              {ROUTINE_DAY_LABELS.map((label, day) => {
                const selected = repeatDays.includes(day);
                return (
                  <Pressable
                    key={label}
                    onPress={() => toggleDay(day)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`Repetir el día ${label}`}
                    testID={`crear-rutina-day-${day}`}
                    style={({ pressed }) => [
                      styles.dayButton,
                      {
                        backgroundColor: selected ? WIDGET_GREEN_SOLID : "transparent",
                        borderColor: selected ? WIDGET_GREEN_SOLID : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: selected ? "#FFFFFF" : colors.foreground }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setRepeatSheetOpen(false)}
              disabled={!repeatDays.length}
              accessibilityRole="button"
              accessibilityLabel="Aplicar repetición"
              testID="crear-rutina-repeat-apply"
              style={({ pressed }) => [
                styles.applyButton,
                { backgroundColor: WIDGET_GREEN_SOLID, opacity: !repeatDays.length ? 0.35 : pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={styles.applyButtonText}>Aplicar</Text>
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
  optionalText: {
    fontSize: 11,
    fontWeight: "400",
    color: "rgba(41,139,115,0.72)",
  },
  validationText: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#E78B83",
    marginTop: 6,
  },
  suggestionsBlock: {
    marginTop: 67,
  },
  tabRail: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(127,127,127,0.5)",
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
    marginTop: 10,
  },
  suggestionRow: {
    minHeight: 60,
    borderRadius: 13,
    paddingHorizontal: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  suggestionText: {
    fontFamily: "Manrope",
    fontSize: 16,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  repeatSheet: {
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: {
    fontFamily: "Manrope",
    fontSize: 21,
    fontWeight: "700",
  },
  sheetSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 4,
  },
  everyDayText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 4,
  },
  dayPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 27,
    marginBottom: 27,
  },
  dayButton: {
    width: 39,
    height: 39,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
  },
  applyButton: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
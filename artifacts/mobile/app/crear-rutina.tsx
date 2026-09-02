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

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function repeatLabel(repeatDays: number[]) {
  if (repeatDays.length === 7) return "Cada día";
  if (!repeatDays.length) return "Elegir días";
  return repeatDays.map((day) => ROUTINE_DAY_LABELS[day]).join(" · ");
}

export default function CrearRutinaScreen() {
  const colors = useColors();
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
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="x" size={25} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Crear actividad</Text>
          <Pressable
            onPress={save}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Guardar actividad"
            testID="crear-rutina-save"
            style={({ pressed }) => ({ opacity: !canSave ? 0.32 : pressed ? 0.65 : 1 })}
          >
            <Text style={[styles.saveText, { color: WIDGET_GREEN_SOLID }]}>Guardar</Text>
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Nombra tu actividad</Text>
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
            Crea un pequeño espacio para aquello que quieres cuidar.
          </Text>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ej. Respirar antes de empezar el día"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.titleInput,
            {
              color: colors.foreground,
              borderColor: title.trim() ? WIDGET_GREEN_SOLID : colors.border,
              backgroundColor: colors.card,
            },
          ]}
          accessibilityLabel="Nombre de la actividad"
          testID="crear-rutina-title"
          returnKeyType="next"
          maxLength={80}
        />

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Descripción <Text style={{ color: colors.mutedForeground }}>(opcional)</Text></Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿Qué significa para ti?"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.descriptionInput,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Descripción de la actividad"
            testID="crear-rutina-description"
            maxLength={180}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Repetición</Text>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setRepeatSheetOpen(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Repetición: ${repeatLabel(repeatDays)}`}
            testID="crear-rutina-repeat"
            style={({ pressed }) => [
              styles.repeatRow,
              {
                borderColor: repeatDays.length ? `${WIDGET_GREEN_SOLID}AA` : colors.border,
                backgroundColor: colors.card,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <View style={styles.repeatIcon}>
              <Feather name="repeat" size={18} color={WIDGET_GREEN_SOLID} />
            </View>
            <View style={styles.repeatCopy}>
              <Text style={[styles.repeatTitle, { color: colors.foreground }]}>
                {repeatLabel(repeatDays)}
              </Text>
              <Text style={[styles.repeatHint, { color: colors.mutedForeground }]}>
                Elige los días en que quieres practicar
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
          {!repeatDays.length ? (
            <Text style={styles.validationText}>Selecciona al menos un día.</Text>
          ) : null}
        </View>

        <View style={styles.suggestionsBlock}>
          <View style={styles.sectionHeadingRow}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sugerencias</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
                Empieza con una idea y hazla tuya.
              </Text>
            </View>
            <Feather name="compass" size={20} color={WIDGET_GREEN_SOLID} />
          </View>

          <KeyboardAwareScrollViewCompat
            horizontal
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
                      backgroundColor: selected ? WIDGET_GREEN_SOLID : "transparent",
                      borderColor: selected ? WIDGET_GREEN_SOLID : colors.border,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.tabText, { color: selected ? "#FFFFFF" : colors.mutedForeground }]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </KeyboardAwareScrollViewCompat>

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
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <View style={styles.suggestionIcon}>
                  <Feather name="plus" size={17} color={WIDGET_GREEN_SOLID} />
                </View>
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{suggestion.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.attachBlock}>
          <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Práctica</Text>
          <View
            style={[
              styles.attachRow,
              { borderColor: colors.border, backgroundColor: colors.card, opacity: 0.55 },
            ]}
            accessibilityState={{ disabled: true }}
          >
            <View style={styles.attachIcon}>
              <Feather name="paperclip" size={17} color={colors.mutedForeground} />
            </View>
            <View style={styles.repeatCopy}>
              <Text style={[styles.repeatTitle, { color: colors.foreground }]}>Adjuntar una práctica</Text>
              <Text style={[styles.repeatHint, { color: colors.mutedForeground }]}>
                Próximamente podrás vincular una práctica de Resonancia.
              </Text>
            </View>
            <Feather name="lock" size={15} color={colors.mutedForeground} />
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
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  saveText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  intro: {
    marginTop: 35,
    marginBottom: 19,
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 320,
  },
  titleInput: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 17,
    fontFamily: "Manrope",
    fontSize: 15,
  },
  fieldBlock: {
    marginTop: 22,
  },
  fieldLabel: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 9,
  },
  descriptionInput: {
    minHeight: 88,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 15,
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
  },
  repeatRow: {
    minHeight: 69,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  repeatIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${WIDGET_GREEN_SOLID}18`,
  },
  repeatCopy: {
    flex: 1,
    minWidth: 0,
  },
  repeatTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  repeatHint: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  validationText: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "#E78B83",
    marginTop: 6,
  },
  suggestionsBlock: {
    marginTop: 31,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeadingCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
  },
  sectionSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 4,
  },
  tabRow: {
    gap: 8,
    paddingVertical: 16,
    paddingRight: 22,
  },
  tab: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  tabText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
  },
  suggestionList: {
    gap: 9,
  },
  suggestionRow: {
    minHeight: 51,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${WIDGET_GREEN_SOLID}18`,
  },
  suggestionText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 14,
  },
  attachBlock: {
    marginTop: 29,
  },
  attachRow: {
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  attachIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
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
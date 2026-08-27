import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

export type ContextSearchItem = {
  id: string;
  title: string;
  meta?: string;
  subtitle?: string;
  searchText?: string;
  image?: ImageSourcePropType;
};

type ContextSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  items: ContextSearchItem[];
  placeholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  onSelect: (item: ContextSearchItem) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ContextSearchModal({
  visible,
  onClose,
  items,
  placeholder,
  emptyTitle,
  emptySubtitle,
  onSelect,
}: ContextSearchModalProps) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
      Keyboard.dismiss();
    }
  }, [visible]);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];
    return items
      .filter((item) => normalize(item.searchText ?? `${item.title} ${item.meta ?? ""} ${item.subtitle ?? ""}`).includes(term))
      .slice(0, 30);
  }, [items, query]);

  const close = () => {
    Keyboard.dismiss();
    setQuery("");
    onClose();
  };

  const backgroundColor = theme.id === "tibet"
    ? theme.gradient[theme.gradient.length - 1] as string
    : colors.background;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={close}
      onShow={() => inputRef.current?.focus()}
    >
      <KeyboardAvoidingView style={styles.root} behavior="padding" keyboardVerticalOffset={0}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor }]}>
          {theme.id === "tibet" && (
            <LinearGradient
              colors={theme.gradient as [string, string, ...string[]]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
        </View>

        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 14,
              backgroundColor: theme.id === "tibet" ? "transparent" : backgroundColor,
            },
          ]}
        >
          <View style={styles.searchBar}>
            <Feather name="search" size={17} color={colors.foreground} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder={placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel={placeholder}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Borrar búsqueda">
                <Feather name="x" size={17} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={close} hitSlop={10} style={styles.closeButton} accessibilityLabel="Cerrar búsqueda">
            <Feather name="x" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        {query.trim().length === 0 ? (
          <View style={styles.empty}>
            <Feather name="search" size={42} color={colors.mutedForeground} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{emptyTitle}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{emptySubtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.resultsContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={36} color={colors.mutedForeground} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin resultados</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Intenta con otro término</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  close();
                  onSelect(item);
                }}
                style={({ pressed }) => [styles.resultRow, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.title}`}
              >
                {item.image ? (
                  <Image source={item.image} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.fallbackThumb, { backgroundColor: colors.card }]}>
                    <Feather name="file-text" size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.resultCopy}>
                  {item.meta && (
                    <Text style={[styles.resultMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  )}
                  <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.resultSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 45,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  input: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    padding: 0,
  },
  closeButton: {
    padding: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 70,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  resultsContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 5,
  },
  thumb: {
    width: 75,
    height: 75,
    borderRadius: 14,
  },
  fallbackThumb: {
    alignItems: "center",
    justifyContent: "center",
  },
  resultCopy: {
    flex: 1,
  },
  resultMeta: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginBottom: 3,
  },
  resultTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  resultSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
  },
});
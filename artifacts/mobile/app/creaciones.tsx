import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { getMixImage } from "@/config/mix-images";
import { MixPreset, useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";

const CATEGORY_LABELS: Record<string, string> = {
  nature: "Naturaleza",
  ambient: "Ambient",
  sleep: "Sueño",
  focus: "Enfoque",
  meditation: "Meditación",
  custom: "Personalizado",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CreacionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { presets, loadPreset, deletePreset } = useMixer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  function handleOpen(preset: MixPreset) {
    loadPreset(preset);
    router.back();
  }

  function handleDelete(preset: MixPreset) {
    Alert.alert(
      "Eliminar mezcla",
      `¿Eliminar "${preset.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deletePreset(preset.id),
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 100 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)/explore" as never)
            }
            hitSlop={10}
            style={[
              styles.backBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Feather name="sliders" size={18} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mis creaciones</Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {/* Empty state */}
        {presets.length === 0 ? (
          <View
            style={[
              styles.emptyWrap,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: "rgba(212,175,55,0.10)" },
              ]}
            >
              <Feather name="layers" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Todavía no guardaste mezclas
            </Text>
            <Text
              style={[styles.emptySub, { color: colors.mutedForeground }]}
            >
              Armá tu mezcla en "Mi Música" y guardala{"\n"}para encontrarla acá.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {presets.map((preset) => {
              const imageSource = getMixImage(preset.image ?? undefined);
              const catLabel =
                CATEGORY_LABELS[preset.category] ?? preset.category;
              const soundCount = preset.sounds.length;

              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handleOpen(preset)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {/* Thumbnail */}
                  <View
                    style={[
                      styles.thumb,
                      { backgroundColor: "rgba(212,175,55,0.08)" },
                    ]}
                  >
                    {imageSource ? (
                      <Image
                        source={imageSource}
                        style={styles.thumbImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <Feather name="layers" size={26} color={colors.primary} />
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.info}>
                    <Text
                      style={[styles.name, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {preset.name}
                    </Text>
                    {preset.description ? (
                      <Text
                        style={[styles.desc, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {preset.description}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <Text
                        style={[styles.meta, { color: colors.mutedForeground }]}
                      >
                        {catLabel}
                      </Text>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: colors.mutedForeground },
                        ]}
                      />
                      <Text
                        style={[styles.meta, { color: colors.mutedForeground }]}
                      >
                        {soundCount} sonido{soundCount !== 1 ? "s" : ""}
                      </Text>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: colors.mutedForeground },
                        ]}
                      />
                      <Text
                        style={[styles.meta, { color: colors.mutedForeground }]}
                      >
                        {formatDate(preset.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <Pressable
                    onPress={() => handleDelete(preset)}
                    hitSlop={12}
                    style={styles.deleteBtn}
                  >
                    <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  emptyWrap: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 40,
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  list: { gap: 10 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },

  thumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbImg: { width: "100%", height: "100%" },

  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  desc: { fontSize: 12, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  meta: { fontSize: 11 },
  dot: { width: 3, height: 3, borderRadius: 1.5 },

  deleteBtn: { padding: 6, flexShrink: 0 },
});

import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import type { Reflection } from "@workspace/api-client-react";
import { StoryShareModal, STORY_WIDTH } from "./StoryShareModal";
import { useCoverPresetCatalogState } from "@/lib/cover-preset-catalog";
import { canShareReflection } from "@/lib/reflection-story-logic";

function ReflectionArtwork({
  reflection,
  width,
  bgImageSource,
  onReady,
  onFailure,
}: {
  reflection: Reflection;
  width: number;
  bgImageSource: number | { uri: string } | undefined;
  onReady?: () => void;
  onFailure?: () => void;
}) {
  const exportScale = width / STORY_WIDTH;
  const isExport = width === STORY_WIDTH;

  return (
    <View
      style={[
        styles.storyArtwork,
        {
          width,
          height: width * 16 / 9,
          borderRadius: isExport ? 0 : 22,
        },
      ]}
    >
      <Image
        source={bgImageSource}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        onLoad={onReady}
        onError={onFailure}
      />
      <View pointerEvents="none" style={styles.storyShade} />
      <View
        pointerEvents="none"
        style={[
          styles.storyQuoteRegion,
          {
            top: 200 * exportScale,
            bottom: 200 * exportScale,
            paddingHorizontal: 120 * exportScale,
          },
        ]}
      >
        <Text
          numberOfLines={14}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={[
            styles.storyQuote,
            {
              fontSize: 60 * exportScale,
              lineHeight: 78 * exportScale,
            },
          ]}
        >
          {reflection.message.trim()}
        </Text>
      </View>
    </View>
  );
}

export function ReflectionShare({ reflection, onClose }: { reflection: Reflection; onClose: () => void }) {
  const { items: catalog, hydrated } = useCoverPresetCatalogState("reflection-story");
  const [selectedBgId, setSelectedBgId] = useState<string | null>(() => catalog[0]?.id ?? null);
  const [failedRemoteIds, setFailedRemoteIds] = useState<Set<string>>(() => new Set());
  const userSelectedBackground = useRef(false);

  useEffect(() => {
    if (catalog.length === 0) return;
    if (
      !selectedBgId
      || !catalog.some((item) => item.id === selectedBgId)
      || (hydrated && !userSelectedBackground.current && selectedBgId !== catalog[0].id)
    ) {
      setSelectedBgId(catalog[0].id);
    }
  }, [catalog, hydrated, selectedBgId]);

  const selectedItem = catalog.find((item) => item.id === selectedBgId);
  const selectedUsesFallback = !!selectedItem && failedRemoteIds.has(selectedItem.id);
  const selectedImageSource = selectedUsesFallback
    ? selectedItem.fallbackSource ?? selectedItem.source
    : selectedItem?.source;

  const checkConstraints = () => {
    if (!canShareReflection(reflection.message)) {
      throw new Error("El texto es demasiado largo para una historia.");
    }
  };

  return (
    <StoryShareModal
      title="Compartir"
      onClose={onClose}
      checkConstraints={checkConstraints}
      captureKey={`${selectedBgId ?? "initial"}:${selectedUsesFallback ? "fallback" : "primary"}`}
      showGenericShare={false}
      previewScale={0.85}
      renderArtwork={(width, isExport, callbacks) => (
        <ReflectionArtwork
          reflection={reflection}
          width={width}
          bgImageSource={selectedImageSource}
          onReady={callbacks.onReady}
          onFailure={() => {
            if (selectedItem?.fallbackSource && !selectedUsesFallback) {
              setFailedRemoteIds((current) => new Set(current).add(selectedItem.id));
              return;
            }
            callbacks.onFailure?.();
          }}
        />
      )}
    >
      <View style={styles.galleryContainer}>
        <ScrollView contentContainerStyle={styles.galleryContent} showsVerticalScrollIndicator={false}>
          {catalog.map((item) => {
            const isSelected = selectedBgId === item.id;
            const usesFallback = failedRemoteIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  userSelectedBackground.current = true;
                  setSelectedBgId(item.id);
                }}
                style={[styles.galleryItem, isSelected && styles.galleryItemSelected]}
              >
                <Image
                  source={usesFallback ? item.fallbackSource ?? item.source : item.source}
                  style={styles.galleryImage}
                  contentFit="cover"
                  onError={() => {
                    if (item.fallbackSource && !usesFallback) {
                      setFailedRemoteIds((current) => new Set(current).add(item.id));
                    }
                  }}
                />
                {isSelected && (
                  <View style={styles.checkOverlay}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </StoryShareModal>
  );
}

const styles = StyleSheet.create({
  storyArtwork: {
    overflow: "hidden",
    backgroundColor: "#191919",
  },
  storyShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  storyQuoteRegion: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  storyQuote: {
    width: "100%",
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.42)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  galleryContainer: {
    height: 180,
    marginBottom: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
  },
  galleryContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  galleryItem: {
    width: "23%",
    aspectRatio: 9 / 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  galleryItemSelected: {
    borderColor: "#8954EE",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(137, 84, 238, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
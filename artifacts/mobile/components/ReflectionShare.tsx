import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  useAnimatedScrollHandler,
  withTiming,
  withDelay,
  type SharedValue,
} from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";

import type { Reflection } from "@workspace/api-client-react";
import { createMyReflectionStory, type ReflectionStoryInput } from "@workspace/api-client-react";
import { StoryShareModal, STORY_WIDTH } from "./StoryShareModal";
import { StoryArtworkFrame, STORY_QUOTE_TOP, STORY_QUOTE_HEIGHT } from "./StoryArtworkFrame";
import { useCoverPresetCatalogState } from "@/lib/cover-preset-catalog";
import { useReflectionGalleryExpansion } from "@/hooks/useReflectionGalleryExpansion";
import { REFLECTION_GALLERY_HEIGHT, reflectionGalleryScrollIndicator } from "@/lib/reflection-gallery-layout";
import { useCurrentUserAvatarSource, type ProfileAvatarSource } from "@/lib/profile-avatar";
import { prepareReflectionAvatar } from "@/lib/reflection-story-avatar";
import { StoryAvatarLayer } from "./StoryAvatarLayer";
import {
  canShareReflection,
  clampReflectionStoryComposition,
  clampReflectionStoryTextScale,
  getStableIdempotencyKey,
  DEFAULT_REFLECTION_STORY_COMPOSITION,
  REFLECTION_STORY_MAX_BACKGROUND_SCALE,
  REFLECTION_STORY_MIN_BACKGROUND_SCALE,
  REFLECTION_STORY_TEXT_X_LIMIT,
  REFLECTION_STORY_TEXT_Y_LIMIT,
  type ReflectionStoryComposition,
  type ReflectionStoryAvatarPosition,
  DEFAULT_REFLECTION_STORY_AVATAR_POSITION,
  clampReflectionStoryAvatarPosition,
} from "@/lib/reflection-story-logic";

type ReflectionArtworkProps = {
  reflection: Reflection;
  width: number;
  bgImageSource: number | { uri: string } | undefined;
  composition: ReflectionStoryComposition;
  avatarSource?: ProfileAvatarSource;
  avatarPosition: ReflectionStoryAvatarPosition;
  onAvatarPositionChange: (position: ReflectionStoryAvatarPosition) => void;
  onReady?: () => void;
  onFailure?: () => void;
  onAvatarFailure?: () => void;
};

function InteractiveReflectionArtwork({
  reflection,
  width,
  bgImageSource,
  composition,
  avatarSource,
  avatarPosition,
  onAvatarPositionChange,
  onCompositionChange,
  onFailure,
  onAvatarFailure,
  displayScale,
}: ReflectionArtworkProps & {
  onCompositionChange: (composition: ReflectionStoryComposition) => void;
  displayScale?: SharedValue<number>;
}) {
  const height = width * 16 / 9;
  const backgroundScale = useSharedValue(composition.backgroundScale);
  const backgroundX = useSharedValue(composition.backgroundX);
  const backgroundY = useSharedValue(composition.backgroundY);
  const textX = useSharedValue(composition.textX);
  const textY = useSharedValue(composition.textY);
  const textScale = useSharedValue(composition.textScale ?? 1);
  const startTextScale = useSharedValue(composition.textScale ?? 1);
  const startScale = useSharedValue(composition.backgroundScale);
  const startBackgroundX = useSharedValue(composition.backgroundX);
  const startBackgroundY = useSharedValue(composition.backgroundY);
  const startTextX = useSharedValue(composition.textX);
  const startTextY = useSharedValue(composition.textY);
  const guideOpacity = useSharedValue(0);

  useEffect(() => {
    backgroundScale.value = composition.backgroundScale;
    backgroundX.value = composition.backgroundX;
    backgroundY.value = composition.backgroundY;
    textX.value = composition.textX;
    textY.value = composition.textY;
    textScale.value = composition.textScale ?? 1;
  }, [
    backgroundScale,
    backgroundX,
    backgroundY,
    composition,
    textX,
    textY,
    textScale,
  ]);

  const commitComposition = () => {
    "worklet";
    runOnJS(onCompositionChange)({
      backgroundScale: backgroundScale.value,
      backgroundX: backgroundX.value,
      backgroundY: backgroundY.value,
      textX: textX.value,
      textY: textY.value,
      textScale: textScale.value,
    });
  };

  const backgroundPan = useMemo(
    () => Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .minDistance(3)
      .onBegin(() => {
        guideOpacity.value = 1;
        startBackgroundX.value = backgroundX.value;
        startBackgroundY.value = backgroundY.value;
      })
      .onUpdate((event) => {
        const visibleWidth = width * (displayScale?.value ?? 1);
        const visibleHeight = height * (displayScale?.value ?? 1);
        const offsetLimit = (backgroundScale.value - 1) / 2;
        const nextX = Math.min(
          offsetLimit,
          Math.max(-offsetLimit, startBackgroundX.value + event.translationX / visibleWidth),
        );
        backgroundX.value = Math.abs(nextX * visibleWidth) < 8 ? 0 : nextX;
        const nextY = Math.min(
          offsetLimit,
          Math.max(-offsetLimit, startBackgroundY.value + event.translationY / visibleHeight),
        );
        backgroundY.value = Math.abs(nextY * visibleHeight) < 8 ? 0 : nextY;
      })
      .onFinalize(() => {
        guideOpacity.value = 0;
        commitComposition();
      }),
    [
      backgroundScale,
      backgroundX,
      backgroundY,
      guideOpacity,
      height,
      displayScale,
      startBackgroundX,
      startBackgroundY,
      width,
    ],
  );

  const backgroundPinch = useMemo(
    () => Gesture.Pinch()
      .onBegin(() => {
        startScale.value = backgroundScale.value;
      })
      .onUpdate((event) => {
        const nextScale = Math.min(
          REFLECTION_STORY_MAX_BACKGROUND_SCALE,
          Math.max(REFLECTION_STORY_MIN_BACKGROUND_SCALE, startScale.value * event.scale),
        );
        const offsetLimit = (nextScale - 1) / 2;
        backgroundScale.value = nextScale;
        backgroundX.value = Math.min(offsetLimit, Math.max(-offsetLimit, backgroundX.value));
        backgroundY.value = Math.min(offsetLimit, Math.max(-offsetLimit, backgroundY.value));
      })
      .onFinalize(commitComposition),
    [
      backgroundScale,
      backgroundX,
      backgroundY,
      startScale,
    ],
  );

  const textPan = useMemo(
    () => Gesture.Pan()
      .minPointers(1)
      .maxPointers(2)
      .averageTouches(true)
      .minDistance(1)
      .onBegin(() => {
        guideOpacity.value = 1;
        startTextX.value = textX.value;
        startTextY.value = textY.value;
      })
      .onUpdate((event) => {
        const visibleWidth = width * (displayScale?.value ?? 1);
        const visibleHeight = height * (displayScale?.value ?? 1);
        const nextX = Math.min(
          REFLECTION_STORY_TEXT_X_LIMIT,
          Math.max(-REFLECTION_STORY_TEXT_X_LIMIT, startTextX.value + event.translationX / visibleWidth),
        );
        textX.value = Math.abs(nextX * visibleWidth) < 8 ? 0 : nextX;
        const nextY = Math.min(
          REFLECTION_STORY_TEXT_Y_LIMIT,
          Math.max(-REFLECTION_STORY_TEXT_Y_LIMIT, startTextY.value + event.translationY / visibleHeight),
        );
        textY.value = Math.abs(nextY * visibleHeight) < 8 ? 0 : nextY;
      })
      .onFinalize(() => {
        guideOpacity.value = 0;
        commitComposition();
      }),
    [guideOpacity, height, startTextX, startTextY, textX, textY, width, displayScale],
  );

  const textPinch = useMemo(
    () => Gesture.Pinch()
      .onBegin(() => { startTextScale.value = textScale.value; })
      .onUpdate((event) => {
        textScale.value = clampReflectionStoryTextScale(startTextScale.value * event.scale);
      })
      .onFinalize(commitComposition),
    [startTextScale, textScale, backgroundScale, backgroundX, backgroundY, textX, textY, onCompositionChange],
  );
  const textGesture = useMemo(
    () => Gesture.Simultaneous(textPan, textPinch),
    [textPan, textPinch],
  );
  const backgroundGesture = useMemo(
    () => Gesture.Simultaneous(backgroundPan, backgroundPinch),
    [backgroundPan, backgroundPinch],
  );
  const backgroundTranslateStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: backgroundX.value * width },
      { translateY: backgroundY.value * height },
    ],
  }));
  const backgroundScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));
  const textPositionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: textX.value * width },
      { translateY: textY.value * height },
      { scale: textScale.value },
    ],
  }));
  const guideStyle = useAnimatedStyle(() => ({
    opacity: guideOpacity.value,
  }));

  return (
    <View style={[styles.storyArtwork, { width, height, borderRadius: 22 }]}>
      <GestureDetector gesture={backgroundGesture}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
        <Animated.View style={[StyleSheet.absoluteFillObject, backgroundTranslateStyle]}>
          <Animated.View style={[StyleSheet.absoluteFillObject, backgroundScaleStyle]}>
            <Image
              source={bgImageSource}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              onError={onFailure}
            />
          </Animated.View>
        </Animated.View>
        </Animated.View>
      </GestureDetector>
      <View pointerEvents="none" style={styles.storyShade} />
      <Animated.View pointerEvents="none" style={[styles.verticalGuide, guideStyle]} />
      <Animated.View pointerEvents="none" style={[styles.horizontalGuide, guideStyle]} />
      <GestureDetector gesture={textGesture}>
        <Animated.View
          style={[
            styles.interactiveQuoteRegion,
            {
              top: STORY_QUOTE_TOP * width / STORY_WIDTH,
              height: STORY_QUOTE_HEIGHT * width / STORY_WIDTH,
              paddingHorizontal: 120 * width / STORY_WIDTH,
            },
            textPositionStyle,
          ]}
        >
          <Text
            numberOfLines={14}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={[
              styles.storyQuote,
              {
                fontSize: 60 * width / STORY_WIDTH,
                lineHeight: 78 * width / STORY_WIDTH,
              },
            ]}
          >
            {reflection.message.trim()}
          </Text>
        </Animated.View>
      </GestureDetector>
      {avatarSource && <StoryAvatarLayer source={avatarSource} width={width}
        position={avatarPosition} onPositionChange={onAvatarPositionChange}
        displayScale={displayScale} guideOpacity={guideOpacity} onFailure={onAvatarFailure ?? onFailure} />}
    </View>
  );
}

export function ReflectionShare({ reflection, onClose }: { reflection: Reflection; onClose: () => void }) {
  const currentAvatarSource = useCurrentUserAvatarSource();
  const [includedAvatar, setIncludedAvatar] = useState<ProfileAvatarSource>();
  const [avatarPosition, setAvatarPosition] = useState(DEFAULT_REFLECTION_STORY_AVATAR_POSITION);
  const updateAvatarPosition = (position: ReflectionStoryAvatarPosition) => setAvatarPosition(clampReflectionStoryAvatarPosition(position));
  const preparedAvatar = useRef<{ key: string; promise: Promise<string> } | undefined>(undefined);
  const { expanded, toggle, heightReduction } = useReflectionGalleryExpansion();
  const galleryViewport = useSharedValue(REFLECTION_GALLERY_HEIGHT - 16);
  const galleryContentHeight = useSharedValue(0);
  const galleryScrollOffset = useSharedValue(0);
  const galleryScrollOpacity = useSharedValue(0);
  const galleryScrollActivity = useSharedValue(0);
  useEffect(() => () => {
    cancelAnimation(galleryScrollOpacity);
    cancelAnimation(galleryScrollActivity);
  }, [galleryScrollOpacity, galleryScrollActivity]);
  useAnimatedReaction(
    () => galleryScrollActivity.value,
    (active, previous) => {
      if (active === previous) return;
      galleryScrollOpacity.value = withTiming(active, {
        duration: active ? 160 : 240,
        reduceMotion: ReduceMotion.System,
      });
    },
  );
  const galleryScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (event.contentOffset.y === galleryScrollOffset.value) return;
      galleryScrollOffset.value = event.contentOffset.y;
      cancelAnimation(galleryScrollActivity);
      galleryScrollActivity.value = 1;
      galleryScrollActivity.value = withDelay(120, withTiming(0, {
        duration: 0,
        reduceMotion: ReduceMotion.System,
      }), ReduceMotion.Never);
    },
    onMomentumEnd: () => {
      cancelAnimation(galleryScrollActivity);
      galleryScrollActivity.value = 0;
    },
  });
  const galleryScrollTrackStyle = useAnimatedStyle(() => ({
    opacity: galleryContentHeight.value > galleryViewport.value ? galleryScrollOpacity.value : 0,
  }));
  const galleryScrollThumbStyle = useAnimatedStyle(() => {
    const indicator = reflectionGalleryScrollIndicator(
      galleryViewport.value, galleryContentHeight.value, galleryScrollOffset.value,
    );
    return { height: indicator.height, transform: [{ translateY: indicator.translateY }] };
  });
  const gallerySizeStyle = useAnimatedStyle(() => ({
    height: REFLECTION_GALLERY_HEIGHT + heightReduction.value,
  }));
  const qc = useQueryClient();
  const idempotencyState = useRef({ hash: "", key: "" });
  const { items: catalog, hydrated } = useCoverPresetCatalogState("reflection-story");
  const [selectedBgId, setSelectedBgId] = useState<string | null>(() => catalog[0]?.id ?? null);
  const [failedRemoteIds, setFailedRemoteIds] = useState<Set<string>>(() => new Set());
  const [composition, setComposition] = useState<ReflectionStoryComposition>(
    DEFAULT_REFLECTION_STORY_COMPOSITION,
  );
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
      throw new Error("La reflexión supera el límite de 160 caracteres para una historia.");
    }
  };
  const updateComposition = (nextComposition: ReflectionStoryComposition) => {
    setComposition(clampReflectionStoryComposition(nextComposition));
  };
  const resetComposition = () => {
    setComposition(DEFAULT_REFLECTION_STORY_COMPOSITION);
    setAvatarPosition(DEFAULT_REFLECTION_STORY_AVATAR_POSITION);
  };

  const handleBeforeInstagramShare = async () => {
    try {
      let avatarImagePath: string | null = null;
      if (includedAvatar) {
        const key = JSON.stringify(includedAvatar);
        if (preparedAvatar.current?.key !== key) {
          const promise = prepareReflectionAvatar(includedAvatar);
          preparedAvatar.current = { key, promise };
          promise.catch(() => { if (preparedAvatar.current?.promise === promise) preparedAvatar.current = undefined; });
        }
        avatarImagePath = await preparedAvatar.current!.promise;
      }
      const payload: ReflectionStoryInput = {
        avatarImagePath,
        avatarX: includedAvatar ? avatarPosition.x : null,
        avatarY: includedAvatar ? avatarPosition.y : null,
        message: reflection.message,
        category: reflection.category,
        backgroundPresetKey: selectedItem?.key ?? "01",
        backgroundScale: composition.backgroundScale,
        backgroundX: composition.backgroundX,
        backgroundY: composition.backgroundY,
        textX: composition.textX,
        textY: composition.textY,
        textScale: composition.textScale ?? 1,
      };

      idempotencyState.current = getStableIdempotencyKey(payload, idempotencyState.current);

      await createMyReflectionStory(payload, {
        headers: {
          "Idempotency-Key": idempotencyState.current.key,
        }
      });
      // Invalidate the list so the new reflection appears in the gallery
      qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/me/reflection-stories' });
    } catch (err) {
      throw new Error("No se pudo guardar la historia en la galería.");
    }
  };

  const compositionIsModified =
    Math.abs(composition.backgroundScale - 1) > 0.0001
    || Math.abs(composition.backgroundX) > 0.0001
    || Math.abs(composition.backgroundY) > 0.0001
    || Math.abs(composition.textX) > 0.0001
    || Math.abs(composition.textY) > 0.0001
    || Math.abs((composition.textScale ?? 1) - 1) > 0.0001
    || (!!includedAvatar && (Math.abs(avatarPosition.x - DEFAULT_REFLECTION_STORY_AVATAR_POSITION.x) > 0.0001
      || Math.abs(avatarPosition.y - DEFAULT_REFLECTION_STORY_AVATAR_POSITION.y) > 0.0001));

  return (
    <StoryShareModal
      title="Compartir"
      onClose={onClose}
      checkConstraints={checkConstraints}
      onBeforeInstagramShare={handleBeforeInstagramShare}
      captureKey={[
        selectedBgId ?? "initial",
        selectedUsesFallback ? "fallback" : "primary",
        JSON.stringify(includedAvatar) ?? "no-avatar",
        avatarPosition.x.toFixed(6),
        avatarPosition.y.toFixed(6),
        composition.backgroundScale.toFixed(4),
        composition.backgroundX.toFixed(4),
        composition.backgroundY.toFixed(4),
        composition.textX.toFixed(4),
        composition.textY.toFixed(4),
        (composition.textScale ?? 1).toFixed(4),
      ].join(":")}
      assetKey={`${selectedBgId ?? "initial"}:${selectedUsesFallback ? "fallback" : "primary"}:${JSON.stringify(includedAvatar)}`}
      showGenericShare={false}
      previewScale={0.8}
      previewOffsetY={-20}
      previewHeightReduction={heightReduction}
      closeOnLeft
      titleFontSize={15}
      titleOffsetY={-15}
      headerControlsOffsetY={-15}
      lightInstagramButton
      compactFooter
      closeButtonBackgroundColor="rgba(255,255,255,0.1)"
      instagramActionTextStyle={styles.instagramActionText}
      headerLeftActionGap={7}
      headerLeftAction={compositionIsModified ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Restablecer composición"
          onPress={resetComposition}
          style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
        >
          <Feather name="rotate-ccw" size={25} color="#F9F9F9" />
        </Pressable>
      ) : null}
      headerRightAction={<View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable accessibilityRole="button"
          accessibilityLabel={includedAvatar ? "Quitar avatar de la imagen" : "Añadir avatar a la imagen"}
          accessibilityState={{ selected: !!includedAvatar, disabled: !currentAvatarSource }}
          disabled={!currentAvatarSource}
          onPress={() => setIncludedAvatar(current => current ? undefined : currentAvatarSource)}
          style={{ width: 43, height: 43, borderRadius: 22, overflow: "hidden",
            backgroundColor: "transparent" }}>
          {currentAvatarSource ? <Image source={currentAvatarSource}
            contentFit="cover" style={{ width: "100%", height: "100%", opacity: includedAvatar ? 1 : 0.8 }} /> : null}
          {includedAvatar && <View pointerEvents="none" style={[StyleSheet.absoluteFillObject,
            { backgroundColor: "rgba(0,0,0,0.7)", borderWidth: 1,
              borderColor: "rgba(255,255,255,0.5)", borderRadius: 22 }]} />}
        </Pressable>
      </View>}
      renderArtwork={(width, isExport, callbacks, previewContext) => {
        const handleFailure = () => {
          if (selectedItem?.fallbackSource && !selectedUsesFallback) {
            setFailedRemoteIds((current) => new Set(current).add(selectedItem.id));
            return;
          }
          callbacks.onFailure?.();
        };
        return isExport ? (
          <StoryArtworkFrame
            message={reflection.message}
            width={width}
            bgImageSource={selectedImageSource}
            composition={composition}
            avatarSource={includedAvatar}
            avatarPosition={avatarPosition}
            onAvatarFailure={callbacks.onFailure}
            onReady={callbacks.onReady}
            onFailure={handleFailure}
          />
        ) : (
          <InteractiveReflectionArtwork
            reflection={reflection}
            width={width}
            bgImageSource={selectedImageSource}
            composition={composition}
            avatarSource={includedAvatar}
            avatarPosition={avatarPosition}
            onAvatarPositionChange={updateAvatarPosition}
            onAvatarFailure={callbacks.onFailure}
            onCompositionChange={updateComposition}
            displayScale={previewContext?.displayScale}
            onFailure={handleFailure}
          />
        );
      }}
    >
      <View style={styles.gallerySection} pointerEvents="box-none">
        <View style={styles.galleryControls} pointerEvents="box-none">
          <Pressable
            onPress={toggle}
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Reducir grilla de fondos" : "Ampliar grilla de fondos"}
            accessibilityState={{ expanded }}
            style={({ pressed }) => [styles.galleryToggleButton, pressed && { opacity: 0.65 }]}
          >
            <View style={styles.galleryToggle}>
              <Feather name={expanded ? "chevrons-down" : "chevrons-up"} size={19} color="#F9F9F9" />
            </View>
          </Pressable>
        </View>
      <Animated.View style={[styles.galleryContainer, gallerySizeStyle]}>
        <Animated.ScrollView
          testID="reflection-background-gallery"
          contentContainerStyle={styles.galleryContent}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => { galleryViewport.value = event.nativeEvent.layout.height; }}
          onContentSizeChange={(_width, height) => { galleryContentHeight.value = height; }}
          onScroll={galleryScrollHandler}
          scrollEventThrottle={16}
        >
          {catalog.map((item) => {
            const isSelected = selectedBgId === item.id;
            const usesFallback = failedRemoteIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  userSelectedBackground.current = true;
                  setSelectedBgId(item.id);
                  setComposition((current) => ({
                    ...current,
                    backgroundScale: 1,
                    backgroundX: 0,
                    backgroundY: 0,
                  }));
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
                    <Feather name="check" size={26} color="#F9F9F9" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </Animated.ScrollView>
        <Animated.View pointerEvents="none" accessible={false}
          testID="reflection-gallery-scroll-track"
          style={[styles.galleryScrollTrack, galleryScrollTrackStyle]}>
          <Animated.View style={[styles.galleryScrollThumb, galleryScrollThumbStyle]} />
        </Animated.View>
      </Animated.View>
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
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  verticalGuide: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    backgroundColor: "#F075B3",
    shadowColor: "#F075B3",
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  horizontalGuide: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 1,
    backgroundColor: "#F075B3",
    shadowColor: "#F075B3",
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  storyQuoteRegion: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  interactiveQuoteRegion: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  storyQuote: {
    flexShrink: 1,
    width: "100%",
    color: "#F9F9F9",
    fontFamily: "CormorantGaramond",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.42)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  galleryContainer: {
    height: REFLECTION_GALLERY_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 8,
  },
  gallerySection: {
    // Keep the external control inside touchable bounds without consuming
    // preview space: its padding and negative margin cancel each other.
    paddingTop: 48,
    marginTop: -48,
    marginBottom: 20,
  },
  galleryControls: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 1,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  galleryToggleButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  galleryToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  instagramActionText: {
    fontSize: 13,
    fontFamily: "Manrope650",
    fontWeight: "400",
  },
  resetButtonPressed: {
    opacity: 0.65,
  },
  galleryContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  galleryScrollTrack: {
    position: "absolute",
    top: 8,
    bottom: 8,
    right: 2,
    width: 3,
    borderRadius: 2,
    backgroundColor: "rgba(249,249,249,0.13)",
    overflow: "hidden",
  },
  galleryScrollThumb: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "rgba(249,249,249,0.75)",
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
    borderColor: "#F9F9F9",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249,249,249,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
});
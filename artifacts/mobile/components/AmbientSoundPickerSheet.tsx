import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getSoundImage } from "@/config/sound-images";
import { BLUR_PLACEHOLDER } from "@/constants/imagePlaceholder";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SOUNDS, hasSoundFile, type MixSound } from "@/data/sounds";
import { REMOTE_SOUND_MAP } from "@/lib/remoteSoundMap";

function isPlayable(id: string): boolean {
  return hasSoundFile(id) || !!REMOTE_SOUND_MAP[id];
}

const PLAYABLE_SOUNDS = SOUNDS.filter((sound) => isPlayable(sound.id));

type Props = {
  visible: boolean;
  selectedSoundId: string | null;
  onClose: () => void;
  initialAmbientVolume?: number;
  onPreviewStart?: (soundId: string) => void;
  onAmbientVolumeChange?: (volume: number) => void;
};

export function AmbientSoundPickerSheet({
  visible,
  selectedSoundId,
  onClose,
  initialAmbientVolume,
  onPreviewStart,
  onAmbientVolumeChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const [localSelected, setLocalSelected] = useState<string | null>(selectedSoundId);
  const [ambientVolume, setAmbientVolume] = useState(initialAmbientVolume ?? 0.5);

  useEffect(() => {
    if (!visible) return;
    setLocalSelected(selectedSoundId);
    setAmbientVolume(initialAmbientVolume ?? 0.5);
  }, [initialAmbientVolume, selectedSoundId, visible]);

  const selectSound = (soundId: string) => {
    setLocalSelected(soundId);
    onPreviewStart?.(soundId);
  };

  const changeVolume = (volume: number) => {
    setAmbientVolume(volume);
    onAmbientVolumeChange?.(volume);
  };

  const selectedSound = localSelected
    ? SOUNDS.find((sound) => sound.id === localSelected) ?? null
    : null;

  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const topPad = (Platform.OS === "web" ? 20 : insets.top) + 8;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View
        style={[
          styles.root,
          { backgroundColor: theme.gradient[theme.gradient.length - 1] as string },
        ]}
      >
        <LinearGradient
          colors={theme.gradient as unknown as [string, string, ...string[]]}
          locations={theme.gradientLocations}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button">
            <Text style={styles.closeText}>Cerrar</Text>
          </Pressable>
          <Text style={styles.topTitle}>Sonido de fondo</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 116 + bottomPad },
          ]}
        >
          <Text style={styles.sectionTitle}>Elige un sonido</Text>
          <View style={styles.grid}>
            {PLAYABLE_SOUNDS.map((sound) => (
              <SoundCard
                key={sound.id}
                sound={sound}
                selected={localSelected === sound.id}
                onPress={() => selectSound(sound.id)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad + 12 }]}>
          <AmbientVolumeControl
            sound={selectedSound}
            volume={ambientVolume}
            onVolumeChange={changeVolume}
          />
        </View>
      </View>
    </Modal>
  );
}

function AmbientVolumeControl({
  sound,
  volume,
  onVolumeChange,
}: {
  sound: MixSound | null;
  volume: number;
  onVolumeChange: (volume: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const trackWidth = useRef(0);
  const trackPageX = useRef(0);
  const image = sound ? getSoundImage(sound.id) : null;

  const computeValue = (pageX: number) =>
    Math.max(0, Math.min(1, (pageX - trackPageX.current) / (trackWidth.current || 1)));

  return (
    <View style={[styles.volumeControl, !sound && styles.volumeControlDisabled]}>
      <View style={styles.footerThumb}>
        {image ? (
          <ExpoImage source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Feather name="volume-2" size={19} color="rgba(255,255,255,0.5)" />
        )}
      </View>

      <View style={styles.volumeMain}>
        <Text style={styles.volumeLabel} numberOfLines={1}>
          {sound?.name ?? "Selecciona un sonido"}
        </Text>
        <View style={styles.sliderRow}>
          <View
            ref={trackRef}
            style={styles.sliderHit}
            pointerEvents={sound ? "auto" : "none"}
            onLayout={(event) => {
              trackWidth.current = event.nativeEvent.layout.width;
            }}
            onStartShouldSetResponder={() => Boolean(sound)}
            onResponderGrant={(event) => {
              trackRef.current?.measure((_x, _y, _width, _height, pageX) => {
                trackPageX.current = pageX;
                onVolumeChange(computeValue(event.nativeEvent.pageX));
              });
            }}
            onResponderMove={(event) => onVolumeChange(computeValue(event.nativeEvent.pageX))}
          >
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  { width: `${(sound ? volume : 0) * 100}%` as `${number}%` },
                ]}
              />
              {sound && (
                <View
                  style={[
                    styles.sliderThumb,
                    { left: `${volume * 100}%` as `${number}%` },
                  ]}
                />
              )}
            </View>
          </View>
          <Feather name="volume-2" size={18} color="#F4F4F4" />
        </View>
      </View>
    </View>
  );
}

function SoundCard({
  sound,
  selected,
  onPress,
}: {
  sound: MixSound;
  selected: boolean;
  onPress: () => void;
}) {
  const image = getSoundImage(sound.id);

  return (
    <View style={styles.cardWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`Escuchar ${sound.name}`}
        style={({ pressed }) => [
          styles.card,
          selected && styles.cardSelected,
          pressed && styles.cardPressed,
        ]}
      >
        {image ? (
          <ExpoImage
            source={image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            placeholder={BLUR_PLACEHOLDER}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardFallback]} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.32)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {selected && (
          <View style={styles.selectedBadge}>
            <Feather name="check" size={14} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
      <Text style={[styles.cardName, selected && styles.cardNameSelected]} numberOfLines={2}>
        {sound.name}
      </Text>
    </View>
  );
}

const GRID_HORIZONTAL_PADDING = 16;
const GRID_GAP = 12;
const CARD_WIDTH = `${(100 - 4) / 3}%` as `${number}%`;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  topBarSpacer: {
    width: 52,
  },
  closeText: {
    width: 52,
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.84)",
  },
  topTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: 22,
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
  },
  sectionTitle: {
    marginBottom: 17,
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: "2%",
    rowGap: 18,
  },
  cardWrap: {
    width: CARD_WIDTH,
  },
  card: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: "#BE9650",
  },
  cardPressed: {
    opacity: 0.78,
  },
  cardFallback: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#BE9650",
  },
  cardName: {
    minHeight: 35,
    marginTop: 7,
    paddingHorizontal: 2,
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.78)",
  },
  cardNameSelected: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(5,4,12,0.9)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  volumeControl: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  volumeControlDisabled: {
    opacity: 0.58,
  },
  footerThumb: {
    width: 50,
    height: 50,
    overflow: "hidden",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  volumeMain: {
    flex: 1,
    minWidth: 0,
  },
  volumeLabel: {
    marginBottom: 8,
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  sliderHit: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  sliderFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  sliderThumb: {
    position: "absolute",
    top: -5,
    width: 13,
    height: 13,
    marginLeft: -6,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
});
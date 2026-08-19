import React from "react";
import { AudioMiniPlayer } from "@/components/AudioMiniPlayer";
import type { DescansoSound } from "@/data/descanso-sounds";

interface Props {
  sound: DescansoSound;
  isPlaying: boolean;
  /** Muestra una ruedita en lugar del play/pause mientras el audio carga. */
  isLoading?: boolean;
  onToggle: () => void;
  onStop: () => void;
  bottomOffset: number;
  closeColor: string;
  isExpanded: boolean;
  topOffset: number;
  onExpand: () => void;
}

export function DormirMiniPlayer({
  sound,
  isPlaying,
  isLoading,
  onToggle,
  onStop,
  bottomOffset,
  closeColor,
  isExpanded,
  topOffset,
  onExpand,
}: Props) {
  return (
    <AudioMiniPlayer
      visible
      animationKey={sound.id}
      bottomOffset={bottomOffset}
      topOffset={topOffset}
      image={sound.image}
      title={sound.label}
      subtitle={sound.categoryId === "binaural" ? "Sonidos Binaurales" : "Ambientales"}
      isPlaying={isPlaying}
      isLoading={isLoading}
      closeColor={closeColor}
      expanded={isExpanded}
      onPress={onExpand}
      onToggle={onToggle}
      onClose={onStop}
    />
  );
}
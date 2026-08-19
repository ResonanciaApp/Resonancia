import React, { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import { AudioMiniPlayer } from "@/components/AudioMiniPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { sessionMiniPlayerEvents } from "@/lib/miniPlayerEvents";

interface Props {
  bottomOffset: number;
  topOffset: number;
  /** Oculta la barra sin desmontar (mantiene viva la suscripción al evento). */
  suppressed?: boolean;
}

export function SessionMiniPlayer({ bottomOffset, topOffset, suppressed }: Props) {
  const { currentSession, isPlaying, isLoading, pauseResume, stop, progress } = usePlayer();
  const [visible, setVisible] = useState(false);
  const [entryFrom, setEntryFrom] = useState<"bottom" | "top">("bottom");
  const visibleRef = useRef(false);

  useEffect(() => {
    const unsub = sessionMiniPlayerEvents.subscribe((from) => {
      if (visibleRef.current) return;
      visibleRef.current = true;
      setEntryFrom(from);
      setVisible(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!currentSession) {
      visibleRef.current = false;
      setVisible(false);
    }
  }, [currentSession]);

  return currentSession ? (
    <AudioMiniPlayer
      visible={visible}
      animationKey="session"
      entryFrom={entryFrom}
      bottomOffset={bottomOffset}
      topOffset={topOffset}
      image={currentSession.image as any}
      title={currentSession.title}
      subtitle={currentSession.categoryLabel}
      isPlaying={isPlaying}
      isLoading={isLoading}
      progress={progress}
      hidden={suppressed}
      onPress={() => router.push("/player" as never)}
      onToggle={pauseResume}
      onClose={() => {
        visibleRef.current = false;
        stop();
      }}
    />
  ) : null;
}
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import type { InspirationPublicContent } from "@/types/inspiration";

/** Same cover positioning and uniform overlay as the editorial Admin preview. */
export function InspirationArtwork({ content, onReady, onFailure }: {
  content: InspirationPublicContent; onReady?: () => void; onFailure?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#191919" }]} pointerEvents={failed ? "auto" : "none"}>
    <Image key={`${content.imageUrl}-${attempt}`} source={{ uri: content.imageUrl }} style={StyleSheet.absoluteFillObject}
      contentFit="cover" contentPosition={{ left: `${content.imagePositionX}%`, top: `${content.imagePositionY}%` }}
      onDisplay={() => { setFailed(false); onReady?.(); }} onError={() => { setFailed(true); onFailure?.(); }} />
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${content.overlayOpacity})` }]} />
    {failed && <Pressable accessibilityRole="button" onPress={() => { setFailed(false); setAttempt(a => a + 1); }} style={{ alignSelf: "center", marginTop: 180, padding: 14, backgroundColor: "#222" }}>
      <Text style={{ color: "#fff" }}>No se pudo cargar la imagen. Reintentar</Text>
    </Pressable>}
  </View>;
}
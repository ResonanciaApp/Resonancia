import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import * as Font from "expo-font";

import { InspirationArtwork } from "./InspirationArtwork";
import type { InspirationDay } from "@/types/inspiration";
import { StoryShareModal, STORY_WIDTH, STORY_HEIGHT } from "./StoryShareModal";

const WORDMARK = require("@/assets/images/logo-resonancia-new.png");

async function loadWebImage(source: string): Promise<HTMLImageElement> {
  const image = new window.Image();
  image.crossOrigin = "anonymous";
  image.src = source;
  await image.decode();
  return image;
}

function wrappedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      if (context.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let chunk = "";
        for (const character of word) {
          if (chunk && context.measureText(chunk + character).width > maxWidth) {
            lines.push(chunk);
            chunk = character;
          } else {
            chunk += character;
          }
        }
        line = chunk;
        continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function makeWebImage(day: InspirationDay): Promise<Blob> {
  const content = day.content!;
  await document.fonts.ready;
  await document.fonts.load("700 56px Manrope");
  if (!Font.isLoaded("Manrope")) {
    throw new Error("La tipografía aún no está lista. Vuelve a intentarlo.");
  }
  const image = await loadWebImage(content.imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite generar la imagen.");

  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  const availableX = canvas.width - imageWidth;
  const availableY = canvas.height - imageHeight;
  context.drawImage(
    image,
    availableX * content.imagePositionX / 100,
    availableY * content.imagePositionY / 100,
    imageWidth,
    imageHeight,
  );
  context.fillStyle = `rgba(0,0,0,${Math.max(content.overlayOpacity, 0.28)})`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const quoteSize = content.quote.length > 360 ? 42 : content.quote.length > 220 ? 48 : 56;
  context.fillStyle = "#F9F9F9";
  context.font = `700 ${quoteSize}px Manrope`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = wrappedLines(context, content.quote, 820);
  if (lines.length > 12) {
    throw new Error("La frase es demasiado larga para una historia sin recortarse.");
  }
  const lineHeight = Math.round(quoteSize * 1.32);
  const startY = 920 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, canvas.width / 2, startY + index * lineHeight));

  context.font = "600 34px Manrope";
  context.letterSpacing = "9px";
  context.fillText("RESONANCIA", canvas.width / 2, 1660);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("No se pudo generar el archivo PNG.")),
      "image/png",
    );
  });
}

function StoryArtwork({
  day,
  width,
  onReady,
  onFailure,
  onLogoReady,
}: {
  day: InspirationDay;
  width: number;
  onReady?: () => void;
  onFailure?: () => void;
  onLogoReady?: () => void;
}) {
  const content = day.content!;
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
      <InspirationArtwork content={content} onReady={onReady} onFailure={onFailure} />
      <View pointerEvents="none" style={styles.storyShade} />
      <View
        pointerEvents="none"
        style={[
          styles.storyQuoteRegion,
          {
            top: 500 * exportScale,
            bottom: 500 * exportScale,
            paddingHorizontal: 120 * exportScale,
          },
        ]}
      >
        <Text
          numberOfLines={12}
          adjustsFontSizeToFit
          minimumFontScale={0.42}
          style={[
            styles.storyQuote,
            {
              fontSize: 60 * exportScale,
              lineHeight: 78 * exportScale,
            },
          ]}
        >
          {content.quote}
        </Text>
      </View>
      <Image
        source={WORDMARK}
        contentFit="contain"
        onDisplay={onLogoReady}
        style={[
          styles.storyLogo,
          {
            width: isExport ? 540 : width * 0.57,
            height: isExport ? 150 : width * 0.16,
            bottom: isExport ? 178 : width * 0.11,
          },
        ]}
      />
    </View>
  );
}

/** Dedicated capture contains only public editorial artwork, the daily quote and RESONANCIA branding. */
export function InspirationShare({ day, onClose }: { day: InspirationDay; onClose: () => void }) {
  const checkConstraints = () => {
    if (day.content!.quote.trim().length > 520) {
      throw new Error("La frase es demasiado larga para una historia sin recortarse.");
    }
  };

  return (
    <StoryShareModal
      title="Compartir"
      onClose={onClose}
      checkConstraints={checkConstraints}
      makeWebImage={() => makeWebImage(day)}
      requiresLogo
      renderArtwork={(width, isExport, callbacks) => (
        <StoryArtwork day={day} width={width} {...callbacks} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  storyArtwork: {
    overflow: "hidden",
    backgroundColor: "#191919",
  },
  storyShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
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
  storyLogo: {
    position: "absolute",
    alignSelf: "center",
  },
});
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { fitHomeName, homeNameCandidates } from "@/lib/home-display-name";

/** Measure native glyphs (including the final comma), never guess by character count. */
export const HomeDisplayName = React.memo(function HomeDisplayName({ name }: { name: string }) {
  const { fontScale } = useWindowDimensions();
  return <MeasuredName key={`${name}:${fontScale}`} name={name} />;
});

function MeasuredName({ name }: { name: string }) {
  const candidates = useMemo(() => homeNameCandidates(name), [name]);
  const [width, setWidth] = useState(0);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const ready = width > 0 && candidates.every(text => measurements[text] !== undefined);
  const displayed = ready ? fitHomeName(candidates, measurements, width) : candidates[0];
  // A single unusually long word still stays intact rather than getting clipped.
  const shrink = !ready || measurements[displayed] > width;
  return (
    <View style={styles.container} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit={shrink}
        minimumFontScale={0.1} accessibilityLabel={name}>
        {displayed}
      </Text>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={styles.measurements}>
        {candidates.map(text => (
          <Text key={text} style={styles.name} onTextLayout={event => {
            const measured = event.nativeEvent.lines[0]?.width;
            if (measured === undefined) return;
            setMeasurements(previous => previous[text] === measured ? previous : { ...previous, [text]: measured });
          }}>{text}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", overflow: "hidden" },
  measurements: { position: "absolute", width: 10000, opacity: 0, top: 0, left: 0 },
  name: {
    color: "#FFFFFF", fontFamily: "Manrope", fontSize: 15, lineHeight: 23, fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.65)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
});

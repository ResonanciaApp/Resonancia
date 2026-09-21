import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

type FilledSunIconProps = {
  size?: number;
  color: string;
};

export function FilledSunIcon({ size = 24, color }: FilledSunIconProps) {
  const centerSize = size * 0.32;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.center,
          {
            width: centerSize,
            height: centerSize,
            borderRadius: centerSize / 2,
            backgroundColor: color,
            left: (size - centerSize) / 2,
            top: (size - centerSize) / 2,
          },
        ]}
      />
      <Feather name="sun" size={size} color={color} style={styles.rays} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
  },
  rays: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
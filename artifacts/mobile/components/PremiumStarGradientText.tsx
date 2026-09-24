import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

import { PREMIUM_STAR_GRADIENT } from "@/constants/colors";

export function PremiumStarGradientText({
  text,
  style,
}: {
  text: string;
  style: StyleProp<TextStyle>;
}) {
  return (
    <MaskedView
      accessibilityLabel={text}
      maskElement={<Text style={[style, styles.mask]}>{text}</Text>}
    >
      <LinearGradient
        colors={PREMIUM_STAR_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <Text accessible={false} style={[style, styles.placeholder]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  mask: { color: "#FFFFFF" },
  placeholder: { opacity: 0 },
});
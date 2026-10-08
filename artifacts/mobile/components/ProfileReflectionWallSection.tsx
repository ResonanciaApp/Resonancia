import React, { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  type ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  HomeReflectionWallSection,
  type HomeReflectionWallHandle,
} from "@/components/HomeReflectionWallSection";
import { useColors } from "@/hooks/useColors";

type Props = {
  scrollRef: React.RefObject<Pick<ScrollView, "scrollTo" | "getNativeScrollRef"> | null>;
  getScrollY: () => number;
  onComposingChange: (composing: boolean) => void;
  onMessageSaved: () => void;
  onCollapsedHeightChange?: (height: number) => void;
  style?: StyleProp<ViewStyle>;
};

export const ProfileReflectionWallSection = forwardRef<HomeReflectionWallHandle, Props>(
  function ProfileReflectionWallSection({
    scrollRef,
    getScrollY,
    onComposingChange,
    onMessageSaved,
    onCollapsedHeightChange,
    style,
  }, ref) {
    const colors = useColors();
    return (
      <View style={[styles.section, style]}>
        <Text testID="profile-wall-title" style={[styles.title, { color: colors.foreground }]}>Mi muro expansivo</Text>
        <HomeReflectionWallSection
          ref={ref}
          scrollRef={scrollRef}
          getScrollY={getScrollY}
          onComposingChange={onComposingChange}
          onMessageSaved={onMessageSaved}
          onCollapsedHeightChange={onCollapsedHeightChange}
          profileVariant
          canonicalVerticalInsets
          sectionBackgroundColor="rgba(0,0,0,0.16)"
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  title: {
    fontFamily: "Manrope",
    fontSize: 19,
    lineHeight: 26,
    fontWeight: "800",
    marginBottom: 15,
  },
  section: {
    marginTop: 0,
    marginBottom: 21,
  },
});
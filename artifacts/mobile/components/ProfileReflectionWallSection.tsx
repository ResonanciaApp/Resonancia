import React, { forwardRef } from "react";
import {
  StyleSheet,
  View,
  type ScrollView,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  HomeReflectionWallSection,
  type HomeReflectionWallHandle,
} from "@/components/HomeReflectionWallSection";

type Props = {
  scrollRef: React.RefObject<Pick<ScrollView, "scrollTo" | "getNativeScrollRef"> | null>;
  getScrollY: () => number;
  onComposingChange: (composing: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

const onMessageSaved = () => {};

export const ProfileReflectionWallSection = forwardRef<HomeReflectionWallHandle, Props>(
  function ProfileReflectionWallSection({
    scrollRef,
    getScrollY,
    onComposingChange,
    style,
  }, ref) {
    return (
      <View style={[styles.section, style]}>
        <HomeReflectionWallSection
          ref={ref}
          scrollRef={scrollRef}
          getScrollY={getScrollY}
          onComposingChange={onComposingChange}
          onMessageSaved={onMessageSaved}
          sectionTitle="Mi muro expansivo"
          canonicalVerticalInsets
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  section: {
    marginBottom: 21,
  },
});
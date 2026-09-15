sed -i '/const slowHeaderStyle = useAnimatedStyle(() => {/i \
  const heroControlsOpacity = useAnimatedStyle(() => {\
    if (!isInicio3) return { opacity: 1 };\
    const opacity = Math.max(0, 1 - (effectiveScrollY.value - 20) / 30);\
    return { opacity };\
  }, [isInicio3]);\
' "artifacts/mobile/app/(tabs)/inicio8.tsx"
sed -i 's/<View style={styles.inicio3HeroRightActions}>/<RAnimated.View style={[styles.inicio3HeroRightActions, heroControlsOpacity]}>/g' "artifacts/mobile/app/(tabs)/inicio8.tsx"
sed -i 's/<\/View>$/<\/RAnimated.View>/g' "artifacts/mobile/app/(tabs)/inicio8.tsx"

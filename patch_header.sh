sed -i '/function Inicio2LotusStreak/i \
function Inicio3StickyHeader({\
  topPad,\
  inicio3ScrollY,\
  onOpenSearch,\
  onOpenProfile,\
  giftScaleAnim,\
  activeTheme,\
}: {\
  topPad: number;\
  inicio3ScrollY: SharedValue<number>;\
  onOpenSearch: () => void;\
  onOpenProfile: () => void;\
  giftScaleAnim: Animated.Value;\
  activeTheme: any;\
}) {\
  const animatedStyle = useAnimatedStyle(() => {\
    const opacity = Math.min(1, Math.max(0, (inicio3ScrollY.value - 60) / 30));\
    const pointerEventsValue = opacity > 0.1 ? "box-none" : "none";\
    return {\
      opacity,\
      transform: [{ translateY: (1 - opacity) * -10 }],\
      pointerEvents: pointerEventsValue,\
    };\
  });\
\
  return (\
    <RAnimated.View\
      style={[\
        {\
          position: "absolute",\
          top: 0,\
          left: 0,\
          right: 0,\
          zIndex: 50,\
          height: topPad + 48,\
          paddingTop: topPad - 2,\
          flexDirection: "row",\
          alignItems: "center",\
          justifyContent: "space-between",\
          paddingHorizontal: 16,\
          overflow: "hidden",\
        },\
        animatedStyle,\
      ]}\
    >\
      <View style={StyleSheet.absoluteFill} pointerEvents="none">\
        <LinearGradient\
          colors={activeTheme.gradient as [string, string, ...string[]]}\
          locations={activeTheme.gradientLocations}\
          style={{ width: "100%", height: Dimensions.get("window").height }}\
        />\
      </View>\
\
      <Pressable\
        onPress={onOpenSearch}\
        hitSlop={10}\
        style={{ width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" }}\
        accessibilityRole="button"\
        accessibilityLabel="Buscar en Inicio"\
        testID="inicio3-sticky-search-button"\
      >\
        {Platform.OS === "ios" ? (\
          <SymbolView name="magnifyingglass" tintColor="#FFFFFF" size={22} />\
        ) : (\
          <Feather name="search" size={22} color="#FFFFFF" />\
        )}\
      </Pressable>\
\
      <View pointerEvents="none" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>\
        <Image\
          source={require("@/assets/images/logo-resonancia.png")}\
          style={{ width: 140, height: 22, resizeMode: "contain" }}\
        />\
      </View>\
\
      <Pressable\
        onPress={onOpenProfile}\
        onPressIn={() =>\
          Animated.spring(giftScaleAnim, {\
            toValue: 0.84,\
            speed: 30,\
            bounciness: 0,\
            useNativeDriver: true,\
          }).start()\
        }\
        onPressOut={() =>\
          Animated.spring(giftScaleAnim, {\
            toValue: 1,\
            speed: 8,\
            bounciness: 16,\
            useNativeDriver: true,\
          }).start()\
        }\
        hitSlop={12}\
        style={{ width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" }}\
      >\
        <Animated.View style={{ transform: [{ scale: giftScaleAnim }] }}>\
          <Inicio2LotusStreak lightBackground />\
        </Animated.View>\
      </Pressable>\
    </RAnimated.View>\
  );\
}\
' "artifacts/mobile/app/(tabs)/inicio8.tsx"

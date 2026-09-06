import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient as SvgRadialGradient, Rect, Stop } from "react-native-svg";

import { useSceneTheme } from "@/context/SceneThemeContext";

type SacredBackgroundProps = {
  /**
   * Modo de fondo:
   * - "solid" (default): plano, sin textura ni degradados (look Calm/Pura Mente).
   *   Si no se pasa `solidColor`, pinta el color sólido del tema de Escena
   *   activo (Task #82) — así las pantallas que ya usan este componente sin
   *   color propio reaccionan automáticamente al cambiar de Escena. Las
   *   pantallas que SÍ pasan `solidColor` (identidad de categoría) conservan
   *   su color explícito por ahora — la migración de esas es progresiva.
   * - "texture": textura + glow dorado + viñeta (look original, legacy).
   * - "gradient": degradado del tema de Escena activo (`theme.gradient`),
   *   el mismo look que usa Inicio (`LinearGradient` de arriba a abajo).
   */
  variant?: "texture" | "solid" | "gradient";
  /** Color del fondo sólido (solo aplica con variant="solid"). */
  solidColor?: string;
  /** Si es true, omite la imagen de fondo aunque el tema la tenga (solo aplica con variant="gradient"). */
  noImage?: boolean;
  /** Luces ambientales radiales del tema. Se omiten por defecto; Perfil conserva solo la superior. */
  ambientGlowMode?: "none" | "top" | "all";
};

export function SacredBackground({
  variant = "solid",
  solidColor,
  noImage = false,
  ambientGlowMode = "none",
}: SacredBackgroundProps) {
  const { theme } = useSceneTheme();
  const ambientGlows = ambientGlowMode === "all"
    ? theme.radialGlows
    : ambientGlowMode === "top"
      ? theme.radialGlows?.slice(0, 1)
      : undefined;

  if (variant === "solid") {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: solidColor ?? theme.solid }]}
        pointerEvents="none"
      />
    );
  }

  if (variant === "gradient") {
    if (theme.backgroundImage != null && !noImage) {
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={theme.backgroundImage}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            priority="high"
            cachePolicy="memory-disk"
          />
          {/* Overlay oscuro para mantener legibilidad */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.52)" }]} />
          {/* Degradado del tema encima — aporta el tinte de color */}
          <LinearGradient
            colors={[`${theme.gradient[0]}99`, `${theme.gradient[1]}CC`]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
    }
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={theme.gradient}
          locations={theme.gradientLocations}
          start={theme.gradientStart}
          end={theme.gradientEnd}
          style={StyleSheet.absoluteFill}
        />
        {ambientGlows != null && ambientGlows.length > 0 && (
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
            <Defs>
              {ambientGlows.map((glow, glowIndex) => (
                <SvgRadialGradient
                  key={glowIndex}
                  id={`sceneThemeAmbientGlow${glowIndex}`}
                  cx={glow.cx}
                  cy={glow.cy}
                  r={glow.r}
                  gradientUnits="userSpaceOnUse"
                >
                  {glow.stops.map((stop, stopIndex) => (
                    <Stop
                      key={stopIndex}
                      offset={stop.offset}
                      stopColor={stop.color}
                      stopOpacity={stop.opacity}
                    />
                  ))}
                </SvgRadialGradient>
              ))}
            </Defs>
            {ambientGlows.map((_, glowIndex) => (
              <Rect
                key={glowIndex}
                x="0"
                y="0"
                width="100"
                height="100"
                fill={`url(#sceneThemeAmbientGlow${glowIndex})`}
              />
            ))}
          </Svg>
        )}
        {/* Brillo radial — N stops (radialStops) o 2 stops legacy (radialCenter/radialOuter) */}
        {theme.radialStops != null ? (
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <Defs>
              {/* r=55 en viewBox 100×100 → elipse natural en pantalla portrait */}
              <SvgRadialGradient id="sceneThemeGlowMulti" cx="50" cy="50" r="55" gradientUnits="userSpaceOnUse">
                {theme.radialStops.map((s, i) => (
                  <Stop key={i} offset={s.offset} stopColor={s.color} stopOpacity={s.opacity} />
                ))}
              </SvgRadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#sceneThemeGlowMulti)" />
          </Svg>
        ) : theme.radialCenter != null && theme.radialOuter != null ? (
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <Defs>
              <SvgRadialGradient id="sceneThemeGlow" cx="50" cy="52.5" r="72.5" gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={theme.radialCenter} stopOpacity="0.55" />
                <Stop offset="0.9" stopColor={theme.radialOuter} stopOpacity="0" />
                <Stop offset="1" stopColor={theme.radialOuter} stopOpacity="0" />
              </SvgRadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100" height="100" fill="url(#sceneThemeGlow)" />
          </Svg>
        ) : null}
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require("../assets/images/bg-texture.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        priority="high"
        cachePolicy="memory-disk"
      />
      {/* Overlay ligero — la imagen ya es oscura */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(27,6,15,0.72)" }]} />
      {/* Glow cálido dorado — esquina superior derecha */}
      <LinearGradient
        colors={["rgba(212,175,55,0.05)", "rgba(212,175,55,0.00)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Vignette sutil en los bordes */}
      <LinearGradient
        colors={["rgba(0,0,0,0.10)", "rgba(0,0,0,0.00)", "rgba(0,0,0,0.14)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

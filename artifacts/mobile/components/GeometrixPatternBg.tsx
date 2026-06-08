/**
 * GeometrixPatternBg — fondo teselado de geometría sagrada para el lienzo
 * de Geometrix. Usa react-native-svg <Pattern> para una sola pasada de render.
 * Feature premium.
 *
 * El SVG usa absoluteFill y un Rect 9999×9999 para cubrir cualquier contenedor
 * sin depender de sus dimensiones exactas.
 *
 * Coordenadas del glyph: viewBox 0–100. El tile escala el glyph de 100→tileSize
 * con `scale(tileSize/100)` para que el trazo quede proporcional.
 */
import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, G, Pattern, Rect } from "react-native-svg";

import type { GeometryId } from "@/data/geometries";
import { glyphElements } from "@/components/SacredGlyph";

type Props = {
  /** Geometría a teselar. */
  geoId: GeometryId;
  /** Opacidad global del patrón 0–1. */
  opacity: number;
  /** Tamaño de cada tesela en px del lienzo. */
  tileSize: number;
  /**
   * Espaciado: multiplica el intervalo de repetición del patrón.
   * 1.0 = espaciadas, 0.82 = pegadas, 0.67 = superpuestas.
   */
  spacing?: number;
  /** Color del trazo (hex). Por defecto dorado de la paleta. */
  color?: string;
};

function GeometrixPatternBgImpl({ geoId, opacity, tileSize, spacing = 1, color = "#BE9650" }: Props) {
  const id = React.useId().replace(/:/g, "");
  const patId = `gpat-${id}`;

  if (tileSize <= 0) return null;

  // El glyph dibuja en un espacio 0–100; escalamos al tamaño del tile.
  const scale = tileSize / 100;
  // strokeWidth constante en espacio viewBox (línea fina y proporcional).
  const sw = 100 / tileSize;
  // El intervalo de repetición del patrón se escala por spacing:
  // valores < 1 acercan las repeticiones (tiles pegadas / superpuestas).
  const repeat = tileSize * Math.max(0.1, spacing);

  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id={patId}
          x="0"
          y="0"
          width={repeat}
          height={repeat}
          patternUnits="userSpaceOnUse"
        >
          <G
            transform={`scale(${scale.toFixed(5)})`}
            stroke={color}
            fill="none"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {glyphElements(geoId, sw)}
          </G>
        </Pattern>
      </Defs>
      {/* Rect grande: el patrón tilea infinitamente, tapar todo el SVG */}
      <Rect
        x={0}
        y={0}
        width={9999}
        height={9999}
        fill={`url(#${patId})`}
        opacity={opacity}
      />
    </Svg>
  );
}

export const GeometrixPatternBg = React.memo(GeometrixPatternBgImpl);

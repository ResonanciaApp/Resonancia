/**
 * GeometrixPatternBg — fondo teselado de geometría sagrada para el lienzo
 * de Geometrix. Usa react-native-svg <Pattern> para una sola pasada de render
 * (eficiente, sin grid de SVGs). Feature premium.
 *
 * Coordenadas del glyph: viewBox 0–100. El tile escala el glyph de 100→tileSize
 * con `scale(tileSize/100)` para que el trazo quede proporcional.
 */
import React from "react";
import Svg, { Defs, G, Pattern, Rect } from "react-native-svg";

import type { GeometryId } from "@/data/geometries";
import { glyphElements } from "@/components/SacredGlyph";

type Props = {
  /** Lado del lienzo en px. */
  size: number;
  /** Geometría a teselar. */
  geoId: GeometryId;
  /** Opacidad global del patrón 0–1. */
  opacity: number;
  /** Tamaño de cada tesela en px del lienzo. */
  tileSize: number;
  /** Color del trazo (hex). Por defecto dorado de la paleta. */
  color?: string;
};

function GeometrixPatternBgImpl({ size, geoId, opacity, tileSize, color = "#BE9650" }: Props) {
  const id = React.useId().replace(/:/g, "");
  const patId = `gpat-${id}`;

  if (size <= 0 || tileSize <= 0) return null;

  // El glyph dibuja en un espacio 0–100; escalamos al tamaño del tile.
  const scale = tileSize / 100;
  // strokeWidth constante en espacio viewBox (1px visual en el tile).
  const sw = 100 / tileSize;

  return (
    <Svg
      width={size}
      height={size}
      style={{ position: "absolute", top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <Pattern
          id={patId}
          x="0"
          y="0"
          width={tileSize}
          height={tileSize}
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
      <Rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill={`url(#${patId})`}
        opacity={opacity}
      />
    </Svg>
  );
}

export const GeometrixPatternBg = React.memo(GeometrixPatternBgImpl);

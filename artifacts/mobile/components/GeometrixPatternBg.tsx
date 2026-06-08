/**
 * GeometrixPatternBg — fondo teselado de geometría sagrada para Geometrix.
 *
 * Enfoque de escalado desde el centro:
 * - El Pattern tile siempre tiene size = tileSize × tileSize (sin recorte involuntario).
 * - El glyph se escala DESDE SU CENTRO (50,50) usando EXTENT para:
 *   • spacing=1.0 (Separadas): escala natural, hay espacio entre tiles.
 *   • spacing=0.82 (Pegadas): escala que hace el glyph llenar el tile exactamente.
 *   • spacing=0.67 (Superpuestas): glyph un poco más grande → tips recortados por
 *     el tile, el centro de la geometría queda prominente.
 *
 * El SVG usa absoluteFill y un Rect 9999×9999 para cubrir cualquier contenedor.
 */
import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, G, Pattern, Rect } from "react-native-svg";

import type { GeometryId } from "@/data/geometries";
import { glyphElements, EXTENT } from "@/components/SacredGlyph";

type Props = {
  geoId: GeometryId;
  opacity: number;
  /** Tamaño de cada tile en px del lienzo. */
  tileSize: number;
  /**
   * Espaciado:
   *   1.0 = Separadas (natural, con margen)
   *   0.82 = Pegadas (glyph toca el borde del tile)
   *   0.67 = Superpuestas (glyph desborda el tile, tips recortados)
   */
  spacing?: number;
  color?: string;
};

function GeometrixPatternBgImpl({
  geoId,
  opacity,
  tileSize,
  spacing = 1,
  color = "#BE9650",
}: Props) {
  const uid = React.useId().replace(/:/g, "");
  const patId = `gpat-${uid}`;

  if (tileSize <= 0) return null;

  // Extent = radio máximo del glyph en espacio 0–100 (centrado en 50,50).
  const extent = EXTENT[geoId] ?? 42;

  // Scale que hace el glyph llenar exactamente el tile (radio = tileSize/2):
  //   extent * touchScale = 50  →  touchScale = 50 / extent
  const touchScale = 50 / extent;

  // innerScale: controla el tamaño del glyph dentro del tile (en espacio 0–100).
  //   spacing=1   → 1.0       (natural, margen)
  //   spacing=0.82 → touchScale (glyph llena el tile, tiles se tocan)
  //   spacing<0.82 → más allá de touchScale (tips recortados, centro prominente)
  let innerScale: number;
  if (spacing >= 0.82) {
    // Interpolación lineal entre escala natural y touchScale
    const t = (1 - spacing) / (1 - 0.82);
    innerScale = 1 + t * (touchScale - 1);
  } else {
    // Más allá del toque: agregar hasta un 25% extra de touchScale
    const t = (0.82 - spacing) / (0.82 - 0.67);
    innerScale = touchScale + t * 0.25 * (touchScale - 1);
  }

  // strokeWidth constante en espacio viewBox.
  const sw = 100 / tileSize;

  // Transform compuesto:
  //   1. Escala de coordenadas del glyph (0–100) a pantalla (0–tileSize)
  //   2. Escala innerScale alrededor del centro (50,50) del viewBox
  // SVG aplica transforms de derecha a izquierda:
  //   scale(tileSize/100) · translate(50,50) · scale(innerScale) · translate(-50,-50)
  const s = (tileSize / 100).toFixed(6);
  const is = innerScale.toFixed(6);
  const transform = `scale(${s}) translate(50,50) scale(${is}) translate(-50,-50)`;

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
          width={tileSize}
          height={tileSize}
          patternUnits="userSpaceOnUse"
        >
          <G
            transform={transform}
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
        width={9999}
        height={9999}
        fill={`url(#${patId})`}
        opacity={opacity}
      />
    </Svg>
  );
}

export const GeometrixPatternBg = React.memo(GeometrixPatternBgImpl);

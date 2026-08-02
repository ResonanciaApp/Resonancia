/**
 * GeometrixPatternBg — fondo teselado de geometría sagrada para Geometrix.
 *
 * Tiles de aspecto variable (no necesariamente cuadrados):
 *
 *   patternWidth  = tileSize × (rx / ry)
 *   patternHeight = tileSize
 *
 * donde rx y ry son los semiejes reales del contenido dibujado en cada
 * geometría (exportados como GLYPH_EXTENTS desde SacredGlyph). Para
 * geometrías circulares (o con círculo exterior dominante) rx = ry y el
 * tile resulta cuadrado, igual que antes.
 *
 * El glyph se escala desde su centro con innerScale = f(spacing, ry):
 *   spacing = 1.0  → innerScale = 1   (natural, margen alrededor)
 *   spacing = 0.82 → innerScale = 50/ry (glyph llena el tile exactamente)
 *   spacing = 0.67 → innerScale × 1.25 (glyph desborda, tips recortados)
 *
 * Para que el glyph quede centrado dentro del tile no-cuadrado el pivot
 * del translate se mueve a (50 × rx/ry, 50) en lugar de (50, 50).
 *
 * Resultado: con spacing=0.82 (Pegadas) los glyphs se tocan en los cuatro
 * lados, sin huecos ni recortes en ninguna dirección.
 */
import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, G, Pattern, Rect } from "react-native-svg";

import type { GeometryId } from "@/data/geometries";
import { glyphElements, EXTENT, GLYPH_EXTENTS } from "@/components/SacredGlyph";

type Props = {
  geoId: GeometryId;
  opacity: number;
  /** Altura de cada tile en px del lienzo (el ancho se ajusta al aspecto del glyph). */
  tileSize: number;
  /**
   * Espaciado:
   *   1.0 = Separadas (natural, con margen)
   *   0.82 = Pegadas (glyph toca el borde del tile en los 4 lados)
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
  color = "#dad4ec",
}: Props) {
  const uid = React.useId().replace(/:/g, "");
  const patId = `gpat-${uid}`;

  if (tileSize <= 0) return null;

  // Extensiones reales del glyph: rx (horizontal) y ry (vertical), en 0–100.
  // Para geometrías circulares GLYPH_EXTENTS no tiene entrada → usa EXTENT.
  const ext = GLYPH_EXTENTS[geoId];
  const extent = EXTENT[geoId] ?? 42;
  const rx = ext?.rx ?? extent;
  const ry = ext?.ry ?? extent;

  // Aspect ratio del tile (puede ser < 1 para glyphs más altos que anchos,
  // > 1 para glyphs más anchos que altos, = 1 para circulares).
  const aspect = rx / ry;

  // Tamaño del tile en pantalla: ancho ajustado al aspecto, alto = tileSize.
  const patternW = tileSize * aspect;
  const patternH = tileSize;

  // Scale que hace el glyph llenar exactamente el tile:
  //   ry * touchScale = 50  →  touchScale = 50 / ry
  const touchScale = 50 / ry;

  // innerScale interpolado según spacing:
  //   spacing=1   → 1.0         (escala natural, cabe con margen)
  //   spacing=0.82 → touchScale  (llena el tile exactamente)
  //   spacing<0.82 → hasta +25% más (desborda, tiles superpuestos)
  let innerScale: number;
  if (spacing >= 0.82) {
    const t = (1 - spacing) / (1 - 0.82);
    innerScale = 1 + t * (touchScale - 1);
  } else {
    const t = (0.82 - spacing) / (0.82 - 0.67);
    innerScale = touchScale + t * 0.25 * touchScale;
  }

  // strokeWidth constante en espacio viewBox.
  const sw = 100 / tileSize;

  // Transform compuesto (SVG aplica de derecha a izquierda):
  //   scale(tileSize/100)          — coordenadas 0–100 → pantalla
  //   translate(50×aspect, 50)     — mueve el pivot al centro del tile no-cuadrado
  //   scale(innerScale)            — escala desde el centro del glyph
  //   translate(-50, -50)          — lleva el centro del glyph al origen
  const s = (tileSize / 100).toFixed(6);
  const cx = (50 * aspect).toFixed(6);
  const is = innerScale.toFixed(6);
  const transform = `scale(${s}) translate(${cx},50) scale(${is}) translate(-50,-50)`;

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
          width={patternW}
          height={patternH}
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

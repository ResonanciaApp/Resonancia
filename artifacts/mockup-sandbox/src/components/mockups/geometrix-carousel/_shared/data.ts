import type React from "react";
import {
  FlowerOfLife,
  SeedOfLife,
  Metatron,
  Merkaba,
  SriYantra,
  Torus,
  type GlyphProps,
} from "./glyphs";

export type Geom = {
  id: string;
  name: string;
  color: string;
  Glyph: React.FC<GlyphProps>;
};

// Each geometry has its own assigned color (the tone it adopts once selected).
// Palette leans on the RESONANCIA navy + gold brand with distinct accents.
export const GEOMS: Geom[] = [
  { id: "flower", name: "Flor de la Vida", color: "#BE9650", Glyph: FlowerOfLife },
  { id: "metatron", name: "Cubo de Metatrón", color: "#6FB3C7", Glyph: Metatron },
  { id: "sri", name: "Sri Yantra", color: "#C77DA8", Glyph: SriYantra },
  { id: "seed", name: "Semilla de la Vida", color: "#8AB87A", Glyph: SeedOfLife },
  { id: "torus", name: "Toroide", color: "#9B8FD6", Glyph: Torus },
  { id: "merkaba", name: "Merkaba", color: "#D6A85B", Glyph: Merkaba },
];

export const PALETTE = {
  bg: "#0B0F14",
  panel: "rgba(190,150,80,0.05)",
  border: "rgba(190,150,80,0.18)",
  gold: "#BE9650",
  accent: "#D6A85B",
  fg: "#EDE1D3",
  muted: "#7A8FA8",
};

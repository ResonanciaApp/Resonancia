import { Asset } from "expo-asset";
import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useRef, useState } from "react";
import pako from "pako";

const SAMPLE_SIZE = 8; // 8×8 pixel sample

// ── PNG filter reconstruction ──────────────────────────────────────────────
function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function reconstructRow(
  filtered: Uint8Array,
  prev: Uint8Array,
  filter: number,
  bpp: number // bytes per pixel (3 for RGB)
): Uint8Array {
  const n = filtered.length;
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const x = filtered[i];
    const a = i >= bpp ? out[i - bpp] : 0;
    const b = prev[i] ?? 0;
    const c = i >= bpp ? (prev[i - bpp] ?? 0) : 0;
    let v: number;
    switch (filter) {
      case 1: v = x + a; break;
      case 2: v = x + b; break;
      case 3: v = x + Math.floor((a + b) / 2); break;
      case 4: v = x + paethPredictor(a, b, c); break;
      default: v = x; // filter 0 = None
    }
    out[i] = v & 0xff;
  }
  return out;
}

// ── Base64 → Uint8Array ────────────────────────────────────────────────────
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── Parse PNG and return average [R,G,B] ──────────────────────────────────
function parsePNGAvgColor(b64: string): [number, number, number] | null {
  try {
    const bytes = b64ToBytes(b64);
    const view = new DataView(bytes.buffer);

    // Collect all IDAT chunks
    let offset = 8; // skip PNG signature
    const idatParts: Uint8Array[] = [];

    while (offset < bytes.length - 12) {
      const len = view.getUint32(offset);
      const type = String.fromCharCode(
        bytes[offset + 4], bytes[offset + 5],
        bytes[offset + 6], bytes[offset + 7]
      );
      if (type === "IDAT") {
        idatParts.push(bytes.slice(offset + 8, offset + 8 + len));
      } else if (type === "IEND") break;
      offset += 12 + len;
    }

    if (!idatParts.length) return null;

    // Concatenate and inflate
    const combined = new Uint8Array(idatParts.reduce((s, p) => s + p.length, 0));
    let pos = 0;
    for (const p of idatParts) { combined.set(p, pos); pos += p.length; }

    const raw = pako.inflate(combined);

    // Reconstruct pixels: each row = 1 filter byte + width*3 bytes
    const w = SAMPLE_SIZE;
    const h = SAMPLE_SIZE;
    const bpp = 3;
    const rowBytes = w * bpp;
    const rows: Uint8Array[] = [];

    for (let row = 0; row < h; row++) {
      const start = row * (1 + rowBytes);
      if (start + 1 + rowBytes > raw.length) break;
      const filter = raw[start];
      const filtered = raw.slice(start + 1, start + 1 + rowBytes);
      const prev = rows[row - 1] ?? new Uint8Array(rowBytes);
      rows.push(reconstructRow(filtered, prev, filter, bpp));
    }

    // Average all pixels
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (const row of rows) {
      for (let i = 0; i < rowBytes; i += 3) {
        rSum += row[i]; gSum += row[i + 1]; bSum += row[i + 2];
        count++;
      }
    }
    if (!count) return null;
    return [Math.round(rSum / count), Math.round(gSum / count), Math.round(bSum / count)];
  } catch {
    return null;
  }
}

// ── Darken RGB by 0-1 amount (0 = original, 1 = black) ────────────────────
function darkenRGB(r: number, g: number, b: number, amount: number): string {
  const k = 1 - amount;
  const toHex = (n: number) => Math.round(n * k).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Public hook ────────────────────────────────────────────────────────────
export interface DominantColors {
  dominant: string;   // slightly darkened
  mid: string;        // more darkened
  dark: string;       // darkest (near black)
}

const DEFAULT_COLORS: DominantColors = {
  dominant: "#2E0510",
  mid: "#1E030A",
  dark: "#100206",
};

const cache = new Map<number | string, DominantColors>();

export function useImageDominantColor(
  imageSource: number | { uri: string } | null | undefined
): DominantColors {
  const [colors, setColors] = useState<DominantColors>(DEFAULT_COLORS);
  const prevKey = useRef<number | string | null>(null);

  useEffect(() => {
    if (!imageSource) return;
    const key = typeof imageSource === "number" ? imageSource : (imageSource as any).uri ?? 0;
    if (key === prevKey.current) return;
    prevKey.current = key;

    // Return cached immediately
    if (cache.has(key)) {
      setColors(cache.get(key)!);
      return;
    }

    (async () => {
      try {
        let uri: string;

        if (typeof imageSource === "number") {
          const asset = Asset.fromModule(imageSource);
          await asset.downloadAsync();
          uri = asset.localUri!;
        } else {
          uri = (imageSource as any).uri;
        }

        if (!uri) return;

        const result = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: SAMPLE_SIZE, height: SAMPLE_SIZE } }],
          { format: ImageManipulator.SaveFormat.PNG, base64: true }
        );

        const rgb = parsePNGAvgColor(result.base64!);
        if (!rgb) return;

        const [r, g, b] = rgb;
        const computed: DominantColors = {
          dominant: darkenRGB(r, g, b, 0.25),
          mid:      darkenRGB(r, g, b, 0.52),
          dark:     darkenRGB(r, g, b, 0.72),
        };
        cache.set(key, computed);
        setColors(computed);
      } catch {
        // leave defaults
      }
    })();
  }, [imageSource]);

  return colors;
}

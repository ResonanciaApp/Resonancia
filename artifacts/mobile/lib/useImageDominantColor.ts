/**
 * Extrae el color dominante de una imagen de sesión.
 * Usa expo-file-system (puro JS, sin native rebuild) en lugar de
 * expo-image-manipulator para evitar "Cannot find native module".
 */
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useRef, useState } from "react";
import pako from "pako";

// ── PNG filter reconstruction ──────────────────────────────────────────────
function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function reconstructRow(
  filtered: Uint8Array<ArrayBufferLike>,
  prev: Uint8Array<ArrayBufferLike>,
  filter: number,
  bpp: number
): Uint8Array<ArrayBufferLike> {
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
      default: v = x;
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

// ── Parse PNG → average RGB, sampling every STEP-th row and column ─────────
const STEP = 8; // sample 1 of every 8 pixels per axis → ~64× faster

function parsePNGAvgColor(b64: string): [number, number, number] | null {
  try {
    const bytes = b64ToBytes(b64);
    const dv = new DataView(bytes.buffer);

    // Read IHDR for width/height/colorType
    // PNG signature = 8 bytes, then IHDR chunk = 4(len)+4(type)+13(data)+4(crc)
    const ihdrOffset = 8 + 8; // skip signature + chunk length+type
    const imgWidth  = dv.getUint32(ihdrOffset);
    const imgHeight = dv.getUint32(ihdrOffset + 4);
    const colorType = bytes[ihdrOffset + 9]; // 2=RGB, 6=RGBA

    const channels = colorType === 6 ? 4 : 3; // RGB or RGBA
    const bpp = channels;

    // Collect all IDAT chunks
    let offset = 8;
    const idatParts: Uint8Array[] = [];

    while (offset < bytes.length - 12) {
      const len  = dv.getUint32(offset);
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
    const totalLen = idatParts.reduce((s, p) => s + p.length, 0);
    const combined = new Uint8Array(totalLen);
    let pos = 0;
    for (const p of idatParts) { combined.set(p, pos); pos += p.length; }

    const raw = pako.inflate(combined);

    // Reconstruct rows, sampling every STEP-th row/column
    const rowBytes = imgWidth * channels;
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    let prevRow: Uint8Array<ArrayBufferLike> = new Uint8Array(rowBytes);

    for (let row = 0; row < imgHeight; row++) {
      const start = row * (1 + rowBytes);
      if (start + 1 + rowBytes > raw.length) break;

      const filter   = raw[start];
      const filtered = raw.slice(start + 1, start + 1 + rowBytes);
      const current  = reconstructRow(filtered, prevRow, filter, bpp);
      prevRow = current;

      // Only sample every STEP-th row
      if (row % STEP !== 0) continue;

      for (let col = 0; col < imgWidth; col += STEP) {
        const i = col * channels;
        rSum += current[i];
        gSum += current[i + 1];
        bSum += current[i + 2];
        count++;
      }
    }

    if (!count) return null;
    return [
      Math.round(rSum / count),
      Math.round(gSum / count),
      Math.round(bSum / count),
    ];
  } catch {
    return null;
  }
}

// ── Darken ─────────────────────────────────────────────────────────────────
function darkenRGB(r: number, g: number, b: number, amount: number): string {
  const k = 1 - amount;
  const toHex = (n: number) => Math.round(n * k).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ── Public hook ────────────────────────────────────────────────────────────
export interface DominantColors {
  dominant: string;
  mid: string;
  dark: string;
}

const DEFAULT_COLORS: DominantColors = {
  dominant: "#1B060F",
  mid:      "#120409",
  dark:     "#08010E",
};

const cache = new Map<string, DominantColors>();

export function useImageDominantColor(
  imageSource: number | { uri: string } | null | undefined
): DominantColors {
  const [colors, setColors] = useState<DominantColors>(DEFAULT_COLORS);
  const prevKey = useRef<string>("");

  useEffect(() => {
    if (imageSource == null) return;
    const key =
      typeof imageSource === "number"
        ? String(imageSource)
        : (imageSource as { uri: string }).uri ?? "";

    if (!key || key === prevKey.current) return;
    prevKey.current = key;

    if (cache.has(key)) {
      setColors(cache.get(key)!);
      return;
    }

    (async () => {
      try {
        let localUri: string;

        if (typeof imageSource === "number") {
          // Bundled asset → resolve to local file
          const asset = Asset.fromModule(imageSource);
          await asset.downloadAsync();
          localUri = asset.localUri!;
        } else {
          const uri = (imageSource as { uri: string }).uri;
          if (uri.startsWith("http")) {
            // Remote image → download to temp file
            const tmpPath =
              FileSystem.cacheDirectory +
              "dominant_" +
              key.replace(/[^a-z0-9]/gi, "_").slice(-40) +
              ".png";
            const existing = await FileSystem.getInfoAsync(tmpPath);
            if (!existing.exists) {
              await FileSystem.downloadAsync(uri, tmpPath);
            }
            localUri = tmpPath;
          } else {
            localUri = uri;
          }
        }

        if (!localUri) return;

        const b64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const rgb = parsePNGAvgColor(b64);
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
        // Silently fall back to defaults
      }
    })();
  }, [imageSource]);

  return colors;
}

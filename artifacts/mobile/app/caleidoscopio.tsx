/**
 * Caleidoscopio — pantalla de fondo interactivo caleidoscópico.
 *
 * 6 patrones de formas distintos (Cósmico, Floral, Cristal, Ondas, Tribal,
 * Nebulosa), 5 paletas, segmentos configurables, arrastre para desplazar el
 * patrón semilla, velocidad variable y modo inmersión.
 *
 * Renderizado: react-native-svg + requestAnimationFrame (~45 fps).
 * Arquitectura: N <G clipPath rotate> con el mismo conjunto de formas
 * computadas desde el valor de tiempo `t`.
 */
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient as ExpoGradient } from "expo-linear-gradient";
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Stop } from "react-native-svg";

// ── Paletas ───────────────────────────────────────────────────────────────────

const THEMES = [
  { name: "Dorado",  fill: ["#D4AF37","#E9C46A","#F4DAD5","#C49F27","#D4AF37"], stroke: "#F4DAD5", glow: "#D4AF37" },
  { name: "Violeta", fill: ["#B69BE0","#9B7FD4","#D4B0F0","#7AA8E0","#C4A8F0"], stroke: "#D4B0F0", glow: "#B69BE0" },
  { name: "Mar",     fill: ["#4B9EFF","#7FD1C0","#7AA8E0","#A0C8F0","#50D0C0"], stroke: "#A0E0F8", glow: "#4B9EFF" },
  { name: "Rosa",    fill: ["#E0989B","#FF8B9A","#F0C0C4","#D670A0","#FFAABB"], stroke: "#FFD0D8", glow: "#FF8B9A" },
  { name: "Jade",    fill: ["#6BC47A","#9BD6A8","#7FD1C0","#A0E0B0","#50C870"], stroke: "#B0F0C0", glow: "#6BC47A" },
];

const SEGMENTS_OPTIONS = [4, 6, 8, 12, 16];

// ── Tipos y helpers SVG ───────────────────────────────────────────────────────

interface SeedLayer {
  key: string;
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity: number;
  fillRule?: "nonzero" | "evenodd";
}

const circlePath = (cx: number, cy: number, r: number) =>
  r <= 0 ? "" : `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;

const sectorPath = (cx: number, cy: number, r: number, a1: number, a2: number) => {
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
};

const polyPath = (cx: number, cy: number, r: number, sides: number, rot: number) => {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * Math.PI * 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
};

const starPath = (cx: number, cy: number, outerR: number, innerR: number, points: number, rot: number) => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

const petalPath = (cx: number, cy: number, length: number, width: number, angle: number) => {
  const tx = cx + length * Math.cos(angle), ty = cy + length * Math.sin(angle);
  const px = Math.cos(angle - Math.PI / 2), py = Math.sin(angle - Math.PI / 2);
  return (
    `M ${cx} ${cy} ` +
    `C ${cx + width * px} ${cy + width * py} ${tx + width * px} ${ty + width * py} ${tx} ${ty} ` +
    `C ${tx - width * px} ${ty - width * py} ${cx - width * px} ${cy - width * py} ${cx} ${cy} Z`
  );
};

const spiralPath = (cx: number, cy: number, maxR: number, turns: number, phase: number) => {
  let d = "";
  for (let i = 0; i <= 80; i++) {
    const frac = i / 80;
    const r = frac * maxR;
    const a = phase + frac * turns * Math.PI * 2;
    const x = (cx + r * Math.cos(a)).toFixed(2), y = (cy + r * Math.sin(a)).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
};

const sinePath = (cx: number, cy: number, amplitude: number, freq: number, phase: number, len: number) => {
  let d = "";
  for (let i = 0; i <= 80; i++) {
    const frac = i / 80;
    const x = cx - len / 2 + frac * len;
    const y = cy + amplitude * Math.sin(freq * frac * Math.PI * 2 + phase);
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
};

const zigzagCirclePath = (cx: number, cy: number, r: number, teeth: number, amp: number, phase: number) => {
  let d = "";
  for (let i = 0; i <= teeth * 2; i++) {
    const a = phase + (i / (teeth * 2)) * Math.PI * 2;
    const rr = r + (i % 2 === 0 ? amp : -amp);
    const x = (cx + rr * Math.cos(a)).toFixed(2), y = (cy + rr * Math.sin(a)).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d + " Z";
};

// ── Patrones de semilla ───────────────────────────────────────────────────────

type PatternFn = (T: number, cx: number, cy: number, R: number, fill: string[]) => SeedLayer[];

/** 1 — Cósmico: blobs orbitantes, sectores, espirales */
const patternCosmico: PatternFn = (T, cx, cy, R, fill) => {
  const sA = T * 0.4;
  const sp = Math.PI * 0.28;
  const layers: SeedLayer[] = [
    { key: "bg",   d: circlePath(cx, cy, R * 0.48),  fill: fill[4], opacity: 0.07 },
    { key: "s1",   d: sectorPath(cx, cy, R*0.44, sA, sA+sp),            fill: fill[0], opacity: 0.28 },
    { key: "s2",   d: sectorPath(cx, cy, R*0.38, sA+Math.PI*0.55, sA+Math.PI*0.55+sp*0.7), fill: fill[1], opacity: 0.22 },
    { key: "hex",  d: polyPath(cx, cy, R*0.22, 6, T*0.25),              fill: fill[2], opacity: 0.18 },
  ];
  // Blobs orbitantes
  for (let i = 0; i < 6; i++) {
    const phase = T * (0.3 + i * 0.07) + (i * Math.PI * 2) / 6;
    const ro = R * (0.18 + 0.22 * ((i % 3) / 2));
    const bx = cx + ro * Math.cos(phase), by = cy + ro * Math.sin(phase);
    const br = R * (0.05 + 0.04 * Math.abs(Math.sin(T * 0.6 + i)));
    layers.push({ key: `b${i}`, d: circlePath(bx, by, br), fill: fill[i % fill.length], opacity: 0.45 - i * 0.04 });
  }
  const dA = T * 0.35 + Math.PI / 4;
  layers.push({ key: "diam", d: polyPath(cx + R*0.31*Math.cos(dA), cy + R*0.31*Math.sin(dA), R*0.08, 4, T*0.6), fill: fill[3], opacity: 0.38 });
  layers.push({ key: "sp1",  d: spiralPath(cx, cy, R*0.48, 2.5, T*0.2),  stroke: fill[2], strokeWidth: 0.9, opacity: 0.55 });
  layers.push({ key: "sp2",  d: spiralPath(cx, cy, R*0.42, 2.0, -T*0.15+Math.PI), stroke: fill[1], strokeWidth: 0.7, opacity: 0.4 });
  let rings = "";
  for (let i = 1; i <= 4; i++) rings += circlePath(cx, cy, R * 0.1 * i) + " ";
  layers.push({ key: "rings", d: rings, stroke: fill[2], strokeWidth: 0.6, opacity: 0.22 });
  return layers;
};

/** 2 — Floral: pétalos bezier, pistilo, estambres */
const patternFloral: PatternFn = (T, cx, cy, R, fill) => {
  const N = 8;
  const layers: SeedLayer[] = [
    { key: "ctr", d: circlePath(cx, cy, R*0.1), fill: fill[2], opacity: 0.7 },
  ];
  for (let i = 0; i < N; i++) {
    const a = T * 0.3 + (i / N) * Math.PI * 2;
    const len = R * (0.35 + 0.12 * Math.sin(T * 0.5 + i * 0.8));
    const w   = R * (0.09 + 0.04 * Math.sin(T * 0.4 + i));
    layers.push({ key: `p${i}`, d: petalPath(cx, cy, len, w, a), fill: fill[i % fill.length], opacity: 0.35 + 0.15 * Math.sin(T * 0.3 + i) });
  }
  // Capa exterior de pétalos más pequeños
  for (let i = 0; i < N; i++) {
    const a = T * -0.2 + ((i + 0.5) / N) * Math.PI * 2;
    const len = R * (0.22 + 0.06 * Math.sin(T * 0.6 + i));
    layers.push({ key: `p2${i}`, d: petalPath(cx, cy, len, R*0.05, a), fill: fill[(i + 2) % fill.length], opacity: 0.25 });
  }
  // Anillo de estambres (líneas finas)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + T * 0.15;
    const r1 = R * 0.12, r2 = R * (0.18 + 0.04 * Math.sin(T + i));
    const x1 = (cx + r1 * Math.cos(a)).toFixed(2), y1 = (cy + r1 * Math.sin(a)).toFixed(2);
    const x2 = (cx + r2 * Math.cos(a)).toFixed(2), y2 = (cy + r2 * Math.sin(a)).toFixed(2);
    layers.push({ key: `st${i}`, d: `M ${x1} ${y1} L ${x2} ${y2}`, stroke: fill[2], strokeWidth: 0.8, opacity: 0.5 });
  }
  layers.push({ key: "ring", d: circlePath(cx, cy, R*0.42), stroke: fill[0], strokeWidth: 0.7, opacity: 0.2 });
  return layers;
};

/** 3 — Cristal: triángulos, estrellas, rombos afilados */
const patternCristal: PatternFn = (T, cx, cy, R, fill) => {
  const layers: SeedLayer[] = [
    { key: "star",  d: starPath(cx, cy, R*0.42, R*0.18, 6, T*0.15),          fill: fill[0], opacity: 0.2 },
    { key: "star2", d: starPath(cx, cy, R*0.28, R*0.12, 6, T*-0.12+Math.PI/6), fill: fill[1], opacity: 0.18 },
    { key: "hex",   d: polyPath(cx, cy, R*0.18, 6, T*0.3),                   fill: fill[2], opacity: 0.25 },
    { key: "tri",   d: polyPath(cx, cy, R*0.38, 3, T*0.22),                  fill: fill[3], opacity: 0.16, fillRule: "evenodd" },
    { key: "tri2",  d: polyPath(cx, cy, R*0.38, 3, T*0.22 + Math.PI),        fill: fill[4], opacity: 0.16 },
  ];
  // Rombos en anillo
  for (let i = 0; i < 6; i++) {
    const a = T * 0.25 + (i / 6) * Math.PI * 2;
    const ro = R * 0.32;
    const dx = cx + ro * Math.cos(a), dy = cy + ro * Math.sin(a);
    layers.push({ key: `d${i}`, d: polyPath(dx, dy, R*0.065, 4, a + T*0.4), fill: fill[i % fill.length], opacity: 0.5 });
  }
  // Líneas radiales afiladas
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + T * 0.1;
    const r2 = R * (0.12 + 0.32 * Math.abs(Math.sin(i * 0.8 + T * 0.2)));
    const x2 = (cx + r2 * Math.cos(a)).toFixed(2), y2 = (cy + r2 * Math.sin(a)).toFixed(2);
    layers.push({ key: `ln${i}`, d: `M ${cx.toFixed(2)} ${cy.toFixed(2)} L ${x2} ${y2}`, stroke: fill[i % fill.length], strokeWidth: 0.7, opacity: 0.3 });
  }
  layers.push({ key: "ring", d: circlePath(cx, cy, R*0.44), stroke: fill[2], strokeWidth: 0.5, opacity: 0.15 });
  return layers;
};

/** 4 — Ondas: sinusoides, manchas difusas, lissajous */
const patternOndas: PatternFn = (T, cx, cy, R, fill) => {
  const layers: SeedLayer[] = [
    { key: "c1", d: circlePath(cx + R*0.2*Math.cos(T*0.3),   cy + R*0.2*Math.sin(T*0.2),   R*0.32), fill: fill[0], opacity: 0.12 },
    { key: "c2", d: circlePath(cx + R*0.25*Math.cos(T*0.25+2), cy + R*0.25*Math.sin(T*0.18+1), R*0.26), fill: fill[1], opacity: 0.14 },
    { key: "c3", d: circlePath(cx + R*0.15*Math.cos(T*0.4+4), cy + R*0.15*Math.sin(T*0.35+3), R*0.2),  fill: fill[2], opacity: 0.18 },
  ];
  // Olas sinusoidales concéntricas
  for (let i = 0; i < 5; i++) {
    const amp  = R * (0.06 + i * 0.02) * (1 + 0.3 * Math.sin(T * 0.4 + i));
    const freq = 3 + i;
    const len  = R * 2;
    layers.push({
      key: `w${i}`,
      d: sinePath(cx, cy + R*(0.05*i - 0.1), amp, freq, T * (0.3 + i*0.05), len),
      stroke: fill[i % fill.length], strokeWidth: 1.2 - i * 0.15, opacity: 0.45 - i * 0.07,
    });
  }
  // Curva de Lissajous como path
  let liss = "";
  for (let j = 0; j <= 200; j++) {
    const a  = (j / 200) * Math.PI * 4;
    const lx = cx + R * 0.38 * Math.sin(3 * a + T * 0.2);
    const ly = cy + R * 0.38 * Math.sin(2 * a + T * 0.15 + 0.5);
    liss += j === 0 ? `M ${lx.toFixed(2)} ${ly.toFixed(2)}` : ` L ${lx.toFixed(2)} ${ly.toFixed(2)}`;
  }
  layers.push({ key: "liss", d: liss, stroke: fill[3], strokeWidth: 0.8, opacity: 0.5 });
  // Elipses giratorias rellenas
  for (let i = 0; i < 3; i++) {
    const a = T * (0.3 + i * 0.1) + (i * Math.PI * 2) / 3;
    const ex = cx + R * 0.28 * Math.cos(a), ey = cy + R * 0.28 * Math.sin(a);
    layers.push({ key: `el${i}`, d: circlePath(ex, ey, R * 0.07), fill: fill[i+1], opacity: 0.35 });
  }
  return layers;
};

/** 5 — Tribal: zigzag, polígonos angulosos, cruces */
const patternTribal: PatternFn = (T, cx, cy, R, fill) => {
  const layers: SeedLayer[] = [
    { key: "zz1", d: zigzagCirclePath(cx, cy, R*0.42, 12, R*0.06, T*0.2),   fill: fill[0], opacity: 0.18 },
    { key: "zz2", d: zigzagCirclePath(cx, cy, R*0.28, 8,  R*0.05, -T*0.25), fill: fill[1], opacity: 0.22 },
    { key: "zz3", d: zigzagCirclePath(cx, cy, R*0.16, 6,  R*0.04, T*0.35),  fill: fill[2], opacity: 0.28 },
  ];
  // Escudos (triángulos orbitantes)
  for (let i = 0; i < 6; i++) {
    const a = T * 0.2 + (i / 6) * Math.PI * 2;
    const px = cx + R * 0.33 * Math.cos(a), py = cy + R * 0.33 * Math.sin(a);
    layers.push({ key: `t${i}`, d: polyPath(px, py, R*0.08, 3, a + T*0.3), fill: fill[i % fill.length], opacity: 0.5 });
  }
  // Cruces (dos rectángulos como paths)
  for (let i = 0; i < 4; i++) {
    const a = T * 0.15 + (i / 4) * Math.PI * 2;
    const px = cx + R * 0.2 * Math.cos(a), py = cy + R * 0.2 * Math.sin(a);
    const ar = a + T * 0.25;
    const cl = R * 0.06, cw = R * 0.018;
    const cPath =
      `M ${px + cl*Math.cos(ar) - cw*Math.cos(ar+Math.PI/2)} ${py + cl*Math.sin(ar) - cw*Math.sin(ar+Math.PI/2)} ` +
      `L ${px + cl*Math.cos(ar) + cw*Math.cos(ar+Math.PI/2)} ${py + cl*Math.sin(ar) + cw*Math.sin(ar+Math.PI/2)} ` +
      `L ${px - cl*Math.cos(ar) + cw*Math.cos(ar+Math.PI/2)} ${py - cl*Math.sin(ar) + cw*Math.sin(ar+Math.PI/2)} ` +
      `L ${px - cl*Math.cos(ar) - cw*Math.cos(ar+Math.PI/2)} ${py - cl*Math.sin(ar) - cw*Math.sin(ar+Math.PI/2)} Z ` +
      `M ${px + cl*Math.cos(ar+Math.PI/2) - cw*Math.cos(ar)} ${py + cl*Math.sin(ar+Math.PI/2) - cw*Math.sin(ar)} ` +
      `L ${px + cl*Math.cos(ar+Math.PI/2) + cw*Math.cos(ar)} ${py + cl*Math.sin(ar+Math.PI/2) + cw*Math.sin(ar)} ` +
      `L ${px - cl*Math.cos(ar+Math.PI/2) + cw*Math.cos(ar)} ${py - cl*Math.sin(ar+Math.PI/2) + cw*Math.sin(ar)} ` +
      `L ${px - cl*Math.cos(ar+Math.PI/2) - cw*Math.cos(ar)} ${py - cl*Math.sin(ar+Math.PI/2) - cw*Math.sin(ar)} Z`;
    layers.push({ key: `cr${i}`, d: cPath, fill: fill[i % fill.length], opacity: 0.6 });
  }
  layers.push({ key: "outline", d: zigzagCirclePath(cx, cy, R*0.46, 18, R*0.025, T*-0.12), stroke: fill[0], strokeWidth: 0.7, opacity: 0.3 });
  return layers;
};

/** 6 — Nebulosa: manchas grandes difusas, arcos suaves, puntos */
const patternNebulosa: PatternFn = (T, cx, cy, R, fill) => {
  const layers: SeedLayer[] = [];
  // Grandes manchas translúcidas
  const nebPositions = [
    [0.18, 0.22, 0.3], [0.28, 0.1, 0.2], [0.08, 0.32, 0.25],
    [0.22, 0.28, 0.18], [0.32, 0.18, 0.14],
  ] as [number, number, number][];
  nebPositions.forEach(([ax, ay, ar], i) => {
    const angleX = T * (0.12 + i * 0.04) + i * 1.3;
    const angleY = T * (0.09 + i * 0.03) + i * 2.1;
    const nx = cx + R * ax * Math.cos(angleX);
    const ny = cy + R * ay * Math.sin(angleY);
    layers.push({ key: `n${i}`, d: circlePath(nx, ny, R * ar), fill: fill[i % fill.length], opacity: 0.12 + i * 0.02 });
  });
  // Arcos concéntricos suaves (sectorPath delgados)
  for (let i = 0; i < 5; i++) {
    const a1 = T * (0.08 + i * 0.03) + (i / 5) * Math.PI * 2;
    const span = Math.PI * (0.15 + i * 0.08);
    layers.push({ key: `arc${i}`, d: sectorPath(cx, cy, R*(0.12+i*0.07), a1, a1+span), fill: fill[i % fill.length], opacity: 0.22 - i * 0.03 });
  }
  // Nube de puntos (pequeños círculos)
  for (let i = 0; i < 20; i++) {
    const seed = i * 137.5 * (Math.PI / 180);
    const r = R * 0.42 * Math.sqrt(i / 20);
    const a = seed + T * (0.05 + (i % 4) * 0.03);
    const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
    const pr = R * (0.008 + 0.012 * ((i % 3) / 2));
    layers.push({ key: `pt${i}`, d: circlePath(px, py, pr), fill: fill[i % fill.length], opacity: 0.55 });
  }
  // Gran arco exterior decorativo
  layers.push({ key: "outer", d: circlePath(cx, cy, R*0.46), stroke: fill[1], strokeWidth: 0.6, opacity: 0.18 });
  return layers;
};

// ── Catálogo de patrones ──────────────────────────────────────────────────────

const PATTERNS: { id: string; name: string; icon: keyof typeof Feather.glyphMap; compute: PatternFn }[] = [
  { id: "cosmico",   name: "Cósmico",  icon: "aperture",  compute: patternCosmico  },
  { id: "floral",    name: "Floral",   icon: "sun",       compute: patternFloral   },
  { id: "cristal",   name: "Cristal",  icon: "star",      compute: patternCristal  },
  { id: "ondas",     name: "Ondas",    icon: "activity",  compute: patternOndas    },
  { id: "tribal",    name: "Tribal",   icon: "shield",    compute: patternTribal   },
  { id: "nebulosa",  name: "Nebulosa", icon: "cloud",     compute: patternNebulosa },
];

// ── Componente principal ──────────────────────────────────────────────────────

export default function Caleidoscopio() {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = Dimensions.get("window");
  const CX = W / 2, CY = H / 2;
  const R  = Math.min(W, H) * 0.52;

  const [t, setT]                     = useState(0);
  const [segments, setSegments]       = useState(8);
  const [themeIdx, setThemeIdx]       = useState(0);
  const [patternIdx, setPatternIdx]   = useState(0);
  const [speed, setSpeed]             = useState(0.5);
  const [paused, setPaused]           = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [offsetX, setOffsetX]         = useState(0);
  const [offsetY, setOffsetY]         = useState(0);

  const rafRef      = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const lastTsRef   = useRef<number | null>(null);
  const pausedRef   = useRef(paused);
  const speedRef    = useRef(speed);
  const accOffset   = useRef({ x: 0, y: 0 });

  // Sincronizar refs sin re-crear el loop
  pausedRef.current = paused;
  speedRef.current  = speed;

  const startLoop = useCallback(() => {
    lastTsRef.current = null;
    const loop = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;
      if (!pausedRef.current) setT((prev) => prev + dt * speedRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  useFocusEffect(useCallback(() => { startLoop(); return stopLoop; }, [startLoop, stopLoop]));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gs) => {
        accOffset.current = { x: accOffset.current.x + gs.dx * 0.6, y: accOffset.current.y + gs.dy * 0.6 };
        setOffsetX(accOffset.current.x);
        setOffsetY(accOffset.current.y);
      },
      onPanResponderRelease: (_, gs) => {
        accOffset.current = { x: accOffset.current.x + gs.dx * 0.6, y: accOffset.current.y + gs.dy * 0.6 };
      },
    }),
  ).current;

  const theme   = THEMES[themeIdx];
  const pattern = PATTERNS[patternIdx];
  const T       = t * 0.001;
  const cx      = CX + offsetX * 0.15;
  const cy      = CY + offsetY * 0.15;

  // Cuña de clipPath
  const wedgeAngle    = (360 / segments) * (Math.PI / 180);
  const wedgeHalf     = wedgeAngle / 2;
  const clipR         = R * 1.1;
  const wx1 = (CX + clipR * Math.cos(-wedgeHalf)).toFixed(2);
  const wy1 = (CY + clipR * Math.sin(-wedgeHalf)).toFixed(2);
  const wx2 = (CX + clipR * Math.cos(wedgeHalf)).toFixed(2);
  const wy2 = (CY + clipR * Math.sin(wedgeHalf)).toFixed(2);
  const largeArc  = wedgeAngle > Math.PI ? 1 : 0;
  const wedgePath = `M ${CX} ${CY} L ${wx1} ${wy1} A ${clipR} ${clipR} 0 ${largeArc} 1 ${wx2} ${wy2} Z`;

  // Computar capas del patrón actual
  const layers = pattern.compute(T, cx, cy, R, theme.fill);

  const renderLayers = (mirror: boolean) => {
    const mt = mirror ? `translate(${CX} ${CY}) scale(1 -1) translate(${-CX} ${-CY})` : undefined;
    return (
      <G transform={mt}>
        {layers.map((l) => (
          <Path
            key={l.key}
            d={l.d}
            fill={l.fill ?? "none"}
            stroke={l.stroke}
            strokeWidth={l.strokeWidth ?? 1}
            opacity={l.opacity}
            fillRule={l.fillRule ?? "nonzero"}
          />
        ))}
      </G>
    );
  };

  return (
    <View style={styles.root}>
      <ExpoGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={StyleSheet.absoluteFill} />
      <StatusBar hidden />

      {/* Canvas */}
      <View
        style={StyleSheet.absoluteFill}
        {...panResponder.panHandlers}
        onTouchEnd={() => setControlsVisible((v) => !v)}
      >
        <Svg width={W} height={H}>
          <Defs>
            <LinearGradient id="bgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#1B060F" />
              <Stop offset="100%" stopColor="#060A0F" />
            </LinearGradient>
            <ClipPath id="kclip">
              <Path d={wedgePath} />
            </ClipPath>
          </Defs>

          <Path d={`M 0 0 H ${W} V ${H} H 0 Z`} fill="url(#bgGrad)" />

          {Array.from({ length: segments }, (_, i) => (
            <G key={i} clipPath="url(#kclip)" transform={`rotate(${(i * 360) / segments} ${CX} ${CY})`}>
              {renderLayers(i % 2 === 1)}
            </G>
          ))}

          {/* Vignette circular */}
          <Circle cx={CX} cy={CY} r={R * 0.98} fill="none" stroke="#1B060F" strokeWidth={R * 0.08} />
        </Svg>
      </View>

      {controlsVisible && (
        <>
          {/* Barra superior */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityRole="button">
              <Feather name="chevron-left" size={22} color="#F4DAD5" />
            </Pressable>
            <View style={styles.topCenter}>
              <Text style={styles.topTitle}>Caleidoscopio</Text>
              <Text style={styles.topSub}>{pattern.name} · {segments} seg · {theme.name}</Text>
            </View>
            <Pressable onPress={() => setPaused((v) => !v)} hitSlop={12} style={styles.iconBtn} accessibilityRole="button">
              <Feather name={paused ? "play" : "pause"} size={18} color="#F4DAD5" />
            </Pressable>
          </View>

          {/* Panel inferior */}
          <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}>

            {/* Patrones */}
            <Text style={styles.sectionLabel}>Patrón</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patternScroll}>
              {PATTERNS.map((p, i) => {
                const on = patternIdx === i;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setPatternIdx(i)}
                    style={[styles.patternBtn, on && styles.patternBtnOn]}
                    activeOpacity={0.75}
                  >
                    <Feather name={p.icon} size={16} color={on ? "#D4AF37" : "rgba(242,231,228,0.45)"} />
                    <Text style={[styles.patternBtnText, on && styles.patternBtnTextOn]}>{p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Segmentos + colores en fila */}
            <View style={styles.twoCol}>
              <View style={styles.colBlock}>
                <Text style={styles.sectionLabel}>Segmentos</Text>
                <View style={styles.row}>
                  {SEGMENTS_OPTIONS.map((n) => {
                    const on = segments === n;
                    return (
                      <TouchableOpacity key={n} onPress={() => setSegments(n)} style={[styles.segBtn, on && styles.segBtnOn]} activeOpacity={0.7}>
                        <Text style={[styles.segBtnText, on && styles.segBtnTextOn]}>{n}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.twoCol}>
              <View style={[styles.colBlock, { flex: 1 }]}>
                <Text style={styles.sectionLabel}>Color</Text>
                <View style={styles.row}>
                  {THEMES.map((th, i) => {
                    const on = themeIdx === i;
                    return (
                      <TouchableOpacity
                        key={th.name}
                        onPress={() => setThemeIdx(i)}
                        style={[styles.colorBtn, { backgroundColor: th.fill[0] }, on && styles.colorBtnOn]}
                        activeOpacity={0.75}
                        accessibilityLabel={th.name}
                      />
                    );
                  })}
                </View>
              </View>
              <View style={styles.colBlock}>
                <View style={styles.speedRow}>
                  <Text style={styles.sectionLabel}>Velocidad</Text>
                  <Text style={styles.speedVal}>{speed < 0.25 ? "✦" : speed < 0.65 ? "✦✦" : "✦✦✦"}</Text>
                </View>
                <View style={styles.trackWrap}>
                  {[0.1, 0.35, 0.6, 0.85, 1.0].map((v) => {
                    const on = Math.abs(speed - v) < 0.13;
                    return <TouchableOpacity key={v} onPress={() => setSpeed(v)} style={[styles.speedDot, on && styles.speedDotOn]} hitSlop={8} />;
                  })}
                </View>
              </View>
            </View>

            {/* Guardar */}
            <TouchableOpacity style={styles.saveBtn} onPress={() => {}} activeOpacity={0.8}>
              <Feather name="download" size={15} color="#D4AF37" />
              <Text style={styles.saveBtnText}>Guardar como fondo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!controlsVisible && (
        <View style={[styles.tapHint, { bottom: insets.bottom + 28 }]} pointerEvents="none">
          <Text style={styles.tapHintText}>toca para ver controles</Text>
        </View>
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:             { flex: 1 },
  topBar:           { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, zIndex: 20 },
  iconBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(74,12,12,0.08)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(61,14,22,0.40)" },
  topCenter:        { alignItems: "center", flex: 1, paddingHorizontal: 8 },
  topTitle:         { color: "#F4DAD5", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
  topSub:           { color: "rgba(242,231,228,0.45)", fontSize: 11, marginTop: 1 },
  bottomPanel:      { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(27,6,15,0.9)", borderTopWidth: 1, borderTopColor: "rgba(212,175,55,0.12)", paddingHorizontal: 20, paddingTop: 14, zIndex: 20 },
  sectionLabel:     { color: "rgba(242,231,228,0.45)", fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 },
  patternScroll:    { marginBottom: 12 },
  patternBtn:       { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(74,12,12,0.08)", borderWidth: 1, borderColor: "rgba(61,14,22,0.40)", marginRight: 7 },
  patternBtnOn:     { backgroundColor: "rgba(212,175,55,0.15)", borderColor: "rgba(212,175,55,0.50)" },
  patternBtnText:   { color: "rgba(242,231,228,0.45)", fontSize: 12 },
  patternBtnTextOn: { color: "#D4AF37", fontWeight: "600" },
  twoCol:           { flexDirection: "row", gap: 16, marginBottom: 10 },
  colBlock:         { flex: 1 },
  row:              { flexDirection: "row", gap: 6 },
  segBtn:           { flex: 1, height: 34, borderRadius: 9, backgroundColor: "rgba(74,12,12,0.08)", borderWidth: 1, borderColor: "rgba(61,14,22,0.40)", alignItems: "center", justifyContent: "center" },
  segBtnOn:         { backgroundColor: "rgba(212,175,55,0.18)", borderColor: "rgba(212,175,55,0.55)" },
  segBtnText:       { color: "rgba(242,231,228,0.45)", fontSize: 13 },
  segBtnTextOn:     { color: "#D4AF37", fontWeight: "700" },
  colorBtn:         { flex: 1, height: 28, borderRadius: 7, opacity: 0.55, borderWidth: 2, borderColor: "transparent" },
  colorBtnOn:       { opacity: 1, borderColor: "rgba(255,255,255,0.8)" },
  speedRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  speedVal:         { color: "#D4AF37", fontSize: 10 },
  trackWrap:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  speedDot:         { width: 11, height: 11, borderRadius: 6, backgroundColor: "rgba(74,12,12,0.35)" },
  speedDotOn:       { backgroundColor: "#D4AF37", transform: [{ scale: 1.3 }] },
  saveBtn:          { height: 42, borderRadius: 12, backgroundColor: "rgba(212,175,55,0.10)", borderWidth: 1, borderColor: "rgba(212,175,55,0.35)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  saveBtnText:      { color: "#D4AF37", fontSize: 13, fontWeight: "600" },
  tapHint:          { position: "absolute", alignSelf: "center", zIndex: 10 },
  tapHintText:      { color: "rgba(237,225,211,0.3)", fontSize: 11, letterSpacing: 0.5 },
});

/**
 * Caleidoscopio — pantalla de fondo interactivo caleidoscópico.
 *
 * Fondo animado a tiempo real: formas rellenas + líneas, simetría radial
 * configurable. El usuario arrastra para desplazar el patrón semilla, elige
 * N segmentos, paleta de color y velocidad.
 *
 * Renderizado: react-native-svg + requestAnimationFrame (~45 fps).
 * Arquitectura: N <G clipPath rotate> cada uno con las mismas formas calculadas
 * desde el valor de tiempo `t`.
 */
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

// ── Paletas ──────────────────────────────────────────────────────────────────

const THEMES: {
  name: string;
  fill: string[];   // colores de formas rellenas
  stroke: string;   // trazo de líneas
  glow: string;     // halo interior
}[] = [
  {
    name: "Dorado",
    fill: ["#BE9650", "#D6A85B", "#EDE1D3", "#C8A870", "#BE9650"],
    stroke: "#EDE1D3",
    glow: "#BE9650",
  },
  {
    name: "Violeta",
    fill: ["#B69BE0", "#9B7FD4", "#D4B0F0", "#7AA8E0", "#C4A8F0"],
    stroke: "#D4B0F0",
    glow: "#B69BE0",
  },
  {
    name: "Mar",
    fill: ["#4B9EFF", "#7FD1C0", "#7AA8E0", "#A0C8F0", "#50D0C0"],
    stroke: "#A0E0F8",
    glow: "#4B9EFF",
  },
  {
    name: "Rosa",
    fill: ["#E0989B", "#FF8B9A", "#F0C0C4", "#D670A0", "#FFAABB"],
    stroke: "#FFD0D8",
    glow: "#FF8B9A",
  },
  {
    name: "Jade",
    fill: ["#6BC47A", "#9BD6A8", "#7FD1C0", "#A0E0B0", "#50C870"],
    stroke: "#B0F0C0",
    glow: "#6BC47A",
  },
];

const SEGMENTS_OPTIONS = [4, 6, 8, 12, 16];

// ── Matemáticas del caleidoscopio ────────────────────────────────────────────

/** Posición en un círculo */
const orbit = (
  cx: number,
  cy: number,
  r: number,
  angle: number,
): [number, number] => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];

/** Path SVG de círculo relleno */
const circlePath = (cx: number, cy: number, r: number) =>
  r <= 0
    ? ""
    : `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;

/** Path SVG de sector circular (cuña rellena) */
const sectorPath = (
  cx: number,
  cy: number,
  r: number,
  a1: number,
  a2: number,
) => {
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
};

/** Path SVG de polígono regular relleno */
const polyPath = (
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rot: number,
) => {
  const pts = Array.from({ length: sides }, (_, i) => {
    const a = rot + (i / sides) * Math.PI * 2;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M ${pts.join(" L ")} Z`;
};

/** Path SVG de espiral */
const spiralPath = (
  cx: number,
  cy: number,
  maxR: number,
  turns: number,
  t: number,
  phase: number,
) => {
  const steps = 80;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const r = frac * maxR;
    const angle = phase + t + frac * turns * Math.PI * 2;
    const x = (cx + r * Math.cos(angle)).toFixed(2);
    const y = (cy + r * Math.sin(angle)).toFixed(2);
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return d;
};

// ── Cálculo del patrón semilla ────────────────────────────────────────────────

interface SeedData {
  // Formas rellenas
  bigCircle: string;      // círculo central translúcido
  sector1: string;        // cuña 1
  sector2: string;        // cuña 2
  blobs: string[];        // círculos medianos orbitando
  hexagon: string;        // hexágono interior
  diamond: string;        // rombo orbitante
  // Trazos
  spiral1: string;        // espiral principal
  spiral2: string;        // espiral inversa
  rings: string;          // círculos concéntricos como path unido
}

function computeSeed(
  t: number,
  offsetX: number,
  offsetY: number,
  CX: number,
  CY: number,
  R: number,
): SeedData {
  const T = t * 0.001; // tiempo en segundos escalado
  const ox = offsetX;
  const oy = offsetY;

  // Centro desplazado por el arrastre del usuario
  const cx = CX + ox * 0.15;
  const cy = CY + oy * 0.15;

  // ── Rellenos ──────────────────────────────────────────────────────────────

  // Círculo central grande (fondo del patrón)
  const bigCircle = circlePath(cx, cy, R * 0.48);

  // Dos cuñas giratorias (stained glass)
  const sA = T * 0.4;
  const sectorSpan = Math.PI * 0.28;
  const sector1 = sectorPath(cx, cy, R * 0.44, sA, sA + sectorSpan);
  const sector2 = sectorPath(
    cx,
    cy,
    R * 0.38,
    sA + Math.PI * 0.55,
    sA + Math.PI * 0.55 + sectorSpan * 0.7,
  );

  // Círculos medianos en órbita (lissajous)
  const blobs: string[] = [];
  const N_BLOBS = 6;
  for (let i = 0; i < N_BLOBS; i++) {
    const phase = T * (0.3 + i * 0.07) + (i * Math.PI * 2) / N_BLOBS;
    const rOrbit = R * (0.18 + 0.22 * ((i % 3) / 2));
    const [bx, by] = orbit(cx, cy, rOrbit, phase);
    const blobR = R * (0.05 + 0.04 * Math.abs(Math.sin(T * 0.6 + i)));
    blobs.push(circlePath(bx, by, blobR));
  }

  // Hexágono interior giratorio
  const hexagon = polyPath(cx, cy, R * 0.22, 6, T * 0.25);

  // Rombo en órbita
  const dAngle = T * 0.35 + Math.PI / 4;
  const [dx, dy] = orbit(cx, cy, R * 0.31, dAngle);
  const diamond = polyPath(dx, dy, R * 0.08, 4, T * 0.6);

  // ── Trazos ────────────────────────────────────────────────────────────────

  const spiral1 = spiralPath(cx, cy, R * 0.48, 2.5, T * 0.2, 0);
  const spiral2 = spiralPath(cx, cy, R * 0.42, 2.0, -T * 0.15, Math.PI);

  // Círculos concéntricos como un path
  let rings = "";
  for (let i = 1; i <= 4; i++) {
    const rr = R * 0.1 * i;
    rings += circlePath(cx, cy, rr) + " ";
  }

  return {
    bigCircle,
    sector1,
    sector2,
    blobs,
    hexagon,
    diamond,
    spiral1,
    spiral2,
    rings,
  };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Caleidoscopio() {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = Dimensions.get("window");
  const CX = W / 2;
  const CY = H / 2;
  const R = Math.min(W, H) * 0.52;

  const [t, setT] = useState(0);
  const [segments, setSegments] = useState(8);
  const [themeIdx, setThemeIdx] = useState(0);
  const [speed, setSpeed] = useState(0.5);
  const [paused, setPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);
  const accOffsetRef = useRef({ x: offsetX, y: offsetY });

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Loop de animación
  const startLoop = useCallback(() => {
    lastTsRef.current = null;
    const loop = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(ts - lastTsRef.current, 40);
      lastTsRef.current = ts;
      if (!pausedRef.current) {
        setT((prev) => prev + dt * speedRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      startLoop();
      return stopLoop;
    }, [startLoop, stopLoop]),
  );

  // PanResponder para arrastrar el patrón
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        accOffsetRef.current = {
          x: accOffsetRef.current.x + gs.dx * 0.6,
          y: accOffsetRef.current.y + gs.dy * 0.6,
        };
        setOffsetX(accOffsetRef.current.x);
        setOffsetY(accOffsetRef.current.y);
      },
      onPanResponderRelease: (_, gs) => {
        accOffsetRef.current = {
          x: accOffsetRef.current.x + gs.dx * 0.6,
          y: accOffsetRef.current.y + gs.dy * 0.6,
        };
      },
    }),
  ).current;

  const theme = THEMES[themeIdx];
  const wedgeAngle = (360 / segments) * (Math.PI / 180);

  // Precalcular el path de la cuña de clipPath
  const wedgeHalfAngle = wedgeAngle / 2;
  const clipR = R * 1.1;
  const wx1 = (CX + clipR * Math.cos(-wedgeHalfAngle)).toFixed(3);
  const wy1 = (CY + clipR * Math.sin(-wedgeHalfAngle)).toFixed(3);
  const wx2 = (CX + clipR * Math.cos(wedgeHalfAngle)).toFixed(3);
  const wy2 = (CY + clipR * Math.sin(wedgeHalfAngle)).toFixed(3);
  const largeArc = wedgeAngle > Math.PI ? 1 : 0;
  const wedgePath = `M ${CX} ${CY} L ${wx1} ${wy1} A ${clipR} ${clipR} 0 ${largeArc} 1 ${wx2} ${wy2} Z`;

  // Calcular semilla
  const seed = computeSeed(t, offsetX, offsetY, CX, CY, R);

  // Renderizar formas de la semilla (sin clipPath, eso se aplica en el G padre)
  const renderSeedShapes = (i: number) => {
    // Mirror en segmentos impares (reflexión cruzada)
    const mirrorY = i % 2 === 1 ? -1 : 1;
    const mirrorTransform =
      i % 2 === 1
        ? `translate(${CX} ${CY}) scale(1 -1) translate(${-CX} ${-CY})`
        : undefined;
    return (
      <G transform={mirrorTransform}>
        {/* ── Rellenos grandes (base del patrón) ── */}
        <Path
          d={seed.bigCircle}
          fill={theme.glow}
          opacity={0.07}
          fillRule="nonzero"
        />
        {/* Cuñas rellenas (stained glass) */}
        <Path
          d={seed.sector1}
          fill={theme.fill[0]}
          opacity={0.28}
          fillRule="nonzero"
        />
        <Path
          d={seed.sector2}
          fill={theme.fill[1]}
          opacity={0.22}
          fillRule="nonzero"
        />
        {/* Hexágono interior */}
        <Path
          d={seed.hexagon}
          fill={theme.fill[2]}
          opacity={0.18}
          fillRule="nonzero"
        />
        {/* Rombo orbitante */}
        <Path
          d={seed.diamond}
          fill={theme.fill[3]}
          opacity={0.38}
          fillRule="nonzero"
        />
        {/* Blobs (círculos rellenos orbitando) */}
        {seed.blobs.map((d, bi) => (
          <Path
            key={bi}
            d={d}
            fill={theme.fill[bi % theme.fill.length]}
            opacity={0.45 - bi * 0.04}
            fillRule="nonzero"
          />
        ))}
        {/* ── Trazos (textura fina) ── */}
        <Path
          d={seed.spiral1}
          stroke={theme.stroke}
          strokeWidth={0.9}
          fill="none"
          opacity={0.55}
        />
        <Path
          d={seed.spiral2}
          stroke={theme.fill[1]}
          strokeWidth={0.7}
          fill="none"
          opacity={0.4}
        />
        <Path
          d={seed.rings}
          stroke={theme.stroke}
          strokeWidth={0.6}
          fill="none"
          opacity={0.22}
        />
      </G>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Canvas SVG */}
      <View
        style={StyleSheet.absoluteFill}
        {...panResponder.panHandlers}
        onTouchEnd={() => setControlsVisible((v) => !v)}
      >
        <Svg width={W} height={H}>
          {/* Degradado de fondo (halo central) */}
          <Defs>
            <LinearGradient id="bgGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <Stop offset="0%" stopColor="#0B0F14" />
              <Stop offset="100%" stopColor="#060A0F" />
            </LinearGradient>
            {/* ClipPath de la cuña */}
            <ClipPath id="kclip">
              <Path d={wedgePath} />
            </ClipPath>
          </Defs>

          {/* Fondo */}
          <Path
            d={`M 0 0 H ${W} V ${H} H 0 Z`}
            fill="url(#bgGrad)"
          />

          {/* N segmentos caleidoscópicos */}
          {Array.from({ length: segments }, (_, i) => {
            const rotDeg = (i * 360) / segments;
            return (
              <G
                key={i}
                clipPath="url(#kclip)"
                transform={`rotate(${rotDeg} ${CX} ${CY})`}
              >
                {renderSeedShapes(i)}
              </G>
            );
          })}

          {/* Círculo de recorte exterior (vignette) */}
          <Circle
            cx={CX}
            cy={CY}
            r={R * 0.98}
            fill="none"
            stroke="#0B0F14"
            strokeWidth={R * 0.08}
          />
        </Svg>
      </View>

      {/* ── UI overlay ───────────────────────────────────────────────── */}
      {controlsVisible && (
        <>
          {/* Barra superior */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Volver"
            >
              <Feather name="chevron-left" size={22} color="#EDE1D3" />
            </Pressable>

            <View style={styles.topCenter}>
              <Text style={styles.topTitle}>Caleidoscopio</Text>
              <Text style={styles.topSub}>
                {segments} segmentos · {theme.name}
              </Text>
            </View>

            <Pressable
              onPress={() => setPaused((v) => !v)}
              hitSlop={12}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={paused ? "Reanudar" : "Pausar"}
            >
              <Feather name={paused ? "play" : "pause"} size={18} color="#EDE1D3" />
            </Pressable>
          </View>

          {/* Panel inferior */}
          <View
            style={[styles.bottomPanel, { paddingBottom: insets.bottom + 12 }]}
          >
            {/* Segmentos */}
            <Text style={styles.sectionLabel}>Segmentos</Text>
            <View style={styles.row}>
              {SEGMENTS_OPTIONS.map((n) => {
                const on = segments === n;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setSegments(n)}
                    style={[styles.segBtn, on && styles.segBtnOn]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.segBtnText, on && styles.segBtnTextOn]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Colores */}
            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Color</Text>
            <View style={styles.row}>
              {THEMES.map((th, i) => {
                const on = themeIdx === i;
                return (
                  <TouchableOpacity
                    key={th.name}
                    onPress={() => setThemeIdx(i)}
                    style={[
                      styles.colorBtn,
                      { backgroundColor: th.fill[0] },
                      on && styles.colorBtnOn,
                    ]}
                    activeOpacity={0.75}
                    accessibilityLabel={th.name}
                  />
                );
              })}
            </View>

            {/* Velocidad */}
            <View style={styles.speedRow}>
              <Text style={styles.sectionLabel}>Velocidad</Text>
              <Text style={styles.speedVal}>
                {speed < 0.25 ? "Lenta" : speed < 0.65 ? "Normal" : "Rápida"}
              </Text>
            </View>
            <View style={styles.trackWrap}>
              {[0.1, 0.35, 0.6, 0.85, 1.0].map((v) => {
                const on = Math.abs(speed - v) < 0.13;
                return (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setSpeed(v)}
                    style={[styles.speedDot, on && styles.speedDotOn]}
                    hitSlop={8}
                  />
                );
              })}
            </View>

            {/* Guardar fondo */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                /* futuro: capturar frame + guardar */
              }}
              activeOpacity={0.8}
            >
              <Feather name="download" size={15} color="#BE9650" />
              <Text style={styles.saveBtnText}>Guardar como fondo</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Hint cuando los controles están ocultos */}
      {!controlsVisible && (
        <View
          style={[styles.tapHint, { bottom: insets.bottom + 28 }]}
          pointerEvents="none"
        >
          <Text style={styles.tapHintText}>toca para ver controles</Text>
        </View>
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "transparent",
    zIndex: 20,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  topCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  topTitle: {
    color: "#EDE1D3",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  topSub: {
    color: "#7A8FA8",
    fontSize: 11,
    marginTop: 1,
  },
  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(11,15,20,0.88)",
    borderTopWidth: 1,
    borderTopColor: "rgba(190,150,80,0.12)",
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 20,
  },
  sectionLabel: {
    color: "#7A8FA8",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  segBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnOn: {
    backgroundColor: "rgba(190,150,80,0.18)",
    borderColor: "rgba(190,150,80,0.55)",
  },
  segBtnText: {
    color: "#7A8FA8",
    fontSize: 14,
    fontWeight: "400",
  },
  segBtnTextOn: {
    color: "#BE9650",
    fontWeight: "700",
  },
  colorBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    opacity: 0.55,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorBtnOn: {
    opacity: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
  },
  speedVal: {
    color: "#BE9650",
    fontSize: 11,
  },
  trackWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  speedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  speedDotOn: {
    backgroundColor: "#BE9650",
    transform: [{ scale: 1.3 }],
  },
  saveBtn: {
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(190,150,80,0.1)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#BE9650",
    fontSize: 14,
    fontWeight: "600",
  },
  tapHint: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
  },
  tapHintText: {
    color: "rgba(237,225,211,0.3)",
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

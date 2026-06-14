import pptxgen from "pptxgenjs";
import { mkdirSync } from "fs";

mkdirSync("exports", { recursive: true });

const BG = "1B060F";
const BG_MID = "4A0C0C";
const GOLD = "D4AF37";
const ACCENT = "E9C46A";
const FG = "F4DAD5";
const MUTED = "B89B96";
const BORDER = "3D0E16";

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in

// ─── SLIDE 1: Formato, Loops y Niveles ───────────────────────────────────────

const s1 = pptx.addSlide();
s1.background = { color: BG };

// Franja superior dorada
s1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: "100%", h: 0.07,
  fill: { color: GOLD },
  line: { color: GOLD },
});

// Rectángulo lateral decorativo
s1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: 0.04, h: "100%",
  fill: { color: BG_MID },
  line: { color: BG_MID },
});

// Título principal
s1.addText("Guía para el Productor", {
  x: 0.3, y: 0.2, w: 8, h: 0.7,
  fontSize: 28,
  bold: true,
  color: GOLD,
  fontFace: "Georgia",
});

// Subtítulo
s1.addText("Parte 1 — Formato · Loops · Niveles", {
  x: 0.3, y: 0.85, w: 8, h: 0.4,
  fontSize: 13,
  color: MUTED,
  fontFace: "Calibri",
  italic: true,
});

// Línea separadora
s1.addShape(pptx.ShapeType.line, {
  x: 0.3, y: 1.2, w: 12.7, h: 0,
  line: { color: BORDER, width: 1.5 },
});

// ── Sección: FORMATO OBLIGATORIO ──
s1.addText("Formato obligatorio", {
  x: 0.3, y: 1.35, w: 6, h: 0.38,
  fontSize: 14,
  bold: true,
  color: ACCENT,
  fontFace: "Georgia",
});

s1.addText("AAC (.m4a)  —  no MP3, no WAV, no Opus", {
  x: 0.3, y: 1.7, w: 6, h: 0.32,
  fontSize: 12,
  color: FG,
  fontFace: "Calibri",
});

// Tabla de bitrates
const bitrateRows = [
  [
    { text: "Tipo de sonido", options: { bold: true, color: FG, fill: BG_MID, fontSize: 11, fontFace: "Calibri" } },
    { text: "Bitrate", options: { bold: true, color: FG, fill: BG_MID, fontSize: 11, fontFace: "Calibri" } },
  ],
  [
    { text: "Cuencos, gongs, campanas, ambient", options: { color: FG, fontSize: 10.5, fontFace: "Calibri" } },
    { text: "AAC 256 kbps VBR", options: { color: ACCENT, fontSize: 10.5, fontFace: "Calibri", bold: true } },
  ],
  [
    { text: "Voz guiada / meditación", options: { color: FG, fontSize: 10.5, fontFace: "Calibri" } },
    { text: "AAC 128–192 kbps", options: { color: ACCENT, fontSize: 10.5, fontFace: "Calibri", bold: true } },
  ],
  [
    { text: "Loops cortos de naturaleza (bundle)", options: { color: FG, fontSize: 10.5, fontFace: "Calibri" } },
    { text: "AAC 128–160 kbps", options: { color: ACCENT, fontSize: 10.5, fontFace: "Calibri", bold: true } },
  ],
];

s1.addTable(bitrateRows, {
  x: 0.3, y: 2.05, w: 6.2,
  rowH: 0.35,
  fill: { color: "160408" },
  border: { type: "solid", color: BORDER, pt: 0.8 },
  align: "left",
  valign: "middle",
  margin: [4, 8, 4, 8],
});

// ── Sección: LOOPS ──
s1.addText("Loops", {
  x: 7.0, y: 1.35, w: 5.9, h: 0.38,
  fontSize: 14,
  bold: true,
  color: ACCENT,
  fontFace: "Georgia",
});

const loopItems = [
  "Empalme seamless: el último sample une con el primero sin clic ni silencio",
  "Cortar en cruce por cero o en posición de fase neutra",
  "Naturaleza: evitar golpes de ola o pájaros justo al inicio/final",
  "Duración recomendada: 20–60 segundos por loop",
  "Cuencos/gongs: reverb debe morir antes del punto de loop (o crossfade 500 ms–1 s)",
];

loopItems.forEach((item, i) => {
  s1.addText("›  " + item, {
    x: 7.0, y: 1.78 + i * 0.44, w: 5.95, h: 0.4,
    fontSize: 10.5,
    color: FG,
    fontFace: "Calibri",
    wrap: true,
  });
});

// ── Sección: NIVELES ──
s1.addShape(pptx.ShapeType.line, {
  x: 0.3, y: 4.65, w: 12.7, h: 0,
  line: { color: BORDER, width: 1 },
});

s1.addText("Niveles y dinámica", {
  x: 0.3, y: 4.78, w: 6, h: 0.38,
  fontSize: 14,
  bold: true,
  color: ACCENT,
  fontFace: "Georgia",
});

const nivelItems = [
  "Pico máximo: –1 dBFS",
  "Loudness objetivo: –18 a –23 LUFS  (contenido dinámico, no aplastado)",
  "Evitar limiters agresivos — se pierde profundidad",
  "Binaurales: mismo nivel en ambos canales (salvo diferencia de frecuencia intencional)",
];

nivelItems.forEach((item, i) => {
  s1.addText("›  " + item, {
    x: 0.3, y: 5.2 + i * 0.38, w: 12.7, h: 0.35,
    fontSize: 10.5,
    color: FG,
    fontFace: "Calibri",
  });
});

// Franja inferior
s1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 7.35, w: "100%", h: 0.15,
  fill: { color: BG_MID },
  line: { color: BG_MID },
});
s1.addText("RESONANCIA — Casa del Cuenco", {
  x: 0.3, y: 7.3, w: 6, h: 0.2,
  fontSize: 8,
  color: MUTED,
  fontFace: "Calibri",
  italic: true,
});
s1.addText("1 / 2", {
  x: 12.5, y: 7.3, w: 0.8, h: 0.2,
  fontSize: 8,
  color: MUTED,
  fontFace: "Calibri",
  align: "right",
});

// ─── SLIDE 2: Efectos, BPM y Checklist ───────────────────────────────────────

const s2 = pptx.addSlide();
s2.background = { color: BG };

// Franja superior dorada
s2.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: "100%", h: 0.07,
  fill: { color: GOLD },
  line: { color: GOLD },
});

// Rectángulo lateral decorativo
s2.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: 0.04, h: "100%",
  fill: { color: BG_MID },
  line: { color: BG_MID },
});

// Título
s2.addText("Guía para el Productor", {
  x: 0.3, y: 0.2, w: 8, h: 0.7,
  fontSize: 28,
  bold: true,
  color: GOLD,
  fontFace: "Georgia",
});

// Subtítulo
s2.addText("Parte 2 — Efectos · BPM · Checklist final", {
  x: 0.3, y: 0.85, w: 8, h: 0.4,
  fontSize: 13,
  color: MUTED,
  fontFace: "Calibri",
  italic: true,
});

// Línea separadora
s2.addShape(pptx.ShapeType.line, {
  x: 0.3, y: 1.2, w: 12.7, h: 0,
  line: { color: BORDER, width: 1.5 },
});

// ── Tabla de efectos ──
s2.addText("Efectos recomendados para relajación", {
  x: 0.3, y: 1.3, w: 9, h: 0.38,
  fontSize: 14,
  bold: true,
  color: ACCENT,
  fontFace: "Georgia",
});

const fxRows = [
  [
    { text: "Efecto", options: { bold: true, color: FG, fill: BG_MID, fontSize: 10.5, fontFace: "Calibri" } },
    { text: "Uso", options: { bold: true, color: FG, fill: BG_MID, fontSize: 10.5, fontFace: "Calibri" } },
    { text: "Cómo", options: { bold: true, color: FG, fill: BG_MID, fontSize: 10.5, fontFace: "Calibri" } },
  ],
  [
    { text: "Reverb", options: { color: GOLD, fontSize: 10, fontFace: "Calibri", bold: true } },
    { text: "Cuencos, campanas, instrumentos", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
    { text: "Hall/Room 2–6 s decay · pre-delay 20–40 ms", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
  ],
  [
    { text: "Fade in/out", options: { color: GOLD, fontSize: 10, fontFace: "Calibri", bold: true } },
    { text: "Todos los archivos", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
    { text: "Fade in 2–5 s al inicio · fade out 3–8 s al final", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
  ],
  [
    { text: "EQ sustractivo", options: { color: GOLD, fontSize: 10, fontFace: "Calibri", bold: true } },
    { text: "Naturaleza, ambient", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
    { text: "Cortar <60–80 Hz · suavizar picos en 2–4 kHz", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
  ],
  [
    { text: "Stereo widener", options: { color: GOLD, fontSize: 10, fontFace: "Calibri", bold: true } },
    { text: "Ambiente, texturas", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
    { text: "Ampliar imagen; centro (voz/cuenco) mono-compatible", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
  ],
  [
    { text: "Chorus / Ensemble", options: { color: GOLD, fontSize: 10, fontFace: "Calibri", bold: true } },
    { text: "Cuencos de cristal", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
    { text: "Sutil 10–20% wet — sin distorsión", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
  ],
  [
    { text: "Delay", options: { color: GOLD, fontSize: 10, fontFace: "Calibri", bold: true } },
    { text: "Cuencos ancestrales", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
    { text: "Cuartos/corcheas sincronizados · 1–2 repeticiones", options: { color: FG, fontSize: 10, fontFace: "Calibri" } },
  ],
];

s2.addTable(fxRows, {
  x: 0.3, y: 1.72, w: 8.0,
  rowH: 0.37,
  colW: [1.6, 2.4, 4.0],
  fill: { color: "160408" },
  border: { type: "solid", color: BORDER, pt: 0.8 },
  align: "left",
  valign: "middle",
  margin: [3, 8, 3, 8],
});

// ── BPM ──
s2.addText("BPM y tempo", {
  x: 8.55, y: 1.3, w: 4.75, h: 0.38,
  fontSize: 14,
  bold: true,
  color: ACCENT,
  fontFace: "Georgia",
});

const bpmItems = [
  "Loops de naturaleza: tempo libre, sin sincronización",
  "Cuencos / percusión: 40–70 BPM si hay pulso perceptible",
  "Binaurales — frecuencia de diferencia L/R:",
  "  Delta 0.5–4 Hz → sueño profundo",
  "  Theta 4–8 Hz → meditación profunda",
  "  Alpha 8–13 Hz → relajación consciente",
  "  Beta 13–30 Hz → concentración",
  "  Gamma 30–100 Hz → claridad e integración",
];

bpmItems.forEach((item, i) => {
  const isChild = item.startsWith("  ");
  s2.addText((isChild ? "      " : "›  ") + item.trim(), {
    x: 8.55, y: 1.75 + i * 0.36, w: 4.65, h: 0.33,
    fontSize: isChild ? 9.5 : 10.5,
    color: isChild ? MUTED : FG,
    fontFace: "Calibri",
  });
});

// ── Checklist ──
s2.addShape(pptx.ShapeType.line, {
  x: 0.3, y: 4.65, w: 12.7, h: 0,
  line: { color: BORDER, width: 1 },
});

s2.addText("Checklist final por archivo", {
  x: 0.3, y: 4.75, w: 6, h: 0.38,
  fontSize: 14,
  bold: true,
  color: ACCENT,
  fontFace: "Georgia",
});

const checkItems = [
  "Formato AAC .m4a al bitrate correcto",
  "Loop seamless probado en bucle 3–5 veces",
  "Pico máximo –1 dBFS · LUFS entre –18 y –23",
  "Fade in al inicio (2–5 s)",
  "Sin ruidos de fondo ni clics",
  "Estéreo balanceado, mono-compatible",
  "Binaurales: frecuencias L/R correctas según tipo",
];

const cols = [checkItems.slice(0, 4), checkItems.slice(4)];
cols.forEach((col, ci) => {
  col.forEach((item, i) => {
    s2.addText("✓  " + item, {
      x: 0.3 + ci * 6.5, y: 5.18 + i * 0.38, w: 6.4, h: 0.35,
      fontSize: 10.5,
      color: FG,
      fontFace: "Calibri",
    });
  });
});

// Franja inferior
s2.addShape(pptx.ShapeType.rect, {
  x: 0, y: 7.35, w: "100%", h: 0.15,
  fill: { color: BG_MID },
  line: { color: BG_MID },
});
s2.addText("RESONANCIA — Casa del Cuenco", {
  x: 0.3, y: 7.3, w: 6, h: 0.2,
  fontSize: 8,
  color: MUTED,
  fontFace: "Calibri",
  italic: true,
});
s2.addText("2 / 2", {
  x: 12.5, y: 7.3, w: 0.8, h: 0.2,
  fontSize: 8,
  color: MUTED,
  fontFace: "Calibri",
  align: "right",
});

// ── Exportar ──
await pptx.writeFile({ fileName: "exports/guia-productor.pptx" });
console.log("✓ exports/guia-productor.pptx generado");

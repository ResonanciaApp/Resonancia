import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "fs";

mkdirSync("exports", { recursive: true });

// Página 16:9 en puntos (13.33 x 7.5 in × 72)
const W = 960;
const H = 540;

const BG     = "#1B060F";
const BG_MID = "#4A0C0C";
const GOLD   = "#D4AF37";
const ACCENT = "#E9C46A";
const FG     = "#F4DAD5";
const MUTED  = "#B89B96";
const BORDER = "#3D0E16";

const doc = new PDFDocument({ size: [W, H], margin: 0, autoFirstPage: false });
const out = createWriteStream("exports/guia-productor.pdf");
doc.pipe(out);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function bg(color = BG) {
  doc.rect(0, 0, W, H).fill(color);
}

function topBar() {
  doc.rect(0, 0, W, 5).fill(GOLD);
  doc.rect(0, 0, 3, H).fill(BG_MID);
}

function bottomBar(n, total) {
  doc.rect(0, H - 16, W, 16).fill(BG_MID);
  doc.fontSize(7).font("Helvetica-Oblique").fillColor(MUTED)
    .text("RESONANCIA — Casa del Cuenco", 22, H - 11, { lineBreak: false });
  doc.fontSize(7).font("Helvetica").fillColor(MUTED)
    .text(`${n} / ${total}`, W - 45, H - 11, { lineBreak: false });
}

function hline(y, color = BORDER) {
  doc.moveTo(22, y).lineTo(W - 22, y).strokeColor(color).lineWidth(0.8).stroke();
}

function vline(x, y1, y2, color = BORDER) {
  doc.moveTo(x, y1).lineTo(x, y2).strokeColor(color).lineWidth(0.8).stroke();
}

function header(subtitle) {
  doc.fontSize(22).font("Times-Bold").fillColor(GOLD)
    .text("Guía para el Productor", 22, 16, { lineBreak: false });
  doc.fontSize(10).font("Helvetica-Oblique").fillColor(MUTED)
    .text(subtitle, 22, 42, { lineBreak: false });
  hline(58);
}

function sectionTitle(text, x, y, w = 300) {
  doc.fontSize(12).font("Times-Bold").fillColor(ACCENT)
    .text(text, x, y, { width: w, lineBreak: false });
}

function bodyText(text, x, y, w = 300, color = FG, size = 9.5) {
  doc.fontSize(size).font("Helvetica").fillColor(color)
    .text(text, x, y, { width: w, lineBreak: false });
}

function bullet(text, x, y, w = 300, color = FG) {
  doc.fontSize(9).font("Helvetica").fillColor(color)
    .text("›  " + text, x, y, { width: w, lineBreak: false });
}

function tableRow(cols, x, y, colWidths, rowH = 22, isHeader = false) {
  let cx = x;
  cols.forEach((cell, i) => {
    const cw = colWidths[i];
    const fillColor = isHeader ? BG_MID : "#160408";
    doc.rect(cx, y, cw, rowH).fill(fillColor);
    doc.rect(cx, y, cw, rowH).strokeColor(BORDER).lineWidth(0.5).stroke();
    const textColor = isHeader ? FG : (cell.highlight ? ACCENT : FG);
    const font = (isHeader || cell.bold) ? "Helvetica-Bold" : "Helvetica";
    doc.fontSize(8.5).font(font).fillColor(textColor)
      .text(cell.text, cx + 5, y + rowH / 2 - 4.5, { width: cw - 10, lineBreak: false });
    cx += cw;
  });
}

// ─── SLIDE 1: Formato · Loops · Niveles ──────────────────────────────────────
doc.addPage({ size: [W, H], margin: 0 });
bg(); topBar(); header("Parte 1 — Formato · Loops · Niveles");

// --- Formato ---
sectionTitle("Formato obligatorio", 22, 70);
bodyText("AAC (.m4a)  —  no MP3, no WAV, no Opus", 22, 86, 340);

const bitrateRows = [
  [{ text: "Tipo de sonido" }, { text: "Bitrate" }],
  [{ text: "Cuencos, gongs, campanas, ambient" }, { text: "AAC 256 kbps VBR", highlight: true }],
  [{ text: "Voz guiada / meditación" },            { text: "AAC 128–192 kbps", highlight: true }],
  [{ text: "Loops cortos de naturaleza (bundle)" }, { text: "AAC 128–160 kbps", highlight: true }],
];
bitrateRows.forEach((row, i) =>
  tableRow(row, 22, 102 + i * 22, [290, 140], 22, i === 0)
);

// --- Loops ---
sectionTitle("Loops", 490, 70);
const loopItems = [
  "Empalme seamless: último sample une con el primero sin clic ni silencio",
  "Cortar en cruce por cero o en posición de fase neutra",
  "Naturaleza: evitar golpes de ola o pájaros justo al inicio/final",
  "Duración recomendada: 20–60 segundos por loop",
  "Cuencos/gongs: reverb debe morir antes del punto de loop (o crossfade 0.5–1 s)",
];
loopItems.forEach((item, i) => bullet(item, 490, 86 + i * 28, 448));

// --- Niveles ---
hline(300);
sectionTitle("Niveles y dinámica", 22, 310);
const nivelItems = [
  "Pico máximo: –1 dBFS",
  "Loudness objetivo: –18 a –23 LUFS  (contenido dinámico, no aplastado)",
  "Evitar limiters agresivos — se pierde profundidad y espacio",
  "Binaurales: mismo nivel en ambos canales (salvo diferencia de frecuencia intencional)",
];
nivelItems.forEach((item, i) => bullet(item, 22, 328 + i * 22, W - 50));

bottomBar(1, 3);

// ─── SLIDE 2: Efectos · BPM · Checklist ──────────────────────────────────────
doc.addPage({ size: [W, H], margin: 0 });
bg(); topBar(); header("Parte 2 — Efectos · BPM · Checklist final");

// --- Tabla de efectos ---
sectionTitle("Efectos recomendados para relajación", 22, 70);
const fxRows = [
  [{ text: "Efecto" }, { text: "Uso" }, { text: "Cómo" }],
  [{ text: "Reverb", bold: true }, { text: "Cuencos, campanas, instrumentos" }, { text: "Hall/Room 2–6 s decay · pre-delay 20–40 ms" }],
  [{ text: "Fade in/out", bold: true }, { text: "Todos los archivos" }, { text: "Fade in 2–5 s al inicio · fade out 3–8 s al final" }],
  [{ text: "EQ sustractivo", bold: true }, { text: "Naturaleza, ambient" }, { text: "Cortar <60–80 Hz · suavizar picos en 2–4 kHz" }],
  [{ text: "Stereo widener", bold: true }, { text: "Ambiente, texturas" }, { text: "Ampliar imagen; centro (voz/cuenco) mono-compatible" }],
  [{ text: "Chorus / Ensemble", bold: true }, { text: "Cuencos de cristal" }, { text: "Sutil 10–20% wet — sin distorsión" }],
  [{ text: "Delay", bold: true }, { text: "Cuencos ancestrales" }, { text: "Cuartos/corcheas sincronizados · 1–2 repeticiones" }],
];
fxRows.forEach((row, i) =>
  tableRow(row, 22, 88 + i * 21, [110, 180, 280], 21, i === 0)
);

// --- BPM ---
sectionTitle("BPM y tempo", 620, 70);
const bpmItems = [
  ["Loops de naturaleza: tempo libre, sin sincronización", false],
  ["Cuencos / percusión: 40–70 BPM si hay pulso perceptible", false],
  ["Binaurales — diferencia L/R:", false],
  ["Delta 0.5–4 Hz  →  sueño profundo", true],
  ["Theta 4–8 Hz  →  meditación profunda", true],
  ["Alpha 8–13 Hz  →  relajación consciente", true],
  ["Beta 13–30 Hz  →  concentración", true],
  ["Gamma 30–100 Hz  →  claridad e integración", true],
];
bpmItems.forEach(([item, child], i) => {
  if (child) {
    doc.fontSize(8).font("Helvetica").fillColor(MUTED)
      .text("      " + item, 620, 88 + i * 22, { width: 318, lineBreak: false });
  } else {
    bullet(item, 620, 88 + i * 22, 318);
  }
});

// --- Checklist ---
hline(304);
sectionTitle("Checklist final por archivo", 22, 312);
const checkItems = [
  "Formato AAC .m4a al bitrate correcto",
  "Loop seamless probado en bucle 3–5 veces",
  "Pico máximo –1 dBFS · LUFS entre –18 y –23",
  "Fade in al inicio (2–5 s)",
  "Sin ruidos de fondo ni clics",
  "Estéreo balanceado, mono-compatible",
  "Binaurales: frecuencias L/R correctas según tipo",
];
const col1 = checkItems.slice(0, 4);
const col2 = checkItems.slice(4);
col1.forEach((item, i) => {
  doc.fontSize(9).font("Helvetica").fillColor(GOLD).text("✓", 22, 330 + i * 22, { lineBreak: false });
  bodyText(item, 38, 330 + i * 22, 430);
});
col2.forEach((item, i) => {
  doc.fontSize(9).font("Helvetica").fillColor(GOLD).text("✓", 490, 330 + i * 22, { lineBreak: false });
  bodyText(item, 506, 330 + i * 22, 430);
});

bottomBar(2, 3);

// ─── SLIDE 3: Cortos vs Largos ────────────────────────────────────────────────
doc.addPage({ size: [W, H], margin: 0 });
bg(); topBar(); header("Parte 3 — Clips cortos vs Clips largos");

// Cabeceras de columna
doc.rect(22, 68, 454, 28).fill(BG_MID);
doc.fontSize(12).font("Times-Bold").fillColor(GOLD)
  .text("Clips cortos  (30–40 s)", 22, 75, { width: 454, align: "center", lineBreak: false });

doc.rect(490, 68, 448, 28).fill(BG_MID);
doc.fontSize(12).font("Times-Bold").fillColor(GOLD)
  .text("Clips largos  (2–3 min)", 490, 75, { width: 448, align: "center", lineBreak: false });

// Subtítulos de columna
doc.fontSize(8).font("Helvetica-Oblique").fillColor(MUTED)
  .text("Bloques individuales del mezclador (SOUND_MAP)", 22, 100, { width: 454, align: "center", lineBreak: false });
doc.fontSize(8).font("Helvetica-Oblique").fillColor(MUTED)
  .text("Sesión completa en el reproductor inmersivo (AUDIO_MAP / AMBIENT_MAP)", 490, 100, { width: 448, align: "center", lineBreak: false });

hline(115);
vline(480, 68, H - 16);

const compareRows = [
  [
    "Loop seamless",
    "Crítico — el punto de unión se escucha decenas de veces por sesión",
    "Necesario si es loop — con 2–3 min la repetición es mucho menos perceptible",
  ],
  [
    "Fade in/out en el archivo",
    "No incluir — el app controla el volumen con el slider",
    "Sí, recomendable — arranque suave y cierre gradual forman la experiencia",
  ],
  [
    "Contenido",
    "Un solo sonido limpio (cuenco, pájaro, agua). Sin mezcla interna",
    "Mezcla interna: cuencos + pajaritos + agua equilibrados por el productor",
  ],
  [
    "Dinámica",
    "Estable y sin variación — es un loop continuo, no una composición",
    "Puede evolucionar — momentos más densos, silencios, variación interna",
  ],
  [
    "EQ / Reverb",
    "Tratamiento individual del instrumento. Reverb que muera antes del loop",
    "EQ global de la mezcla terminada. Verificar mono-compatibility al final",
  ],
];

compareRows.forEach(([label, left, right], i) => {
  const y = 124 + i * 76;
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor(ACCENT)
    .text(label, 22, y, { lineBreak: false });
  doc.fontSize(9).font("Helvetica").fillColor(FG)
    .text(left, 22, y + 16, { width: 448, lineBreak: true });
  doc.fontSize(9).font("Helvetica").fillColor(FG)
    .text(right, 490, y + 16, { width: 448, lineBreak: true });
  if (i < compareRows.length - 1) {
    doc.moveTo(22, y + 70).lineTo(W - 22, y + 70)
      .strokeColor(BORDER).lineWidth(0.4).stroke();
  }
});

bottomBar(3, 3);

doc.end();
out.on("finish", () => console.log("✓ exports/guia-productor.pdf generado"));

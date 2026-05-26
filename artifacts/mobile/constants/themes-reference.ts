/**
 * RESONANCIA — Referencia de paletas de color
 *
 * OPCIÓN A: Tema original (verde oscuro + acentos dorado-púrpura)
 * OPCIÓN B: Tema actual (verde más claro + headers crema + fondo nuevo)
 *
 * Para cambiar de tema, aplicar los valores correspondientes en cada archivo.
 */

// ─────────────────────────────────────────────────────────────────────────────
// OPCIÓN A — Estado anterior (ayer)
// ─────────────────────────────────────────────────────────────────────────────
export const THEME_A = {

  // ── constants/colors.ts ──────────────────────────────────────────────────
  colors: {
    background:          "#070E09",
    card:                "#111E16",
    primary:             "#B6955F",
    primaryForeground:   "#070E09",
    foreground:          "#C8C1B5",
    cardForeground:      "#C8C1B5",
    accent:              "#C8C1B5",
    secondary:           "#3E5346",
    secondaryForeground: "#C8C1B5",
    muted:               "#3E5346",
    mutedForeground:     "#72826F",
    border:              "#1C2C22",
    input:               "#3E5346",
  },

  // ── components/SacredBackground.tsx ─────────────────────────────────────
  sacredBackground: {
    image:          "bg-texture.png",   // assets/images/bg-texture.png
    overlayColor:   "rgba(4,8,5,0.72)",
  },

  // ── components/VozInteriorPanel.tsx ─────────────────────────────────────
  vozInterior: {
    gradient:         ["#241C0C", "#141008"] as [string, string],
    headerTitle:      "#8AB894",
    headerSubtitle:   "rgba(138,184,148,0.65)",
    historyCount:     "#8AB894",
    historyIcon:      "#8AB894",
  },

  // ── app/(tabs)/diario.tsx — Mis reflexiones + Ideas Brillantes ───────────
  diario: {
    gradient:      ["#241C0C", "#141008"] as [string, string],
    panelTitle:    "#8AB894",
    panelSubtitle: "rgba(138,184,148,0.65)",
    historyIcon:   "#8AB894",
    modules: {
      misReflexiones: { accentColor: "#8AAAD4" },
      ideasBrillantes: { accentColor: "#F0CC82" },
    },
  },

  // ── components/MensajesAnonimosPanel.tsx ────────────────────────────────
  mensajesDelAlma: {
    gradient:           ["#5C1A3A", "#3A0D22"] as [string, string],  // rosa/púrpura
    headerTitle:        "#C8A860",
    headerSubtitle:     "rgba(200,168,96,0.65)",
    cycleBadgeBg:       "rgba(182,149,95,0.18)",
    cycleBadgeText:     "#C8A860",
    clockIcon:          "#C8A860",
    infoIcon:           "rgba(200,168,96,0.7)",
    iconBg:             "rgba(182,149,95,0.22)",
    mainIcon:           "#B6955F",
  },

  // ── data/categories.ts — 3 Minutos de Sabiduría ─────────────────────────
  sabiduriaDia: {
    color:    "#D4A8C8",
    gradient: ["#5E2A52", "#3A1430"] as [string, string],
  },

  // ── components/SessionCard.tsx (horizontal) ──────────────────────────────
  sessionCard: {
    warmTint: null,   // sin overlay cálido
  },
};


// ─────────────────────────────────────────────────────────────────────────────
// OPCIÓN B — Estado actual (hoy)
// ─────────────────────────────────────────────────────────────────────────────
export const THEME_B = {

  // ── constants/colors.ts ──────────────────────────────────────────────────
  colors: {
    background:          "#070E09",
    card:                "#1A2A1E",   // más claro que A
    primary:             "#B6955F",
    primaryForeground:   "#070E09",
    foreground:          "#C8C1B5",
    cardForeground:      "#C8C1B5",
    accent:              "#C8C1B5",
    secondary:           "#3E5346",
    secondaryForeground: "#C8C1B5",
    muted:               "#3E5346",
    mutedForeground:     "#72826F",
    border:              "#1C2C22",
    input:               "#3E5346",
  },

  // ── components/SacredBackground.tsx ─────────────────────────────────────
  sacredBackground: {
    image:          "bg-texture.jpg",   // assets/images/bg-texture.jpg (más oscura)
    overlayColor:   "rgba(4,8,5,0.62)", // overlay más ligero que A
  },

  // ── components/VozInteriorPanel.tsx ─────────────────────────────────────
  vozInterior: {
    gradient:         ["#111E16", "#0D1810"] as [string, string],
    headerTitle:      "#EDE1D3",
    headerSubtitle:   "rgba(237,225,211,0.50)",
    historyCount:     "rgba(237,225,211,0.7)",
    historyIcon:      "rgba(237,225,211,0.6)",
  },

  // ── app/(tabs)/diario.tsx — Mis reflexiones + Ideas Brillantes ───────────
  diario: {
    gradient:      ["#111E16", "#0D1810"] as [string, string],
    panelTitle:    "#EDE1D3",
    panelSubtitle: "rgba(237,225,211,0.50)",
    historyIcon:   "rgba(237,225,211,0.6)",
    modules: {
      misReflexiones: { accentColor: "#8AAAD4" },
      ideasBrillantes: { accentColor: "#F0CC82" },
    },
  },

  // ── components/MensajesAnonimosPanel.tsx ────────────────────────────────
  mensajesDelAlma: {
    gradient:           ["#111E16", "#0D1810"] as [string, string],
    headerTitle:        "#EDE1D3",
    headerSubtitle:     "rgba(237,225,211,0.50)",
    cycleBadgeBg:       "rgba(237,225,211,0.10)",
    cycleBadgeText:     "rgba(237,225,211,0.7)",
    clockIcon:          "rgba(237,225,211,0.7)",
    infoIcon:           "rgba(237,225,211,0.45)",
    iconBg:             "rgba(138,184,148,0.18)",
    mainIcon:           "#8AB894",
  },

  // ── data/categories.ts — 3 Minutos de Sabiduría ─────────────────────────
  sabiduriaDia: {
    color:    "#F5E8A8",
    gradient: ["#3A3E16", "#2E3212"] as [string, string],
  },

  // ── components/SessionCard.tsx (horizontal) ──────────────────────────────
  sessionCard: {
    warmTint: "rgba(190,145,50,0.04)",  // overlay ámbar sutil sobre tarjetas
  },
};

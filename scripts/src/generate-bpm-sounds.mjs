#!/usr/bin/env node
/**
 * Genera loops de batería sintéticos para el mixer BPM.
 * Usa ffmpeg (aevalsrc + adelay + amix) — sin dependencias externas.
 *
 * Salida: artifacts/mobile/assets/audio/mixer/bpm/*.wav  (PCM mono 44.1 kHz)
 * Cada archivo = 2 compases en 4/4 al BPM indicado:
 *   - contenido musical con conteo de muestras EXACTO (= (60/bpm)*8 s)
 *   - + 0.5 s de SILENCIO al final (buffer)
 * El buffer existe porque el loop NO es nativo: MixerContext reproduce con
 * loop=false y, al cruzar el final musical, hace seekTo(0) en caliente (sin
 * parar) durante la cola silenciosa → loop gapless y a tempo. El buffer evita
 * que el player llegue al fin del archivo (que dispararía el corte nativo) si
 * el seek llega unos ms tarde. El umbral de wrap = duración MUSICAL, no la del
 * archivo, así el silencio del buffer nunca se escucha.
 *
 * Síntesis:
 *   Kick    — sine con pitch sweep exponencial (80→30 Hz) + click de ataque
 *   Snare   — ruido + tono 185 Hz + filtro HP para cuerpo y "crujido"
 *   Hi-Hat  — ruido de alta frecuencia (>8 kHz), muy breve
 *   Shaker  — ruido de banda media-alta con micro-burst
 *   Clap    — capas de ruido en cascada simulando palmada
 *   Rimshot — 700 Hz + ruido con ataque duro y cola corta
 *   Tambor  — sine grave 65 Hz con pitch micro-drop + capa de ruido suave
 */

import { spawnSync, execSync } from "child_process";
import { mkdirSync } from "fs";
import { join } from "path";

const OUT_DIR = "artifacts/mobile/assets/audio/mixer/bpm";
const TMP = "/tmp/resonancia_bpm_hits";
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP, { recursive: true });

// ─── helpers ────────────────────────────────────────────────────────────────

function ffmpeg(args, label) {
  const r = spawnSync("ffmpeg", ["-y", ...args], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error(`❌ ${label}:\n${r.stderr?.slice(-800)}`);
    process.exit(1);
  }
}

/**
 * Genera un hit individual como WAV estéreo 44100 Hz.
 * @param {string} name  — nombre de archivo sin extensión
 * @param {string} expr  — expresión aevalsrc (monoaural; se convierte a estéreo)
 * @param {number} dur   — duración en segundos
 * @param {string[]} af  — filtros de audio adicionales (cada uno = -af arg)
 */
function hit(name, expr, dur, af = []) {
  const out = join(TMP, `${name}.wav`);
  const filters = [
    ...af,
    "aformat=sample_fmts=s16:sample_rates=44100:channel_layouts=stereo",
  ].join(",");
  ffmpeg(
    [
      "-f", "lavfi",
      "-i", `aevalsrc=${expr}:s=44100:d=${dur}:c=stereo`,
      "-af", filters,
      out,
    ],
    name
  );
  return out;
}

/**
 * Ensambla un loop de 2 compases (8 beats a 4/4) colocando el hit
 * en cada posición indicada y exportando a MP3.
 *
 * @param {string}   hitWav    — path al hit WAV
 * @param {number}   bpm
 * @param {number[]} positions — posiciones en beats (0-indexed, 0..7, puede ser fraccionario)
 * @param {string}   outName   — nombre final sin extensión
 * @param {number}   [gain=1]  — volumen relativo del loop (0-1)
 */
const SR = 44100;
// Cola de silencio tras el contenido musical (ver cabecera). Da margen al
// seekTo(0) en caliente para que el player nunca toque el fin del archivo.
const BUFFER_SAMPLES = Math.round(0.5 * SR); // 0.5 s

function loop(hitWav, bpm, positions, outName, gain = 1) {
  const beatMs = 60_000 / bpm;
  // Conteo de muestras EXACTO del contenido musical (2 bars × 4/4). Debe ser
  // entero para que el umbral de wrap caiga justo en el final del compás.
  const totalSamples = Math.round((60 / bpm) * 8 * SR);

  const inputs = positions.flatMap(() => ["-i", hitWav]);

  const delays = positions
    .map((b, i) => {
      const samples = Math.round(b * (beatMs / 1000) * SR);
      // adelay con delays=...:all=1 trabaja en ms; usamos delay en muestras vía
      // aresample no es directo, así que aplicamos delay en ms con precisión.
      const ms = (samples / SR) * 1000;
      return `[${i}]adelay=${ms.toFixed(3)}:all=1[d${i}]`;
    })
    .join(";");

  const mixIn = positions.map((_, i) => `[d${i}]`).join("");
  const n = positions.length;

  // atrim recorta el contenido musical a muestra exacta; apad agrega el buffer
  // de silencio. Longitud final = totalSamples (musical) + BUFFER_SAMPLES.
  const fc =
    `${delays};` +
    `${mixIn}amix=inputs=${n}:normalize=0,` +
    `atrim=end_sample=${totalSamples},` +
    `apad=whole_len=${totalSamples + BUFFER_SAMPLES},` +
    `volume=${gain}`;

  const out = join(OUT_DIR, `${outName}.wav`);
  ffmpeg(
    [
      ...inputs,
      "-filter_complex", fc,
      "-ar", String(SR), "-ac", "1",
      "-codec:a", "pcm_s16le",
      out,
    ],
    outName
  );
  console.log(`  ✓ ${outName}.wav`);
}

// ─── 1. Hits individuales ────────────────────────────────────────────────────
console.log("Sintetizando hits...\n");

// KICK: barrido de pitch 90→25 Hz (decaimiento exponencial acelerado) +
//       click de ataque en ~3 kHz para presencia, todo con decay suave.
const kickWav = hit(
  "kick",
  // freq instantánea: f(t) = 90·exp(-14t) + 25  →  fase = integral de 2π·f
  // Simplificamos la fase acumulada: usamos chirp implícito vía multiplicación de freq y t
  // Capa 1: cuerpo grave (sweep)
  // Capa 2: click de ataque (3 kHz, muy breve)
  "(sin(2*PI*(90*exp(-14*t)+25)*t)*exp(-t*5)*0.85 + sin(2*PI*3200*t)*exp(-t*110)*0.18)",
  0.65,
  ["volume=11dB", "alimiter=level_in=11dB:level_out=0.96:limit=0.96:attack=1:release=60"]
);

// SNARE: ruido ancho + resonancia 185 Hz (cuerpo de tarola) +
//        ligero HP para el "crack" inicial.
const snareWav = hit(
  "snare",
  // ruido × decay (parte "wire") + tono (parte "head")
  "(sin(random(0)*2*PI)*0.60 + sin(2*PI*185*t)*0.40) * exp(-t*9)",
  0.38,
  [
    "highpass=f=200",
    "volume=8dB",
    "alimiter=level_out=0.9:attack=1:release=50",
  ]
);

// HI-HAT CERRADO: ruido altísimo (>8 kHz), ataque instantáneo, decay ~55 ms.
const hihatCWav = hit(
  "hihat_c",
  "sin(random(1)*2*PI) * exp(-t*55)",
  0.10,
  [
    "highpass=f=8000",
    "volume=5dB",
    "alimiter=level_out=0.72",
  ]
);

// HI-HAT ABIERTO: igual pero decay más lento (~6x), da sensación de abierto.
const hihatOWav = hit(
  "hihat_o",
  "sin(random(2)*2*PI) * exp(-t*9)",
  0.40,
  [
    "highpass=f=7000",
    "volume=4dB",
    "alimiter=level_out=0.65",
  ]
);

// SHAKER: ruido de banda media-alta (3-7 kHz), micro-burst muy corto.
const shakerWav = hit(
  "shaker",
  "sin(random(3)*2*PI) * exp(-t*35)",
  0.14,
  [
    "bandpass=f=4500:width_type=o:w=2.2",
    "volume=6dB",
    "alimiter=level_out=0.60",
  ]
);

// CLAP: 3 capas de ruido en cascada con micro-delays entre sí para dar
//       sensación de "múltiples manos". Se crea con amix de tres capas.
// — Simplificado: un solo burst de ruido con ataque duro y cola media
const clapWav = hit(
  "clap",
  // ruido con decay medio (simula reverb de sala)
  "sin(random(4)*2*PI) * exp(-t*11)",
  0.28,
  [
    "bandpass=f=2000:width_type=o:w=1.6",
    "volume=7dB",
    "alimiter=level_out=0.85",
  ]
);

// RIMSHOT: tono 700 Hz (aro metálico) + ruido blanco, ataque duro, cola muy corta.
const rimshotWav = hit(
  "rimshot",
  "(sin(2*PI*700*t)*0.60 + sin(random(5)*2*PI)*0.40) * exp(-t*28)",
  0.18,
  [
    "volume=7dB",
    "alimiter=level_out=0.88",
  ]
);

// TAMBOR: sine grave 65 Hz con micro-pitch-drop (cuerpo profundo) +
//         capa de ruido suave para la "piel".
const tamborWav = hit(
  "tambor",
  "(sin(2*PI*(65*exp(-t*2)+40)*t)*0.82 + sin(random(6)*2*PI)*exp(-t*7)*0.18) * exp(-t*3.2)",
  0.90,
  [
    "volume=9dB",
    "alimiter=level_out=0.93:attack=2:release=80",
  ]
);

console.log("Hits OK.\n");

// ─── 2. Patrones ────────────────────────────────────────────────────────────
// Todos los patrones son 2 compases = 8 beats (0-indexed: 0..7).
//   Kick:    beats 1 y 3 de cada compás = 0, 2, 4, 6
//   Snare:   beats 2 y 4 = 1, 3, 5, 7
//   Hi-Hat:  cada beat = 0,1,2,3,4,5,6,7
//   Shaker:  cada beat
//   Rimshot: contratiempos (& de cada beat) = 0.5, 2.5, 4.5, 6.5
//   Clap:    2 y 4 = 1, 3, 5, 7
//   Tambor:  beat 1 de cada compás = 0, 4

const KICK    = [0, 2, 4, 6];
const SNARE   = [1, 3, 5, 7];
const HIHAT   = [0, 1, 2, 3, 4, 5, 6, 7];
const SHAKER  = [0, 1, 2, 3, 4, 5, 6, 7];
const OFFBEAT = [0.5, 2.5, 4.5, 6.5];
const CLAP    = [1, 3, 5, 7];
const TAMBOR  = [0, 4];

console.log("⟳ 90 BPM...");
loop(kickWav,   90, KICK,   "kick_90");
loop(snareWav,  90, SNARE,  "snare_90");
loop(hihatCWav, 90, HIHAT,  "hihat_90");
loop(shakerWav, 90, SHAKER, "shaker_90");
loop(tamborWav, 90, TAMBOR, "tambor_90");

console.log("⟳ 100 BPM...");
loop(kickWav,    100, KICK,    "kick_100");
loop(snareWav,   100, SNARE,   "snare_100");
loop(hihatCWav,  100, HIHAT,   "hihat_100");
loop(rimshotWav, 100, OFFBEAT, "rimshot_100");
loop(shakerWav,  100, SHAKER,  "shaker_100");

console.log("⟳ 120 BPM...");
loop(kickWav,    120, KICK,   "kick_120");
loop(snareWav,   120, SNARE,   "snare_120");
loop(hihatCWav,  120, HIHAT,   "hihat_cerrado_120");
loop(hihatOWav,  120, CLAP,    "hihat_abierto_120");
loop(clapWav,    120, CLAP,    "clap_120");
loop(tamborWav,  120, TAMBOR,  "tambor_120");

console.log(`\n✅ 16 loops en ${OUT_DIR}`);
execSync(`ls -lh ${OUT_DIR}/*.wav`, { stdio: "inherit" });

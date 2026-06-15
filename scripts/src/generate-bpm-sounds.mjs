#!/usr/bin/env node
/**
 * Genera loops de batería sintéticos para el mixer BPM.
 * Usa ffmpeg (aevalsrc + adelay + amix) — sin dependencias externas.
 *
 * Salida: artifacts/mobile/assets/audio/mixer/bpm/*.mp3
 * Cada archivo = 2 compases en 4/4 al BPM indicado.
 */

import { execSync, spawnSync } from "child_process";
import { mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

const OUT_DIR = "artifacts/mobile/assets/audio/mixer/bpm";
const TMP_DIR = "/tmp/resonancia_bpm_hits";

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

// ─── Helpers ────────────────────────────────────────────────────────────────

function ffmpeg(args, label) {
  const result = spawnSync(
    "ffmpeg",
    ["-y", ...args],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
  );
  if (result.status !== 0) {
    console.error(`❌ Error generando ${label}:`);
    console.error(result.stderr?.slice(-600));
    process.exit(1);
  }
}

function hit(filename, expr, duration, filters = "") {
  const out = join(TMP_DIR, filename);
  const af = filters
    ? `${filters},aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo`
    : "aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo";
  ffmpeg(
    ["-f", "lavfi",
     "-i", `aevalsrc=${expr}:s=44100:d=${duration}:c=stereo`,
     "-af", af,
     out],
    filename
  );
  return out;
}

/**
 * Ensambla un loop de 2 compases colocando el hit en cada posición de beat.
 * @param {string} hitFile  — archivo WAV del hit individual
 * @param {number} bpm
 * @param {number[]} beatPositions — posiciones en beats (0-indexed, 2 bars = beats 0..7)
 * @param {string} outputName — sin extensión
 */
function assembleLoop(hitFile, bpm, beatPositions, outputName) {
  const beatMs = (60000 / bpm);
  const totalBeats = 8; // 2 bars × 4/4
  const totalSec = (60 / bpm) * totalBeats;

  // Construir filter_complex
  const delays = beatPositions
    .map((b, i) => {
      const ms = Math.round(b * beatMs);
      return `[${i}]adelay=${ms}|${ms}[d${i}]`;
    })
    .join(";");

  const mixInputs = beatPositions.map((_, i) => `[d${i}]`).join("");
  const n = beatPositions.length;

  const filterComplex =
    `${delays};${mixInputs}amix=inputs=${n}:normalize=0,` +
    `atrim=0:${totalSec.toFixed(6)},apad=whole_dur=${totalSec.toFixed(6)}`;

  // Repetir el hitFile como input N veces
  const inputs = beatPositions.flatMap(() => ["-i", hitFile]);
  const outPath = join(OUT_DIR, `${outputName}.mp3`);

  ffmpeg(
    [...inputs,
     "-filter_complex", filterComplex,
     "-ar", "44100", "-ac", "2",
     "-codec:a", "libmp3lame", "-q:a", "4",
     outPath],
    outputName
  );
  console.log(`  ✓ ${outputName}.mp3`);
}

// ─── 1. Sintetizar hits individuales ───────────────────────────────────────
console.log("Sintetizando hits...");

// Kick: sine con pitch drop rápido (80→30 Hz) + click de ataque
const kick = hit("kick.wav",
  "sin(2*PI*(80*exp(-t*12)+30)*t)*exp(-t*5)*0.9+sin(2*PI*3500*t)*exp(-t*90)*0.15",
  0.65,
  "volume=10dB,alimiter=level_in=10dB:level_out=0.95:limit=0.95:attack=2:release=80"
);

// Snare: ruido + 200 Hz, decay medio
const snare = hit("snare.wav",
  "sin(random(0)*2*PI)*0.55+sin(2*PI*200*t)*0.45",
  0.35,
  "afade=t=out:st=0.05:d=0.3,volume=7dB,alimiter=level_out=0.9"
);

// Hi-Hat cerrado: ruido de alta frecuencia, muy corto
const hihatC = hit("hihat_c.wav",
  "sin(random(1)*2*PI)",
  0.09,
  "highpass=f=7000,afade=t=out:st=0.01:d=0.08,volume=5dB,alimiter=level_out=0.7"
);

// Hi-Hat abierto: ruido alto, decay más largo
const hihatO = hit("hihat_o.wav",
  "sin(random(2)*2*PI)*exp(-t*5)",
  0.35,
  "highpass=f=6000,volume=4dB,alimiter=level_out=0.65"
);

// Shaker: ruido de banda media-alta, muy corto
const shaker = hit("shaker.wav",
  "sin(random(3)*2*PI)*exp(-t*30)",
  0.13,
  "bandpass=f=5000:width_type=o:w=2.5,volume=5dB,alimiter=level_out=0.6"
);

// Clap: ruido de banda media, con pequeño cola
const clap = hit("clap.wav",
  "sin(random(4)*2*PI)*exp(-t*10)",
  0.22,
  "bandpass=f=2500:width_type=o:w=1.8,volume=6dB,alimiter=level_out=0.82"
);

// Rimshot: 600 Hz + ruido, muy corto y cortante
const rimshot = hit("rimshot.wav",
  "(sin(2*PI*600*t)*0.65+sin(random(5)*2*PI)*0.35)*exp(-t*22)",
  0.16,
  "volume=6dB,alimiter=level_out=0.85"
);

// Tambor: sine grave (75 Hz), decay largo y profundo
const tambor = hit("tambor.wav",
  "sin(2*PI*75*t)*exp(-t*3.5)+sin(random(6)*2*PI)*exp(-t*8)*0.18",
  0.9,
  "volume=8dB,alimiter=level_out=0.92"
);

console.log("Hits OK.\n");

// ─── 2. Ensamblar loops ───────────────────────────────────────────────────
// Patrones (posiciones en beats, 2 bars = 8 beats totales):
//   Kick:         1 y 3 de cada bar → beats 0, 2, 4, 6
//   Snare:        2 y 4 de cada bar → beats 1, 3, 5, 7
//   HiHat:        cada beat → 0,1,2,3,4,5,6,7
//   Shaker:       cada beat
//   Tambor:       beat 1 de cada bar → 0, 4
//   Rimshot:      contratiempos → 0.5, 2.5, 4.5, 6.5
//   Clap:         beats 2 y 4 → 1, 3, 5, 7

console.log("⟳ 90 BPM...");
assembleLoop(kick,    90, [0, 2, 4, 6],             "kick_90");
assembleLoop(snare,   90, [1, 3, 5, 7],             "snare_90");
assembleLoop(hihatC,  90, [0, 1, 2, 3, 4, 5, 6, 7], "hihat_90");
assembleLoop(shaker,  90, [0, 1, 2, 3, 4, 5, 6, 7], "shaker_90");
assembleLoop(tambor,  90, [0, 4],                   "tambor_90");

console.log("⟳ 100 BPM...");
assembleLoop(kick,    100, [0, 2, 4, 6],              "kick_100");
assembleLoop(snare,   100, [1, 3, 5, 7],              "snare_100");
assembleLoop(hihatC,  100, [0, 1, 2, 3, 4, 5, 6, 7],  "hihat_100");
assembleLoop(rimshot, 100, [0.5, 2.5, 4.5, 6.5],      "rimshot_100");
assembleLoop(shaker,  100, [0, 1, 2, 3, 4, 5, 6, 7],  "shaker_100");

console.log("⟳ 120 BPM...");
assembleLoop(kick,    120, [0, 2, 4, 6],              "kick_120");
assembleLoop(snare,   120, [1, 3, 5, 7],              "snare_120");
assembleLoop(hihatC,  120, [0, 1, 2, 3, 4, 5, 6, 7],  "hihat_cerrado_120");
assembleLoop(hihatO,  120, [1, 3, 5, 7],              "hihat_abierto_120");
assembleLoop(clap,    120, [1, 3, 5, 7],              "clap_120");
assembleLoop(tambor,  120, [0, 4],                    "tambor_120");

console.log(`\n✅ 16 loops generados en ${OUT_DIR}`);
execSync(`ls -lh ${OUT_DIR}/*.mp3`, { stdio: "inherit" });

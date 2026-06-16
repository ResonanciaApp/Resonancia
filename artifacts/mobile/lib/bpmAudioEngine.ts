/**
 * Motor de audio para los loops rítmicos (BPM) del Mezclador.
 *
 * Solo los sonidos de categoría "bpm" usan este motor; todo lo demás sigue en
 * expo-audio (ver MixerContext). El objetivo es un loop de batería GAPLESS, a
 * tempo y bloqueado en fase entre capas, algo que expo-audio no logra (su loop
 * nativo deja un hueco audible en el empalme y su `seekTo` tiene jitter).
 *
 * Cómo lo logra `react-native-audio-api` (Web Audio nativo):
 *   - `AudioBufferSourceNode` con `loop=true` reproduce el buffer en loop con
 *     precisión de muestra (sin hueco), para siempre.
 *   - `loopEnd` se fija EXACTO al final del contenido musical (`loopSec`), antes
 *     del 0.5 s de silencio que traen los WAV → el silencio nunca se escucha y
 *     el empalme cae justo en el borde del compás.
 *   - Capas que entran tarde arrancan con `source.start(now, offset)` donde
 *     `offset = (now - transportStart) % loopSec` → quedan en fase con las que
 *     ya sonaban (groove instantáneo, sin esperar al próximo compás).
 *   - Pausar/reanudar = `ctx.suspend()/resume()`: el reloj del contexto se
 *     congela, así que la fase se conserva sola al reanudar.
 *
 * Sesión de audio iOS: expo-audio es el dueño único de la AVAudioSession. Por
 * eso al iniciar llamamos `AudioManager.disableSessionManagement()` para que
 * esta librería NO toque la categoría de sesión (si no, las dos pelean).
 *
 * Gating: el motor es OPCIONAL. Si el módulo nativo no existe (build de dev
 * previo a la reconstrucción, Expo Go) o estamos en web, `init()` falla en
 * silencio, `isReady()` queda en false y MixerContext cae al camino expo-audio
 * de siempre. Nada crashea antes de reconstruir el dev client.
 */
import { Platform } from "react-native";

import { SOUND_MAP } from "@/config/sound-map";

import type {
  AudioContext as AudioContextType,
  AudioBuffer as AudioBufferType,
  AudioBufferSourceNode as SourceNodeType,
  GainNode as GainNodeType,
  WaveShaperNode as WaveShaperNodeType,
} from "react-native-audio-api";

type RNAudioModule = typeof import("react-native-audio-api");

type PlayOptions = {
  bpm: number;
  /** Compases del loop (4/4). Default 2. */
  loopBars: number;
  /** Volumen base 0-1 elegido por el usuario para este sonido. */
  volume: number;
  /**
   * Retraso (lag) del downbeat de este loop respecto al transporte compartido,
   * como fracción 0-1 del loop. "Tiempo N" = (N-1) beats de retraso. Loop de 2
   * compases (8 beats): 0.125 = 1 beat, 0.25 = 2 beats, 0.375 = 3 beats.
   * Default 0 (en fase con el transporte).
   */
  phaseOffset?: number;
};

type Voice = {
  source: SourceNodeType;
  gain: GainNodeType;
  base: number;
};

const FADE_OUT_SEC = 0.25;
/**
 * Crossfade corto al REEMPLAZAR una voz que ya suena (cambio de tiempo/offset o
 * re-tap). Cortar en seco + arrancar a mitad de onda produce un click audible
 * (lo que el usuario percibe como "distorsión", distinto en cada posición porque
 * cada offset cae en un punto distinto de la onda). Empalme lineal: como la voz
 * vieja y la nueva son EL MISMO loop, la suma nunca sobrepasa el volumen objetivo
 * → sin recorte/clipping. ~20 ms basta para quitar el click sin "flam" audible.
 */
const XFADE_SEC = 0.02;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Segundos de contenido musical del loop (sin la cola de silencio). */
function loopSeconds(bpm: number, loopBars: number): number {
  // 4 beats por compás (4/4). loopBars=2 → (60/bpm)*8, igual que el generador.
  return (60 / bpm) * 4 * loopBars;
}

/**
 * Codo del limitador soft-clip: por debajo de |x|=KNEE la curva es LINEAL
 * (transparente, no toca 1-2 capas), por encima satura suave hacia el techo.
 * 0.8 deja casi intacto un sonido a fondo de escala y solo doma los picos que
 * aparecen al sumar 3+ capas.
 */
const SOFT_CLIP_KNEE = 0.8;

/**
 * Curva de transferencia para el WaveShaper del bus master. El WaveShaper mapea
 * su entrada [-1,1] por esta curva; entradas >1 (varias capas sumadas) se fijan
 * al último valor → techo ~0.95 con codo suave en vez de recorte áspero a 1.0.
 */
function makeSoftClipCurve(samples = 2048, knee = SOFT_CLIP_KNEE): Float32Array {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1; // -1 … 1
    const a = Math.abs(x);
    const y = a <= knee ? a : knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee));
    curve[i] = Math.sign(x) * y;
  }
  return curve;
}

/** Construida una sola vez (no depende del estado del motor). */
const SOFT_CLIP_CURVE = makeSoftClipCurve();

class BpmAudioEngine {
  private rn: RNAudioModule | null = null;
  private ctx: AudioContextType | null = null;
  private masterGain: GainNodeType | null = null;
  /**
   * Limitador soft-clip en el bus master (WaveShaper). Al sumar varias capas
   * BPM la mezcla puede pasar de 0 dBFS y el destino RECORTA en duro (la
   * "distorsión" que aparece al agregar el 3.º+ sonido). El limitador satura
   * suave los picos en vez de recortar. null si la lib no expone WaveShaper.
   */
  private limiter: WaveShaperNodeType | null = null;
  /** null = sin probar; true/false = resultado de la probada. */
  private available: boolean | null = null;
  private ready = false;

  private masterVolume = 1;

  /** Buffers decodificados, cacheados por id (re-tap instantáneo). */
  private buffers = new Map<string, AudioBufferType>();
  /** Decodificaciones en vuelo (dedup de taps rápidos). */
  private decoding = new Map<string, Promise<AudioBufferType | null>>();
  /** Voces sonando, por id. */
  private voices = new Map<string, Voice>();
  /**
   * Token de la última solicitud play() por id. play() es async (espera el
   * decode); si el sonido se quita / stopAll / dispose / re-tap mientras
   * decodifica, el token deja de coincidir y abortamos ANTES de crear el source
   * → nunca queda audio huérfano. Ver play().
   */
  private wanted = new Map<string, number>();
  private playSeq = 0;

  /**
   * `ctx.currentTime` cuando arrancó el PRIMER loop BPM de la familia actual.
   * Ancla de fase para que las capas que entran después queden bloqueadas en
   * sincronía. Se libera cuando no queda ninguna voz.
   */
  private transportStart: number | null = null;

  /** ¿El motor está listo para reproducir (módulo nativo presente)? */
  isReady(): boolean {
    return this.ready && this.ctx !== null;
  }

  /**
   * Inicializa el contexto de audio. Idempotente y seguro: si el módulo nativo
   * no existe o estamos en web, deja `ready=false` y NO lanza. Llamar DESPUÉS de
   * que expo-audio configuró la sesión (ensureAudioMode), nunca en el arranque.
   */
  async init(): Promise<boolean> {
    if (this.available !== null) return this.isReady();
    if (Platform.OS === "web") {
      this.available = false;
      return false;
    }
    try {
      const mod = await import("react-native-audio-api");
      // expo-audio es el dueño de la AVAudioSession: que esta lib no la toque.
      try {
        mod.AudioManager.disableSessionManagement();
      } catch {
        /* algunas plataformas no lo soportan; no es crítico */
      }
      const ctx = new mod.AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = clamp01(this.masterVolume);
      // Limitador soft-clip ANTES del destino: al sumar varias capas BPM el bus
      // master puede pasar de 0 dBFS y el destino recorta en duro (distorsión
      // áspera, peor cuantos más sonidos). El WaveShaper satura suave los picos
      // por encima del codo → limita sin clipping. La lib NO trae compresor.
      let limiter: WaveShaperNodeType | null = null;
      try {
        limiter = ctx.createWaveShaper();
        limiter.curve = SOFT_CLIP_CURVE;
        limiter.oversample = "2x";
        masterGain.connect(limiter);
        limiter.connect(ctx.destination);
      } catch {
        // Si WaveShaper no estuviera disponible: directo (comportamiento previo).
        limiter = null;
        masterGain.connect(ctx.destination);
      }
      this.rn = mod;
      this.ctx = ctx;
      this.masterGain = masterGain;
      this.limiter = limiter;
      this.available = true;
      this.ready = true;
      return true;
    } catch {
      // Módulo nativo ausente (build previo) / Expo Go / web → fallback expo.
      this.available = false;
      this.ready = false;
      this.ctx = null;
      this.masterGain = null;
      this.limiter = null;
      this.rn = null;
      return false;
    }
  }

  /** Decodifica (y cachea) el WAV de un id. Dedup de llamadas concurrentes. */
  private getBuffer(id: string): Promise<AudioBufferType | null> {
    const cached = this.buffers.get(id);
    if (cached) return Promise.resolve(cached);
    const inflight = this.decoding.get(id);
    if (inflight) return inflight;
    const ctx = this.ctx;
    const asset = SOUND_MAP[id];
    if (!ctx || asset == null) return Promise.resolve(null);
    const p = (async () => {
      try {
        // decodeAudioData acepta el id numérico del require() (DecodeDataInput).
        const buf = await ctx.decodeAudioData(asset as unknown as number);
        this.buffers.set(id, buf);
        return buf;
      } catch {
        return null;
      } finally {
        this.decoding.delete(id);
      }
    })();
    this.decoding.set(id, p);
    return p;
  }

  /**
   * Reproduce (o reinicia) un loop BPM, alineado en fase con los que ya suenan.
   * Async por el decode del buffer la primera vez; re-taps son instantáneos.
   */
  async play(id: string, opts: PlayOptions): Promise<void> {
    if (!this.isReady()) return;
    // Token de esta solicitud. Si el sonido se quita / stopAll / dispose / re-tap
    // mientras el buffer decodifica, al volver del await el token ya no coincide
    // y abortamos ANTES de crear el source (si no, queda audio huérfano sonando).
    const token = ++this.playSeq;
    this.wanted.set(id, token);
    const buffer = await this.getBuffer(id);
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    // Re-chequear tras el await: el motor pudo cerrarse (dispose) o el sonido
    // pudo cancelarse (stop/stopAll/re-tap) mientras decodificaba el buffer.
    if (!buffer || !ctx || !masterGain || this.wanted.get(id) !== token) return;

    // Si este sonido ya está sonando (re-tap o cambio de tiempo/offset) NO cortar
    // en seco: se hace un crossfade corto contra la voz nueva (ver XFADE_SEC) para
    // evitar el click de empalme. La voz vieja se libera al terminar su fade-out.
    const prev = this.voices.get(id) ?? null;

    const loopSec = loopSeconds(opts.bpm, opts.loopBars);
    const userOffsetSec = (opts.phaseOffset ?? 0) * loopSec;
    const now = ctx.currentTime;
    if (this.transportStart === null) {
      this.transportStart = now;
    }
    // Fase actual del transporte compartido (0 para el primer loop de la familia).
    const currentPhase = ((now - this.transportStart) % loopSec + loopSec) % loopSec;
    // LAG: "entrar en el tiempo N" RETRASA el downbeat del loop por userOffsetSec
    // respecto al transporte (lo natural para "que entre en el tiempo N"). Con
    // offset 0 queda idéntico al comportamiento previo (en fase con el transporte).
    const offset = ((currentPhase - userOffsetSec) % loopSec + loopSec) % loopSec;

    const source = ctx.createBufferSource({ pitchCorrection: false });
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = loopSec; // antes del silencio → empalme exacto, sin hueco
    const target = clamp01(opts.volume);
    const gain = ctx.createGain();
    if (prev) {
      // Empalme: la voz nueva entra desde 0 hasta su volumen en XFADE_SEC.
      try {
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(target, now + XFADE_SEC);
      } catch {
        gain.gain.value = target;
      }
    } else {
      gain.gain.value = target;
    }
    source.connect(gain);
    gain.connect(masterGain);
    try {
      source.start(now, offset);
    } catch {
      /* ignore */
    }
    // Apagar la voz vieja con el fade-out complementario (mismo instante).
    if (prev) this.fadeOutAndStop(prev, now, XFADE_SEC);
    this.voices.set(id, { source, gain, base: opts.volume });

    // Agregar un sonido implica que la mezcla está sonando: asegurar el contexto
    // activo (pudo quedar suspendido tras el init o una pausa previa).
    if (ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  /** Corta una voz al instante, sin fade (uso interno: re-tap, reset). */
  private stopImmediate(id: string): void {
    const v = this.voices.get(id);
    this.voices.delete(id);
    if (!v) return;
    try {
      v.source.stop();
    } catch {
      /* ignore */
    }
    try {
      v.source.disconnect();
    } catch {
      /* ignore */
    }
    try {
      v.gain.disconnect();
    } catch {
      /* ignore */
    }
  }

  /**
   * Fade-out lineal de una voz a partir de `startAt` durante `dur` y liberación
   * de sus nodos al terminar. Uso interno: la mitad "vieja" de un crossfade.
   */
  private fadeOutAndStop(v: Voice, startAt: number, dur: number): void {
    const { source, gain } = v;
    try {
      gain.gain.setValueAtTime(gain.gain.value, startAt);
      gain.gain.linearRampToValueAtTime(0, startAt + dur);
    } catch {
      /* ignore */
    }
    try {
      source.stop(startAt + dur + 0.02);
    } catch {
      /* ignore */
    }
    source.onEnded = () => {
      try {
        source.disconnect();
      } catch {
        /* ignore */
      }
      try {
        gain.disconnect();
      } catch {
        /* ignore */
      }
    };
  }

  /** Apaga un loop con un fade-out corto y libera sus nodos. */
  stop(id: string): void {
    // Cancelar también cualquier play() en vuelo para este id (decode sin terminar).
    this.wanted.delete(id);
    const v = this.voices.get(id);
    const ctx = this.ctx;
    this.voices.delete(id);
    if (v && ctx) {
      const t = ctx.currentTime;
      try {
        v.gain.gain.setValueAtTime(v.gain.gain.value, t);
        v.gain.gain.linearRampToValueAtTime(0, t + FADE_OUT_SEC);
      } catch {
        /* ignore */
      }
      const { source, gain } = v;
      try {
        source.stop(t + FADE_OUT_SEC + 0.03);
      } catch {
        /* ignore */
      }
      source.onEnded = () => {
        try {
          source.disconnect();
        } catch {
          /* ignore */
        }
        try {
          gain.disconnect();
        } catch {
          /* ignore */
        }
      };
    }
    if (this.voices.size === 0) this.transportStart = null;
  }

  /** Apaga TODOS los loops BPM y libera el ancla de fase. */
  stopAll(): void {
    // Cancelar todo play() en vuelo (ids que aún no son voces por estar decodificando).
    this.wanted.clear();
    for (const id of [...this.voices.keys()]) this.stop(id);
    this.transportStart = null;
  }

  /** Ajusta el volumen base (0-1) de un loop en curso. */
  setVolume(id: string, volume: number): void {
    const v = this.voices.get(id);
    if (!v) return;
    v.base = volume;
    try {
      v.gain.gain.value = clamp01(volume);
    } catch {
      /* ignore */
    }
  }

  /** Volumen master del motor (0-1), aplicado a todos los loops a la vez. */
  setMasterVolume(volume: number): void {
    this.masterVolume = clamp01(volume);
    if (this.masterGain) {
      try {
        this.masterGain.gain.value = this.masterVolume;
      } catch {
        /* ignore */
      }
    }
  }

  /** Pausa todos los loops conservando la fase (reloj del contexto congelado). */
  async suspend(): Promise<void> {
    const ctx = this.ctx;
    if (ctx && ctx.state === "running") {
      try {
        await ctx.suspend();
      } catch {
        /* ignore */
      }
    }
  }

  /** Reanuda todos los loops desde la fase exacta en que se pausaron. */
  async resume(): Promise<void> {
    const ctx = this.ctx;
    if (ctx && ctx.state !== "running") {
      try {
        await ctx.resume();
      } catch {
        /* ignore */
      }
    }
  }

  /** Cierra el contexto y libera todo (cleanup al desmontar el provider). */
  async dispose(): Promise<void> {
    this.wanted.clear();
    for (const id of [...this.voices.keys()]) this.stopImmediate(id);
    this.voices.clear();
    this.transportStart = null;
    // Los buffers se decodificaron contra ESTE contexto: descartarlos para que
    // un remount re-decodifique contra el contexto nuevo (evita usarlos cruzados).
    this.buffers.clear();
    this.decoding.clear();
    const ctx = this.ctx;
    this.ctx = null;
    this.masterGain = null;
    this.limiter = null;
    this.ready = false;
    // Permitir reinicializar si el provider se remonta en el mismo runtime:
    // init() corta temprano salvo que `available` vuelva a estado sin probar.
    this.available = null;
    if (ctx) {
      try {
        await ctx.close();
      } catch {
        /* ignore */
      }
    }
  }
}

export const bpmAudioEngine = new BpmAudioEngine();

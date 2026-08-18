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
 *     `source.start(now, 0)` arranca cada loop desde el comienzo del buffer,
 *     sin sincronía de fase entre capas (el desfase natural crea variación).
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
import { Platform, TurboModuleRegistry } from "react-native";

import { SOUND_MAP } from "@/config/sound-map";

import type {
  AudioContext as AudioContextType,
  AudioBuffer as AudioBufferType,
  AudioBufferSourceNode as SourceNodeType,
  GainNode as GainNodeType,
} from "react-native-audio-api";

type RNAudioModule = typeof import("react-native-audio-api");

type PlayOptions = {
  bpm: number;
  /** Compases del loop (4/4). Default 2. */
  loopBars: number;
  /** Volumen base 0-1 elegido por el usuario para este sonido. */
  volume: number;
};

type Voice = {
  source: SourceNodeType;
  gain: GainNodeType;
  base: number;
};

const FADE_OUT_SEC = 0.25;
/** Crossfade corto al reemplazar una voz que ya suena: evita el click de empalme. */
const XFADE_SEC = 0.02;


/** Segundos de contenido musical del loop (sin la cola de silencio). */
function loopSeconds(bpm: number, loopBars: number): number {
  // 4 beats por compás (4/4). loopBars=2 → (60/bpm)*8, igual que el generador.
  return (60 / bpm) * 4 * loopBars;
}

class BpmAudioEngine {
  private rn: RNAudioModule | null = null;
  private ctx: AudioContextType | null = null;
  private masterGain: GainNodeType | null = null;
  /** null = sin probar; true/false = resultado de la probada. */
  private available: boolean | null = null;
  private ready = false;
  /** Caché de la promesa de init para deduplicar llamadas concurrentes. */
  private _initPromise: Promise<boolean> | null = null;

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

  /** ¿El motor está listo para reproducir (módulo nativo presente)? */
  isReady(): boolean {
    return this.ready && this.ctx !== null;
  }

  /**
   * Inicializa el contexto de audio. Idempotente y seguro: si el módulo nativo
   * no existe o estamos en web, deja `ready=false` y NO lanza. Llamar DESPUÉS de
   * que expo-audio configuró la sesión (ensureAudioMode), nunca en el arranque.
   *
   * Llamadas concurrentes devuelven la misma promesa (dedup): sin importar
   * cuántas veces se llame mientras init() está en vuelo, solo corre una vez.
   */
  async init(): Promise<boolean> {
    if (this.available !== null) return this.isReady();
    if (this._initPromise) return this._initPromise;
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  private async _doInit(): Promise<boolean> {
    if (Platform.OS === "web") {
      this.available = false;
      return false;
    }
    // COMPROBACIÓN PREVIA: verificar que el módulo nativo esté compilado en el
    // dev client ANTES de cargar cualquier JS de react-native-audio-api.
    //
    // Por qué no basta con try-catch alrededor del import/require:
    //   react-native-audio-api lanza en el cuerpo de nivel-módulo de
    //   AudioAPIModule.ts. Expo transforma require() condicionales en bundles
    //   lazy via `importAll` (asyncRequireModule.ts). Ese bundle se carga de
    //   forma asíncrona y el error de inicialización escapa del try-catch de
    //   init() como un unhandled Promise rejection. Incluso el await import()
    //   tiene el mismo problema en Hermes.
    //
    // La solución correcta: comprobar TurboModuleRegistry ANTES de cargar la
    // librería. Si el módulo nativo no está, paramos aquí sin tocar nada más.
    // react-native-audio-api usa TurboModuleRegistry.get('AudioAPIModule')
    // internamente; si get() devuelve null → el módulo nativo no existe en
    // este build del dev client.
    const hasNativeModule = !!TurboModuleRegistry.get("AudioAPIModule");
    if (!hasNativeModule) {
      this.available = false;
      return false;
    }
    try {
      // El módulo nativo está confirmado. require() síncrono para evitar que
      // Expo cree un bundle lazy separado (importAll) que pueda escaparse del
      // try-catch en versiones donde el Promise rejection no se propaga bien.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require("react-native-audio-api") as RNAudioModule;
      // expo-audio es el dueño de la AVAudioSession: que esta lib no la toque.
      try {
        mod.AudioManager.disableSessionManagement();
      } catch {
        /* algunas plataformas no lo soportan; no es crítico */
      }
      const ctx = new mod.AudioContext();
      const masterGain = ctx.createGain();
      masterGain.gain.value = clamp01(this.masterVolume);
      masterGain.connect(ctx.destination);
      this.rn = mod;
      this.ctx = ctx;
      this.masterGain = masterGain;
      this.available = true;
      this.ready = true;
      return true;
    } catch {
      this.available = false;
      this.ready = false;
      this.ctx = null;
      this.masterGain = null;
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

    // Si este sonido ya está sonando NO cortar en seco: crossfade corto para
    // evitar el click de empalme. La voz vieja se libera al terminar su fade.
    const prev = this.voices.get(id) ?? null;

    const loopSec = loopSeconds(opts.bpm, opts.loopBars);
    const now = ctx.currentTime;

    const source = ctx.createBufferSource({ pitchCorrection: false });
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = loopSec; // antes del silencio → empalme exacto, sin hueco
    const target = clamp01(opts.volume);
    const gain = ctx.createGain();
    if (prev) {
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
      source.start(now, 0);
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

  /**
   * Reproduce un audio en loop gapless SIN BPM (p. ej. binaurales).
   * Usa `buffer.duration` como `loopEnd` → empalme exacto al final del PCM
   * decodificado (sin silencio de encoder delay), igual de preciso que el
   * loop BPM pero sin necesidad de tempo ni reloj maestro.
   */
  async playLoop(id: string, volume: number): Promise<void> {
    if (!this.isReady()) return;
    const token = ++this.playSeq;
    this.wanted.set(id, token);
    const buffer = await this.getBuffer(id);
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!buffer || !ctx || !masterGain || this.wanted.get(id) !== token) return;

    const prev = this.voices.get(id) ?? null;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource({ pitchCorrection: false });
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    source.loopEnd = buffer.duration; // todo el buffer, sin hueco de encoder
    const target = clamp01(volume);
    const gain = ctx.createGain();
    if (prev) {
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
      source.start(now, 0);
    } catch {
      /* ignore */
    }
    if (prev) this.fadeOutAndStop(prev, now, XFADE_SEC);
    this.voices.set(id, { source, gain, base: volume });

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
  }

  /** Apaga TODOS los loops BPM. */
  stopAll(): void {
    // Cancelar todo play() en vuelo (ids que aún no son voces por estar decodificando).
    this.wanted.clear();
    for (const id of [...this.voices.keys()]) this.stop(id);
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
    this.buffers.clear();
    this.decoding.clear();
    const ctx = this.ctx;
    this.ctx = null;
    this.masterGain = null;
    this.ready = false;
    this.available = null;
    this._initPromise = null;
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

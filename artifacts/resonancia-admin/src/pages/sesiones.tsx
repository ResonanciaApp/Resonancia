import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X, Music, Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import {
  useCreateSubmission,
  useApproveSubmission,
  useRequestUploadUrl,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Constantes de taxonomía ────────────────────────────────────────────────

const CATS = [
  { id: "sonidos-ancestrales", label: "Ancestrales",  categoryLabel: "Ancestrales", color: "#C4956A" },
  { id: "meditaciones-guiadas", label: "Meditaciones", categoryLabel: "Meditaciones", color: "#C8B4E0" },
  { id: "musica-sonidos",       label: "Música",       categoryLabel: "Música",       color: "#A8C4A8" },
  { id: "podcast",              label: "Sonidos",      categoryLabel: "Sonidos",      color: "#8AAAD4" },
] as const;

type CatId = typeof CATS[number]["id"];

const ANCESTRAL_TAGS = ["Cuencos Tibetanos","Cuencos de Cuarzo","Mix de Cuencos","Gongs","Cuencos y Gongs","Full Instrumentos"];
const MEDITATION_TAGS = ["No Duales","Visualizaciones","Mantras","Escaneo Corporal","Manifestación","3 Minutos de Sabiduría"];
const SOUND_TAGS = ["Música Ambient","Música Enteógena","Música Étnica"];
const SONIDOS_TAGS = ["Sonidos Binaurales","Sonidos Naturaleza","Sonidos Atmosféricos"];
const PODCAST_TAGS = ["Espiritualidad","Salud y Bienestar","Disciplinas","Psicología Transpersonal","Enteógenos","Sobrenatural","Neurociencia"];
const SLEEP_TAGS = ["Sonidos Binaurales","Sonidos Ancestrales","ASMR Expansivos"];
const THEME_TAGS = ["Mañanas","Noches","Yoga","Respiración","Ansiedad","Rituales","Crecimiento","ASMR","Estrés","Spa","Familia"];
const AUDIO_ROLES = ["main","voice","ambient","base","sound"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

interface UploadedFile {
  file: File;
  objectPath: string;
  contentType: string;
  sizeBytes: number;
  name: string;
}

interface AudioSlot {
  file: File | null;
  objectPath: string;
  name: string;
  role: string;
  durationSeconds: string;
  isLoop: boolean;
}

const emptyAudioSlot = (): AudioSlot => ({
  file: null, objectPath: "", name: "", role: "main", durationSeconds: "", isLoop: false,
});

// ── Componente principal ───────────────────────────────────────────────────

export default function SesionesPage() {
  // ── Estado del formulario ──
  const [categoryId, setCategoryId] = useState<CatId | "">("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [frequency, setFrequency] = useState("");

  // Tags por categoría
  const [ancestralTag, setAncestralTag] = useState("");
  const [meditationTag, setMeditationTag] = useState("");
  const [soundTag, setSoundTag] = useState("");
  const [sonidosTag, setSonidosTag] = useState("");
  const [podcastTag, setPodcastTag] = useState("");
  const [podcastMode, setPodcastMode] = useState<"sonidos"|"podcast">("sonidos");
  const [sleepTag, setSleepTag] = useState("");
  const [themeTag, setThemeTag] = useState<string[]>([]);
  const [otherTagInput, setOtherTagInput] = useState("");
  const [guideId, setGuideId] = useState("");
  const [artistId, setArtistId] = useState("");

  // Arrays
  const [benefitInput, setBenefitInput] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [instrumentInput, setInstrumentInput] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);

  // Audios
  const [audio1, setAudio1] = useState<AudioSlot>(emptyAudioSlot());
  const [audio2, setAudio2] = useState<AudioSlot>(emptyAudioSlot());
  const [showAudio2, setShowAudio2] = useState(false);

  // Imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);

  // Publicar directamente
  const [publishDirectly, setPublishDirectly] = useState(true);

  // Secciones expandidas
  const [openSections, setOpenSections] = useState({
    basicos: true, categoria: true, subcategoria: true, tags: true,
    audios: true, imagen: false, extras: false,
  });

  // Estado de submit
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Refs para inputs de archivo
  const audio1Ref = useRef<HTMLInputElement>(null);
  const audio2Ref = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // ── Hooks API ──
  const { mutateAsync: requestUrl } = useRequestUploadUrl();
  const { mutateAsync: createSubmission } = useCreateSubmission();
  const { mutateAsync: approveSubmission } = useApproveSubmission();

  // ── Helpers ──
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const toggleTheme = (tag: string) =>
    setThemeTag((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const addBenefit = () => {
    const v = benefitInput.trim();
    if (v && benefits.length < 8) { setBenefits((p) => [...p, v]); setBenefitInput(""); }
  };
  const addInstrument = () => {
    const v = instrumentInput.trim();
    if (v && instruments.length < 12) { setInstruments((p) => [...p, v]); setInstrumentInput(""); }
  };

  // ── Upload de un archivo ──
  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const { uploadURL, objectPath } = await requestUrl({
      data: { name: file.name, size: file.size, contentType: file.type },
    });
    await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    return { file, objectPath, contentType: file.type, sizeBytes: file.size, name: file.name };
  };

  // ── Validación rápida ──
  const validate = (): string | null => {
    if (!categoryId) return "Seleccioná una categoría";
    if (!title.trim()) return "El título es requerido";
    if (!subtitle.trim()) return "El subtítulo es requerido";
    if (!description.trim()) return "La descripción es requerida";
    const d = Number(duration);
    if (!d || d < 1 || d > 600) return "La duración debe ser entre 1 y 600 minutos";
    if (!audio1.file) return "Agregá al menos un archivo de audio";
    if (!audio1.name.trim()) return "Poné un nombre al audio 1";
    if (showAudio2 && audio2.file && !audio2.name.trim()) return "Poné un nombre al audio 2";
    return null;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      // 1. Upload archivos
      const a1 = await uploadFile(audio1.file!);
      let a2: UploadedFile | null = null;
      if (showAudio2 && audio2.file) a2 = await uploadFile(audio2.file);

      let imgUploaded: UploadedFile | null = uploadedImage;
      if (imageFile && !uploadedImage) {
        imgUploaded = await uploadFile(imageFile);
        setUploadedImage(imgUploaded);
      }

      // 2. Crear submission
      const audioFiles: Parameters<typeof createSubmission>[0]["data"]["audioFiles"] = [
        {
          objectPath: a1.objectPath,
          name: audio1.name.trim(),
          contentType: a1.contentType,
          sizeBytes: a1.sizeBytes,
          role: audio1.role as "main"|"voice"|"ambient"|"base"|"sound",
          durationSeconds: audio1.durationSeconds ? Number(audio1.durationSeconds) : undefined,
          isLoop: audio1.isLoop,
        },
      ];
      if (a2) {
        audioFiles.push({
          objectPath: a2.objectPath,
          name: audio2.name.trim(),
          contentType: a2.contentType,
          sizeBytes: a2.sizeBytes,
          role: audio2.role as "main"|"voice"|"ambient"|"base"|"sound",
          durationSeconds: audio2.durationSeconds ? Number(audio2.durationSeconds) : undefined,
          isLoop: audio2.isLoop,
        });
      }

      const cat = CATS.find((c) => c.id === categoryId)!;

      const body: Parameters<typeof createSubmission>[0]["data"] = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        categoryId: cat.id,
        categoryLabel: cat.categoryLabel,
        duration: Number(duration),
        isPremium,
        frequency: frequency.trim() || null,
        benefits: benefits.length ? benefits : undefined,
        instruments: instruments.length ? instruments : undefined,
        themeTag: themeTag.length ? (themeTag as Parameters<typeof createSubmission>[0]["data"]["themeTag"]) : undefined,
        sleepTag: sleepTag as Parameters<typeof createSubmission>[0]["data"]["sleepTag"] || undefined,
        ancestralTag: ancestralTag as Parameters<typeof createSubmission>[0]["data"]["ancestralTag"] || undefined,
        meditationTag: meditationTag as Parameters<typeof createSubmission>[0]["data"]["meditationTag"] || undefined,
        soundTag: soundTag as Parameters<typeof createSubmission>[0]["data"]["soundTag"] || undefined,
        sonidosTag: sonidosTag as Parameters<typeof createSubmission>[0]["data"]["sonidosTag"] || undefined,
        podcastTag: podcastTag as Parameters<typeof createSubmission>[0]["data"]["podcastTag"] || undefined,
        guideId: guideId.trim() || null,
        artistId: artistId.trim() || null,
        imageObjectPath: imgUploaded?.objectPath ?? null,
        imageContentType: imgUploaded?.contentType ?? null,
        imageSizeBytes: imgUploaded?.sizeBytes ?? null,
        audioFiles,
      };

      const submission = await createSubmission({ data: body });

      // 3. Publicar directamente si se pidió
      if (publishDirectly) {
        await approveSubmission({ id: submission.id });
        toast.success("Sesión publicada correctamente");
      } else {
        toast.success("Sesión enviada — pendiente de revisión");
      }

      setDone(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear la sesión";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setDone(false);
    setCategoryId(""); setTitle(""); setSubtitle(""); setDescription("");
    setDuration(""); setIsPremium(false); setFrequency("");
    setAncestralTag(""); setMeditationTag(""); setSoundTag("");
    setSonidosTag(""); setPodcastTag(""); setSleepTag(""); setThemeTag([]);
    setGuideId(""); setArtistId("");
    setBenefits([]); setInstruments([]);
    setAudio1(emptyAudioSlot()); setAudio2(emptyAudioSlot()); setShowAudio2(false);
    setImageFile(null); setUploadedImage(null);
  };

  // ── Estado final ──
  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {publishDirectly ? "Sesión publicada" : "Sesión enviada a revisión"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {publishDirectly
              ? "Ya está visible en la app."
              : "Podés aprobarla desde la cola de Moderación."}
          </p>
        </div>
        <Button onClick={handleReset}>Subir otra sesión</Button>
      </div>
    );
  }

  const catInfo = CATS.find((c) => c.id === categoryId);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nueva sesión</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cargá los datos y archivos de la sesión para publicarla en la app.
        </p>
      </div>

      {/* ── SECCIÓN: Categoría ── */}
      <Section
        title="Categoría"
        open={openSections.categoria}
        onToggle={() => toggleSection("categoria")}
      >
        <div className="grid grid-cols-2 gap-3">
          {CATS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(cat.id);
                // reset tags al cambiar categoría
                setAncestralTag(""); setMeditationTag(""); setSoundTag("");
                setSonidosTag(""); setPodcastTag(""); setGuideId(""); setArtistId("");
              }}
              className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition-all ${
                categoryId === cat.id
                  ? "border-primary bg-primary/8"
                  : "border-border bg-card hover:border-border/80 hover:bg-secondary"
              }`}
            >
              <span className="font-semibold text-sm">{cat.label}</span>
              <span className="text-xs text-muted-foreground">{cat.id}</span>
              {categoryId === cat.id && (
                <span
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              )}
            </button>
          ))}
        </div>
        {catInfo && (
          <p className="text-xs text-muted-foreground mt-1">
            categoryLabel que se guarda: <strong className="text-foreground">"{catInfo.categoryLabel}"</strong>
          </p>
        )}
      </Section>

      {/* ── SECCIÓN: Datos básicos ── */}
      <Section
        title="Datos básicos"
        open={openSections.basicos}
        onToggle={() => toggleSection("basicos")}
      >
        <div className="space-y-4">
          <Field label="Título *">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Cuencos del Alba" maxLength={120} />
          </Field>
          <Field label="Subtítulo *">
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Ej: Música Étnica" maxLength={120} />
          </Field>
          <Field label="Descripción *">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describí la sesión..."
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            <span className="text-xs text-muted-foreground">{description.length}/2000</span>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duración (minutos) *">
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                min={1}
                max={600}
              />
            </Field>
            <Field label="Frecuencia (opcional)">
              <Input
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Ej: 432 Hz"
                maxLength={60}
              />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="premium" checked={isPremium} onCheckedChange={setIsPremium} />
            <Label htmlFor="premium" className="cursor-pointer">
              Sesión Premium
              <span className="ml-2 text-xs text-muted-foreground">(muestra estrellita dorada en la app)</span>
            </Label>
          </div>
        </div>
      </Section>

      {/* ── SECCIÓN: Subcategoría ── */}
      {categoryId && (
        <Section
          title="Subcategoría"
          open={openSections.subcategoria}
          onToggle={() => toggleSection("subcategoria")}
        >
          <div className="space-y-4">
            {categoryId === "sonidos-ancestrales" && (
              <Field label="Subcategoría *">
                <SelectField value={ancestralTag} onChange={setAncestralTag} placeholder="Elegí la subcategoría" options={ANCESTRAL_TAGS} />
              </Field>
            )}

            {categoryId === "meditaciones-guiadas" && (
              <>
                <Field label="Subcategoría *">
                  <SelectField value={meditationTag} onChange={setMeditationTag} placeholder="Elegí la subcategoría" options={MEDITATION_TAGS} />
                </Field>
                <Field label="ID del guiador (opcional)">
                  <Input value={guideId} onChange={(e) => setGuideId(e.target.value)} placeholder="sofia-ramirez" />
                  <span className="text-xs text-muted-foreground">Slug del guiador en data/guides.ts · default: casa-cuenco</span>
                </Field>
              </>
            )}

            {categoryId === "musica-sonidos" && (
              <>
                <Field label="Subcategoría *">
                  <SelectField value={soundTag} onChange={setSoundTag} placeholder="Elegí la subcategoría" options={SOUND_TAGS} />
                </Field>
                {(soundTag === "Música Ambient" || soundTag === "Música Enteógena") && (
                  <Field label="ID del artista (recomendado)">
                    <Input value={artistId} onChange={(e) => setArtistId(e.target.value)} placeholder="lumen-sonora" />
                    <span className="text-xs text-muted-foreground">Slug del artista en data/artists.ts · default: resonancia</span>
                  </Field>
                )}
              </>
            )}

            {categoryId === "podcast" && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setPodcastMode("sonidos"); setPodcastTag(""); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${podcastMode === "sonidos" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground"}`}
                  >
                    Sonidos
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPodcastMode("podcast"); setSonidosTag(""); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${podcastMode === "podcast" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-foreground"}`}
                  >
                    Podcast / Charla
                  </button>
                </div>
                {podcastMode === "sonidos" ? (
                  <Field label="Subcategoría *">
                    <SelectField value={sonidosTag} onChange={setSonidosTag} placeholder="Elegí la subcategoría" options={SONIDOS_TAGS} />
                  </Field>
                ) : (
                  <Field label="Subcategoría *">
                    <SelectField value={podcastTag} onChange={setPodcastTag} placeholder="Elegí la subcategoría" options={PODCAST_TAGS} />
                  </Field>
                )}
              </>
            )}
          </div>
        </Section>
      )}

      {/* ── SECCIÓN: Etiquetas ── */}
      {categoryId && (
        <Section
          title="Etiquetas"
          open={openSections.tags}
          onToggle={() => toggleSection("tags")}
        >
          <div className="space-y-4">
            {/* Sleep tag */}
            <Field label="Grupo descanso (opcional)">
              <SelectField value={sleepTag} onChange={setSleepTag} placeholder="Ninguno" options={SLEEP_TAGS} clearable />
            </Field>

            {/* Etiquetas Nivel 1 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Etiquetas Nivel 1</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTheme(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      themeTag.includes(tag)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Otras temáticas — etiquetas libres */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Otras temáticas</Label>
              <div className="flex gap-2">
                <Input
                  value={otherTagInput}
                  onChange={(e) => setOtherTagInput(e.target.value)}
                  placeholder="Ej: Chakras, Luna llena…"
                  maxLength={60}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = otherTagInput.trim();
                      if (v && !themeTag.includes(v)) {
                        setThemeTag((p) => [...p, v]);
                        setOtherTagInput("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const v = otherTagInput.trim();
                    if (v && !themeTag.includes(v)) {
                      setThemeTag((p) => [...p, v]);
                      setOtherTagInput("");
                    }
                  }}
                >
                  Agregar
                </Button>
              </div>
              {/* Muestra las etiquetas libres agregadas (las que no están en THEME_TAGS) */}
              <div className="flex flex-wrap gap-2">
                {themeTag.filter((t) => !THEME_TAGS.includes(t)).map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button type="button" onClick={() => setThemeTag((p) => p.filter((x) => x !== t))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ── SECCIÓN: Audios ── */}
      <Section
        title="Archivos de audio"
        open={openSections.audios}
        onToggle={() => toggleSection("audios")}
      >
        <div className="space-y-6">
          <AudioUploadSlot
            label="Audio 1 *"
            slot={audio1}
            onChange={setAudio1}
            inputRef={audio1Ref}
          />

          {showAudio2 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Audio 2 (opcional)</Label>
                <button
                  type="button"
                  onClick={() => { setShowAudio2(false); setAudio2(emptyAudioSlot()); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Quitar
                </button>
              </div>
              <AudioUploadSlot
                label="Audio 2"
                slot={audio2}
                onChange={setAudio2}
                inputRef={audio2Ref}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAudio2(true)}
              className="text-sm text-primary hover:underline"
            >
              + Agregar segundo audio (voice, ambient, base…)
            </button>
          )}
        </div>
      </Section>

      {/* ── SECCIÓN: Imagen ── */}
      <Section
        title="Imagen de portada"
        open={openSections.imagen}
        onToggle={() => toggleSection("imagen")}
      >
        <div className="space-y-3">
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setImageFile(f); setUploadedImage(null); }
            }}
          />
          {imageFile ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{imageFile.name}</p>
                <p className="text-xs text-muted-foreground">{(imageFile.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={() => { setImageFile(null); setUploadedImage(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click para subir imagen (JPG, PNG · máx 15 MB)</span>
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Opcional — si no subís imagen, la app usa session-2.jpg como placeholder.
          </p>
        </div>
      </Section>

      {/* ── SECCIÓN: Extras ── */}
      <Section
        title="Detalles adicionales"
        open={openSections.extras}
        onToggle={() => toggleSection("extras")}
      >
        <div className="space-y-5">
          {/* Benefits */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Beneficios (máx 8)</Label>
            <div className="flex gap-2">
              <Input
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                placeholder="Ej: Relajación profunda"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBenefit())}
              />
              <Button type="button" variant="outline" onClick={addBenefit} disabled={benefits.length >= 8}>
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {benefits.map((b, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {b}
                  <button type="button" onClick={() => setBenefits((p) => p.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Instruments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Instrumentos (máx 12)</Label>
            <div className="flex gap-2">
              <Input
                value={instrumentInput}
                onChange={(e) => setInstrumentInput(e.target.value)}
                placeholder="Ej: Cuencos tibetanos"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInstrument())}
              />
              <Button type="button" variant="outline" onClick={addInstrument} disabled={instruments.length >= 12}>
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {instruments.map((b, i) => (
                <Badge key={i} variant="secondary" className="gap-1">
                  {b}
                  <button type="button" onClick={() => setInstruments((p) => p.filter((_, j) => j !== i))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer de submit ── */}
      <div className="border-t border-border pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <Switch id="publish" checked={publishDirectly} onCheckedChange={setPublishDirectly} />
          <Label htmlFor="publish" className="cursor-pointer">
            Publicar directamente
            <span className="ml-2 text-xs text-muted-foreground">
              {publishDirectly ? "Visible en la app al guardar" : "Queda pendiente en Moderación"}
            </span>
          </Label>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 text-base font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Subiendo...
            </>
          ) : publishDirectly ? (
            "Publicar sesión"
          ) : (
            "Guardar como borrador"
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
      >
        <span className="font-semibold text-sm">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
  clearable,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  clearable?: boolean;
}) {
  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clearable && (
          <SelectItem value="__none__">
            <span className="text-muted-foreground">— Ninguno —</span>
          </SelectItem>
        )}
        {options.map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AudioUploadSlot({
  label,
  slot,
  onChange,
  inputRef,
}: {
  label: string;
  slot: AudioSlot;
  onChange: (s: AudioSlot) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange({ ...slot, file: f, name: slot.name || f.name.replace(/\.[^.]+$/, "") });
        }}
      />

      {slot.file ? (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
          <Music className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{slot.file.name}</p>
            <p className="text-xs text-muted-foreground">{(slot.file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <button type="button" onClick={() => onChange({ ...slot, file: null, objectPath: "" })} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <Upload className="w-6 h-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click para subir audio (MP3, WAV · máx 200 MB)</span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre del audio">
          <Input
            value={slot.name}
            onChange={(e) => onChange({ ...slot, name: e.target.value })}
            placeholder="Ej: Cuencos del alba"
            maxLength={200}
          />
        </Field>
        <Field label="Rol">
          <Select value={slot.role} onValueChange={(v) => onChange({ ...slot, role: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Duración (segundos, opcional)">
          <Input
            type="number"
            value={slot.durationSeconds}
            onChange={(e) => onChange({ ...slot, durationSeconds: e.target.value })}
            placeholder="1800"
          />
        </Field>
        <div className="flex items-end pb-0.5">
          <div className="flex items-center gap-2 h-10">
            <Switch
              id={`loop-${label}`}
              checked={slot.isLoop}
              onCheckedChange={(v) => onChange({ ...slot, isLoop: v })}
            />
            <Label htmlFor={`loop-${label}`} className="cursor-pointer text-sm">Loop</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

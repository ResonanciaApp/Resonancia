import { useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  X,
  Music,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
  RefreshCw,
  Repeat,
} from "lucide-react";
import { TagOptionSelector, SingleTagOptionSelector } from "@/components/TagOptionSelector";
import {
  useCreateSubmission,
  useApproveSubmission,
  useRequestUploadUrl,
  useEditSubmission,
  useAddAdminSessionAudio,
  useDeleteAdminSessionAudio,
  useHideSubmission,
  useUnhideSubmission,
  useRejectSubmission,
  useGetCatalog,
  getGetCatalogQueryKey,
} from "@workspace/api-client-react";
import type { Submission, CatalogAudioFile } from "@workspace/api-client-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ── Constantes de taxonomía ────────────────────────────────────────────────

const CATS = [
  { id: "sonidos-ancestrales", label: "Sonoterapia", categoryLabel: "Sonoterapia", color: "#D4AF37" },
  { id: "descanso", label: "Dormir", categoryLabel: "Dormir", color: "#8AAAD4" },
  { id: "meditaciones-guiadas", label: "Meditaciones", categoryLabel: "Meditaciones", color: "#E9C46A" },
  { id: "musica-sonidos", label: "Música", categoryLabel: "Música", color: "#FBA980" },
  { id: "historias", label: "Historias", categoryLabel: "Historias", color: "#D5A4E8" },
  { id: "charlas", label: "Charlas", categoryLabel: "Charlas", color: "#F0B17A" },
] as const;

const ANCESTRAL_TAGS = ["Cuencos Tibetanos","Cuencos de Cuarzo","Mix de Cuencos","Gongs","Cuencos y Gongs","Full Instrumentos"];
const MEDITATION_TAGS = ["No Duales","Visualizaciones","Mantras","Escaneo Corporal","Manifestación","3 Minutos de Sabiduría"];
const SOUND_TAGS = ["Música Ambient","Música Enteógena","Música Étnica","Música Tribal"];
const DESCANSO_TAGS = ["Relajaciones","Sueño profundo","Ruidos","Meditaciones","Historias para dormir","Historias infantiles","ASMR","Sonidos Binaurales","Sonidos Ambientales"];
const SONIDOS_TAGS = ["Sonidos Binaurales","Sonidos Naturaleza","Sonidos Atmosféricos"];
const PODCAST_TAGS = ["Espiritualidad","Salud y Bienestar","Disciplinas","Psicología Transpersonal","Enteógenos","Sobrenatural","Neurociencia"];
const SLEEP_TAGS = ["Sonidos Binaurales","Sonidos Ancestrales","ASMR Expansivos"];
const THEME_TAGS = ["Yoga","Respiración","Ansiedad","Rituales","Crecimiento","ASMR","Estrés","Spa","Familia"];
const OTHER_THEME_TAGS = ["Para la ansiedad","Energiza tus mañanas","Foco y concentración","Suelto la Rabia","Crecimiento personal","Armonía familiar","Respiración consciente","Meditaciones Activas","Astrología"];
const TEMA_TAGS = ["Yoga","Respiración","Ansiedad","Rituales","ASMR","Estrés","Spa","Familia","Insomnio"];
const AUDIO_ROLES = ["main","voice","ambient","base","sound"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("/objects/")) return `/api/storage${raw}`;
  return raw;
}

import { uploadFile as uploadFileShared, type UploadedFile } from "@/lib/uploadFile";

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

type CreateBody = Parameters<ReturnType<typeof useCreateSubmission>["mutateAsync"]>[0]["data"];
type EditBody = Parameters<ReturnType<typeof useEditSubmission>["mutateAsync"]>[0]["data"];

export interface SessionFormProps {
  mode: "create" | "edit";
  initial?: Submission;
  onSaved?: () => void;
}

// ── Componente principal ───────────────────────────────────────────────────

export default function SessionForm({ mode, initial, onSaved }: SessionFormProps) {
  const isEdit = mode === "edit";
  const qc = useQueryClient();

  // ── Catálogo (para el selector de categorías) ──
  const { data: catalog } = useGetCatalog({
    query: { queryKey: getGetCatalogQueryKey() },
  });

  // Opciones de categoría: primero las conocidas (CATS), luego cualquier extra del catálogo
  const catalogCats = catalog?.categories ?? [];
  const categoryOptions = (() => {
    const known = CATS.map((c) => ({ id: c.id, label: c.label, color: c.color }));
    const knownIds = new Set<string>(known.map((k) => k.id));
    const extras = catalogCats
      .filter((c) => !knownIds.has(c.id))
      .map((c) => ({ id: c.id, label: c.title, color: c.color || "#9B8A86" }));
    return [...known, ...extras];
  })();

  // categoryLabel a guardar: CATS mapping para ids conocidos, sino el título del catálogo
  const categoryLabelFor = (id: string): string => {
    const cat = CATS.find((c) => (c.id as string) === id);
    if (cat) return cat.categoryLabel;
    const cc = catalogCats.find((c) => c.id === id);
    return cc?.title ?? id;
  };

  // ── Estado del formulario ──
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [playerDescription, setPlayerDescription] = useState(initial?.playerDescription ?? "");
  const [duration, setDuration] = useState(initial?.duration ? String(initial.duration) : "");
  const [isPremium, setIsPremium] = useState(initial?.isPremium ?? false);
  const [isPlaceholder, setIsPlaceholder] = useState(initial?.isPlaceholder ?? false);
  const [skipDetail, setSkipDetail] = useState(initial?.skipDetail ?? false);
  const [skipMiniPlayer, setSkipMiniPlayer] = useState(initial?.skipMiniPlayer ?? false);
  const [isLoop, setIsLoop] = useState(initial?.isLoop ?? false);
  const [frequency, setFrequency] = useState(initial?.frequency ?? "");
  const [voiceTag, setVoiceTag] = useState<string>(initial?.voiceTag ?? "");

  // Extras solo en edición
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder != null ? String(initial.sortOrder) : "");
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [isFeaturedCategory, setIsFeaturedCategory] = useState(initial?.isFeaturedCategory ?? false);
  const [isNew, setIsNew] = useState(initial?.isNew ?? false);
  const [isPinnedFeatured, setIsPinnedFeatured] = useState(initial?.isPinnedFeatured ?? false);

  // Toggles mutuamente excluyentes (reproductor directo vs miniplayer directo)
  const handleSkipDetail = (v: boolean) => {
    setSkipDetail(v);
    if (v) setSkipMiniPlayer(false);
  };
  const handleSkipMiniPlayer = (v: boolean) => {
    setSkipMiniPlayer(v);
    if (v) setSkipDetail(false);
  };
  const handlePlaceholder = (v: boolean) => {
    setIsPlaceholder(v);
    // Un placeholder debe abrir una superficie con contexto y aviso, nunca
    // intentar arrancar silenciosamente en el miniplayer.
    if (v) setSkipMiniPlayer(false);
  };

  // Tags por categoría
  const [ancestralTag, setAncestralTag] = useState(initial?.ancestralTag ?? "");
  const [meditationTag, setMeditationTag] = useState(initial?.meditationTag ?? "");
  const [soundTag, setSoundTag] = useState(initial?.soundTag ?? "");
  const [descansoTag, setDescansoTag] = useState(initial?.descansoTag ?? "");
  const [artistId, setArtistId] = useState(initial?.artistId ?? "");
  const [sonidosTag, setSonidosTag] = useState(initial?.sonidosTag ?? "");
  const [podcastTag, setPodcastTag] = useState(initial?.podcastTag ?? "");
  const [sabiduriaTag, setSabiduriaTag] = useState(initial?.sabiduriaTag ?? "");
  const [sleepTag, setSleepTag] = useState(initial?.sleepTag ?? "");
  const [themeTag, setThemeTag] = useState<string[]>(initial?.themeTag ?? []);
  const [temaTag, setTemaTag] = useState<string[]>(initial?.temaTag ?? []);
  const [guideIds, setGuideIds] = useState<string[]>(initial?.guideId ? [initial.guideId] : [""]);
  const addGuideSlot = () => setGuideIds((p) => p.length < 4 ? [...p, ""] : p);
  const removeGuideSlot = (i: number) => setGuideIds((p) => p.filter((_, idx) => idx !== i));
  const setGuideSlot = (i: number, val: string) => setGuideIds((p) => p.map((v, idx) => idx === i ? val : v));

  // Arrays
  const [benefitInput, setBenefitInput] = useState("");
  const [benefits, setBenefits] = useState<string[]>(initial?.benefits ?? []);
  const [instrumentInput, setInstrumentInput] = useState("");
  const [instruments, setInstruments] = useState<string[]>(initial?.instruments ?? []);

  // Audios (solo modo crear)
  const [audio1, setAudio1] = useState<AudioSlot>(emptyAudioSlot());
  const [audio2, setAudio2] = useState<AudioSlot>(emptyAudioSlot());
  const [showAudio2, setShowAudio2] = useState(false);

  // Imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<UploadedFile | null>(null);

  // Publicación (modo crear): "publish" | "pending" | "draft"
  const [publishMode, setPublishMode] = useState<"publish" | "pending" | "draft">("publish");

  // Secciones expandidas
  const [openSections, setOpenSections] = useState({
    basicos: true, categoria: !isEdit, subcategoria: true, tags: true,
    audios: !isEdit, imagen: false, extras: false,
  });

  // Estado de submit
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ label: string; pct: number } | null>(null);
  const [done, setDone] = useState(false);

  // Refs para inputs de archivo
  const audio1Ref = useRef<HTMLInputElement>(null);
  const audio2Ref = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  // ── Hooks API ──
  const { mutateAsync: requestUrl } = useRequestUploadUrl();
  const { mutateAsync: createSubmission } = useCreateSubmission();
  const { mutateAsync: approveSubmission } = useApproveSubmission();
  const { mutateAsync: editSubmission } = useEditSubmission();

  // ── Helpers ──
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  const toggleTheme = (tag: string) =>
    setThemeTag((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const toggleTema = (tag: string) =>
    setTemaTag((prev) =>
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

  // ── Leer duración de un archivo de audio ──
  const readAudioDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Math.round(audio.duration / 60)); // en minutos
      };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    });

  const handleAudio1Change = async (slot: AudioSlot) => {
    setAudio1(slot);
    if (slot.file) {
      const mins = await readAudioDuration(slot.file);
      if (mins > 0) setDuration(String(mins));
    }
  };

  // ── Upload de un archivo con progreso ──
  const uploadFile = (file: File, progressLabel?: string): Promise<UploadedFile> =>
    uploadFileShared(file, requestUrl, setUploadProgress, progressLabel);

  const isMusica = categoryId === "musica-sonidos";

  // ── Validación rápida ──
  const validate = (): string | null => {
    if (!categoryId) return "Seleccioná una categoría";
    if (categoryId === "descanso" && !descansoTag) return "Seleccioná una subcategoría de Dormir";
    if (categoryId === "musica-sonidos" && !soundTag) return "Seleccioná una subcategoría de Música";
    if (!title.trim()) return "El título es requerido";
    if (!subtitle.trim()) return "El subtítulo es requerido";
    if (!description.trim()) return "La descripción es requerida";
    const d = Number(duration);
    if (!d || d < 1 || d > 600) return "La duración debe ser entre 1 y 600 minutos";
    if (!isEdit && !isPlaceholder) {
      if (!audio1.file) return "Agregá al menos un archivo de audio";
      if (!audio1.name.trim()) return "Poné un nombre al audio 1";
      if (showAudio2 && audio2.file && !audio2.name.trim()) return "Poné un nombre al audio 2";
    }
    return null;
  };

  // ── Submit CREAR ──
  const handleCreate = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    setUploadProgress({ label: "Preparando subida…", pct: 0 });
    try {
      const a1 = audio1.file
        ? await uploadFile(audio1.file, "Subiendo audio principal")
        : null;
      let a2: UploadedFile | null = null;
      if (showAudio2 && audio2.file) {
        a2 = await uploadFile(audio2.file, "Subiendo audio secundario");
      }

      let imgUploaded: UploadedFile | null = uploadedImage;
      if (imageFile && !uploadedImage) {
        imgUploaded = await uploadFile(imageFile, "Subiendo imagen");
        setUploadedImage(imgUploaded);
      }

      setUploadProgress({ label: "Guardando sesión…", pct: 100 });

      const audioFiles: CreateBody["audioFiles"] = [];
      if (a1) {
        audioFiles.push({
          objectPath: a1.objectPath,
          name: audio1.name.trim(),
          contentType: a1.contentType,
          sizeBytes: a1.sizeBytes,
          role: audio1.role as "main"|"voice"|"ambient"|"base"|"sound",
          durationSeconds: audio1.durationSeconds ? Number(audio1.durationSeconds) : undefined,
          isLoop: audio1.isLoop,
        });
      }
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

      const body: CreateBody = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        categoryId,
        categoryLabel: categoryLabelFor(categoryId),
        duration: Number(duration),
        isPremium,
        isPlaceholder,
        skipDetail,
        skipMiniPlayer,
        isLoop,
        frequency: frequency.trim() || null,
        voiceTag: (voiceTag as CreateBody["voiceTag"]) || undefined,
        benefits: benefits.length ? benefits : undefined,
        instruments: instruments.length ? instruments : undefined,
        themeTag: themeTag.length ? themeTag : undefined,
        temaTag: temaTag.length ? temaTag : undefined,
        sleepTag: sleepTag || undefined,
        ancestralTag: ancestralTag || undefined,
        meditationTag: meditationTag || undefined,
        soundTag: soundTag || undefined,
        descansoTag: descansoTag || undefined,
        sonidosTag: sonidosTag || undefined,
        podcastTag: podcastTag || undefined,
        sabiduriaTag: sabiduriaTag || undefined,
        artistId: isMusica ? (artistId.trim() || null) : null,
        guideId: isMusica ? null : (guideIds.filter(Boolean)[0]?.trim() || null),
        playerDescription: playerDescription.trim() || null,
        imageObjectPath: imgUploaded?.objectPath ?? null,
        imageContentType: imgUploaded?.contentType ?? null,
        imageSizeBytes: imgUploaded?.sizeBytes ?? null,
        audioFiles,
        ...(publishMode === "draft" ? { status: "draft" as const } : {}),
      };

      const submission = await createSubmission({ data: body });

      if (publishMode === "publish") {
        await approveSubmission({ id: submission.id });
        toast.success("Sesión publicada correctamente");
      } else if (publishMode === "draft") {
        toast.success("Sesión guardada como borrador");
      } else {
        toast.success("Sesión enviada — pendiente de revisión");
      }

      qc.invalidateQueries();
      setDone(true);
      onSaved?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear la sesión";
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  // ── Submit EDITAR ──
  const handleEdit = async () => {
    if (!initial) return;
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      let imgUploaded: UploadedFile | null = uploadedImage;
      if (imageFile && !uploadedImage) {
        setUploadProgress({ label: "Subiendo imagen…", pct: 0 });
        imgUploaded = await uploadFile(imageFile, "Subiendo imagen");
        setUploadedImage(imgUploaded);
      }

      const body: EditBody = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        categoryId,
        categoryLabel: categoryLabelFor(categoryId),
        duration: Number(duration),
        description: description.trim(),
        benefits,
        instruments,
        isPremium,
        isPlaceholder,
        skipDetail,
        skipMiniPlayer,
        isLoop,
        isFeatured,
        isFeaturedCategory,
        isNew,
        isPinnedFeatured,
        frequency: frequency.trim() || null,
        voiceTag: (voiceTag ? (voiceTag as EditBody["voiceTag"]) : null),
        themeTag,
        temaTag,
        sleepTag: sleepTag || null,
        ancestralTag: ancestralTag || null,
        meditationTag: meditationTag || null,
        soundTag: soundTag || null,
        descansoTag: descansoTag || null,
        sonidosTag: sonidosTag || null,
        podcastTag: podcastTag || null,
        sabiduriaTag: sabiduriaTag || null,
        artistId: isMusica ? (artistId.trim() || null) : null,
        guideId: isMusica ? null : (guideIds.filter(Boolean)[0]?.trim() || null),
        playerDescription: playerDescription.trim() || null,
        ...(sortOrder !== "" && !isNaN(Number(sortOrder)) ? { sortOrder: Number(sortOrder) } : {}),
        ...(imgUploaded
          ? {
              imageObjectPath: imgUploaded.objectPath,
              imageContentType: imgUploaded.contentType,
              imageSizeBytes: imgUploaded.sizeBytes,
            }
          : {}),
      };

      await editSubmission({ id: initial.id, data: body });
      toast.success("Cambios guardados");
      qc.invalidateQueries();
      onSaved?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar los cambios";
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleReset = () => {
    setDone(false);
    setCategoryId(""); setTitle(""); setSubtitle(""); setDescription(""); setPlayerDescription("");
    setDuration(""); setIsPremium(false); setSkipDetail(false); setSkipMiniPlayer(false); setIsLoop(false);
    setFrequency(""); setVoiceTag("");
    setAncestralTag(""); setMeditationTag("");
    setSoundTag(""); setDescansoTag(""); setArtistId("");
    setSonidosTag(""); setPodcastTag(""); setSabiduriaTag(""); setSleepTag(""); setThemeTag([]); setTemaTag([]);
    setGuideIds([""]);
    setBenefits([]); setInstruments([]);
    setAudio1(emptyAudioSlot()); setAudio2(emptyAudioSlot()); setShowAudio2(false);
    setImageFile(null); setUploadedImage(null);
  };

  // ── Estado final (solo modo crear) ──
  if (done && !isEdit) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
        <CheckCircle2 className="w-16 h-16 text-primary" />
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {publishMode === "publish"
              ? "Sesión publicada"
              : publishMode === "draft"
              ? "Borrador guardado"
              : "Sesión enviada a revisión"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {publishMode === "publish"
              ? "Ya está visible en la app."
              : publishMode === "draft"
              ? "Podés publicarla más tarde desde Sesiones."
              : "Podés aprobarla desde la cola de Moderación."}
          </p>
        </div>
        <Button onClick={handleReset}>Subir otra sesión</Button>
      </div>
    );
  }

  const catInfo = categoryOptions.find((c) => c.id === categoryId);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? "Editar sesión" : "Nueva sesión"}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit
              ? "Modificá los datos, audios e imagen de la sesión."
              : "Cargá los datos y archivos de la sesión para publicarla en la app."}
          </p>
        </div>
        {isEdit && initial && <StatusControls submission={initial} />}
      </div>

      {/* ── SECCIÓN: Categoría ── */}
      <Section
        title="Categoría"
        open={openSections.categoria}
        onToggle={() => toggleSection("categoria")}
      >
        <div className="grid grid-cols-2 gap-3">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(cat.id);
                if (!isEdit) {
                  // reset tags al cambiar categoría
                  setAncestralTag(""); setMeditationTag("");
                  setSoundTag(""); setDescansoTag(""); setArtistId("");
                  setSonidosTag(""); setPodcastTag(""); setGuideIds([""]);
                  // auto-mostrar audio2 con rol correcto según categoría
                  if (cat.id === "sonidos-ancestrales" || cat.id === "meditaciones-guiadas" || cat.id === "descanso") {
                    setShowAudio2(true);
                    setAudio2((a) => ({ ...a, role: "voice" }));
                  } else {
                    setShowAudio2(false);
                    setAudio2({ ...emptyAudioSlot(), role: "ambient" });
                  }
                }
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
            categoryLabel que se guarda: <strong className="text-foreground">"{categoryLabelFor(categoryId)}"</strong>
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
          <Field label="Descripción reproductor (opcional)">
            <Textarea
              value={playerDescription}
              onChange={(e) => setPlayerDescription(e.target.value)}
              placeholder="Texto corto que aparece bajo el título en el reproductor…"
              rows={2}
              maxLength={300}
              className="resize-none"
            />
            <span className="text-xs text-muted-foreground">{playerDescription.length}/300</span>
          </Field>

          {isMusica && (
            <Field label="Artista (opcional)">
              <Input
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                placeholder="id-del-artista (ej: lumen-sonora)"
                maxLength={100}
              />
              <span className="text-xs text-muted-foreground">
                Default si se deja vacío: Resonancia
              </span>
            </Field>
          )}

          {categoryId && !isMusica && (
            <Field label="Autores / Voces guía">
              <div className="flex flex-col gap-2">
                {guideIds.map((gid, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={gid} onValueChange={(val) => setGuideSlot(i, val === "__custom__" ? "" : val)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar autor…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casa-cuenco">Casa del Cuenco (default)</SelectItem>
                        <SelectItem value="sofia-ramirez">Sofía Ramírez</SelectItem>
                        <SelectItem value="mateo-luz">Mateo Luz</SelectItem>
                        <SelectItem value="__custom__">Otro (escribir ID)…</SelectItem>
                      </SelectContent>
                    </Select>
                    {(gid === "" || !["casa-cuenco","sofia-ramirez","mateo-luz"].includes(gid)) && gid !== "" && (
                      <Input
                        value={gid}
                        onChange={(e) => setGuideSlot(i, e.target.value)}
                        placeholder="id-del-autor"
                        className="flex-1"
                      />
                    )}
                    {guideIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuideSlot(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors px-1"
                        title="Quitar"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {guideIds.length < 4 && (
                  <button
                    type="button"
                    onClick={addGuideSlot}
                    className="text-xs text-primary hover:underline self-start"
                  >
                    + Agregar otro autor
                  </button>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Default si no se selecciona: Casa del Cuenco
              </span>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label={`Duración (minutos)${duration ? "" : " *"}`}>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Se detecta del audio"
                min={1}
                max={600}
              />
              {duration ? (
                <span className="text-xs text-primary">✓ Detectada automáticamente del audio</span>
              ) : (
                <span className="text-xs text-muted-foreground">Se rellena sola al subir el audio</span>
              )}
            </Field>
            <Field label="Frecuencia (opcional)">
              <Input
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="Ej: 432 Hz"
                maxLength={60}
              />
            </Field>
            <Field label="Etiqueta de voz (opcional)">
              <SelectField
                value={voiceTag}
                onChange={setVoiceTag}
                placeholder="Sin etiqueta"
                options={["Guiada", "Sin voz"]}
                clearable
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
          <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
            <div className="flex items-center gap-3">
              <Switch id="isPlaceholder" checked={isPlaceholder} onCheckedChange={handlePlaceholder} />
              <Label htmlFor="isPlaceholder" className="cursor-pointer">
                Mostrar como “próximamente”
                <span className="ml-2 text-xs text-muted-foreground">(visible en la app, con Play deshabilitado)</span>
              </Label>
            </div>
            {isPlaceholder && (
              <p className="mt-2 text-xs text-muted-foreground">
                Esta es una excepción editorial explícita. Desactívala solo cuando el audio final esté cargado y listo.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch id="isLoop" checked={isLoop} onCheckedChange={setIsLoop} />
            <Label htmlFor="isLoop" className="cursor-pointer">
              Sesión en loop infinito
              <span className="ml-2 text-xs text-muted-foreground">(se repite sin fin en el reproductor)</span>
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="skipDetail" checked={skipDetail} onCheckedChange={handleSkipDetail} />
            <Label htmlFor="skipDetail" className="cursor-pointer">
              Pasar directo al reproductor
              <span className="ml-2 text-xs text-muted-foreground">(omite la pantalla de descripción)</span>
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="skipMiniPlayer" checked={skipMiniPlayer} onCheckedChange={handleSkipMiniPlayer} />
            <Label htmlFor="skipMiniPlayer" className="cursor-pointer">
              Pasar directo al miniplayer
              <span className="ml-2 text-xs text-muted-foreground">(reproduce al instante en el miniplayer, sin abrir pantallas)</span>
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
              <SingleTagOptionSelector
                tagType="ancestral"
                defaults={ANCESTRAL_TAGS}
                label="Subcategoría *"
                selected={ancestralTag}
                onSelect={setAncestralTag}
              />
            )}

            {categoryId === "meditaciones-guiadas" && (
              <SingleTagOptionSelector
                tagType="meditation"
                defaults={MEDITATION_TAGS}
                label="Subcategoría *"
                selected={meditationTag}
                onSelect={setMeditationTag}
              />
            )}

            {categoryId === "descanso" && (
              <SingleTagOptionSelector
                tagType="descanso"
                defaults={DESCANSO_TAGS}
                label="Subcategoría *"
                selected={descansoTag}
                onSelect={setDescansoTag}
              />
            )}

            {categoryId === "musica-sonidos" && (
              <SingleTagOptionSelector
                tagType="sound"
                defaults={SOUND_TAGS}
                label="Subcategoría *"
                selected={soundTag}
                onSelect={setSoundTag}
              />
            )}

            <SingleTagOptionSelector
              tagType="sonidos"
              defaults={SONIDOS_TAGS}
              label="Etiqueta Sonidos (opcional)"
              selected={sonidosTag}
              onSelect={setSonidosTag}
            />

            <SingleTagOptionSelector
              tagType="podcast"
              defaults={PODCAST_TAGS}
              label="Etiqueta Podcast (opcional)"
              selected={podcastTag}
              onSelect={setPodcastTag}
            />
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
            <TagOptionSelector
              tagType="theme"
              defaults={THEME_TAGS}
              label="Etiquetas Nivel 1 (opcional)"
              selected={themeTag}
              onToggle={toggleTheme}
              pill
            />

            <TagOptionSelector
              tagType="tema"
              defaults={TEMA_TAGS}
              label="Etiquetas Nivel 2 (opcional)"
              selected={temaTag}
              onToggle={toggleTema}
              pill
            />

            <TagOptionSelector
              tagType="other_theme"
              defaults={OTHER_THEME_TAGS}
              label="Otras temáticas (opcional)"
              selected={themeTag}
              onToggle={toggleTheme}
              pill
            />

            {(categoryId === "musica-sonidos" || categoryId === "descanso") && (
              <SingleTagOptionSelector
                tagType="sleep"
                defaults={SLEEP_TAGS}
                label="Etiqueta Dormir (opcional)"
                selected={sleepTag}
                onSelect={setSleepTag}
              />
            )}
          </div>
        </Section>
      )}

      {/* ── SECCIÓN: Audios ── */}
      {!isEdit ? (
        <Section
          title="Archivos de audio"
          open={openSections.audios}
          onToggle={() => toggleSection("audios")}
        >
          {(() => {
            const audio1Label = isPlaceholder
              ? (isMusica ? "Audio principal (opcional mientras sea próximamente)" : "Audio base (opcional mientras sea próximamente)")
              : (isMusica ? "Audio principal *" : "Audio base *");
            const audio2Label = isMusica ? "Audio ambiente (opcional)" : "Voz guía (opcional)";
            return (
              <div className="space-y-6">
                <AudioUploadSlot
                  label={audio1Label}
                  slot={audio1}
                  onChange={handleAudio1Change}
                  inputRef={audio1Ref}
                />

                {showAudio2 ? (
                  <AudioUploadSlot
                    label={audio2Label}
                    slot={audio2}
                    onChange={setAudio2}
                    inputRef={audio2Ref}
                    onRemove={() => { setShowAudio2(false); setAudio2(emptyAudioSlot()); }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAudio2(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    + {audio2Label}
                  </button>
                )}
              </div>
            );
          })()}
        </Section>
      ) : (
        initial && (
          <Section
            title="Archivos de audio"
            open={openSections.audios}
            onToggle={() => toggleSection("audios")}
          >
            <ExistingAudios
              sessionId={initial.id}
              audioFiles={initial.audioFiles}
              uploadFile={uploadFile}
              setUploadProgress={setUploadProgress}
            />
          </Section>
        )
      )}

      {/* ── SECCIÓN: Imagen ── */}
      <Section
        title="Imagen de portada"
        open={openSections.imagen}
        onToggle={() => toggleSection("imagen")}
      >
        <div className="space-y-3">
          {isEdit && initial && resolveImageUrl(initial.imageUrl) && !imageFile && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={resolveImageUrl(initial.imageUrl)!}
                  alt="portada actual"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Imagen actual</p>
                <p className="text-xs text-muted-foreground">Subí una nueva para reemplazarla</p>
              </div>
            </div>
          )}
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
              <span className="text-sm text-muted-foreground">
                {isEdit ? "Click para reemplazar la imagen (JPG, PNG · máx 15 MB)" : "Click para subir imagen (JPG, PNG · máx 15 MB)"}
              </span>
            </button>
          )}
          {!isEdit && (
            <p className="text-xs text-muted-foreground">
              Opcional — si no subís imagen, la app usa session-2.jpg como placeholder.
            </p>
          )}
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

          {isEdit && (
            <>
              <Field label="Orden (sortOrder)">
                <Input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                />
              </Field>
              <div className="flex items-center gap-3">
                <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
                <Label htmlFor="isFeatured" className="cursor-pointer">Destacada en Inicio</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isFeaturedCategory" checked={isFeaturedCategory} onCheckedChange={setIsFeaturedCategory} />
                <Label htmlFor="isFeaturedCategory" className="cursor-pointer">Destacada en su categoría</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isNew" checked={isNew} onCheckedChange={setIsNew} />
                <Label htmlFor="isNew" className="cursor-pointer">Marcar como nueva</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isPinnedFeatured" checked={isPinnedFeatured} onCheckedChange={setIsPinnedFeatured} />
                <Label htmlFor="isPinnedFeatured" className="cursor-pointer">Fijada como "Destacada de hoy"</Label>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── Footer de submit ── */}
      <div className="border-t border-border pt-6 space-y-4">
        {!isEdit && (
          <Field label="¿Qué hacer al guardar?">
            <Select value={publishMode} onValueChange={(v) => setPublishMode(v as typeof publishMode)}>
              <SelectTrigger disabled={submitting}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publish">Publicar directamente</SelectItem>
                <SelectItem value="pending">Pendiente de revisión</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        )}

        {uploadProgress && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{uploadProgress.label}</span>
              </div>
              <span className="font-semibold text-primary">{uploadProgress.pct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress.pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              No cierres ni recargues esta página mientras se sube el archivo.
            </p>
          </div>
        )}

        <Button
          onClick={isEdit ? handleEdit : handleCreate}
          disabled={submitting}
          className="w-full h-12 text-base font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : isEdit ? (
            "Guardar cambios"
          ) : publishMode === "publish" ? (
            "Publicar sesión"
          ) : publishMode === "draft" ? (
            "Guardar borrador"
          ) : (
            "Enviar a revisión"
          )}
        </Button>
      </div>
    </div>
  );
}

// ── Controles de estado (modo edición) ─────────────────────────────────────

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  draft: { label: "Borrador", variant: "outline" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

function StatusControls({ submission }: { submission: Submission }) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const invalidate = () => qc.invalidateQueries();

  const approve = useApproveSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión publicada."); invalidate(); },
      onError: () => toast.error("No se pudo publicar."),
    },
  });
  const hide = useHideSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión despublicada."); invalidate(); },
      onError: () => toast.error("No se pudo despublicar."),
    },
  });
  const unhide = useUnhideSubmission({
    mutation: {
      onSuccess: () => { toast.success("Sesión publicada."); invalidate(); },
      onError: () => toast.error("No se pudo publicar."),
    },
  });

  const badge = STATUS_BADGE[submission.status] ?? { label: submission.status, variant: "outline" as const };

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <Badge variant={badge.variant}>{badge.label}</Badge>
      <div className="flex flex-wrap gap-2 justify-end">
        {submission.status === "pending" && (
          <>
            <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate({ id: submission.id })}>
              Publicar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setRejectOpen(true)}>
              Rechazar
            </Button>
          </>
        )}
        {submission.status === "published" && (
          <Button size="sm" variant="outline" disabled={hide.isPending} onClick={() => hide.mutate({ id: submission.id })}>
            Despublicar
          </Button>
        )}
        {submission.status === "draft" && (
          <Button size="sm" disabled={unhide.isPending} onClick={() => unhide.mutate({ id: submission.id })}>
            Publicar
          </Button>
        )}
        {submission.status === "rejected" && (
          <Button size="sm" disabled={approve.isPending} onClick={() => approve.mutate({ id: submission.id })}>
            Publicar
          </Button>
        )}
      </div>
      <RejectDialog submission={submission} open={rejectOpen} onOpenChange={setRejectOpen} />
    </div>
  );
}

function RejectDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const mutation = useRejectSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Sesión rechazada.");
        qc.invalidateQueries();
        onOpenChange(false);
        setReason("");
      },
      onError: () => toast.error("No se pudo rechazar."),
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar “{submission.title}”</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Motivo del rechazo</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explicá por qué se rechaza…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length === 0 || mutation.isPending}
            onClick={() => mutation.mutate({ id: submission.id, data: { reason: reason.trim() } })}
          >
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Audios existentes (modo edición) ────────────────────────────────────────

function ExistingAudios({
  sessionId,
  audioFiles,
  uploadFile,
  setUploadProgress,
}: {
  sessionId: string;
  audioFiles: CatalogAudioFile[];
  uploadFile: (file: File, label?: string) => Promise<UploadedFile>;
  setUploadProgress: (p: { label: string; pct: number } | null) => void;
}) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatalogAudioFile | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSlot, setNewSlot] = useState<AudioSlot>(emptyAudioSlot());
  const replaceRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<number | null>(null);

  const { mutateAsync: addAudio } = useAddAdminSessionAudio();
  const remove = useDeleteAdminSessionAudio({
    mutation: {
      onSuccess: () => {
        toast.success("Audio eliminado.");
        qc.invalidateQueries();
        setDeleteTarget(null);
      },
      onError: (e: unknown) => {
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "No se pudo eliminar. Debe quedar al menos un audio.";
        toast.error(msg);
        setDeleteTarget(null);
      },
    },
  });

  const doReplace = async (file: File) => {
    const audioId = replaceTargetRef.current;
    if (audioId == null) return;
    setBusy(true);
    try {
      const up = await uploadFile(file, "Subiendo audio…");
      await addAudio({
        id: sessionId,
        data: {
          objectPath: up.objectPath,
          name: file.name.replace(/\.[^.]+$/, ""),
          contentType: up.contentType,
          sizeBytes: up.sizeBytes,
          replaceAudioId: audioId,
        },
      });
      toast.success("Audio reemplazado.");
      qc.invalidateQueries();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo reemplazar el audio.");
    } finally {
      setBusy(false);
      setUploadProgress(null);
      replaceTargetRef.current = null;
    }
  };

  const doAdd = async () => {
    if (!newSlot.file) { toast.error("Elegí un archivo de audio."); return; }
    if (!newSlot.name.trim()) { toast.error("Poné un nombre al audio."); return; }
    setBusy(true);
    try {
      const up = await uploadFile(newSlot.file, "Subiendo audio…");
      await addAudio({
        id: sessionId,
        data: {
          objectPath: up.objectPath,
          name: newSlot.name.trim(),
          contentType: up.contentType,
          sizeBytes: up.sizeBytes,
          role: newSlot.role as "main"|"voice"|"ambient"|"base"|"sound",
          durationSeconds: newSlot.durationSeconds ? Number(newSlot.durationSeconds) : undefined,
          isLoop: newSlot.isLoop,
        },
      });
      toast.success("Audio añadido.");
      qc.invalidateQueries();
      setShowAdd(false);
      setNewSlot(emptyAudioSlot());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo añadir el audio.");
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={replaceRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) doReplace(f);
          e.target.value = "";
        }}
      />

      <div className="space-y-3">
        {audioFiles.map((af) => (
          <div key={af.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
            <Music className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium truncate">{af.name}</p>
                <Badge variant="outline" className="text-xs">{af.role}</Badge>
                {af.isLoop && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Repeat className="w-3 h-3" /> Loop
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {af.sizeBytes ? `${(af.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "—"}
                {af.durationSeconds ? ` · ${af.durationSeconds}s` : ""}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => { replaceTargetRef.current = af.id; replaceRef.current?.click(); }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reemplazar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || remove.isPending}
                onClick={() => setDeleteTarget(af)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Nuevo audio</Label>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setNewSlot(emptyAudioSlot()); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
          <input
            ref={newRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setNewSlot((s) => ({ ...s, file: f, name: s.name || f.name.replace(/\.[^.]+$/, "") }));
            }}
          />
          {newSlot.file ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
              <Music className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{newSlot.file.name}</p>
                <p className="text-xs text-muted-foreground">{(newSlot.file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
              <button type="button" onClick={() => setNewSlot((s) => ({ ...s, file: null }))} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => newRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click para subir audio</span>
            </button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre del audio">
              <Input
                value={newSlot.name}
                onChange={(e) => setNewSlot((s) => ({ ...s, name: e.target.value }))}
                placeholder="Ej: Voz guía"
                maxLength={200}
              />
            </Field>
            <Field label="Rol">
              <Select value={newSlot.role} onValueChange={(v) => setNewSlot((s) => ({ ...s, role: v }))}>
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
                value={newSlot.durationSeconds}
                onChange={(e) => setNewSlot((s) => ({ ...s, durationSeconds: e.target.value }))}
                placeholder="1800"
              />
            </Field>
            <div className="flex items-end pb-0.5">
              <div className="flex items-center gap-2 h-10">
                <Switch
                  id="new-audio-loop"
                  checked={newSlot.isLoop}
                  onCheckedChange={(v) => setNewSlot((s) => ({ ...s, isLoop: v }))}
                />
                <Label htmlFor="new-audio-loop" className="cursor-pointer text-sm">Loop</Label>
              </div>
            </div>
          </div>
          <Button onClick={doAdd} disabled={busy} className="w-full">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Añadir audio"}
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="text-sm text-primary hover:underline"
        >
          + Añadir audio
        </button>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este audio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deleteTarget?.name}" de la sesión. Debe quedar al menos un audio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) remove.mutate({ id: sessionId, audioId: deleteTarget.id });
              }}
            >
              {remove.isPending ? "Eliminando…" : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  onRemove,
}: {
  label: string;
  slot: AudioSlot;
  onChange: (s: AudioSlot) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onRemove?: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs text-muted-foreground hover:text-foreground">
            Quitar
          </button>
        )}
      </div>
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

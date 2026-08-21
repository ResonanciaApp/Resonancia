import { useState, useRef } from "react";
import {
  useGetPendingSubmissions,
  useGetSubmissionFilterOptions,
  useApproveSubmission,
  useRejectSubmission,
  useEditSubmission,
  useHideSubmission,
  useUnhideSubmission,
  useDeleteSubmission,
  useGetPinnedFeatured,
  useSetPinnedFeatured,
  useRequestUploadUrl,
  useAddAdminSessionAudio,
  useDeleteAdminSessionAudio,
  getGetPendingSubmissionsQueryKey,
} from "@workspace/api-client-react";
import type {
  Submission,
  CatalogAudioFile,
  GetPendingSubmissionsStatus,
  GetPendingSubmissionsParams,
} from "@workspace/api-client-react";
import { uploadFile as uploadFileShared } from "@/lib/uploadFile";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, X, Loader2 } from "lucide-react";
import {
  TagOptionSelector,
  SingleTagOptionSelector,
} from "@/components/TagOptionSelector";

function resolveImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Paths relativos de Object Storage → pasar por el proxy API
  if (raw.startsWith("/objects/")) return `/api/storage${raw}`;
  return raw;
}

// ─── Destacada de hoy ────────────────────────────────────────────────────────

function DestacadaDeHoy() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetPinnedFeatured();
  const pinMutation = useSetPinnedFeatured({
    mutation: {
      onSuccess: () => {
        toast.success("Sesión destacada actualizada.");
        qc.invalidateQueries({ queryKey: ["getPinnedFeatured"] });
        qc.invalidateQueries();
        setPickerOpen(false);
        setSearch("");
      },
      onError: () => toast.error("No se pudo actualizar la sesión destacada."),
    },
  });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: publishedData, isLoading: loadingSessions } = useGetPendingSubmissions(
    { status: "published" },
    { query: { queryKey: getGetPendingSubmissionsQueryKey({ status: "published" }), enabled: pickerOpen } },
  );

  const filtered = (publishedData?.submissions ?? []).filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.categoryLabel?.toLowerCase().includes(search.toLowerCase()),
  );

  const current = data?.session ?? null;

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">Destacada de hoy</p>
            <p className="text-xs text-muted-foreground">
              Sesión fijada manualmente en la pantalla de inicio de la app.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {current && (
              <Button
                variant="outline"
                size="sm"
                disabled={pinMutation.isPending}
                onClick={() => pinMutation.mutate({ data: { sessionId: null } })}
              >
                Limpiar
              </Button>
            )}
            <Button size="sm" onClick={() => setPickerOpen(true)}>
              {current ? "Cambiar" : "Seleccionar"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        ) : current ? (
          <div className="flex items-center gap-3 rounded-md border px-3 py-2 bg-muted/30">
            {resolveImageUrl(current.imageUrl) && (
              <img
                src={resolveImageUrl(current.imageUrl)!}
                alt={current.title}
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{current.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {current.categoryLabel} · {current.durationLabel}
              </p>
            </div>
            <Badge variant="default" className="ml-auto shrink-0">Pinneada</Badge>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Ninguna sesión seleccionada — se mostrará la sesión aleatoria del día.
          </p>
        )}
      </CardContent>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Elegir "Destacada de hoy"</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Buscar por título o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ScrollArea className="h-80 pr-2">
            {loadingSessions ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Cargando sesiones…</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin resultados.</p>
            ) : (
              <div className="space-y-1 pt-1">
                {filtered.map((s) => (
                  <button
                    key={s.id}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
                    onClick={() => pinMutation.mutate({ data: { sessionId: s.id } })}
                    disabled={pinMutation.isPending}
                  >
                    {resolveImageUrl(s.imageUrl) && (
                      <img
                        src={resolveImageUrl(s.imageUrl)!}
                        alt={s.title}
                        className="w-9 h-9 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.categoryLabel} · {s.durationLabel}
                      </p>
                    </div>
                    {current?.id === s.id && (
                      <Badge variant="secondary" className="shrink-0">Actual</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Moderación ──────────────────────────────────────────────────────────────

const STATUS_TABS: { value: GetPendingSubmissionsStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "published", label: "Publicadas" },
  { value: "draft", label: "Ocultas" },
  { value: "rejected", label: "Rechazadas" },
];

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  pending: { label: "Pendiente", variant: "secondary" },
  published: { label: "Publicada", variant: "default" },
  draft: { label: "Oculta", variant: "outline" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

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
        toast.success("Envío rechazado.");
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
          <Label htmlFor="reason">Motivo del rechazo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica al creador por qué se rechaza…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={reason.trim().length === 0 || mutation.isPending}
            onClick={() =>
              mutation.mutate({
                id: submission.id,
                data: { reason: reason.trim() },
              })
            }
          >
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Defaults por categoryId para los selectores de tags
const ANCESTRAL_DEFAULTS = ["Cuencos Tibetanos","Cuencos de Cuarzo","Gongs","Gongs Planetarios","Cuencos y Gongs","Campanas","Flautas","Digeridoo","Tambores","Full Instrumentos","Vientos","Cantos","Percusión","Selva","Mix de Cuencos"];
const MEDITATION_DEFAULTS = ["Mindfulness","Visualización","Respiración","Yoga Nidra","Meditación Zen","Kundalini","Metta","Body Scan"];
const SOUND_DEFAULTS = ["Lluvia","Océano","Bosque","Río","Fuego","Viento","Ballenas","Pájaros","Cueva","Tormenta"];
const THEME_TAGS = ["Yoga","Respiración","Ansiedad","Rituales","Crecimiento","ASMR","Estrés","Spa","Familia"];
const OTHER_THEME_TAGS = ["Para la ansiedad","Energiza tus mañanas","Foco y concentración","Suelto la Rabia","Crecimiento personal","Armonía familiar","Respiración consciente","Meditaciones Activas","Astrología"];
const TEMA_TAGS = ["Yoga","Respiración","Ansiedad","Rituales","ASMR","Estrés","Spa","Familia","Insomnio"];
const SLEEP_DEFAULTS = ["Sonidos Binaurales","Sonidos Ancestrales","ASMR Expansivos"];

function EditDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: Submission;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();

  // ── Campos de texto / switches (sin cambios) ──
  const [title, setTitle] = useState(submission.title);
  const [subtitle, setSubtitle] = useState(submission.subtitle);
  const [duration, setDuration] = useState(String(submission.duration ?? ""));
  const [description, setDescription] = useState(submission.description ?? "");
  const [isPremium, setIsPremium] = useState(submission.isPremium);
  const [isFeatured, setIsFeatured] = useState(submission.isFeatured);
  const [isFeaturedCategory, setIsFeaturedCategory] = useState(submission.isFeaturedCategory);
  const [isNew, setIsNew] = useState(submission.isNew);
  const [skipDetail, setSkipDetail] = useState(submission.skipDetail ?? false);
  const [skipMiniPlayer, setSkipMiniPlayer] = useState(submission.skipMiniPlayer ?? false);
  const [voiceTag, setVoiceTag] = useState(submission.voiceTag ?? "__none__");
  const [ancestralTag, setAncestralTag] = useState(submission.ancestralTag ?? "");
  const [meditationTag, setMeditationTag] = useState(submission.meditationTag ?? "");
  const [soundTag, setSoundTag] = useState(submission.soundTag ?? "");
  const [sleepTag, setSleepTag] = useState(submission.sleepTag ?? "");
  const [themeTag, setThemeTag] = useState<string[]>(submission.themeTag ?? []);
  const [temaTag, setTemaTag] = useState<string[]>(submission.temaTag ?? []);
  const [playerDescription, setPlayerDescription] = useState(submission.playerDescription ?? "");

  // ── Portada ──
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageObjectPath, setNewImageObjectPath] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // ── Audio ──
  const [localAudioFiles, setLocalAudioFiles] = useState<CatalogAudioFile[]>(submission.audioFiles);
  const [busyAudioId, setBusyAudioId] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  // replaceRefs: map audioId → hidden <input type="file">
  const replaceRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // ── Hooks API ──
  const { mutateAsync: requestUrl } = useRequestUploadUrl();
  const { mutateAsync: addAudio } = useAddAdminSessionAudio();
  const { mutateAsync: deleteAudio } = useDeleteAdminSessionAudio();

  const doUpload = (file: File, label?: string) =>
    uploadFileShared(file, requestUrl, null, label);

  const mutation = useEditSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Cambios guardados.");
        qc.invalidateQueries();
        onOpenChange(false);
      },
      onError: () => toast.error("No se pudo editar."),
    },
  });

  const handleSkipDetail = (v: boolean) => {
    setSkipDetail(v);
    if (v) setSkipMiniPlayer(false);
  };
  const handleSkipMiniPlayer = (v: boolean) => {
    setSkipMiniPlayer(v);
    if (v) setSkipDetail(false);
  };

  const catId = submission.categoryId;
  const isAncestral   = catId === "sonidos-ancestrales";
  const isMeditation  = catId === "meditaciones-guiadas";
  const isMusic       = catId === "musica-sonidos";

  const toggleTheme = (tag: string) =>
    setThemeTag((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const toggleTema = (tag: string) =>
    setTemaTag((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  // ── Portada handlers ──
  const handleImageSelect = async (file: File) => {
    setImageError(null);
    setImageUploading(true);
    try {
      const result = await doUpload(file, "Subiendo imagen…");
      setNewImageFile(file);
      setNewImageObjectPath(result.objectPath);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Error al subir imagen");
    } finally {
      setImageUploading(false);
    }
  };

  // ── Audio handlers ──
  const handleAudioReplace = async (audioId: number, file: File) => {
    setAudioError(null);
    setBusyAudioId(audioId);
    try {
      const up = await doUpload(file, "Subiendo audio…");
      const result = await addAudio({
        id: submission.id,
        data: {
          objectPath: up.objectPath,
          name: file.name.replace(/\.[^.]+$/, ""),
          contentType: up.contentType,
          sizeBytes: up.sizeBytes,
          replaceAudioId: audioId,
        },
      });
      setLocalAudioFiles(result.audioFiles);
      toast.success("Audio reemplazado.");
      qc.invalidateQueries();
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Error al reemplazar el audio");
    } finally {
      setBusyAudioId(null);
    }
  };

  const handleAudioDelete = async (audioId: number) => {
    setAudioError(null);
    setBusyAudioId(audioId);
    try {
      const result = await deleteAudio({ id: submission.id, audioId });
      setLocalAudioFiles(result.audioFiles);
      toast.success("Audio eliminado.");
      qc.invalidateQueries();
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Error al eliminar el audio");
    } finally {
      setBusyAudioId(null);
    }
  };

  // ── Render ──
  const currentImageUrl = resolveImageUrl(submission.imageUrl);
  const previewImageSrc = newImageFile
    ? URL.createObjectURL(newImageFile)
    : currentImageUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar sesión</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-5 py-1">

            {/* Básicos */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Básicos</p>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subtitle">Subtítulo</Label>
                <Input id="edit-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duración (minutos)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={1}
                  max={600}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Ej: 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descripción de la sesión…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-player-description">Descripción reproductor</Label>
                <Textarea
                  id="edit-player-description"
                  value={playerDescription}
                  onChange={(e) => setPlayerDescription(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Texto que se muestra en el reproductor (opcional)…"
                />
              </div>
            </div>

            {/* Portada */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portada</p>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageSelect(f);
                  e.target.value = "";
                }}
              />
              {previewImageSrc && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary border border-border">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={previewImageSrc}
                      alt="portada"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {newImageFile ? newImageFile.name : "Imagen actual"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {newImageFile ? "Nueva imagen lista — se guardará al pulsar Guardar" : "Subí una nueva para reemplazarla"}
                    </p>
                  </div>
                </div>
              )}
              {imageError && (
                <p className="text-xs text-destructive">{imageError}</p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={imageUploading || mutation.isPending}
                onClick={() => imageInputRef.current?.click()}
              >
                {imageUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {imageUploading ? "Subiendo…" : "Cambiar imagen"}
              </Button>
            </div>

            {/* Audio */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audio</p>
              {audioError && (
                <p className="text-xs text-destructive">{audioError}</p>
              )}
              {localAudioFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin archivos de audio.</p>
              ) : (
                <div className="space-y-2">
                  {localAudioFiles.map((audio, idx) => (
                    <div
                      key={audio.id}
                      className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border"
                    >
                      {/* hidden file input for this slot */}
                      <input
                        ref={(el) => { replaceRefs.current[audio.id] = el; }}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAudioReplace(audio.id, f);
                          e.target.value = "";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{audio.name}</p>
                        <Badge variant="outline" className="text-xs mt-0.5">{audio.role}</Badge>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyAudioId !== null}
                          onClick={() => replaceRefs.current[audio.id]?.click()}
                        >
                          {busyAudioId === audio.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Reemplazar"
                          )}
                        </Button>
                        {idx > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={busyAudioId !== null}
                            onClick={() => handleAudioDelete(audio.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opciones */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opciones</p>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-premium">Premium</Label>
                <Switch id="edit-premium" checked={isPremium} onCheckedChange={setIsPremium} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-featured">Destacada en Inicio</Label>
                <Switch id="edit-featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-featured-category">Destacada en su categoría</Label>
                <Switch id="edit-featured-category" checked={isFeaturedCategory} onCheckedChange={setIsFeaturedCategory} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-new">Marcar como nueva</Label>
                <Switch id="edit-new" checked={isNew} onCheckedChange={setIsNew} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-skipDetail" className="cursor-pointer">
                  Pasar directo al reproductor
                </Label>
                <Switch id="edit-skipDetail" checked={skipDetail} onCheckedChange={handleSkipDetail} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-skipMiniPlayer" className="cursor-pointer">
                  Pasar directo al miniplayer
                </Label>
                <Switch id="edit-skipMiniPlayer" checked={skipMiniPlayer} onCheckedChange={handleSkipMiniPlayer} />
              </div>
            </div>

            {/* Subcategoría según categoría */}
            {isAncestral && (
              <SingleTagOptionSelector
                tagType="ancestral"
                defaults={ANCESTRAL_DEFAULTS}
                label="Subcategoría Ancestral"
                selected={ancestralTag}
                onSelect={setAncestralTag}
              />
            )}
            {isMeditation && (
              <>
                <SingleTagOptionSelector
                  tagType="meditation"
                  defaults={MEDITATION_DEFAULTS}
                  label="Subcategoría Meditación"
                  selected={meditationTag}
                  onSelect={setMeditationTag}
                />
                <div className="space-y-2">
                  <Label>Etiqueta de voz</Label>
                  <Select value={voiceTag} onValueChange={setVoiceTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin etiqueta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sin etiqueta</SelectItem>
                      <SelectItem value="Guiada">Guiada</SelectItem>
                      <SelectItem value="Sin voz">Sin voz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {isMusic && (
              <SingleTagOptionSelector
                tagType="sound"
                defaults={SOUND_DEFAULTS}
                label="Subcategoría Música/Sonidos"
                selected={soundTag}
                onSelect={setSoundTag}
              />
            )}

            {/* Etiquetas Nivel 1 */}
            <TagOptionSelector
              tagType="theme"
              defaults={THEME_TAGS}
              label="Etiquetas Nivel 1 (opcional)"
              selected={themeTag}
              onToggle={toggleTheme}
              pill
            />

            {/* Etiquetas Nivel 2 (Temas de "Explorar todo") */}
            <TagOptionSelector
              tagType="tema"
              defaults={TEMA_TAGS}
              label="Etiquetas Nivel 2 (opcional)"
              selected={temaTag}
              onToggle={toggleTema}
              pill
            />

            {/* Otras temáticas */}
            <TagOptionSelector
              tagType="other_theme"
              defaults={OTHER_THEME_TAGS}
              label="Otras temáticas (opcional)"
              selected={themeTag}
              onToggle={toggleTheme}
              pill
            />

            {/* Etiqueta de sueño (Grupo 2) */}
            <SingleTagOptionSelector
              tagType="sleep"
              defaults={SLEEP_DEFAULTS}
              label="Etiqueta de sueño (Grupo 2)"
              selected={sleepTag}
              onSelect={setSleepTag}
            />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={title.trim().length === 0 || subtitle.trim().length === 0 || mutation.isPending || imageUploading}
            onClick={() => {
              const dur = parseInt(duration, 10);
              mutation.mutate({
                id: submission.id,
                data: {
                  title: title.trim(),
                  subtitle: subtitle.trim(),
                  ...(duration && !isNaN(dur) ? { duration: dur } : {}),
                  ...(description.trim() ? { description: description.trim() } : {}),
                  isPremium,
                  isFeatured,
                  isFeaturedCategory,
                  isNew,
                  skipDetail,
                  skipMiniPlayer,
                  voiceTag: voiceTag === "__none__" ? null : (voiceTag as "Guiada" | "Sin voz"),
                  ...(isAncestral ? { ancestralTag: ancestralTag || null } : {}),
                  ...(isMeditation ? { meditationTag: meditationTag || null } : {}),
                  ...(isMusic ? { soundTag: soundTag || null } : {}),
                  sleepTag: sleepTag || null,
                  themeTag,
                  temaTag,
                  playerDescription: playerDescription.trim() ? playerDescription.trim() : null,
                  ...(newImageObjectPath && newImageFile
                    ? {
                        imageObjectPath: newImageObjectPath,
                        imageContentType: newImageFile.type,
                        imageSizeBytes: newImageFile.size,
                      }
                    : {}),
                },
              });
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmissionCard({ submission, isModerator }: { submission: Submission; isModerator?: boolean }) {
  const qc = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const badge = STATUS_BADGE[submission.status] ?? {
    label: submission.status,
    variant: "outline" as const,
  };

  const invalidate = () => qc.invalidateQueries();

  const approve = useApproveSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Envío aprobado y publicado.");
        invalidate();
      },
      onError: () => toast.error("No se pudo aprobar."),
    },
  });
  const hide = useHideSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Contenido ocultado.");
        invalidate();
      },
      onError: () => toast.error("No se pudo ocultar."),
    },
  });
  const unhide = useUnhideSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Contenido visible nuevamente.");
        invalidate();
      },
      onError: () => toast.error("No se pudo mostrar."),
    },
  });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const remove = useDeleteSubmission({
    mutation: {
      onSuccess: () => {
        toast.success("Sesión borrada definitivamente.");
        setDeleteOpen(false);
        invalidate();
      },
      onError: () => toast.error("No se pudo borrar."),
    },
  });

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{submission.title}</h3>
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {submission.isPremium && <Badge variant="outline">Premium</Badge>}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {submission.subtitle}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {submission.categoryLabel} · {submission.durationLabel}
              {submission.creator
                ? ` · por ${submission.creator.displayName}`
                : ""}
            </p>
            {submission.status === "rejected" && submission.rejectionReason && (
              <p className="text-xs text-destructive mt-1">
                Motivo: {submission.rejectionReason}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {submission.status === "pending" && (
              <>
                <Button
                  size="sm"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate({ id: submission.id })}
                >
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectOpen(true)}
                >
                  Rechazar
                </Button>
              </>
            )}
            {submission.status === "published" && (
              <Button
                size="sm"
                variant="outline"
                disabled={hide.isPending}
                onClick={() => hide.mutate({ id: submission.id })}
              >
                Ocultar
              </Button>
            )}
            {submission.status === "draft" && (
              <Button
                size="sm"
                disabled={unhide.isPending}
                onClick={() => unhide.mutate({ id: submission.id })}
              >
                Mostrar
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditOpen(true)}
            >
              Editar
            </Button>
            {!isModerator && (
              <Button
                size="sm"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => setDeleteOpen(true)}
              >
                Borrar
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar esta sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará definitivamente "{submission.title}" junto con sus
              audios asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={remove.isPending}
              onClick={(e) => {
                e.preventDefault();
                remove.mutate({ id: submission.id });
              }}
            >
              {remove.isPending ? "Borrando…" : "Borrar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectDialog
        submission={submission}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
      />
      <EditDialog
        key={String(editOpen)}
        submission={submission}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
}

// ─── Filtros ─────────────────────────────────────────────────────────────────

const FECHA_RANGES = ["Hoy", "Esta semana", "Este mes", "Últimos 3 meses"] as const;
type FechaRange = (typeof FECHA_RANGES)[number];

function getCreatedAfter(range: FechaRange): string {
  const now = new Date();
  switch (range) {
    case "Hoy": {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString();
    }
    case "Esta semana": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
    case "Este mes":
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case "Últimos 3 meses": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    }
  }
}

type ActiveFilters = {
  categoryId?: string;
  fechaRange?: FechaRange;
  themeTag?: string;
  otherTag?: string;
};

function FilterPill({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          className="h-8 gap-1 text-xs font-medium"
        >
          {label}
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function OptionItem({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left text-sm px-3 py-1.5 rounded-sm flex items-center gap-2 transition-colors ${
        selected
          ? "bg-primary text-primary-foreground font-medium"
          : "hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function FilterBar({
  filters,
  onChange,
}: {
  filters: ActiveFilters;
  onChange: (f: ActiveFilters) => void;
}) {
  const { data: opts } = useGetSubmissionFilterOptions();
  const hasFilters =
    !!filters.categoryId || !!filters.fechaRange || !!filters.themeTag || !!filters.otherTag;

  const set = (patch: Partial<ActiveFilters>) => onChange({ ...filters, ...patch });
  const clear = (key: keyof ActiveFilters) =>
    onChange({ ...filters, [key]: undefined });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Categoría */}
      <FilterPill label={filters.categoryId ? (opts?.categories.find(c => c.id === filters.categoryId)?.label ?? "Categoría") : "Categoría"} active={!!filters.categoryId}>
        <div className="py-1">
          {!!filters.categoryId && (
            <OptionItem selected={false} onSelect={() => clear("categoryId")}>
              <X className="w-3 h-3" /> Todas las categorías
            </OptionItem>
          )}
          {(opts?.categories ?? []).map((c) => (
            <OptionItem
              key={c.id}
              selected={filters.categoryId === c.id}
              onSelect={() => set({ categoryId: c.id })}
            >
              {c.label}
            </OptionItem>
          ))}
          {!opts && (
            <p className="text-xs text-muted-foreground px-3 py-2">Cargando…</p>
          )}
        </div>
      </FilterPill>

      {/* Fecha */}
      <FilterPill label={filters.fechaRange ?? "Fecha"} active={!!filters.fechaRange}>
        <div className="py-1">
          {!!filters.fechaRange && (
            <OptionItem selected={false} onSelect={() => clear("fechaRange")}>
              <X className="w-3 h-3" /> Todo el tiempo
            </OptionItem>
          )}
          {FECHA_RANGES.map((r) => (
            <OptionItem
              key={r}
              selected={filters.fechaRange === r}
              onSelect={() => set({ fechaRange: r })}
            >
              {r}
            </OptionItem>
          ))}
        </div>
      </FilterPill>

      {/* Temática (nivel 1) */}
      <FilterPill label={filters.themeTag ?? "Temática"} active={!!filters.themeTag}>
        <div className="py-1 max-h-60 overflow-y-auto">
          {!!filters.themeTag && (
            <OptionItem selected={false} onSelect={() => clear("themeTag")}>
              <X className="w-3 h-3" /> Todas las temáticas
            </OptionItem>
          )}
          {(opts?.themeTags ?? []).map((t) => (
            <OptionItem
              key={t}
              selected={filters.themeTag === t}
              onSelect={() => set({ themeTag: t })}
            >
              {t}
            </OptionItem>
          ))}
          {opts && opts.themeTags.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">Sin etiquetas.</p>
          )}
          {!opts && (
            <p className="text-xs text-muted-foreground px-3 py-2">Cargando…</p>
          )}
        </div>
      </FilterPill>

      {/* Otras etiquetas */}
      <FilterPill label={filters.otherTag ?? "Otras etiquetas"} active={!!filters.otherTag}>
        <div className="py-1 max-h-60 overflow-y-auto">
          {!!filters.otherTag && (
            <OptionItem selected={false} onSelect={() => clear("otherTag")}>
              <X className="w-3 h-3" /> Todas las etiquetas
            </OptionItem>
          )}
          {(opts?.otherTags ?? []).map((t) => (
            <OptionItem
              key={t}
              selected={filters.otherTag === t}
              onSelect={() => set({ otherTag: t })}
            >
              {t}
            </OptionItem>
          ))}
          {opts && opts.otherTags.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">Sin etiquetas.</p>
          )}
          {!opts && (
            <p className="text-xs text-muted-foreground px-3 py-2">Cargando…</p>
          )}
        </div>
      </FilterPill>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => onChange({})}
        >
          <X className="w-3 h-3 mr-1" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

function SubmissionList({ status, filters = {}, isModerator }: { status: GetPendingSubmissionsStatus; filters?: ActiveFilters; isModerator?: boolean }) {
  const params: GetPendingSubmissionsParams = {
    status,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.fechaRange ? { createdAfter: getCreatedAfter(filters.fechaRange) } : {}),
    ...(filters.themeTag ? { themeTag: filters.themeTag } : {}),
    ...(filters.otherTag ? { otherTag: filters.otherTag } : {}),
  };

  const { data, isLoading, error } = useGetPendingSubmissions(params);

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-destructive py-8 text-center">
        No se pudo cargar la cola.
      </p>
    );
  }
  if (!data || data.submissions.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        No hay contenido en este estado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.submissions.map((s) => (
        <SubmissionCard key={s.id} submission={s} isModerator={isModerator} />
      ))}
    </div>
  );
}

export default function ModeracionPage({ isModerator }: { isModerator?: boolean } = {}) {
  const [tab, setTab] = useState<GetPendingSubmissionsStatus>("pending");
  const [filters, setFilters] = useState<ActiveFilters>({});

  const handleTabChange = (v: string) => {
    setTab(v as GetPendingSubmissionsStatus);
    setFilters({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Moderación</h1>
        <p className="text-muted-foreground">
          Revisa, aprueba, edita y oculta el contenido enviado por creadores.
        </p>
      </div>

      <DestacadaDeHoy />

      <Tabs value={tab} onValueChange={handleTabChange}>
        <div className="flex flex-wrap items-center gap-3">
          <TabsList className="shrink-0">
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <FilterBar filters={filters} onChange={setFilters} />
        </div>

        {STATUS_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {tab === t.value && <SubmissionList status={t.value} filters={filters} isModerator={isModerator} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
